/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import { IonContent, IonPage, IonLoading, IonButton } from '@ionic/react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import LockdropForm from '../components/EthLock/LockdropForm';
import * as ethLockdrop from '../helpers/lockdrop/EthereumLockdrop';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Contract } from 'web3-eth-contract';
import { LockInput, LockEvent } from '../types/LockdropModels';
import LockedEthList from '../components/EthLock/LockedEthList';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SectionCard from '../components/SectionCard';
import { Typography, Container, Divider, makeStyles, createStyles } from '@material-ui/core';
import * as plasmUtils from '../helpers/plasmUtils';
import * as polkadotCrypto from '@polkadot/util-crypto';
import * as polkadotUtil from '@polkadot/util';
import ClaimStatus from 'src/components/RealtimeLockdrop/ClaimStatus';
import moment from 'moment';
import LockdropCountdownPanel from '../components/EthLock/LockdropCountdownPanel';
import { secondLockContract } from '../data/lockInfo';
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';
import { useApi } from 'src/helpers/Api';
import { useEth } from 'src/helpers/Web3Api';

const useStyles = makeStyles(theme =>
    createStyles({
        addressDropdown: {
            padding: theme.spacing(0, 3, 0),
            marginLeft: 'auto',
            marginRight: 'auto',
            [theme.breakpoints.up('md')]: {
                maxWidth: '60%',
            },
        },
    }),
);

