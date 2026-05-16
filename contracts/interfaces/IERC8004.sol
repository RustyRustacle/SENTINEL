// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

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

    function updateActionValueProtected(
        bytes32 agentId,
        bytes32 actionId,
        uint256 valueProtected
    ) external;

    function getReputationScore(
        bytes32 agentId
    ) external view returns (uint256);

    function getActionCount(
        bytes32 agentId
    ) external view returns (uint256 successful, uint256 failed);

    function computeReputationScore(
        bytes32 agentId
    ) external view returns (uint256);
}
