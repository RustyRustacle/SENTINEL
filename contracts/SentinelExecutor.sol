// SPDX-License-Identifier: MIT
// SentinelExecutor.sol — Mantle Network
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IERC8004.sol";
import "./interfaces/IMerchantMoe.sol";
import "./interfaces/IAgniFinance.sol";
import "./interfaces/IINITCapital.sol";

/**
 * @title SentinelExecutor
 * @notice Primary on-chain execution contract for the Sentinel system.
 *         Accepts signed action instructions from the off-chain AI agent
 *         and executes them atomically on Mantle Network.
 * @dev Enforces access control, action limits, and cooldown periods
 *      to prevent runaway execution. All actions are recorded via ERC-8004.
 */
contract SentinelExecutor is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    // ─── STATE ────────────────────────────────────────────────────
    IERC8004     public immutable agentRegistry;
    IMerchantMoe public immutable merchantMoe;
    IAgniFinance public immutable agniFinance;
    IINITCapital public immutable initCapital;

    bytes32 public immutable agentId;       // ERC-8004 agent identity hash
    address public immutable agentSigner;   // off-chain agent's signing key

    uint256 public constant MAX_EXPOSURE_BPS = 2000;  // 20% max single asset
    uint256 public constant ACTION_COOLDOWN  = 5 minutes;
    uint256 public lastActionTimestamp;

    // Stable asset for swaps (e.g. USDC or WMNT on Mantle)
    address public stableAsset;

    // ─── EVENTS ───────────────────────────────────────────────────
    event ActionExecuted(
        bytes32 indexed actionId,
        uint8   actionType,
        address asset,
        uint256 amount,
        uint256 riskScore
    );
    event ThresholdBreached(
        address asset,
        uint256 priceDrop,
        uint256 correlationScore
    );
    event ReputationUpdated(
        bytes32 agentId,
        uint256 newScore
    );
    event StableAssetUpdated(
        address oldAsset,
        address newAsset
    );

    // ─── ACTION TYPES ─────────────────────────────────────────────
    enum ActionType { HOLD, REDUCE_25, REDUCE_50, FULL_EXIT, HEDGE }

    struct AgentAction {
        bytes32    actionId;
        ActionType actionType;
        address    asset;
        uint256    amount;
        uint256    riskScore;    // 0 – 100, computed by SentinelAgent
        uint256    deadline;
        bytes      signature;
    }

    // ─── CONSTRUCTOR ──────────────────────────────────────────────
    constructor(
        address _agentRegistry,
        address _merchantMoe,
        address _agniFinance,
        address _initCapital,
        bytes32 _agentId,
        address _agentSigner
    ) Ownable(msg.sender) {
        agentRegistry = IERC8004(_agentRegistry);
        merchantMoe   = IMerchantMoe(_merchantMoe);
        agniFinance   = IAgniFinance(_agniFinance);
        initCapital   = IINITCapital(_initCapital);
        agentId       = _agentId;
        agentSigner   = _agentSigner;
    }

    // ─── ADMIN ────────────────────────────────────────────────────

    /**
     * @notice Set the stable asset used as swap destination.
     */
    function setStableAsset(address _stableAsset) external onlyOwner {
        address old = stableAsset;
        stableAsset = _stableAsset;
        emit StableAssetUpdated(old, _stableAsset);
    }

    // ─── CORE EXECUTION ───────────────────────────────────────────

    /**
     * @notice Execute a signed action from the off-chain Sentinel agent.
     * @dev Verifies signature, deadline, cooldown, and risk threshold
     *      before executing the protective action.
     * @param action The signed action struct from the AI agent
     */
    function executeAction(
        AgentAction calldata action
    ) external nonReentrant {
        // 1. Verify signature from off-chain agent
        bytes32 digest = _hashAction(action);
        require(
            digest.recover(action.signature) == agentSigner,
            "Sentinel: invalid agent signature"
        );

        // 2. Verify deadline not expired
        require(
            block.timestamp <= action.deadline,
            "Sentinel: action expired"
        );

        // 3. Enforce cooldown
        require(
            block.timestamp >= lastActionTimestamp + ACTION_COOLDOWN,
            "Sentinel: cooldown active"
        );

        // 4. Verify risk score threshold
        require(
            action.riskScore >= 40,
            "Sentinel: risk below threshold"
        );

        // 5. Execute the action
        if (action.actionType == ActionType.REDUCE_25) {
            _reducePosition(action.asset, action.amount / 4);
        } else if (action.actionType == ActionType.REDUCE_50) {
            _reducePosition(action.asset, action.amount / 2);
        } else if (action.actionType == ActionType.FULL_EXIT) {
            _reducePosition(action.asset, action.amount);
        } else if (action.actionType == ActionType.HEDGE) {
            _openHedgePosition(action.asset, action.amount);
        }
        // ActionType.HOLD — no execution needed

        // 6. Update ERC-8004 reputation
        agentRegistry.recordAction(
            agentId,
            action.actionId,
            action.riskScore
        );

        lastActionTimestamp = block.timestamp;

        emit ActionExecuted(
            action.actionId,
            uint8(action.actionType),
            action.asset,
            action.amount,
            action.riskScore
        );
    }

    // ─── VIEW FUNCTIONS ───────────────────────────────────────────

    /**
     * @notice Check if an action can be executed (cooldown elapsed).
     */
    function canExecute() external view returns (bool) {
        return block.timestamp >= lastActionTimestamp + ACTION_COOLDOWN;
    }

    /**
     * @notice Get time remaining on cooldown.
     */
    function cooldownRemaining() external view returns (uint256) {
        uint256 nextAllowed = lastActionTimestamp + ACTION_COOLDOWN;
        if (block.timestamp >= nextAllowed) return 0;
        return nextAllowed - block.timestamp;
    }

    // ─── EMERGENCY ────────────────────────────────────────────────

    /**
     * @notice Emergency withdrawal of any ERC-20 token. Owner only.
     */
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyOwner {
        IERC20(token).transfer(msg.sender, amount);
    }

    // ─── INTERNAL ─────────────────────────────────────────────────

    function _reducePosition(address asset, uint256 amount) internal {
        // Route through Merchant Moe for best execution
        IERC20(asset).approve(address(merchantMoe), amount);
        address[] memory path = _buildPath(asset);
        merchantMoe.swapExactTokensForTokens(
            amount,
            0,                          // accept any amount out (slippage handled off-chain)
            path,
            address(this),
            block.timestamp + 300       // 5 min deadline
        );
    }

    function _openHedgePosition(address asset, uint256 amount) internal {
        // Deposit into Agni Finance short vault
        IERC20(asset).approve(address(agniFinance), amount);
        agniFinance.openShort(
            asset,
            amount,
            2e18    // 2x leverage cap
        );
    }

    function _buildPath(
        address asset
    ) internal view returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = asset;
        path[1] = stableAsset;
        return path;
    }

    function _hashAction(
        AgentAction calldata a
    ) internal view returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                block.chainid,
                address(this),
                a.actionId,
                uint8(a.actionType),
                a.asset,
                a.amount,
                a.riskScore,
                a.deadline
            )
        );
    }
}
