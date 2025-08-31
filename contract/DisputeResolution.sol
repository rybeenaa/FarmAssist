// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DisputeResolution
 * @author Your Name
 * @notice A standalone governance contract for farmers to vote on disputes.
 * This contract allows any address to create a dispute and cast a vote. It
 * ensures that each address can only vote once per dispute.
 */
contract DisputeResolution {
    // Enum to represent the two possible vote outcomes
    enum VoteOption {
        For,
        Against
    }

    // Struct to hold all information about a specific dispute
    struct Dispute {
        uint256 id;
        string description;
        address creator;
        uint256 forVotes;
        uint256 againstVotes;
        bool resolved;
        mapping(address => bool) hasVoted;
    }

    // Counter to ensure unique dispute IDs
    uint256 private _disputeCounter;

    // Mapping from a dispute ID to the Dispute struct
    mapping(uint256 => Dispute) public disputes;

    // Events to log key actions on-chain for easy monitoring
    event DisputeCreated(uint256 indexed disputeId, address indexed creator, string description);
    event Voted(uint256 indexed disputeId, address indexed voter, VoteOption vote);
    event DisputeResolved(uint256 indexed disputeId);

    /**
     * @notice Creates a new dispute for voting.
     * @param _description A detailed explanation of the dispute.
     */
    function createDispute(string calldata _description) external {
        _disputeCounter++;
        uint256 disputeId = _disputeCounter;

        Dispute storage newDispute = disputes[disputeId];
        newDispute.id = disputeId;
        newDispute.description = _description;
        newDispute.creator = msg.sender;
        newDispute.resolved = false;

        emit DisputeCreated(disputeId, msg.sender, _description);
    }

    /**
     * @notice Allows a user to cast their vote on a specific dispute.
     * @dev Reverts if the dispute does not exist, is already resolved, or if the user has already voted.
     * @param _disputeId The ID of the dispute to vote on.
     * @param _vote The chosen vote option (0 for For, 1 for Against).
     */
    function vote(uint256 _disputeId, VoteOption _vote) external {
        Dispute storage selectedDispute = disputes[_disputeId];

        require(selectedDispute.id != 0, "Dispute does not exist");
        require(!selectedDispute.resolved, "Dispute has already been resolved");
        require(!selectedDispute.hasVoted[msg.sender], "You have already voted on this dispute");

        selectedDispute.hasVoted[msg.sender] = true;

        if (_vote == VoteOption.For) {
            selectedDispute.forVotes++;
        } else {
            selectedDispute.againstVotes++;
        }

        emit Voted(_disputeId, msg.sender, _vote);
    }

    /**
     * @notice Resolves a dispute, closing it for future votes.
     * @dev In a real-world scenario, this might be restricted to a specific role or triggered by a time limit.
     * @param _disputeId The ID of the dispute to resolve.
     */
    function resolveDispute(uint256 _disputeId) external {
        Dispute storage selectedDispute = disputes[_disputeId];
        require(selectedDispute.id != 0, "Dispute does not exist");
        // Add access control here if needed, e.g., only creator or an admin can resolve.
        // require(msg.sender == selectedDispute.creator, "Only the creator can resolve");
        
        selectedDispute.resolved = true;
        emit DisputeResolved(_disputeId);
    }

    /**
     * @notice Retrieves the current vote counts for a dispute.
     * @param _disputeId The ID of the dispute.
     * @return forVotes The total number of 'For' votes.
     * @return againstVotes The total number of 'Against' votes.
     */
    function getVoteCounts(uint256 _disputeId) external view returns (uint256 forVotes, uint256 againstVotes) {
        Dispute storage selectedDispute = disputes[_disputeId];
        return (selectedDispute.forVotes, selectedDispute.againstVotes);
    }
}
