/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useState, useEffect, useCallback } from 'react';
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
} from '@ionic/react';
import { makeStyles, createStyles, Container, Typography } from '@material-ui/core';
import * as btcLock from '../../helpers/lockdrop/BitcoinLockdrop';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DropdownOption } from '../DropdownOption';
import { btcDustyDurations, btcDurations } from '../../data/lockInfo';
import { Message } from 'bitcore-lib';
import QrEncodedAddress from './QrEncodedAddress';
import CopyMessageBox from '../CopyMessageBox';
import * as bitcoinjs from 'bitcoinjs-lib';
import { OptionItem, Lockdrop, LockdropType } from 'src/types/LockdropModels';
import SectionCard from '../SectionCard';
import ClaimStatus from '../ClaimStatus';
import * as plasmUtils from '../../helpers/plasmUtils';
import { ApiPromise } from '@polkadot/api';
import { BlockStreamApi } from 'src/types/BlockStreamTypes';
interface Props {
    networkType: bitcoinjs.Network;
    plasmApi: ApiPromise;
}

const useStyles = makeStyles(() =>
    createStyles({
        button: {
            textAlign: 'center',
        },
    }),
);

toast.configure({
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
});

/**
 * Obtains lockdrop participant's public key by receiving raw signatures and BTC address
 * @param networkType Bitcoin network to use
 */
