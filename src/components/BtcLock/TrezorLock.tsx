/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useState, useEffect } from 'react';
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

const TrezorLock: React.FC<Props> = ({ networkType }) => {
    const classes = useStyles();

    const defaultPath = networkType === bitcoinjs.networks.bitcoin ? "m/44'/0'/0'" : "m/44'/1'/0'";
    // switch lock duration depending on the chain network
    const networkLockDur = networkType === bitcoinjs.networks.bitcoin ? btcDurations : btcDustyDurations;

    const [lockDuration, setDuration] = useState<OptionItem>({ label: '', value: 0, rate: 0 });
    const [p2shAddress, setP2sh] = useState('');
    const [plasmApi, setPlasmApi] = useState<ApiPromise>();
    const [lockParams, setLockParams] = useState<Lockdrop[]>();

    // changing the path to n/49'/x'/x' will return a signature error
    // this may be due to compatibility issues with BIP49
    const [addressPath, setAddressPath] = useState(defaultPath);
    const [isLoading, setLoading] = useState(false);
    const [publicKey, setPublicKey] = useState('');

    const inputValidation = () => {
        if (lockDuration.value <= 0) {
            return { valid: false, message: 'Please provide a lock duration' };
        }

        return { valid: true, message: 'valid input' };
    };

    const signLockdropClaims = () => {
        const _msg = 'sign to display real-time lockdrop status';
        setLoading(true);

        if (!publicKey) {
            TrezorConnect.signMessage({
                path: addressPath,
                message: _msg,
                coin: networkType === bitcoinjs.networks.bitcoin ? 'BTC' : 'Testnet',
            }).then(res => {
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
                    setLoading(false);
                }
            });
        }
        if (!plasmApi) {
            const netType =
                networkType === bitcoinjs.networks.bitcoin
                    ? plasmUtils.PlasmNetwork.Main
                    : plasmUtils.PlasmNetwork.Dusty;

            plasmUtils.createPlasmInstance(netType).then(e => {
                setPlasmApi(e);
            });
        }

        if (plasmApi && publicKey && lockParams) {
            setLoading(false);
        }
    };

    const signMessage = () => {
        setLoading(true);

        if (!inputValidation().valid) {
            toast.error(inputValidation().message);
            setLoading(false);
            return;
        }

        TrezorConnect.signMessage({
            path: addressPath,
            message: btcLock.MESSAGE,
            coin: networkType === bitcoinjs.networks.bitcoin ? 'BTC' : 'Testnet',
        }).then(res => {
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
                setLoading(false);
                toast.success('Successfully created lock script');
            } catch (e) {
                toast.error(e.toString());
                console.log(e);
                setLoading(false);
            }
        });
        signLockdropClaims();
    };

    // initialize component variables
    useEffect(() => {
        const netType =
            networkType === bitcoinjs.networks.bitcoin ? plasmUtils.PlasmNetwork.Main : plasmUtils.PlasmNetwork.Dusty;

        plasmUtils.createPlasmInstance(netType).then(e => {
            setPlasmApi(e);
        });
    }, []);

    useEffect(() => {
        if (publicKey) {
            const blockCypherNetwork = networkType === bitcoinjs.networks.bitcoin ? 'main' : 'test3';
            // const lockScript = btcLock.getLockP2SH(lockDuration.value, publicKey, networkType);
            // setP2sh(lockScript.address!);

            // initialize lockdrop data array
            const _lockParams: Lockdrop[] = [];

            // get all the possible lock addresses
            networkLockDur.map(i => {
                const p2shAddr = btcLock.getLockP2SH(i.value, publicKey, networkType).address!;
                // set the lock address to UI if it's the one that the user chose
                // we do this to update the QR code
                if (i.value === lockDuration.value) setP2sh(p2shAddr);

                // make a real-time lockdrop data structure with the current P2SH and duration
                btcLock.getLockParameter(p2shAddr, i.value, publicKey, blockCypherNetwork).then(lock => {
                    // loop through all the token locks within the given script
                    // this is to prevent nested array
                    lock.map(e => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        _lockParams.push(plasmUtils.structToLockdrop(e as any));
                    });
                });
            });
            if (_lockParams.length > 0) {
                setLockParams(_lockParams);
            }
            console.log(_lockParams);
        }
    }, [lockDuration, publicKey, networkType]);

    return (
        <div>
            {p2shAddress ? <QrEncodedAddress address={p2shAddress} /> : null}
            <IonLoading isOpen={isLoading} message={'Waiting for Trezor to respond'} />
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
                        <IonButton onClick={() => signMessage()} disabled={p2shAddress !== ''}>
                            Generate Lock Script
                        </IonButton>
                    </div>
                </IonCardContent>
            </IonCard>
            <SectionCard maxWidth="lg">
                <Typography variant="h4" component="h1" align="center">
                    Real-time Lockdrop Status
                </Typography>
                {publicKey && lockParams && plasmApi ? (
                    <ClaimStatus
                        claimParams={lockParams}
                        plasmApi={plasmApi}
                        networkType="ETH"
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
