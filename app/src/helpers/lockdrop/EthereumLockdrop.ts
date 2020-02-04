// This module is used for communicating with the Ethereum smart contract

import Lockdrop from '../../contracts/Lockdrop.json';

import {
	Drizzle, generateStore, IDrizzleOptions, IStoreConfig
} from '@drizzle/store';

export const options: IDrizzleOptions = {
	contracts: [],
	events: {
		Lockdrop: ["Locked"],
	}
};

// locks the given token
export function lockEthereum(
	duration: number,
	amount: number,
	rate: number,
	affAccount: string
) {

	console.log(
		'locking ' + amount + ' ETH for ' + duration + ' days with the rate of ' + rate
	);
	if (affAccount) {
		console.log('Affiliation from ' + affAccount);
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
	return new Drizzle(options);
	
}