const BtcRawSignature: React.FC<Props> = ({ networkType, plasmApi }) => {
    const classes = useStyles();
    // switch lock duration depending on the chain network
    const networkLockDur = networkType === bitcoinjs.networks.bitcoin ? btcDurations : btcDustyDurations;

    const [addressInput, setAddress] = useState('');
    const [sigInput, setSig] = useState('');
    const [lockDuration, setDuration] = useState<OptionItem>({ label: '', value: 0, rate: 0 });
    const [p2shAddress, setP2sh] = useState('');
    const [publicKey, setPublicKey] = useState('');
    const [allLockParams, setAllLockParams] = useState<Lockdrop[]>([]);
    const [currentScriptLocks, setCurrentScriptLocks] = useState<BlockStreamApi.Transaction[]>([]);

    // current lock unlock signature data set
    // everything below here are used for raw unlock signature
    const [lockUtxo, setLockUtxo] = useState<BlockStreamApi.Transaction>();
    const [unlockTxBuilder, setUnlockTxBuilder] = useState<bitcoinjs.Transaction>();
    const [userUnlockSig, setUserUnlockSig] = useState('');
    const [sigHash, setSigHash] = useState('');
    const [unlockUtxoHex, setUnlockUtxoHex] = useState('');
    const [showModal, setShowModal] = useState(false);

    const onSubmit = () => {
        try {
            if (btcLock.getNetworkFromAddress(addressInput) !== networkType)
                throw new Error('Please use a valid Bitcoin network address');

            if (!lockDuration || !sigInput || !addressInput) throw new Error('Please fill in all the inputs');

            if (new Message(btcLock.MESSAGE).verify(addressInput, sigInput)) {
                const pub = btcLock.getPublicKey(addressInput, sigInput, 'compressed');
                setPublicKey(pub);

                const p2sh = btcLock.getLockP2SH(lockDuration.value, pub, networkType);

                if (typeof p2sh.address === 'string') {
                    setP2sh(p2sh.address);
                } else {
                    throw new Error('Cannot create P2SH address!');
                }
                toast.success('Successfully created lock script');
            } else {
                throw new Error('Cannot verify signature!');
            }
        } catch (e) {
            console.log(e);
            toast.error(e.message);
        }
    };

    const unlockScriptTx = (lock: BlockStreamApi.Transaction) => {
        try {
            console.log(lock);

            const lockVout = lock.vout.find(locked => locked.scriptpubkey_address === p2shAddress)!;
            const lockScript = btcLock.btcLockScript(
                publicKey,
                btcLock.daysToBlockSequence(lockDuration.value),
                networkType,
            );

            const RELAY_FEE = 200;
            const sequence = 0;
            const output = bitcoinjs.address.toOutputScript(addressInput, networkType);

            const tx = new bitcoinjs.Transaction();
            tx.version = 2;
            tx.addInput(Buffer.from(lock.txid, 'hex').reverse(), 0, sequence);
            tx.addOutput(output, lockVout.value - RELAY_FEE);

            const hashType = bitcoinjs.Transaction.SIGHASH_ALL;
            const signatureHash = tx.hashForSignature(0, lockScript, hashType);

            // TODO: user output
            console.log('hash: ' + signatureHash!.toString('hex'));
            setSigHash(signatureHash!.toString('hex'));
            setLockUtxo(lock);
            setShowModal(true);
            setUnlockTxBuilder(tx);
        } catch (e) {
            toast.error(e.message);
            console.log(e);
        }
    };

    const getUnlockUtxo = () => {
        if (unlockTxBuilder) {
            try {
                const lockScript = btcLock.btcLockScript(
                    publicKey,
                    btcLock.daysToBlockSequence(lockDuration.value),
                    networkType,
                );

                // TODO: user input
                const rawSignature = Buffer.from(userUnlockSig, 'hex');

                const signature = bitcoinjs.script.signature.encode(rawSignature, bitcoinjs.Transaction.SIGHASH_ALL);
                const redeemScriptSig = bitcoinjs.payments.p2sh({
                    network: networkType,
                    redeem: {
                        network: networkType,
                        output: lockScript,
                        input: bitcoinjs.script.compile([signature]),
                    },
                }).input;
                unlockTxBuilder.setInputScript(0, redeemScriptSig!);

                const signedUnlockUtxo = unlockTxBuilder.toHex();

                console.log(signedUnlockUtxo);

                setUnlockUtxoHex(signedUnlockUtxo);
            } catch (e) {
                toast.error(e.message);
                console.log(e);
            }
        }
    };

    const getLockBal = useCallback(
        (lock: BlockStreamApi.Transaction) => {
            const _lockVout = lock.vout.find(locked => locked.scriptpubkey_address === p2shAddress);
            if (_lockVout) return btcLock.satoshiToBitcoin(_lockVout.value.toFixed()).toFixed();
            else return '0';
        },
        [lockUtxo],
    );

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
            console.log('fetching data from block stream');
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
        if (publicKey) {
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
                <QrEncodedAddress address={p2shAddress} lockData={currentScriptLocks} onUnlock={unlockScriptTx} />
            )}

            <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Unlock BTC Transaction</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={() => setShowModal(false)}>Close</IonButton>
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
                        {lockUtxo && sigHash && (
                            <>
                                <IonLabel>
                                    <p>Lock ID: {lockUtxo.txid}</p>
                                    <p>Lock Value: {getLockBal(lockUtxo)} BTC</p>
                                </IonLabel>
                                {unlockUtxoHex ? (
                                    <CopyMessageBox header="signed unlock transaction" message={unlockUtxoHex} isCode />
                                ) : (
                                    <>
                                        <CopyMessageBox header="unsigned" message={sigHash} isCode />
                                        <IonLabel position="stacked">Paste your signature here</IonLabel>
                                        <IonItem>
                                            <IonTextarea
                                                placeholder="f816733330690bdce1..."
                                                value={userUnlockSig}
                                                onIonChange={e => setUserUnlockSig(e.detail.value!)}
                                            ></IonTextarea>
                                        </IonItem>
                                    </>
                                )}

                                <IonButton disabled={!!unlockUtxoHex} onClick={() => getUnlockUtxo()}>
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
                        Please sign the following message with your tool of choice and copy and paste the following
                        input. The provided address will be the one that will receive the tokens once it has been
                        unlocked.
                    </IonCardSubtitle>
                    <IonCardTitle>Sign Message</IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                    <CopyMessageBox header="message" message={btcLock.MESSAGE} />
                    <IonLabel position="stacked">Bitcoin Address</IonLabel>
                    <IonItem>
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
            <SectionCard maxWidth="lg">
                <Typography variant="h4" component="h1" align="center">
                    Real-time Lockdrop Status
                </Typography>
                {publicKey ? (
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
            </SectionCard>
        </div>
    );
};

export default BtcRawSignature;
