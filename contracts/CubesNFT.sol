//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CubesNFT is ERC721A, Ownable {
    uint256 public PUBLIC_SALE_TIME;
    uint256 public PUBLIC_SALE_PRICE;
    string BASE_URI;
    mapping(address => bool) presaleClaimed;

    constructor(string memory baseURI) ERC721A("CubesNFT", "CUBES") {
        PUBLIC_SALE_TIME = block.timestamp + 3600;
        PUBLIC_SALE_PRICE = 6e15;
        BASE_URI = baseURI;
    }

    function setPublicSaleTime(uint256 newTime) external onlyOwner {
        PUBLIC_SALE_TIME = newTime;
    }

    function setPublicSalePrice(uint256 newPrice) external onlyOwner {
        PUBLIC_SALE_PRICE = newPrice;
    }

    function setBaseURI(string memory newURI) external onlyOwner {
        BASE_URI = newURI;
    }

    function mint(uint256 quantity) external payable {
        uint256 unitPrice = PUBLIC_SALE_PRICE;
        if (PUBLIC_SALE_TIME > block.timestamp) {
            require(
                !presaleClaimed[_msgSender()],
                "Presale already claimed!"
            );
            require(totalSupply() < 1000, "Free mint limit reached");
            presaleClaimed[_msgSender()] = true;
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
