pragma solidity ^0.5.0;

import './Lock.sol';

contract Lockdrop {
    enum Term {
        ThreeMo,
        SixMo,
        TwelveMo
    }

    // Time constants
    uint256 constant public LOCK_DROP_PERIOD = 1 days * 92; // 3 months
    uint256 public LOCK_START_TIME;
    uint256 public LOCK_END_TIME;

    // ETH locking events
    event Locked(address indexed owner, uint256 indexed eth, address indexed lockAddr);

    constructor(uint startTime) public {
        LOCK_START_TIME = startTime;
        LOCK_END_TIME = startTime + LOCK_DROP_PERIOD;
    }

    /**
     * @dev        Locks up the value sent to contract in a new Lock
     * @param      term         The length of the lock up\
     */
    function lock(Term term)
        external
        payable
        didStart
        didNotEnd
    {
        require(msg.value > 0);

        uint256 eth = msg.value;
        address owner = msg.sender;
        uint256 unlockTime = unlockTimeForTerm(term);

        // Create ETH lock contract
        Lock lockAddr = (new Lock).value(eth)(owner, unlockTime);
        // ensure lock contract has all ETH, or fail
        assert(address(lockAddr).balance == msg.value);

        emit Locked(owner, eth, address(lockAddr));
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

    function unlockTimeForTerm(Term term) internal view returns (uint256) {
        if (term == Term.ThreeMo) return now + 92 days;
        if (term == Term.SixMo) return now + 183 days;
        if (term == Term.TwelveMo) return now + 365 days;

        revert();
    }
}
