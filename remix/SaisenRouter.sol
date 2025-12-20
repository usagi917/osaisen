// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {DateTimeUTC} from "./DateTimeUTC.sol";

interface IOfferingsNFT1155 {
    function mint(address to, uint256 tokenId, uint256 amount) external;
}

contract SaisenRouter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable jpyc;
    IOfferingsNFT1155 public immutable nft;
    address public immutable treasury;
    uint256 public immutable minSaisen;

    mapping(address => uint256) public lastMintMonthId;

    event Saisen(address indexed user, uint256 amount, uint256 monthId, bool minted);

    error ZeroAddress();
    error AmountBelowMinimum();

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

    function saisen(uint256 amount) external nonReentrant {
        if (amount < minSaisen) revert AmountBelowMinimum();

        uint256 monthId = getCurrentMonthId();
        jpyc.safeTransferFrom(msg.sender, treasury, amount);

        bool minted = false;
        if (lastMintMonthId[msg.sender] < monthId) {
            lastMintMonthId[msg.sender] = monthId;
            nft.mint(msg.sender, monthId, 1);
            minted = true;
        }

        emit Saisen(msg.sender, amount, monthId, minted);
    }

    function getCurrentMonthId() public view returns (uint256) {
        return DateTimeUTC.getCurrentMonthId();
    }

    function isEligibleForMint(address user) external view returns (bool) {
        return lastMintMonthId[user] < getCurrentMonthId();
    }
}
