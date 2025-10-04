// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReferralProgram
 * @dev Manages a referral system where users are rewarded with ERC20 tokens for
 * bringing new farmers to the FarmAssist platform.
 * This contract must be funded with the reward token to function.
 */
contract ReferralProgram is Ownable {

    IERC20 public rewardToken;
    uint256 public referralRewardAmount;
    uint256 public totalReferrals;

    
    
    mapping(address => bool) public hasBeenReferred;

    
    
    mapping(address => address[]) public referralsBy;

    
    
    

    event UserReferred(
        address indexed referrer,
        address indexed referred,
        uint256 timestamp
    );

    event RewardPaid(
        address indexed referrer,
        uint256 amount
    );

    
    
    

    /**
     * @param _rewardTokenAddress The address of the ERC20 token to be used for rewards.
     * @param _rewardAmount The amount of tokens to be paid for each successful referral.
     */
    constructor(address _rewardTokenAddress, uint256 _rewardAmount) Ownable(msg.sender) {
        require(_rewardTokenAddress != address(0), "Reward token cannot be the zero address.");
        rewardToken = IERC20(_rewardTokenAddress);
        referralRewardAmount = _rewardAmount;
    }

    
    
    

    /**
     * @dev Registers a referral. Called by the NEW user, specifying who referred them.
     * @param _referrer The wallet address of the user who referred the caller.
     */
    function registerReferral(address _referrer) external {
        address referred = msg.sender;

        
        require(_referrer != address(0), "Referrer cannot be the zero address.");
        require(referred != _referrer, "You cannot refer yourself.");
        require(!hasBeenReferred[referred], "This wallet has already been referred.");
        require(rewardToken.balanceOf(address(this)) >= referralRewardAmount, "Contract has insufficient funds for reward.");
        
        
        hasBeenReferred[referred] = true;
        referralsBy[_referrer].push(referred);
        totalReferrals++;

        
        bool sent = rewardToken.transfer(_referrer, referralRewardAmount);
        require(sent, "Reward transfer failed.");

        
        emit UserReferred(_referrer, referred, block.timestamp);
        emit RewardPaid(_referrer, referralRewardAmount);
    }

    
    
    

    /**
     * @dev Allows the owner to update the reward amount.
     * @param _newAmount The new reward amount.
     */
    function setRewardAmount(uint256 _newAmount) external onlyOwner {
        referralRewardAmount = _newAmount;
    }
    
    /**
     * @dev Allows the owner to withdraw any remaining reward tokens from the contract.
     * Useful if the program ends or the reward token is changed.
     */
    function withdrawRemainingTokens() external onlyOwner {
        uint256 balance = rewardToken.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw.");
        bool sent = rewardToken.transfer(owner(), balance);
        require(sent, "Token withdrawal failed.");
    }
    
    
    
    

    /**
     * @dev Gets the list of all addresses referred by a specific user.
     * @param _user The address of the referrer.
     * @return An array of referred addresses.
     */
    function getReferralsFor(address _user) external view returns (address[] memory) {
        return referralsBy[_user];
    }
}