/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { firstEthIntroducer, defaultAddress } from '../../data/affiliationProgram';
import { LockEvent } from '../../types/LockdropModels';
import { PlmDrop } from '../../types/PlasmDrop';
import { calculateTotalPlm } from '../../helpers/lockdrop/EthereumLockdrop';
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
import SectionCard from '../SectionCard';

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

const AffiliationList: React.FC<Props> = ({ lockData }) => {
    const classes = useStyles();
    const [lockdropResult, setLockdropResult] = useState<PlmDrop[]>([]);

    function getAffiliationResults(lockData: LockEvent[]) {
        // filter out the 0x00 address from the list
        const validAddresses = firstEthIntroducer.filter(address => address !== defaultAddress);

        // get the lockdrop result
        const lockResults = validAddresses.map(i => {
            return calculateTotalPlm(i, lockData);
        });

        // sort the array by the number of references
        return lockResults.sort((a, b) =>
            a.affiliationRefsBonuses.length > b.affiliationRefsBonuses.length
                ? -1
                : a.affiliationRefsBonuses.length < b.affiliationRefsBonuses.length
                ? 1
                : 0,
        );
    }

    useEffect(() => {
        setLockdropResult(getAffiliationResults(lockData));
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
                            <ListSubheader>There are {firstEthIntroducer.length - 1} introducers</ListSubheader>
                            <Divider />
                            {lockdropResult.map(i => (
                                <IntroducerBonusesItems key={i.receiver} lockResult={i} />
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
                    <h2>{lockResult.receiver}</h2>
                    <p>{lockResult.affiliationRefsBonuses.length} lock(s) referenced this address</p>
                    <p>{lockResult.getAffBonus()} PLMs gained from this</p>
                </ListItemText>
            </ListItem>
            <Divider />
        </>
    );
};

export default AffiliationList;
