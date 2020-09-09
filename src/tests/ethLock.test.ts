/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as EthLockdrop from '../helpers/lockdrop/EthereumLockdrop';

// we use a lot of API calls in this test, it's good to extend the timeout
jest.setTimeout(60000);

describe('Ethereum API fetch tests', () => {
    it('fetches transaction data from the cache server', async () => {
        const events = await EthLockdrop.fetchEventsFromCache('0xa4803f17607B7cDC3dC579083d9a14089E87502b');

        // there should be more than 3000 transactions in the contract
        expect(events.length).toBeGreaterThanOrEqual(3000);
        expect(events[0].transactionHash).toEqual('0x2544b978b0004b21b16753a177f54dab6e7bbbb054909837390c009a3e132ef8');
    });
});
