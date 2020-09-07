/* eslint-disable @typescript-eslint/no-explicit-any */
// This module is used for communicating with the Ethereum smart contract
import Lockdrop from '../../contracts/Lockdrop.json';
import getWeb3 from '../getWeb3';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { LockEvent, LockInput } from '../../types/LockdropModels';
import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import { isValidIntroducerAddress, defaultAddress, affiliationRate } from '../../data/affiliationProgram';
import { lockDurationToRate } from '../plasmUtils';
import { PlmDrop } from '../../types/PlasmDrop';
import Web3Utils from 'web3-utils';
import * as ethereumUtils from 'ethereumjs-util';
import EthCrypto from 'eth-crypto';
import { firstLockContract, secondLockContract } from 'src/data/lockInfo';
import _ from 'lodash';
import { EtherScanApi } from 'src/types/EtherScanTypes';

/**
 * exchange rate at the start of April 14 UTC (at the end of the first lockdrop)
 * this is only used for the first lockdrop
 */
export const ethFinalExRate = 205.56;

// the total amount of issueing PLMs at 1st Lockdrop.
const totalAmountOfPLMs = new BigNumber('500000000.000000000000000');
const totalAmountOfPLMsForLockdrop = totalAmountOfPLMs.times(new BigNumber('17').div(new BigNumber('20')));
/**
 * retrieves the ECDSA signature from the given message via Web3js client call.
 * this will either return the v, r, s values, or the full sig in hex string
 * @param web3 web3js api instance
 * @param message message string to sign
 * @param asSigParam return ECDSA sig param if true (i.e. only v, r, s values)
 */
export async function getMessageSignature<T extends boolean>(
    web3: Web3,
    message: string,
    asSigParam: T,
): Promise<T extends true ? ethereumUtils.ECDSASignature : string>;

export async function getMessageSignature(web3: Web3, message: string, asSigParam: boolean) {
    const addresses = await web3.eth.getAccounts();

    // ask the user to sign the message
    // the password parameter is only used for specific wallets (most wallets will prompt the user to provide it)
    const sig = '0x' + (await web3.eth.personal.sign(message, addresses[0], 'SecureP4ssW0rd')).slice(2);

    const res = ethereumUtils.fromRpcSig(sig);
    if (!ethereumUtils.isValidSignature(res.v, res.r, res.s)) {
        throw new Error('Invalid signature');
    }

    if (asSigParam) {
        return res;
    } else {
        return sig;
    }
}

/**
 * finds the highest block number from the given lock event
 * @param lockEvents lock event list
 */
export function getHighestBlockNo(lockEvents: LockEvent[]) {
    const latestBlock = Math.max(
        ...lockEvents.map(o => {
            return o.blockNo;
        }),
    );
    return latestBlock;
}

/**
 * asks the user to sign a hashed message from their dApp browser to recover the user's public key.
 * This will return a compressed public key.
 * @param web3 a web3.js instance to access the user's wallet information
 * @param message an optional message that the user should sign
 */
export async function getPubKey(web3: Web3, message?: string) {
    // default message
    let msg = 'Please Sign this message to generate Plasm Network address';
    // change message if the function provides one
    if (message) {
        msg = message;
    }
    const hash = web3.eth.accounts.hashMessage(msg);
    const res = (await getMessageSignature(web3, msg, true)) as ethereumUtils.ECDSASignature;

    const publicKey = ethereumUtils.bufferToHex(
        ethereumUtils.ecrecover(ethereumUtils.toBuffer(hash), res.v, res.r, res.s),
    );
    const compressedPubKey = '0x' + EthCrypto.publicKey.compress(publicKey.replace('0x', ''));

    return compressedPubKey;
}

export async function fetchAllAddresses(web3: Web3) {
    let ethAddr: string[];
    // get user account from injected web3
    // we try every method here
    try {
        ethAddr = await web3.eth.getAccounts();
    } catch (e) {
        try {
            ethAddr = await web3.eth.requestAccounts();
        } catch (e) {
            try {
                ethAddr = [(window as any).ethereum.selectedAddress as string];
            } catch (e) {
                throw new Error(e);
            }
        }
    }

    // throw if the address is still 0
    if (ethAddr.length === 0) throw new Error('Could not fetch address from wallet');

    return ethAddr;
}

/**
 * serializes ethereum lock event list and encodes them into base64 string
 * @param lockEvents smart contract lock event
 */
export function serializeLockEvents(lockEvents: LockEvent[]) {
    const _ev = JSON.stringify(lockEvents);
    // encode utf-8 JSON to base 64 string
    return Buffer.from(_ev).toString('base64');
}

/**
 * deserialize the base64 string into a lock event list
 * @param lockEvents lock event list in base64 string
 */
