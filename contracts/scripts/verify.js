const { run } = require("hardhat");

async function verify(contractAddress, constructorArguments) {
  console.log(`🔍 Verifying contract at ${contractAddress}...`);
  
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArguments,
    });
    console.log("✅ Contract verified successfully!");
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("✅ Contract already verified!");
    } else {
      console.error("❌ Verification failed:", error);
    }
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Replace with your actual deployed addresses
  const USDC_ADDRESS = process.env.USDC_ADDRESS;
  const SWIFTSPLIT_ADDRESS = process.env.SWIFTSPLIT_ADDRESS;
  const TEAMSPLITTER_ADDRESS = process.env.TEAMSPLITTER_ADDRESS;
  
  if (!USDC_ADDRESS || !SWIFTSPLIT_ADDRESS || !TEAMSPLITTER_ADDRESS) {
    console.error("❌ Please set contract addresses in environment variables");
    return;
  }

  console.log("🔍 Starting contract verification...");
  
  // Verify SwiftSplit
  await verify(SWIFTSPLIT_ADDRESS, [
    USDC_ADDRESS,
    ethers.utils.parseUnits("50000", 6) // maxPaymentAmount
  ]);

  // Verify TeamSplitter
  await verify(TEAMSPLITTER_ADDRESS, [
    USDC_ADDRESS,
    ethers.utils.parseUnits("50000", 6) // maxTeamPaymentAmount
  ]);

  console.log("🎉 All contracts verified!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification script failed:", error);
    process.exit(1);
  });