// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AuditLogger
 * @dev Smart contract for logging audit events on Flare Network
 * @notice This contract provides transparent and immutable audit logging for FarmAssist platform
 */
contract AuditLogger {
    // Events
    event AuditEventLogged(
        uint256 indexed eventId,
        address indexed submitter,
        string dataHash,
        string eventType,
        uint256 timestamp
    );

    event BatchAuditEventLogged(
        uint256 indexed batchId,
        address indexed submitter,
        string merkleRoot,
        string eventType,
        uint256 timestamp,
        uint256 itemCount
    );

    event ContractUpgraded(
        address indexed oldContract,
        address indexed newContract,
        uint256 timestamp
    );

    // Structs
    struct AuditEvent {
        string dataHash;
        string eventType;
        uint256 timestamp;
        uint256 blockNumber;
        address submitter;
        string metadata;
        bool isActive;
    }

    struct BatchAuditEvent {
        string merkleRoot;
        string eventType;
        uint256 timestamp;
        uint256 blockNumber;
        address submitter;
        uint256 itemCount;
        bool isActive;
    }

    // State variables
    mapping(uint256 => AuditEvent) public auditEvents;
    mapping(uint256 => BatchAuditEvent) public batchAuditEvents;
    mapping(string => uint256) public hashToEventId;
    mapping(address => bool) public authorizedSubmitters;
    
    uint256 public nextEventId = 1;
    uint256 public nextBatchId = 1;
    uint256 public totalEvents = 0;
    uint256 public totalBatches = 0;
    
    address public owner;
    address public pendingOwner;
    bool public paused = false;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedSubmitters[msg.sender] || msg.sender == owner, "Not authorized to submit audit events");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    modifier validHash(string memory _hash) {
        require(bytes(_hash).length > 0, "Hash cannot be empty");
        require(bytes(_hash).length == 64, "Invalid hash length"); // SHA-256 hex length
        _;
    }

    // Constructor
    constructor() {
        owner = msg.sender;
        authorizedSubmitters[msg.sender] = true;
    }

    /**
     * @dev Log a single audit event
     * @param _dataHash Hash of the original data
     * @param _eventType Type of event being audited
     * @param _timestamp Timestamp of the original event
     * @param _metadata Additional metadata as JSON string
     * @return eventId The ID of the created audit event
     */
    function logAuditEvent(
        string memory _dataHash,
        string memory _eventType,
        uint256 _timestamp,
        string memory _metadata
    ) 
        external 
        onlyAuthorized 
        whenNotPaused 
        validHash(_dataHash)
        returns (uint256) 
    {
        require(bytes(_eventType).length > 0, "Event type cannot be empty");
        require(_timestamp > 0, "Timestamp must be positive");
        require(hashToEventId[_dataHash] == 0, "Hash already exists");

        uint256 eventId = nextEventId++;
        
        auditEvents[eventId] = AuditEvent({
            dataHash: _dataHash,
            eventType: _eventType,
            timestamp: _timestamp,
            blockNumber: block.number,
            submitter: msg.sender,
            metadata: _metadata,
            isActive: true
        });
        
        hashToEventId[_dataHash] = eventId;
        totalEvents++;

        emit AuditEventLogged(eventId, msg.sender, _dataHash, _eventType, _timestamp);
        
        return eventId;
    }

    /**
     * @dev Log batch audit events with Merkle root
     * @param _hashes Array of data hashes
     * @param _merkleRoot Merkle root of all hashes
     * @param _eventType Type of events being audited
     * @param _timestamp Timestamp of the batch
     * @return batchId The ID of the created batch audit event
     */
    function logBatchAuditEvent(
        string[] memory _hashes,
        string memory _merkleRoot,
        string memory _eventType,
        uint256 _timestamp
    ) 
        external 
        onlyAuthorized 
        whenNotPaused 
        validHash(_merkleRoot)
        returns (uint256) 
    {
        require(_hashes.length > 0, "Hashes array cannot be empty");
        require(_hashes.length <= 100, "Batch size too large"); // Limit batch size
        require(bytes(_eventType).length > 0, "Event type cannot be empty");
        require(_timestamp > 0, "Timestamp must be positive");

        uint256 batchId = nextBatchId++;
        
        batchAuditEvents[batchId] = BatchAuditEvent({
            merkleRoot: _merkleRoot,
            eventType: _eventType,
            timestamp: _timestamp,
            blockNumber: block.number,
            submitter: msg.sender,
            itemCount: _hashes.length,
            isActive: true
        });
        
        totalBatches++;

        emit BatchAuditEventLogged(batchId, msg.sender, _merkleRoot, _eventType, _timestamp, _hashes.length);
        
        return batchId;
    }

    /**
     * @dev Get audit event details
     * @param _eventId ID of the audit event
     * @return dataHash Hash of the original data
     * @return eventType Type of event
     * @return timestamp Timestamp of the event
     * @return blockNumber Block number where event was logged
     * @return submitter Address that submitted the event
     */
    function getAuditEvent(uint256 _eventId) 
        external 
        view 
        returns (
            string memory dataHash,
            string memory eventType,
            uint256 timestamp,
            uint256 blockNumber,
            address submitter
        ) 
    {
        require(_eventId > 0 && _eventId < nextEventId, "Invalid event ID");
        
        AuditEvent memory auditEvent = auditEvents[_eventId];
        require(auditEvent.isActive, "Audit event is not active");
        
        return (
            auditEvent.dataHash,
            auditEvent.eventType,
            auditEvent.timestamp,
            auditEvent.blockNumber,
            auditEvent.submitter
        );
    }

    /**
     * @dev Verify if a data hash exists in audit logs
     * @param _dataHash Hash to verify
     * @return exists True if hash exists in audit logs
     */
    function verifyAuditEvent(string memory _dataHash) 
        external 
        view 
        validHash(_dataHash)
        returns (bool exists) 
    {
        uint256 eventId = hashToEventId[_dataHash];
        return eventId > 0 && auditEvents[eventId].isActive;
    }

    /**
     * @dev Get batch audit event details
     * @param _batchId ID of the batch audit event
     * @return merkleRoot Merkle root of the batch
     * @return eventType Type of events in the batch
     * @return timestamp Timestamp of the batch
     * @return blockNumber Block number where batch was logged
     * @return submitter Address that submitted the batch
     * @return itemCount Number of items in the batch
     */
    function getBatchAuditEvent(uint256 _batchId) 
        external 
        view 
        returns (
            string memory merkleRoot,
            string memory eventType,
            uint256 timestamp,
            uint256 blockNumber,
            address submitter,
            uint256 itemCount
        ) 
    {
        require(_batchId > 0 && _batchId < nextBatchId, "Invalid batch ID");
        
        BatchAuditEvent memory batchEvent = batchAuditEvents[_batchId];
        require(batchEvent.isActive, "Batch audit event is not active");
        
        return (
            batchEvent.merkleRoot,
            batchEvent.eventType,
            batchEvent.timestamp,
            batchEvent.blockNumber,
            batchEvent.submitter,
            batchEvent.itemCount
        );
    }

    /**
     * @dev Add authorized submitter
     * @param _submitter Address to authorize
     */
    function addAuthorizedSubmitter(address _submitter) external onlyOwner {
        require(_submitter != address(0), "Invalid submitter address");
        authorizedSubmitters[_submitter] = true;
    }

    /**
     * @dev Remove authorized submitter
     * @param _submitter Address to remove authorization
     */
    function removeAuthorizedSubmitter(address _submitter) external onlyOwner {
        authorizedSubmitters[_submitter] = false;
    }

    /**
     * @dev Pause contract operations
     */
    function pause() external onlyOwner {
        paused = true;
    }

    /**
     * @dev Unpause contract operations
     */
    function unpause() external onlyOwner {
        paused = false;
    }

    /**
     * @dev Transfer ownership (two-step process)
     * @param _newOwner Address of the new owner
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner address");
        pendingOwner = _newOwner;
    }

    /**
     * @dev Accept ownership transfer
     */
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Only pending owner can accept");
        
        address oldOwner = owner;
        owner = pendingOwner;
        pendingOwner = address(0);
        
        // Add new owner as authorized submitter
        authorizedSubmitters[owner] = true;
        
        emit ContractUpgraded(oldOwner, owner, block.timestamp);
    }

    /**
     * @dev Get contract statistics
     * @return _totalEvents Total number of audit events
     * @return _totalBatches Total number of batch events
     * @return _contractBalance Contract balance in wei
     * @return _isPaused Whether contract is paused
     */
    function getContractStats() 
        external 
        view 
        returns (
            uint256 _totalEvents,
            uint256 _totalBatches,
            uint256 _contractBalance,
            bool _isPaused
        ) 
    {
        return (totalEvents, totalBatches, address(this).balance, paused);
    }

    /**
     * @dev Emergency withdrawal (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    // Fallback function to receive Ether
    receive() external payable {}
}
