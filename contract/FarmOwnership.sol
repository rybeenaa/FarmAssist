// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title FarmOwnership
 * @author Your Name
 * @notice A standalone ERC721 contract to manage farm ownership as transferable NFTs.
 *
 * Each farm profile is represented by a unique NFT. The owner of the NFT is the
 * owner of the farm record. Ownership can be transferred using standard ERC721
 * transfer functions, which include all necessary verification and event logging.
 */
contract FarmOwnership is ERC721, Ownable {
    using Counters for Counters.Counter;

    // Counter to keep track of the next token ID to be minted.
    Counters.Counter private _nextTokenId;

    // Mapping from a token ID to the URI containing the farm's metadata (e.g., IPFS hash).
    mapping(uint256 => string) private _farmDetailsURI;

    // Event emitted when a new farm profile is registered and minted.
    event FarmRegistered(
        address indexed owner,
        uint256 indexed tokenId
    );

    /**
     * @notice Initializes the contract, setting the NFT collection's name and symbol.
     */
    constructor() ERC721("Farm Profile", "FARM") Ownable(msg.sender) {}

    /**
     * @notice Allows a farmer to register a new farm, minting an ownership NFT.
     * @param _farmer The address of the farmer who will own the new farm profile.
     * @param _metadataURI A URI pointing to the farm's detailed metadata (e.g., an IPFS CID).
     * @return The ID of the newly created token.
     */
    function registerFarm(
        address _farmer,
        string calldata _metadataURI
    ) external onlyOwner returns (uint256) {
        _nextTokenId.increment();
        uint256 newTokenId = _nextTokenId.current();

        _safeMint(_farmer, newTokenId);
        _setFarmDetailsURI(newTokenId, _metadataURI);

        emit FarmRegistered(_farmer, newTokenId);
        return newTokenId;
    }

    /**
     * @notice Allows the contract owner to update the metadata URI for a farm.
     * @param _tokenId The ID of the token to update.
     * @param _metadataURI The new URI for the farm's metadata.
     */
    function updateFarmDetails(
        uint256 _tokenId,
        string calldata _metadataURI
    ) external onlyOwner {
        require(_exists(_tokenId), "Farm profile with this ID does not exist.");
        _setFarmDetailsURI(_tokenId, _metadataURI);
    }

    /**
     * @notice Overrides the default ERC721 tokenURI function to return farm-specific metadata.
     * @param _tokenId The ID of the token.
     * @return The metadata URI string.
     */
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_exists(_tokenId), "ERC721: URI query for nonexistent token");
        return _farmDetailsURI[_tokenId];
    }

    /**
     * @dev Internal function to set the metadata URI for a given token ID.
     */
    function _setFarmDetailsURI(uint256 _tokenId, string memory _metadataURI) internal {
        _farmDetailsURI[_tokenId] = _metadataURI;
    }
}