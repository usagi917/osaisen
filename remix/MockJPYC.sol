// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockJPYC
/// @notice Test JPYC token for Amoy testnet
contract MockJPYC is ERC20 {
    constructor() ERC20("Test JPYC", "tJPYC") {
        // Mint 1,000,000 JPYC to deployer for testing
        _mint(msg.sender, 1_000_000 * 10**18);
    }

    /// @notice Anyone can mint tokens for testing
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
