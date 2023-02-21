//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract CubesNFT is ERC721A, Ownable {
    uint256 public PUBLIC_SALE_TIME;
    uint256 public PUBLIC_SALE_PRICE;
    bytes32 public WHITELIST_ROOT;
    string BASE_URI;
    mapping(address => bool) whitelistClaimed;

    constructor(bytes32 initialWhitelist, string memory baseURI) ERC721A("CubesNFT", "CUBES") {
        PUBLIC_SALE_TIME = block.timestamp + 60;
        PUBLIC_SALE_PRICE = 6e15;
        WHITELIST_ROOT = initialWhitelist;
        BASE_URI = baseURI;
    }

    function setPublicSaleTime(uint256 newTime) external onlyOwner {
        PUBLIC_SALE_TIME = newTime;
    }

    function setPublicSalePrice(uint256 newPrice) external onlyOwner {
        PUBLIC_SALE_PRICE = newPrice;
    }

    function setWhitelistRoot(bytes32 newRoot) external onlyOwner {
        WHITELIST_ROOT = newRoot;
    }

    function setBaseURI(string memory newURI) external onlyOwner {
        BASE_URI = newURI;
    }

    function mint(uint256 quantity, bytes32[] memory myProof) external payable {
        uint256 unitPrice = PUBLIC_SALE_PRICE;
        if (WHITELIST_ROOT != "" && PUBLIC_SALE_TIME > block.timestamp) {
            require(
                !whitelistClaimed[_msgSender()],
                "Whitelist already claimed!"
            );
            require(
                MerkleProof.verify(
                    myProof,
                    WHITELIST_ROOT,
                    keccak256(abi.encodePacked(_msgSender()))
                ),
                "Wallet not whitelisted"
            );
            whitelistClaimed[_msgSender()] = true;
            unitPrice = 0;
        }
        require(
            msg.value >= quantity * unitPrice,
            "Insufficient price to purchase"
        );
        _safeMint(_msgSender(), quantity);
        payable(owner()).transfer(msg.value);
    }

    function _baseURI() internal view override returns (string memory) {
        return BASE_URI;
    }
}
