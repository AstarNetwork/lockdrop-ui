/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import { IonContent, IonPage, IonLoading } from '@ionic/react';
import React from 'react';
import LockdropForm from '../components/EthLock/LockdropForm';
import { connectWeb3, getAllLockEvents, submitLockTx } from '../helpers/lockdrop/EthereumLockdrop';
import Web3 from 'web3';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Contract } from 'web3-eth-contract';
import { LockInput, LockEvent } from '../types/LockdropModels';
import LockedEthList from '../components/EthLock/LockedEthList';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SectionCard from '../components/SectionCard';
import LockdropCountdownPanel from '../components/LockdropCountdownPanel';
import { firstLockdropEnd, firstLockdropStart } from '../data/lockInfo';
import moment from 'moment';
import LockdropResult from '../components/EthLock/LockdropResult';
import { Divider } from '@material-ui/core';
import AffiliationList from '../components/EthLock/AffiliationList';
import { removeWeb3Event } from '../helpers/getWeb3';

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

interface PageStates {
    web3: Web3;
    accounts: string[];
    contract: Contract;
    isLoading: boolean;
    networkType: string;
    isProcessing: boolean;
    allLockEvents: LockEvent[];
    error: null;
    fetchingLockData: boolean;
}

// need an empty interface to use states (React's generic positioning)
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface PageProps {}

toast.configure({
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
});

const hasFirstLockdropStarted = () => {
    const now = moment()
        .utc()
        .valueOf();
    const start = firstLockdropStart.valueOf();
    //const end = firstLockdropEnd.valueOf();
    return start <= now;
};

const hasFirstLockdropEnded = () => {
    const now = moment()
        .utc()
        .valueOf();
    const end = firstLockdropEnd.valueOf();
    return end <= now;
};

class EthLockdropPage extends React.Component<PageProps, PageStates> {
    constructor(props: PageProps) {
        super(props);
        // initialize with null values
        this.state = {
            web3: {} as Web3,
            accounts: [''],
            contract: {} as Contract,
            isLoading: true,
            networkType: '',
            isProcessing: false,
            allLockEvents: [],
            error: null,
            fetchingLockData: true,
        };
    }
    // used for fetching data periodically
    timerInterval: any;

    // get and set the web3 state when the component is mounted
    componentDidMount = async () => {
        const web3State = await connectWeb3('firstLock');
        this.setState(web3State);

        // checks if account has changed in MetaMask
        if ((window as any).ethereum.on) {
            (window as any).ethereum.on('accountsChanged', this.handleAccountChange);
        }

        this.setState({ networkType: await this.state.web3.eth.net.getNetworkType() });

        //this.state.web3.eth.net.getNetworkType().then(i => this.setState({ networkType: i }));

        this.timerInterval = setInterval(() => {
            this.getLockData().then(() => {
                this.setState({ isLoading: false });
            });
        }, 5000);
    };

    componentWillUnmount = () => {
        clearInterval(this.timerInterval);
        removeWeb3Event();
    };

    isMainnet = () => {
        return this.state.networkType === 'main';
    };

    // called when the user changes MetaMask account
    handleAccountChange = () => {
        // refresh the page
        window.location.reload(false);
    };

    getLockData = async () => {
        try {
            // get all the lock events from the chain
            const allLocks = await getAllLockEvents(this.state.web3, this.state.contract);

            this.setState({ allLockEvents: allLocks });
        } catch (error) {
            this.setState({ error });
        }
    };

    handleSubmit = async (formInputVal: LockInput) => {
        this.setState({ isProcessing: true });
        try {
            await submitLockTx(formInputVal, this.state.accounts[0], this.state.contract);
            toast.success(`Successfully locked ${formInputVal.amount} ETH for ${formInputVal.duration} days!`);
        } catch (e) {
            toast.error(e.toString());
        }

        this.setState({ isProcessing: false });
    };

    render() {
        return (
            <IonPage>
                <Navbar />
                <IonContent>
                    {hasFirstLockdropStarted() ? (
                        this.state.isLoading ? (
                            <IonLoading isOpen={true} message={'Connecting to Wallet and fetching chain data...'} />
                        ) : (
                            <>
                                {this.state.isProcessing ? (
                                    <IonLoading
                                        isOpen={this.state.isProcessing}
                                        message={'Processing Transaction...'}
                                    />
                                ) : null}

                                <SectionCard maxWidth="lg">
                                    <LockdropCountdownPanel
                                        endTime={firstLockdropEnd}
                                        startTime={firstLockdropStart}
                                        lockData={this.state.allLockEvents}
                                    />
                                    {hasFirstLockdropEnded() && this.isMainnet() ? (
                                        <>
                                            <Divider />
                                            <LockdropResult
                                                lockData={this.state.allLockEvents}
                                                web3={this.state.web3}
                                            />
                                        </>
                                    ) : null}
                                </SectionCard>
                                <AffiliationList lockData={this.state.allLockEvents} />
                                {hasFirstLockdropEnded() ? null : (
                                    <LockdropForm token="ETH" onSubmit={this.handleSubmit} description={formInfo} />
                                )}

                                <LockedEthList
                                    web3={this.state.web3}
                                    accounts={this.state.accounts}
                                    lockData={this.state.allLockEvents}
                                />
                            </>
                        )
                    ) : (
                        <>
                            <SectionCard maxWidth="lg">
                                <LockdropCountdownPanel
                                    endTime={firstLockdropEnd}
                                    startTime={firstLockdropStart}
                                    lockData={this.state.allLockEvents}
                                />
                            </SectionCard>
                        </>
                    )}
                    <Footer />
                </IonContent>
            </IonPage>
        );
    }
}
export default EthLockdropPage;