export function deserializeLockEvents(lockEvents: string) {
    try {
        const eventJson = Buffer.from(lockEvents, 'base64').toString('utf-8');

        const locks: LockEvent[] = JSON.parse(eventJson);
        return locks;
    } catch (e) {
        console.log(e);
        return [];
    }
}

/**
 * fetch contract logs from etherscan. Because there is no API keys, the fetch will be limited to 1 time ever second
 * @param contractAddress lockdrop smart contract address
 * @param fromBlock which block to search from
 * @param toBlock up to what block the API should fetch for
 * @param ropsten pass true to search for ropsten network
 */
export async function fetchLockdropEvents(
    web3: Web3,
    contractAddress: string,
    fromBlock: number | 'latest' | 'pending' | 'earliest' | 'genesis' = 'genesis',
    toBlock: number | 'latest' | 'pending' | 'earliest' | 'genesis' = 'latest',
    ropsten?: boolean,
) {
    function wait(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    const networkToken = ropsten ? 'api-ropsten' : 'api';
    const api = `https://${networkToken}.etherscan.io/api?module=logs&action=getLogs&fromBlock=${fromBlock}&toBlock=${toBlock}&address=${contractAddress}&apikey=YourApiKeyToken`;

    // delay for 3 seconds to prevent IP ban
    await wait(3000);
    const res = await (await fetch(api)).text();
    const logs: EtherScanApi.Response = JSON.parse(res);

    if (logs.status === '0') {
        throw new Error(logs.message);
    }

    const lockdropAbiInputs = [
        {
            indexed: true,
            internalType: 'uint256',
            name: 'eth',
            type: 'uint256',
        },
        {
            indexed: true,
            internalType: 'uint256',
            name: 'duration',
            type: 'uint256',
        },
        {
            indexed: false,
            internalType: 'address',
            name: 'lock',
            type: 'address',
        },
        {
            indexed: false,
            internalType: 'address',
            name: 'introducer',
            type: 'address',
        },
    ];

    const lockEvents = logs.result.map(async event => {
        const decoded = web3.eth.abi.decodeLog(lockdropAbiInputs, event.data, event.topics);
        const senderTx = await web3.eth.getTransaction(event.transactionHash);

        const ev = {
            eth: new BN(senderTx.value),
            duration: Web3Utils.hexToNumber(event.topics[2]),
            lock: decoded['lock'],
            introducer: decoded['introducer'],
            blockNo: Web3Utils.hexToNumber(event.blockNumber),
            timestamp: Web3Utils.hexToNumber(event.timeStamp).toFixed(),
            lockOwner: senderTx.from,
            transactionHash: event.transactionHash,
        } as LockEvent;
        return ev;
    });

    return Promise.all(lockEvents);
}

/**
 * returns an array of locked events for the lock contract from the latest event block number.
 * This function will return the full list (i.e. previous events + new events) and handle caching as well
 * @param web3 a web3.js instance to interact with the blockchain
 * @param instance a contract instance to parse the contract events
 */
export async function getAllLockEvents(web3: Web3, instance: Contract, isDusty?: boolean): Promise<LockEvent[]> {
    const contractAddr = instance.options.address;

    const lockStoreKey = `id:${contractAddr}`;

    const eventCache = localStorage.getItem(lockStoreKey);
    // events from the cache
    const prevEvents = eventCache ? deserializeLockEvents(eventCache) : [];

    // set the correct block number either based on the create block or the latest event block
    const mainnetStartBlock =
        prevEvents.length === 0 || !Array.isArray(prevEvents)
            ? [...firstLockContract, ...secondLockContract].find(
                  i => i.address.toLowerCase() === contractAddr.toLowerCase(),
              )?.blockHeight
            : getHighestBlockNo(prevEvents);

    const newEvents = await fetchLockdropEvents(web3, contractAddr, mainnetStartBlock, 'latest', isDusty);
    // const ev = await instance.getPastEvents('Locked', {
    //     fromBlock: mainnetStartBlock,
    //     toBlock: 'latest',
    // });

    // skip events on the same block
    if (newEvents.length < 2) return prevEvents;

    // const eventHashes = await Promise.all(
    //     ev.map(async e => {
    //         return Promise.all([Promise.resolve(e.returnValues), web3.eth.getTransaction(e.transactionHash)]);
    //     }),
    // );

    // const newEvents = await Promise.all(
    //     eventHashes.map(async e => {
    //         // e[0] is lock event and e[1] is block hash
    //         const blockHash = e[1];
    //         const lockEvent = e[0];

    //         const transactionString = await web3.eth.getBlock(blockHash.blockNumber as number);
    //         const time = transactionString.timestamp.toString();

    //         return {
    //             eth: lockEvent.eth as BN,
    //             duration: lockEvent.duration as number,
    //             lock: lockEvent.lock as string,
    //             introducer: lockEvent.introducer as string,
    //             blockNo: blockHash.blockNumber,
    //             timestamp: time,
    //             lockOwner: blockHash.from,
    //             transactionHash: blockHash.hash,
    //         } as LockEvent;
    //     }),
    // );

    const allEvents = [...prevEvents, ...newEvents];

    // filter objects so that the list only contains unique transaction hashes
    const uniqueEvents = _.uniqBy(allEvents, i => {
        return i.lock;
    });

    const sortedList = _.sortBy(uniqueEvents, e => {
        return e.blockNo;
    });

    const _serialized = serializeLockEvents(sortedList);
    localStorage.setItem(lockStoreKey, _serialized);

    console.log(`fetched ${newEvents.length} lock events`);

    return sortedList;
}

/**
 * returns a 0 ethereum address if an empty string was provided.
 * this function is used for lockers with no introducers
 * @param aff a valid introducer ETH address
 */
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

function plmBaseIssueRatio(lockData: LockEvent, ethExchangeRate: BigNumber): BigNumber {
    // get lockTimeBonus * ethExRate
    const bonusRate = new BigNumber(lockDurationToRate(lockData.duration)).times(ethExchangeRate);

    // calculate issuingPLMRate = lockedEth([ETH]) * lockBonusRate * ethExRate
    const issuingRatio: BigNumber = new BigNumber(Web3Utils.fromWei(lockData.eth.toString(), 'ether')).times(
        new BigNumber(bonusRate),
    );
    return issuingRatio;
}

function totalPlmBaseIssuingRate(allLocks: LockEvent[], ethExchangeRate: BigNumber): BigNumber {
    return allLocks.reduce(
        (sum: BigNumber, value: LockEvent): BigNumber => sum.plus(plmBaseIssueRatio(value, ethExchangeRate)),
        new BigNumber(0),
    );
}

function plmBaseIssueAmountInLock(lock: LockEvent, totalPlmsRate: BigNumber, ethExchangeRate: BigNumber): BigNumber {
    const currentIssue = plmBaseIssueRatio(lock, ethExchangeRate);
    return totalAmountOfPLMsForLockdrop.times(currentIssue).div(totalPlmsRate);
}

/**
 * returns an array of addresses that referenced the given address for the affiliation program
 * @param address ETH address
 * @param lockData list of contract lock event
 */
function getAllAffReferences(address: string, lockData: LockEvent[]) {
    // check if there is
    const results: LockEvent[] = [];
    const refEvents = lockData.filter(e => e.introducer.toLowerCase() === address.toLowerCase());

    for (let i = 0; i < refEvents.length; i++) {
        results.push(refEvents[i]);
    }

    return results;
}

export function calculateNetworkAlpha(allLocks: LockEvent[]): BigNumber {
    const ethExchangeRate = new BigNumber(ethFinalExRate);

    const totalPlmRate = totalPlmBaseIssuingRate(allLocks, ethExchangeRate);

    // alpha_1 = totalAmountOfPLMsForLockdrop /totalPlmRate
    const alpha1 = totalAmountOfPLMsForLockdrop.div(totalPlmRate);

    return alpha1;
}

/**
 * calculate the total receiving PLMs from the lockdrop including the affiliation program bonus
 * in this function, affiliation means the current address being referenced by others
 * and introducer means this address referencing other affiliated addresses
 * @param address the lockdrop participant's ETH address
 * @param lockData a list of lockdrop contract events
 */
export function calculateTotalPlm(address: string, lockData: LockEvent[]): PlmDrop {
    const receivingPlm = new PlmDrop(address, new BigNumber(0), [], [], []);

    const currentAddressLocks = lockData.filter(i => i.lockOwner.toLowerCase() === address.toLowerCase());

    receivingPlm.locks = currentAddressLocks;

    const ethExchangeRate = new BigNumber(ethFinalExRate);

    // get total plm rate for calculating actual issuing PLMs.
    const totalPlmRate = totalPlmBaseIssuingRate(lockData, ethExchangeRate);

    for (let i = 0; i < currentAddressLocks.length; i++) {
        // calculate total base issuing PLM tokens
        const issuingPlm = plmBaseIssueAmountInLock(currentAddressLocks[i], totalPlmRate, ethExchangeRate);

        // add value to the total amount
        receivingPlm.basePlm = receivingPlm.basePlm.plus(issuingPlm);

        // self -> introducer : bonus getting PLMs.
        // check if this address has an introducer
        if (
            isValidIntroducerAddress(currentAddressLocks[i].introducer) &&
            currentAddressLocks[i].introducer !== defaultAddress
        ) {
            receivingPlm.introducerAndBonuses.push([
                currentAddressLocks[i].introducer,
                issuingPlm.times(new BigNumber(affiliationRate)),
            ]);
        }
    }

    // someone -> self(introducer) : bonus getting PLMs.
    // calculate affiliation bonus for this address
    if (isValidIntroducerAddress(address)) {
        const allRefs = getAllAffReferences(address, lockData);

        for (let i = 0; i < allRefs.length; i++) {
            // reference amount * 0.01
            receivingPlm.affiliationRefsBonuses.push([
                allRefs[i].lock,
                plmBaseIssueAmountInLock(allRefs[i], totalPlmRate, ethExchangeRate).times(
                    new BigNumber(affiliationRate),
                ),
            ]);
        }
    }
    return receivingPlm;
}

/**
 * parses through the given lock events to calculate the total amount of locked ETH
 * @param locks a list of lockdrop contract events
 * @param roundTo
 */
export function getTotalLockVal(locks: LockEvent[], roundTo?: number): string {
    //let totalVal = new BigNumber(0);
    if (locks.length > 0 && Array.isArray(locks)) {
        const allVal = locks.map(e => {
            // we have to manually prefix it with 0x for BigNumber to read
            return new BigNumber('0x' + e.eth.toString('hex'));
        });

        const totalVal = allVal.reduce((a, b) => a.plus(b), new BigNumber(0));

        const _eth = Web3Utils.fromWei(totalVal.toFixed(), 'ether');

        if (roundTo) return new BigNumber(_eth).toFixed(roundTo, 5);
        return new BigNumber(_eth).toFixed();
    }
    return '0';
}

/**
 * creates a smart contract instance based on the contract address
 * @param web3 web3js API instance
 * @param contractAddress smart contract address
 */
export async function createContractInstance(web3: Web3, contractAddress: string) {
    const lockdropAbi = Lockdrop.abi as Web3Utils.AbiItem[];

    // create an empty contract instance first
    return new web3.eth.Contract(lockdropAbi, contractAddress);
}

/**
 * returns the unlock date of the given ethereum lock event.
 * this will return the unlock date in unix time (seconds)
 * @param lockInfo
 */
export const getUnlockDate = (lockInfo: LockEvent) => {
    // 24 hours in epoch
    const epochDay = 60 * 60 * 24;

    // Ethereum lock timestamp is in integers
    const lockedDay = parseInt(lockInfo.timestamp);

    // locked date + lock duration in days to epoch
    const unlockDate = lockedDay + lockInfo.duration * epochDay;

    return unlockDate;
};

/**
 * authenticate if the client has web3 enabled wallet installed and can communicate with the blockchain
 * returns the web3.js instance, list of active accounts and the contract instance
 * @param contractAddress the contract address that it should look for
 */
export async function connectWeb3() {
    // Get network provider and web3 instance.
    const web3 = await getWeb3();

    if (web3 instanceof Web3) {
        return web3;
    } else {
        throw new Error('Cannot get Web3 instance from the client');
    }
}

/**
 * returns the UTC (in seconds) epoch string of when the lockdrop smart contract will end
 * @param contract the lockdrop contract instance
 */
export async function getContractEndDate(contract: Contract) {
    const _lockdropEndDate = await contract.methods.LOCK_END_TIME().call();
    return _lockdropEndDate as string;
}

/**
 * returns the UTC (in seconds) epoch string of when the lockdrop smart contract will start
 * @param contract the lockdrop contract instance
 */
export async function getContractStartDate(contract: Contract) {
    const _lockdropStartDate = await contract.methods.LOCK_START_TIME().call();
    return _lockdropStartDate as string;
}

/**
 * validate and create a transaction to the lock contract with the given parameter.
 * This will return the transaction hash
 * @param txInput the lock parameter for the contract
 * @param address the address of the locker
 * @param contract smart contract instance used to invoke the contract method
 */
export async function submitLockTx(txInput: LockInput, address: string, contract: Contract) {
    // return a default address if user input is empty
    const introducer = defaultAffiliation(txInput.affiliation).toLowerCase();
    if (Number.parseFloat(txInput.amount) < 0) {
        throw new Error('Number value must be greater than 0');
    }
    // check user input
    if (introducer === address) {
        throw new Error('Cannot self introduce');
    }
    if (introducer && !Web3.utils.isAddress(introducer)) {
        throw new Error('Please input a valid Ethereum address');
    }
    if (!isValidIntroducerAddress(introducer)) {
        throw new Error('Please input a valid introducer address.');
    }

    // convert user input to Wei
    const amountToSend = Web3.utils.toWei(txInput.amount, 'ether');
    let hash = '';

    // communicate with the smart contract
    await contract.methods
        .lock(txInput.duration, introducer)
        .send({
            from: address,
            value: amountToSend,
        })
        .on('transactionHash', (res: any) => {
            hash = res;
        });

    if (hash === '') {
        throw new Error('An error has occurred while trying to send transaction');
    }
    return hash;
}
