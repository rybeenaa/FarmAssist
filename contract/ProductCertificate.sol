// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ProductCertificate
 * @author FarmAssist
 * @notice Standalone ERC-721 contract for minting NFT-based product batch certificates.
 *
 * Each certificate NFT represents a single product batch supplied by a specific supplier.
 * The NFT stores immutable hashes for the batch's certification document and quality
 * report, allowing lightweight on-chain verification while keeping large documents
 * off-chain (e.g., IPFS, Arweave). A metadata URI can be provided for rich presentation.
 *
 * Key design goals:
 * - Standalone and modular: no external dependencies beyond OpenZeppelin.
 * - Immutable certification data: cryptographic hashes cannot be changed after mint.
 * - Owner-gated minting by default, enabling platform-controlled issuance.
 */
contract ProductCertificate is ERC721, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _nextTokenId;

    struct Certificate {
        address supplier;
        string batchId; // Arbitrary supplier/batch reference (could be UUID, lot number, etc.)
        bytes32 certificationHash; // Hash of the certification document
        bytes32 qualityReportHash; // Hash of the quality report
        uint256 issuedAt; // Block timestamp when minted
    }

    // tokenId => certificate data
    mapping(uint256 => Certificate) private _certificates;

    // tokenId => metadata URI (e.g., IPFS CID pointing to metadata JSON)
    mapping(uint256 => string) private _tokenURIs;

    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed supplier,
        string batchId,
        bytes32 certificationHash,
        bytes32 qualityReportHash
    );

    /**
     * @notice Initialize collection name and symbol.
     */
    constructor() ERC721("Product Certificate", "CERT") Ownable(msg.sender) {}

    /**
     * @notice Mint a new product batch certificate as an NFT.
     * @dev Hash parameters must be precomputed off-chain (e.g., keccak256/sha256 of content bytes).
     * @param supplier The supplier address associated with this product batch.
     * @param batchId Human-readable batch identifier (lot number, UUID, etc.).
     * @param certificationHash Hash of the batch's certification document.
     * @param qualityReportHash Hash of the batch's quality report.
     * @param metadataURI Optional metadata URI (e.g., IPFS CID for ERC721 metadata JSON).
     * @return tokenId The id of the newly minted certificate NFT.
     */
    function mintCertificate(
        address supplier,
        string calldata batchId,
        bytes32 certificationHash,
        bytes32 qualityReportHash,
        string calldata metadataURI
    ) external onlyOwner returns (uint256 tokenId) {
        require(supplier != address(0), "Invalid supplier");
        require(certificationHash != bytes32(0), "Empty certification hash");
        require(qualityReportHash != bytes32(0), "Empty quality report hash");

        _nextTokenId.increment();
        tokenId = _nextTokenId.current();

        _safeMint(supplier, tokenId);

        _certificates[tokenId] = Certificate({
            supplier: supplier,
            batchId: batchId,
            certificationHash: certificationHash,
            qualityReportHash: qualityReportHash,
            issuedAt: block.timestamp
        });

        if (bytes(metadataURI).length > 0) {
            _tokenURIs[tokenId] = metadataURI;
        }

        emit CertificateMinted(tokenId, supplier, batchId, certificationHash, qualityReportHash);
    }

    /**
     * @notice Verify that provided hashes match the immutable values stored for a token.
     * @param tokenId The certificate token id.
     * @param certificationHash The certification document hash to compare.
     * @param qualityReportHash The quality report hash to compare.
     * @return isValid True if both hashes match the stored certificate hashes.
     */
    function verifyCertificate(
        uint256 tokenId,
        bytes32 certificationHash,
        bytes32 qualityReportHash
    ) external view returns (bool isValid) {
        require(_exists(tokenId), "Nonexistent token");
        Certificate storage cert = _certificates[tokenId];
        return cert.certificationHash == certificationHash && cert.qualityReportHash == qualityReportHash;
    }

    /**
     * @notice Get immutable certificate data for a token.
     */
    function getCertificate(uint256 tokenId) external view returns (
        address supplier,
        string memory batchId,
        bytes32 certificationHash,
        bytes32 qualityReportHash,
        uint256 issuedAt
    ) {
        require(_exists(tokenId), "Nonexistent token");
        Certificate storage cert = _certificates[tokenId];
        return (cert.supplier, cert.batchId, cert.certificationHash, cert.qualityReportHash, cert.issuedAt);
    }

    /**
     * @notice Update the metadata URI for a token. Hashes remain immutable.
     * @dev Restricted to contract owner to preserve curation integrity of presented metadata.
     */
    function setTokenURI(uint256 tokenId, string calldata newURI) external onlyOwner {
        require(_exists(tokenId), "Nonexistent token");
        _tokenURIs[tokenId] = newURI;
    }

    /**
     * @notice Returns the token metadata URI if set; empty string otherwise.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }
}


