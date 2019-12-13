const lockedEventABI = [
    {
      'anonymous': false,
      'inputs': [
        {
          'indexed': true,
          'name': 'eth',
          'type': 'uint256'
        },
        {
          'indexed': true,
          'name': 'duration',
          'type': 'uint256'
        },
        {
          'indexed': false,
          'name': 'lock',
          'type': 'address'
        }
      ],
      'name': 'Locked',
      'type': 'event'
    }
];

const BN = require('bn.js');
const Transaction = require('ethereumjs-tx').Transaction;

function recover(tx) {
    const ethTx = new Transaction({
        nonce: '0x'+tx.nonce.toString(16),
        gasPrice: '0x'+parseInt(tx.gasPrice).toString(16),
        gasLimit: '0x'+tx.gas.toString(16),
        to: tx.to,
        value: '0x'+parseInt(tx.value).toString(16),
        data: tx.input,
        v: tx.v,
        r: tx.r,
        s: tx.s
    }, { chain: 'ropsten' });
    return '0x'+ethTx.getSenderPublicKey().toString('hex');
}

function ethToPlm(eth, duration) {
    switch (duration) {
        case '30':
            return eth.mul(new BN('24'));
        case '100':
            return eth.mul(new BN('100'));
        case '300':
            return eth.mul(new BN('360'));
        case '1000':
            return eth.mul(new BN('1600'));
    }
}

module.exports = {
    getLocks: (address, fromBlock, toBlock) => {
        if (!fromBlock) { fromBlock = 0; }
        if (!toBlock) { toBlock = 'latest'; }
        return web3 => {
            const contract = new web3.eth.Contract(lockedEventABI, address);
            return contract.getPastEvents('Locked', { fromBlock, toBlock })
                .then(events =>
                    Promise.all(
                        events.map(e =>
                            Promise.all([
                                web3.eth.getTransaction(e.transactionHash),
                                Promise.resolve(e)
                            ])
                        )
                    )
                )
                .then(events =>
                    events.map(e =>
                        [recover(e[0]), e[1]]
                    )
                )
        };
    },
    getBalances: locks =>
        // Group lock events by sender
        Object.entries(locks.reduce((r, a) => {
            const account = a[0];
            const events = a[1];
            const plmBalance = ethToPlm(new BN(events.returnValues.eth), events.returnValues.duration);
            r[account] = [...r[account] || [], plmBalance];
            return r;
        }, {}))
            // Map lock groups to sender/balance pairs
            .map(lock => {
                const sender = lock[0];
                const balances = lock[1];
                const totalBalance = balances.reduce((s, i) => s.add(new BN(i)), new BN('0'))
                return [sender, totalBalance.toString()]
            })
};
