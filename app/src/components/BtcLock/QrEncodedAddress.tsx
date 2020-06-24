/* eslint-disable react/prop-types */
import React from 'react';
import { IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent } from '@ionic/react';
import { qrEncodeUri } from '../../helpers/lockdrop/BitcoinLockdrop';
import { Typography, makeStyles, createStyles } from '@material-ui/core';

interface Props {
    address: string;
}

const useStyles = makeStyles(() =>
    createStyles({
        qrImage: {
            display: 'block',
            marginLeft: 'auto',
            marginRight: 'auto',
            maxWidth: 250,
            height: 'auto',
            verticalAlign: 'middle',
            alignSelf: 'center',
        },
    }),
);

const QrEncodedAddress: React.FC<Props> = ({ address }) => {
    const classes = useStyles();
    return (
        <>
            <IonCard>
                <IonCardHeader>
                    <img src={qrEncodeUri(address)} className={classes.qrImage} />
                    <IonCardSubtitle>Please send the funds you like to lock to this P2SH address</IonCardSubtitle>
                    <IonCardTitle>Sign Message</IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                    <Typography component="h4">{address}</Typography>
                </IonCardContent>
            </IonCard>
        </>
    );
};

export default QrEncodedAddress;
