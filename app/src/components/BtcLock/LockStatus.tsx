/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
//import { makeStyles, createStyles } from '@material-ui/core';
import * as btcLockdrop from '../../helpers/lockdrop/BitcoinLockdrop';
import { BtcNetwork } from '../../types/LockdropModels';
import { IonChip, IonIcon, IonLabel } from '@ionic/react';
import { lock, time } from 'ionicons/icons';

interface Props {
    scriptAddress: string;
}

// const useStyles = makeStyles(() =>
//     createStyles({
//         qrImage: {
//         },
//     }),
// );

const LockStatus: React.FC<Props> = ({ scriptAddress }) => {
    //const classes = useStyles();
    //const [hasLocked, setLockedState] = useState(false);
    const [lockedValue, setLockedValue] = useState('');

    useEffect(() => {
        const interval = setInterval(async () => {
            // check what network this address belongs to
            const networkToken =
                (btcLockdrop.getNetworkFromAddress(scriptAddress) as BtcNetwork) === BtcNetwork.MainNet
                    ? 'main'
                    : 'test3';
            // check the transactions in the P2SH address
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
