/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import {
    defaultAddress,
    getAllLockEvents,
    getCurrentAccountLocks,
    getTotalLockVal,
} from '../helpers/lockdrop/EthereumLockdrop';
//import * as ethAddress from 'ethereum-address';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import SectionCard from '../components/SectionCard';
import { LockEvent, TimeFormat } from '../models/LockdropModels';
import { createStyles, Theme, makeStyles, useTheme } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import { Divider, Grid, ListItemSecondaryAction, IconButton } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import SwipeableViews from 'react-swipeable-views';
import LockIcon from '@material-ui/icons/Lock';
import LockOpenIcon from '@material-ui/icons/LockOpen';

interface TabPanelProps {
    children?: React.ReactNode;
    dir?: string;
    index: any;
    value: any;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <Typography
            component="div"
            role="tabpanel"
            hidden={value !== index}
            id={`full-width-tabpanel-${index}`}
            aria-labelledby={`full-width-tab-${index}`}
            {...other}
        >
            {value === index && <Box p={3}>{children}</Box>}
        </Typography>
    );
}

function a11yProps(index: any) {
    return {
        id: `full-width-tab-${index}`,
        'aria-controls': `full-width-tabpanel-${index}`,
    };
}

const useStyles = makeStyles((theme: Theme) =>
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
    }),
);

interface LockHistoryProps {
    web3: Web3;
    contractInstance: Contract;
    accounts: string[]; // this will be used to get locks for a certain account
}
// component that displays the number of tokens and the duration for the lock via Web3
const LockedEthList: React.FC<LockHistoryProps> = ({ web3, contractInstance, accounts }) => {
    const classes = useStyles();
    const theme = useTheme();
    const [value, setValue] = React.useState(0);

    const handleChange = (_event: React.ChangeEvent<{}>, newValue: number) => {
        setValue(newValue);
    };

    const handleChangeIndex = (index: number) => {
        setValue(index);
    };

    return (
        <>
            <SectionCard maxWidth="lg">
                <div className={classes.tabMenu}>
                    <AppBar position="static" color="inherit">
                        <Tabs
                            value={value}
                            onChange={handleChange}
                            indicatorColor="primary"
                            textColor="primary"
                            variant="fullWidth"
                            aria-label="full width tabs"
                        >
                            <Tab label="Locked Tokens" {...a11yProps(0)} />
                            <Tab label="Unlock Tokens" {...a11yProps(1)} />
                        </Tabs>
                    </AppBar>
                    <SwipeableViews
                        axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
                        index={value}
                        onChangeIndex={handleChangeIndex}
                    >
                        <TabPanel value={value} index={0} dir={theme.direction}>
                            <GlobalLocks web3={web3} contractInstance={contractInstance} accounts={accounts} />
                        </TabPanel>
                        <TabPanel value={value} index={1} dir={theme.direction}>
                            <CurrentLocks web3={web3} contractInstance={contractInstance} accounts={accounts} />
                        </TabPanel>
                    </SwipeableViews>
                </div>
            </SectionCard>
        </>
    );
};

export default LockedEthList;

