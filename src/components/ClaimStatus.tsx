/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { ApiPromise } from '@polkadot/api';
import * as plasmUtils from '../helpers/plasmUtils';
import * as btcLockdrop from '../helpers/lockdrop/BitcoinLockdrop';
import { Claim, Lockdrop } from 'src/types/LockdropModels';
import {
    List,
    makeStyles,
    createStyles,
    ListSubheader,
    Divider,
    ListItem,
    Typography,
    ListItemText,
    ListItemIcon,
    Icon,
    ListItemSecondaryAction,
    IconButton,
    Tooltip,
    CircularProgress,
} from '@material-ui/core';
import plasmIcon from '../resources/plasm-icon.svg';
import dustyIcon from '../resources/dusty-icon.svg';
import Web3Utils from 'web3-utils';
import SendIcon from '@material-ui/icons/Send';
import CheckIcon from '@material-ui/icons/Check';
import { green } from '@material-ui/core/colors';
import BigNumber from 'bignumber.js';
import { H256 } from '@polkadot/types/interfaces';

interface Props {
    claimParams?: Lockdrop[];
    plasmApi: ApiPromise;
    networkType: 'ETH' | 'BTC';
    plasmNetwork: 'Plasm' | 'Dusty';
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
        tabMenu: {
            backgroundColor: theme.palette.background.paper,
            width: 'auto',
        },
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
        emptyPanel: {
            textAlign: 'center',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 'auto',
        },
    }),
);

const ClaimStatus: React.FC<Props> = ({ claimParams, plasmApi, plasmNetwork = 'Plasm', networkType }) => {
    const classes = useStyles();
    return (
        <div>
            <Typography variant="h5" component="h2" align="center">
                {plasmNetwork === 'Plasm' ? 'PLM' : 'PLD'} Claimable
            </Typography>
            <List className={classes.listRoot} subheader={<li />}>
                <li className={classes.listSection}>
                    <ul className={classes.ul}>
                        {claimParams && claimParams.length > 0 ? (
                            <>
                                <ListSubheader>You can claim {claimParams.length} locks</ListSubheader>
                                <Divider />

                                {claimParams.map(e => (
                                    <>
                                        <ClaimItem
                                            key={e.transactionHash.toHex()}
                                            lockParam={e}
                                            plasmApi={plasmApi}
                                            plasmNetwork={plasmNetwork}
                                            networkType={networkType}
                                        />
                                    </>
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

interface ItemProps {
    lockParam: Lockdrop;
    plasmApi: ApiPromise;
    plasmNetwork: 'Plasm' | 'Dusty';
    networkType: 'BTC' | 'ETH';
}
const ClaimItem: React.FC<ItemProps> = ({ lockParam, plasmApi, plasmNetwork, networkType }) => {
    const classes = useStyles();
    const [claimData, setClaimData] = useState<Claim>();
    const [isSending, setSending] = useState(false);
    const [claimId, {}] = useState<H256>(
        plasmUtils.createLockParam(
            lockParam.type,
            lockParam.transactionHash.toHex(),
            lockParam.publicKey.toHex(),
            lockParam.duration.toString(),
            lockParam.value.toString(),
        ).hash,
    );
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

    const submitClaimReq = (param: Lockdrop) => {
        setSending(true);
        const _lock = plasmUtils.createLockParam(
            param.type,
            param.transactionHash.toHex(),
            param.publicKey.toHex(),
            param.duration.toString(),
            param.value.toString(),
        );
        const _nonce = plasmUtils.claimPowNonce(_lock.hash);
        // send lockdrop claim request
        plasmUtils // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .sendLockClaim(plasmApi, _lock as any, _nonce)
            .then(res => {
                console.log('Claim ID: ' + _lock.hash);
                console.log('Request transaction hash:\n' + res.toHex());
            });
    };

    useEffect(() => {
        plasmUtils.getClaimStatus(plasmApi, claimId).then(i => {
            setClaimData(i);
            // turn off loading if it's on
            if (isSending && i) setSending(false);
        });
    }, []);

    useEffect(() => {
        const interval = setInterval(async () => {
            const _claim = await plasmUtils.getClaimStatus(plasmApi, claimId);

            setClaimData(_claim);
            // turn off loading if it's on
            if (isSending && _claim) setSending(false);
        }, 2000); // fetch every 5 seconds

        // cleanup hook
        return () => {
            clearInterval(interval);
        };
    });

    return (
        <>
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
                            : `${btcLockdrop.satoshiToBitcoin(lockParam.value.toString())} BTC `}
                        for {epochToDays(lockParam.duration.toNumber()).toString()} days
                    </Typography>

                    {claimData && claimData.complete && (
                        <>
                            <br />
                            <Typography component="h5" variant="h6" className={classes.inline} color="textPrimary">
                                Receiving {plasmUtils.femtoToPlm(new BigNumber(claimData.amount.toString())).toFixed()}{' '}
                                {plasmNetwork === 'Plasm' ? 'PLM' : 'PLD'}
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
                        {claimData ? 'Claim requested' : 'Claim not requested'}
                    </Typography>
                    {claimData && (
                        <>
                            <br />
                            <Typography component="p" variant="body2" className={classes.inline} color="textPrimary">
                                Approval Votes: {claimData.approve.toString()}
                            </Typography>
                            <br />
                            <Typography component="p" variant="body2" className={classes.inline} color="textPrimary">
                                Decline Votes: {claimData.decline.toString()}
                            </Typography>
                        </>
                    )}
                </ListItemText>

                <ListItemSecondaryAction>
                    <div>
                        <Tooltip title="Send claim request">
                            <IconButton
                                edge="end"
                                aria-label="request"
                                onClick={() => submitClaimReq(lockParam)}
                                color="primary"
                                disabled={isSending}
                            >
                                {claimData ? <CheckIcon /> : <SendIcon />}
                            </IconButton>
                        </Tooltip>
                        {isSending && <CircularProgress size={24} className={classes.iconProgress} />}
                    </div>
                </ListItemSecondaryAction>
            </ListItem>
            <Divider />
        </>
    );
};
