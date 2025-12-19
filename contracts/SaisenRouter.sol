// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {DateTimeUTC} from "./lib/DateTimeUTC.sol";

/// @title IOfferingsNFT1155
/// @notice Interface for the Offerings NFT contract
interface IOfferingsNFT1155 {
    function mint(address to, uint256 tokenId, uint256 amount) external;
}

/// @title SaisenRouter
/// @notice Router contract for handling JPYC offerings (saisen) and minting monthly NFTs
/// @dev Users can send JPYC as offerings. First offering of each month earns an NFT.
contract SaisenRouter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice The JPYC token contract
    IERC20 public immutable jpyc;

    /// @notice The NFT contract for offerings
    IOfferingsNFT1155 public immutable nft;

    /// @notice The treasury address that receives offerings
    address public immutable treasury;

    /// @notice Minimum amount required for an offering
    uint256 public immutable minSaisen;

    /// @notice Tracks the last month ID when a user minted an NFT
    /// @dev monthId format: YYYYMM (e.g., 202601)
    mapping(address => uint256) public lastMintMonthId;

    /// @notice Emitted when a user makes an offering
    /// @param user The address of the user
    /// @param amount The amount of JPYC offered
    /// @param monthId The month ID (YYYYMM)
    /// @param minted Whether an NFT was minted
    event Saisen(address indexed user, uint256 amount, uint256 monthId, bool minted);

    /// @notice Error thrown when a zero address is provided
    error ZeroAddress();

    /// @notice Error thrown when the offering amount is below minimum
    error AmountBelowMinimum();

    /// @notice Creates a new SaisenRouter
    /// @param _jpyc The JPYC token address
    /// @param _nft The NFT contract address
    /// @param _treasury The treasury address
    /// @param _minSaisen The minimum offering amount
    constructor(
        address _jpyc,
        address _nft,
        address _treasury,
        uint256 _minSaisen
    ) {
        if (_jpyc == address(0)) revert ZeroAddress();
        if (_nft == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();

        jpyc = IERC20(_jpyc);
        nft = IOfferingsNFT1155(_nft);
        treasury = _treasury;
        minSaisen = _minSaisen;
    }

    /// @notice Make an offering (saisen) with JPYC
    /// @dev Transfers JPYC to treasury. Mints NFT if first offering of the month.
    /// @param amount The amount of JPYC to offer
    function saisen(uint256 amount) external nonReentrant {
        if (amount < minSaisen) revert AmountBelowMinimum();

        // Get current month ID
        uint256 monthId = getCurrentMonthId();

        // Transfer JPYC to treasury (always happens)
        jpyc.safeTransferFrom(msg.sender, treasury, amount);

        // Check if eligible for NFT mint (first time this month)
        bool minted = false;
        if (lastMintMonthId[msg.sender] < monthId) {
            lastMintMonthId[msg.sender] = monthId;
            nft.mint(msg.sender, monthId, 1);
            minted = true;
        }

        emit Saisen(msg.sender, amount, monthId, minted);
    }

    /// @notice Get the current month ID based on block.timestamp
    /// @return monthId The month ID in format YYYYMM (e.g., 202601)
    function getCurrentMonthId() public view returns (uint256) {
        return DateTimeUTC.getCurrentMonthId();
    }

    /// @notice Check if a user is eligible to mint an NFT this month
    /// @param user The address to check
    /// @return eligible True if the user hasn't minted this month
    function isEligibleForMint(address user) external view returns (bool) {
        return lastMintMonthId[user] < getCurrentMonthId();
    }
}
