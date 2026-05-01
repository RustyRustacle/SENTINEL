// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IINITCapital — INIT Capital Interface
 * @notice Interface for INIT Capital lending protocol on Mantle
 */
interface IINITCapital {
    function deposit(
        address asset,
        uint256 amount
    ) external returns (uint256 shares);

    function withdraw(
        address asset,
        uint256 shares
    ) external returns (uint256 amount);

    function getCollateralRatio(
        address account
    ) external view returns (uint256 ratio);
}
