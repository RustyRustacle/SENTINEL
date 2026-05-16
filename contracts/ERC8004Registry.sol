// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ERC8004Registry {

    struct AgentProfile {
        address owner;
        string  metadataURI;
        uint256 successfulActions;
        uint256 failedActions;
        uint256 totalValueProtected;
        uint256 reputationScore;
        uint256 registeredAt;
        uint256 lastActionAt;
    }

    struct ActionRecord {
        bytes32  actionId;
        uint256  timestamp;
        uint256  riskScore;
        bool     wasSuccessful;
        uint256  valueProtected;
    }

    mapping(bytes32 => AgentProfile)                    public agents;
    mapping(bytes32 => ActionRecord[])                  public actionHistory;
    mapping(bytes32 => mapping(address => bool))        public authorizedCallers;

    event AgentRegistered(
        bytes32 indexed agentId,
        address owner,
        string metadataURI
    );
    event ActionRecorded(
        bytes32 indexed agentId,
        bytes32 actionId,
        uint256 score,
        uint256 valueProtected
    );
    event ReputationUpdated(
        bytes32 indexed agentId,
        uint256 oldScore,
        uint256 newScore
    );
    event CallerAuthorized(
        bytes32 indexed agentId,
        address caller
    );
    event CallerRevoked(
        bytes32 indexed agentId,
        address caller
    );
    event ValueProtectedUpdated(
        bytes32 indexed agentId,
        uint256 totalValueProtected
    );

    modifier onlyAgentOwner(bytes32 agentId) {
        require(
            agents[agentId].owner == msg.sender,
            "ERC8004: not agent owner"
        );
        _;
    }

    function registerAgent(
        bytes32 agentId,
        string calldata metadataURI
    ) external returns (bytes32) {
        require(
            agents[agentId].owner == address(0),
            "ERC8004: already registered"
        );

        agents[agentId] = AgentProfile({
            owner: msg.sender,
            metadataURI: metadataURI,
            successfulActions: 0,
            failedActions: 0,
            totalValueProtected: 0,
            reputationScore: 500,
            registeredAt: block.timestamp,
            lastActionAt: 0
        });

        emit AgentRegistered(agentId, msg.sender, metadataURI);
        return agentId;
    }

    function authorizeCaller(
        bytes32 agentId,
        address caller
    ) external onlyAgentOwner(agentId) {
        authorizedCallers[agentId][caller] = true;
        emit CallerAuthorized(agentId, caller);
    }

    function revokeCaller(
        bytes32 agentId,
        address caller
    ) external onlyAgentOwner(agentId) {
        authorizedCallers[agentId][caller] = false;
        emit CallerRevoked(agentId, caller);
    }

    function recordAction(
        bytes32 agentId,
        bytes32 actionId,
        uint256 riskScore
    ) external {
        require(
            authorizedCallers[agentId][msg.sender],
            "ERC8004: not authorized"
        );

        AgentProfile storage profile = agents[agentId];
        bool success = riskScore <= 80;

        actionHistory[agentId].push(ActionRecord({
            actionId: actionId,
            timestamp: block.timestamp,
            riskScore: riskScore,
            wasSuccessful: success,
            valueProtected: 0
        }));

        if (success) {
            profile.successfulActions++;
        } else {
            profile.failedActions++;
        }

        _updateReputationScore(agentId);
        profile.lastActionAt = block.timestamp;

        emit ActionRecorded(agentId, actionId, riskScore, 0);
    }

    function updateActionValueProtected(
        bytes32 agentId,
        bytes32 actionId,
        uint256 valueProtected
    ) external {
        require(
            authorizedCallers[agentId][msg.sender],
            "ERC8004: not authorized"
        );

        ActionRecord[] storage history = actionHistory[agentId];
        uint256 len = history.length;
        for (uint256 i = 0; i < len; i++) {
            if (history[i].actionId == actionId) {
                history[i].valueProtected = valueProtected;
                break;
            }
        }

        agents[agentId].totalValueProtected += valueProtected;
        emit ValueProtectedUpdated(agentId, agents[agentId].totalValueProtected);
    }

    function getReputationScore(
        bytes32 agentId
    ) external view returns (uint256) {
        return agents[agentId].reputationScore;
    }

    function getActionCount(
        bytes32 agentId
    ) external view returns (uint256 successful, uint256 failed) {
        AgentProfile storage p = agents[agentId];
        return (p.successfulActions, p.failedActions);
    }

    function getActionHistory(
        bytes32 agentId
    ) external view returns (ActionRecord[] memory) {
        return actionHistory[agentId];
    }

    function getAgentProfile(
        bytes32 agentId
    ) external view returns (AgentProfile memory) {
        return agents[agentId];
    }

    function computeReputationScore(
        bytes32 agentId
    ) public view returns (uint256) {
        AgentProfile storage p = agents[agentId];
        uint256 total = p.successfulActions + p.failedActions;
        if (total == 0) return 500;

        uint256 base = (p.successfulActions * 1000) / total;

        uint256 tenureBonus = 0;
        if (p.registeredAt > 0) {
            uint256 daysSinceRegistration = (block.timestamp - p.registeredAt) / 86400;
            tenureBonus = daysSinceRegistration * 2;
            if (tenureBonus > 100) tenureBonus = 100;
        }

        uint256 result = base + tenureBonus;
        if (result > 1000) result = 1000;

        return result;
    }

    function _updateReputationScore(bytes32 agentId) internal {
        AgentProfile storage p = agents[agentId];
        uint256 total = p.successfulActions + p.failedActions;
        if (total == 0) return;

        uint256 oldScore = p.reputationScore;
        p.reputationScore = computeReputationScore(agentId);

        emit ReputationUpdated(agentId, oldScore, p.reputationScore);
    }
}
