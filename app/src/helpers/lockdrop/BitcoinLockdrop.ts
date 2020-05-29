//const BTC_TX_API_TESTNET = 'https://api.blockcypher.com/v1/btc/test3/txs/';
//const BTC_ADDR_API_TESTNET = 'https://api.blockcypher.com/v1/btc/test3/addrs/;';

//const BTC_TX_API_MAINNET = 'https://api.blockcypher.com/v1/btc/main/txs/';
//const BTC_ADDR_API_MAINNET = 'https://api.blockcypher.com/v1/btc/main/addrs/;';

export const message = 'plasm network btc lock';

export const getPublicKey = () => {
    console.log('get pub key');
};

export const createLockScript = () => {
    console.log('create lock script');
};

export const verifyOwner = (addr: string, sig: string) => {
    console.log(addr + sig);
};
