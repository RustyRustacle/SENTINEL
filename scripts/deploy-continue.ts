import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Continuing deployment with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MNT");

  const registryAddr = process.env.ERC8004_REGISTRY_ADDRESS || "";
  if (!registryAddr) {
    throw new Error("ERC8004_REGISTRY_ADDRESS must be set in .env");
  }
  console.log("ERC8004Registry (existing):", registryAddr);

  const registry = await ethers.getContractAt("ERC8004Registry", registryAddr);

  const agentPrivateKey = process.env.AGENT_PRIVATE_KEY;
  let agentSignerAddr: string;
  if (agentPrivateKey && agentPrivateKey !== "0x" + "0".repeat(64)) {
    const agentWallet = new ethers.Wallet(agentPrivateKey);
    agentSignerAddr = agentWallet.address;
    console.log("Agent signer (dedicated key):", agentSignerAddr);
  } else {
    agentSignerAddr = deployer.address;
    console.warn("WARNING: No dedicated AGENT_PRIVATE_KEY found. Using deployer.");
  }

  const merchantMoeAddr = process.env.MERCHANT_MOE_ROUTER || ethers.ZeroAddress;
  const agniFinanceAddr = process.env.AGNI_FINANCE_POOL_MANAGER || ethers.ZeroAddress;
  const initCapitalAddr = process.env.INIT_CAPITAL_ADDRESS || ethers.ZeroAddress;
  const stableAssetAddr = process.env.STABLE_ASSET || ethers.ZeroAddress;

  const agentId = ethers.keccak256(ethers.toUtf8Bytes("sentinel-rwa-v1"));

  console.log("Deploying SentinelExecutor...");
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

  console.log("Registering agent...");
  const metadataURI = "ipfs://sentinel-rwa-v1-model-card";
  const regTx = await registry.registerAgent(agentId, metadataURI);
  await regTx.wait();
  console.log("Agent registered with ID:", agentId);

  console.log("Authorizing SentinelExecutor...");
  const authTx = await registry.authorizeCaller(agentId, executorAddr);
  await authTx.wait();
  console.log("SentinelExecutor authorized as ERC-8004 caller");

  const score = await registry.getReputationScore(agentId);
  console.log("Agent reputation initialized:", score.toString() + "/1000");

  console.log("\n════════════════════════════════════════════");
  console.log("   ✅ DEPLOYMENT COMPLETE");
  console.log("════════════════════════════════════════════");
  console.log("ERC8004Registry:   ", registryAddr);
  console.log("SentinelExecutor:  ", executorAddr);
  console.log("Agent ID:          ", agentId);
  console.log("Agent Signer:      ", agentSignerAddr);
  console.log("Merchant Moe:      ", merchantMoeAddr);
  console.log("Agni Finance:      ", agniFinanceAddr);
  console.log("INIT Capital:      ", initCapitalAddr);
  console.log("Stable Asset:      ", stableAssetAddr);
  console.log("Reputation Score:  ", score.toString() + "/1000");
  console.log("════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
