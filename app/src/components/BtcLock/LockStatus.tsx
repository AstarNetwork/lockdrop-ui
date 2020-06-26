/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { makeStyles, createStyles } from '@material-ui/core';
import * as btcLockdrop from '../../helpers/lockdrop/BitcoinLockdrop';
import { BtcNetwork } from '../../types/LockdropModels';
import { IonChip, IonIcon, IonLabel } from '@ionic/react';
import { lock, time } from 'ionicons/icons';

interface Props {
    scriptAddress: string;
    lockerAddress: string;
    network: BtcNetwork;
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

const LockStatus: React.FC<Props> = ({ scriptAddress, lockerAddress, network }) => {
    const classes = useStyles();
    //const [hasLocked, setLockedState] = useState(false);
    const [lockedValue, setLockedValue] = useState('');

    useEffect(() => {
        const interval = setInterval(async () => {
            const networkToken = (network as BtcNetwork) === BtcNetwork.MainNet ? 'main' : 'test3';
            const lockTxData = await btcLockdrop.getAddressEndpoint(scriptAddress, networkToken);
            setLockedValue(btcLockdrop.satoshiToBitcoin(lockTxData.final_balance).toString());
        }, 3000); // fetch every 3 seconds
        // cleanup hook
        return () => {
            clearInterval(interval);
        };
    });

    return (
        <>
            <IonChip>
                <IonIcon icon={lockedValue ? lock : time} color={lockedValue ? 'success' : 'warning'} />
                {lockedValue ? (
                    <IonLabel>{lockedValue} BTC locked</IonLabel>
                ) : (
                    <IonLabel>No deposits detected</IonLabel>
                )}
            </IonChip>
        </>
    );
};

export default LockStatus;
