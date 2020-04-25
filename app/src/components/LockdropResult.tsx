/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { makeStyles, createStyles, Theme, CircularProgress, Divider } from '@material-ui/core';
import { calculateTotalPlm, ethFinalExRate } from '../helpers/lockdrop/EthereumLockdrop';
import { PlmDrop } from '../models/PlasmDrop';
import BigNumber from 'bignumber.js';
import CountUp from 'react-countup';
import { ThemeColors } from '../theme/themes';
import { IonPopover, IonList, IonListHeader, IonItem, IonLabel, IonChip } from '@ionic/react';
import { LockEvent } from '../models/LockdropModels';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

const etherScanSearch = 'https://etherscan.io/address/';

interface ResultProps {
    lockData: LockEvent[];
    web3: Web3;
    contract: Contract;
}

const LockdropResult: React.FC<ResultProps> = ({ lockData, web3, contract }) => {
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
    const [showIntoRefPopover, setShowIntroRefPopover] = useState(false);
    const [showIntoPopover, setShowIntroPopover] = useState(false);

    // useEffect(() => {
    //     setTimeout(async () => {
    //         setExRate(ethFinalExRate);
    //         const accounts = await web3.eth.getAccounts();
    //         const totalIssue = calculateTotalPlm(accounts[0], lockData);
    //         setTotalPlm(totalIssue);

    //         setLoadState(false);
    //     }, 1000);
    // }, [web3, lockData, contract]);

    useEffect(() => {
        const interval = setInterval(async () => {
            setExRate(ethFinalExRate);
            const accounts = await web3.eth.getAccounts();
            const totalIssue = calculateTotalPlm(accounts[0], lockData);
            setTotalPlm(totalIssue);

            setLoadState(false);
        }, 1000);
        // cleanup hook
        return () => {
            clearInterval(interval);
        };
    }, [web3, lockData, contract]);

    const countupTotalPlmVal: JSX.Element = (
        <CountUp
            start={0}
            end={new BigNumber(totalPlm.getTotalPlm()).toNumber()}
            decimals={2}
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
                    <p>You have received around {totalPlm.basePlm.toFormat(2)} PLM from locking</p>
                    <Divider />
                    <h2>Affiliation Program</h2>
                    <IonChip color="primary" onClick={() => setShowIntroRefPopover(true)}>
                        <IonLabel>{totalPlm.affiliationRefsBonuses.length} locks</IonLabel>
                    </IonChip>
                    <IonLabel>referenced your address as a introducer: {totalPlm.getAffBonus()} PLM</IonLabel>

                    <IonPopover isOpen={showIntoRefPopover} onDidDismiss={() => setShowIntroRefPopover(false)}>
                        <IntoRefItems data={totalPlm} />
                    </IonPopover>
                    <br />
                    <IonLabel>You have referenced </IonLabel>
                    <IonChip color="primary" onClick={() => setShowIntroPopover(true)}>
                        <IonLabel>{totalPlm.introducerAndBonuses.length} introducers</IonLabel>
                    </IonChip>
                    <IonLabel>: {totalPlm.getIntroBonus()} PLM</IonLabel>

                    <IonPopover isOpen={showIntoPopover} onDidDismiss={() => setShowIntroPopover(false)}>
                        <IntoAffItems data={totalPlm} />
                    </IonPopover>
                </>
            ) : (
                <h2 className={classes.header}>No Locks found for your address!</h2>
            )}
        </div>
    );
};

export default LockdropResult;

interface IntroRefProps {
    data: PlmDrop;
}
const IntoRefItems: React.FC<IntroRefProps> = ({ data }) => {
    return (
        <>
            <IonList>
                {data.affiliationRefsBonuses.length > 0 ? (
                    <>
                        <IonListHeader>References</IonListHeader>
                        {data.affiliationRefsBonuses.map((i: [string, BigNumber]) => (
                            <IonItem key={i[0]} href={etherScanSearch + i[0]} rel="noopener noreferrer" target="_blank">
                                {i[0]}
                            </IonItem>
                        ))}
                    </>
                ) : (
                    <IonListHeader>No References</IonListHeader>
                )}
            </IonList>
        </>
    );
};

const IntoAffItems: React.FC<IntroRefProps> = ({ data }) => {
    return (
        <>
            <IonList>
                {data.introducerAndBonuses.length > 0 ? (
                    <>
                        <IonListHeader>Introducers</IonListHeader>
                        {data.introducerAndBonuses.map((i: [string, BigNumber]) => (
                            <IonItem key={i[0]} href={etherScanSearch + i[0]} rel="noopener noreferrer" target="_blank">
                                {i[0]}
                            </IonItem>
                        ))}
                    </>
                ) : (
                    <IonListHeader>No Introducers</IonListHeader>
                )}
            </IonList>
        </>
    );
};
