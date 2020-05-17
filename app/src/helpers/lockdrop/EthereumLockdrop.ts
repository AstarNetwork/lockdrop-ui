/* eslint-disable @typescript-eslint/no-explicit-any */
// This module is used for communicating with the Ethereum smart contract
import Lockdrop from '../../contracts/Lockdrop.json';
//todo: change this to the actual contract instance
import SecondLockdrop from '../../contracts/Lockdrop.json';
import getWeb3 from '../getWeb3';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { LockEvent, LockSeason } from '../../models/LockdropModels';
import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import { isRegisteredEthAddress, defaultAddress, affiliationRate } from '../../data/affiliationProgram';
import { lockDurationToRate } from '../plasmUtils';
import { PlmDrop } from '../../models/PlasmDrop';
import Web3Utils from 'web3-utils';
import EthCrypto from 'eth-crypto';
import * as polkadotUtil from '@polkadot/util-crypto';
import { ecrecover, fromRpcSig, toBuffer, bufferToHex } from 'ethereumjs-util';

// exchange rate at the start of April 14 UTC (at the end of the lockdrop)
// historical data was obtained from here https://coinmarketcap.com/currencies/ethereum/historical-data/
export const ethFinalExRate = 205.56;

// the total amount of issueing PLMs at 1st Lockdrop.
const totalAmountOfPLMs = new BigNumber('500000000.000000000000000');
const totalAmountOfPLMsForLockdrop = totalAmountOfPLMs.times(new BigNumber('17').div(new BigNumber('20')));

// generates a Plasm address with the given public key
export function generatePlmAddress(ethPubKey: string) {
    // converts a given hex string into Uint8Array
    const toByteArray = (hexString: string) => {
        const result = [];
        for (let i = 0; i < hexString.length; i += 2) {
            result.push(parseInt(hexString.substr(i, 2), 16));
        }
        return new Uint8Array(result);
    };

    // compress 64byte key into 32+1 byte key
    const compressedPubKey = EthCrypto.publicKey.compress(ethPubKey);
    // hash to blake2
    const plasmPubKey = polkadotUtil.blake2AsU8a(toByteArray(compressedPubKey), 256);
    // encode address
    const plmAccountId = polkadotUtil.encodeAddress(plasmPubKey, 5);
    return plmAccountId;
}

export async function getPubKey(web3: Web3) {
    const msg = 'display_address';
    const hash = web3.eth.accounts.hashMessage(msg);
    try {
        const addresses = await web3.eth.getAccounts();
        const sig = '0x' + (await web3.eth.sign(hash, addresses[0])).slice(2);
        const res = fromRpcSig(sig);

        return bufferToHex(ecrecover(toBuffer(hash), res.v, res.r, res.s));
    } catch (error) {
        console.log(error);
    }
}

// returns an array of the entire list of locked events for the contract only once
export async function getAllLockEvents(web3: Web3, instance: Contract): Promise<LockEvent[]> {
    // this value can be set as the block number of where the contract was deployed
    const startBlock = 0;
    try {
        const ev = await instance.getPastEvents('Locked', {
            fromBlock: startBlock,
        });

        const eventHashes = await Promise.all(
            ev.map(async e => {
                return Promise.all([Promise.resolve(e.returnValues), web3.eth.getTransaction(e.transactionHash)]);
            }),
        );

        return Promise.all(
            eventHashes.map(async e => {
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
                    blockNo: blockHash.blockNumber,
                    timestamp: time,
                    lockOwner: e[1]['from'],
                    blockHash: blockHash,
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

export async function getEthUsdRate(endDate: string) {
    // date format mm-DD-YYYY
    const ethMarketApi = `https://api.coingecko.com/api/v3/coins/ethereum/history?date=${endDate}&localization=false`;
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

// returns an array of addresses that referenced the given address for the affiliation program
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

// calculate the total receiving PLMs from the lockdrop including the affiliation program bonus
// in this function, affiliation means the current address being referenced by others
// and introducer means this address referencing other affiliated addresses
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
            isRegisteredEthAddress(currentAddressLocks[i].introducer) &&
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
    if (isRegisteredEthAddress(address)) {
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

export function getTotalLockVal(locks: LockEvent[]): string {
    let totalVal = new BigNumber(0);
    if (locks.length > 0) {
        for (let i = 0; i < locks.length; i++) {
            const currentEth = new BigNumber(locks[i].eth.toString());
            totalVal = totalVal.plus(currentEth);
        }
    }
    return Web3Utils.fromWei(totalVal.toFixed(), 'ether');
}

// this function will authenticate if the client has metamask installed and can communicate with the blockchain
export async function connectWeb3(lockSeason: LockSeason) {
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

            // create an empty contract instance first
            let instance = new web3.eth.Contract(
                Lockdrop.abi as any,
                deployedNetwork && deployedNetwork.address,
            ) as Contract;

            //todo: switch contract instance depending on lockdrop type
            // assign different contract abi depending on the lockdrop type
            switch (lockSeason) {
                case LockSeason.First:
                    instance = new web3.eth.Contract(
                        Lockdrop.abi as any,
                        deployedNetwork && deployedNetwork.address,
                    ) as Contract;
                    break;
                case LockSeason.Second:
                    instance = new web3.eth.Contract(
                        SecondLockdrop.abi as any,
                        deployedNetwork && deployedNetwork.address,
                    ) as Contract;
                    break;
            }

            // assign current web3 instance to window global var
            // window.web3 = web3;
            // window.contract = instance;

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
