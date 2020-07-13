/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useState, useEffect } from 'react';
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
import { makeStyles, createStyles } from '@material-ui/core';
import { MESSAGE, getPublicKey, getNetworkFromAddress, getDustyLockP2SH } from '../../helpers/lockdrop/BitcoinLockdrop';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DropdownOption } from '../DropdownOption';
import { btcDustyDurations } from '../../data/lockInfo';
import { Message } from 'bitcore-lib';
import QrEncodedAddress from './QrEncodedAddress';
import CopyMessageBox from '../CopyMessageBox';
import { Network } from 'bitcoinjs-lib';
import { OptionItem } from 'src/types/LockdropModels';
interface Props {
    networkType: Network;
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
const BtcRawSignature: React.FC<Props> = ({ networkType }) => {
    const classes = useStyles();
    const [addressInput, setAddress] = useState('');
    const [sigInput, setSig] = useState('');
    const [lockDuration, setDuration] = useState<OptionItem>({ label: '', value: 0, rate: 0 });
    const [p2shAddress, setP2sh] = useState('');
    const [publicKey, setPublicKey] = useState('');

    const onSubmit = () => {
        try {
            if (getNetworkFromAddress(addressInput) !== networkType)
                throw new Error('Please use a valid Bitcoin network address');

            if (!lockDuration || !sigInput || !addressInput) throw new Error('Please fill in all the inputs');

            //console.log('verifying user:' + addressInput + '\nwith: ' + sigInput);
            if (new Message(MESSAGE).verify(addressInput, sigInput)) {
                const pub = getPublicKey(addressInput, sigInput, 'compressed');
                setPublicKey(pub);

                const p2sh = getDustyLockP2SH(lockDuration.value, pub, networkType);

                if (typeof p2sh.address === 'string') {
                    setP2sh(p2sh.address);
                } else {
                    toast.error('cannot create P2SH address!');
                }
                toast.success('Successfully created lock script');
            } else {
                toast.error('cannot verify signature!');
            }
        } catch (e) {
            console.log(e);
            toast.error(e.message);
        }
    };

    useEffect(() => {
        if (publicKey && p2shAddress) {
            const lockScript = getDustyLockP2SH(lockDuration.value, publicKey, networkType);

            setP2sh(lockScript.address!);
        }
    }, [lockDuration, publicKey, networkType, p2shAddress]);

    return (
        <div>
            {p2shAddress ? <QrEncodedAddress address={p2shAddress} /> : null}
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
                    <CopyMessageBox header="message" message={MESSAGE} />
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
                        <IonButton onClick={onSubmit}>Generate Lock Script</IonButton>
                    </div>
                </IonCardContent>
            </IonCard>
        </div>
    );
};

export default BtcRawSignature;
