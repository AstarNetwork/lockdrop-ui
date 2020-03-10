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

const formInfo = `This is the lockdrop form for Ethereum.
This uses Web3 injection so you must have Metamask (or other Web3-enabled wallet) installed in order for this to work properly.
If you find any errors or find issues with this form, please contact the Plasm team.`;

interface PageStates {
    web3: Web3;
    accounts: string[];
    contract: Contract;
    isLoading: boolean;
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

class EthLockdropPage extends React.Component<PageProps, PageStates> {
    constructor(props: PageProps) {
        super(props);
        // initialize with null values
        this.state = {
            web3: {} as Web3,
            accounts: [''],
            contract: {} as Contract,
            isLoading: true,
        };
    }

    // get and set the web3 state when the component is mounted
    componentDidMount = async () => {
        const web3State = await connectWeb3();
        this.setState(web3State);
        // checks if account has changed
        (window as any).ethereum.on('accountsChanged', this.handleAccountChange);
        this.setState({ isLoading: false });
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
        if (formInputVal.amount && formInputVal.duration) {
            console.log(formInputVal);
            // return a default address if user input is empty
            const introducer = defaultAffiliation(formInputVal.affiliation);
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
                    //todo: refresh lock history list
                }
            } catch (error) {
                toast.error('error!\n' + error.message);
            }
        } else {
            toast.error('You are missing an input!');
        }
    };

    render() {
        return (
            <IonPage>
                <IonContent>
                    <Navbar />
                    {/*We use this pattern to prevent undefined Web3 from mounting*/}
                    {this.state.isLoading ? (
                        <IonLoading isOpen={true} message={'Connecting to Metamask...'} />
                    ) : (
                        <>
                            <LockdropForm token="ETH" onSubmit={this.handleSubmit} description={formInfo} />
                            <LockedEthList web3={this.state.web3} contractInstance={this.state.contract} />
                        </>
                    )}
                    <Footer />
                </IonContent>
            </IonPage>
        );
    }
}
export default EthLockdropPage;