const GlobalLocks: React.FC<LockHistoryProps> = ({ web3, contractInstance }) => {
    const classes = useStyles();
    const [lockEvents, setEvents] = useState<LockEvent[]>([]);

    const updateList = async () => {
        await getAllLockEvents(web3, contractInstance).then(i => {
            setEvents(i);
        });
    };

    useEffect(() => {
        const abortController = new AbortController();
        // update list every second
        setTimeout(async () => {
            await updateList();
        }, 1000);

        // cleanup async hook
        return () => {
            abortController.abort();
        };
    }, [lockEvents]);

    return (
        <div className={classes.lockListPage}>
            {lockEvents.length > 0 ? (
                <>
                    <h1>Global Locks</h1>
                    <h3>{getTotalLockVal(lockEvents, web3)} ETH locked</h3>
                    <List className={classes.listRoot} subheader={<li />}>
                        <li className={classes.listSection}>
                            <ul className={classes.ul}>
                                <ListSubheader>There are {lockEvents.length} locks</ListSubheader>
                                <Divider />
                                {lockEvents.map(eventItem => (
                                    <>
                                        <ListItem key={eventItem.lock}>
                                            <ListItemText>
                                                <h4>Lock address: {eventItem.lock}</h4>
                                                <h5>Locked in block no. {eventItem.blockNo}</h5>
                                                <p>
                                                    Locked {web3.utils.fromWei(eventItem.eth, 'ether')} ETH for{' '}
                                                    {eventItem.duration} days
                                                </p>
                                                {eventItem.introducer !== defaultAddress ? (
                                                    <p>Introducer: {eventItem.introducer}</p>
                                                ) : (
                                                    <p>No introducer</p>
                                                )}
                                            </ListItemText>
                                        </ListItem>
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
        </div>
    );
};

const CurrentLocks: React.FC<LockHistoryProps> = ({ web3, contractInstance, accounts }) => {
    const classes = useStyles();
    const [lockEvents, setEvents] = useState<LockEvent[]>([]);

    const updateList = async () => {
        await getCurrentAccountLocks(web3, accounts[0], contractInstance).then(i => {
            setEvents(i);
        });
    };

    useEffect(() => {
        const abortController = new AbortController();
        // update list every second
        setTimeout(async () => {
            await updateList();
        }, 1000);

        // cleanup async hook
        return () => {
            abortController.abort();
        };
    }, [lockEvents]);

    return (
        <div className={classes.lockListPage}>
            {lockEvents.length > 0 ? (
                <>
                    <h1>Your Locks</h1>
                    <h3>{getTotalLockVal(lockEvents, web3)} ETH locked</h3>
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
        </div>
    );
};

interface UnlockInfoProps {
    lockInfo: LockEvent;
    web3: Web3;
    address: string;
}

const UnlockInfo: React.FC<UnlockInfoProps> = ({ lockInfo, web3, address }) => {
    // 24 hours in epoch date
    const epochDayMil = 86400000;

    const getUnlockDate = () => {
        // Ethereum timestamp is in seconds while JS Date is ms
        const lockedDay = Number(lockInfo.timestamp) * 1000;

        const unlockDate = lockedDay + lockInfo.duration * epochDayMil;

        return unlockDate;
    };

    const calculateTimeLeft = () => {
        // milliseconds left till unlock
        const tillEnd = getUnlockDate() - +Date.now();
        return {
            days: Math.floor(tillEnd / (1000 * 60 * 60 * 24)),
            hours: Math.floor((tillEnd / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((tillEnd / 1000 / 60) % 60),
            seconds: Math.floor((tillEnd / 1000) % 60),
        };
    };

    const checkUnlock = () => {
        // get today in UTC epoch seconds (js default is ms)
        const today = Date.now();

        // Ethereum timestamp is in seconds while JS Date is ms
        const lockedDay = Number(lockInfo.timestamp) * 1000;

        const unlockDate = lockedDay + lockInfo.duration * epochDayMil;

        return today > unlockDate;
    };

    const [canUnlock, setLockState] = useState(checkUnlock());
    const [tillUnlock, setUnlockDate] = useState<TimeFormat>(calculateTimeLeft());

    // update time value every second
    useEffect(() => {
        setTimeout(() => {
            setUnlockDate(calculateTimeLeft());
            setLockState(checkUnlock());
        }, 1000);
    });

    const handleClick = () => {
        web3.eth.sendTransaction({
            from: address,
            to: lockInfo.lock,
            value: '0',
        });
    };

    return (
        <>
            <ListItem key={lockInfo.lock}>
                <ListItemText>
                    <h4>Lock address: {lockInfo.lock}</h4>
                    <h5>Locked in block no. {lockInfo.blockNo}</h5>
                    <p>
                        Locked {web3.utils.fromWei(lockInfo.eth, 'ether')} ETH for {lockInfo.duration} days
                    </p>
                    {lockInfo.introducer !== defaultAddress ? (
                        <p>Introducer: {lockInfo.introducer}</p>
                    ) : (
                        <p>No introducer</p>
                    )}
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
                    ) : (
                        <p>Lock Ended!</p>
                    )}
                </ListItemText>
                {/* <IonButton onClick={() => handleClick()} disabled={!canUnlock}>
                    Unlock
                </IonButton> */}
                <ListItemSecondaryAction>
                    {canUnlock ? (
                        <IconButton edge="end" aria-label="unlock" onClick={() => handleClick()} color="primary">
                            <LockOpenIcon />
                        </IconButton>
                    ) : (
                        <LockIcon color="inherit" />
                    )}
                </ListItemSecondaryAction>
            </ListItem>
        </>
    );
};
