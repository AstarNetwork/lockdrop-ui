import {
	IonContent,
	IonPage,
	IonTitle,
	IonToolbar,
	IonHeader,
	IonLoading
} from '@ionic/react';
import React from 'react';
import LockdropForm from '../components/LockdropForm';
import { connectWeb3 } from '../helpers/lockdrop/EthereumLockdrop';

const formInfo = `This is the lockdrop form for Ethereum
You must have Metamask installed in order for this to work properly.
If you find any errors or find issues with this form, please contact the Plasm team.`;

class EthLockdropPage extends React.Component {
	state = {
		web3: null,
		accounts: null,
		contract: null
	};

	componentDidMount = async () => {
		const web3State = await connectWeb3();
		this.setState(web3State);
	};

	handleSubmit = async formInputVal => {
		// checks user input
		if (formInputVal.amount && formInputVal.duration) {
			//todo: check if affiliation account is a proper Ethereum address before runtime error hits

			console.log(formInputVal);

			const { accounts, contract } = this.state;
			try {
				//todo: add default affiliation address when none is provided

				await contract.methods
					.lock(formInputVal.duration, formInputVal.affiliation)
					.send({ from: accounts[0] });
				//todo: send ether to contract
			} catch (error) {
				alert('error!\n' + error);
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
						<LockdropForm
							token='ETH'
							onSubmit={this.handleSubmit}
							description={formInfo}
						/>
					)}
				</IonContent>
			</IonPage>
		);
	}
}
export default EthLockdropPage;
