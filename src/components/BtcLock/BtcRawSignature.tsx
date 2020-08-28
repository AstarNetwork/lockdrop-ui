/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCardContent,
    IonInput,
    IonItem,
    IonLabel,
    IonTextarea,
    IonButton,
    IonChip,
    IonModal,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonTitle,
    IonText,
    IonLoading,
} from '@ionic/react';
import { makeStyles, createStyles } from '@material-ui/core';
import * as btcLock from '../../helpers/lockdrop/BitcoinLockdrop';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DropdownOption } from '../DropdownOption';
import { btcDustyDurations, btcDurations } from '../../data/lockInfo';
import QrEncodedAddress from './QrEncodedAddress';
import CopyMessageBox from '../CopyMessageBox';
import * as bitcoinjs from 'bitcoinjs-lib';
import { OptionItem, Lockdrop, LockdropType } from 'src/types/LockdropModels';
import * as plasmUtils from '../../helpers/plasmUtils';
import { BlockStreamApi } from 'src/types/BlockStreamTypes';
import * as polkadotCrypto from '@polkadot/util-crypto';
import * as bitcoinjsMessage from 'bitcoinjs-message';

interface Props {
    networkType: bitcoinjs.Network;
    //plasmApi: ApiPromise;
}

const useStyles = makeStyles(() =>
    createStyles({
        button: {
            textAlign: 'center',
        },
    }),
);

/**
 * Obtains lockdrop participant's public key by receiving raw signatures and BTC address
 * @param networkType Bitcoin network to use
 */
