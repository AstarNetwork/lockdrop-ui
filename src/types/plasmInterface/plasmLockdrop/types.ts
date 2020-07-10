// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

import { Struct, U8aFixed } from '@polkadot/types/codec';
import { bool, u128, u16, u32, u64, u8 } from '@polkadot/types/primitive';
import { AccountId, H256 } from '@polkadot/types/interfaces/runtime';

/** @name AuthorityId */
export interface AuthorityId extends AccountId {}

/** @name AuthorityVote */
export interface AuthorityVote extends u32 {}

/** @name Claim */
export interface Claim extends Struct {
  readonly params: Lockdrop;
  readonly approve: AuthorityVote;
  readonly decline: AuthorityVote;
  readonly amount: u128;
  readonly complete: bool;
}

/** @name ClaimId */
export interface ClaimId extends H256 {}

/** @name ClaimVote */
export interface ClaimVote extends Struct {
  readonly claim_id: ClaimId;
  readonly approve: bool;
  readonly authority: u16;
}

/** @name DollarRate */
export interface DollarRate extends u128 {}

/** @name Lockdrop */
export interface Lockdrop extends Struct {
  readonly type: u8;
  readonly transaction_hash: H256;
  readonly public_key: U8aFixed;
  readonly duration: u64;
  readonly value: u128;
}

/** @name TickerRate */
export interface TickerRate extends Struct {
  readonly authority: u16;
  readonly btc: DollarRate;
  readonly eth: DollarRate;
}

export type PHANTOM_PLASMLOCKDROP = 'plasmLockdrop';
