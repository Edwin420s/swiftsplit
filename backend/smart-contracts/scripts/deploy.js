const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting SwiftSplit PaymentSplitter deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // Get USDC contract address on Arc
  const usdcAddress = process.env.USDC_CONTRACT_ADDRESS;
  
  if (!usdcAddress) {
    throw new Error("❌ USDC_CONTRACT_ADDRESS environment variable is required");
  }

  console.log("📄 USDC Contract Address:", usdcAddress);

  // Deploy PaymentSplitter contract
  console.log("🛠️  Deploying PaymentSplitter contract...");
  
  const PaymentSplitter = await ethers.getContractFactory("PaymentSplitter");
  const paymentSplitter = await PaymentSplitter.deploy(usdcAddress);

  console.log("⏳ Waiting for deployment confirmation...");
  await paymentSplitter.waitForDeployment();
  
  const contractAddress = await paymentSplitter.getAddress();
  console.log("✅ PaymentSplitter deployed to:", contractAddress);

  // Verify contract on block explorer
  console.log("📡 Verifying contract on block explorer...");
  
  // Wait for a few block confirmations
  console.log("⏳ Waiting for block confirmations...");
  await paymentSplitter.deploymentTransaction().wait(5);

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    usdcAddress: usdcAddress,
    network: await ethers.provider.getNetwork().then(net => net.name),
    chainId: await ethers.provider.getNetwork().then(net => net.chainId),
    deployer: deployer.address,
    transactionHash: paymentSplitter.deploymentTransaction().hash,
    timestamp: new Date().toISOString(),
    contractName: "PaymentSplitter",
    version: "1.0.0"
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to JSON file
  const deploymentFile = path.join(deploymentsDir, `deployment-${deploymentInfo.chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("💾 Deployment info saved to:", deploymentFile);

  // Generate contract ABI file for frontend
  const contractArtifact = await artifacts.readArtifact("PaymentSplitter");
  const abiFile = path.join(deploymentsDir, `PaymentSplitter-abi.json`);
  fs.writeFileSync(abiFile, JSON.stringify(contractArtifact.abi, null, 2));

  console.log("📄 Contract ABI saved to:", abiFile);

  // Display deployment summary
  console.log("\n🎉 Deployment Summary:");
  console.log("====================");
  console.log("Contract: PaymentSplitter");
  console.log("Address:", contractAddress);
  console.log("Network:", deploymentInfo.network);
  console.log("Deployer:", deployer.address);
  console.log("Transaction:", deploymentInfo.transactionHash);
  console.log("USDC Address:", usdcAddress);
  console.log("Timestamp:", deploymentInfo.timestamp);
  console.log("====================\n");

  // Instructions for verification
  console.log("🔍 To verify the contract on ArcScan, run:");
  console.log(`npx hardhat verify --network arc-testnet ${contractAddress} ${usdcAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });