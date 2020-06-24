/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useState } from 'react';
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
} from '@ionic/react';
import { Container, Paper, Typography, makeStyles, createStyles } from '@material-ui/core';
import { MESSAGE, getPublicKey, verifyAddressNetwork } from '../../helpers/lockdrop/BitcoinLockdrop';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BtcNetwork } from '../../types/LockdropModels';
import { DropdownOption } from '../DropdownOption';
import { durations, rates } from '../../data/lockInfo';
import { Message } from 'bitcore-lib';

interface Props {
    networkType: BtcNetwork;
}

const useStyles = makeStyles(theme =>
    createStyles({
        button: {
            textAlign: 'center',
        },
        messageBox: {
            margin: theme.spacing(2, 2),
            marginLeft: 'auto',
            marginRight: 'auto',
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

const BtcRawSignature: React.FC<Props> = ({ networkType }) => {
    const classes = useStyles();
    const [addressInput, setAddress] = useState('');
    const [sigInput, setSig] = useState('');
    const [lockDuration, setDuration] = useState(0);

    const getTokenRate = () => {
        if (lockDuration) {
            return rates.filter(x => x.key === lockDuration)[0].value;
        }
        return 0;
    };

    const onClickVerify = () => {
        try {
            if (!verifyAddressNetwork(addressInput, networkType)) {
                throw new Error('Please use a valid Bitcoin network address');
            }
            console.log('verifying user:' + addressInput + '\nwith: ' + sigInput);
            if (new Message(MESSAGE).verify(addressInput, sigInput)) {
                console.log('success!');
                console.log(
                    'public key is: ' + getPublicKey(addressInput, sigInput) + '\nbonus rate: ' + getTokenRate(),
                );
            } else {
                toast.error('cannot verify signature!');
            }
        } catch (e) {
            console.log(e);
            toast.error(e.toString());
        }
    };

    return (
        <div>
            <IonCard>
                <IonCardHeader>
                    <IonCardSubtitle>
                        Please sign the following message with your tool of choice and copy and paste the following
                        input
                    </IonCardSubtitle>
                    <IonCardTitle>Sign Message</IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                    <Container maxWidth="sm">
                        <Paper elevation={5} className={classes.messageBox}>
                            <Typography component="h3">{MESSAGE}</Typography>
                        </Paper>
                    </Container>
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
                            dataSets={durations}
                            onChoose={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setDuration((e.target.value as unknown) as number)
                            }
                        ></DropdownOption>
                    </IonItem>
                </IonCardContent>
            </IonCard>
            <div className={classes.button}>
                <IonButton onClick={onClickVerify}>Generate Lock Address</IonButton>
            </div>
        </div>
    );
};

export default BtcRawSignature;
