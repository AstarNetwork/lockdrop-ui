/// This module is used for communicating with the Ethereum smart contract
/// Because we are doing multiple lockdrop with multiple currencies, it is good to

import Lockdrop from '../../abi/Lockdrop.json';

// the rate of growth for each lock duration
const rates = [
	{ key: 20, value: 24 },
	{ key: 100, value: 100 },
	{ key: 300, value: 360 },
	{ key: 1000, value: 1600 }
];

const ethContractAddr = '0xFEC6F679e32D45E22736aD09dFdF6E3368704e31';

export const ethereumOptions = {
	web3: {
		block: false,
		fallback: {
			type: 'ws',
			url: 'ws://127.0.0.1:9545'
		}
	},
	contracts: [Lockdrop],
	events: {
		Lockdrop: ['Locked']
	},
	polls: {
		// set polling interval to 30secs so we don't get buried in poll events
		accounts: 30000
	}
};

// locks the given token
export function lockEthereum(
	duration: number,
	amount: number
) {
	// get the increase rate from the given lock duration
	let incRate = rates.filter(x => x.key === duration)[0].value;

	console.log(
		'locking ' + amount + ' ETH for ' + duration + ' days to ' + ethContractAddr + ' with the rate of ' + incRate
	);
}

export function getContractEvent() {
	return 'this is a smart contract state';
}
