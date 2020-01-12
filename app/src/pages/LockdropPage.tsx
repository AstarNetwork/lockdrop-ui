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
	IonSelectOption,
	IonCardTitle
} from '@ionic/react';
import React, { useState } from 'react';
import './LockdropPage.css';

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

const txTypes: OptionItem[] = [
	{ label: 'Metamask', value: 'metamask' },
	{ label: 'yo mama', value: 'yoMama' }
];

const tokenTypes: OptionItem[] = [
	{ label: 'ETH', value: 'eth' },
	{ label: 'BTC', value: 'btc' },
	{ label: 'DOT', value: 'dot' },
	{ label: 'EOS', value: 'eos' }
];

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

// the main component function
const LockdropPage: React.FC = () => {
	// states used in this component
	const [lockAmount, setAmount] = useState(0);
	const [lockDuration, setDuration] = useState(0);
	const [tokenType, setTokenType] = useState('');
	const [txType, setTxType] = useState('');

	// the submit button function
	function handleSubmit(
		lockAmount: number,
		lockDuration: number,
		tokenName: string,
		txType: string
	) {
		// checks user input
		if (lockAmount > 0 && lockDuration && tokenName && txType) {
			console.log(
				'you have submitted ' +
					lockAmount +
					' ' +
					tokenName +
					' for ' +
					lockDuration +
					' days with ' +
					txType
			);
		} else {
			// display warning if there is a problem with the input
			console.log("you're missing an input!");
		}
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
								<IonLabel>Form Inputs</IonLabel>
								<IonCard>
									<IonCardContent>
										This is the lockdrop form, please input your information
										carefully
									</IonCardContent>
								</IonCard>
								<IonItem>
									<IonLabel>Tokens Locking in</IonLabel>

									<DropdownOption
										dataSets={tokenTypes}
										onChoose={(e: React.ChangeEvent<HTMLInputElement>) =>
											setTokenType(e.target.value)
										}
									></DropdownOption>
								</IonItem>

								<IonItem>
									<IonLabel position='floating'>
										Number of{' '}
										{tokenType !== '' ? tokenType.toUpperCase() : 'Tokens'}
									</IonLabel>
									<IonInput
										placeholder={
											'ex: 0.64646 ' +
											(tokenType !== '' ? tokenType.toUpperCase() : 'Tokens')
										}
										onIonInput={e =>
											setAmount(
												((e.target as HTMLInputElement)
													.value as unknown) as number
											)
										}
									></IonInput>
								</IonItem>
								<IonItem>
									<IonLabel>Lock Duration</IonLabel>

									<DropdownOption
										dataSets={durations}
										onChoose={(e: React.ChangeEvent<HTMLInputElement>) =>
											setDuration((e.target.value as unknown) as number)
										}
									></DropdownOption>
								</IonItem>

								<IonItem>
									<IonLabel>Transaction With</IonLabel>
									<DropdownOption
										dataSets={txTypes}
										onChoose={(e: React.ChangeEvent<HTMLInputElement>) =>
											setTxType(e.target.value)
										}
									></DropdownOption>
								</IonItem>
								<IonButton
									onClick={() =>
										handleSubmit(lockAmount, lockDuration, tokenType, txType)
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
