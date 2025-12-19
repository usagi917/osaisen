// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title OfferingsNFT1155
/// @notice ERC-1155 NFT for monthly offerings. tokenId is expected to be YYYYMM (e.g. 202601).
contract OfferingsNFT1155 is ERC1155, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    string public name = "Shirayama Hime Tokens";
    string public symbol = "SHHT";

    constructor(string memory baseUri) ERC1155(baseUri) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(address to, uint256 tokenId, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, tokenId, amount, "");
    }

    function setURI(string memory newuri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setURI(newuri);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
