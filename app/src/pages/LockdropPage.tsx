import {
	IonLabel,
	IonContent,
	IonPage,
	IonTitle,
	IonToolbar,
	IonHeader,
	IonButton,
	IonCol,
	IonGrid,
	IonRow,
	IonItem,
	IonInput,
	IonCard,
	IonCardContent,
	IonSelect,
	IonSelectOption
} from '@ionic/react';
import React, { useState } from 'react';
import './LockdropPage.css';
import { IonicReactProps } from '@ionic/react/dist/types/components/IonicReactProps';

// option item type is used to provide the data for dropdown items
type OptionItem = {
	label: string;
	value: number | string;
};

// option data is the type that is going to be passed to the component
type OptionData = {
	dataSets: OptionItem[];
	onChoose: Function;
};

const durations: OptionItem[] = [
	{ label: '30 Days', value: 30 },
	{ label: '100 Days', value: 100 },
	{ label: '300 Days', value: 300 },
	{ label: '1000 Days', value: 1000 }
];

const txType: OptionItem[] = [{ label: 'Metamask', value: 'metamask' }];

const tokenTypes: OptionItem[] = [
	{ label: 'ETH', value: 'eth' },
	{ label: 'BTC', value: 'btc' },
	{ label: 'DOT', value: 'dot' },
	{ label: 'EOS', value: 'eos' }
];

// the main component function
const LockdropPage: React.FC = () => {
	// states used in this component
	const [lockAmount, setAmount] = useState(0);
	const [lockDuration, setDuration] = useState(0);
	const [tokenType, setTokenType] = useState('ETH');

	// react function component for making dropdown with the given items
	const DropdownOption = (props: OptionData) => {
		const items = props.dataSets.map(x => {
			return (
				<IonSelectOption
					className='dropdown-item'
					key={props.dataSets.indexOf(x)}
					value={x.value}
				>
					{x.label}
				</IonSelectOption>
			);
		});

		return (
			<IonSelect interface='popover' onIonChange={e => props.onChoose(e)}>
				{items}
			</IonSelect>
		);
	};

	// the submit button function
	function handleSubmit(
		lockAmount: number,
		lockDuration: number,
		tokenName: string
	) {
		console.log(
			'you have submitted ' +
				lockAmount +
				' ' +
				tokenName +
				' for ' +
				lockDuration +
				' days'
		);
	}

	return (
		<IonPage>
			<IonHeader translucent>
				<IonToolbar>
					<IonTitle>Lockdrop Form</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent>
				<IonGrid>
					<IonRow>
						<IonCol></IonCol>
						<IonCol size='auto'>
							<div className='main-content'>
								<IonLabel>Lockdrop Contract Address</IonLabel>
								<IonCard>
									<IonCardContent>
										This is the lockdrop form, please input your information
										carefully
									</IonCardContent>
								</IonCard>
								<IonItem>
									<IonLabel>Tokens Locking</IonLabel>

									<DropdownOption
										dataSets={tokenTypes}
										onChoose={() => console.log('you choose ')}
									></DropdownOption>
								</IonItem>
								<IonItem>
									<IonLabel position='floating'>Amount of {tokenType}</IonLabel>
									<IonInput placeholder={'0.64646 ' + tokenType}></IonInput>
								</IonItem>
								<IonItem>
									<IonLabel>Lock Duration</IonLabel>
									<DropdownOption
										dataSets={durations}
										onChoose={() => console.log('you choose ')}
									></DropdownOption>
								</IonItem>
								<IonItem>
									<IonLabel>Transaction Type</IonLabel>
									<DropdownOption
										dataSets={txType}
										onChoose={() => console.log('you choose ')}
									></DropdownOption>
								</IonItem>
								<IonButton
									onClick={() =>
										handleSubmit(lockAmount, lockDuration, tokenType)
									}
								>
									Submit Transaction
								</IonButton>
							</div>
						</IonCol>
						<IonCol></IonCol>
					</IonRow>
				</IonGrid>
			</IonContent>
		</IonPage>
	);
};

export default LockdropPage;
