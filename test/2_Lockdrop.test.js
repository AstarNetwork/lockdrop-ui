const Lockdrop = artifacts.require('Lockdrop');
const lib = require('../lib/lockdrop');

const chai = require('chai');
chai.use(require('chai-as-promised'))
chai.use(require('bn-chai')(web3.utils.BN));
chai.should();

contract('Lock', (accounts) => {

    describe('Lockrop locked events', () => {
        let lock_account = accounts[0];
        let lock_balance = web3.utils.toWei('1', 'ether')
        let lock_time = '0';

        it('Get past events', async () => {
            const lockdrop = await Lockdrop.deployed();
            await lockdrop.lock(0, {from: lock_account}).should.be.fulfilled;
            await lib.getLocks(lockdrop.address, 0, 'latest')(web3).then(console.log);
        });

        /*
        it('Locking funds on contract creation', async () => {
            lock = await Lock.new(lock_account, lock_time, {value: lock_balance});
            chai.expect(await web3.eth.getBalance(lock.address)).to.eq.BN(lock_balance);
        });

        it('Unlocking funds when time reached', async () => {
            await lock.sendTransaction({from: lock_account}).should.be.fulfilled;
            chai.expect(await web3.eth.getBalance(lock.address)).to.eq.BN('0');
        });
        */
    });

});
