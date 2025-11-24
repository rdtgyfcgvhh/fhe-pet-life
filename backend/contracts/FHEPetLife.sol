// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title FHE Pet Life - Privacy-preserving pet simulation DApp
/// @author FHEPetLife
/// @notice A pet NFT system with encrypted hunger, happiness, and growth values using FHEVM
contract FHEPetLife is ZamaEthereumConfig, ERC721, ERC721URIStorage, Ownable {
    // Token ID counter
    uint256 private _tokenIdCounter;

    // Pet data structure
    struct PetData {
        euint32 hunger;      // Encrypted hunger value (0-100)
        euint32 happiness;   // Encrypted happiness value (0-100)
        euint32 growth;      // Encrypted growth value
        uint8 level;         // Public level (doesn't need encryption)
        uint256 lastInteraction; // Timestamp of last interaction
    }

    // Mapping from token ID to pet data
    mapping(uint256 => PetData) public pets;

    // Constants for game mechanics
    uint32 private constant INITIAL_HUNGER = 50;
    uint32 private constant INITIAL_HAPPINESS = 50;
    uint32 private constant INITIAL_GROWTH = 0;
    uint32 private constant MAX_VALUE = 100;
    uint32 private constant GROWTH_THRESHOLD = 100; // Growth needed to level up
    uint32 private constant LEVEL_UP_GROWTH_RESET = 0;

    // Events
    event PetCreated(uint256 indexed tokenId, address indexed owner);
    event PetFed(uint256 indexed tokenId);
    event PetPlayed(uint256 indexed tokenId);
    event PetRested(uint256 indexed tokenId);
    event PetLevelUp(uint256 indexed tokenId, uint8 newLevel);
    event PetGrowthUpdated(uint256 indexed tokenId);

    constructor(address initialOwner) ERC721("FHE Pet Life", "FHEPET") Ownable(initialOwner) {
        _tokenIdCounter = 1;
    }

    /// @notice Creates a new pet NFT with encrypted initial values
    /// @param encryptedHunger Initial encrypted hunger value
    /// @param encryptedHappiness Initial encrypted happiness value
    /// @param encryptedGrowth Initial encrypted growth value
    /// @param hungerProof Proof for hunger value
    /// @param happinessProof Proof for happiness value
    /// @param growthProof Proof for growth value
    /// @param _tokenURI Metadata URI for the NFT
    function createPet(
        externalEuint32 encryptedHunger,
        externalEuint32 encryptedHappiness,
        externalEuint32 encryptedGrowth,
        bytes calldata hungerProof,
        bytes calldata happinessProof,
        bytes calldata growthProof,
        string memory _tokenURI
    ) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        // Convert external encrypted values to internal euint32
        euint32 hunger = FHE.fromExternal(encryptedHunger, hungerProof);
        euint32 happiness = FHE.fromExternal(encryptedHappiness, happinessProof);
        euint32 growth = FHE.fromExternal(encryptedGrowth, growthProof);

        // Store pet data
        pets[tokenId] = PetData({
            hunger: hunger,
            happiness: happiness,
            growth: growth,
            level: 1,
            lastInteraction: block.timestamp
        });

        // Allow contract and owner to decrypt
        FHE.allowThis(hunger);
        FHE.allow(hunger, msg.sender);
        FHE.allowThis(happiness);
        FHE.allow(happiness, msg.sender);
        FHE.allowThis(growth);
        FHE.allow(growth, msg.sender);

        // Mint NFT
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        emit PetCreated(tokenId, msg.sender);
        return tokenId;
    }

    /// @notice Feed the pet - decreases hunger
    /// @param tokenId The pet token ID
    /// @param encryptedFoodAmount Encrypted amount of food to feed
    /// @param foodProof Proof for food amount
    function feedPet(
        uint256 tokenId,
        externalEuint32 encryptedFoodAmount,
        bytes calldata foodProof
    ) external {
        require(_ownerOf(tokenId) == msg.sender, "FHEPetLife: not owner");
        require(_ownerOf(tokenId) != address(0), "FHEPetLife: token does not exist");

        PetData storage pet = pets[tokenId];
        euint32 foodAmount = FHE.fromExternal(encryptedFoodAmount, foodProof);

        // Decrease hunger (feed = less hunger)
        pet.hunger = FHE.sub(pet.hunger, foodAmount);

        // Update last interaction
        pet.lastInteraction = block.timestamp;

        // Allow contract and owner to decrypt
        FHE.allowThis(pet.hunger);
        FHE.allow(pet.hunger, msg.sender);

        _updateGrowth(tokenId);

        emit PetFed(tokenId);
    }

    /// @notice Play with the pet - increases happiness
    /// @param tokenId The pet token ID
    /// @param encryptedPlayBonus Encrypted bonus happiness from playing
    /// @param playProof Proof for play bonus
    function playWithPet(
        uint256 tokenId,
        externalEuint32 encryptedPlayBonus,
        bytes calldata playProof
    ) external {
        require(_ownerOf(tokenId) == msg.sender, "FHEPetLife: not owner");
        require(_ownerOf(tokenId) != address(0), "FHEPetLife: token does not exist");

        PetData storage pet = pets[tokenId];
        euint32 playBonus = FHE.fromExternal(encryptedPlayBonus, playProof);

        // Increase happiness
        pet.happiness = FHE.add(pet.happiness, playBonus);

        // Update last interaction
        pet.lastInteraction = block.timestamp;

        // Allow contract and owner to decrypt
        FHE.allowThis(pet.happiness);
        FHE.allow(pet.happiness, msg.sender);

        _updateGrowth(tokenId);

        emit PetPlayed(tokenId);
    }

    /// @notice Rest the pet - increases both hunger and happiness slightly
    /// @param tokenId The pet token ID
    /// @param encryptedRestBonus Encrypted bonus from resting
    /// @param restProof Proof for rest bonus
    function restPet(
        uint256 tokenId,
        externalEuint32 encryptedRestBonus,
        bytes calldata restProof
    ) external {
        require(_ownerOf(tokenId) == msg.sender, "FHEPetLife: not owner");
        require(_ownerOf(tokenId) != address(0), "FHEPetLife: token does not exist");

        PetData storage pet = pets[tokenId];
        euint32 restBonus = FHE.fromExternal(encryptedRestBonus, restProof);

        // Increase both hunger and happiness slightly
        pet.hunger = FHE.add(pet.hunger, restBonus);
        pet.happiness = FHE.add(pet.happiness, restBonus);

        // Update last interaction
        pet.lastInteraction = block.timestamp;

        // Allow contract and owner to decrypt
        FHE.allowThis(pet.hunger);
        FHE.allow(pet.hunger, msg.sender);
        FHE.allowThis(pet.happiness);
        FHE.allow(pet.happiness, msg.sender);

        _updateGrowth(tokenId);

        emit PetRested(tokenId);
    }

    /// @notice Update growth based on hunger and happiness
    /// @dev Growth increases when both hunger and happiness are good
    /// @param tokenId The pet token ID
    function _updateGrowth(uint256 tokenId) internal {
        PetData storage pet = pets[tokenId];

        // Add growth increment (small fixed amount per interaction)
        // In production, you could calculate based on hunger + happiness
        // but division is complex in FHE, so we use a simple increment
        euint32 smallIncrement = FHE.asEuint32(1);
        pet.growth = FHE.add(pet.growth, smallIncrement);

        // Allow contract and owner to decrypt
        FHE.allowThis(pet.growth);
        FHE.allow(pet.growth, msg.sender);

        emit PetGrowthUpdated(tokenId);

        // Check if pet can level up
        _checkLevelUp(tokenId);
    }

    /// @notice Check if pet can level up based on growth threshold
    /// @param tokenId The pet token ID
    function _checkLevelUp(uint256 tokenId) internal {
        PetData storage pet = pets[tokenId];

        // In a production system, you would decrypt growth here to check threshold
        // For now, we'll use a simple mechanism: level up every N interactions
        // This is a simplified version - in production, you'd decrypt and compare
        
        // Simplified: level up every 10 growth updates (this is a placeholder)
        // In production, you would need to decrypt growth to check actual threshold
        // For now, we'll increment level based on a counter or time-based system
        
        // Note: This is a limitation - we can't easily compare encrypted values
        // In production, you might want to use a different approach, such as:
        // 1. Periodic decryption checks
        // 2. Using comparison oracles
        // 3. Client-side level up checks
        
        // For this example, we'll skip automatic level up based on encrypted values
        // and let the client handle it after decryption
    }

    /// @notice Level up the pet (called by owner after verifying growth threshold)
    /// @param tokenId The pet token ID
    function levelUp(uint256 tokenId) external {
        require(_ownerOf(tokenId) == msg.sender, "FHEPetLife: not owner");
        require(_ownerOf(tokenId) != address(0), "FHEPetLife: token does not exist");

        PetData storage pet = pets[tokenId];
        pet.level++;
        
        // Reset growth (or subtract threshold)
        // In production, you'd decrypt, subtract threshold, and re-encrypt
        // For now, we'll keep growth as is
        
        emit PetLevelUp(tokenId, pet.level);
    }

    /// @notice Get encrypted hunger value
    /// @param tokenId The pet token ID
    /// @return The encrypted hunger value
    function getHunger(uint256 tokenId) external view returns (euint32) {
        require(_ownerOf(tokenId) != address(0), "FHEPetLife: token does not exist");
        return pets[tokenId].hunger;
    }

    /// @notice Get encrypted happiness value
    /// @param tokenId The pet token ID
    /// @return The encrypted happiness value
    function getHappiness(uint256 tokenId) external view returns (euint32) {
        require(_ownerOf(tokenId) != address(0), "FHEPetLife: token does not exist");
        return pets[tokenId].happiness;
    }

    /// @notice Get encrypted growth value
    /// @param tokenId The pet token ID
    /// @return The encrypted growth value
    function getGrowth(uint256 tokenId) external view returns (euint32) {
        require(_ownerOf(tokenId) != address(0), "FHEPetLife: token does not exist");
        return pets[tokenId].growth;
    }

    /// @notice Get public pet info (level, last interaction)
    /// @param tokenId The pet token ID
    /// @return level The pet level
    /// @return lastInteraction Timestamp of last interaction
    function getPetInfo(uint256 tokenId) external view returns (uint8 level, uint256 lastInteraction) {
        require(_ownerOf(tokenId) != address(0), "FHEPetLife: token does not exist");
        PetData storage pet = pets[tokenId];
        return (pet.level, pet.lastInteraction);
    }


    // Override required by Solidity
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

