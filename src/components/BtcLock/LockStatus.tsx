/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
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
import * as bitcoinjs from 'bitcoinjs-lib';
import { Tooltip } from '@material-ui/core';
import { BlockCypherApi } from 'src/types/BlockCypherTypes';

interface Props {
    scriptAddress: string;
}

/**
 * Shows the number of BTC locked in the given P2SH address
 * @param param0 P2SH address to look for
 */
const LockStatus: React.FC<Props> = ({ scriptAddress }) => {
    const [lockedValue, setLockedValue] = useState('');
    const [scriptLocks, setScriptLocks] = useState<BlockCypherApi.Tx[]>([]); // initialize value
    const [showModal, setShowModal] = useState(false);

    // initial fetch
    useEffect(() => {
        // check what network this address belongs to
        const networkToken =
            btcLockdrop.getNetworkFromAddress(scriptAddress) === bitcoinjs.networks.bitcoin ? 'main' : 'test3';
        // check the transactions in the P2SH address
        btcLockdrop.getAddressEndpoint(scriptAddress, networkToken, 50, false, true).then(lockTxData => {
            if (lockTxData.final_balance > 0) {
                setLockedValue(btcLockdrop.satoshiToBitcoin(lockTxData.final_balance).toFixed());
                setScriptLocks(lockTxData.txs);

                console.log(lockTxData.txs);
            } else {
                // we need this to display the correct value when the user changes param
                setLockedValue('');
                setScriptLocks([]);
            }
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
        }, 10000); // fetch every 10 seconds

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
                    <div>
                        {lockedValue ? (
                            <IonCardContent>
                                <IonList>
                                    {scriptLocks.map(e => (
                                        <IonItem key={e.hash}>
                                            <h4>Transaction Hash: {e.hash}</h4>
                                            <br />
                                            <h5>Locked Amount: {btcLockdrop.satoshiToBitcoin(e.total).toFixed()}</h5>
                                            <br />
                                            <p>Locked in block no. {e.block_height}</p>
                                        </IonItem>
                                    ))}
                                </IonList>
                            </IonCardContent>
                        ) : (
                            <IonLabel>No locks found yet! (Please wait for it to be confirmed)</IonLabel>
                        )}
                    </div>
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
