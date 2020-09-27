/* eslint-disable react/prop-types */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ApiPromise } from '@polkadot/api';
import * as plasmUtils from '../../helpers/plasmUtils';
import * as polkadotCrypto from '@polkadot/util-crypto';
import { Claim, Lockdrop } from 'src/types/LockdropModels';
import {
    List,
    makeStyles,
    createStyles,
    ListSubheader,
    Divider,
    Typography,
    IconButton,
    CircularProgress,
} from '@material-ui/core';
import {
    IonList,
    IonItem,
    IonLabel,
    IonModal,
    IonButton,
    IonHeader,
    IonToolbar,
    IonContent,
    IonTitle,
    IonInput,
} from '@ionic/react';
import { toast } from 'react-toastify';
import EditIcon from '@material-ui/icons/Edit';
import CopyMessageBox from '../CopyMessageBox';
import ClaimItem from './ClaimableItem';

interface Props {
    claimParams: Lockdrop[];
    plasmApi: ApiPromise;
    networkType: 'ETH' | 'BTC';
    plasmNetwork: 'Plasm' | 'Dusty';
    publicKey: string;
    // getLockerSig must return a hex string of the signature
    getLockerSig: (id: Uint8Array, sendToAddr: string) => Promise<string> | string;
}

const useStyles = makeStyles(theme =>
    createStyles({
        listRoot: {
            width: '100%',
            maxWidth: 'auto',
            backgroundColor: theme.palette.background.paper,
            position: 'relative',
            overflow: 'auto',
            height: 360,
            //minHeight: 360,
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
        emptyPanel: {
            textAlign: 'center',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 'auto',
            padding: theme.spacing(3, 0),
        },
    }),
);

const loadAddrCache = (publicKey: string) => {
    const _cache = localStorage.getItem(`claim-addr:${publicKey}`);
    if (_cache === null) {
        return undefined;
    }
    // check if the cached address is valid
    const addrCheck = polkadotCrypto.checkAddress(_cache, 5);
    if (!addrCheck[0]) {
        return undefined;
    }
    return _cache;
};

const ClaimStatus: React.FC<Props> = ({
    claimParams,
    plasmApi,
    plasmNetwork = 'Plasm',
    networkType,
    publicKey,
    getLockerSig,
}) => {
    const classes = useStyles();

    const defaultAddr = useMemo(() => {
        return plasmUtils.generatePlmAddress(publicKey);
    }, [publicKey]);

    // global lockdrop claim requirements
    const [positiveVotes, setPositiveVotes] = useState(0);
    const [voteThreshold, setVoteThreshold] = useState(0);

    const [isLoadingBal, setLoadingBal] = useState(true);
    const [isLoadingClaims, setLoadingClaims] = useState(true);

    // open edit mode if no valid address was saved
    const [addrEditMode, setAddrEditMode] = useState(typeof loadAddrCache(publicKey) === 'undefined');

    // the address where PLMs will be sent
    const [plasmAddr, setPlasmAddr] = useState(loadAddrCache(publicKey) || defaultAddr);
    // a temporary address the user will set
    const [customClaimAddr, setCustomClaimAddr] = useState<string>();
    const [balance, setBalance] = useState('');

    const [claims, setClaims] = useState<(Claim | undefined)[]>([]);

    const sendToDefault = useMemo(() => {
        return plasmAddr === defaultAddr;
    }, [plasmAddr, defaultAddr]);

    const fetchLockData = useCallback(
        async (api: ApiPromise) => {
            // create claims IDs from all the lock parameters
            const claimIds = claimParams.map(c => {
                // get claim ID of current parameter
                return plasmUtils.createLockParam(
                    c.type,
                    c.transactionHash.toHex(),
                    c.publicKey.toHex(),
                    c.duration.toString(),
                    c.value.toString(),
                ).hash;
            });

            const lockdropStates = claimIds.map(async id => {
                // parse plasm node to check claim status
                const claimRes = await plasmUtils.getClaimStatus(api, id);
                return claimRes;
            });

            const _claims = await Promise.all(lockdropStates);

            return _claims;
        },
        [claimParams],
    );

    // initial plasm address balance fetch
    useEffect(() => {
        (async () => {
            const _bal = (await plasmUtils.getAddressBalance(plasmApi, plasmAddr, true)).toFixed(3);
            const formatBal = parseFloat(_bal).toLocaleString('en');
            setBalance(formatBal);
        })().finally(() => {
            setLoadingBal(false);
        });
    }, [plasmApi, plasmAddr]);

    // initial claim data fetch
    useEffect(() => {
        (async () => {
            const claimData = await fetchLockData(plasmApi);
            const _voteReq = await plasmUtils.getLockdropVoteRequirements(plasmApi);
            setPositiveVotes(_voteReq.positiveVotes);
            setVoteThreshold(_voteReq.voteThreshold);
            setClaims(claimData);
        })().finally(() => {
            setLoadingClaims(false);
        });
    }, [fetchLockData, plasmApi]);

    //store plasm address to local storage every time things changes
    useEffect(() => {
        const addrCheck = polkadotCrypto.checkAddress(plasmAddr, 5);
        // only save it locally if it is a valid address
        if (addrCheck[0]) {
            localStorage.setItem(`claim-addr:${publicKey}`, plasmAddr);
        }
    }, [plasmAddr, publicKey]);

    // fetch address balance and lockdrop claim data periodically
    useEffect(() => {
        const interval = setInterval(async () => {
            const _bal = (await plasmUtils.getAddressBalance(plasmApi, plasmAddr, true)).toFixed(3);
            const formatBal = parseFloat(_bal).toLocaleString('en');

            setBalance(formatBal);
        }, 15 * 1000);

        // cleanup hook
        return () => {
            clearInterval(interval);
        };
    });

    const handleEditAddress = () => {
        try {
            if (addrEditMode) {
                // if clicked finished edit

                if (!customClaimAddr) {
                    throw new Error('No Plasm Network address given');
                }

                const addrCheck = polkadotCrypto.checkAddress(customClaimAddr, 5);
                if (!addrCheck[0]) {
                    //setAddrEditMode(false);
                    throw new Error('Plasm address check error: ' + addrCheck[1]);
                }

                setPlasmAddr(customClaimAddr);
                setAddrEditMode(false);
            } else {
                // if clicked edit
                setAddrEditMode(true);
                // allow user to edit the address field and hide the claim list to prevent them from claiming
            }
        } catch (e) {
            console.log(e);
            toast.error(e.message);
        }
    };

    return (
        <div>
            <IonModal isOpen={addrEditMode} onDidDismiss={() => setAddrEditMode(false)}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Token Claim Address</IonTitle>
                    </IonToolbar>
                </IonHeader>

                <IonContent>
                    <IonList>
                        <IonItem>
                            <IonLabel className="ion-text-wrap">
                                This will set the Plasm Network address that will receive the lockdrop rewards when
                                claimed. You can always change this later. For more information, please consider reading{' '}
                                <a
                                    href="https://medium.com/stake-technologies/lockdrop-the-hitchhikers-guide-to-plasm-network-token-distribution-38299e14d5d4"
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    this
                                </a>{' '}
                                article
                            </IonLabel>
                        </IonItem>
                        <IonItem>
                            <IonLabel position="stacked">Enter Plasm Address</IonLabel>
                            <IonInput
                                value={customClaimAddr}
                                placeholder={defaultAddr}
                                onIonChange={e => setCustomClaimAddr(e.detail.value || undefined)}
                                clearInput
                            ></IonInput>
                        </IonItem>
                        <IonItem>
                            <IonLabel className="ion-text-wrap">Your default Plasm Network address:</IonLabel>
                        </IonItem>
                        <IonItem>
                            <CopyMessageBox message={defaultAddr} isCode />
                        </IonItem>
                        <IonItem>
                            <IonButton
                                href={`https://polkadot.js.org/apps/?rpc=wss://rpc.${
                                    plasmNetwork === 'Dusty' ? 'dusty.' : ''
                                }plasmnet.io/#/accounts`}
                                rel="noopener noreferrer"
                                target="_blank"
                                slot="start"
                            >
                                Create a new account
                            </IonButton>
                            <IonButton
                                onClick={handleEditAddress}
                                disabled={isLoadingBal || isLoadingClaims || !customClaimAddr}
                                slot="end"
                            >
                                Set account
                            </IonButton>
                        </IonItem>
                    </IonList>
                </IonContent>
            </IonModal>
            <Typography variant="h5" component="h2" align="center">
                Sending to {plasmAddr}
                <IconButton
                    aria-label="finish"
                    color="primary"
                    onClick={handleEditAddress}
                    disabled={isLoadingBal || isLoadingClaims}
                >
                    <EditIcon fontSize="inherit" />
                </IconButton>
            </Typography>

            {balance && !addrEditMode && (
                <Typography variant="body1" component="p" align="center">
                    Has balance of {balance + ' '}
                    {plasmNetwork === 'Plasm' ? 'PLM' : 'PLD'}
                </Typography>
            )}

            <List className={classes.listRoot} subheader={<li />}>
                <li className={classes.listSection}>
                    <ul className={classes.ul}>
                        {isLoadingBal || isLoadingClaims || addrEditMode ? (
                            <div className={classes.emptyPanel}>
                                <CircularProgress />
                            </div>
                        ) : claimParams.length > 0 ? (
                            <>
                                <ListSubheader>You can claim {claimParams.length} locks</ListSubheader>
                                <Divider />

                                {claimParams.map((e, i) => (
                                    <div key={e.transactionHash.toHex()}>
                                        <ClaimItem
                                            lockParam={e}
                                            plasmApi={plasmApi}
                                            plasmNetwork={plasmNetwork}
                                            networkType={networkType}
                                            positiveVotes={positiveVotes}
                                            voteThreshold={voteThreshold}
                                            initClaimData={claims[i]}
                                            getLockerSig={getLockerSig}
                                            claimRecipientAddress={plasmAddr}
                                            isDefaultAddress={sendToDefault}
                                        />
                                    </div>
                                ))}
                            </>
                        ) : (
                            <>
                                <ListSubheader>You don&apos;t have any locks!</ListSubheader>
                                <Divider />
                                <div className={classes.emptyPanel}>
                                    <Typography>Why does the feeling of emptiness occupy so much space?</Typography>
                                    <Typography>-James de la Vega-</Typography>
                                </div>
                            </>
                        )}
                    </ul>
                </li>
            </List>
        </div>
    );
};

export default ClaimStatus;
