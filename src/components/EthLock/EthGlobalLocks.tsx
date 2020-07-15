/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */

import React, { useState, useEffect } from 'react';
import { getTotalLockVal } from '../../helpers/lockdrop/EthereumLockdrop';
import { LockEvent } from '../../types/LockdropModels';
import { createStyles, Theme, makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import { Divider } from '@material-ui/core';
import CircularProgress from '@material-ui/core/CircularProgress';
import { defaultAddress } from '../../data/affiliationProgram';
import Web3Utils from 'web3-utils';

interface LockHistoryProps {
    lockData: LockEvent[];
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
            padding: theme.spacing(1, 2),
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

const GlobalLocks: React.FC<LockHistoryProps> = ({ lockData }) => {
    const classes = useStyles();
    const [lockEvents, setEvents] = useState<LockEvent[]>([]);
    const [isLoadingComp, setLoadState] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setEvents(lockData);
        }, 1000);
        // cleanup hook
        return () => {
            clearInterval(interval);
        };
    }, [lockData]);

    useEffect(() => {
        setEvents(lockData);
        setLoadState(false);
    }, [lockData]);

    return (
        <div className={classes.lockListPage}>
            {isLoadingComp ? (
                <CircularProgress />
            ) : (
                <>
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
                                                            Locked {Web3Utils.fromWei(eventItem.eth, 'ether')} ETH for{' '}
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
                </>
            )}
        </div>
    );
};

export default GlobalLocks;
