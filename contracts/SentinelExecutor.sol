// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IERC8004.sol";
import "./interfaces/IMerchantMoe.sol";
import "./interfaces/IAgniFinance.sol";
import "./interfaces/IINITCapital.sol";

contract SentinelExecutor is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC8004     public agentRegistry;
    IMerchantMoe public merchantMoe;
    IAgniFinance public agniFinance;
    IINITCapital public initCapital;

    bytes32 public agentId;
    address public agentSigner;

    uint256 public constant MAX_EXPOSURE_BPS = 2000;
    uint256 public constant ACTION_COOLDOWN  = 5 minutes;
    uint256 public lastActionTimestamp;

    address public stableAsset;

    mapping(bytes32 => bool) public usedActionIds;

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
        bytes32 indexed agentId,
        uint256 newScore
    );
    event StableAssetUpdated(
        address oldAsset,
        address newAsset
    );
    event AgentSignerUpdated(
        address oldSigner,
        address newSigner
    );
    event ProtocolAddressUpdated(
        string name,
        address oldAddr,
        address newAddr
    );

    enum ActionType { HOLD, REDUCE_25, REDUCE_50, FULL_EXIT, HEDGE }

    struct AgentAction {
        bytes32    actionId;
        ActionType actionType;
        address    asset;
        uint256    amount;
        uint256    amountOutMin;
        uint256    riskScore;
        uint256    deadline;
        bytes      signature;
    }

    constructor(
        address _agentRegistry,
        address _merchantMoe,
        address _agniFinance,
        address _initCapital,
        bytes32 _agentId,
        address _agentSigner,
        address _stableAsset
    ) Ownable(msg.sender) {
        require(_agentSigner != address(0), "Sentinel: signer zero");
        require(_agentRegistry != address(0), "Sentinel: registry zero");
        require(_stableAsset != address(0), "Sentinel: stableAsset zero");

        agentRegistry = IERC8004(_agentRegistry);
        merchantMoe   = IMerchantMoe(_merchantMoe);
        agniFinance   = IAgniFinance(_agniFinance);
        initCapital   = IINITCapital(_initCapital);
        agentId       = _agentId;
        agentSigner   = _agentSigner;
        stableAsset   = _stableAsset;
    }

    function setMerchantMoe(address _addr) external onlyOwner {
        require(_addr != address(0), "Sentinel: zero address");
        emit ProtocolAddressUpdated("MerchantMoe", address(merchantMoe), _addr);
        merchantMoe = IMerchantMoe(_addr);
    }

    function setAgniFinance(address _addr) external onlyOwner {
        require(_addr != address(0), "Sentinel: zero address");
        emit ProtocolAddressUpdated("AgniFinance", address(agniFinance), _addr);
        agniFinance = IAgniFinance(_addr);
    }

    function setInitCapital(address _addr) external onlyOwner {
        require(_addr != address(0), "Sentinel: zero address");
        emit ProtocolAddressUpdated("InitCapital", address(initCapital), _addr);
        initCapital = IINITCapital(_addr);
    }

    function setAgentSigner(address _agentSigner) external onlyOwner {
        require(_agentSigner != address(0), "Sentinel: signer zero");
        emit AgentSignerUpdated(agentSigner, _agentSigner);
        agentSigner = _agentSigner;
    }

    function setStableAsset(address _stableAsset) external onlyOwner {
        require(_stableAsset != address(0), "Sentinel: stableAsset zero");
        address old = stableAsset;
        stableAsset = _stableAsset;
        emit StableAssetUpdated(old, _stableAsset);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function executeAction(
        AgentAction calldata action
    ) external nonReentrant whenNotPaused {
        require(!usedActionIds[action.actionId], "Sentinel: action replayed");
        require(action.amount > 0, "Sentinel: zero amount");
        require(action.amountOutMin > 0, "Sentinel: zero slippage");
        require(action.asset != address(0), "Sentinel: asset zero");

        bytes32 digest = _hashAction(action);
        require(
            _verifySignature(digest, action.signature),
            "Sentinel: invalid agent signature"
        );

        require(
            block.timestamp <= action.deadline,
            "Sentinel: action expired"
        );

        require(
            block.timestamp >= lastActionTimestamp + ACTION_COOLDOWN,
            "Sentinel: cooldown active"
        );

        require(
            action.riskScore >= 30,
            "Sentinel: risk below threshold"
        );

        usedActionIds[action.actionId] = true;

        if (action.actionType == ActionType.REDUCE_25) {
            _reducePosition(action.asset, action.amount / 4, action.amountOutMin / 4);
        } else if (action.actionType == ActionType.REDUCE_50) {
            _reducePosition(action.asset, action.amount / 2, action.amountOutMin / 2);
        } else if (action.actionType == ActionType.FULL_EXIT) {
            _reducePosition(action.asset, action.amount, action.amountOutMin);
        } else if (action.actionType == ActionType.HEDGE) {
            _openHedgePosition(action.asset, action.amount);
        }

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

    function canExecute() external view returns (bool) {
        return block.timestamp >= lastActionTimestamp + ACTION_COOLDOWN && !paused();
    }

    function cooldownRemaining() external view returns (uint256) {
        uint256 nextAllowed = lastActionTimestamp + ACTION_COOLDOWN;
        if (block.timestamp >= nextAllowed) return 0;
        return nextAllowed - block.timestamp;
    }

    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyOwner {
        IERC20(token).safeTransfer(msg.sender, amount);
    }

    function _reducePosition(address asset, uint256 amount, uint256 minOut) internal {
        uint256 balance = IERC20(asset).balanceOf(address(this));
        uint256 toSwap = amount > balance ? balance : amount;
        if (toSwap == 0) return;

        IERC20(asset).safeIncreaseAllowance(address(merchantMoe), toSwap);
        address[] memory path = _buildPath(asset);
        merchantMoe.swapExactTokensForTokens(
            toSwap,
            minOut,
            path,
            address(this),
            block.timestamp + 300
        );
    }

    function _openHedgePosition(address asset, uint256 amount) internal {
        uint256 balance = IERC20(asset).balanceOf(address(this));
        uint256 toDeposit = amount > balance ? balance : amount;
        if (toDeposit == 0) return;

        IERC20(asset).safeIncreaseAllowance(address(agniFinance), toDeposit);
        agniFinance.openShort(asset, toDeposit, 2e18);
    }

    function _buildPath(
        address asset
    ) internal view returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = asset;
        path[1] = stableAsset;
        return path;
    }

    function _verifySignature(bytes32 digest, bytes calldata signature) internal view returns (bool) {
        if (signature.length != 65) return false;
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 0x20))
            v := byte(0, calldataload(add(signature.offset, 0x40)))
        }
        if (v < 27) v += 27;
        address recovered = ecrecover(digest, v, r, s);
        return recovered == agentSigner;
    }

    function _hashAction(
        AgentAction calldata a
    ) internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                block.chainid,
                address(this),
                a.actionId,
                uint8(a.actionType),
                a.asset,
                a.amount,
                a.amountOutMin,
                a.riskScore,
                a.deadline
            )
        );
    }
}
