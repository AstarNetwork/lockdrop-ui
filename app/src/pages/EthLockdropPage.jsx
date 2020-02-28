import { IonContent, IonPage, IonTitle, IonToolbar, IonHeader, IonLoading } from '@ionic/react';
import React from 'react';
import LockdropForm from '../components/LockdropForm';
import { connectWeb3, defaultAffiliation } from '../helpers/lockdrop/EthereumLockdrop';
import * as ethAddress from 'ethereum-address';
import Web3 from 'web3';

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
                    await contract.methods
                        .lock(formInputVal.duration, introducer)
                        .send({ from: accounts[0], value: amountToSend });
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
                <IonHeader translucent>
                    <IonToolbar>
                        <IonTitle>Lockdrop Form</IonTitle>
                    </IonToolbar>
                </IonHeader>

                <IonContent>
                    {!this.state.web3 && !this.state.accounts && !this.state.contract ? (
                        <IonLoading isOpen={true} message={'Connecting to Metamask...'} />
                    ) : (
                        <LockdropForm token="ETH" onSubmit={this.handleSubmit} description={formInfo} />
                    )}
                </IonContent>
            </IonPage>
        );
    }
}
export default EthLockdropPage;
