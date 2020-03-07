/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { getLockEvents, defaultAddress } from '../helpers/lockdrop/EthereumLockdrop';
//import * as ethAddress from 'ethereum-address';
import Web3 from 'web3';
import SectionCard from '../components/SectionCard';
import { LockEvent } from '../models/LockdropModels';
import { createStyles, Theme, makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import { Divider } from '@material-ui/core';
import BigNumber from 'bignumber.js';

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
    }),
);

interface LockHistroyProps {
    web3: Web3;
    accounts: string[];
}
// component that displays the number of tokens and the duration for the lock via Web3
const LockedEthList: React.FC<LockHistroyProps> = ({ web3, accounts }) => {
    const classes = useStyles();
    const [lockEvents, setEvents] = useState<LockEvent[]>([]);

    const updateList = () => {
        getLockEvents(web3, accounts[0]).then(setEvents);
    };

    const getTotalLockVal = (locks: LockEvent[]): string => {
        let totalVal = new BigNumber(0);
        if (locks.length > 0) {
            locks.forEach(i => {
                const currentEth = new BigNumber(i.eth.toString());
                totalVal = totalVal.plus(currentEth);
            });
        }
        return web3.utils.fromWei(totalVal.toString(), 'ether');
    };

    // update list when the component mounts
    // useEffect(() => {
    //     updateList();
    // }, []);

    useEffect(() => {
        setTimeout(() => {
            updateList();
        }, 1000);
    });

    return (
        <>
            <SectionCard maxWidth="lg">
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
            </SectionCard>
        </>
    );
};

export default LockedEthList;
