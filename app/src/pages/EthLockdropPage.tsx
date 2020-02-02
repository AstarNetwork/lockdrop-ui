import {
	IonContent,
	IonPage,
	IonTitle,
	IonToolbar,
	IonHeader
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

const formInfo = 'This is the info';

class EthLockdropPage extends React.Component {

	componentWillMount(){

		let drizzle = connectMetaMask();
		
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

	render(){
		return(
			<IonPage>
				<IonHeader translucent>
					<IonToolbar>
						<IonTitle>Lockdrop Form</IonTitle>
					</IonToolbar>
				</IonHeader>

				<IonContent>

					<LockdropForm token='ETH' onSubmit={this.handleSubmit} description={formInfo}/>

				</IonContent>
			</IonPage>
		)
	}
}

// //todo: change this to a class component and move the MetaMask check to here
// // the main component function
// const EthLockdropPageOld: React.FC = () => {
// 	// states used in this component
// 	const [lockAmount, setAmount] = useState(0);
// 	const [lockDuration, setDuration] = useState(0);
// 	const [txType, setTxType] = useState('');
// 	const [affAccount, setAff] = useState('');

// 	// the submit button function
// 	function handleSubmit(
// 		lockAmount: number,
// 		lockDuration: number,
// 		tokenName: string,
// 		affiliationAccount: string
// 	) {
// 		// checks user input
// 		if (lockAmount > 0 && lockDuration && tokenName) {
// 			//todo: check if affiliationAccount is a proper Ethereum address

// 			// get the token increase rate
// 			let incRate = rates.filter(x => x.key === lockDuration)[0].value;

// 			lockEthereum(lockDuration, lockAmount, incRate, affiliationAccount);

// 		} else {
// 			//todo: display warning if there is a problem with the input
// 			alert('you\'re missing an input!');
// 		}
// 	}

// 	// main render JSX
// 	return (
// 		<IonPage>
// 			<IonHeader translucent>
// 				<IonToolbar>
// 					<IonTitle>Lockdrop Form</IonTitle>
// 				</IonToolbar>
// 			</IonHeader>

// 			<IonContent>
// 				<IonGrid>
// 					<IonRow>
// 						<IonCol></IonCol>
// 						<IonCol size='auto'>
// 							<div className='main-content'>
// 								<IonLabel>Form Inputs</IonLabel>
// 								<IonCard>
// 									<IonCardContent>
// 										To continue with this Lockdrop, you must have Metamask extension installed to your browser.
// 										You can install it from your browser's App Store page.

// 										Todo: add table of token increase rate per lock duration
// 									</IonCardContent>
// 								</IonCard>

// 								<IonItem>
// 									<IonLabel position='floating'>
// 										Number of ETH
// 									</IonLabel>
// 									<IonInput
// 										placeholder={
// 											'ex: 0.64646 ETH'
// 										}
// 										onIonInput={e =>
// 											setAmount(
// 												((e.target as HTMLInputElement)
// 													.value as unknown) as number
// 											)
// 										}
// 									></IonInput>
// 								</IonItem>
// 								<IonItem>
// 									<IonLabel>Lock Duration</IonLabel>

// 									<DropdownOption
// 										dataSets={durations}
// 										onChoose={(e: React.ChangeEvent<HTMLInputElement>) =>
// 											setDuration((e.target.value as unknown) as number)
// 										}
// 									></DropdownOption>
// 								</IonItem>

// 								<IonItem>
// 									<IonLabel>Transaction With</IonLabel>
// 									<DropdownOption
// 										dataSets={txTypes}
// 										onChoose={(e: React.ChangeEvent<HTMLInputElement>) =>
// 											setTxType(e.target.value)
// 										}
// 									></DropdownOption>
// 								</IonItem>

// 								<IonItem>
// 									<IonCard>
// 										<IonCardContent>
// 											If you have a friend who is also participating in the lockdrop, please input the address.
// 											Both parties will be able to receive a bonus rate.
// 									</IonCardContent>
// 									</IonCard>
// 									<IonLabel position='floating'>Affiliation (optional)</IonLabel>

// 									<IonInput
// 										placeholder={
// 											'ex: 0x324632...'
// 										}
// 										onIonInput={e => setAff((e.target as HTMLInputElement).value)}
// 									></IonInput>
// 								</IonItem>

// 								<IonButton
// 									onClick={() =>
// 										handleSubmit(lockAmount, lockDuration, txType, affAccount)
// 									}
// 								>
// 									Submit Transaction
// 								</IonButton>
// 							</div>
// 						</IonCol>
// 						<IonCol></IonCol>
// 					</IonRow>
// 				</IonGrid>
// 			</IonContent>
// 		</IonPage>
// 	);
// };

export default EthLockdropPage;
