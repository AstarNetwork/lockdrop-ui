const lockedEventABI = [
    {
      'anonymous': false,
      'inputs': [
        {
          'indexed': true,
          'name': 'owner',
          'type': 'address'
        },
        {
          'indexed': true,
          'name': 'eth',
          'type': 'uint256'
        },
        {
          'indexed': true,
          'name': 'lockAddr',
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
            r[a[0]] = [...r[a[0]] || [], a[1].returnValues.eth];
            return r;
        }, {}))
            // Map lock groups to sender/balance pairs
            .map(lock => {
                const sender = lock[0];
                const eth = lock[1].reduce((s, i) => s.add(new BN(i)), new BN('0'))
                const balance = eth; // TODO: Formula
                return [sender, balance.toNumber()]
            })
};
