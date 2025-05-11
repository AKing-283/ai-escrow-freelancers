// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract WillEscrow {
    struct Escrow {
        address beneficiary;
        uint96 amount;  // Packed with releaseTime
        uint96 releaseTime;
        bool released;
    }

    mapping(address => Escrow) public escrows;
    
    event Deposit(address indexed owner, address indexed beneficiary, uint96 amount, uint96 releaseTime);
    event Release(address indexed beneficiary, uint96 amount);

    function createEscrow(address _beneficiary, uint96 _releaseTime) external payable {
        require(msg.value > 0, "Must deposit some ETH");
        require(_beneficiary != address(0), "Invalid beneficiary address");
        require(_releaseTime > uint96(block.timestamp), "Release time must be in the future");
        require(escrows[msg.sender].amount == 0, "Escrow already exists");

        escrows[msg.sender] = Escrow({
            beneficiary: _beneficiary,
            amount: uint96(msg.value),
            releaseTime: _releaseTime,
            released: false
        });

        emit Deposit(msg.sender, _beneficiary, uint96(msg.value), _releaseTime);
    }

    function releaseFunds(address _owner) external {
        Escrow storage escrow = escrows[_owner];
        require(escrow.amount > 0, "No escrow found");
        require(uint96(block.timestamp) >= escrow.releaseTime, "Release time not reached");
        require(msg.sender == escrow.beneficiary, "Only beneficiary can release");
        require(!escrow.released, "Funds already released");

        uint96 amount = escrow.amount;
        escrow.released = true;
        escrow.amount = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit Release(msg.sender, amount);
    }

    function getBalance(address _owner) external view returns (uint96) {
        return escrows[_owner].amount;
    }

    function getEscrowDetails(address _owner) external view returns (
        address beneficiary,
        uint96 releaseTime,
        uint96 amount,
        bool released
    ) {
        Escrow storage escrow = escrows[_owner];
        return (
            escrow.beneficiary,
            escrow.releaseTime,
            escrow.amount,
            escrow.released
        );
    }
} 