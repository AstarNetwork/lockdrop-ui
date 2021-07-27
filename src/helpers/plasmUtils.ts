/* eslint-disable @typescript-eslint/camelcase */
import BigNumber from 'bignumber.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { H256 } from '@polkadot/types/interfaces';
import * as polkadotUtilCrypto from '@polkadot/util-crypto';
import * as polkadotUtils from '@polkadot/util';
import { u8aConcat } from '@polkadot/util';
import { Struct, TypeRegistry, u64, u128, U8aFixed, u8 } from '@polkadot/types';
import { BlockNumber } from '@polkadot/types/interfaces';
import * as plasmDefinitions from '@plasm/types/interfaces/definitions';
import { LockdropType, Claim, Lockdrop, LockEvent } from 'src/types/LockdropModels';

/**
 * Plasm network enum
 */
export enum PlasmNetwork {
    Local,
    Dusty,
    Main,
}

/**
 * converts the plasm network minimum denominator to PLM
 * @param femto minimum token value
 */
export function femtoToPlm(femto: BigNumber, tokenDecimals: number) {
    if (femto.isLessThanOrEqualTo(new BigNumber(0))) {
        return new BigNumber(0);
    }

    const plmDenominator = new BigNumber(10).pow(new BigNumber(tokenDecimals));
    return femto.dividedBy(plmDenominator);
}

/**
 * a Proof-of-Work function that hashes the lockdrop claim ID and the nonce
 * together to verify the unsigned transaction.
 * this will return the correct nonce in hex string
 * @param claimId the real-time lockdrop claim ID (blake2 hashed lock parameter)
 */
export function claimPowNonce(claimId: Uint8Array | H256): Uint8Array {
    let nonce = polkadotUtilCrypto.randomAsU8a();
    while (true) {
        const hash = polkadotUtilCrypto.blake2AsU8a(u8aConcat(claimId, nonce));
        //console.log('PoW hash: ' + u8aToHex(hash));
        if (hash[0] > 0) {
            nonce = polkadotUtilCrypto.randomAsU8a();
            //console.log('Next nonce: ' + u8aToHex(nonce));
        } else {
            return nonce;
        }
    }
}

/**
 * used for adding new polkadot-js api types for communicating with plasm node
 */
const plasmTypeReg = new TypeRegistry();

/**
 * gets endpoint url for a given network
 * @param network the network
 */
export function getNetworkEndpoint(network?: PlasmNetwork) {
    let endpoint: string;

    switch (network) {
        case PlasmNetwork.Local:
            endpoint = 'ws://127.0.0.1:9944';
            break;
        case PlasmNetwork.Dusty:
            endpoint = 'wss://rpc.dusty.plasmnet.io/';
            break;
        case PlasmNetwork.Main: // main net endpoint will be the default value
        default:
            endpoint = 'wss://rpc.plasmnet.io';
            break;
    }

    return endpoint;
}

/**
 * establishes a connection between the client and the plasm node with the given endpoint.
 * this will default to the main net node
 * @param network end point for the client to connect to
 */
export async function createPlasmInstance(network?: PlasmNetwork) {
    const endpoint = getNetworkEndpoint(network);
    const types = Object.values(plasmDefinitions).reduce((res, { types }): object => ({ ...res, ...types }), {});
    const wsProvider = new WsProvider(endpoint);

    const api = await ApiPromise.create({
        provider: wsProvider,
        types: {
            ...types,
            // aliases that don't do well as part of interfaces
            'voting::VoteType': 'VoteType',
            'voting::TallyType': 'TallyType',
            // chain-specific overrides
            Address: 'GenericAddress',
            Keys: 'SessionKeys4',
            StakingLedger: 'StakingLedgerTo223',
            Votes: 'VotesTo230',
            ReferendumInfo: 'ReferendumInfoTo239',
        },
        // override duplicate type name
        typesAlias: { voting: { Tally: 'VotingTally' } },
    });

    return await api.isReady;
}

/**
 * convert the given lock duration in to PLM issue bonus rate
 * @param duration token lock duration
 */
export function lockDurationToRate(duration: number) {
    if (duration < 30) {
        return 0;
    } else if (duration < 100) {
        return 24;
    } else if (duration < 300) {
        return 100;
    } else if (duration < 1000) {
        return 360;
    } else {
        return 1600;
    }
}

