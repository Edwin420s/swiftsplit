const { ethers, network } = require("hardhat");
const { saveDeployment } = require("./save-deployment");

async function main() {
  console.log("🚀 Deploying SwiftSplit contracts to Arc...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const MAX_PAYMENT_AMOUNT = ethers.utils.parseUnits("10000", 6); // $10,000 max
  
  // Deploy MockUSDC for testing or use existing USDC on mainnet
  let usdcAddress;
  if (process.env.USDC_ADDRESS) {
    usdcAddress = process.env.USDC_ADDRESS;
    console.log("📌 Using existing USDC at:", usdcAddress);
  } else {
    console.log("📦 Deploying MockUSDC for testing...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy(6);
    await mockUSDC.deployed();
    usdcAddress = mockUSDC.address;
    console.log("✅ MockUSDC deployed to:", usdcAddress);
  }
  
  console.log("📦 Deploying SwiftSplit...");
  const SwiftSplit = await ethers.getContractFactory("SwiftSplit");
  const swiftSplit = await SwiftSplit.deploy(usdcAddress, MAX_PAYMENT_AMOUNT);
  await swiftSplit.deployed();
  console.log("✅ SwiftSplit deployed to:", swiftSplit.address);
  
  console.log("📦 Deploying TeamSplitter...");
  const TeamSplitter = await ethers.getContractFactory("TeamSplitter");
  const MAX_TEAM_PAYMENT = ethers.utils.parseUnits("50000", 6); // $50,000 max for team payments
  const teamSplitter = await TeamSplitter.deploy(usdcAddress, MAX_TEAM_PAYMENT);
  await teamSplitter.deployed();
  console.log("✅ TeamSplitter deployed to:", teamSplitter.address);
  
  console.log("\n📋 Deployment Summary:");
  console.log("====================");
  console.log("USDC Token:", usdcAddress);
  console.log("SwiftSplit Contract:", swiftSplit.address);
  console.log("TeamSplitter Contract:", teamSplitter.address);
  console.log("Max Payment Amount:", ethers.utils.formatUnits(MAX_PAYMENT_AMOUNT, 6), "USDC");
  console.log("Max Team Payment:", ethers.utils.formatUnits(MAX_TEAM_PAYMENT, 6), "USDC");
  console.log("Deployer:", deployer.address);
  
  // Save deployment addresses
  saveDeployment(network.name, {
    usdcToken: usdcAddress,
    swiftSplit: swiftSplit.address,
    teamSplitter: teamSplitter.address,
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