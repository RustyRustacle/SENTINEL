// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IAgniFinance — Agni Finance Lending Interface
 * @notice Interface for opening hedge positions on Agni Finance (Mantle)
 */
interface IAgniFinance {
    function openShort(
        address asset,
        uint256 amount,
        uint256 leverageFactor
    ) external returns (bytes32 positionId);

    function closePosition(
        bytes32 positionId
    ) external returns (uint256 amountReturned);

    function getPositionHealth(
        bytes32 positionId
    ) external view returns (uint256 healthFactor);
}
