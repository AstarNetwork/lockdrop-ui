/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent } from '@ionic/react';
import { qrEncodeUri } from '../../helpers/lockdrop/BitcoinLockdrop';
import { Typography, makeStyles, createStyles } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import LockStatus from './LockStatus';

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
    const [imageUri, setUri] = useState('');

    useEffect(() => {
        qrEncodeUri(address).then(img => {
            setUri(img);
        });
    }, [address]);

    return (
        <>
            <IonCard>
                <IonCardHeader>
                    {imageUri ? (
                        <img src={imageUri} className={classes.qrImage} />
                    ) : (
                        <Skeleton variant="rect" className={classes.qrImage} />
                    )}

                    <IonCardSubtitle>Please send the amount you want to lock to this P2SH address</IonCardSubtitle>
                    <IonCardTitle>Sign Message</IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                    <Typography component="h4">{address}</Typography>
                    <LockStatus scriptAddress={address} />
                </IonCardContent>
            </IonCard>
        </>
    );
};

export default QrEncodedAddress;
