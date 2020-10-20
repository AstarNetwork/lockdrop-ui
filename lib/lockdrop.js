const lockedEventABI = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'eth',
                type: 'uint256',
            },
            {
                indexed: true,
                name: 'duration',
                type: 'uint256',
            },
            {
                indexed: false,
                name: 'lock',
                type: 'address',
            },
            {
                indexed: false,
                name: 'introducer',
                type: 'address',
            },
        ],
        name: 'Locked',
        type: 'event',
    },
];

const Transaction = require('ethereumjs-tx').Transaction;

function recover(tx) {
    const ethTx = new Transaction(
        {
            nonce: '0x' + tx.nonce.toString(16),
            gasPrice: '0x' + parseInt(tx.gasPrice).toString(16),
            gasLimit: '0x' + tx.gas.toString(16),
            to: tx.to,
            value: '0x' + parseInt(tx.value).toString(16),
            data: tx.input,
            v: tx.v,
            r: tx.r,
            s: tx.s,
        },
    );
    return '0x' + ethTx.getSenderPublicKey().toString('hex');
}

module.exports = {
    getLocks: (address, fromBlock, toBlock) => {
        if (!fromBlock) {
            fromBlock = 0;
        }
        if (!toBlock) {
            toBlock = 'latest';
        }
        return web3 => {
            const contract = new web3.eth.Contract(lockedEventABI, address);
            return contract
                .getPastEvents('Locked', { fromBlock, toBlock })
                .then(events =>
                    Promise.all(
                        events.map(e => Promise.all([web3.eth.getTransaction(e.transactionHash), Promise.resolve(e)])),
                    ),
                )
                .then(events => events.map(e => [recover(e[0]), e[1]]));
        };
    },
};
