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
import { LockInput } from '../models/LockdropModels';

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

	componentWillMount() {

		const drizzle = connectMetaMask();

		//todo: add MetaMask subscriber
	}

	componentWillUnmount() {
		//todo: remove MetaMask subscriber
	}

	handleSubmit(formInputVal: LockInput) {
		// checks user input
		if (formInputVal.amount > 0 && formInputVal.duration && formInputVal.txMethod) {
			//todo: check if affiliationAccount is a proper Ethereum address

			lockEthereum(formInputVal);

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
					{this.state.loading ? <IonLoading
						isOpen={this.state.loading}
						//todo: send error message when timeout is over
						onDidDismiss={() => this.setState({ loading: false })}
						message={'Connecting to Metamask...'}
						duration={loadTimeout}
					/> :
						<LockdropForm token='ETH' onSubmit={this.handleSubmit} description={formInfo} />
					}


				</IonContent>
			</IonPage>
		)
	}
}
export default EthLockdropPage;
