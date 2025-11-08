const { ethers, network } = require("hardhat");
const { saveDeployment } = require("./save-deployment");

async function main() {
  console.log("🚀 Deploying SwiftSplit contracts to Arc...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const MAX_PAYMENT_AMOUNT = ethers.parseUnits("10000", 6); // $10,000 max
  
  // Use existing USDC on mainnet
  let usdcAddress;
  if (process.env.USDC_ADDRESS) {
    usdcAddress = process.env.USDC_ADDRESS;
    console.log("📌 Using existing USDC at:", usdcAddress);
  } else {
    throw new Error("USDC_ADDRESS environment variable not set. Please provide the USDC contract address.");
  }
  
  console.log("📦 Deploying SwiftSplit...");
  const SwiftSplit = await ethers.getContractFactory("SwiftSplit");
  const swiftSplit = await SwiftSplit.deploy(usdcAddress, MAX_PAYMENT_AMOUNT);
  await swiftSplit.waitForDeployment();
  const swiftSplitAddress = await swiftSplit.getAddress();
  console.log("✅ SwiftSplit deployed to:", swiftSplitAddress);
  
  console.log("📦 Deploying TeamSplitter...");
  const TeamSplitter = await ethers.getContractFactory("TeamSplitter");
  const MAX_TEAM_PAYMENT = ethers.parseUnits("50000", 6); // $50,000 max for team payments
  const teamSplitter = await TeamSplitter.deploy(usdcAddress, MAX_TEAM_PAYMENT);
  await teamSplitter.waitForDeployment();
  const teamSplitterAddress = await teamSplitter.getAddress();
  console.log("✅ TeamSplitter deployed to:", teamSplitterAddress);
  
  console.log("\n📋 Deployment Summary:");
  console.log("====================");
  console.log("USDC Token:", usdcAddress);
  console.log("SwiftSplit Contract:", swiftSplitAddress);
  console.log("TeamSplitter Contract:", teamSplitterAddress);
  console.log("Max Payment Amount:", ethers.formatUnits(MAX_PAYMENT_AMOUNT, 6), "USDC");
  console.log("Max Team Payment:", ethers.formatUnits(MAX_TEAM_PAYMENT, 6), "USDC");
  console.log("Deployer:", deployer.address);
  
  // Save deployment addresses
  saveDeployment(network.name, {
    usdcToken: usdcAddress,
    swiftSplit: swiftSplitAddress,
    teamSplitter: teamSplitterAddress,
    deployer: deployer.address,
    maxPaymentAmount: MAX_PAYMENT_AMOUNT.toString(),
    maxTeamPayment: MAX_TEAM_PAYMENT.toString()
  });
  
  console.log("\n✅ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });