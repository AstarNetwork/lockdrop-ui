/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback } from 'react';
import { getTotalLockVal, getPubKey } from '../../helpers/lockdrop/EthereumLockdrop';
//import * as ethAddress from 'ethereum-address';
import Web3 from 'web3';
import { LockEvent, TimeFormat } from '../../types/LockdropModels';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import {
    Divider,
    Grid,
    ListItemSecondaryAction,
    IconButton,
    LinearProgress,
    createStyles,
    makeStyles,
} from '@material-ui/core';
import LockIcon from '@material-ui/icons/Lock';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import CodeIcon from '@material-ui/icons/Code';
import CircularProgress from '@material-ui/core/CircularProgress';
import { defaultAddress } from '../../data/affiliationProgram';
import Web3Utils from 'web3-utils';
import {
    IonModal,
    IonButton,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCardContent,
    IonLoading,
} from '@ionic/react';
import moment from 'moment';

const useStyles = makeStyles(theme =>
    createStyles({
        listRoot: {
            width: '100%',
            maxWidth: 'auto',
            backgroundColor: theme.palette.background.paper,
            position: 'relative',
            overflow: 'auto',
            maxHeight: 360,
        },
        listSection: {
            backgroundColor: 'inherit',
        },
        ul: {
            backgroundColor: 'inherit',
            padding: 0,
        },
        lockListPage: {
            textAlign: 'center',
        },
        tabMenu: {
            backgroundColor: theme.palette.background.paper,
            width: 'auto',
        },
        itemButtons: {
            verticalAlign: 'middle',
            textAlign: 'center',
            alignContent: 'center',
        },
    }),
);

interface CurrentLockProps {
    web3: Web3;
    accounts: string[]; // this will be used to get locks for a certain account
    lockData: LockEvent[];
}

