/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import { IonContent, IonPage, IonLoading } from '@ionic/react';
import React, { useState, useEffect } from 'react';
import * as ethLockdrop from '../helpers/lockdrop/EthereumLockdrop';
import Web3 from 'web3';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { LockEvent } from '../types/LockdropModels';
import LockedEthList from '../components/EthLock/LockedEthList';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { removeWeb3Event } from '../helpers/getWeb3';
import SectionCard from '../components/SectionCard';
import { Typography, Divider } from '@material-ui/core';
import moment from 'moment';
import LockdropCountdownPanel from '../components/EthLock/LockdropCountdownPanel';
import { firstLockContract } from '../data/lockInfo';
import 'react-dropdown/style.css';
import LockdropResult from 'src/components/EthLock/LockdropResult';
import AffiliationList from 'src/components/EthLock/AffiliationList';

const FirstEthLockdropPage: React.FC = () => {
    const [web3, setWeb3] = useState<Web3>();
    const [account, setAccount] = useState<string>('');

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

    const isMainnet = (currentNetwork: string) => {
        return currentNetwork === 'main';
    };

    // load web3 instance
    useEffect(() => {
        setLoading({
            loading: true,
            message: 'Connecting to Web3 instance...',
        });
        (async function() {
            try {
                const web3State = await ethLockdrop.connectWeb3();
                const _netType = await web3State.eth.net.getNetworkType();
                setNetworkType(_netType);
                if (isMainnet(_netType)) {
                    const contAddr = firstLockContract.find(i => i.type === 'main')?.address;
                    if (typeof contAddr === 'undefined') {
                        throw new Error('Could not find lockdrop contract');
                    }

                    const _contract = await ethLockdrop.createContractInstance(web3State, contAddr);

                    const ethAddr = await ethLockdrop.fetchAllAddresses(web3State);

                    // check contract start and end dates
                    const _end = await ethLockdrop.getContractEndDate(_contract);
                    const _start = await ethLockdrop.getContractStartDate(_contract);
                    setLockdropEnd(_end);
                    setLockdropStart(_start);

                    setWeb3(web3State);
                    setAccount(ethAddr[0]);

                    const _allLocks = await ethLockdrop.getAllLockEvents(web3State, _contract);
                    setLockEvents(_allLocks);
                }
            } catch (e) {
                toast.error(e.message);
                console.log(e);
            }
        })().finally(() => {
            setLoading({ loading: false, message: '' });
        });
        return () => {
            removeWeb3Event();
        };
        // we disable this because we want this to only call once (on component mount)
        // eslint-disable-next-line
    }, []);

    return (
        <IonPage>
            <Navbar />
            <IonContent>
                <>
                    <IonLoading isOpen={isLoading.loading} message={isLoading.message} />
                    {!isMainnet(networkType) ? (
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

                            {web3 && <LockedEthList web3={web3} account={account} lockData={allLockEvents} />}
                        </>
                    )}
                </>
                <Footer />
            </IonContent>
        </IonPage>
    );
};
export default FirstEthLockdropPage;
