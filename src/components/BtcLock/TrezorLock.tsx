/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useState, useEffect, useCallback } from 'react';
import TrezorConnect from 'trezor-connect';
import {
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCardContent,
    IonInput,
    IonItem,
    IonLabel,
    IonButton,
    IonChip,
    IonLoading,
} from '@ionic/react';
import { DropdownOption } from '../DropdownOption';
import { btcDustyDurations, btcDurations } from '../../data/lockInfo';
import * as btcLock from '../../helpers/lockdrop/BitcoinLockdrop';
import { toast } from 'react-toastify';
//import BigNumber from 'bignumber.js';
import { makeStyles, createStyles, Typography, Container } from '@material-ui/core';
import QrEncodedAddress from './QrEncodedAddress';
import * as bitcoinjs from 'bitcoinjs-lib';
import { OptionItem, Lockdrop } from 'src/types/LockdropModels';
import SectionCard from '../SectionCard';
import ClaimStatus from '../ClaimStatus';
import { ApiPromise } from '@polkadot/api';
import * as plasmUtils from '../../helpers/plasmUtils';

interface Props {
    networkType: bitcoinjs.Network;
    plasmApi: ApiPromise;
}

toast.configure({
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
});

const useStyles = makeStyles(() =>
    createStyles({
        button: {
            textAlign: 'center',
        },
    }),
);

