
pragma solidity ^0.8.20;

/**
 * @title ProductTraceability
 * @dev A smart contract to track products at the batch level through the supply chain.
 * It logs the origin, creation date, and various checkpoints for each batch.
 */
contract ProductTraceability {


    struct Batch {
        uint256 id;
        string productName;
        string origin; // e.g., "Kaduna Farms Cooperative"
        uint256 manufactureDate;
        address currentOwner; // The address currently responsible for the batch
    }


    struct Checkpoint {
        string location;
        string status;  
        address recordedBy;
        uint256 timestamp;
    }





    uint256 private _nextBatchId;
    

    mapping(uint256 => Batch) public batches;


    mapping(uint256 => Checkpoint[]) public checkpoints;





    event BatchCreated(
        uint256 indexed batchId,
        string productName,
        string origin,
        address indexed initialOwner
    );

    event CheckpointAdded(
        uint256 indexed batchId,
        string location,
        string status,
        address indexed recordedBy
    );

    event BatchTransferred(
        uint256 indexed batchId,
        address indexed from,
        address indexed to
    );

    constructor() {
        _nextBatchId = 1;
    }


    /**
     * @dev Creates a new batch of a product.
     * The creator (`msg.sender`) becomes the initial owner.
     * @param _productName The name of the product (e.g., "SuperGro Fertilizer").
     * @param _origin A description of where the product batch originated.
     */
    function createBatch(string calldata _productName, string calldata _origin) external {
        uint256 batchId = _nextBatchId;
        
        batches[batchId] = Batch({
            id: batchId,
            productName: _productName,
            origin: _origin,
            manufactureDate: block.timestamp,
            currentOwner: msg.sender
        });

        _nextBatchId++;

        emit BatchCreated(batchId, _productName, _origin, msg.sender);
    }

    /**
     * @dev Adds a new supply chain checkpoint for an existing batch.
     * Only the current owner of the batch can add a checkpoint.
     * @param _batchId The ID of the batch to update.
     * @param _location The geographical or logical location of the checkpoint.
     * @param _status The status update at this checkpoint.
     */
    function addCheckpoint(uint256 _batchId, string calldata _location, string calldata _status) external {
        require(batches[_batchId].id != 0, "Batch does not exist.");
        require(batches[_batchId].currentOwner == msg.sender, "Only the current batch owner can add checkpoints.");

        Checkpoint memory newCheckpoint = Checkpoint({
            location: _location,
            status: _status,
            recordedBy: msg.sender,
            timestamp: block.timestamp
        });

        checkpoints[_batchId].push(newCheckpoint);

        emit CheckpointAdded(_batchId, _location, _status, msg.sender);
    }

    /**
     * @dev Transfers ownership of a batch to a new address (e.g., from supplier to distributor).
     * @param _batchId The ID of the batch to transfer.
     * @param _to The address of the new owner.
     */
    function transferBatch(uint256 _batchId, address _to) external {
        require(batches[_batchId].id != 0, "Batch does not exist.");
        require(_to != address(0), "Cannot transfer to the zero address.");
        require(batches[_batchId].currentOwner == msg.sender, "Only the current batch owner can initiate a transfer.");

        address from = batches[_batchId].currentOwner;
        batches[_batchId].currentOwner = _to;

        emit BatchTransferred(_batchId, from, _to);
    }


    /**
     * @dev Retrieves all checkpoint records for a given batch.
     * @param _batchId The ID of the batch.
     * @return An array of Checkpoint structs.
     */
    function getBatchCheckpoints(uint256 _batchId) external view returns (Checkpoint[] memory) {
        return checkpoints[_batchId];
    }
}