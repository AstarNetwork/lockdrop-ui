export default {
    types: {
        ClaimId: 'H256',
        Lockdrop: {
            type: 'u8',
            transaction_hash: 'H256',
            public_key: '[u8; 33]',
            duration: 'u64',
            value: 'u128',
        },
        TickerRate: {
            authority: 'u16',
            btc: 'DollarRate',
            eth: 'DollarRate',
        },
        DollarRate: 'u128',
        AuthorityId: 'AccountId',
        AuthorityVote: 'u32',
        ClaimVote: {
            claim_id: 'ClaimId',
            approve: 'bool',
            authority: 'u16',
        },
        Claim: {
            params: 'Lockdrop',
            approve: 'AuthorityVote',
            decline: 'AuthorityVote',
            amount: 'u128',
            complete: 'bool',
        },
    },
};
