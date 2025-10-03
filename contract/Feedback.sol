// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Feedback
 * @author Your Name
 * @notice A standalone smart contract for collecting user feedback and ratings for suppliers.
 *
 * This contract allows users to submit a star rating (1-5) and a content hash
 * for a review of a specific product from a specific supplier. All reviews are
 * stored on-chain, creating a transparent and censorship-resistant reputation system.
 */
contract Feedback {

    // Struct to hold all the information for a single review.
    struct Review {
        uint256 id;
        address reviewer;
        address supplier;
        string productId;
        uint8 rating; // 1 to 5 stars
        bytes32 contentHash; // A SHA-256 hash of the off-chain review text
        uint256 timestamp;
    }

    // A counter to ensure each review has a unique ID.
    uint256 private _nextReviewId;

    // An array to store all reviews submitted to the contract.
    Review[] public allReviews;

    // Mapping from a supplier's address to the IDs of all reviews they have received.
    mapping(address => uint256[]) public reviewsBySupplier;

    /**
     * @dev Emitted when a new review is successfully submitted.
     * @param reviewId The unique ID of the new review.
     * @param reviewer The address of the user who submitted the review.
     * @param supplier The address of the supplier being reviewed.
     * @param productId The ID of the product being reviewed.
     * @param rating The star rating given (1-5).
     */
    event ReviewSubmitted(
        uint256 indexed reviewId,
        address indexed reviewer,
        address indexed supplier,
        string productId,
        uint8 rating
    );

    /**
     * @notice Submits a new review for a supplier's product.
     * @param _supplier The address of the supplier being reviewed.
     * @param _productId A unique identifier for the product.
     * @param _rating The star rating from 1 to 5.
     * @param _contentHash A bytes32 hash (e.g., SHA-256) of the detailed review content,
     * which is stored off-chain (e.g., on IPFS or a database).
     */
    function submitReview(
        address _supplier,
        string calldata _productId,
        uint8 _rating,
        bytes32 _contentHash
    ) external {
        require(_rating >= 1 && _rating <= 5, "Feedback: Rating must be between 1 and 5");
        require(_supplier != address(0), "Feedback: Supplier address cannot be the zero address");

        uint256 reviewId = _nextReviewId;

        // Create and store the new review
        allReviews.push(Review({
            id: reviewId,
            reviewer: msg.sender,
            supplier: _supplier,
            productId: _productId,
            rating: _rating,
            contentHash: _contentHash,
            timestamp: block.timestamp
        }));

        // Add the review ID to the supplier's list of reviews
        reviewsBySupplier[_supplier].push(reviewId);

        emit ReviewSubmitted(reviewId, msg.sender, _supplier, _productId, _rating);

        _nextReviewId++;
    }

    /**
     * @notice Gets the total number of reviews submitted to the contract.
     * @return The total count of all reviews.
     */
    function getTotalReviewCount() external view returns (uint256) {
        return allReviews.length;
    }

    /**
     * @notice Gets the IDs of all reviews for a specific supplier.
     * @param _supplier The address of the supplier.
     * @return An array of review IDs.
     */
    function getReviewIdsForSupplier(address _supplier) external view returns (uint256[] memory) {
        return reviewsBySupplier[_supplier];
    }
}