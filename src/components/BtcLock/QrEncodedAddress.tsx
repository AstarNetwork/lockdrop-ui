/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import {
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCardContent,
    IonAvatar,
    IonSkeletonText,
} from '@ionic/react';
import { qrEncodeUri } from '../../helpers/lockdrop/BitcoinLockdrop';
import { makeStyles, createStyles, Grid } from '@material-ui/core';
import LockStatus from './LockStatus';
import CopyMessageBox from '../CopyMessageBox';
import { BlockStreamApi } from 'src/types/BlockStreamTypes';

interface Props {
    address: string;
    lockData: BlockStreamApi.Transaction[];
    onUnlock?: Function;
}

const useStyles = makeStyles(theme =>
    createStyles({
        qrImage: {
            boxSizing: 'border-box',
            marginLeft: 'auto',
            marginRight: 'auto',
            verticalAlign: 'middle',
            alignSelf: 'center',
            maxHeight: '100%',
            maxWidth: 250,
            objectFit: 'cover',
        },
        imageSkeleton: {
            boxSizing: 'border-box',
            marginLeft: 'auto',
            marginRight: 'auto',
            verticalAlign: 'middle',
            alignSelf: 'center',
            objectFit: 'cover',
        },
        chipGrid: {
            position: 'relative',
            padding: theme.spacing(2),
        },
        statusChip: {
            [theme.breakpoints.up('sm')]: {
                position: 'absolute',
                right: 0,
                top: 0,
            },
        },
    }),
);

const QrEncodedAddress: React.FC<Props> = ({ address, lockData, onUnlock }) => {
    const classes = useStyles();
    const [imageUri, setUri] = useState('');
    const [imageLoaded, setImageLoad] = useState(false);

    useEffect(() => {
        qrEncodeUri(address).then(img => {
            setUri(img);
        });
    }, [address]);

    return (
        <>
            <IonCard>
                <IonCardHeader>
                    <img
                        src={imageUri}
                        className={classes.qrImage}
                        alt=""
                        style={imageLoaded ? {} : { display: 'none' }}
                        onLoad={() => setImageLoad(true)}
                    />
                    {imageLoaded ? null : (
                        <IonAvatar className={classes.imageSkeleton}>
                            <IonSkeletonText animated />
                        </IonAvatar>
                    )}

                    <IonCardSubtitle>Please send the amount you want to lock to this P2SH address</IonCardSubtitle>
                    <Grid container>
                        <Grid item xs={12} sm={6}>
                            <IonCardTitle>Lock Script Address</IonCardTitle>
                        </Grid>
                        <Grid item xs={12} sm={6} className={classes.chipGrid}>
                            <div className={classes.statusChip}>
                                <LockStatus lockData={lockData} scriptAddress={address} onUnlock={onUnlock} />
                            </div>
                        </Grid>
                    </Grid>
                </IonCardHeader>

                <IonCardContent>
                    <CopyMessageBox header="P2SH Address" message={address} />
                </IonCardContent>
            </IonCard>
        </>
    );
};

export default QrEncodedAddress;
