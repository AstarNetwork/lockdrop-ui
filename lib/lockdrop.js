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

module.exports = {
    getLocks: (address, fromBlock, toBlock) => {
        return (web3) => {
            const contract = new web3.eth.Contract(lockedEventABI, address);
            return contract.getPastEvents('Locked', { fromBlock, toBlock })
                .then(events => events.map(item => item.returnValues));
        };
    },
    getBalances: locks =>
        // Group lock events by sender
        Object.entries(locks.reduce((r, a) => {
            r[a.owner] = [...r[a.owner] || [], a.eth];
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
