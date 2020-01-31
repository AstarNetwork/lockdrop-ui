// This module is used for communicating with the Ethereum smart contract

//import Lockdrop from '../../contracts/Lockdrop.json';
import {
	Drizzle, IDrizzleOptions
} from '@drizzle/store';

const options: IDrizzleOptions
 = {
	contracts: [],
	web3: {
		fallback: {
			type: 'ws',
			url: 'ws:127.0.0.1:8545'
		}
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
