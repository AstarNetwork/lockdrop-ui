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
const secp256k1 = require('secp256k1');

function ecrecover(tx) {
    const hash = Buffer.from(tx.hash.slice(2), 'hex');
    const signature = Buffer.concat([
        Buffer.from(tx.r.slice(2), 'hex'),
        Buffer.from(tx.s.slice(2), 'hex')
    ], 64);
    const recovery = tx.v - 27;
    return secp256k1.recover(hash, signature, recovery);
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
                        [ecrecover(e[0]).toString('hex'), e[1]]
                    )
                )
        };
    },
    getBalances: locks =>
        // Group lock events by sender
        Object.entries(locks.reduce((r, a) => {
            const account = a[0];
            const events = a[1];
            const ix = [account, events.returnValues.duration];
            r[ix] = [...r[ix] || [], events.returnValues.eth];
            return r;
        }, {}))
            // Map lock groups to sender/balance pairs
            .map(lock => {
                const sender = lock[0].split(',')[0];
                const duration = lock[0].split(',')[1];
                const eth = lock[1].reduce((s, i) => s.add(new BN(i)), new BN('0'))
                const balance = ethToPlm(eth, duration);
                return [sender, balance.toNumber()]
            })
};