/**
 * Create a lock parameter object with the given lock information.
 * This is used for the real-time lockdrop module in Plasm for both ETH and BTC locks
 * @param network the lockdrop network type
 * @param transactionHash the lock transaction hash in hex string
 * @param publicKey locker's public key in hex string
 * @param duration lock duration in Unix epoch (seconds)
 * @param value lock value in the minimum denominator (Wei or Satoshi)
 */
export function createLockParam(
    network: LockdropType,
    transactionHash: string,
    publicKey: string,
    duration: string,
    value: string,
) {
    const lockParam = new Struct(
        plasmTypeReg,
        {
            type: u8,
            transactionHash: 'H256',
            publicKey: U8aFixed, // [u8; 33]
            duration: u64,
            value: u128,
        },
        {
            type: network, // enum is converted to number
            transactionHash: transactionHash,
            publicKey: new U8aFixed(plasmTypeReg, publicKey, 264),
            duration: new u64(plasmTypeReg, duration),
            value: new u128(plasmTypeReg, value),
        },
    );

    return lockParam;
}

/**
 * signature message that is used for the claim_to() function.
 * sign this message with a ECDSA private key to generate the correct signature.
 * the 0x prefix will be automatically removed
 * @param claimId lockdrop claim ID in hex string
 * @param plasmAddress plasm network public address in ss58 encoding. This is the receiving address
 */
export const claimToMessage = (claimId: string, plasmAddress: string) => {
    const addressHex = polkadotUtils.u8aToHex(polkadotUtilCrypto.decodeAddress(plasmAddress)).replace('0x', '');

    return `I declare to claim lockdrop reward with ID ${claimId.replace('0x', '')} to AccountId ${addressHex}`;
};

/**
 * sends the unclaimed lockdrop reward to the given plasm address.
 * the signature must derive from the public key that made the lock.
 * @param api plasm network API instance
 * @param claimId lockdrop claim ID hash in raw byte stream
 * @param recipient plasm address in decoded form
 * @param signature hex string without the 0x for the ECDSA signature from the user
 */
export async function claimTo(
    api: ApiPromise,
    claimId: Uint8Array,
    recipient: Uint8Array | string,
    signature: Uint8Array,
) {
    const encodedAddr = recipient instanceof Uint8Array ? polkadotUtilCrypto.encodeAddress(recipient) : recipient;
    const addrCheck = polkadotUtilCrypto.checkAddress(encodedAddr, 5);
    if (!addrCheck[0]) {
        throw new Error('Plasm address check error: ' + addrCheck[1]);
    }

    const claimToTx = api.tx.plasmLockdrop.claimTo(claimId, encodedAddr, signature);

    const txHash = await claimToTx.send();

    return txHash;
}

/**
 * submits a real-time lockdrop claim request to plasm node and returns the transaction hash.
 * this is a unsigned transaction that is only authenticated by a simple PoW to prevent spamming
 * @param api plasm node api instance (polkadot-js api)
 * @param lockParam lockdrop parameter that contains the lock data
 * @param nonce nonce for PoW authentication with the node
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendLockClaimRequest(api: ApiPromise, lockParam: Struct<any>, nonce: Uint8Array) {
    if (typeof api.tx.plasmLockdrop === 'undefined') {
        throw new Error('Plasm node cannot find lockdrop module');
    }

    const claimRequestTx = api.tx.plasmLockdrop.request(lockParam.toU8a(), nonce);

    const hash = await claimRequestTx.send();

    return hash;
}

/**
 * generates a Plasm public address with the given ethereum public key
 * @param ethPubKey an compressed ECDSA public key. With or without the 0x prefix
 */
export function generatePlmAddress(publicKey: string) {
    // converts a given hex string into Uint8Array
    const toByteArray = (hexString: string) => {
        const result = [];
        for (let i = 0; i < hexString.length; i += 2) {
            result.push(parseInt(hexString.substr(i, 2), 16));
        }
        return new Uint8Array(result);
    };

    // hash to blake2
    const plasmPubKey = polkadotUtilCrypto.blake2AsU8a(toByteArray(publicKey.replace('0x', '')), 256);
    // encode address
    const plasmAddress = polkadotUtilCrypto.encodeAddress(plasmPubKey, 5);
    return plasmAddress;
}

/**
 * Fetches the number of free balance for the given address in femto.
 * @param api polkadot-js api instance
 * @param plasmAddress Plasm network address
 * @param asPlm if the output value should be in PLM. Default denominator is in femto
 */
// export async function getAddressBalance(api: ApiPromise, plasmAddress: string | Uint8Array, asPlm?: boolean) {
//     const encodedAddr =
//         plasmAddress instanceof Uint8Array ? polkadotUtilCrypto.encodeAddress(plasmAddress) : plasmAddress;
//     const addrCheck = polkadotUtilCrypto.checkAddress(encodedAddr, 5);
//     if (!addrCheck[0]) {
//         throw new Error('Plasm address check error: ' + addrCheck[1]);
//     }

//     const { data: balance } = await api.query.system.account(plasmAddress);
//     let _bal = new BigNumber(balance.free.toString());
//     if (asPlm) {
//         _bal = femtoToPlm(new BigNumber(balance.free.toString()));
//     }
//     return _bal;
// }

/**
 * Fetches Plasm real-time lockdrop vote threshold and positive vote values.
 * @param api polkadot-js api instance
 */
export async function getLockdropVoteRequirements(api: ApiPromise) {
    // number of minium votes required for a claim request to be accepted
    const _voteThreshold = Number.parseInt((await api.query.plasmLockdrop.voteThreshold()).toString());
    // number of outstanding votes (approve votes - decline votes) required for a claim request to be accepted
    const _positiveVotes = Number.parseInt((await api.query.plasmLockdrop.positiveVotes()).toString());

    return {
        voteThreshold: _voteThreshold,
        positiveVotes: _positiveVotes,
    };
}

/**
 * sends a lockdrop claim request to Plasm net node. This will fund the ECDSA address.
 * @param api polkadot API instance
 * @param claimId real-time lockdrop claim ID
 */
export async function sendLockdropClaim(api: ApiPromise, claimId: Uint8Array | H256) {
    if (typeof api.tx.plasmLockdrop === 'undefined') {
        throw new Error('Plasm node cannot find lockdrop module');
    }

    const claimRequestTx = api.tx.plasmLockdrop.claim(claimId);

    const txHash = await claimRequestTx.send();

    return txHash;
}

/**
 * Plasm network real-time lockdrop claim data query wrapper.
 * This will query the node with the given claim ID and wrap the data to a readable interface.
 * This function will return undefined if the claim data does not exists on the chain.
 * @param api Polkadot-js API instance
 * @param claimId real-time lockdrop claim ID
 */
export async function getClaimStatus(api: ApiPromise, claimId: Uint8Array | H256) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const claim = (await api.query.plasmLockdrop.claims(claimId)) as any;

    // wrap block query data to TypeScript interface
    const data: Claim = {
        params: {
            // we use snake case here because this data is directly parsed from the node
            type: claim.get('params').get('type'),
            transactionHash: claim.get('params').get('transaction_hash'),
            publicKey: claim.get('params').get('public_key'),
            duration: claim.get('params').get('duration'),
            value: claim.get('params').get('value'),
        },
        approve: claim.get('approve'),
        decline: claim.get('decline'),
        amount: claim.get('amount'),
        complete: claim.get('complete'),
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_key, value] of Object.entries(data.params)) {
        // check if data exists on chain
        if (
            typeof value === 'undefined' ||
            value.toHex() === '0x000000000000000000000000000000000000000000000000000000000000000000' || // pub key
            value.toHex() === '0x0000000000000000000000000000000000000000000000000000000000000000' // tx hash
        ) {
            return undefined;
        }
    }

    return data;
}

export async function getLockdropAlpha(api: ApiPromise) {
    const alpha = await api.query.plasmLockdrop.alpha();
    // the queried data will always be a whole number, but the calculated data is between 0 ~ 1.
    // so we need to manually convert them
    return parseFloat('0.' + alpha.toString());
}

export function subscribeCoinRate(api: ApiPromise, subscribeCallback: (rate: [number, number]) => void) {
    //const rate = ((await api.query.plasmLockdrop.dollarRate()) as unknown) as [number, number];
    const unsub = api.query.plasmLockdrop.dollarRate(data => {
        const _rate = (data as unknown) as [number, number];
        subscribeCallback(_rate);
    });
    return unsub;
}

export async function getCoinRate(api: ApiPromise) {
    const rate = ((await api.query.plasmLockdrop.dollarRate()) as unknown) as [number, number];
    return rate;
}

/**
 * Obtains the current lockdrop duration in block numbers. First entry in the tuple is the start
 * and the second entry is the end block number
 * @param api plasm network api inst
 */
export async function getLockdropDuration(api: ApiPromise) {
    const lockdropBounds = await api.query.plasmLockdrop.lockdropBounds();

    return (lockdropBounds as unknown) as [BlockNumber, BlockNumber];
}

/**
 * converts lockdrop parameter into a Lockdrop type
 * @param lockdropParam lockdrop parameter type in polakdot-js structure
 */
export function structToLockdrop(lockdropParam: Struct) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const claim = lockdropParam as any;
    const param: Lockdrop = {
        type: claim.get('type'),
        transactionHash: claim.get('transactionHash'),
        publicKey: claim.get('publicKey'),
        duration: claim.get('duration'),
        value: claim.get('value'),
    };

    return param;
}

/**
 * Sends another claim request from the given claim ID. The request must have been submitted once for this to work.
 * @param api polkadot-js api
 * @param claimId claim ID
 */
export async function requestClaimBump(api: ApiPromise, claimId: Uint8Array | H256) {
    const claimData = await getClaimStatus(api, claimId);
    if (typeof claimData === 'undefined') {
        throw new Error('No claim request was found for ' + polkadotUtils.u8aToHex(claimId));
    }
    const { transactionHash, type, publicKey, value, duration } = claimData.params;
    const lockParam = createLockParam(
        type,
        transactionHash.toHex(),
        publicKey.toHex(),
        duration.toString(),
        value.toString(),
    );
    const nonce = claimPowNonce(claimId);
    const hash = await sendLockClaimRequest(api, lockParam, nonce);
    return hash;
}

export async function isClaimHanging(plasmApi: ApiPromise, claimData: Claim) {
    const { voteThreshold, positiveVotes } = await getLockdropVoteRequirements(plasmApi);

    const isClaimHanging =
        claimData.approve.size - claimData.decline.size < voteThreshold || claimData.approve.size < positiveVotes;
    const isValidClaim = claimData.approve.size > 0;
    //console.log(`Claim ${i.claimId} has ${i.approve.size} approvals and ${i.decline.size} disapprovals`);

    return (isClaimHanging && isValidClaim) || (claimData.approve.size === 0 && claimData.decline.size === 0);
}

const durationToEpoch = (duration: number) => {
    const epochDays = 60 * 60 * 24;
    return duration * epochDays;
};

/**
 * a utility function that obtains the claim PoW nonce in hex string from the given claim ID.
 * This is used to manually send claim requests from polkadot-js app portal
 * @param claimId claim ID in hex string
 */
export const claimIdToNonceString = (claimId: string) => {
    const nonce2 = claimPowNonce(polkadotUtils.hexToU8a(claimId));

    return polkadotUtils.u8aToHex(nonce2);
};

/**
 * converts all lockdrops on ethereum into plasm lockdrop claim parameter
 * @param pubKey the public key of the locker
 * @param locks the lock event that has been parsed from the chain
 * @param latestBlock the current highest ethereum block number
 */
export const getClaimParamsFromEth = (pubKey: string, locks: LockEvent[], latestBlock: number) => {
    if (typeof pubKey === 'undefined' || pubKey === '') {
        throw new Error('No public key was provided');
    }

    if (locks.length === 0) {
        throw new Error('No lock events found');
    }

    const claimableLocks = locks.filter(i => {
        // check if the lock as been confirmed for at least 5 blocks
        const blockPassed = i.blockNo + 5 < latestBlock;
        return blockPassed;
    });

    const claimIDs = claimableLocks.map(lock => {
        const _wei = lock.eth.toFixed();
        const _param = createLockParam(
            LockdropType.Ethereum,
            lock.transactionHash,
            pubKey,
            durationToEpoch(lock.duration).toString(),
            _wei,
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return structToLockdrop(_param as any);
    });

    return claimIDs;
};
