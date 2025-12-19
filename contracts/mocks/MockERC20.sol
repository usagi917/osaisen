// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockERC20
/// @notice A mock ERC20 token for testing purposes
/// @dev Allows configurable decimals and public minting
contract MockERC20 is ERC20 {
    uint8 private immutable _decimals;

    /// @notice Creates a new MockERC20 token
    /// @param name_ The name of the token
    /// @param symbol_ The symbol of the token
    /// @param decimals_ The number of decimals (e.g., 18 for standard, 6 for USDC-like)
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) ERC20(name_, symbol_) {
        _decimals = decimals_;
    }

    /// @notice Returns the number of decimals
    /// @return The number of decimals
    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /// @notice Mints tokens to an address (for testing)
    /// @param to The address to mint tokens to
    /// @param amount The amount of tokens to mint
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
