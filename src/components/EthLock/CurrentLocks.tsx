/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback } from 'react';
import { getTotalLockVal } from '../../helpers/lockdrop/EthereumLockdrop';
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
    Tooltip,
} from '@material-ui/core';
import LockIcon from '@material-ui/icons/Lock';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import CircularProgress from '@material-ui/core/CircularProgress';
import { defaultAddress } from '../../data/affiliationProgram';
import Web3Utils from 'web3-utils';
import * as polkadotCryptoUtils from '@polkadot/util-crypto';

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

    useEffect(() => {
        setEvents(lockData.filter(i => i.lockOwner === accounts[0]));
        setLoadState(false);
    }, [lockData, accounts]);

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
                                            <div key={polkadotCryptoUtils.randomAsHex(5)}>
                                                <UnlockInfo lockInfo={eventItem} web3={web3} address={accounts[0]} />
                                                <Divider />
                                            </div>
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
        return today > unlockDate;
    }, [lockInfo, web3]);

    // update time value every second
    useEffect(() => {
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

    // click unlock ETH
    const handleClick = () => {
        setLoading(true);
        web3.eth
            .sendTransaction({
                from: address,
                to: lockInfo.lock,
                value: '0',
            })
            .catch(error => {
                console.log(error);
            })
            .finally(() => {
                // get contract balance
                web3.eth
                    .getBalance(lockInfo.lock)
                    .then(lockBalance => {
                        // check if the balance is 0 or not
                        const lockClaimState = lockBalance === '0';

                        setUnlockState(lockClaimState);
                    })
                    .catch(err => {
                        console.log(err);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            });
    };

    return (
        <>
            <ListItem>
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
                                <Tooltip title="Click to unlock" aria-label="unlock">
                                    <IconButton
                                        edge="end"
                                        aria-label="unlock"
                                        onClick={() => handleClick()}
                                        color="primary"
                                    >
                                        <LockOpenIcon />
                                    </IconButton>
                                </Tooltip>
                            ) : (
                                <LockIcon color="inherit" />
                            )}
                        </ListItemSecondaryAction>
                    </Grid>
                </Grid>
            </ListItem>
        </>
    );
};

export default CurrentLocks;
