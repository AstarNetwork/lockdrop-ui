// This module is used for communicating with the Ethereum smart contract

import Lockdrop from '../../contracts/Lockdrop.json';
import {LockInput} from '../../models/LockdropModels';

import {
	Drizzle, IDrizzleOptions
} from '@drizzle/store';

export const drizzleOptions: IDrizzleOptions = {
	contracts: [],
	events: {
		Lockdrop: ["Locked"],
	}
};

// locks the given token
export function lockEthereum(
	contractInputs: LockInput
) {

	console.log(
		'locking ' + contractInputs.amount + ' ETH for ' + contractInputs.duration + ' days with the rate of ' + contractInputs.rate
	);
	if (contractInputs.affiliation) {
		console.log('Affiliation from ' + contractInputs.affiliation);
	}
	else {
		console.log('no friends for this poor account');
	}

}

export function getContractEvent() {
	return 'this is a smart contract state';
}

// this function will authenticate if the client has metamask installed and can communicate with the blockchain
export function connectMetaMask() {
	return new Drizzle(drizzleOptions);
	
}
