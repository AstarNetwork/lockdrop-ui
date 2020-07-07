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
import { btcDurations, rates } from '../../data/lockInfo';
import * as btcLock from '../../helpers/lockdrop/BitcoinLockdrop';
import { toast } from 'react-toastify';
import BigNumber from 'bignumber.js';
import { makeStyles, createStyles } from '@material-ui/core';
import QrEncodedAddress from './QrEncodedAddress';
import * as bitcoinjs from 'bitcoinjs-lib';
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
    const [lockDuration, setDuration] = useState(0);
    const [p2shAddress, setP2sh] = useState('');
    const [lockAmount, setAmount] = useState('');
    // changing the path to n/49'/x'/x' will return a signature error
    // this may be due to compatibility issues with BIP49
    const [addressPath, setAddressPath] = useState(defaultPath);
    const [isLoading, setLoading] = useState(false);
    const [publicKey, setPublicKey] = useState('');

    const inputValidation = () => {
        if (lockDuration <= 0) {
            return { valid: false, message: 'Please provide a lock duration' };
        }
        if (isNaN(parseInt(lockAmount))) {
            return { valid: false, message: 'Please input a valid number' };
        }
        const lockVal = new BigNumber(lockAmount);
        if (lockVal.isLessThanOrEqualTo(0)) {
            return { valid: false, message: 'Lock value must be greater than 0' };
        }
        return { valid: true, message: 'valid input' };
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

                    const lockScript = btcLock.getLockP2SH(lockDuration, _pubKey, networkType);

                    setP2sh(lockScript.address!);

                    //todo: add send transaction method
                } else {
                    throw new Error(res.payload.error);
                }
                setLoading(false);
            } catch (e) {
                toast.error(e.toString());
                console.log(e);
                setLoading(false);
            }
        });
    };

    const getTokenRate = () => {
        if (lockDuration) {
            return rates.filter(x => x.key === lockDuration)[0].value;
        }
        return 0;
    };

    useEffect(() => {
        if (publicKey && p2shAddress) {
            const lockScript = btcLock.getLockP2SH(lockDuration, publicKey, networkType);

            setP2sh(lockScript.address!);
        }
    }, [lockDuration, publicKey, networkType, p2shAddress]);

    return (
        <div>
            {p2shAddress ? <QrEncodedAddress address={p2shAddress} /> : <></>}
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
                    <IonItem>
                        <IonLabel position="floating">Number of BTC</IonLabel>
                        <IonInput
                            placeholder={'ex: 0.64646 BTC'}
                            onIonChange={e => setAmount(e.detail.value!)}
                        ></IonInput>
                    </IonItem>

                    <IonLabel position="stacked">Lock Duration</IonLabel>
                    <IonItem>
                        <DropdownOption
                            dataSets={btcDurations}
                            onChoose={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setDuration((e.target.value as unknown) as number)
                            }
                        ></DropdownOption>
                        <IonChip>
                            <IonLabel>
                                {lockDuration ? 'The rate is ' + getTokenRate() + 'x' : 'Please choose the duration'}
                            </IonLabel>
                        </IonChip>
                    </IonItem>
                    <div className={classes.button}>
                        <IonButton onClick={() => signMessage()}>Generate Lock Script</IonButton>
                    </div>
                </IonCardContent>
            </IonCard>
        </div>
    );
};

export default TrezorLock;
