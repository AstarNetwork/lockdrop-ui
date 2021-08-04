/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import {
    makeStyles,
    createStyles,
    Theme,
    CircularProgress,
    Divider,
    Link,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Collapse,
    Typography,
} from '@material-ui/core';
import { calculateTotalPlm, ethFinalExRate, getPubKey } from '../../helpers/lockdrop/EthereumLockdrop';
import { PlmDrop } from '../../types/PlasmDrop';
import BigNumber from 'bignumber.js';
import CountUp from 'react-countup';
import { ThemeColors } from '../../theme/themes';
import { IonPopover, IonList, IonListHeader, IonItem, IonLabel, IonChip, IonButton } from '@ionic/react';
import { LockEvent } from '../../types/LockdropModels';
import Web3 from 'web3';
import SectionCard from '../SectionCard';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import { generatePlmAddress } from '../../helpers/plasmUtils';
import { useEth } from '../../api/Web3Api';
import LoadingOverlay from '../LoadingOverlay';

const etherScanSearch = 'https://etherscan.io/address/';

interface ResultProps {
    lockData: LockEvent[];
}

const LockdropResult: React.FC<ResultProps> = ({ lockData }) => {
    const useStyles = makeStyles((theme: Theme) =>
        createStyles({
            pageContent: {
                textAlign: 'center',
                padding: theme.spacing(4, 2, 0),
            },
            header: {
                color: ThemeColors.blue,
            },
            claimButton: {
                padding: theme.spacing(4, 2, 0),
            },
        }),
    );

    const classes = useStyles();
    const [totalPlm, setTotalPlm] = useState<PlmDrop>(new PlmDrop('', new BigNumber(0), [], [], []));
    const [exRate, setExRate] = useState(0);
    const [isLoading, setLoadState] = useState(true);
    const [showIntoRefPopover, setShowIntroRefPopover] = useState(false);
    const [showIntoPopover, setShowIntroPopover] = useState(false);
    const { web3 } = useEth();

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
    });

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
            ) : totalPlm.locks.length > 0 || totalPlm.affiliationRefsBonuses.length > 0 ? (
                <>
                    <h2 className={classes.header}>{countupTotalPlmVal} PLM in total</h2>
                    <p>You have locked {totalPlm.locks.length} time(s)</p>
                    <p>
                        ETH exchange rate at the end of the lockdrop: {exRate} USD(
                        <a href="https://api.coingecko.com/api/v3/coins/ethereum/history?date=01-05-2020&localization=false">
                            ref
                        </a>
                        )
                    </p>
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
                    <br />
                    <ClaimPlm web3={web3} />
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

interface ClaimProps {
    web3: Web3;
}
const ClaimPlm: React.FC<ClaimProps> = ({ web3 }) => {
    const useStyles = makeStyles((theme: Theme) =>
        createStyles({
            header: {
                color: ThemeColors.blue,
            },
            claimButton: {
                paddingTop: theme.spacing(2),
                marginLeft: 'auto',
                marginRight: 'auto',
                maxWidth: '100%',
            },
            addressPanel: {
                padding: theme.spacing(3, 3, 0),
            },
            root: {
                width: '100%',
                alignContent: 'center',
                backgroundColor: theme.palette.background.paper,
            },
            nested: {
                paddingLeft: theme.spacing(4),
            },
        }),
    );

    const [message, setMessage] = useState<string>('');
    const [plmAddress, setPlmAddress] = useState('');
    const [ethPubkey, setEthPubkey] = useState('');
    const [open, setOpen] = useState(false);

    const getPlasmAddress = async () => {
        const pubKey = await getPubKey(web3);
        let result = '';
        if (typeof pubKey === 'string') {
            setEthPubkey(pubKey);
            // remove the 0x prefix before passing the value
            const plmAddress = generatePlmAddress(pubKey.replace('0x', ''));
            result = plmAddress;
        }
        setMessage('');
        return result;
    };
    const ExpandItem = () => {
        setOpen(!open);
    };

    const classes = useStyles();

    return (
        <>
            <LoadingOverlay message={message} />
            <IonButton
                color="primary"
                size="large"
                className={classes.claimButton}
                onClick={async () => {
                    setMessage('Verifying user...');
                    setPlmAddress(await getPlasmAddress());
                }}
            >
                Get Plasm Address
            </IonButton>
            {plmAddress ? (
                <>
                    <SectionCard maxWidth="md">
                        <div className={classes.addressPanel}>
                            <p>Your Plasm Network address with the lockdrop rewards:</p>
                            <Link
                                color="inherit"
                                href={'https://plasm.subscan.io/account/' + plmAddress}
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                <h2 className={classes.header}>{plmAddress}</h2>
                            </Link>
                            <List component="nav" className={classes.root}>
                                <ListItem button onClick={ExpandItem}>
                                    <ListItemIcon>
                                        <VpnKeyIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="View Eth Public Key" />
                                    {open ? <ExpandLess /> : <ExpandMore />}
                                </ListItem>
                                <Collapse in={open} timeout="auto" unmountOnExit>
                                    <Typography className={classes.header}>{ethPubkey}</Typography>
                                </Collapse>
                            </List>
                        </div>
                    </SectionCard>
                </>
            ) : null}
        </>
    );
};
