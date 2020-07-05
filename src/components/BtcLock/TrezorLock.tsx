/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useState } from 'react';
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
import { BtcNetwork } from '../../types/LockdropModels';
import QrEncodedAddress from './QrEncodedAddress';

interface Props {
    networkType: BtcNetwork;
}
function printLog(data: object) {
    console.log(JSON.stringify(data));
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
    const [lockDuration, setDuration] = useState(0);
    const [p2shAddress, setP2sh] = useState('');
    const [lockAmount, setAmount] = useState('');
    const [addressPath, setAddressPath] = useState("m/44'/0'/0'");
    const [isLoading, setLoading] = useState(false);

    const signMessage = () => {
        try {
            if (lockDuration <= 0) {
                throw new Error('Please provide a lock duration');
            }
            const lockVal = new BigNumber(lockAmount);
            if (lockVal.isLessThanOrEqualTo(0)) {
                throw new Error('Lock value must be greater than 0');
            }
            setLoading(true);

            TrezorConnect.signMessage({
                path: addressPath,
                message: btcLock.MESSAGE,
                coin: 'btc',
            }).then(res => {
                printLog(res);
                setLoading(false);
                if (res.success) {
                    const pubKey = btcLock.getPublicKey(res.payload.address, res.payload.signature);

                    const lockScript = btcLock.getLockP2SH(lockDuration, pubKey, networkType);

                    setP2sh(lockScript.address!);
                    //todo: add send transaction method
                } else {
                    throw new Error(res.payload.error);
                }
            });
        } catch (e) {
            toast.error(e.toString());
        }
    };

    const getTokenRate = () => {
        if (lockDuration) {
            return rates.filter(x => x.key === lockDuration)[0].value;
        }
        return 0;
    };

    return (
        <div>
            {p2shAddress ? <QrEncodedAddress address={p2shAddress} /> : <></>}
            <IonLoading isOpen={isLoading} message={'Waiting for Trezor to respond'} />
            <IonCard>
                <IonCardHeader>
                    <IonCardSubtitle>
                        Please fill in the following form with the correct information. Your address path will default
                        to <code>{addressPath}</code> if none is given. For more information, please check{' '}
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
                            placeholder={addressPath}
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
