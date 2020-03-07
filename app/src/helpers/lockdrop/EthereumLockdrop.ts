/* eslint-disable @typescript-eslint/no-explicit-any */
// This module is used for communicating with the Ethereum smart contract
//todo: make everything type-safe if possible
import Lockdrop from '../../contracts/Lockdrop.json';
import getWeb3 from '../getWeb3';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { LockEvent } from '../../models/LockdropModels';
import BN from 'bn.js';

// the default introducer address when none is provided by the user
export const defaultAddress = '0x0000000000000000000000000000000000000000';

export function defaultAffiliation(aff: string) {
    // check if affiliation address is not empty and is not themselves
    if (aff) {
        // return itself when it is a valid address
        return aff;
    } else {
        // if it is an invalid address, return the default affiliation address
        return defaultAddress;
    }
}

// this function will authenticate if the client has metamask installed and can communicate with the blockchain
export async function connectWeb3() {
    try {
        // Get network provider and web3 instance.
        const web3 = await getWeb3();

        if (web3 instanceof Web3) {
            // Use web3 to get the user's accounts.
            const accounts = await web3.eth.getAccounts();

            // Get the contract instance.
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = (Lockdrop as any).networks[networkId];
            const instance = new web3.eth.Contract(
                Lockdrop.abi as any,
                deployedNetwork && deployedNetwork.address,
            ) as Contract;

            return {
                web3: web3,
                accounts: accounts,
                contract: instance,
            };
        }
    } catch (error) {
        // Catch any errors for any of the above operations.
        //todo: display a graphical error message
        alert('Failed to load web3, accounts, or contract. Check console for details.');
        console.error(error);
    }
    // return an empty value
    return {
        web3: {} as Web3,
        accounts: [''],
        contract: {} as Contract,
    };
}

// returns an array of the entire list of locked events for the contract only once
export async function getLockEvents(web3: Web3, fromAccount: string): Promise<LockEvent[]> {
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = (Lockdrop as any).networks[networkId];
    const instance = new web3.eth.Contract(Lockdrop.abi as any, deployedNetwork && deployedNetwork.address);

    // this will hold all the event log JSON with an arbitrary structure
    const lockEvents: LockEvent[] = [];

    // this value can be set as the block number of where the contract was deployed
    const startBlock = 0;
    try {
        const ev = await instance.getPastEvents('allEvents', {
            //todo: filter by locker address (who is the current selected metaMask account)
            filter: { event: 'Locked', from: fromAccount },
            fromBlock: startBlock,
            toBlock: 'latest',
        });
        ev.forEach(function(i) {
            //console.log(i);
            const e = i.returnValues;
            // getting key value pairs from the event value
            lockEvents.push({
                eth: e['eth'] as BN,
                duration: e['duration'] as number,
                lock: e['lock'] as string,
                introducer: e['introducer'] as string,
                blockNo: i.blockNumber,
                txHash: i.transactionHash,
            });
        });
    } catch (error) {
        console.log(error);
    }

    return lockEvents;
}
