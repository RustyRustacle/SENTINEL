// SPDX-License-Identifier: MIT
// ERC8004Registry.sol — Agent Identity & Reputation on Mantle Network
pragma solidity ^0.8.24;

/**
 * @title ERC8004Registry
 * @notice Implements the ERC-8004 standard for AI agent identity and
 *         on-chain reputation. Every action executed by Sentinel is
 *         recorded here, building a verifiable performance history.
 * @dev Deployed on Mantle Network (Chain ID: 5000)
 */
contract ERC8004Registry {

    // ─── STRUCTS ──────────────────────────────────────────────────
    struct AgentProfile {
        address owner;
        string  metadataURI;          // IPFS: model card, strategy desc
        uint256 successfulActions;
        uint256 failedActions;
        uint256 totalValueProtected;  // cumulative USD protected (18 dec)
        uint256 reputationScore;      // 0 – 1000
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

    // ─── STATE ────────────────────────────────────────────────────
    mapping(bytes32 => AgentProfile)                    public agents;
    mapping(bytes32 => ActionRecord[])                  public actionHistory;
    mapping(bytes32 => mapping(address => bool))        public authorizedCallers;

    // ─── EVENTS ───────────────────────────────────────────────────
    event AgentRegistered(
        bytes32 indexed agentId,
        address owner,
        string metadataURI
    );
    event ActionRecorded(
        bytes32 indexed agentId,
        bytes32 actionId,
        uint256 score
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

    // ─── MODIFIERS ────────────────────────────────────────────────
    modifier onlyAgentOwner(bytes32 agentId) {
        require(
            agents[agentId].owner == msg.sender,
            "ERC8004: not agent owner"
        );
        _;
    }

    // ─── REGISTRATION ─────────────────────────────────────────────

    /**
     * @notice Register a new AI agent with an on-chain identity.
     * @param agentId   Unique 32-byte identifier for the agent
     * @param metadataURI IPFS URI pointing to agent model card
     * @return The registered agent ID
     */
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
            reputationScore: 500,    // start at neutral
            registeredAt: block.timestamp,
            lastActionAt: 0
        });

        emit AgentRegistered(agentId, msg.sender, metadataURI);
        return agentId;
    }

    // ─── AUTHORIZATION ────────────────────────────────────────────

    /**
     * @notice Authorize a contract (e.g. SentinelExecutor) to record
     *         actions on behalf of this agent.
     */
    function authorizeCaller(
        bytes32 agentId,
        address caller
    ) external onlyAgentOwner(agentId) {
        authorizedCallers[agentId][caller] = true;
        emit CallerAuthorized(agentId, caller);
    }

    /**
     * @notice Revoke a previously authorized caller.
     */
    function revokeCaller(
        bytes32 agentId,
        address caller
    ) external onlyAgentOwner(agentId) {
        authorizedCallers[agentId][caller] = false;
        emit CallerRevoked(agentId, caller);
    }

    // ─── ACTION RECORDING ─────────────────────────────────────────

    /**
     * @notice Record an action taken by the agent. Only callable by
     *         authorized contracts (e.g. SentinelExecutor).
     * @param agentId  The agent's identity hash
     * @param actionId Unique action identifier
     * @param riskScore Risk score at time of action (0–100)
     */
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

        // Action taken before catastrophic breach (score <= 80) = success
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

        emit ActionRecorded(agentId, actionId, riskScore);
    }

    // ─── QUERIES ──────────────────────────────────────────────────

    /**
     * @notice Get the current reputation score for an agent.
     * @return Score between 0 and 1000
     */
    function getReputationScore(
        bytes32 agentId
    ) external view returns (uint256) {
        return agents[agentId].reputationScore;
    }

    /**
     * @notice Get action counts for an agent.
     */
    function getActionCount(
        bytes32 agentId
    ) external view returns (uint256 successful, uint256 failed) {
        AgentProfile storage p = agents[agentId];
        return (p.successfulActions, p.failedActions);
    }

    /**
     * @notice Get the full action history for an agent.
     */
    function getActionHistory(
        bytes32 agentId
    ) external view returns (ActionRecord[] memory) {
        return actionHistory[agentId];
    }

    /**
     * @notice Get the full agent profile.
     */
    function getAgentProfile(
        bytes32 agentId
    ) external view returns (AgentProfile memory) {
        return agents[agentId];
    }

    // ─── INTERNAL ─────────────────────────────────────────────────

    function _updateReputationScore(bytes32 agentId) internal {
        AgentProfile storage p = agents[agentId];
        uint256 total = p.successfulActions + p.failedActions;
        if (total == 0) return;

        uint256 oldScore = p.reputationScore;
        p.reputationScore = (p.successfulActions * 1000) / total;

        emit ReputationUpdated(agentId, oldScore, p.reputationScore);
    }
}
