/* eslint-disable react/prop-types */
import React, { useEffect, useState, useMemo } from 'react';
import { ApiPromise } from '@polkadot/api';
import * as plasmUtils from '../../helpers/plasmUtils';
import * as polkadotUtils from '@polkadot/util';
import * as polkadotCrypto from '@polkadot/util-crypto';
import { Claim, Lockdrop } from 'src/types/LockdropModels';
import {
    makeStyles,
    createStyles,
    Divider,
    ListItem,
    Typography,
    ListItemText,
    ListItemIcon,
    Icon,
    ListItemSecondaryAction,
    IconButton,
    CircularProgress,
} from '@material-ui/core';
import plasmIcon from '../../resources/plasm-icon.svg';
import dustyIcon from '../../resources/dusty-icon.svg';
import Web3Utils from 'web3-utils';
import SendIcon from '@material-ui/icons/Send';
import CheckIcon from '@material-ui/icons/Check';
import { green } from '@material-ui/core/colors';
import BigNumber from 'bignumber.js';
import Badge from '@material-ui/core/Badge';
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import ThumbDownIcon from '@material-ui/icons/ThumbDown';
import { IonPopover, IonList, IonItem, IonListHeader, IonLabel, IonAlert } from '@ionic/react';
import { toast } from 'react-toastify';
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmpty';
import ReplayIcon from '@material-ui/icons/Replay';

enum ClaimState {
    NotReq, // tokens are locked, but no requests are sent
    Waiting, // waiting for the validator votes for the request
    Claimable, // votes are positive and rewards can be claimed
    Failed, // votes are negative, need to request it again
    Claimed, // lockdrop reward has been sent to the address
}

interface ItemProps {
    lockParam: Lockdrop;
    plasmApi: ApiPromise;
    plasmNetwork: 'Plasm' | 'Dusty';
    networkType: 'BTC' | 'ETH';
    positiveVotes: number;
    voteThreshold: number;
    getLockerSig: (id: Uint8Array, sendToAddr: string) => Promise<string> | string;
    claimRecipientAddress: string;
    isDefaultAddress: boolean;
    isOver: boolean;
    initClaimData?: Claim;
}

// --- helper functions

const truncateString = (str: string, num: number) => {
    if (str.length <= num) {
        return str;
    }
    // Return str truncated with '...' concatenated to the end of str.
    return str.slice(0, num) + '...';
};

const epochToDays = (epoch: number) => {
    const epochDays = 60 * 60 * 24;
    return epoch / epochDays;
};

const useStyles = makeStyles(theme =>
    createStyles({
        inline: {
            display: 'inline',
        },
        iconProgress: {
            color: green[500],
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 1,
        },
        claimVoteIcon: {
            margin: theme.spacing(1),
        },
    }),
);

