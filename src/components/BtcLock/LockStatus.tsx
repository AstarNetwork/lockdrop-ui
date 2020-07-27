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
    IonSkeletonText,
} from '@ionic/react';
import { lock, time } from 'ionicons/icons';
import * as bitcoinjs from 'bitcoinjs-lib';
import { Tooltip } from '@material-ui/core';
import BigNumber from 'bignumber.js';
import { BlockStreamApi } from 'src/types/BlockStreamTypes';

interface Props {
    scriptAddress: string;
}

/**
 * Shows the number of BTC locked in the given P2SH address. Information is fetched from block cypher.
 * @param param0 P2SH address to look for
 */
const LockStatus: React.FC<Props> = ({ scriptAddress }) => {
    // check what network this address belongs to
    const networkToken =
        btcLockdrop.getNetworkFromAddress(scriptAddress) === bitcoinjs.networks.bitcoin ? 'mainnet' : 'testnet';
    const [lockedValue, setLockedValue] = useState('');
    const [scriptLocks, setScriptLocks] = useState<BlockStreamApi.Transaction[]>([]); // initialize value
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setLoading] = useState(false);

    const getLockBtcValues = (tx: BlockStreamApi.Transaction) => {
        const lockTx = tx.vout.filter(e => e.scriptpubkey_address === scriptAddress)[0];

        return btcLockdrop.satoshiToBitcoin(lockTx.value).toFixed();
    };

    // initial fetch
    useEffect(() => {
        // we need this to display the correct value when the user changes param
        setScriptLocks([]);
        setLockedValue('');
        setLoading(true);
        const setLockTotalBal = async () => {
            const tx = await btcLockdrop.getBtcTxsFromAddress(scriptAddress, networkToken);
            setScriptLocks(tx);

            let totalBal = new BigNumber(0);
            tx.forEach(i => {
                const lockTx = i.vout.filter(e => e.scriptpubkey_address === scriptAddress)[0];
                totalBal = totalBal.plus(new BigNumber(lockTx.value));
            });
            if (totalBal.isGreaterThan(new BigNumber(0))) {
                setLockedValue(btcLockdrop.satoshiToBitcoin(totalBal).toFixed());
            }
            console.log(JSON.stringify(tx));
        };

        setLockTotalBal();
        setLoading(false);
    }, [scriptAddress, networkToken]);

    // fetch lock data in the background
    useEffect(() => {
        const interval = setInterval(async () => {
            const tx = await btcLockdrop.getBtcTxsFromAddress(scriptAddress, networkToken);
            setScriptLocks(tx);
            let totalBal = new BigNumber(0);
            tx.forEach(i => {
                const lockTx = i.vout.filter(e => e.scriptpubkey_address === scriptAddress)[0];
                totalBal = totalBal.plus(new BigNumber(lockTx.value));
            });
            if (totalBal.isGreaterThan(new BigNumber(0))) {
                setLockedValue(btcLockdrop.satoshiToBitcoin(totalBal).toFixed());
            }
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
                    {isLoading ? (
                        <IonCardContent>
                            <IonList>
                                {[0, 1, 2, 3].map(e => (
                                    <IonItem key={e}>
                                        <IonLabel>
                                            <h2>
                                                <IonSkeletonText animated style={{ width: '80%' }} />
                                            </h2>
                                            <h3>
                                                <IonSkeletonText animated style={{ width: '50%' }} />
                                            </h3>
                                            <p>
                                                <IonSkeletonText animated style={{ width: '50%' }} />
                                            </p>
                                        </IonLabel>
                                    </IonItem>
                                ))}
                            </IonList>
                        </IonCardContent>
                    ) : (
                        <>
                            {scriptLocks.length > 0 && lockedValue ? (
                                <IonCardContent>
                                    <IonList>
                                        {scriptLocks.map(e => (
                                            <IonItem key={e.txid}>
                                                <IonLabel>
                                                    <h2>Transaction Hash: {e.txid}</h2>
                                                    <h3>Locked Amount: {getLockBtcValues(e)} BTC</h3>
                                                    <p>Locked in block no. {e.status.block_height}</p>
                                                </IonLabel>
                                            </IonItem>
                                        ))}
                                    </IonList>
                                </IonCardContent>
                            ) : (
                                <IonLabel>No locks found yet! (Please wait for it to be confirmed)</IonLabel>
                            )}
                        </>
                    )}
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
