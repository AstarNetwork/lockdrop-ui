/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import { IonContent, IonPage, IonButton } from '@ionic/react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import LockdropForm from '../components/EthLock/LockdropForm';
import * as ethLockdrop from '../helpers/lockdrop/EthereumLockdrop';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Contract } from 'web3-eth-contract';
import { LockInput, LockEvent, LockSeason } from '../types/LockdropModels';
import LockedEthList from '../components/EthLock/LockedEthList';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SectionCard from '../components/SectionCard';
import { Typography, Container } from '@material-ui/core';
import * as plasmUtils from '../helpers/plasmUtils';
import * as polkadotCrypto from '@polkadot/util-crypto';
import * as polkadotUtil from '@polkadot/util';
import ClaimStatus from '../components/RealtimeLockdrop/ClaimStatus';
import moment from 'moment';
import LockdropCountdownPanel from '../components/EthLock/LockdropCountdownPanel';
import { useApi } from '../api/Api';
import { useEth, plasmNetToEthNet } from '../api/Web3Api';
import LoadingOverlay from '../components/LoadingOverlay';

const EthRealTimeLockPage: React.FC = () => {
    const now = moment.utc().valueOf();
    const { api, network } = useApi();

    /**
     * returns true if this is lockdrop is for the plasm main net.
     */
    const isMainnetLock = network === plasmUtils.PlasmNetwork.Main;

    const {
        web3,
        account,
        contract,
        latestBlock,
        lockdropStart,
        lockdropEnd,
        currentNetwork,
        error,
        setLatestBlock,
        setAccount,
        setParameters,
        setIsMainnetLock,
    } = useEth();

    const [message, setMessage] = useState<string>('');

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
                const _allLocks =
                    currentNetwork !== 'private'
                        ? await ethLockdrop.getAllLockEvents(contractInst)
                        : await ethLockdrop.getLocalEvents(web3, contract?.defaultAccount || '', latestBlock);
                setLockEvents(_allLocks);
            }
        },
        [latestBlock, allLockEvents],
    );

    // Set web3 api options
    useEffect(() => {
        setParameters(isMainnetLock, LockSeason.Second);
        // eslint-disable-next-line
  }, []);

    // Display error messages
    useEffect(() => {
        if (typeof error !== 'undefined') {
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
        // eslint-disable-next-line
    }, [contract]);

    // Recreate web3 instance if network changed
    useEffect(() => {
        setIsMainnetLock(isMainnetLock);
        // eslint-disable-next-line
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

    /**
     * called when the user changes MetaMask account
     */
    const handleAccountChange = useCallback(() => {
        const currentAccount = (window as any).ethereum.selectedAddress as string;
        if (account !== currentAccount) {
            console.log('user changed account to ' + currentAccount);
            setAccount(currentAccount);
        }
        // eslint-disable-next-line
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
            setMessage('Obtaining user signature...');

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
                setMessage('');
            });
        } else if (typeof web3 === 'undefined') {
            toast.error('Not connected to Web3');
        }
    }, [publicKey, web3]);

    const handleSubmit = useCallback(
        async (formInputVal: LockInput) => {
            setMessage('Submitting transaction...');
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
                setMessage('');
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
                <LoadingOverlay message={message} />
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
                        </SectionCard>

                        {isLockdropOpen && <LockdropForm onSubmit={handleSubmit} />}

                        <SectionCard maxWidth="lg">
                            <Typography variant="h4" component="h1" align="center">
                                Real-time Lockdrop Status
                            </Typography>
                            {publicKey && api ? (
                                <ClaimStatus
                                    claimParams={lockParams}
                                    networkType="ETH"
                                    plasmNetwork="Plasm"
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
                                              setMessage('Fetching contract events...');
                                              return handleFetchLockEvents(contract).finally(() => {
                                                  setMessage('');
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
