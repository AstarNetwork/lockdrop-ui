/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback } from 'react';
import { getTotalLockVal } from '../../helpers/lockdrop/EthereumLockdrop';
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
import { defaultAddress } from '../../data/affiliationProgram';
import Web3Utils from 'web3-utils';
import { toast } from 'react-toastify';
import Skeleton from '@material-ui/lab/Skeleton';
import BigNumber from 'bignumber.js';
import { useEth } from '../../contexts/Web3Api';

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
    lockData: LockEvent[];
    onClickRefresh?: () => Promise<void>;
}

interface UnlockInfoProps {
    lockInfo: LockEvent;
    onClickRefresh?: () => Promise<void>;
}
// displays a list of locks tha the current user has locked
const CurrentLocks: React.FC<CurrentLockProps> = ({ lockData, onClickRefresh }) => {
    const { account } = useEth();
    const classes = useStyles();
    const [lockEvents, setEvents] = useState<LockEvent[]>(lockData.filter(i => i.lockOwner === account));

    useEffect(() => {
        setEvents(lockData.filter(i => i.lockOwner === account));
    }, [lockData, account]);

    return (
        <div className={classes.lockListPage}>
            {lockEvents.length > 0 ? (
                <>
                    <h1>Your Locks</h1>
                    <h3>{getTotalLockVal(lockEvents)} ETH locked</h3>
                    <List className={classes.listRoot} subheader={<li />}>
                        <li className={classes.listSection}>
                            <ul className={classes.ul}>
                                <ListSubheader>You have {lockEvents.length} locks</ListSubheader>
                                <Divider />
                                {lockEvents.map((eventItem, index) => (
                                    <div key={index}>
                                        <UnlockInfo lockInfo={eventItem} onClickRefresh={onClickRefresh} />
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
        </div>
    );
};

// the individual lock item
const UnlockInfo: React.FC<UnlockInfoProps> = ({ lockInfo, onClickRefresh }) => {
    const classes = useStyles();
    // 24 hours in epoch
    const epochDayMil = 86400000;
    const { web3, account } = useEth();

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
    const [balanceLoaded, setBalanceLoaded] = useState(false);
    const [lockVal, setLockVal] = useState<BigNumber>();

    const checkUnlock = useCallback(() => {
        // get today in UTC epoch seconds (js default is ms)
        const today = Date.now();

        // Ethereum timestamp is in seconds while JS Date is ms
        const lockedDay = Number(lockInfo.timestamp) * 1000;

        const unlockDate = lockedDay + lockInfo.duration * epochDayMil;

        // check if the balance is 0 or not
        const lockClaimState = typeof lockVal !== 'undefined' && lockVal.isLessThanOrEqualTo(new BigNumber(0));
        // console.log(lockBalance);
        setUnlockState(lockClaimState);
        return today > unlockDate;
    }, [lockInfo, lockVal]);

    // update time value every second
    useEffect(() => {
        const interval = setInterval(() => {
            setUnlockDate(calculateTimeLeft());
            setLockState(checkUnlock());
        }, 1000);
        // cleanup async hook
        return () => {
            clearInterval(interval);
        };
    }, [calculateTimeLeft, checkUnlock]);

    const fetchBalance = useCallback(async () => {
        const bal = await web3.eth.getBalance(lockInfo.lock);
        return new BigNumber(bal);
    }, [lockInfo.lock, web3.eth]);

    // initial update
    useEffect(() => {
        (async () => {
            const bal = await fetchBalance();
            setLockVal(bal);
        })()
            .catch(e => {
                console.log(e);
                toast.error(e.message);
            })
            .finally(() => {
                setUnlockDate(calculateTimeLeft());
                checkUnlock();
                setBalanceLoaded(true);
            });
        // eslint-disable-next-line
    }, []);

    // click unlock ETH
    const handleClick = useCallback(async () => {
        setLoading(true);
        try {
            await web3.eth.sendTransaction({
                from: account,
                to: lockInfo.lock,
                value: '0',
            });
            onClickRefresh && (await onClickRefresh());
            const bal = await fetchBalance();
            setLockVal(bal);
        } catch (e) {
            console.log(e);
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
        // we don't want to add web3 in here
        // eslint-disable-next-line
    }, [account, lockInfo.lock]);

    return (
        <>
            <ListItem>
                {balanceLoaded ? (
                    <>
                        <Grid container spacing={4} alignItems="center">
                            <Grid item xs={9}>
                                <ListItemText>
                                    <h5>Lock address: {lockInfo.lock}</h5>
                                    <p>
                                        Locked {Web3Utils.fromWei(lockInfo.eth.toFixed(), 'ether')} ETH for{' '}
                                        {lockInfo.duration} days
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
                                                disabled={isLoading}
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
                    </>
                ) : (
                    <>
                        <Grid container spacing={4} alignItems="center">
                            <Grid item xs={9}>
                                <ListItemText>
                                    <Skeleton animation="wave" variant="text" />
                                    <Skeleton animation="wave" variant="text" />
                                    <Skeleton animation="wave" variant="text" />
                                </ListItemText>
                            </Grid>
                            <Grid item>
                                <ListItemSecondaryAction className={classes.itemButtons}>
                                    <Skeleton animation="wave" variant="circle" width={40} height={40} />
                                </ListItemSecondaryAction>
                            </Grid>
                        </Grid>
                    </>
                )}
            </ListItem>
        </>
    );
};

export default CurrentLocks;
