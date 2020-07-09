/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
//import { makeStyles, createStyles } from '@material-ui/core';
import * as btcLockdrop from '../../helpers/lockdrop/BitcoinLockdrop';
import { IonChip, IonIcon, IonLabel } from '@ionic/react';
import { lock, time } from 'ionicons/icons';
import * as bitcoinjs from 'bitcoinjs-lib';
import { Tooltip } from '@material-ui/core';

interface Props {
    scriptAddress: string;
}

const LockStatus: React.FC<Props> = ({ scriptAddress }) => {
    const [lockedValue, setLockedValue] = useState('');

    const getLockedValue = async () => {
        // check what network this address belongs to
        const networkToken =
            btcLockdrop.getNetworkFromAddress(scriptAddress) === bitcoinjs.networks.bitcoin ? 'main' : 'test3';
        // check the transactions in the P2SH address
        const lockTxData = await btcLockdrop.getAddressEndpoint(scriptAddress, networkToken);
        if (lockTxData.final_balance > 0) {
            setLockedValue(btcLockdrop.satoshiToBitcoin(lockTxData.final_balance).toFixed());
        } else {
            // we need this to display the correct value when the user changes param
            setLockedValue('');
        }
    };

    // initial fetch
    useEffect(() => {
        getLockedValue().then(e => {
            console.log(e);
        });
    }, [scriptAddress]);

    useEffect(() => {
        const interval = setInterval(async () => {
            // check what network this address belongs to
            const networkToken =
                btcLockdrop.getNetworkFromAddress(scriptAddress) === bitcoinjs.networks.bitcoin ? 'main' : 'test3';
            // check the transactions in the P2SH address
            const lockTxData = await btcLockdrop.getAddressEndpoint(scriptAddress, networkToken);
            if (lockTxData.final_balance > 0) {
                setLockedValue(btcLockdrop.satoshiToBitcoin(lockTxData.final_balance).toFixed());
            }
        }, 20000); // fetch every 20 seconds

        // cleanup hook
        return () => {
            clearInterval(interval);
        };
    });

    return (
        <>
            <Tooltip title="Click for details" aria-label="lock-detail">
                <IonChip>
                    <IonIcon icon={lockedValue ? lock : time} color={lockedValue ? 'success' : 'warning'} />
                    {lockedValue ? (
                        <IonLabel>{lockedValue} BTC locked</IonLabel>
                    ) : (
                        <IonLabel>No deposits detected</IonLabel>
                    )}
                </IonChip>
            </Tooltip>
        </>
    );
};

export default LockStatus;
