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
import { MESSAGE, verifiedInput, getPublicKey } from '../../helpers/lockdrop/BitcoinLockdrop';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BtcNetwork } from '../../types/LockdropModels';

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

    const onClickVerify = () => {
        try {
            console.log('verifying user:' + addressInput + '\nwith: ' + sigInput);
            if (verifiedInput(addressInput, sigInput, toast, networkType)) {
                console.log('success!');
                console.log('public key is: ' + getPublicKey(addressInput, sigInput));
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
                </IonCardContent>
            </IonCard>
            <div className={classes.button}>
                <IonButton onClick={onClickVerify}>Verify User</IonButton>
            </div>
        </div>
    );
};

export default BtcRawSignature;
