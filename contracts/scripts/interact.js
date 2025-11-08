const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Contract addresses (replace with your deployed addresses)
  const SWIFTSPLIT_ADDRESS = process.env.SWIFTSPLIT_ADDRESS;
  const TEAMSPLITTER_ADDRESS = process.env.TEAMSPLITTER_ADDRESS;
  const USDC_ADDRESS = process.env.USDC_ADDRESS;

  if (!SWIFTSPLIT_ADDRESS || !TEAMSPLITTER_ADDRESS) {
    console.error("❌ Contract addresses not set in environment");
    return;
  }

  // Load contracts
  const SwiftSplit = await ethers.getContractFactory("SwiftSplit");
  const TeamSplitter = await ethers.getContractFactory("TeamSplitter");
    // USDC contract is now external, no need to deploy MockUSDC

  const swiftSplit = SwiftSplit.attach(SWIFTSPLIT_ADDRESS);
  const teamSplitter = TeamSplitter.attach(TEAMSPLITTER_ADDRESS);
  const usdc = USDC.attach(USDC_ADDRESS);

  console.log("🔗 Connected to contracts:");
  console.log(`SwiftSplit: ${SWIFTSPLIT_ADDRESS}`);
  console.log(`TeamSplitter: ${TEAMSPLITTER_ADDRESS}`);
  console.log(`USDC: ${USDC_ADDRESS}`);
  console.log(`Account: ${deployer.address}\n`);

  // Example interactions
  try {
    // Check contract status
    const swiftSplitOwner = await swiftSplit.owner();
    const teamSplitterOwner = await teamSplitter.owner();
    const maxPaymentAmount = await swiftSplit.maxPaymentAmount();
    
    console.log("📊 Contract Status:");
    console.log(`SwiftSplit Owner: ${swiftSplitOwner}`);
    console.log(`TeamSplitter Owner: ${teamSplitterOwner}`);
    console.log(`Max Payment Amount: ${ethers.utils.formatUnits(maxPaymentAmount, 6)} USDC`);

    // Check USDC balance
    const balance = await usdc.balanceOf(deployer.address);
    console.log(`💰 USDC Balance: ${ethers.utils.formatUnits(balance, 6)} USDC`);

    // Check if contracts are paused
    const swiftSplitPaused = await swiftSplit.paused();
    const teamSplitterPaused = await teamSplitter.paused();
    console.log(`⏸️  SwiftSplit Paused: ${swiftSplitPaused}`);
    console.log(`⏸️  TeamSplitter Paused: ${teamSplitterPaused}`);

  } catch (error) {
    console.error("❌ Interaction failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });