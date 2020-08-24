/* eslint-disable @typescript-eslint/camelcase */
import BigNumber from 'bignumber.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Hash, H256 } from '@polkadot/types/interfaces';
import * as polkadotUtilCrypto from '@polkadot/util-crypto';
//import * as polkadotUtil from '@polkadot/util';
import { u8aConcat } from '@polkadot/util';
import { Struct, TypeRegistry, u64, u128, U8aFixed, u8 } from '@polkadot/types';
import * as plasmDefinitions from '@plasm/types/interfaces/definitions';
import { LockdropType, Claim, Lockdrop } from 'src/types/LockdropModels';

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
export function femtoToPlm(femto: BigNumber) {
    if (femto.isLessThanOrEqualTo(new BigNumber(0))) {
        return new BigNumber(0);
    }
    const plmDenominator = new BigNumber(10).pow(new BigNumber(15));
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
export const plasmTypeReg = new TypeRegistry();

/**
 * establishes a connection between the client and the plasm node with the given endpoint.
 * this will default to the main net node
 * @param network end point for the client to connect to
 */
export async function createPlasmInstance(network?: PlasmNetwork) {
    let endpoint = '';
    const types = Object.values(plasmDefinitions).reduce((res, { types }): object => ({ ...res, ...types }), {});

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

    const wsProvider = new WsProvider(endpoint);

    return await ApiPromise.create({
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

    // console.log({
    //     type: network, // enum is converted to number
    //     transactionHash: transactionHash,
    //     publicKey: new U8aFixed(plasmTypeReg, publicKey, 264).toHex(),
    //     duration: new u64(plasmTypeReg, duration).toString(),
    //     value: new u128(plasmTypeReg, value).toString(),
    //     nonce: polkadotUtil.u8aToHex(claimPowNonce(lockParam.hash)),
    // });

    return lockParam;
}

/**
 * signature message that is used for the claim_to() function.
 * sign this message with a ECDSA private key to generate the correct signature
 */
export const claimToMessage = (claimId: string, plasmAddressHex: string) =>
    `I declare to claim lockdrop reward with ID ${claimId.replace('0x', '')} to AccountId ${plasmAddressHex.replace(
        '0x',
        '',
    )}`;

/**
 * sends the unclaimed lockdrop reward to the given plasm address.
 * the signature must derive from the public key that made the lock.
 * @param api
 * @param claimId
 * @param recipient
 * @param signature
 */
export async function claimTo(api: ApiPromise, claimId: string, recipient: string, signature: string) {
    const claimToTx = api.tx.plasmLockdrop.claimTo(claimId, recipient, signature);

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
export async function sendLockClaimRequest(api: ApiPromise, lockParam: Struct, nonce: Uint8Array): Promise<Hash> {
    if (typeof api.tx.plasmLockdrop === 'undefined') {
        throw new Error('Plasm node cannot find lockdrop module');
    }

    const claimRequestTx = api.tx.plasmLockdrop.request(lockParam.toU8a(), nonce);

    const txHash = await claimRequestTx.send();

    return txHash;
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
export async function getAddressBalance(api: ApiPromise, plasmAddress: string, asPlm?: boolean) {
    const { data: balance } = await api.query.system.account(plasmAddress);
    let _bal = new BigNumber(balance.free.toString());
    if (asPlm) {
        _bal = femtoToPlm(new BigNumber(balance.free.toString()));
    }
    return _bal;
}

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
