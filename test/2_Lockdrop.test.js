const Lockdrop = artifacts.require('Lockdrop');
const lib = require('../lib/lockdrop');

const chai = require('chai');
chai.use(require('chai-as-promised'))
chai.use(require('bn-chai')(web3.utils.BN));
chai.should();

contract('Lock', (accounts) => {

    describe('Lockrop locked events', () => {
        it('Locking funds and emit event', async () => {
            const lockdrop = await Lockdrop.deployed();
            let tx = await lockdrop.lock(0, {from: accounts[0], value: '1000'}).should.be.fulfilled;
            chai.expect(tx.logs[0].event).equal('Locked');
            chai.expect(tx.logs[0].args.eth).to.eq.BN('1000');
            chai.expect(tx.logs[0].args.owner).equal(accounts[0]);

            tx = await lockdrop.lock(0, {from: accounts[0], value: '500'}).should.be.fulfilled;
            chai.expect(tx.logs[0].event).equal('Locked');
            chai.expect(tx.logs[0].args.eth).to.eq.BN('500');
            chai.expect(tx.logs[0].args.owner).equal(accounts[0]);

            tx = await lockdrop.lock(0, {from: accounts[1], value: '100'}).should.be.fulfilled;
            chai.expect(tx.logs[0].event).equal('Locked');
            chai.expect(tx.logs[0].args.eth).to.eq.BN('100');
            chai.expect(tx.logs[0].args.owner).equal(accounts[1]);
        });

        it('Reject transactions without funds', async () => {
            const lockdrop = await Lockdrop.deployed();
            await lockdrop.lock(0).should.be.rejected;
        });
    });

});
