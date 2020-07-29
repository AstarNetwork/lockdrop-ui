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
        //todo: implement this to form a unlock transaction
        console.log(lock);
    };

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
                const lockVal = i.vout.filter(locked => locked.scriptpubkey_address === scriptAddr)[0].value;

                return plasmUtils.createLockParam(
                    LockdropType.Bitcoin,
                    '0x' + i.txid,
                    '0x' + publicKey,
                    daysToEpoch.toString(),
                    lockVal.toString(),
                );
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
            fetchLockdropParams();
        }
    }, [fetchLockdropParams, lockDuration.value, networkType, publicKey]);

    // fetch lock data in the background
    useEffect(() => {
        const interval = setInterval(async () => {
            if (publicKey) {
                fetchLockdropParams();
            }
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