interface UnlockInfoProps {
    lockInfo: LockEvent;
    web3: Web3;
    address: string;
}
// displays a list of locks tha the current user has locked
const CurrentLocks: React.FC<CurrentLockProps> = ({ web3, accounts, lockData }) => {
    const classes = useStyles();
    const [lockEvents, setEvents] = useState<LockEvent[]>([]);
    const [isLoadingComp, setLoadState] = useState(true);

    const getUserLocks = () => {
        return lockData.filter(i => i.lockOwner === accounts[0]);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setEvents(getUserLocks);
            setLoadState(false);
        }, 1000);
        // cleanup hook
        return () => {
            clearInterval(interval);
        };
    });

    return (
        <div className={classes.lockListPage}>
            {isLoadingComp ? (
                <CircularProgress />
            ) : (
                <>
                    {lockEvents.length > 0 ? (
                        <>
                            <h1>Your Locks</h1>
                            <h3>{getTotalLockVal(lockEvents)} ETH locked</h3>
                            <List className={classes.listRoot} subheader={<li />}>
                                <li className={classes.listSection}>
                                    <ul className={classes.ul}>
                                        <ListSubheader>You have {lockEvents.length} locks</ListSubheader>
                                        <Divider />
                                        {lockEvents.map(eventItem => (
                                            <>
                                                <UnlockInfo lockInfo={eventItem} web3={web3} address={accounts[0]} />
                                                <Divider />
                                            </>
                                        ))}
                                    </ul>
                                </li>
                            </List>
                        </>
                    ) : (
                        <>
                            <h1>No Locks</h1>
                            <h4>Please lock some ETH!</h4>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

// the individual lock item
const UnlockInfo: React.FC<UnlockInfoProps> = ({ lockInfo, web3, address }) => {
    const classes = useStyles();
    // 24 hours in epoch
    const epochDayMil = 86400000;

    const getUnlockDate = useCallback(() => {
        // Ethereum timestamp is in seconds while JS Date is ms
        const lockedDay = Number(lockInfo.timestamp) * 1000;
        // locked date + lock duration(epoch)
        const unlockDate = lockedDay + lockInfo.duration * epochDayMil;

        return unlockDate;
    }, [lockInfo]);

    const calculateTimeLeft = useCallback(() => {
        // milliseconds left till unlock
        const tillEnd = getUnlockDate() - +Date.now();
        return {
            days: Math.floor(tillEnd / (1000 * 60 * 60 * 24)),
            hours: Math.floor((tillEnd / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((tillEnd / 1000 / 60) % 60),
            seconds: Math.floor((tillEnd / 1000) % 60),
        };
    }, [getUnlockDate]);

    const [canUnlock, setLockState] = useState(false);
    const [tillUnlock, setUnlockDate] = useState<TimeFormat>(calculateTimeLeft());
    const [unlocked, setUnlockState] = useState(false);
    const [isLoading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [publicKey, setPublicKey] = useState('');
    const [isSigning, setIsSigning] = useState(false);

    const checkUnlock = useCallback(async () => {
        // get today in UTC epoch seconds (js default is ms)
        const today = Date.now();

        // Ethereum timestamp is in seconds while JS Date is ms
        const lockedDay = Number(lockInfo.timestamp) * 1000;

        const unlockDate = lockedDay + lockInfo.duration * epochDayMil;

        // get contract balance
        const lockBalance = await web3.eth.getBalance(lockInfo.lock);
        // check if the balance is 0 or not
        const lockClaimState = lockBalance === '0';
        // console.log(lockBalance);
        setUnlockState(lockClaimState);
        // manually change the loading state
        setLoading(false);
        return today > unlockDate;
    }, [lockInfo, web3]);

    // update time value every second
    useEffect(() => {
        //const abortController = new AbortController();

        const interval = setInterval(async () => {
            setUnlockDate(calculateTimeLeft());
            setLockState(await checkUnlock());
        }, 1000);
        // cleanup async hook
        return () => {
            clearInterval(interval);
        };
    }, [calculateTimeLeft, checkUnlock]);

    // initial update
    useEffect(() => {
        setUnlockDate(calculateTimeLeft());
        checkUnlock().then(setLockState);
    }, [calculateTimeLeft, checkUnlock]);

    const handleClick = () => {
        setLoading(true);
        web3.eth
            .sendTransaction({
                from: address,
                to: lockInfo.lock,
                value: '0',
            })
            .then(
                () => {
                    setLoading(false);
                },
                error => {
                    console.log(error);
                    setLoading(false);
                },
            );
    };

    const obtainPublicKey = async () => {
        setIsSigning(true);
        const pubKey = await getPubKey(web3, 'sign to view plasm lock parameters');
        if (typeof pubKey === 'string') {
            setPublicKey(pubKey);
        }
        setIsSigning(false);
    };

    const realTimeParam = {
        type: '1',
        transactionHash: lockInfo.transactionHash,
        publicKey: publicKey,
        duration: (lockInfo.duration * epochDayMil) / 1000,
        value: lockInfo.eth.toString(),
    };

    const PrettyPrintJson = () => (
        <div>
            <pre>{JSON.stringify(realTimeParam, null, 2)}</pre>
        </div>
    );

    const showLockData = () => {
        setShowModal(true);
    };

    return (
        <>
            <IonLoading isOpen={isSigning} message={'Verifying user...'} />
            <IonModal isOpen={showModal} cssClass="my-custom-class">
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Lock Information</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={() => setShowModal(false)}>Close</IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <div>
                    <IonCard>
                        <IonCardHeader>
                            <IonCardSubtitle>General information about your lock</IonCardSubtitle>
                            <IonCardTitle>Lock Overview</IonCardTitle>
                        </IonCardHeader>

                        <IonCardContent>
                            <h5>Lock address: {lockInfo.lock}</h5>
                            <h5>Locked Amount: {Web3Utils.fromWei(lockInfo.eth, 'ether')}</h5>
                            <p>
                                Locked in block no. {lockInfo.blockNo} for {lockInfo.duration} days
                            </p>
                            <p>Locked in: {moment.unix(parseInt(lockInfo.timestamp)).toISOString()} UTC</p>
                            <p>Block hash: {lockInfo.blockHash}</p>
                        </IonCardContent>
                    </IonCard>
                    <IonCard>
                        <IonCardHeader>
                            <IonCardSubtitle>Real-time lockdrop claim parameter</IonCardSubtitle>
                            <IonCardTitle>Raw Data</IonCardTitle>
                        </IonCardHeader>

                        <IonCardContent>
                            {publicKey ? (
                                <>
                                    <PrettyPrintJson />
                                </>
                            ) : (
                                <IonButton onClick={() => obtainPublicKey()}>View Lock Claim Parameter</IonButton>
                            )}
                        </IonCardContent>
                    </IonCard>
                </div>
            </IonModal>
            <ListItem key={lockInfo.lock}>
                <Grid container spacing={4} alignItems="center">
                    <Grid item xs={9}>
                        <ListItemText>
                            <h5>Lock address: {lockInfo.lock}</h5>
                            <p>
                                Locked {Web3Utils.fromWei(lockInfo.eth, 'ether')} ETH for {lockInfo.duration} days
                            </p>
                            {lockInfo.introducer !== defaultAddress ? (
                                <p>Introducer: {lockInfo.introducer}</p>
                            ) : (
                                <p>No introducer</p>
                            )}
                            {isLoading ? (
                                <>
                                    <LinearProgress />
                                </>
                            ) : (
                                <>
                                    {!canUnlock ? (
                                        <Grid container spacing={1}>
                                            <Grid item>
                                                <p>{tillUnlock.days} Days </p>
                                            </Grid>
                                            <Grid item>
                                                <p>{tillUnlock.hours} Hours </p>
                                            </Grid>
                                            <Grid item>
                                                <p>{tillUnlock.minutes} Minutes </p>
                                            </Grid>
                                            <Grid item>
                                                <p>{tillUnlock.seconds} Seconds </p>
                                            </Grid>
                                            <Grid item>
                                                <p>Left</p>
                                            </Grid>
                                        </Grid>
                                    ) : unlocked ? (
                                        <p>Lock already unlocked!</p>
                                    ) : (
                                        <p>You can unlocked your lock!</p>
                                    )}
                                </>
                            )}
                        </ListItemText>
                    </Grid>
                    <Grid item>
                        <ListItemSecondaryAction className={classes.itemButtons}>
                            {unlocked ? (
                                <LockOpenIcon color="disabled" />
                            ) : canUnlock ? (
                                <IconButton
                                    edge="end"
                                    aria-label="unlock"
                                    onClick={() => handleClick()}
                                    color="primary"
                                >
                                    <LockOpenIcon />
                                </IconButton>
                            ) : (
                                <LockIcon color="inherit" />
                            )}
                            <IconButton edge="end" aria-label="raw-data" onClick={() => showLockData()} color="primary">
                                <CodeIcon />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </Grid>
                </Grid>
            </ListItem>
        </>
    );
};

export default CurrentLocks;
