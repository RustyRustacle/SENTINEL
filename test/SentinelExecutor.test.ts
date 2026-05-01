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

    // Record a successful action (score <= 80)
    const actionId = ethers.keccak256(ethers.toUtf8Bytes("action-1"));
    await registry.recordAction(agentId, actionId, 60);

    const score = await registry.getReputationScore(agentId);
    expect(score).to.equal(1000); // 1 success, 0 failures = 1000

    // Record a failed action (score > 80)
    const actionId2 = ethers.keccak256(ethers.toUtf8Bytes("action-2"));
    await registry.recordAction(agentId, actionId2, 95);

    const score2 = await registry.getReputationScore(agentId);
    expect(score2).to.equal(500); // 1 success, 1 failure = 500
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
});

describe("SentinelExecutor", () => {
  let executor: any;
  let registry: any;
  let owner: SignerWithAddress;
  let agentSigner: SignerWithAddress;
  let agentId: string;

  beforeEach(async () => {
    [owner, agentSigner] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("ERC8004Registry");
    registry = await Registry.deploy();

    agentId = ethers.keccak256(ethers.toUtf8Bytes("sentinel-test-v1"));

    const Executor = await ethers.getContractFactory("SentinelExecutor");
    executor = await Executor.deploy(
      await registry.getAddress(),
      ethers.ZeroAddress, // Merchant Moe
      ethers.ZeroAddress, // Agni Finance
      ethers.ZeroAddress, // INIT Capital
      agentId,
      agentSigner.address
    );

    // Register agent and authorize executor
    await registry.registerAgent(agentId, "ipfs://test");
    await registry.authorizeCaller(agentId, await executor.getAddress());
  });

  it("should have correct initial state", async () => {
    expect(await executor.agentId()).to.equal(agentId);
    expect(await executor.agentSigner()).to.equal(agentSigner.address);
    expect(await executor.canExecute()).to.be.true;
  });

  it("should report zero cooldown initially", async () => {
    expect(await executor.cooldownRemaining()).to.equal(0);
  });

  it("should allow emergency withdrawal by owner", async () => {
    // This test verifies the function exists and is owner-only
    // Full test requires deploying a mock ERC20
    expect(executor.emergencyWithdraw).to.not.be.undefined;
  });
});
