// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FarmerRegistry
 * @author FarmAssist
 * @notice Standalone on-chain registry for farmers with name, region, and farm ID.
 *
 * The caller of registration becomes the immutable owner of that registry entry.
 * No external contract dependencies. Includes basic update and lookup utilities.
 */
contract FarmerRegistry {
    struct Farmer {
        address owner;
        string name;
        string region;
        string farmId; // Human-friendly identifier provided by the farmer or platform
        uint256 registeredAt;
        bool exists;
    }

    // Primary index: farmer wallet => Farmer
    mapping(address => Farmer) private _farmers;

    // Secondary index for convenient lookup: farmId => farmer wallet
    mapping(string => address) private _farmIdToOwner;

    event FarmerRegistered(address indexed owner, string name, string region, string farmId);
    event FarmerUpdated(address indexed owner, string name, string region);

    /**
     * @notice Register the caller as a farmer with name, region, and farm ID.
     * @dev The caller becomes the owner of this record. Each address may register once.
     *      The provided farmId must be unique among registered farmers (non-empty and unused).
     * @param name Human-readable name.
     * @param region Geographical region.
     * @param farmId Unique farm identifier.
     */
    function registerFarmer(
        string calldata name,
        string calldata region,
        string calldata farmId
    ) external {
        require(!_farmers[msg.sender].exists, "Already registered");
        require(bytes(farmId).length != 0, "Empty farmId");
        require(_farmIdToOwner[farmId] == address(0), "farmId taken");

        _farmers[msg.sender] = Farmer({
            owner: msg.sender,
            name: name,
            region: region,
            farmId: farmId,
            registeredAt: block.timestamp,
            exists: true
        });

        _farmIdToOwner[farmId] = msg.sender;

        emit FarmerRegistered(msg.sender, name, region, farmId);
    }

    /**
     * @notice Update name and region for the caller's farmer profile.
     * @param name New display name.
     * @param region New region.
     */
    function updateFarmer(
        string calldata name,
        string calldata region
    ) external {
        require(_farmers[msg.sender].exists, "Not registered");
        Farmer storage f = _farmers[msg.sender];
        f.name = name;
        f.region = region;
        emit FarmerUpdated(msg.sender, name, region);
    }

    /**
     * @notice Read the farmer profile for a given owner address.
     * @param owner The farmer wallet address.
     */
    function getFarmer(address owner) external view returns (
        address farmerOwner,
        string memory name,
        string memory region,
        string memory farmId,
        uint256 registeredAt,
        bool exists
    ) {
        Farmer storage f = _farmers[owner];
        return (f.owner, f.name, f.region, f.farmId, f.registeredAt, f.exists);
    }

    /**
     * @notice Lookup owner by farmId.
     * @param farmId The unique farm identifier used during registration.
     * @return owner The wallet that owns the registry entry or address(0) if none.
     */
    function getOwnerByFarmId(string calldata farmId) external view returns (address owner) {
        return _farmIdToOwner[farmId];
    }

    /**
     * @notice Returns true if the given address has a registered farmer profile.
     */
    function isRegistered(address owner) external view returns (bool) {
        return _farmers[owner].exists;
    }
}


