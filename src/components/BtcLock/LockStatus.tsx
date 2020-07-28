/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback } from 'react';
//import { makeStyles, createStyles } from '@material-ui/core';
import * as btcLockdrop from '../../helpers/lockdrop/BitcoinLockdrop';
import {
    IonChip,
    IonIcon,
    IonLabel,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonSpinner,
} from '@ionic/react';
import { lock, time } from 'ionicons/icons';
import { Tooltip } from '@material-ui/core';
import BigNumber from 'bignumber.js';
import { Lockdrop } from 'src/types/LockdropModels';

interface Props {
    lockData: Lockdrop[];
}

/**
 * Shows the number of BTC locked in the given P2SH address. Information is fetched from block stream
 * @param param0 P2SH address to look for
 */
const LockStatus: React.FC<Props> = ({ lockData }) => {
    const [lockedValue, setLockedValue] = useState('');
    const [showModal, setShowModal] = useState(false);

    const epochToDays = (epoch: string) => {
        const epochDay = 60 * 60 * 24;
        const days = new BigNumber(epoch).dividedBy(epochDay).toFixed();
        return days;
    };

    const setLockTotalBal = useCallback(() => {
        if (lockData.length === 0) {
            setLockedValue('');
        } else {
            let totalBal = new BigNumber(0);
            lockData.forEach(i => {
                totalBal = totalBal.plus(new BigNumber(i.value.toString()));
            });

            if (totalBal.isGreaterThan(new BigNumber(0))) {
                setLockedValue(btcLockdrop.satoshiToBitcoin(totalBal).toFixed());
            }
        }
    }, [lockData]);

    // initial fetch
    useEffect(() => {
        setLockTotalBal();
    }, [setLockTotalBal]);

    // fetch lock data in the background
    useEffect(() => {
        const interval = setInterval(async () => {
            setLockTotalBal();
        }, 20 * 1000); // fetch every 20 seconds

        // cleanup hook
        return () => {
            clearInterval(interval);
        };
    });

    return (
        <>
            <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>BTC Lock Information</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={() => setShowModal(false)}>Close</IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonCard>
                    <IonCardHeader>
                        <IonCardSubtitle>General information about your lock</IonCardSubtitle>
                        <IonCardTitle>Lock Overview</IonCardTitle>
                    </IonCardHeader>
                    <>
                        {lockData.length > 0 && lockedValue ? (
                            <IonCardContent>
                                <IonList>
                                    {lockData.map(e => (
                                        <IonItem key={e.transactionHash.toHex()}>
                                            <IonLabel>
                                                <h2>Transaction Hash: {e.transactionHash.toHex().replace('0x', '')}</h2>
                                                <h3>
                                                    Locked Amount:{' '}
                                                    {btcLockdrop.satoshiToBitcoin(e.value.toString()).toFixed()} BTC
                                                </h3>
                                                <p>Locked for {epochToDays(e.duration.toString())} days</p>
                                            </IonLabel>
                                        </IonItem>
                                    ))}
                                </IonList>
                            </IonCardContent>
                        ) : (
                            <IonLabel>No locks found yet! (Please wait for it to be confirmed)</IonLabel>
                        )}
                    </>
                </IonCard>
            </IonModal>

            <Tooltip title="Click for details" aria-label="lock-detail">
                <IonChip onClick={() => setShowModal(true)}>
                    <IonIcon icon={lockedValue ? lock : time} color={lockedValue ? 'success' : 'warning'} />
                    {lockedValue ? (
                        <IonLabel>{lockedValue} BTC locked</IonLabel>
                    ) : (
                        <>
                            <IonLabel>No deposits detected yet</IonLabel>
                            <IonSpinner name="bubbles" />
                        </>
                    )}
                </IonChip>
            </Tooltip>
        </>
    );
};

export default LockStatus;
