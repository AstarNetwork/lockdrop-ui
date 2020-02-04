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
import { lockEthereum } from '../helpers/lockdrop/EthereumLockdrop';
import LockdropForm from '../components/LockdropForm';
import { connectMetaMask } from '../helpers/lockdrop/EthereumLockdrop';

const rates = [
	{ key: 20, value: 24 },
	{ key: 100, value: 100 },
	{ key: 300, value: 360 },
	{ key: 1000, value: 1600 }
];

const loadTimeout = 5000;

const formInfo =
`This is the lockdrop form for Ethereum
You must have Metamask installed in order for this to work properly.
If you find any errors or find issues with this form, please contact the Plasm team.`;

class EthLockdropPage extends React.Component {
	state = {
		loading: true,
		drizzleState: null
	};
	
	componentWillMount(){

		//let drizzle = connectMetaMask();

		const dirzzle = connectMetaMask();

		//todo: add MetaMask subscriber
	}

	componentWillUnmount(){
		//todo: remove MetaMask subscriber
	}

	handleSubmit(
		lockAmount: number,
		lockDuration: number,
		tokenName: string,
		affiliationAccount: string
	) {
		// checks user input
		if (lockAmount > 0 && lockDuration && tokenName) {
			//todo: check if affiliationAccount is a proper Ethereum address

			// get the token increase rate
			let incRate = rates.filter(x => x.key === lockDuration)[0].value;

			lockEthereum(lockDuration, lockAmount, incRate, affiliationAccount);

		} else {
			//todo: display warning if there is a problem with the input
			alert('you\'re missing an input!');
		}
	}

	//todo: add loading screen here to check if metamask is connected or not
	render(){
		return(
			<IonPage>
				<IonHeader translucent>
					<IonToolbar>
						<IonTitle>Lockdrop Form</IonTitle>
					</IonToolbar>
				</IonHeader>

				<IonContent>
					{this.state.loading ? <IonLoading
						isOpen={this.state.loading}
						onDidDismiss={() =>  this.setState({loading: false})}
						message={'Connecting to Metamask...'}
						duration={loadTimeout}
					/> : <LockdropForm token='ETH' onSubmit={this.handleSubmit} description={formInfo} />}
					

				</IonContent>
			</IonPage>
		)
	}
}
export default EthLockdropPage;
