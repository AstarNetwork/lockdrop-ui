/* eslint-disable @typescript-eslint/no-explicit-any */
// This module is used for communicating with the Ethereum smart contract
import Lockdrop from '../../contracts/Lockdrop.json';
import getWeb3 from '../getWeb3';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { LockEvent } from '../../models/LockdropModels';
import BN from 'bn.js';
import BigNumber from 'bignumber.js';

// the default introducer address when none is provided by the user
export const defaultAddress = '0x0000000000000000000000000000000000000000';

const ethMarketApi = 'https://api.coingecko.com/api/v3/coins/ethereum';

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

export async function getCurrentUsdRate() {
    let usdRate = 0;
    try {
        const res = await fetch(ethMarketApi);
        const data = await res.json();
        usdRate = data.market_data.current_price.usd;
    } catch (error) {
        console.log(error);
    }
    return usdRate;
}

export function getTotalLockVal(locks: LockEvent[], web3: Web3): string {
    let totalVal = new BigNumber(0);
    if (locks.length > 0) {
        locks.forEach(i => {
            const currentEth = new BigNumber(i.eth.toString());
            totalVal = totalVal.plus(currentEth);
        });
    }
    return web3.utils.fromWei(totalVal.toFixed(), 'ether');
}

// this function will authenticate if the client has metamask installed and can communicate with the blockchain
export async function connectWeb3() {
    try {
        // Get network provider and web3 instance.
        const web3 = await getWeb3();
        //const web3 = getEthInst();

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

// returns a list of Lock events for the given account
export async function getCurrentAccountLocks(
    web3: Web3,
    fromAccount: string,
    contractInstance: Contract,
): Promise<LockEvent[]> {
    // this value can be set as the block number of where the contract was deployed
    const startBlock = 0;
    try {
        const ev = await contractInstance.getPastEvents('Locked', {
            fromBlock: startBlock,
        });

        const eventHashes = await Promise.all(
            ev.map(async e => {
                return Promise.all([Promise.resolve(e.returnValues), web3.eth.getTransaction(e.transactionHash)]);
            }),
        );

        return Promise.all(
            eventHashes
                .filter(e => e[1]['from'] === fromAccount)
                .map(async e => {
                    // e[0] is lock event and e[1] is block hash
                    const blockHash = e[1];
                    const lockEvent = e[0];

                    const transactionString = await Promise.resolve(web3.eth.getBlock(blockHash.blockNumber));
                    const time = transactionString.timestamp.toString();
                    return {
                        eth: lockEvent.eth as BN,
                        duration: lockEvent.duration as number,
                        lock: lockEvent.lock as string,
                        introducer: lockEvent.introducer as string,
                        blockNo: blockHash.blockNumber, // temp value
                        timestamp: time,
                    } as LockEvent;
                }),
        );
    } catch (error) {
        console.log(error);
        // return an empty array when failed
        return [] as LockEvent[];
    }
}

// returns an array of the entire list of locked events for the contract only once
export async function getAllLockEvents(web3: Web3, instance: Contract): Promise<LockEvent[]> {
    // this value can be set as the block number of where the contract was deployed
    const startBlock = 0;
    try {
        // get all the event data
        const ev = await instance.getPastEvents('Locked', { fromBlock: startBlock });

        return Promise.all(
            ev.map(async i => {
                const transactionString = await Promise.resolve(web3.eth.getBlock(i.blockNumber));
                const time = transactionString.timestamp.toString();

                const e = i.returnValues;
                return {
                    eth: e['eth'] as BN,
                    duration: e['duration'] as number,
                    lock: e['lock'] as string,
                    introducer: e['introducer'] as string,
                    blockNo: i.blockNumber,
                    timestamp: time,
                } as LockEvent;
            }),
        );
    } catch (error) {
        console.log(error);
        // return an empty array when failed
        return [] as LockEvent[];
    }
}
