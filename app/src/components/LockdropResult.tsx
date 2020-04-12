/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { calculateTotalPlm, getCurrentUsdRate } from '../helpers/lockdrop/EthereumLockdrop';
import { PlmDrop } from '../models/PlasmDrop';
import BigNumber from 'bignumber.js';
import CountUp from 'react-countup';
import { femtoToPlm } from '../helpers/plasmUtils';

const LockdropResult: React.FC = () => {
    const useStyles = makeStyles((theme: Theme) =>
        createStyles({
            pageContent: {
                textAlign: 'center',
                padding: theme.spacing(4, 0, 0),
            },
        }),
    );

    const classes = useStyles();
    const [totalPlm, setTotalPlm] = useState<PlmDrop>(new PlmDrop(new BigNumber(0), [], [], []));
    const [exRate, setExRate] = useState(0);
    //const [ethAccounts, setEthAccounts] = useState(['']);

    useEffect(() => {
        setTimeout(async () => {
            setExRate(await getCurrentUsdRate());
            const accounts = await window.web3.eth.getAccounts();
            const totalIssue = await calculateTotalPlm(accounts[0]);
            setTotalPlm(totalIssue);
        }, 1000);
    }, []);

    const countupTotalPlmVal: JSX.Element = (
        <CountUp
            start={0}
            end={new BigNumber(totalPlm.getTotalPlm()).toNumber()}
            decimals={15}
            duration={1}
            separator=","
        />
    );

    return (
        <div className={classes.pageContent}>
            <h1>Lockdrop Result</h1>
            <h2>{countupTotalPlmVal} PLM in total</h2>

            <p>You have locked {totalPlm.locks.length} time(s)</p>
            <p>The rate for 1 ETH to USD at the end of the lockdrop: {exRate} USD</p>
            <p>You have received around {femtoToPlm(totalPlm.basePlm).toFixed()} PLM from locking</p>

            <h3>Affiliation Program</h3>
            <p>
                {totalPlm.affiliationRefs.length} locks referenced your address as a introducer:{' '}
                {totalPlm.calculateAffBonus} PLM
            </p>
            <p>
                You have referenced {totalPlm.introducerBonuses.length} introducers: {totalPlm.calculateIntroBonus} PLM
            </p>

            <h3></h3>
        </div>
    );
};

export default LockdropResult;
