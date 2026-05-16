import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MNT");

  const agentPrivateKey = process.env.AGENT_PRIVATE_KEY;
  let agentSignerAddr: string;
  if (agentPrivateKey && agentPrivateKey !== "0x" + "0".repeat(64)) {
    const agentWallet = new ethers.Wallet(agentPrivateKey);
    agentSignerAddr = agentWallet.address;
    console.log("Agent signer (dedicated key):", agentSignerAddr);
  } else {
    agentSignerAddr = deployer.address;
    console.warn("WARNING: No dedicated AGENT_PRIVATE_KEY found. Using deployer as agent signer.");
    console.warn("  For mainnet, set a dedicated AGENT_PRIVATE_KEY in .env");
  }

  const merchantMoeAddr = process.env.MERCHANT_MOE_ROUTER || ethers.ZeroAddress;
  const agniFinanceAddr = process.env.AGNI_FINANCE_POOL_MANAGER || ethers.ZeroAddress;
  const initCapitalAddr = process.env.INIT_CAPITAL_ADDRESS || ethers.ZeroAddress;
  const stableAssetAddr = process.env.STABLE_ASSET || ethers.ZeroAddress;

  const Registry = await ethers.getContractFactory("ERC8004Registry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("ERC8004Registry deployed to:", registryAddr);

  const agentId = ethers.keccak256(ethers.toUtf8Bytes("sentinel-rwa-v1"));

  const Executor = await ethers.getContractFactory("SentinelExecutor");
  const executor = await Executor.deploy(
    registryAddr,
    merchantMoeAddr,
    agniFinanceAddr,
    initCapitalAddr,
    agentId,
    agentSignerAddr,
    stableAssetAddr
  );
  await executor.waitForDeployment();
  const executorAddr = await executor.getAddress();
  console.log("SentinelExecutor deployed to:", executorAddr);

  const metadataURI = "ipfs://sentinel-rwa-v1-model-card";
  const regTx = await registry.registerAgent(agentId, metadataURI);
  await regTx.wait();
  console.log("Agent registered with ID:", agentId);

  const authTx = await registry.authorizeCaller(agentId, executorAddr);
  await authTx.wait();
  console.log("SentinelExecutor authorized as ERC-8004 caller");

  const score = await registry.getReputationScore(agentId);
  console.log("Agent reputation initialized:", score.toString() + "/1000");

  console.log("\n════════════════════════════════════════════");
  console.log("   ✅ DEPLOYMENT COMPLETE");
  console.log("════════════════════════════════════════════");
  console.log("Network:             ", process.env.MANTLE_RPC_URL || "hardhat");
  console.log("ERC8004Registry:     ", registryAddr);
  console.log("SentinelExecutor:    ", executorAddr);
  console.log("Agent ID:            ", agentId);
  console.log("Agent Signer:        ", agentSignerAddr);
  console.log("Merchant Moe:        ", merchantMoeAddr);
  console.log("Agni Finance:        ", agniFinanceAddr);
  console.log("INIT Capital:        ", initCapitalAddr);
  console.log("Stable Asset:        ", stableAssetAddr);
  console.log("Reputation Score:    ", score.toString() + "/1000");
  console.log("════════════════════════════════════════════\n");

  console.log("Required .env additions:");
  console.log(`  SENTINEL_EXECUTOR_ADDRESS=${executorAddr}`);
  console.log(`  ERC8004_REGISTRY_ADDRESS=${registryAddr}`);
  console.log(`  AGENT_ID=${agentId}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
