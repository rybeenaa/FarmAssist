// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SeasonalActivityLog
 * @author Your Name
 * @notice A standalone contract for farmers to log seasonal agricultural activities.
 *
 * This contract allows any address to create an immutable, on-chain record of their
 * activities like planting, fertilization, and harvesting. To save on gas, a hash
 * of the detailed notes is stored on-chain rather than the full text.
 */
contract SeasonalActivityLog {

    // Enum to define the types of activities that can be logged.
    enum ActivityType {
        Planting,
        Fertilization,
        PestControl,
        Irrigation,
        Harvesting,
        Other
    }

    // Struct to store the details of a single logged activity.
    struct Activity {
        ActivityType activityType;
        uint256 date;
        string notesHash; // A hash (e.g., IPFS CID or SHA-256) of detailed notes.
        address farmer;
    }

    // Mapping from a farmer's address to an array of their logged activities.
    mapping(address => Activity[]) public farmerActivities;

    // Event to be emitted when a new activity is successfully logged.
    event ActivityLogged(
        address indexed farmer,
        uint256 activityIndex,
        ActivityType activityType,
        uint256 date
    );

    /**
     * @notice Logs a new seasonal activity for the calling address.
     * @param _activityType The type of activity being logged.
     * @param _notesHash A hash representing the detailed notes or summary of the activity.
     */
    function logActivity(
        ActivityType _activityType,
        string calldata _notesHash
    ) external {
        uint256 activityIndex = farmerActivities[msg.sender].length;

        farmerActivities[msg.sender].push(Activity({
            activityType: _activityType,
            date: block.timestamp,
            notesHash: _notesHash,
            farmer: msg.sender
        }));

        emit ActivityLogged(
            msg.sender,
            activityIndex,
            _activityType,
            block.timestamp
        );
    }

    /**
     * @notice Retrieves all logged activities for a specific farmer.
     * @param _farmer The address of the farmer whose activities are to be retrieved.
     * @return An array of Activity structs.
     */
    function getActivities(address _farmer) external view returns (Activity[] memory) {
        return farmerActivities[_farmer];
    }

    /**
     * @notice Gets the total number of activities logged by a specific farmer.
     * @param _farmer The address of the farmer.
     * @return The total count of activities.
     */
    function getActivityCount(address _farmer) external view returns (uint256) {
        return farmerActivities[_farmer].length;
    }
}