/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import { IonContent, IonPage, IonLoading, IonButton } from '@ionic/react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import LockdropForm from '../components/EthLock/LockdropForm';
import * as ethLockdrop from '../helpers/lockdrop/EthereumLockdrop';
import Web3 from 'web3';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Contract } from 'web3-eth-contract';
import { LockInput, LockEvent, LockdropType, Lockdrop } from '../types/LockdropModels';
import LockedEthList from '../components/EthLock/LockedEthList';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { removeWeb3Event } from '../helpers/getWeb3';
import SectionCard from '../components/SectionCard';
import { Typography, Container, Divider } from '@material-ui/core';
import * as plasmUtils from '../helpers/plasmUtils';
import { ApiPromise } from '@polkadot/api';
import * as polkadotUtil from '@polkadot/util-crypto';
import ClaimStatus from 'src/components/ClaimStatus';
import moment from 'moment';
import LockdropCountdownPanel from '../components/EthLock/LockdropCountdownPanel';
import { lockdropContracts } from '../data/lockInfo';
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';

const formInfo = `This is the lockdrop form for Ethereum.
This uses Web3 injection so you must have Metamask (or other Web3-enabled wallet) installed in order for this to work properly.
If you find any errors or find issues with this form, please contact the Plasm team.
Regarding the audit by Quantstamp, click <a
                            color="inherit"
                            href="https://github.com/staketechnologies/lockdrop-ui/blob/16a2d495d85f2d311957b9cf366204fbfabadeaa/audit/quantstamp-audit.pdf"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            here
                        </a> for more details`;

toast.configure({
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
});

