/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { makeStyles, createStyles, Theme, CircularProgress, Divider } from '@material-ui/core';
import { calculateTotalPlm, getCurrentUsdRate } from '../helpers/lockdrop/EthereumLockdrop';
import { PlmDrop } from '../models/PlasmDrop';
import BigNumber from 'bignumber.js';
import CountUp from 'react-countup';
import { femtoToPlm } from '../helpers/plasmUtils';
import { ThemeColors } from '../theme/themes';

const LockdropResult: React.FC = () => {
    const useStyles = makeStyles((theme: Theme) =>
        createStyles({
            pageContent: {
                textAlign: 'center',
                padding: theme.spacing(4, 2, 0),
            },
            header: {
                color: ThemeColors.blue,
            },
        }),
    );

    const classes = useStyles();
    const [totalPlm, setTotalPlm] = useState<PlmDrop>(new PlmDrop(new BigNumber(0), [], [], []));
    const [exRate, setExRate] = useState(0);
    const [isLoading, setLoadState] = useState(true);

    useEffect(() => {
        setTimeout(async () => {
            setExRate(await getCurrentUsdRate());
            const accounts = await window.web3.eth.getAccounts();
            const totalIssue = await calculateTotalPlm(accounts[0]);
            setTotalPlm(totalIssue);

            setLoadState(false);
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
            {isLoading ? (
                <>
                    <CircularProgress />
                </>
            ) : totalPlm.locks.length > 0 ? (
                <>
                    <h2 className={classes.header}>{countupTotalPlmVal} PLM in total</h2>
                    <p>You have locked {totalPlm.locks.length} time(s)</p>
                    <p>ETH exchange rate at the end of the lockdrop: {exRate} USD</p>
                    <p>You have received around {femtoToPlm(totalPlm.basePlm).toFormat(2)} PLM from locking</p>
                    <Divider />
                    <h2>Affiliation Program</h2>
                    <p>
                        {totalPlm.affiliationRefs.length} locks referenced your address as a introducer:{' '}
                        {totalPlm.calculateAffBonus().toFixed()} PLM
                    </p>
                    <p>
                        You have referenced {totalPlm.introducerBonuses.length} introducers:{' '}
                        {totalPlm.calculateIntroBonus().toFixed()} PLM
                    </p>
                    <h3></h3>
                </>
            ) : (
                <h2 className={classes.header}>No Locks found for your address!</h2>
            )}
        </div>
    );
};

export default LockdropResult;
