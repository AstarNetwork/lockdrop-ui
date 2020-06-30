const Lockdrop = artifacts.require('Lockdrop');
const lib = require('../lib/lockdrop');

const chai = require('chai');
chai.use(require('chai-as-promised'))
chai.use(require('bn-chai')(web3.utils.BN));
chai.should();

contract('Lockdrop', (accounts) => {
    describe('Smart contract interaction', () => {
        it('Locking funds and emit event', async () => {
            const lockdrop = await Lockdrop.deployed();
            let tx = await lockdrop.lock(30, accounts[0], {from: accounts[0], value: '1000'}).should.be.fulfilled;
            chai.expect(tx.logs[0].event).equal('Locked');
            chai.expect(tx.logs[0].args.eth).to.eq.BN('1000');
            chai.expect(tx.logs[0].args.duration).to.eq.BN('30');

            tx = await lockdrop.lock(30, accounts[0], {from: accounts[0], value: '500'}).should.be.fulfilled;
            chai.expect(tx.logs[0].event).equal('Locked');
            chai.expect(tx.logs[0].args.eth).to.eq.BN('500');
            chai.expect(tx.logs[0].args.duration).to.eq.BN('30');

            tx = await lockdrop.lock(100, accounts[0], {from: accounts[1], value: '100'}).should.be.fulfilled;
            chai.expect(tx.logs[0].event).equal('Locked');
            chai.expect(tx.logs[0].args.eth).to.eq.BN('100');
            chai.expect(tx.logs[0].args.duration).to.eq.BN('100');
        });

        it('Reject transaction without funds', async () => {
            const lockdrop = await Lockdrop.deployed();
            await lockdrop.lock(30, accounts[0]).should.be.rejected;
        });

        it('Reject transaction with wrong duration', async () => {
            const lockdrop = await Lockdrop.deployed();
            await lockdrop.lock(0, accounts[0]).should.be.rejected;
            await lockdrop.lock(1, accounts[0]).should.be.rejected;
        });
    });

    describe('Event collecting', () => {
        it('Collect Locked events', async () => {
            const lockdrop = await Lockdrop.deployed();
            const events = await lib.getLocks(lockdrop.address)(web3);
            const toAddress = pub => web3.utils.toChecksumAddress('0x'+web3.utils.sha3(pub).slice(-40));
            const senders = events.map(x => toAddress(x[0]));

            chai.expect(senders[0]).to.equal(accounts[0]);
            chai.expect(senders[1]).to.equal(accounts[0]);
            chai.expect(senders[2]).to.equal(accounts[1]);
        })
    });
});
