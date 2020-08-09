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
import { BlockStreamApi } from 'src/types/BlockStreamTypes';
import CountdownTimer from '../CountdownTimer';
import moment from 'moment';

interface Props {
    scriptAddress: string;
    lockData: BlockStreamApi.Transaction[];
    lockDurationDay: number;
    onUnlock?: Function;
}

/**
 * Shows the number of BTC locked in the given P2SH address. Information is fetched from block stream
 * @param param0 P2SH address to look for
 */
const LockStatus: React.FC<Props> = ({ lockData, onUnlock, scriptAddress, lockDurationDay }) => {
    const [lockedValue, setLockedValue] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [canUnlock, setCanUnlock] = useState(false);

    const handleUnlock = (lock: BlockStreamApi.Transaction) => {
        if (onUnlock) onUnlock(lock);
    };

    const getLockBal = useCallback(
        (lock: BlockStreamApi.Transaction) => {
            const _lockVout = lock.vout.find(locked => locked.scriptpubkey_address === scriptAddress);
            if (_lockVout) return btcLockdrop.satoshiToBitcoin(_lockVout.value.toFixed()).toFixed();
            else return '0';
        },
        [scriptAddress],
    );

    useEffect(() => {
        if (lockData.length === 0) {
            setLockedValue('');
        } else {
            let totalBal = new BigNumber(0);
            lockData.forEach(i => {
                const _lockVout = i.vout.find(locked => locked.scriptpubkey_address === scriptAddress);
                if (_lockVout) {
                    totalBal = totalBal.plus(new BigNumber(_lockVout.value.toFixed()));
                }
            });

            setLockedValue(btcLockdrop.satoshiToBitcoin(totalBal).toFixed());
        }
    }, [lockData, lockedValue, scriptAddress]);

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
                                        <IonItem key={e.txid}>
                                            <IonLabel>
                                                <h2>Transaction Hash: {e.txid}</h2>
                                                <h3>Locked Amount: {getLockBal(e)} BTC</h3>
                                                {e.status.confirmed ? (
                                                    <>
                                                        <p>Locked in block no. {e.status.block_height}</p>
                                                        {canUnlock ? (
                                                            <p>Tokens can be unlocked</p>
                                                        ) : (
                                                            <>
                                                                <CountdownTimer
                                                                    startTime={moment.unix(e.status.block_time)}
                                                                    endTime={moment
                                                                        .unix(e.status.block_time)
                                                                        .add(lockDurationDay, 'days')}
                                                                    onFinish={(u: boolean) => setCanUnlock(u)}
                                                                />
                                                                <p> Till unlock</p>
                                                            </>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p>Transaction not confirmed</p>
                                                )}
                                            </IonLabel>
                                            {onUnlock && (
                                                <IonButton
                                                    fill="outline"
                                                    slot="end"
                                                    onClick={() => handleUnlock(e)}
                                                    disabled={!canUnlock}
                                                >
                                                    Unlock
                                                </IonButton>
                                            )}
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
