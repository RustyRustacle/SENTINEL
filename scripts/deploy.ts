import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MNT");

  // ─── Deploy ERC8004Registry ─────────────────────────────────
  const Registry = await ethers.getContractFactory("ERC8004Registry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("ERC8004Registry deployed to:", registryAddr);

  // ─── Deploy SentinelExecutor ────────────────────────────────
  const agentId = ethers.keccak256(ethers.toUtf8Bytes("sentinel-rwa-v1"));
  const agentSigner = deployer.address; // In production, use a dedicated signing key

  const Executor = await ethers.getContractFactory("SentinelExecutor");
  const executor = await Executor.deploy(
    registryAddr,
    ethers.ZeroAddress, // Merchant Moe — set post-deploy
    ethers.ZeroAddress, // Agni Finance — set post-deploy
    ethers.ZeroAddress, // INIT Capital — set post-deploy
    agentId,
    agentSigner
  );
  await executor.waitForDeployment();
  const executorAddr = await executor.getAddress();
  console.log("SentinelExecutor deployed to:", executorAddr);

  // ─── Register Agent on ERC-8004 ─────────────────────────────
  const metadataURI = "ipfs://sentinel-rwa-v1-model-card";
  const regTx = await registry.registerAgent(agentId, metadataURI);
  await regTx.wait();
  console.log("Agent registered with ID:", agentId);

  // ─── Authorize SentinelExecutor as caller ───────────────────
  const authTx = await registry.authorizeCaller(agentId, executorAddr);
  await authTx.wait();
  console.log("SentinelExecutor authorized as ERC-8004 caller");

  // ─── Verify initial state ──────────────────────────────────
  const score = await registry.getReputationScore(agentId);
  console.log("Agent reputation initialized:", score.toString() + "/1000");

  console.log("\n─── Deployment Summary ───");
  console.log("ERC8004Registry:   ", registryAddr);
  console.log("SentinelExecutor:  ", executorAddr);
  console.log("Agent ID:          ", agentId);
  console.log("Agent Signer:      ", agentSigner);
  console.log("Reputation Score:  ", score.toString() + "/1000");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
