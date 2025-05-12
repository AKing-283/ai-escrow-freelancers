// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract WillEscrow {
    struct Job {
        address owner;
        uint96 amount;
        uint96 releaseTime;
        bool isOpen;
        bool isCompleted;
        address freelancer;
        string description;
        string submission;
        bool isVerified;
        bool isApproved;
    }

    mapping(address => Job) public jobs;
    
    event JobPosted(address indexed owner, uint96 amount, uint96 releaseTime, string description);
    event FreelancerAssigned(address indexed owner, address indexed freelancer);
    event DeadlineUpdated(address indexed owner, uint96 newReleaseTime);
    event WorkSubmitted(address indexed owner, string submission);
    event WorkVerified(address indexed owner, bool isApproved);
    event FundsReleased(address indexed owner, address indexed freelancer, uint96 amount);
    event FundsRefunded(address indexed owner, uint96 amount);

    function postJob(uint96 _releaseTime, string memory _description) external payable {
        require(msg.value > 0, "Must deposit some ETH");
        require(_releaseTime > uint96(block.timestamp), "Release time must be in the future");
        require(jobs[msg.sender].amount == 0, "Job already exists");

        jobs[msg.sender] = Job({
            owner: msg.sender,
            amount: uint96(msg.value),
            releaseTime: _releaseTime,
            isOpen: true,
            isCompleted: false,
            freelancer: address(0),
            description: _description,
            submission: "",
            isVerified: false,
            isApproved: false
        });

        emit JobPosted(msg.sender, uint96(msg.value), _releaseTime, _description);
    }

    function applyForJob(address _owner) external {
        Job storage job = jobs[_owner];
        require(job.amount > 0, "Job does not exist");
        require(job.isOpen, "Job is not open");
        require(job.freelancer == address(0), "Job already has a freelancer");
        require(msg.sender != _owner, "Cannot apply for your own job");

        job.freelancer = msg.sender;
        job.isOpen = false;

        emit FreelancerAssigned(_owner, msg.sender);
    }

    function updateDeadline(uint96 _newReleaseTime) external {
        Job storage job = jobs[msg.sender];
        require(job.amount > 0, "Job does not exist");
        require(!job.isCompleted, "Job is already completed");
        require(_newReleaseTime > uint96(block.timestamp), "New release time must be in the future");

        job.releaseTime = _newReleaseTime;
        emit DeadlineUpdated(msg.sender, _newReleaseTime);
    }

    function submitWork(string memory _submission) external {
        Job storage job = jobs[msg.sender];
        require(job.amount > 0, "Job does not exist");
        require(msg.sender == job.freelancer, "Only assigned freelancer can submit work");
        require(!job.isCompleted, "Job is already completed");

        job.submission = _submission;
        emit WorkSubmitted(msg.sender, _submission);
    }

    function verifyWork(address _owner, bool _isApproved) external {
        Job storage job = jobs[_owner];
        require(job.amount > 0, "Job does not exist");
        require(!job.isCompleted, "Job is already completed");
        require(bytes(job.submission).length > 0, "No work submitted yet");
        // TODO: Add access control for AI agent

        job.isVerified = true;
        job.isApproved = _isApproved;

        if (_isApproved) {
            job.isCompleted = true;
            uint96 amount = job.amount;
            job.amount = 0;

            (bool success, ) = job.freelancer.call{value: amount}("");
            require(success, "Transfer failed");
            emit FundsReleased(_owner, job.freelancer, amount);
        } else {
            job.isCompleted = true;
            uint96 amount = job.amount;
            job.amount = 0;

            (bool success, ) = job.owner.call{value: amount}("");
            require(success, "Transfer failed");
            emit FundsRefunded(_owner, amount);
        }

        emit WorkVerified(_owner, _isApproved);
    }

    function getJobDetails(address _owner) external view returns (
        address owner,
        uint96 amount,
        uint96 releaseTime,
        bool isOpen,
        bool isCompleted,
        address freelancer,
        string memory description,
        string memory submission,
        bool isVerified,
        bool isApproved
    ) {
        Job storage job = jobs[_owner];
        return (
            job.owner,
            job.amount,
            job.releaseTime,
            job.isOpen,
            job.isCompleted,
            job.freelancer,
            job.description,
            job.submission,
            job.isVerified,
            job.isApproved
        );
    }
} 