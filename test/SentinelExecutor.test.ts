import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ERC8004Registry", () => {
  let registry: any;
  let owner: SignerWithAddress;
  let other: SignerWithAddress;
  let agentId: string;

  beforeEach(async () => {
    [owner, other] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("ERC8004Registry");
    registry = await Registry.deploy();
    agentId = ethers.keccak256(ethers.toUtf8Bytes("sentinel-test-v1"));
  });

  it("should register a new agent with initial score 500", async () => {
    await registry.registerAgent(agentId, "ipfs://test");
    const score = await registry.getReputationScore(agentId);
    expect(score).to.equal(500);
  });

  it("should reject duplicate agent registration", async () => {
    await registry.registerAgent(agentId, "ipfs://test");
    await expect(
      registry.registerAgent(agentId, "ipfs://test2")
    ).to.be.revertedWith("ERC8004: already registered");
  });

  it("should allow owner to authorize callers", async () => {
    await registry.registerAgent(agentId, "ipfs://test");
    await registry.authorizeCaller(agentId, other.address);
    expect(
      await registry.authorizedCallers(agentId, other.address)
    ).to.be.true;
  });

  it("should reject unauthorized action recording", async () => {
    await registry.registerAgent(agentId, "ipfs://test");
    const actionId = ethers.keccak256(ethers.toUtf8Bytes("action-1"));
    await expect(
      registry.connect(other).recordAction(agentId, actionId, 50)
    ).to.be.revertedWith("ERC8004: not authorized");
  });

  it("should record actions and update reputation", async () => {
    await registry.registerAgent(agentId, "ipfs://test");
    await registry.authorizeCaller(agentId, owner.address);

    const actionId = ethers.keccak256(ethers.toUtf8Bytes("action-1"));
    await registry.recordAction(agentId, actionId, 60);

    const score = await registry.getReputationScore(agentId);
    expect(score).to.equal(1000);

    const actionId2 = ethers.keccak256(ethers.toUtf8Bytes("action-2"));
    await registry.recordAction(agentId, actionId2, 95);

    const score2 = await registry.getReputationScore(agentId);
    expect(score2).to.equal(500);
  });

  it("should return full action history", async () => {
    await registry.registerAgent(agentId, "ipfs://test");
    await registry.authorizeCaller(agentId, owner.address);

    const a1 = ethers.keccak256(ethers.toUtf8Bytes("action-1"));
    const a2 = ethers.keccak256(ethers.toUtf8Bytes("action-2"));
    await registry.recordAction(agentId, a1, 50);
    await registry.recordAction(agentId, a2, 75);

    const history = await registry.getActionHistory(agentId);
    expect(history.length).to.equal(2);
  });

  it("should update action value protected", async () => {
    await registry.registerAgent(agentId, "ipfs://test");
    await registry.authorizeCaller(agentId, owner.address);

    const actionId = ethers.keccak256(ethers.toUtf8Bytes("action-1"));
    await registry.recordAction(agentId, actionId, 60);
    await registry.updateActionValueProtected(agentId, actionId, 50000);

    const profile = await registry.getAgentProfile(agentId);
    expect(profile.totalValueProtected).to.equal(50000);
  });

  it("should compute tenure bonus in reputation", async () => {
    await registry.registerAgent(agentId, "ipfs://test");
    const computed = await registry.computeReputationScore(agentId);
    expect(computed).to.equal(500);
  });
});

describe("SentinelExecutor", () => {
  let executor: any;
  let registry: any;
  let owner: SignerWithAddress;
  let agentSigner: SignerWithAddress;
  let agentId: string;
  let stableAsset: string;

  beforeEach(async () => {
    [owner, agentSigner] = await ethers.getSigners();
    stableAsset = "0x0000000000000000000000000000000000000001";

    const Registry = await ethers.getContractFactory("ERC8004Registry");
    registry = await Registry.deploy();

    agentId = ethers.keccak256(ethers.toUtf8Bytes("sentinel-test-v1"));

    const Executor = await ethers.getContractFactory("SentinelExecutor");
    executor = await Executor.deploy(
      await registry.getAddress(),
      ethers.ZeroAddress,
      ethers.ZeroAddress,
      ethers.ZeroAddress,
      agentId,
      agentSigner.address,
      stableAsset
    );

    await registry.registerAgent(agentId, "ipfs://test");
    await registry.authorizeCaller(agentId, await executor.getAddress());
  });

  it("should have correct initial state", async () => {
    expect(await executor.agentId()).to.equal(agentId);
    expect(await executor.agentSigner()).to.equal(agentSigner.address);
    expect(await executor.canExecute()).to.be.true;
    expect(await executor.stableAsset()).to.equal(stableAsset);
  });

  it("should report zero cooldown initially", async () => {
    expect(await executor.cooldownRemaining()).to.equal(0);
  });

  it("should allow emergency withdrawal by owner", async () => {
    expect(executor.emergencyWithdraw).to.not.be.undefined;
  });

  it("should revert when paused", async () => {
    await executor.pause();
    const actionId = ethers.keccak256(ethers.toUtf8Bytes("action-1"));
    const action = {
      actionId: actionId,
      actionType: 0,
      asset: agentSigner.address,
      amount: 100,
      amountOutMin: 1,
      riskScore: 50,
      deadline: Math.floor(Date.now() / 1000) + 3600,
      signature: "0x" + "00".repeat(65),
    };
    await expect(
      executor.executeAction(action)
    ).to.be.reverted;
  });

  it("should revert on zero agent signer during deploy", async () => {
    const Executor = await ethers.getContractFactory("SentinelExecutor");
    await expect(
      Executor.deploy(
        await registry.getAddress(),
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        agentId,
        ethers.ZeroAddress,
        stableAsset
      )
    ).to.be.revertedWith("Sentinel: signer zero");
  });

  it("should allow setting protocol addresses after deploy", async () => {
    const newMoe = "0x0000000000000000000000000000000000000002";
    await executor.setMerchantMoe(newMoe);
    expect(await executor.merchantMoe()).to.equal(newMoe);
  });

  it("should reject non-owner protocol address changes", async () => {
    const newMoe = "0x0000000000000000000000000000000000000002";
    await expect(
      executor.connect(agentSigner).setMerchantMoe(newMoe)
    ).to.be.reverted;
  });

  it("should enforce cooldown after execution", async () => {
    const executorAddr = await executor.getAddress();
    const chainId = await ethers.provider.getNetwork().then(n => n.chainId);

    const agentWallet = ethers.Wallet.createRandom();
    await executor.setAgentSigner(agentWallet.address);

    const actionId = ethers.keccak256(ethers.toUtf8Bytes("action-test"));
    const riskScore = 50;
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const amount = 1000;
    const asset = owner.address;

    const actionTypes = ["uint256", "address", "bytes32", "uint8", "address", "uint256", "uint256", "uint256", "uint256"];
    const actionValues = [chainId, executorAddr, actionId, 0, asset, amount, 1, riskScore, deadline];
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(actionTypes, actionValues);
    const hash = ethers.keccak256(encoded);

    const rawSig = agentWallet.signingKey.sign(ethers.getBytes(hash));
    const signature = ethers.Signature.from(rawSig).serialized;

    const action = {
      actionId: actionId, actionType: 0, asset: asset,
      amount: amount, amountOutMin: 1, riskScore: riskScore,
      deadline: deadline, signature: signature,
    };

    const before = await executor.cooldownRemaining();
    expect(before).to.equal(0);

    await executor.executeAction(action);

    const remaining = await executor.cooldownRemaining();
    expect(remaining).to.be.gt(0);

    await expect(
      executor.executeAction(action)
    ).to.be.revertedWith("Sentinel: action replayed");
  });
});
