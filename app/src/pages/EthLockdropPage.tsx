/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import { IonContent, IonPage, IonLoading } from '@ionic/react';
import React from 'react';
import LockdropForm from '../components/LockdropForm';
import { connectWeb3, defaultAffiliation } from '../helpers/lockdrop/EthereumLockdrop';
import Web3 from 'web3';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Contract } from 'web3-eth-contract';
import { LockInput } from '../models/LockdropModels';
import LockedEthList from '../components/LockedEthList';
import { toast } from 'react-toastify';
import { isRegisteredEthAddress } from '../data/affiliationProgram';
import 'react-toastify/dist/ReactToastify.css';
import SectionCard from '../components/SectionCard';
import LockdropCountdownPanel from '../components/LockdropCountdownPanel';
import { LockdropEnd, LockdropStart } from '../data/lockInfo';
import BN from 'bn.js';

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
    const now = Date.now();
    const start = +new Date(LockdropStart);
    const end = +new Date(LockdropEnd);
    return start <= now && now < end;
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
        };
    }

    // get and set the web3 state when the component is mounted
    componentDidMount = async () => {
        const web3State = await connectWeb3();
        this.setState(web3State);
        // checks if account has changed
        (window as any).ethereum.on('accountsChanged', this.handleAccountChange);
        this.setState({ isLoading: false });
        this.state.web3.eth.net.getNetworkType().then(i => this.setState({ networkType: i }));
    };

    componentWillUnmount = async () => {
        // unsubscribe
    };

    // called when the user changes MetaMask account
    handleAccountChange = () => {
        // refresh the page
        window.location.reload(false);
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
                    {this.state.networkType !== 'main' || hasLockdropStarted() ? (
                        this.state.isLoading ? (
                            <IonLoading isOpen={true} message={'Connecting to Wallet...'} />
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

                                {this.state.networkType === 'main' ? (
                                    <SectionCard maxWidth="lg">
                                        <LockdropCountdownPanel endTime={LockdropEnd} startTime={LockdropStart} />
                                    </SectionCard>
                                ) : (
                                    <></>
                                )}
                                <LockdropForm token="ETH" onSubmit={this.handleSubmit} description={formInfo} />
                                <LockedEthList
                                    web3={this.state.web3}
                                    contractInstance={this.state.contract}
                                    accounts={this.state.accounts}
                                />
                            </>
                        )
                    ) : (
                        <SectionCard maxWidth="lg">
                            <LockdropCountdownPanel endTime={LockdropEnd} startTime={LockdropStart} />
                        </SectionCard>
                    )}
                    <Footer />
                </IonContent>
            </IonPage>
        );
    }
}
export default EthLockdropPage;
