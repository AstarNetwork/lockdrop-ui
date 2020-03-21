/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { defaultAddress, getLockEvents } from '../helpers/lockdrop/EthereumLockdrop';
//import * as ethAddress from 'ethereum-address';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import SectionCard from '../components/SectionCard';
import { LockEvent } from '../models/LockdropModels';
import { createStyles, Theme, makeStyles, useTheme } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import { Divider } from '@material-ui/core';
import BigNumber from 'bignumber.js';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import SwipeableViews from 'react-swipeable-views';
import { IonButton } from '@ionic/react';

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
    accounts?: string[]; // this will be used to get locks for a certain account
}
// component that displays the number of tokens and the duration for the lock via Web3
const LockedEthList: React.FC<LockHistoryProps> = ({ web3, contractInstance }) => {
    const classes = useStyles();
    const [lockEvents, setEvents] = useState<LockEvent[]>([]);
    const theme = useTheme();
    const [value, setValue] = React.useState(0);

    const handleChange = (_event: React.ChangeEvent<{}>, newValue: number) => {
        setValue(newValue);
    };

    const handleChangeIndex = (index: number) => {
        setValue(index);
    };

    const updateList = () => {
        getLockEvents(web3, contractInstance).then(i => setEvents(i));
    };

    const getTotalLockVal = (locks: LockEvent[]): string => {
        let totalVal = new BigNumber(0);
        if (locks.length > 0) {
            locks.forEach(i => {
                const currentEth = new BigNumber(i.eth.toString());
                totalVal = totalVal.plus(currentEth);
            });
        }
        return web3.utils.fromWei(totalVal.toFixed(), 'ether');
    };

    useEffect(() => {
        setTimeout(() => {
            updateList();
        }, 1000);
    });
    return (
        <>
            <SectionCard maxWidth="lg">
                <div className={classes.tabMenu}>
                    <AppBar position="static" color="default">
                        <Tabs
                            value={value}
                            onChange={handleChange}
                            indicatorColor="primary"
                            textColor="primary"
                            variant="fullWidth"
                            aria-label="full width tabs example"
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
                            <div className={classes.lockListPage}>
                                {lockEvents.length > 0 ? (
                                    <>
                                        <h1>Global Locks</h1>
                                        <h3>{getTotalLockVal(lockEvents)} ETH locked</h3>
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
                                                                        Locked{' '}
                                                                        {web3.utils.fromWei(eventItem.eth, 'ether')} ETH
                                                                        for {eventItem.duration} days
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
                        </TabPanel>
                        <TabPanel value={value} index={1} dir={theme.direction}>
                            <div className={classes.lockListPage}>
                                {lockEvents.length > 0 ? (
                                    <>
                                        <h1>Your Locks</h1>
                                        <h3>{getTotalLockVal(lockEvents)} ETH locked</h3>
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
                                                                        Locked{' '}
                                                                        {web3.utils.fromWei(eventItem.eth, 'ether')} ETH
                                                                        for {eventItem.duration} days
                                                                    </p>
                                                                    {eventItem.introducer !== defaultAddress ? (
                                                                        <p>Introducer: {eventItem.introducer}</p>
                                                                    ) : (
                                                                        <p>No introducer</p>
                                                                    )}
                                                                </ListItemText>
                                                                <IonButton>Unlock</IonButton>
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
                        </TabPanel>
                    </SwipeableViews>
                </div>
            </SectionCard>
        </>
    );
};

export default LockedEthList;
