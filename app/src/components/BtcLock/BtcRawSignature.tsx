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
    IonToast,
    IonChip,
} from '@ionic/react';
import { Paper, Typography, makeStyles, createStyles, Tooltip, IconButton } from '@material-ui/core';
import { MESSAGE, getPublicKey, verifyAddressNetwork, getLockP2SH } from '../../helpers/lockdrop/BitcoinLockdrop';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BtcNetwork } from '../../types/LockdropModels';
import { DropdownOption } from '../DropdownOption';
import { btcDurations, rates } from '../../data/lockInfo';
import { Message } from 'bitcore-lib';
import QrEncodedAddress from './QrEncodedAddress';
import FileCopyIcon from '@material-ui/icons/FileCopy';

interface Props {
    networkType: BtcNetwork;
}

const useStyles = makeStyles(theme =>
    createStyles({
        button: {
            textAlign: 'center',
        },
        messageBox: {
            padding: theme.spacing(2, 4),
            alignItems: 'center',
        },
        signMessage: {
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
            height: '100%',
        },
        copyIcon: {
            verticalAlign: 'middle',
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
    const [p2shAddress, setP2sh] = useState('');
    const [showCopyToast, setCopyToast] = useState(false);

    const getTokenRate = () => {
        if (lockDuration) {
            return rates.filter(x => x.key === lockDuration)[0].value;
        }
        return 0;
    };

    const onSubmit = () => {
        try {
            // throws error for user input validations
            // this is easier to look, but might need to refactor this later
            if (!verifyAddressNetwork(addressInput, networkType))
                throw new Error('Please use a valid Bitcoin network address');
            if (!lockDuration || !sigInput || !addressInput) throw new Error('Please fill in all the inputs');

            console.log('verifying user:' + addressInput + '\nwith: ' + sigInput);
            if (new Message(MESSAGE).verify(addressInput, sigInput)) {
                const pub = getPublicKey(addressInput, sigInput);
                console.log('success!');
                console.log('public key is: ' + pub + '\nbonus rate: ' + getTokenRate());

                const p2sh = getLockP2SH(lockDuration, pub, networkType);

                if (typeof p2sh.address === 'string') {
                    setP2sh(p2sh.address);
                } else {
                    toast.error('cannot create P2SH address!');
                }
            } else {
                toast.error('cannot verify signature!');
            }
        } catch (e) {
            console.log(e);
            toast.error(e.toString());
        }
    };

    const clickCopyMessage = () => {
        navigator.clipboard.writeText(MESSAGE).then(
            function() {
                setCopyToast(true);
            },
            function(err) {
                console.error('Async: Could not copy text: ', err);
            },
        );
    };

    return (
        <div>
            {p2shAddress ? <QrEncodedAddress address={p2shAddress} /> : <></>}
            <IonCard>
                <IonCardHeader>
                    <IonCardSubtitle>
                        Please sign the following message with your tool of choice and copy and paste the following
                        input
                    </IonCardSubtitle>
                    <IonCardTitle>Sign Message</IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                    <Paper elevation={1} className={classes.messageBox}>
                        <Typography component="h4" variant="h3">
                            Message:
                        </Typography>
                        <div className={classes.signMessage}>
                            <Typography component="h1" variant="h2">
                                {MESSAGE}
                            </Typography>
                            <div className={classes.copyIcon}>
                                <Tooltip title="Copy Message" aria-label="copy">
                                    <IconButton color="inherit" component="span" onClick={() => clickCopyMessage()}>
                                        <FileCopyIcon />
                                    </IconButton>
                                </Tooltip>
                            </div>
                        </div>
                    </Paper>
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
                </IonCardContent>
            </IonCard>
            <div className={classes.button}>
                <IonButton onClick={onSubmit}>Generate Lock Script</IonButton>
            </div>
            <IonToast
                isOpen={showCopyToast}
                onDidDismiss={() => setCopyToast(false)}
                message="Copied message to clipboard"
                duration={2000}
            />
        </div>
    );
};

export default BtcRawSignature;
