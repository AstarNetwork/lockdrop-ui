/// This module is used for communicating with the Ethereum smart contract

// locks the given token
export function lockEthereum(
	duration: number,
	amount: number,
	contractAddr: string
) {
	console.log(
		'locking ' + amount + ' ETH for ' + duration + ' days to ' + contractAddr
	);
}

export function getContractEvent() {
	return 'this is a smart contract state';
}
