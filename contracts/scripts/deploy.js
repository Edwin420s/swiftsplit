const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying SwiftSplit contracts to Arc...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0xYourUSDCAddressOnArc";
  
  const SwiftSplit = await ethers.getContractFactory("SwiftSplit");
  const swiftSplit = await SwiftSplit.deploy(USDC_ADDRESS);
  await swiftSplit.deployed();
  console.log("✅ SwiftSplit deployed to:", swiftSplit.address);
  
  const TeamSplitter = await ethers.getContractFactory("TeamSplitter");
  const teamSplitter = await TeamSplitter.deploy(USDC_ADDRESS);
  await teamSplitter.deployed();
  console.log("✅ TeamSplitter deployed to:", teamSplitter.address);
  
  console.log("\n📋 Deployment Summary:");
  console.log("====================");
  console.log("SwiftSplit Contract:", swiftSplit.address);
  console.log("TeamSplitter Contract:", teamSplitter.address);
  console.log("USDC Token:", USDC_ADDRESS);
  console.log("Deployer:", deployer.address);
  console.log("Network:", await ethers.provider.getNetwork().then(n => n.name));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });