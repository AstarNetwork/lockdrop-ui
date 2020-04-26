/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { validEthAddressList, defaultAddress } from '../data/affiliationProgram';
import { LockEvent } from '../models/LockdropModels';
import { PlmDrop } from '../models/PlasmDrop';
import { calculateTotalPlm } from '../helpers/lockdrop/EthereumLockdrop';
import {
    List,
    ListItemText,
    ListSubheader,
    Divider,
    ListItem,
    makeStyles,
    createStyles,
    Theme,
    Typography,
} from '@material-ui/core';
import SectionCard from './SectionCard';

interface Props {
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
            padding: 0,
        },
        title: {
            textAlign: 'center',
            padding: theme.spacing(4, 2, 0),
        },
    }),
);

const AffiliatorList: React.FC<Props> = ({ lockData }) => {
    const classes = useStyles();
    const [lockdropResult, setLockdropResult] = useState<PlmDrop[]>([]);

    function getAffliationResults(lockData: LockEvent[]) {
        // filter out the 0x00 address from the list
        const validAddresses = validEthAddressList.filter(address => address !== defaultAddress);

        // get the lockdrop result infromation
        const lockResults = validAddresses.map(i => {
            return calculateTotalPlm(i, lockData);
        });

        // sort the array by the number of referencers
        return lockResults.sort((a, b) =>
            a.affiliationRefsBonuses.length > b.affiliationRefsBonuses.length
                ? -1
                : a.affiliationRefsBonuses.length < b.affiliationRefsBonuses.length
                ? 1
                : 0,
        );
    }

    useEffect(() => {
        setLockdropResult(getAffliationResults(lockData));
    }, [lockData]);

    return (
        <>
            <SectionCard maxWidth="lg">
                <Typography className={classes.title} variant="h3">
                    Affiliation Leaderboard
                </Typography>
                <List component="nav" className={classes.listRoot} subheader={<li />}>
                    <li className={classes.listSection}>
                        <ul className={classes.ul}>
                            <ListSubheader>There are {validEthAddressList.length - 1} affiliators</ListSubheader>
                            <Divider />
                            {lockdropResult.map(i => (
                                <IntroducerBonusesItems key={i.reciver} lockResult={i} />
                            ))}
                        </ul>
                    </li>
                </List>
            </SectionCard>
        </>
    );
};

interface IntroducerPlanelProps {
    lockResult: PlmDrop;
}

const IntroducerBonusesItems: React.FC<IntroducerPlanelProps> = ({ lockResult }) => {
    return (
        <>
            <ListItem>
                <ListItemText>
                    <h2>{lockResult.reciver}</h2>
                    <p>{lockResult.affiliationRefsBonuses.length} lock(s) referenced this address</p>
                    <p>{lockResult.getAffBonus()} PLMs gained from this</p>
                </ListItemText>
            </ListItem>
            <Divider />
        </>
    );
};

export default AffiliatorList;
