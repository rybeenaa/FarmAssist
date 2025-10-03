// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RewardPoints
 * @author Your Name
 * @notice A standalone contract to manage an on-chain loyalty points system for farmers.
 *
 * This contract allows a central authority (the owner) to award points to users
 * for actions like frequent or bulk purchases. Users can check their balance
 * and redeem these points.
 */
contract RewardPoints is Ownable {

    // Mapping from a user's address to their points balance.
    mapping(address => uint256) public points;

    /**
     * @dev Emitted when points are awarded to a user.
     * @param user The address of the user receiving points.
     * @param amount The number of points awarded.
     */
    event PointsAwarded(address indexed user, uint256 amount);

    /**
     * @dev Emitted when a user successfully redeems points.
     * @param user The address of the user redeeming points.
     * @param amount The number of points redeemed.
     */
    event PointsRedeemed(address indexed user, uint256 amount);

    /**
     * @notice Initializes the contract, setting the deployer as the owner.
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @notice Allows the owner to award points to a specific user.
     * @dev This function should be called by the system after a qualifying purchase.
     * @param _user The address of the user to receive points.
     * @param _amount The number of points to award.
     */
    function awardPoints(address _user, uint256 _amount) external onlyOwner {
        require(_user != address(0), "RewardPoints: Cannot award to the zero address");
        require(_amount > 0, "RewardPoints: Amount must be greater than zero");

        points[_user] += _amount;
        emit PointsAwarded(_user, _amount);
    }

    /**
     * @notice Allows a user to redeem a specific amount of their points.
     * @dev This function only deducts points and emits an event. An off-chain
     * system or another contract should listen for this event to deliver the actual reward.
     * @param _amount The number of points the user wishes to redeem.
     */
    function redeemPoints(uint256 _amount) external {
        require(_amount > 0, "RewardPoints: Amount must be greater than zero");
        require(points[msg.sender] >= _amount, "RewardPoints: Insufficient points balance");

        points[msg.sender] -= _amount;
        emit PointsRedeemed(msg.sender, _amount);
    }

    /**
     * @notice A view function to get the current points balance of a user.
     * @param _user The address of the user.
     * @return The user's current points balance.
     */
    function getBalance(address _user) external view returns (uint256) {
        return points[_user];
    }
}