const ClaimItem: React.FC<ItemProps> = ({
    lockParam,
    plasmApi,
    plasmNetwork,
    networkType,
    positiveVotes,
    voteThreshold,
    getLockerSig,
    claimRecipientAddress,
    isDefaultAddress,
    isOver,
    initClaimData,
}) => {
    const classes = useStyles();

    const claimId = useMemo(() => {
        return plasmUtils.createLockParam(
            lockParam.type,
            lockParam.transactionHash.toHex(),
            lockParam.publicKey.toHex(),
            lockParam.duration.toString(),
            lockParam.value.toString(),
        ).hash;
    }, [lockParam]);

    // plasmLockdrop.request()
    const [sendingRequest, setSendingRequest] = useState(false);
    // plasmLockdrop.claim()
    const [claimingLock, setClaimingLock] = useState(false);
    const [approveList, setApproveList] = useState<string[]>([]);
    const [declineList, setDeclineList] = useState<string[]>([]);

    // for popup modals
    const [showApproves, setShowApproves] = useState(false);
    const [showDeclines, setShowDeclines] = useState(false);

    const [claimConfirm, setClaimConfirm] = useState(false);

    const [claimData, setClaimData] = useState(initClaimData);

    const setVoteList = (_claim: Claim) => {
        const approves = _claim.approve.toJSON() as string[];
        setApproveList(approves);
        const decline = _claim.decline.toJSON() as string[];
        setDeclineList(decline);
    };

    const hasAllVotes = useMemo(() => {
        return approveList.length + declineList.length >= voteThreshold;
    }, [approveList, declineList, voteThreshold]);

    const reqAccepted = useMemo(() => {
        return approveList.length - declineList.length >= positiveVotes;
    }, [approveList, declineList, positiveVotes]);

    const isReqHanging = useMemo(() => {
        if (claimData) {
            const isClaimHanging = !hasAllVotes || !reqAccepted;
            const isValidClaim = approveList.length > 0;
            // todo: add timestamp check
            return isClaimHanging && isValidClaim;
        } else return false;
    }, [approveList, hasAllVotes, reqAccepted, claimData]);

    const receivingPlm = useMemo(() => {
        if (typeof claimData === 'undefined') return '0';

        return plasmUtils.femtoToPlm(new BigNumber(claimData.amount.toString())).toFixed();
    }, [claimData]);

    const claimStatus = useMemo(() => {
        if (typeof claimData === 'undefined') {
            return ClaimState.NotReq;
        } else if (!hasAllVotes && !isReqHanging) {
            return ClaimState.Waiting;
        } else if (claimData.complete) {
            return ClaimState.Claimed;
        } else if (!reqAccepted || isReqHanging) {
            return ClaimState.Failed;
        }
        return ClaimState.Claimable;
    }, [claimData, hasAllVotes, reqAccepted, isReqHanging]);

    // handle loading and initial set claim status
    useEffect(() => {
        if (typeof claimData !== 'undefined') {
            setVoteList(claimData);
            // turn off loading if it's on
            if (claimData.complete.valueOf() && claimingLock) setClaimingLock(false);
        }
    }, [claimData, claimingLock]);

    /**
     * sends a lockdrop claim request to the plasm node by the given lockdrop parameter
     * @param param lockdrop parameter data
     */
    const submitClaimReq = async (param: Lockdrop) => {
        setSendingRequest(true);
        const _lock = plasmUtils.createLockParam(
            param.type,
            param.transactionHash.toHex(),
            param.publicKey.toHex(),
            param.duration.toString(),
            param.value.toString(),
        );
        const _nonce = plasmUtils.claimPowNonce(_lock.hash);

        const unsubscribe = await plasmApi.tx.plasmLockdrop.request(_lock.toU8a(), _nonce).send(({ status }) => {
            console.log('Claim request status:', status.type);

            if (status.isFinalized) {
                console.log('Finalized block hash', status.asFinalized.toHex());

                plasmUtils.getClaimStatus(plasmApi, claimId).then(claim => {
                    setClaimData(claim);
                    setSendingRequest(false);
                });

                unsubscribe();
            }
        });
    };

    /**
     * requests the plasm node to send the lockdrop rewards to the locker's address
     * @param id lockdrop claim ID
     */
    const submitTokenClaim = async (id: Uint8Array) => {
        try {
            if (hasAllVotes && reqAccepted && claimData && !claimData.complete.valueOf()) {
                // show loading circle
                setClaimingLock(true);

                if (claimRecipientAddress && !isDefaultAddress) {
                    console.log('using claim_to function');
                    // hex string signature
                    const _sig = await getLockerSig(id, claimRecipientAddress);

                    const unsubscribe = await plasmApi.tx.plasmLockdrop
                        .claimTo(claimId, claimRecipientAddress, polkadotUtils.hexToU8a(_sig))
                        .send(({ status }) => {
                            console.log('Token claim status:', status.type);

                            if (status.isFinalized) {
                                console.log('Finalized block hash', status.asFinalized.toHex());

                                plasmUtils.getClaimStatus(plasmApi, claimId).then(claim => {
                                    setClaimData(claim);
                                    setClaimingLock(false);
                                });

                                unsubscribe();
                            }
                        });
                } else {
                    console.log('Sending tokens to the default address');
                    const unsubscribe = await plasmApi.tx.plasmLockdrop.claim(claimId).send(({ status }) => {
                        console.log('Token claim status:', status.type);

                        if (status.isFinalized) {
                            console.log('Finalized block hash', status.asFinalized.toHex());

                            plasmUtils.getClaimStatus(plasmApi, claimId).then(claim => {
                                setClaimData(claim);
                                setClaimingLock(false);
                            });

                            unsubscribe();
                        }
                    });
                }
            } else {
                throw new Error('Claim requirement was not met');
            }
        } catch (e) {
            console.log(e);
            toast.error(e.message);
        }
    };

    const ActionIcon = () => {
        if (claimStatus === ClaimState.Waiting) {
            return <HourglassEmptyIcon />;
        } else if (claimStatus === ClaimState.NotReq) {
            return <SendIcon />;
        } else if (claimStatus === ClaimState.Failed) {
            return <ReplayIcon />;
        }
        return <CheckIcon />;
    };

    return (
        <>
            <IonAlert
                isOpen={claimConfirm}
                onDidDismiss={() => setClaimConfirm(false)}
                translucent
                header={'Confirm Rewards'}
                subHeader={'Real-time lockdrop claim'}
                message={`Sending claim rewards of ${receivingPlm} ${plasmNetwork === 'Plasm' ? 'PLM' : 'PLD'}.
                    to ${polkadotCrypto.encodeAddress(claimRecipientAddress, 5)}.
                    Please confirm`}
                buttons={[
                    {
                        text: 'Cancel',
                        role: 'cancel',
                        cssClass: 'secondary',
                        handler: () => {
                            setClaimConfirm(false);
                        },
                    },
                    {
                        text: 'Claim',
                        role: 'confirm',
                        handler: () => {
                            submitTokenClaim(claimId);
                        },
                    },
                ]}
            />
            <IonPopover isOpen={showApproves} onDidDismiss={() => setShowApproves(false)}>
                <IonList>
                    <IonListHeader>Claim Approvals</IonListHeader>
                    {approveList.length > 0 ? (
                        approveList.map(authority => (
                            <IonItem key={authority}>
                                <IonLabel>{authority}</IonLabel>
                            </IonItem>
                        ))
                    ) : (
                        <IonItem>
                            <IonLabel>No Approvals</IonLabel>
                        </IonItem>
                    )}
                </IonList>
            </IonPopover>
            <IonPopover isOpen={showDeclines} onDidDismiss={() => setShowDeclines(false)}>
                <IonList>
                    <IonListHeader>Claim Declines</IonListHeader>
                    {declineList.length > 0 ? (
                        declineList.map(authority => (
                            <IonItem key={authority}>
                                <IonLabel>{authority}</IonLabel>
                            </IonItem>
                        ))
                    ) : (
                        <IonItem>
                            <IonLabel>No Declines</IonLabel>
                        </IonItem>
                    )}
                </IonList>
            </IonPopover>
            <ListItem>
                <ListItemIcon>
                    <Icon>
                        {plasmNetwork === 'Plasm' ? <img src={plasmIcon} alt="" /> : <img src={dustyIcon} alt="" />}
                    </Icon>
                </ListItemIcon>
                <ListItemText>
                    <Typography component="h4" variant="h5" color="textPrimary">
                        Transaction Hash: {truncateString(lockParam.transactionHash.toHex(), 6)}
                    </Typography>
                    <Typography component="h5" variant="h6" className={classes.inline} color="textPrimary">
                        Locked{' '}
                        {networkType === 'ETH'
                            ? `${Web3Utils.fromWei(lockParam.value.toString(), 'ether')} ETH `
                            : `0 BTC `}
                        for {epochToDays(lockParam.duration.toNumber()).toString()} days
                    </Typography>

                    {claimData && (
                        <>
                            <br />
                            <Typography component="h5" variant="h6" className={classes.inline} color="textPrimary">
                                Receiving {receivingPlm} {plasmNetwork === 'Plasm' ? 'PLM' : 'PLD'}
                            </Typography>
                        </>
                    )}

                    <br />
                    <Typography component="p" variant="body2" className={classes.inline} color="textPrimary">
                        Claim ID: {claimId.toHex()}
                    </Typography>
                    <br />
                    <Typography
                        component="p"
                        variant="body2"
                        className={classes.inline}
                        color={claimData ? 'primary' : 'error'}
                    >
                        {claimData
                            ? claimData.complete.valueOf()
                                ? 'Claimed Lockdrop'
                                : 'Claim requested (not claimed)'
                            : 'Claim not requested'}
                    </Typography>
                    {claimData && (
                        <>
                            <IconButton color="primary" component="span" onClick={() => setShowApproves(true)}>
                                <Badge
                                    color="secondary"
                                    badgeContent={approveList.length}
                                    showZero
                                    max={999}
                                    className={classes.claimVoteIcon}
                                    anchorOrigin={{
                                        vertical: 'top',
                                        horizontal: 'left',
                                    }}
                                >
                                    <ThumbUpIcon />
                                </Badge>
                            </IconButton>

                            <IconButton
                                color="primary"
                                component="span"
                                onClick={() => setShowDeclines(true)}
                                disabled={isOver}
                            >
                                <Badge
                                    color="secondary"
                                    badgeContent={declineList.length}
                                    showZero
                                    max={999}
                                    className={classes.claimVoteIcon}
                                    anchorOrigin={{
                                        vertical: 'top',
                                        horizontal: 'left',
                                    }}
                                >
                                    <ThumbDownIcon />
                                </Badge>
                            </IconButton>
                        </>
                    )}
                </ListItemText>

                <ListItemSecondaryAction>
                    <div>
                        <IconButton
                            edge="end"
                            aria-label="request"
                            onClick={() => {
                                claimData === undefined || !reqAccepted
                                    ? submitClaimReq(lockParam)
                                    : setClaimConfirm(true);
                            }}
                            color="primary"
                            disabled={
                                isOver ||
                                sendingRequest ||
                                claimData?.complete.valueOf() ||
                                claimingLock ||
                                (claimData && !hasAllVotes)
                            }
                        >
                            <ActionIcon />
                        </IconButton>
                        {sendingRequest || claimingLock ? (
                            <CircularProgress size={24} className={classes.iconProgress} />
                        ) : null}
                    </div>
                </ListItemSecondaryAction>
            </ListItem>
            <Divider />
        </>
    );
};

export default ClaimItem;
