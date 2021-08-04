/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import { IonContent, IonPage } from '@ionic/react';
import React, { useState, useEffect } from 'react';
import * as ethLockdrop from '../helpers/lockdrop/EthereumLockdrop';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { LockEvent } from '../types/LockdropModels';
import LockedEthList from '../components/EthLock/LockedEthList';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SectionCard from '../components/SectionCard';
import { Typography, Divider } from '@material-ui/core';
import moment from 'moment';
import LockdropCountdownPanel from '../components/EthLock/LockdropCountdownPanel';
import { firstLockContract } from '../data/lockInfo';
import 'react-dropdown/style.css';
import LockdropResult from '../components/EthLock/LockdropResult';
import AffiliationList from '../components/EthLock/AffiliationList';
import { useEth, isMainnet } from '../api/Web3Api';
import LoadingOverlay from '../components/LoadingOverlay';

const FirstEthLockdropPage: React.FC = () => {
    const {
        web3,
        contract,
        error,
        lockdropStart,
        lockdropEnd,
        currentNetwork,
        setIsMainnetLock,
        changeContractAddress,
    } = useEth();

    const [allLockEvents, setLockEvents] = useState<LockEvent[]>([]);
    const lockStoreKey = `id:${firstLockContract.find(i => i.type === 'main')?.address}`;

    // Set network and contract address
    useEffect(() => {
        setIsMainnetLock(true);

        const contAddr = firstLockContract.find(i => i.type === 'main')?.address;
        if (typeof contAddr !== 'undefined') {
            changeContractAddress(contAddr);
        } else {
            toast.error('Could not find lockdrop contract');
        }
        // eslint-disable-next-line
    }, []);

    // store all lock events to local storage every time things changes
    useEffect(() => {
        if (allLockEvents.length > 0 && Array.isArray(allLockEvents)) {
            const serializedEvents = ethLockdrop.serializeLockEvents(allLockEvents);
            // ensure that the store value are not the same before storing
            if (localStorage.getItem(lockStoreKey) !== serializedEvents) {
                localStorage.setItem(lockStoreKey, serializedEvents);
            }
        }
    }, [allLockEvents, lockStoreKey]);

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
                const _allLocks = await ethLockdrop.getAllLockEvents(contract);
                setLockEvents(_allLocks);
            }
        };

        fetchLockEvents();
    }, [contract]);

    return (
        <IonPage>
            <Navbar />
            <IonContent>
                <>
                    <LoadingOverlay />
                    {!isMainnet(currentNetwork) ? (
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
                                        <LockdropResult lockData={allLockEvents} />
                                    </>
                                )}
                            </SectionCard>

                            <AffiliationList lockData={allLockEvents} />

                            {web3 && <LockedEthList lockData={allLockEvents} />}
                        </>
                    )}
                </>
                <Footer />
            </IonContent>
        </IonPage>
    );
};
export default FirstEthLockdropPage;
