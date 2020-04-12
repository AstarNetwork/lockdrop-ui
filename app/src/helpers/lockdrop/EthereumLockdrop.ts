/* eslint-disable @typescript-eslint/no-explicit-any */
// This module is used for communicating with the Ethereum smart contract
import Lockdrop from '../../contracts/Lockdrop.json';
import getWeb3 from '../getWeb3';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { LockEvent } from '../../models/LockdropModels';
import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import { isRegisteredEthAddress, defaultAddress, affiliationRate } from '../../data/affiliationProgram';
import { lockDurationToRate } from '../plasmUtils';
import { PlmDrop } from '../../models/PlasmDrop';

const ethMarketApi = 'https://api.coingecko.com/api/v3/coins/ethereum';

// the alpha value for the token
const alphaOne = 2;

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

async function plmBaseIssueAmount(lockData: LockEvent) {
    const ethExchangeRate = await getCurrentUsdRate();

    const bonusRate = lockDurationToRate(lockData.duration) * ethExchangeRate * alphaOne;

    // calculate lockedEth * lockBonusRate * ethExRate * alpha
    const issuingAmount: BigNumber = new BigNumber(lockData.eth.toString()).mul(new BigNumber(bonusRate.toString()));
    //console.log('Base issuing amount: ' + issuingAmount.toFixed());
    return issuingAmount.round(0).toFixed();
}

// returns the number of PLM the given valid introducer address
async function getIntroducerBonus(address: string) {
    let bonusPlm = new BigNumber(0);
    try {
        // ensure that the given address is a valid introducer
        if (isRegisteredEthAddress(address)) {
            let totalPlms = new BigNumber(0);

            const currentLocks = await getCurrentAccountLocks(window.web3, address, window.contract);
            for (let i = 0; i < currentLocks.length; i++) {
                const currentIssue = await plmBaseIssueAmount(currentLocks[i]);
                totalPlms = totalPlms.plus(currentIssue);
            }

            bonusPlm = totalPlms.mul(affiliationRate);
        }
    } catch (error) {
        console.log(error);
    }
    return bonusPlm.round(0).toFixed();
}

// returns an array of addresses that referenced the given address for the affiliation program
async function getAllAffReference(address: string) {
    // check if there is
    const results: LockEvent[] = [];
    try {
        const lockEvents = await getAllLockEvents(window.web3, window.contract);
        lockEvents
            .filter(e => e.introducer === address)
            .map(i => {
                results.push(i);
            });
    } catch (error) {
        console.log(error);
    }

    return results;
}

// calculate the total receiving PLMs from the lockdrop including the affiliation program bonus
// in this function, affiliation means the current address being referenced by others
// and introducer means this address referencing other affiliated addresses
export async function calculateTotalPlm(address: string) {
    const receivingPlm = new PlmDrop(new BigNumber(0), [], [], []);

    const currentAddressLocks = await getCurrentAccountLocks(window.web3, address, window.contract);

    const introducers: string[] = [];

    receivingPlm.locks = currentAddressLocks;

    // calculate total base issuing PLM tokens
    for (let i = 0; i < currentAddressLocks.length; i++) {
        const issuingPlm = await plmBaseIssueAmount(currentAddressLocks[i]);
        // add value to the total amount
        receivingPlm.basePlm = receivingPlm.basePlm.plus(issuingPlm);

        // check if this address has an introducer
        if (currentAddressLocks[i].introducer !== defaultAddress) {
            introducers.push(currentAddressLocks[i].introducer);
        }
    }

    // calculate affiliation bonus for this address
    if (isRegisteredEthAddress(address)) {
        const allRefs = await getAllAffReference(address);

        for (let i = 0; i < allRefs.length; i++) {
            receivingPlm.affiliationRefs.push(allRefs[i].lock);
        }
    }

    // calculate introducer bonus for this address
    if (introducers.length > 0) {
        let totalIntroducerBonus = new BigNumber(0);

        for (let i = 0; i < introducers.length; i++) {
            const currentBonus = await getIntroducerBonus(introducers[i]);
            receivingPlm.introducerBonuses.push(new BigNumber(currentBonus));

            totalIntroducerBonus = totalIntroducerBonus.plus(currentBonus);
        }
    }
    //return totalPlm.round(0).toFixed();
    return receivingPlm;
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

            // assign current web3 instance to window global var
            window.web3 = web3;
            window.contract = instance;

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
