// This module is used for communicating with the Ethereum smart contract

import Lockdrop from '../../contracts/Lockdrop.json';

import getWeb3 from '../getWeb3';

// the default introducer address when none is provided by the user
//todo: change this to the Plasm team's ethereum address
const defaultAff = '0x0000000000000000000000000000000000000000';

export function defaultAffiliation(aff){
	// check if affiliation address is not empty and is not themselves
	if (aff) {
		// return itself when it is a valid address
		return aff;
	}
	else{
		// if it is an invalid address, return the default affiliation address
		return defaultAff;
	}
}

// locks the given token
export function lockEthereum(duration, amount, rate, affAccount) {
	console.log(
		'locking ' +
			amount +
			' ETH for ' +
			duration +
			' days with the rate of ' +
			rate
	);
	if (affAccount) {
		console.log('Affiliation from ' + affAccount);
	} else {
		console.log('no friends for this poor account');
	}
}

export function getContractEvent() {
	return 'this is a smart contract state';
}

// this function will authenticate if the client has metamask installed and can communicate with the blockchain
export async function connectWeb3() {
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
			deployedNetwork && deployedNetwork.address
		);

		return { web3: web3, accounts: accounts, contract: instance };
	} catch (error) {
		// Catch any errors for any of the above operations.
		//todo: display a graphical error message
		alert(
			'Failed to load web3, accounts, or contract. Check console for details.'
		);
		console.error(error);
		return { web3: null, accounts: null, contract: null };
	}
}