const BtcRawSignature: React.FC<Props> = ({ networkType }) => {
    const classes = useStyles();
    // switch lock duration depending on the chain network
    const networkLockDur = networkType === bitcoinjs.networks.bitcoin ? btcDurations : btcDustyDurations;

    const [sigInput, setSig] = useState('');
    const [addressInput, setAddress] = useState('');

    const [lockDuration, setDuration] = useState<OptionItem>({ label: '', value: 0, rate: 0 });
    const [p2shAddress, setP2sh] = useState('');
    const [publicKey, setPublicKey] = useState('');
    const [allLockParams, setAllLockParams] = useState<Lockdrop[]>([]);
    const [currentScriptLocks, setCurrentScriptLocks] = useState<BlockStreamApi.Transaction[]>([]);
    const [isLoading, setLoading] = useState<{ loadState: boolean; message: string }>({
        loadState: false,
        message: '',
    });

    // current lock unlock signature data set
    // everything below here are used for raw unlock signature
    const [lockUtxo, setLockUtxo] = useState<BlockStreamApi.Transaction>();
    const [unlockTxBuilder, setUnlockTxBuilder] = useState<bitcoinjs.Transaction>();
    const [userUnlockSig, setUserUnlockSig] = useState('');
    const [unlockUtxoHex, setUnlockUtxoHex] = useState('');
    const [showModal, setShowModal] = useState(false);
    // in satoshi
    const [unlockFee, setUnlockFee] = useState('0');

    // signature nonce used for security
    const sigNonce = useMemo(() => {
        return polkadotCrypto.randomAsHex(2);
    }, []);

    const isValidFee = useCallback(
        (fee: string, lockTx: BlockStreamApi.Transaction) => {
            // checks if the given string is a valid integer
            function checkInt(val: string) {
                const checkString = new RegExp(/^(0|[1-9][0-9]*)$/);
                return checkString.test(val);
            }

            if (typeof lockTx !== 'undefined' && !isNaN(parseInt(fee)) && checkInt(fee)) {
                const lockP2sh = btcLock.getLockP2SH(lockDuration.value, publicKey, networkType);
                const _fee = parseInt(fee);
                const lockVout = lockTx.vout.find(locked => locked.scriptpubkey_address === lockP2sh.address!);
                if (typeof lockVout === 'undefined') {
                    return false;
                }
                return lockVout.value - _fee > 0 && _fee !== 0;
            } else {
                return false;
            }
        },
        [publicKey, lockDuration.value, networkType],
    );

    const sigHash = useMemo(() => {
        try {
            if (typeof lockUtxo !== 'undefined' && !isNaN(parseInt(unlockFee)) && isValidFee(unlockFee, lockUtxo)) {
                const _fee = parseInt(unlockFee);
                const unsigned = btcLock.unsignedUnlockTx(lockUtxo, publicKey, lockDuration.value, networkType, _fee);
                setShowModal(true);
                setUnlockTxBuilder(unsigned.unsignedUnlockTx);
                return unsigned.signatureHash;
            }
        } catch (err) {
            console.log(err);
            toast.error(err.message);
        }
        return 'N/A';
    }, [unlockFee, publicKey, lockDuration.value, networkType, lockUtxo, isValidFee]);

    const onSubmit = () => {
        try {
            if (!lockDuration || !addressInput || !sigInput) throw new Error('Please fill in all the inputs');

            if (!btcLock.validateBtcAddress(addressInput, networkType))
                throw new Error('Please use a valid Bitcoin address');
            const _msg = btcLock.MESSAGE + sigNonce;

            if (bitcoinjsMessage.verify(_msg, addressInput, sigInput)) {
                const pub = btcLock.getPublicKey(addressInput, sigInput, _msg, networkType);
                console.log({ _msg, addressInput, sigInput, pub });
                setPublicKey(pub);

                const p2sh = btcLock.getLockP2SH(lockDuration.value, pub, networkType);

                if (typeof p2sh.address === 'string') {
                    setP2sh(p2sh.address);
                } else {
                    throw new Error('Cannot create P2SH address');
                }
                toast.success('Successfully created lock script');
            } else {
                throw new Error('Invalid signature');
            }
        } catch (e) {
            console.log(e);
            toast.error(e.message);
        }
    };

    // show unsigned transaction hahs
    const unlockScriptTx = (lock: BlockStreamApi.Transaction) => {
        // set default transaction fee
        setUnlockFee((lock.fee * 0.1).toString());
        setLockUtxo(lock);
    };

    // use the obtained transaction signature to create full signed transaction in hex
    // this function will broad cast the transaction as well
    const getUnlockUtxo = async () => {
        if (unlockTxBuilder) {
            try {
                if (userUnlockSig === '') {
                    throw new Error('Please paste the unlock signature');
                }
                setLoading({ loadState: true, message: 'broadcasting unlock transaction...' });
                const lockScript = btcLock.btcLockScript(
                    publicKey,
                    btcLock.daysToBlockSequence(lockDuration.value),
                    networkType,
                );

                const signedUnlockUtxo = btcLock.signTransactionRaw(
                    unlockTxBuilder,
                    userUnlockSig,
                    lockScript,
                    networkType,
                );

                console.log('Signed unlock UTXO hex:\n' + signedUnlockUtxo);

                setUnlockUtxoHex(signedUnlockUtxo);

                const _net = networkType === bitcoinjs.networks.bitcoin ? 'mainnet' : 'testnet';
                const unlockTxId = await btcLock.broadcastTransaction(signedUnlockUtxo, _net);
                console.log('Broadcasted: ' + unlockTxId);
                toast.success('Successfully broadcasted ' + unlockTxId);
            } catch (e) {
                toast.error(e.message);
                console.log(e);
            } finally {
                setLoading({ loadState: false, message: '' });
            }
        }
    };

    // clean all unlock UTXO signature state when closing the modal
    const cleanUnlockTxState = () => {
        setLockUtxo(undefined);
        setUnlockTxBuilder(undefined);
        setUserUnlockSig('');
        setUnlockFee('0');
        setUnlockUtxoHex('');
        setShowModal(false);
    };

    const getLockBal = useCallback(() => {
        if (lockUtxo) {
            const _lockVout = lockUtxo.vout.find(locked => locked.scriptpubkey_address === p2shAddress);
            if (_lockVout) return btcLock.satoshiToBitcoin(_lockVout.value.toFixed()).toFixed();
        }
        return '0';
    }, [lockUtxo, p2shAddress]);

    const fetchLockdropParams = useCallback(async () => {
        const blockStreamNet = networkType === bitcoinjs.networks.bitcoin ? 'mainnet' : 'testnet';
        // initialize lockdrop data array
        const _lockParams: Lockdrop[] = [];

        // get all the possible lock addresses
        networkLockDur.map(async (dur, index) => {
            const scriptAddr = btcLock.getLockP2SH(dur.value, publicKey, networkType).address!;
            // make a real-time lockdrop data structure with the current P2SH and duration
            //const lock = await btcLock.getLockParameter(scriptAddr, dur.value, publicKey, blockStreamNet);

            const locks = await btcLock.getBtcTxsFromAddress(scriptAddr, blockStreamNet);
            const daysToEpoch = 60 * 60 * 24 * dur.value;

            const lockParams = locks.map(i => {
                const lockVal = i.vout.find(locked => locked.scriptpubkey_address === scriptAddr);

                if (lockVal) {
                    return plasmUtils.createLockParam(
                        LockdropType.Bitcoin,
                        '0x' + i.txid,
                        '0x' + publicKey,
                        daysToEpoch.toString(),
                        lockVal.value.toString(),
                    );
                } else {
                    throw new Error('Could not find the lock value from the UTXO');
                }
            });

            // if the lock data is the one that the user is viewing
            if (p2shAddress === scriptAddr && dur.value === lockDuration.value) {
                setCurrentScriptLocks(locks);
            }

            // loop through all the token locks within the given script
            // this is to prevent nested array
            lockParams.forEach(e => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const currentParam = plasmUtils.structToLockdrop(e as any);

                _lockParams.push(currentParam);
            });

            // set lockdrop param data if we're in the final loop
            // we do this because we want to set the values inside the then block
            if (_lockParams.length > allLockParams.length && index === networkLockDur.length - 1) {
                setAllLockParams(_lockParams);
            }
        });
    }, [publicKey, networkType, p2shAddress, networkLockDur, allLockParams, lockDuration.value]);

    useEffect(() => {
        // change P2SH if the user changed the lock duration
        if (publicKey && lockDuration.value !== 0) {
            const lockScript = btcLock.getLockP2SH(lockDuration.value, publicKey, networkType);
            setP2sh(lockScript.address!);
            fetchLockdropParams().catch(e => {
                toast.error(e);
            });
        }
    }, [fetchLockdropParams, lockDuration.value, networkType, publicKey]);

    // fetch lock data in the background
    useEffect(() => {
        const interval = setInterval(async () => {
            publicKey &&
                fetchLockdropParams().catch(e => {
                    toast.error(e);
                });
        }, 5 * 1000);

        // cleanup hook
        return () => {
            clearInterval(interval);
        };
    });

    return (
        <div>
            {p2shAddress && (
                <QrEncodedAddress
                    address={p2shAddress}
                    lockData={currentScriptLocks}
                    onUnlock={unlockScriptTx}
                    lockDurationDay={lockDuration.value}
                />
            )}

            <IonLoading isOpen={isLoading.loadState} message={isLoading.message} />
            <IonModal isOpen={showModal} onDidDismiss={() => cleanUnlockTxState()}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Unlock BTC Transaction</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={() => cleanUnlockTxState()}>Close</IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonCard>
                    <IonCardHeader>
                        <IonCardSubtitle>
                            Provide the signature for your unlock script. This will unlock your tokens
                        </IonCardSubtitle>
                        <IonCardTitle>Unlock UTXO</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                        {lockUtxo && (
                            <>
                                <IonLabel>
                                    <p>Lock ID: {lockUtxo.txid}</p>
                                    <p>Lock Value: {getLockBal()} BTC</p>
                                </IonLabel>
                                {unlockUtxoHex ? (
                                    <CopyMessageBox header="signed unlock transaction" message={unlockUtxoHex} isCode />
                                ) : (
                                    <>
                                        <CopyMessageBox header="unsigned" message={sigHash} isCode />
                                        <IonItem>
                                            <IonLabel position="stacked">
                                                Paste your signature here<IonText color="danger">*</IonText>
                                            </IonLabel>
                                            <IonTextarea
                                                placeholder="f816733330690bdce1..."
                                                value={userUnlockSig}
                                                onIonChange={e => setUserUnlockSig(e.detail.value!)}
                                            ></IonTextarea>
                                        </IonItem>
                                        <IonItem>
                                            <IonLabel position="floating">Transaction fee</IonLabel>
                                            <IonInput
                                                placeholder={lockUtxo.fee.toString() + '  Satoshi'}
                                                onIonInput={e => {
                                                    const _inputFee = (e.target as HTMLInputElement).value;
                                                    setUnlockFee(_inputFee);
                                                }}
                                                color={isValidFee(unlockFee, lockUtxo) ? 'primary' : 'danger'}
                                            ></IonInput>
                                        </IonItem>
                                    </>
                                )}

                                <IonButton
                                    disabled={!!unlockUtxoHex || !isValidFee(unlockFee, lockUtxo)}
                                    onClick={() => getUnlockUtxo()}
                                >
                                    Generate unlock UTXO
                                </IonButton>
                            </>
                        )}
                    </IonCardContent>
                </IonCard>
            </IonModal>

            <IonCard>
                <IonCardHeader>
                    <IonCardSubtitle>
                        Please provide the public key or address and signature of the BTC address you wish to use for
                        the BTC lockdrop
                    </IonCardSubtitle>
                    <IonCardTitle>Get Public Key</IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                    <CopyMessageBox header="message" message={btcLock.MESSAGE + sigNonce} />
                    <IonItem>
                        <IonLabel position="stacked">Bitcoin Address</IonLabel>
                        <IonInput
                            value={addressInput}
                            placeholder="Enter BTC Address"
                            onIonChange={e => setAddress(e.detail.value!)}
                        ></IonInput>
                    </IonItem>

                    <IonItem>
                        <IonTextarea
                            placeholder="Paste your base64 message signature here..."
                            value={sigInput}
                            onIonChange={e => setSig(e.detail.value!)}
                        ></IonTextarea>
                    </IonItem>
                    <IonLabel position="stacked">Lock Duration</IonLabel>
                    <IonItem>
                        <DropdownOption
                            dataSets={btcDustyDurations}
                            onChoose={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setDuration(
                                    btcDustyDurations.filter(
                                        i => i.value === ((e.target.value as unknown) as number),
                                    )[0],
                                )
                            }
                        ></DropdownOption>
                        <IonChip>
                            <IonLabel>
                                {lockDuration.value
                                    ? 'The rate is ' + lockDuration.rate + 'x'
                                    : 'Please choose the duration'}
                            </IonLabel>
                        </IonChip>
                    </IonItem>
                    <div className={classes.button}>
                        <IonButton onClick={onSubmit} disabled={!!publicKey}>
                            Generate Lock Script
                        </IonButton>
                    </div>
                </IonCardContent>
            </IonCard>
            {/* <SectionCard maxWidth="lg">
                <Typography variant="h4" component="h1" align="center">
                    Real-time Lockdrop Status
                </Typography>
                {publicKey && lockDuration.value !== 0 ? (
                    <ClaimStatus
                        claimParams={allLockParams}
                        plasmApi={plasmApi}
                        networkType="BTC"
                        plasmNetwork="Dusty"
                        publicKey={publicKey}
                    />
                ) : (
                    <>
                        <Container>
                            <Typography variant="h5" component="h2" align="center">
                                Provide signature to view
                            </Typography>
                        </Container>
                    </>
                )}
            </SectionCard> */}
        </div>
    );
};

export default BtcRawSignature;
