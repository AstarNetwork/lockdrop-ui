pragma solidity ^0.5.0;

import './Lock.sol';

contract Lockdrop {
    // Time constants
    uint256 constant public LOCK_DROP_PERIOD = 14 days; // Testnet lockdrop duration
    uint256 public LOCK_START_TIME;
    uint256 public LOCK_END_TIME;

    // ETH locking events
    event Locked(uint256 indexed eth, uint256 indexed duration, address lock);

    constructor(uint startTime) public {
        LOCK_START_TIME = startTime;
        LOCK_END_TIME = startTime + LOCK_DROP_PERIOD;
    }

    /**
     * @dev        Locks up the value sent to contract in a new Lock
     * @param      _days         The length of the lock up
     */
    function lock(uint256 _days)
        external
        payable
        didStart
        didNotEnd
    {
        // Accept External Owned Accounts only
        require(msg.sender == tx.origin);

        // Accept only fixed set of durations
        require(_days == 30 || _days == 100 || _days == 300 || _days == 1000); 
        uint256 unlockTime = now + _days * 1 days;

        // Accept non-zero payments only
        require(msg.value > 0);
        uint256 eth = msg.value;

        // Create ETH lock contract
        Lock lockAddr = (new Lock).value(eth)(msg.sender, unlockTime);

        // ensure lock contract has all ETH, or fail
        assert(address(lockAddr).balance == eth);

        emit Locked(eth, _days, address(lockAddr));
    }

    /**
     * @dev        Ensures the lockdrop has started
     */
    modifier didStart() {
        require(now >= LOCK_START_TIME);
        _;
    }

    /**
     * @dev        Ensures the lockdrop has not ended
     */
    modifier didNotEnd() {
        require(now <= LOCK_END_TIME);
        _;
    }
}
