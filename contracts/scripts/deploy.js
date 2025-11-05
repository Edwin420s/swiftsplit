const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying SwiftSplit contracts to Arc...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  // Arc testnet USDC address (example - replace with actual)
  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0xYourUSDCAddressOnArc";
  const MAX_PAYMENT_AMOUNT = ethers.utils.parseUnits("10000", 6); // $10,000 max
  
  console.log("📦 Deploying MockUSDC for testing...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy(6);
  await mockUSDC.deployed();
  console.log("✅ MockUSDC deployed to:", mockUSDC.address);
  
  console.log("📦 Deploying SwiftSplit...");
  const SwiftSplit = await ethers.getContractFactory("SwiftSplit");
  const swiftSplit = await SwiftSplit.deploy(USDC_ADDRESS, MAX_PAYMENT_AMOUNT);
  await swiftSplit.deployed();
  console.log("✅ SwiftSplit deployed to:", swiftSplit.address);
  
  console.log("📦 Deploying TeamSplitter...");
  const TeamSplitter = await ethers.getContractFactory("TeamSplitter");
  const teamSplitter = await TeamSplitter.deploy(USDC_ADDRESS);
  await teamSplitter.deployed();
  console.log("✅ TeamSplitter deployed to:", teamSplitter.address);
  
  console.log("\n📋 Deployment Summary:");
  console.log("====================");
  console.log("MockUSDC (test):", mockUSDC.address);
  console.log("SwiftSplit Contract:", swiftSplit.address);
  console.log("TeamSplitter Contract:", teamSplitter.address);
  console.log("USDC Token:", USDC_ADDRESS);
  console.log("Max Payment Amount:", MAX_PAYMENT_AMOUNT.toString());
  console.log("Deployer:", deployer.address);
  
  // Verify contracts (if using verified deployment)
  console.log("\n🔍 Verifying contracts...");
  // Add verification logic here if needed
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });