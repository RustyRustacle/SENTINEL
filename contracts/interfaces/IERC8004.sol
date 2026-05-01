// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IERC8004 — AI Agent Identity & Reputation Standard
 * @notice Interface for the ERC-8004 agent registry on Mantle Network
 */
interface IERC8004 {
    function registerAgent(
        bytes32 agentId,
        string calldata metadataURI
    ) external returns (bytes32);

    function recordAction(
        bytes32 agentId,
        bytes32 actionId,
        uint256 riskScore
    ) external;

    function getReputationScore(
        bytes32 agentId
    ) external view returns (uint256);

    function getActionCount(
        bytes32 agentId
    ) external view returns (uint256 successful, uint256 failed);
}
