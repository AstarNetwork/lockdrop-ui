/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import { IonContent, IonPage, IonLoading } from '@ionic/react';
import React from 'react';
import LockdropForm from '../components/LockdropForm';
import { connectWeb3, defaultAffiliation, getAllLockEvents } from '../helpers/lockdrop/EthereumLockdrop';
import Web3 from 'web3';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Contract } from 'web3-eth-contract';
import { LockInput, LockEvent } from '../models/LockdropModels';
import LockedEthList from '../components/LockedEthList';
import { toast } from 'react-toastify';
import { isRegisteredEthAddress } from '../data/affiliationProgram';
import 'react-toastify/dist/ReactToastify.css';
import SectionCard from '../components/SectionCard';
import LockdropCountdownPanel from '../components/LockdropCountdownPanel';
import { LockdropEnd, LockdropStart } from '../data/lockInfo';
import BN from 'bn.js';
import moment from 'moment';
import LockdropResult from '../components/LockdropResult';
import { Divider } from '@material-ui/core';

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
                        </a> to see the details`;

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

const hasLockdropStarted = () => {
    const now = moment()
        .utc()
        .valueOf();
    const start = LockdropStart.valueOf();
    //const end = LockdropEnd.valueOf();
    return start <= now;
};

const hasLockdropEnded = () => {
    const now = moment()
        .utc()
        .valueOf();
    const end = LockdropEnd.valueOf();
    //const end = LockdropEnd.valueOf();
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

    timerInterval: any;

    // get and set the web3 state when the component is mounted
    componentDidMount = async () => {
        const web3State = await connectWeb3();
        this.setState(web3State);

        // checks if account has changed in MetaMask
        if ((window as any).ethereum.on) {
            (window as any).ethereum.on('accountsChanged', this.handleAccountChange);
        }

        this.state.web3.eth.net.getNetworkType().then(i => this.setState({ networkType: i }));

        this.timerInterval = setInterval(
            this.getLockData().then(() => {
                this.setState({ isLoading: false });
            }),
            1000,
        );

        // fetch all locks from the Ethereum chain
        // this.getLockData().then(() => {
        //     this.setState({ isLoading: false });
        // });
    };

    componentWillUnmount = () => {
        clearInterval(this.timerInterval);
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
        // checks user input
        if (formInputVal.amount > new BN(0) && formInputVal.duration) {
            this.setState({ isProcessing: true });
            //console.log(formInputVal);
            // return a default address if user input is empty
            const introducer = defaultAffiliation(formInputVal.affiliation).toLowerCase();
            const { accounts, contract } = this.state;
            try {
                // check user input
                if (introducer === accounts[0]) {
                    toast.error('You cannot affiliate yourself');
                } else if (introducer && !Web3.utils.isAddress(introducer)) {
                    toast.error('Please input a valid Ethereum address');
                } else if (!isRegisteredEthAddress(introducer)) {
                    toast.error('The given introducer is not registered in the affiliation program!');
                } else {
                    // convert user input to Wei
                    const amountToSend = Web3.utils.toWei(formInputVal.amount, 'ether');

                    // communicate with the smart contract
                    await contract.methods.lock(formInputVal.duration, introducer).send({
                        from: accounts[0],
                        value: amountToSend,
                    });

                    toast.success(`Successfully locked ${formInputVal.amount} ETH for ${formInputVal.duration} days!`);
                }
            } catch (error) {
                toast.error('error!\n' + error.message);
            }
        } else {
            toast.error('You are missing an input!');
        }
        this.setState({ isProcessing: false });
    };

    render() {
        return (
            <IonPage>
                <IonContent>
                    <Navbar />
                    {hasLockdropStarted() ? (
                        this.state.isLoading ? (
                            <IonLoading isOpen={true} message={'Connecting to Wallet and fetching chain data...'} />
                        ) : (
                            <>
                                {this.state.isProcessing ? (
                                    <IonLoading
                                        isOpen={this.state.isProcessing}
                                        message={'Processing Transaction...'}
                                    />
                                ) : (
                                    <></>
                                )}
                                <SectionCard maxWidth="lg">
                                    <LockdropCountdownPanel
                                        endTime={LockdropEnd}
                                        startTime={LockdropStart}
                                        lockData={this.state.allLockEvents}
                                    />
                                    {hasLockdropEnded() ? (
                                        <>
                                            <Divider />
                                            <LockdropResult
                                                lockData={this.state.allLockEvents}
                                                web3={this.state.web3}
                                                contract={this.state.contract}
                                            />
                                        </>
                                    ) : (
                                        <></>
                                    )}
                                </SectionCard>
                                {hasLockdropEnded() ? (
                                    <></>
                                ) : (
                                    <LockdropForm token="ETH" onSubmit={this.handleSubmit} description={formInfo} />
                                )}
                                <LockedEthList
                                    web3={this.state.web3}
                                    contractInstance={this.state.contract}
                                    accounts={this.state.accounts}
                                    lockData={this.state.allLockEvents}
                                />
                            </>
                        )
                    ) : (
                        <>
                            <SectionCard maxWidth="lg">
                                <LockdropCountdownPanel
                                    endTime={LockdropEnd}
                                    startTime={LockdropStart}
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
