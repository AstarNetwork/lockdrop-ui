import { IonContent, IonPage, IonLoading, IonLabel } from '@ionic/react';
import React, { useState, useEffect } from 'react';
import LockdropForm from '../components/LockdropForm';
import { connectWeb3, defaultAffiliation, getLockEvents } from '../helpers/lockdrop/EthereumLockdrop';
import * as ethAddress from 'ethereum-address';
import Web3 from 'web3';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SectionCard from '../components/SectionCard';

const formInfo = `This is the lockdrop form for Ethereum.
This uses Web3 injection so you must have Metamask (or other Web3-enabled wallet) installed in order for this to work properly.
If you find any errors or find issues with this form, please contact the Plasm team.`;

class EthLockdropPage extends React.Component {
    state = {
        web3: null,
        accounts: null,
        contract: null,
    };

    // get and set the web3 state when the component is mounted
    componentDidMount = async () => {
        const web3State = await connectWeb3();
        this.setState(web3State);
    };

    componentWillUnmount = async () => {
        // unsubscribe
    };

    handleSubmit = async formInputVal => {
        // checks user input
        if (formInputVal.amount && formInputVal.duration) {
            console.log(formInputVal);

            const { accounts, contract } = this.state;
            try {
                // check user input
                if (formInputVal.affiliation === accounts[0]) {
                    alert('You cannot affiliate yourself');
                } else if (formInputVal.affiliation && !ethAddress.isAddress(formInputVal.affiliation)) {
                    alert('Please input a proper Ethereum address');
                } else {
                    // return a default address if user input is empty
                    const introducer = defaultAffiliation(formInputVal.affiliation);

                    // convert user input to Wei
                    const amountToSend = Web3.utils.toWei(formInputVal.amount, 'ether');

                    // communicate with the smart contract
                    await contract.methods.lock(formInputVal.duration, introducer).send({
                        from: accounts[0],
                        value: amountToSend,
                    });

                    alert(`Locked ${formInputVal.amount} tokens for ${formInputVal.duration} days!`);
                }
            } catch (error) {
                alert('error!\n' + error.message);
            }
        } else {
            //todo: display warning if there is a problem with the input
            alert("you're missing an input!");
        }
    };

    render() {
        return (
            <IonPage>
                <IonContent>
                    <Navbar />
                    {!this.state.web3 && !this.state.accounts && !this.state.contract ? (
                        <IonLoading isOpen={true} message={'Connecting to Metamask...'} />
                    ) : (
                        <>
                            <LockdropForm token="ETH" onSubmit={this.handleSubmit} description={formInfo} />
                            <LockedEth web3={this.state.web3} />
                        </>
                    )}
                    <Footer />
                </IonContent>
            </IonPage>
        );
    }
}
export default EthLockdropPage;

// component that displays the number of tokens and the duration for the lock via Web3
const LockedEth = ({ web3 }) => {
    const [lockEvents, setEvents] = useState([]);

    useEffect(() => {
        setTimeout(async () => {
            setEvents(await getLockEvents(web3));
            console.log(lockEvents);
        }, 5000);
    });

    return (
        <>
            <SectionCard maxWidth="lg">
                <div className="lockdrop-result">
                    <IonLabel>Hello World</IonLabel>
                    {lockEvents.map(eventItem => (
                        <IonLabel key={eventItem.transactionHash}>{eventItem.transactionHash}</IonLabel>
                    ))}
                </div>
            </SectionCard>
        </>
    );
};