const EthRealTimeLockPage: React.FC = () => {
    const classes = useStyles();
    const now = moment.utc().valueOf();
    const { api, network } = useApi();

    /**
     * returns true if this is lockdrop is for the plasm main net.
     */
    const isMainnetLock = network === plasmUtils.PlasmNetwork.Main;

    // this is used for rendering network names
    const plasmNetToEthNet = isMainnetLock ? 'Main Network' : 'Ropsten';
    const {
        web3,
        isWeb3Loading,
        account,
        contract,
        latestBlock,
        error,
        lockdropStart,
        lockdropEnd,
        isChangingContract,
        currentNetwork,
        setLatestBlock,
        setAccount,
        changeContractAddress,
        setIsMainnetLock,
    } = useEth();

    const getContractAddress = () => {
        const _mainContract = secondLockContract.find(i => i.type === 'main')?.address;
        // always use the last contract as default if it's testnet
        const _ropContract = secondLockContract.filter(i => i.type === 'ropsten')[1].address;

        const _addr = isMainnetLock ? _mainContract : _ropContract;
        if (typeof _addr === 'undefined') throw new Error('Could not find the correct contract address');

        return _addr;
    };

    const [contractAddress, setContractAddress] = useState<string>(getContractAddress());

    const [isLoading, setLoading] = useState<{
        loading: boolean;
        message: string;
    }>({
        loading: false,
        message: '',
    });

    // get lock event list from the local storage if it exists
    const [allLockEvents, setLockEvents] = useState<LockEvent[]>([]);
    const [publicKey, setPublicKey] = useState<string>();

    const isMainnet = (currentNetwork: string) => {
        return currentNetwork === 'main';
    };

    // checks if lockdrop is online
    const isLockdropOpen = useMemo(() => {
        if (lockdropStart === '0' || lockdropEnd === '0') return false;

        const startsOn = moment.unix(parseInt(lockdropStart)).valueOf();
        const endsOn = moment.unix(parseInt(lockdropEnd)).valueOf();
        const started = now > startsOn;
        const ended = now > endsOn;

        return started && !ended;
    }, [now, lockdropStart, lockdropEnd]);

    const getAddressArray = useMemo(() => {
        const _rop = secondLockContract.filter(i => i.type === 'ropsten');
        const _addr = _rop.map(i => i.address);
        return _addr;
    }, []);

    // lockdrop parameter for real-time lockdrop rewards
    const lockParams = useMemo(() => {
        if (typeof publicKey === 'undefined' || typeof web3 === 'undefined') return [];

        const myLocks = allLockEvents.filter(lock => {
            return lock.lockOwner.toLowerCase() === account.toLowerCase();
        });

        if (myLocks.length > 0) {
            return plasmUtils.getClaimParamsFromEth(publicKey, myLocks, latestBlock);
        } else {
            return [];
        }
    }, [allLockEvents, account, publicKey, latestBlock, web3]);

    const handleFetchLockEvents = useCallback(
        async (contractInst: Contract) => {
            // only fetch the events if the block number is high
            if (
                allLockEvents.length === 0 ||
                (latestBlock !== 0 && ethLockdrop.getHighestBlockNo(allLockEvents) <= latestBlock)
            ) {
                const _allLocks = await ethLockdrop.getAllLockEvents(contractInst);
                setLockEvents(_allLocks);
            }
        },
        [latestBlock, allLockEvents],
    );

    // Set contract address
    useEffect(() => {
        console.log('changing contract address ', contractAddress);
        changeContractAddress(contractAddress);
    }, [contractAddress]);

    // Wait for initial API loading
    useEffect(() => {
        if (isWeb3Loading) {
            setLoading({
                loading: true,
                message: 'Syncing with Ethereum...',
            });
        } else {
            setLoading({ loading: false, message: '' });
        }
    }, [isWeb3Loading]);

    // Display error messages
    useEffect(() => {
        console.log('Error is ', error);
        if (typeof error !== 'undefined') {
            setLoading({ loading: false, message: '' });
            toast.error(error);
        }
    }, [error]);

    // Load lock events
    useEffect(() => {
        const fetchLockEvents = async () => {
            if (typeof contract !== 'undefined') {
                await handleFetchLockEvents(contract);
            }
        };

        fetchLockEvents();
    }, [contract]);

    // Recreate web3 instance if network changed
    useEffect(() => {
        setIsMainnetLock(isMainnetLock);
    }, [network]);

    // fetch ethereum block header in the background
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                if (web3 && contract) {
                    const _latest = await web3.eth.getBlockNumber();
                    if (_latest > latestBlock) {
                        setLatestBlock(_latest);
                        await handleFetchLockEvents(contract);
                    }
                }
            } catch (error) {
                toast.error(error.message);
                console.log(error);
            }
        }, 25 * 1000);

        // cleanup hook
        return () => {
            clearInterval(interval);
        };
    });

    // refresh if contract reloads
    useEffect(() => {
        if (isChangingContract) {
            if (!isWeb3Loading) {
                setLoading({
                    loading: true,
                    message: 'Connecting to Web3 instance with new contract...',
                });
            }
        } else {
            if (!isWeb3Loading) {
                setLoading({ loading: false, message: '' });
            }
        }

        if (web3) {
            //changeContractAddress(contractAddress);
        }
        // we disable next line to prevent change on getClaimParams
        // eslint-disable-next-line
    }, [contractAddress, isChangingContract]);

    /**
     * called when the user changes MetaMask account
     */
    const handleAccountChange = useCallback(() => {
        const currentAccount = (window as any).ethereum.selectedAddress as string;
        if (account !== currentAccount) {
            console.log('user changed account to ' + currentAccount);
            setAccount(currentAccount);
        }
    }, [account]);

    // handle metamask account change event handler
    useEffect(() => {
        // checks if account has changed in MetaMask
        if ((window as any).ethereum.on) {
            (window as any).ethereum.on('accountsChanged', handleAccountChange);
        }
        return () => {
            (window as any).ethereum.on && (window as any).ethereum.on('disconnect', handleAccountChange);
        };
    }, [handleAccountChange]);

    const handleGetPublicKey = useCallback(() => {
        if (!publicKey && web3) {
            setLoading({
                loading: true,
                message: 'Obtaining user signature...',
            });

            (async function() {
                try {
                    const _pub = await ethLockdrop.getPubKey(
                        web3,
                        `Sign this message to submit a lock request.
                    This action is required for the real-time lockdrop module ${polkadotCrypto.randomAsHex(3)}`,
                    );
                    setPublicKey(_pub);
                } catch (e) {
                    console.log(e);
                    toast.error(e.message);
                }
            })().finally(() => {
                setLoading({ loading: false, message: '' });
            });
        } else if (typeof web3 === 'undefined') {
            toast.error('Not connected to Web3');
        }
    }, [publicKey, web3]);

    const handleSubmit = useCallback(
        async (formInputVal: LockInput) => {
            setLoading({
                loading: true,
                message: 'Submitting transaction...',
            });
            try {
                if (typeof web3 === 'undefined') {
                    throw new Error('Could not find a Web3 instance');
                }
                if (typeof contract === 'undefined') {
                    throw new Error('Could not find a contract instance');
                }
                const lockAmount = parseFloat(formInputVal.amount);
                if (Number.isNaN(lockAmount)) {
                    throw new Error('Invalid number given');
                }
                if (formInputVal.duration <= 0) {
                    throw new Error('Please choose a lock duration');
                }

                if (!publicKey) {
                    const _publicKey = await ethLockdrop.getPubKey(
                        web3,
                        `Sign this message to submit a lock request.
                This action is required for the real-time lockdrop module
                ${polkadotCrypto.randomAsHex(3)}`,
                    );
                    setPublicKey(_publicKey);
                }

                await ethLockdrop.submitLockTx(formInputVal, account, contract);
                toast.success(`Successfully locked ${formInputVal.amount} ETH for ${formInputVal.duration} days!`);
                await handleFetchLockEvents(contract);
            } catch (e) {
                toast.error(e.message.toString());
                console.log(e);
            } finally {
                setLoading({ loading: false, message: '' });
            }
        },
        [account, contract, publicKey, web3, handleFetchLockEvents],
    );

    const getClaimToSig = async (id: Uint8Array, sendAddr?: string) => {
        if (typeof web3 === 'undefined' || typeof sendAddr === 'undefined') {
            throw new Error('Could not connect to Web3js');
        }

        const _claimId = polkadotUtil.u8aToHex(id);
        const _msg = plasmUtils.claimToMessage(_claimId, sendAddr);
        return await ethLockdrop.getMessageSignature(web3, _msg, false);
    };

    return (
        <IonPage>
            <Navbar />
            <IonContent>
                <IonLoading isOpen={isLoading.loading} message={isLoading.message} />
                {isMainnet(currentNetwork) !== isMainnetLock ? (
                    <SectionCard maxWidth="lg">
                        <Typography variant="h2" component="h4" align="center">
                            Please access this page with a {plasmNetToEthNet} wallet
                        </Typography>
                    </SectionCard>
                ) : (
                    <>
                        <SectionCard maxWidth="lg">
                            <LockdropCountdownPanel
                                startTime={moment.unix(parseInt(lockdropStart))}
                                endTime={moment.unix(parseInt(lockdropEnd))}
                                lockData={allLockEvents}
                            />
                            {!isMainnetLock && (
                                <>
                                    <Divider />
                                    <Typography variant="h4" component="h5" align="center">
                                        Lockdrop Contract Address
                                    </Typography>
                                    <Dropdown
                                        options={getAddressArray}
                                        value={contractAddress}
                                        onChange={e => setContractAddress(e.value)}
                                        className={classes.addressDropdown}
                                    />
                                </>
                            )}
                        </SectionCard>

                        {isLockdropOpen && <LockdropForm onSubmit={handleSubmit} dusty={!isMainnetLock} />}

                        <SectionCard maxWidth="lg">
                            <Typography variant="h4" component="h1" align="center">
                                Real-time Lockdrop Status
                            </Typography>
                            {publicKey && api ? (
                                <ClaimStatus
                                    claimParams={lockParams}
                                    networkType="ETH"
                                    plasmNetwork={isMainnetLock ? 'Plasm' : 'Dusty'}
                                    publicKey={publicKey}
                                    getLockerSig={(id, addr) => getClaimToSig(id, addr)}
                                />
                            ) : (
                                <Container>
                                    <IonButton expand="block" onClick={handleGetPublicKey}>
                                        Click to view lock claims
                                    </IonButton>
                                </Container>
                            )}
                        </SectionCard>
                        {web3 && (
                            <LockedEthList
                                lockData={allLockEvents}
                                onClickRefresh={
                                    contract
                                        ? () => {
                                              setLoading({
                                                  loading: true,
                                                  message: 'Fetching contract events...',
                                              });
                                              return handleFetchLockEvents(contract).finally(() => {
                                                  setLoading({
                                                      loading: false,
                                                      message: '',
                                                  });
                                              });
                                          }
                                        : undefined
                                }
                            />
                        )}
                    </>
                )}
                <Footer />
            </IonContent>
        </IonPage>
    );
};
export default EthRealTimeLockPage;
