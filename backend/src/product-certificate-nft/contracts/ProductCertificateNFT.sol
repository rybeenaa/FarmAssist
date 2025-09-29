// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/token/ERC721/ERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/utils/Strings.sol";

contract ProductCertificateNFT is ERC721, Ownable {
    using Strings for uint256;

    struct Certificate {
        string certificateHash;
        string batchId;
        address issuer;
        uint256 timestamp;
    }

    uint256 private _nextTokenId = 1;
    mapping(uint256 => Certificate) private _certificates;
    mapping(uint256 => string) private _tokenURIs;

    event CertificateMinted(uint256 indexed tokenId, address indexed to, string certificateHash, string batchId);

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) Ownable(msg.sender) {}

    function mintCertificate(
        address to,
        string memory certificateHash,
        string memory batchId,
        string memory metadataURI
    ) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _certificates[tokenId] = Certificate({
            certificateHash: certificateHash,
            batchId: batchId,
            issuer: msg.sender,
            timestamp: block.timestamp
        });
        if (bytes(metadataURI).length > 0) {
            _tokenURIs[tokenId] = metadataURI;
        }
        emit CertificateMinted(tokenId, to, certificateHash, batchId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        string memory stored = _tokenURIs[tokenId];
        if (bytes(stored).length > 0) {
            return stored;
        }
        return string(abi.encodePacked("data:application/json;utf8,",
            '{"name":"Product Certificate #', tokenId.toString(),
            '","description":"NFT representing a product batch certificate.",',
            '"attributes":[]}'
        ));
    }

    function getCertificate(uint256 tokenId) external view returns (
        string memory certificateHash,
        string memory batchId,
        address issuer,
        uint256 timestamp
    ) {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        Certificate memory c = _certificates[tokenId];
        return (c.certificateHash, c.batchId, c.issuer, c.timestamp);
    }
}