const DustyEthLockPage: React.FC = () => {
    const [web3, setWeb3] = useState<Web3>();
    const [plasmApi, setPlasmApi] = useState<ApiPromise>();
    const [accounts, setAccounts] = useState<string[]>([]);
    const [contract, setContract] = useState<Contract>();
    // set default testnet contract address
    const [contractAddress, setContractAddress] = useState(
        // always use the last contract as default
        lockdropContracts.secondLock.ropsten[lockdropContracts.secondLock.ropsten.length - 1],
    );

    const [isLoading, setLoading] = useState<{
        loading: boolean;
        message: string;
    }>({
        loading: false,
        message: '',
    });

    const [networkType, setNetworkType] = useState('');
    const [allLockEvents, setLockEvents] = useState<LockEvent[]>([]);
    const [lockParams, setLockParams] = useState<Lockdrop[]>([]);
    const [publicKey, setPublicKey] = useState<string>();

    const [lockdropStart, setLockdropStart] = useState('0');
    const [lockdropEnd, setLockdropEnd] = useState('0');

    const isMainnet = useMemo(() => {
        return networkType === 'main';
    }, [networkType]);

    const durationToEpoch = (duration: number) => {
        const epochDays = 60 * 60 * 24;
        return duration * epochDays;
    };

    /**
     * Obtains list of lockdrop claim parameters
     */
    const getClaimParams = useCallback(
        (ethAccount: string) => {
            if (publicKey) {
                const claimableLocks = allLockEvents.filter(i => {
                    const isOwnedLock = i.lockOwner === ethAccount;
                    // check if the lock as been confirmed for at least 10 blocks
                    const hasTimePast = moment.utc().valueOf() > parseInt(i.timestamp) + 35 * 10;
                    return isOwnedLock && hasTimePast;
                });

                const claimIDs = claimableLocks.map(lock => {
                    const _param = plasmUtils.createLockParam(
                        LockdropType.Ethereum,
                        lock.transactionHash,
                        publicKey,
                        durationToEpoch(lock.duration).toString(),
                        lock.eth.toString(),
                    );
                    return plasmUtils.structToLockdrop(_param as any);
                });

                return claimIDs;
            }
        },
        [publicKey, allLockEvents],
    );

    // fetch lock data in the background
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                // get all the lock events from the chain
                if (web3 && contract) {
                    const _allLocks = await ethLockdrop.getAllLockEvents(web3, contract);
                    setLockEvents(_allLocks);
                }

                const _lockParam = getClaimParams(accounts[0]) || [];
                setLockParams(_lockParam);
            } catch (error) {
                toast.error(error.message);
                console.log(error);
            }
        }, 5 * 1000);

        // cleanup hook
        return () => {
            clearInterval(interval);
            removeWeb3Event();
        };
    });

    // load web3 instance
    useEffect(() => {
        setLoading({
            loading: true,
            message: 'Connecting to Web3 instance...',
        });
        (async function() {
            try {
                const web3State = await ethLockdrop.connectWeb3(contractAddress);

                const plasmNode = await plasmUtils.createPlasmInstance(plasmUtils.PlasmNetwork.Dusty);
                setPlasmApi(plasmNode);

                setNetworkType(await web3State.web3.eth.net.getNetworkType());

                // get the initial claim parameters
                const _lockParam = getClaimParams(web3State.accounts[0]) || [];
                setLockParams(_lockParam);

                // check contract start and end dates
                const _end = await ethLockdrop.getContractEndDate(web3State.contract);
                const _start = await ethLockdrop.getContractStartDate(web3State.contract);
                setLockdropEnd(_end);
                setLockdropStart(_start);

                setWeb3(web3State.web3);
                setContract(web3State.contract);
                setAccounts(web3State.accounts);

                const _allLocks = await ethLockdrop.getAllLockEvents(web3State.web3, web3State.contract);
                setLockEvents(_allLocks);
            } catch (e) {
                toast.error(e.message);
                console.log(e);
            }
        })().finally(() => {
            setLoading({ loading: false, message: '' });
        });
        // we disable this because we want this to only call once (on component mount)
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        if (web3) {
            setLoading({
                loading: true,
                message: 'Connecting to Web3 instance with new contract...',
            });
            (async function() {
                const _contract = await ethLockdrop.createContractInstance(web3, contractAddress);

                const _allLocks = await ethLockdrop.getAllLockEvents(web3, _contract);
                setLockEvents(_allLocks);
                // get the initial claim parameters
                const _lockParam = getClaimParams(accounts[0]) || [];
                setLockParams(_lockParam);
                // check contract start and end dates
                const _end = await ethLockdrop.getContractEndDate(_contract);
                const _start = await ethLockdrop.getContractStartDate(_contract);
                setLockdropEnd(_end);
                setLockdropStart(_start);
                setContract(_contract);
            })().finally(() => {
                setLoading({ loading: false, message: '' });
            });
        }
        // we disable next line to prevent change on getClaimParams
        // eslint-disable-next-line
    }, [contractAddress, web3, accounts]);

    /**
     * called when the user changes MetaMask account
     */
    const handleAccountChange = () => {
        // refresh the page
        window.location.reload(false);
    };

    // handle metamask account change event handler
    useEffect(() => {
        // checks if account has changed in MetaMask
        if ((window as any).ethereum.on) {
            (window as any).ethereum.on('accountsChanged', handleAccountChange);
        }
        return () => {
            (window as any).ethereum.removeEventListener('accountsChanged', handleAccountChange);
        };
    }, []);

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
                    This action is required for the real-time lockdrop module ${polkadotUtil.randomAsHex(3)}`,
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
                if (!publicKey && web3) {
                    const _publicKey = await ethLockdrop.getPubKey(
                        web3,
                        `Sign this message to submit a lock request.
                This action is required for the real-time lockdrop module
                ${polkadotUtil.randomAsHex(3)}`,
                    );
                    setPublicKey(_publicKey);
                }

                contract && (await ethLockdrop.submitLockTx(formInputVal, accounts[0], contract));
                toast.success(`Successfully locked ${formInputVal.amount} ETH for ${formInputVal.duration} days!`);
            } catch (e) {
                toast.error(e.message.toString());
                console.log(e);
            }

            setLoading({ loading: false, message: '' });
        },
        [accounts, contract, publicKey, web3],
    );

    return (
        <IonPage>
            <Navbar />
            <IonContent>
                <>
                    <IonLoading isOpen={isLoading.loading} message={isLoading.message} />
                    {isMainnet ? (
                        <SectionCard maxWidth="lg">
                            <Typography variant="h2" component="h4" align="center">
                                Please access this page with a Ethereum testnet wallet (Ropsten)
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
                                <Divider />
                                <Typography variant="h4" component="h5" align="center">
                                    Lockdrop Contract Address
                                </Typography>
                                <Dropdown
                                    options={lockdropContracts.secondLock.ropsten}
                                    value={contractAddress}
                                    onChange={e => setContractAddress(e.value)}
                                />
                            </SectionCard>

                            <LockdropForm token="ETH" onSubmit={handleSubmit} description={formInfo} dusty />

                            <SectionCard maxWidth="lg">
                                <Typography variant="h4" component="h1" align="center">
                                    Real-time Lockdrop Status
                                </Typography>
                                {publicKey && plasmApi ? (
                                    <ClaimStatus
                                        claimParams={lockParams}
                                        plasmApi={plasmApi}
                                        networkType="ETH"
                                        plasmNetwork="Dusty"
                                        publicKey={publicKey}
                                    />
                                ) : (
                                    <>
                                        <Container>
                                            <IonButton expand="block" onClick={handleGetPublicKey}>
                                                Click to view lock claims
                                            </IonButton>
                                        </Container>
                                    </>
                                )}
                            </SectionCard>
                            {web3 && <LockedEthList web3={web3} accounts={accounts} lockData={allLockEvents} />}
                        </>
                    )}
                </>
                <Footer />
            </IonContent>
        </IonPage>
    );
};
export default DustyEthLockPage;
