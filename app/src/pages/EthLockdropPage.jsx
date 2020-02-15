import {
	IonContent,
	IonPage,
	IonTitle,
	IonToolbar,
	IonHeader,
	IonLoading
} from '@ionic/react';
import React from 'react';

import '../helpers/lockdrop/EthereumLockdrop';
import LockdropForm from '../components/LockdropForm';
import getWeb3 from '../helpers/getWeb3';
import Lockdrop from '../contracts/Lockdrop.json';

const formInfo =
	`This is the lockdrop form for Ethereum
You must have Metamask installed in order for this to work properly.
If you find any errors or find issues with this form, please contact the Plasm team.`;

class EthLockdropPage extends React.Component {
	state = {
		web3: null,
		accounts: null,
		contract: null
	};

	componentWillMount() {

		//connectMetaMask();

		//todo: add MetaMask subscriber
	}

	componentWillUnmount() {
		//todo: remove MetaMask subscriber
	}

	componentDidMount = async () => {
		try {
			// Get network provider and web3 instance.
			const web3 = await getWeb3();

			// Use web3 to get the user's accounts.
			const accounts = await web3.eth.getAccounts();

			// Get the contract instance.
			const networkId = await web3.eth.net.getId();
			const deployedNetwork = Lockdrop.networks[networkId];
			const instance = new web3.eth.Contract(
				Lockdrop.abi,
				deployedNetwork && deployedNetwork.address,
			);

			// Set web3, accounts, and contract to the state, and then proceed with an
			// example of interacting with the contract's methods.
			//this.setState({ web3, accounts, contract: instance }, this.handleSubmit);
			this.setState({ web3, accounts, contract: instance });
		} catch (error) {
			// Catch any errors for any of the above operations.
			alert(
				`Failed to load web3, accounts, or contract. Check console for details.`,
			);
			console.error(error);
		}
	};

	handleSubmit = async(formInputVal) => {
		// checks user input
		if (formInputVal.amount && formInputVal.duration) {
			//todo: check if affiliationAccount is a proper Ethereum address

			console.log(formInputVal);
			//lockEthereum(formInputVal);
			const { accounts, contract } = this.state;

			await contract.methods.lock(formInputVal.duration, formInputVal.affiliation).send({ from: accounts[0] });

		} else {
			//todo: display warning if there is a problem with the input
			alert('you\'re missing an input!');
		}
	}

	render() {
		return (
			<IonPage>
				<IonHeader translucent>
					<IonToolbar>
						<IonTitle>Lockdrop Form</IonTitle>
					</IonToolbar>
				</IonHeader>

				<IonContent>
					{!this.state.web3 ? <IonLoading
						isOpen={true}
						message={'Connecting to Metamask...'}
					/> :
						<LockdropForm token='ETH' onSubmit={this.handleSubmit} description={formInfo} />
					}
				</IonContent>
			</IonPage>
		)
	}
}
export default EthLockdropPage;
