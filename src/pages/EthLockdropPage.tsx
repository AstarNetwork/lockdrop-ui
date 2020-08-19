/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import { IonContent, IonPage, IonLoading } from '@ionic/react';
import React, { useState, useEffect, useMemo } from 'react';
import * as ethLockdrop from '../helpers/lockdrop/EthereumLockdrop';
import Web3 from 'web3';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Contract } from 'web3-eth-contract';
import { LockEvent } from '../types/LockdropModels';
import LockedEthList from '../components/EthLock/LockedEthList';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { removeWeb3Event } from '../helpers/getWeb3';
import SectionCard from '../components/SectionCard';
import { Typography, Divider } from '@material-ui/core';
import moment from 'moment';
import LockdropCountdownPanel from '../components/EthLock/LockdropCountdownPanel';
import { lockdropContracts } from '../data/lockInfo';
import 'react-dropdown/style.css';
import LockdropResult from 'src/components/EthLock/LockdropResult';
import AffiliationList from 'src/components/EthLock/AffiliationList';

toast.configure({
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
});

const EthLockdropPage: React.FC = () => {
    const [web3, setWeb3] = useState<Web3>();
    const [accounts, setAccounts] = useState<string[]>([]);
    const [contract, setContract] = useState<Contract>();

    const [isLoading, setLoading] = useState<{
        loading: boolean;
        message: string;
    }>({
        loading: false,
        message: '',
    });

    const [networkType, setNetworkType] = useState('');
    const [allLockEvents, setLockEvents] = useState<LockEvent[]>([]);

    const [lockdropStart, setLockdropStart] = useState('0');
    const [lockdropEnd, setLockdropEnd] = useState('0');

    const isMainnet = useMemo(() => {
        return networkType === 'main';
    }, [networkType]);

    // fetch lock data in the background
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                // get all the lock events from the chain
                if (web3 && contract) {
                    const _allLocks = await ethLockdrop.getAllLockEvents(web3, contract);
                    setLockEvents(_allLocks);
                }
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
                const web3State = await ethLockdrop.connectWeb3(lockdropContracts.firstLock.main);

                setNetworkType(await web3State.web3.eth.net.getNetworkType());

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

    return (
        <IonPage>
            <Navbar />
            <IonContent>
                <>
                    <IonLoading isOpen={isLoading.loading} message={isLoading.message} />
                    {!isMainnet ? (
                        <SectionCard maxWidth="lg">
                            <Typography variant="h2" component="h4" align="center">
                                Please access this page with a Mainnet wallet
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
                                {web3 && (
                                    <>
                                        <Divider />
                                        <LockdropResult lockData={allLockEvents} web3={web3} />
                                    </>
                                )}
                            </SectionCard>

                            <AffiliationList lockData={allLockEvents} />

                            {web3 && <LockedEthList web3={web3} accounts={accounts} lockData={allLockEvents} />}
                        </>
                    )}
                </>
                <Footer />
            </IonContent>
        </IonPage>
    );
};
export default EthLockdropPage;
