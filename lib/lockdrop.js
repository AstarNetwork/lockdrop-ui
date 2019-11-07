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

module.exports = {
    getLocks: (address, fromBlock, toBlock) => {
        return (web3) => {
            const contract = new web3.eth.Contract(lockedEventABI, address);
            return contract.getPastEvents('Locked', { fromBlock, toBlock })
                .then(events => events.map(item => item.returnValues));
        };
    }
};