const TrezorLock: React.FC<Props> = ({ networkType, plasmApi }) => {
    const classes = useStyles();

    const defaultPath = networkType === bitcoinjs.networks.bitcoin ? "m/44'/0'/0'" : "m/44'/1'/0'";
    // switch lock duration depending on the chain network
    const networkLockDur = networkType === bitcoinjs.networks.bitcoin ? btcDurations : btcDustyDurations;

    const [lockDuration, setDuration] = useState<OptionItem>({ label: '', value: 0, rate: 0 });
    const [p2shAddress, setP2sh] = useState('');
    const [allLockParams, setAllLockParams] = useState<Lockdrop[]>([]);
    const [currentScriptLocks, setCurrentScriptLocks] = useState<Lockdrop[]>([]);

    // changing the path to n/49'/x'/x' will return a signature error
    // this may be due to compatibility issues with BIP49
    const [addressPath, setAddressPath] = useState(defaultPath);
    const [isLoading, setLoading] = useState<{ loadState: boolean; message: string }>({
        loadState: false,
        message: '',
    });
    const [publicKey, setPublicKey] = useState('');

    const inputValidation = () => {
        if (lockDuration.value <= 0) {
            return { valid: false, message: 'Please provide a lock duration' };
        }

        return { valid: true, message: 'valid input' };
    };

    const signLockdropClaims = () => {
        const _msg = 'sign to display real-time lockdrop status';
        setLoading({ loadState: true, message: 'Waiting for Trezor' });

        if (!publicKey) {
            // we have initiated the Trezor instance before this component mounted
            TrezorConnect.signMessage({
                path: addressPath,
                message: _msg,
                coin: networkType === bitcoinjs.networks.bitcoin ? 'BTC' : 'Testnet',
            })
                .then(res => {
                    // we use a try-catch block because Trezor promise won't fail
                    try {
                        if (res.success) {
                            const _pubKey = btcLock.getPublicKey(
                                res.payload.address,
                                res.payload.signature,
                                'compressed',
                                _msg,
                            );
                            setPublicKey(_pubKey);
                        } else {
                            throw new Error(res.payload.error);
                        }
                    } catch (e) {
                        toast.error(e.toString());
                        console.log(e);
                    }
                })
                .finally(() => {
                    setLoading({
                        loadState: false,
                        message: '',
                    });
                });
        }
    };

    const createLockAddress = () => {
        setLoading({ loadState: true, message: 'Waiting for Trezor' });

        if (!inputValidation().valid) {
            toast.error(inputValidation().message);
            setLoading({
                loadState: false,
                message: '',
            });
            return;
        }

        TrezorConnect.signMessage({
            path: addressPath,
            message: btcLock.MESSAGE,
            coin: networkType === bitcoinjs.networks.bitcoin ? 'BTC' : 'Testnet',
        })
            .then(res => {
                try {
                    if (res.success) {
                        console.log(res.payload);

                        const _pubKey = btcLock.getPublicKey(res.payload.address, res.payload.signature, 'compressed');
                        setPublicKey(_pubKey);

                        const lockScript = btcLock.getLockP2SH(lockDuration.value, _pubKey, networkType);

                        setP2sh(lockScript.address!);
                    } else {
                        throw new Error(res.payload.error);
                    }
                    setLoading({
                        loadState: false,
                        message: '',
                    });
                    toast.success('Successfully created lock script');
                } catch (e) {
                    toast.error(e.toString());
                    console.log(e);
                }
            })
            .finally(() => {
                setLoading({
                    loadState: false,
                    message: '',
                });
            });
    };

    const fetchLockdropParams = useCallback(async () => {
        // fetch user lock param data
        if (publicKey) {
            const blockStreamNet = networkType === bitcoinjs.networks.bitcoin ? 'mainnet' : 'testnet';
            // initialize lockdrop data array
            const _lockParams: Lockdrop[] = [];

            // get all the possible lock addresses
            networkLockDur.forEach(async (dur, index) => {
                const _p2shAddr = btcLock.getLockP2SH(dur.value, publicKey, networkType).address!;

                // make a real-time lockdrop data structure with the current P2SH and duration
                const lock = await btcLock.getLockParameter(_p2shAddr, dur.value, publicKey, blockStreamNet);

                // loop through all the token locks within the given script
                // this is to prevent nested array
                lock.forEach(e => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const currentParam = plasmUtils.structToLockdrop(e as any);
                    _lockParams.push(currentParam);
                    if (p2shAddress === _p2shAddr && dur.value === lockDuration.value) {
                        const hasLock =
                            currentScriptLocks.find(
                                item => item.transactionHash.toHex() === currentParam.transactionHash.toHex(),
                            ) === undefined;
                        if (hasLock) {
                            currentScriptLocks.push(currentParam);
                        }
                    } else if (currentScriptLocks.length > 0 && currentScriptLocks.length !== 0) {
                        setCurrentScriptLocks([]);
                    }
                });
                // set lockdrop param data if we're in the final loop
                // we do this because we want to set the values inside the then block
                if (_lockParams.length > allLockParams.length && index === networkLockDur.length - 1) {
                    setAllLockParams(_lockParams);
                }
            });
        }
    }, [publicKey, networkType, p2shAddress, networkLockDur, allLockParams, currentScriptLocks, lockDuration.value]);

    useEffect(() => {
        // change P2SH if the user changed the lock duration
        if (publicKey && p2shAddress) {
            const lockScript = btcLock.getLockP2SH(lockDuration.value, publicKey, networkType);
            setP2sh(lockScript.address!);
        }
        publicKey && fetchLockdropParams();
    }, [fetchLockdropParams, lockDuration.value, networkType, publicKey, p2shAddress]);

    return (
        <div>
            {p2shAddress ? <QrEncodedAddress address={p2shAddress} lockData={currentScriptLocks} /> : null}
            <IonLoading isOpen={isLoading.loadState} message={isLoading.message} />
            <IonCard>
                <IonCardHeader>
                    <IonCardSubtitle>
                        Please fill in the following form with the correct information. Your address path will default
                        to <code>{defaultPath}</code> if none is given. For more information, please check{' '}
                        <a href="https://wiki.trezor.io/Address_path_(BIP32)" rel="noopener noreferrer" target="_blank">
                            this page
                        </a>
                        . Regarding the audit by Quantstamp, click{' '}
                        <a
                            color="inherit"
                            href="https://github.com/staketechnologies/lockdrop-ui/blob/16a2d495d85f2d311957b9cf366204fbfabadeaa/audit/quantstamp-audit.pdf"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            here
                        </a>{' '}
                        for details
                    </IonCardSubtitle>
                    <IonCardTitle>Sign Message</IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                    <IonLabel position="stacked">Bitcoin Address</IonLabel>
                    <IonItem>
                        <IonLabel position="floating">BIP32 Address Path</IonLabel>
                        <IonInput
                            placeholder={defaultPath}
                            onIonChange={e => setAddressPath(e.detail.value!)}
                        ></IonInput>
                    </IonItem>

                    <IonLabel position="stacked">Lock Duration</IonLabel>
                    <IonItem>
                        <DropdownOption
                            dataSets={networkLockDur}
                            onChoose={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setDuration(
                                    networkLockDur.filter(i => i.value === ((e.target.value as unknown) as number))[0],
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
                        <IonButton onClick={() => createLockAddress()} disabled={p2shAddress !== ''}>
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
                            <IonButton expand="block" onClick={() => signLockdropClaims()}>
                                Click to view lock claims
                            </IonButton>
                        </Container>
                    </>
                )}
            </SectionCard>
        </div>
    );
};

export default TrezorLock;
