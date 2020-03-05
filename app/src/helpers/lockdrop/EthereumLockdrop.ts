// This module is used for communicating with the Ethereum smart contract
//todo: make everything type-safe if possible
import Lockdrop from '../../contracts/Lockdrop.json';
import getWeb3 from '../getWeb3';
//import Web3 from 'web3';

// the default introducer address when none is provided by the user
const defaultAff = '0x0000000000000000000000000000000000000000';

export function defaultAffiliation(aff: string) {
    // check if affiliation address is not empty and is not themselves
    if (aff) {
        // return itself when it is a valid address
        return aff;
    } else {
        // if it is an invalid address, return the default affiliation address
        return defaultAff;
    }
}

// this function will authenticate if the client has metamask installed and can communicate with the blockchain
export async function connectWeb3() {
    // try {
    //     // Get network provider and web3 instance.
    //     const web3 = await getWeb3();

    //     // Use web3 to get the user's accounts.
    //     const accounts = await web3.eth.getAccounts();

    //     // Get the contract instance.
    //     const networkId = await web3.eth.net.getId();
    //     const deployedNetwork = (Lockdrop as any).networks[networkId];
    //     const instance = new web3.eth.Contract(Lockdrop.abi as any, deployedNetwork && deployedNetwork.address);

    //     return {
    //         web3: web3,
    //         accounts: accounts,
    //         contract: instance,
    //     };
    // } catch (error) {
    //     // Catch any errors for any of the above operations.
    //     //todo: display a graphical error message
    //     alert('Failed to load web3, accounts, or contract. Check console for details.');
    //     console.error(error);
    //     return {
    //         web3: null,
    //         accounts: null,
    //         contract: null,
    //     };
    // }
    // Get network provider and web3 instance.
    const web3 = await getWeb3();

    // Use web3 to get the user's accounts.
    const accounts = await web3.eth.getAccounts();

    // Get the contract instance.
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = (Lockdrop as any).networks[networkId];
    const instance = new web3.eth.Contract(Lockdrop.abi as any, deployedNetwork && deployedNetwork.address);

    return {
        web3: web3,
        accounts: accounts,
        contract: instance,
    };
}

export async function getLockEvents(web3: any) {
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = (Lockdrop as any).networks[networkId];
    const instance = new web3.eth.Contract(Lockdrop.abi, deployedNetwork && deployedNetwork.address);

    const lockEvents: any[] = [];

    const START_BLOCK = 0;
    instance
        .getPastEvents('allEvents', {
            fromBlock: START_BLOCK,
            toBlock: 'latest', // You can also specify 'latest'
        })
        .then((events: any) => {
            //lockEvents = events;
            //console.log(events);
            events.forEach(function(i: any) {
                lockEvents.push(i);
            });
            //console.log(lockEvents);
            //return (lockEvents);
        })
        .catch((err: Error) => console.error(err));

    return lockEvents;
}
