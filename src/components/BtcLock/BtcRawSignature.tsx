/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useState, useEffect } from 'react';
import {
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCardContent,
    IonInput,
    IonItem,
    IonLabel,
    IonTextarea,
    IonButton,
    IonChip,
} from '@ionic/react';
import { makeStyles, createStyles, Container, Typography } from '@material-ui/core';
import * as btcLock from '../../helpers/lockdrop/BitcoinLockdrop';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DropdownOption } from '../DropdownOption';
import { btcDustyDurations, btcDurations } from '../../data/lockInfo';
import { Message } from 'bitcore-lib';
import QrEncodedAddress from './QrEncodedAddress';
import CopyMessageBox from '../CopyMessageBox';
import * as bitcoinjs from 'bitcoinjs-lib';
import { OptionItem, Lockdrop } from 'src/types/LockdropModels';
import SectionCard from '../SectionCard';
import ClaimStatus from '../ClaimStatus';
import * as plasmUtils from '../../helpers/plasmUtils';
import { ApiPromise } from '@polkadot/api';
interface Props {
    networkType: bitcoinjs.Network;
    plasmApi: ApiPromise;
}

const useStyles = makeStyles(() =>
    createStyles({
        button: {
            textAlign: 'center',
        },
    }),
);

toast.configure({
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
});

/**
 * Obtains lockdrop participant's public key by receiving raw signatures and BTC address
 * @param networkType Bitcoin network to use
 */
const BtcRawSignature: React.FC<Props> = ({ networkType, plasmApi }) => {
    const classes = useStyles();
    // switch lock duration depending on the chain network
    const networkLockDur = networkType === bitcoinjs.networks.bitcoin ? btcDurations : btcDustyDurations;

    const [addressInput, setAddress] = useState('');
    const [sigInput, setSig] = useState('');
    const [lockDuration, setDuration] = useState<OptionItem>({ label: '', value: 0, rate: 0 });
    const [p2shAddress, setP2sh] = useState('');
    const [publicKey, setPublicKey] = useState('');
    const [lockParams, setLockParams] = useState<Lockdrop[]>([]);

    const onSubmit = () => {
        try {
            if (btcLock.getNetworkFromAddress(addressInput) !== networkType)
                throw new Error('Please use a valid Bitcoin network address');

            if (!lockDuration || !sigInput || !addressInput) throw new Error('Please fill in all the inputs');

            if (new Message(btcLock.MESSAGE).verify(addressInput, sigInput)) {
                const pub = btcLock.getPublicKey(addressInput, sigInput, 'compressed');
                setPublicKey(pub);

                const p2sh = btcLock.getLockP2SH(lockDuration.value, pub, networkType);

                if (typeof p2sh.address === 'string') {
                    setP2sh(p2sh.address);
                } else {
                    throw new Error('Cannot create P2SH address!');
                }
                toast.success('Successfully created lock script');
            } else {
                throw new Error('Cannot verify signature!');
            }
        } catch (e) {
            console.log(e);
            toast.error(e.message);
        }
    };

    useEffect(() => {
        const fetchLockdropParams = async () => {
            // fetch user lock param data
            if (publicKey) {
                const blockStreamNet = networkType === bitcoinjs.networks.bitcoin ? 'mainnet' : 'testnet';
                // initialize lockdrop data array
                const _lockParams: Lockdrop[] = [];

                // get all the possible lock addresses
                networkLockDur.forEach(async (dur, index) => {
                    const p2shAddr = btcLock.getLockP2SH(dur.value, publicKey, networkType).address!;

                    // make a real-time lockdrop data structure with the current P2SH and duration
                    const lock = await btcLock.getLockParameter(p2shAddr, dur.value, publicKey, blockStreamNet);
                    // loop through all the token locks within the given script
                    // this is to prevent nested array
                    // eslint-disable-next-line
                    lock.map(e => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        _lockParams.push(plasmUtils.structToLockdrop(e as any));
                    });
                    // set lockdrop param data if we're in the final loop
                    // we do this because we want to set the values inside the then block
                    if (_lockParams.length > lockParams.length && index === networkLockDur.length - 1) {
                        setLockParams(_lockParams);
                    }
                });
            }
        };
        // change P2SH if the user changed the lock duration
        if (publicKey && p2shAddress) {
            const lockScript = btcLock.getLockP2SH(lockDuration.value, publicKey, networkType);
            setP2sh(lockScript.address!);
        }

        fetchLockdropParams();
    }, [lockDuration, publicKey, networkType, p2shAddress, networkLockDur, lockParams]);

    return (
        <div>
            {p2shAddress ? <QrEncodedAddress address={p2shAddress} /> : null}
            <IonCard>
                <IonCardHeader>
                    <IonCardSubtitle>
                        Please sign the following message with your tool of choice and copy and paste the following
                        input. The provided address will be the one that will receive the tokens once it has been
                        unlocked.
                    </IonCardSubtitle>
                    <IonCardTitle>Sign Message</IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                    <CopyMessageBox header="message" message={btcLock.MESSAGE} />
                    <IonLabel position="stacked">Bitcoin Address</IonLabel>
                    <IonItem>
                        <IonInput
                            value={addressInput}
                            placeholder="Enter BTC Address"
                            onIonChange={e => setAddress(e.detail.value!)}
                        ></IonInput>
                    </IonItem>

                    <IonItem>
                        <IonTextarea
                            placeholder="Paste your base64 message signature here..."
                            value={sigInput}
                            onIonChange={e => setSig(e.detail.value!)}
                        ></IonTextarea>
                    </IonItem>
                    <IonLabel position="stacked">Lock Duration</IonLabel>
                    <IonItem>
                        <DropdownOption
                            dataSets={btcDustyDurations}
                            onChoose={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setDuration(
                                    btcDustyDurations.filter(
                                        i => i.value === ((e.target.value as unknown) as number),
                                    )[0],
                                )
                            }
                        ></DropdownOption>
                        <IonChip>
                            <IonLabel>
                                {lockDuration.value
                                    ? 'The rate is ' + lockDuration.rate + 'x'
                                    : 'Please choose the duration'}
                            </IonLabel>
                        </IonChip>
                    </IonItem>
                    <div className={classes.button}>
                        <IonButton onClick={onSubmit}>Generate Lock Script</IonButton>
                    </div>
                </IonCardContent>
            </IonCard>
            <SectionCard maxWidth="lg">
                <Typography variant="h4" component="h1" align="center">
                    Real-time Lockdrop Status
                </Typography>
                {publicKey ? (
                    <ClaimStatus
                        claimParams={lockParams}
                        plasmApi={plasmApi}
                        networkType="BTC"
                        plasmNetwork="Dusty"
                        publicKey={publicKey}
                    />
                ) : (
                    <>
                        <Container>
                            <Typography variant="h4" component="h2" align="center">
                                Provide signature to view
                            </Typography>
                        </Container>
                    </>
                )}
            </SectionCard>
        </div>
    );
};

export default BtcRawSignature;
