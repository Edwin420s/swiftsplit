const { ethers } = require("hardhat");

async function main() {
  const [deployer, client, freelancer1, freelancer2, freelancer3] = await ethers.getSigners();

  const SWIFTSPLIT_ADDRESS = process.env.SWIFTSPLIT_ADDRESS;
  const TEAMSPLITTER_ADDRESS = process.env.TEAMSPLITTER_ADDRESS;
  const USDC_ADDRESS = process.env.USDC_ADDRESS;

  // Load contracts
  const SwiftSplit = await ethers.getContractFactory("SwiftSplit");
  const TeamSplitter = await ethers.getContractFactory("TeamSplitter");
  const USDC = await ethers.getContractFactory("MockUSDC");

  const swiftSplit = SwiftSplit.attach(SWIFTSPLIT_ADDRESS);
  const teamSplitter = TeamSplitter.attach(TEAMSPLITTER_ADDRESS);
  const usdc = USDC.attach(USDC_ADDRESS);

  console.log("🎯 Creating sample data for demo...");

  // Fund client with USDC
  console.log("💰 Funding client account...");
  await usdc.mint(client.address, ethers.utils.parseUnits("5000", 6));

  // Create sample team
  console.log("👥 Creating sample team...");
  const teamTx = await teamSplitter.connect(client).createTeam(
    [freelancer1.address, freelancer2.address, freelancer3.address],
    [5000, 3000, 2000], // 50%, 30%, 20%
    "Web Development Team"
  );
  const teamReceipt = await teamTx.wait();
  const teamEvent = teamReceipt.events.find(e => e.event === 'TeamCreated');
  const teamId = teamEvent.args.teamId;
  console.log(`✅ Team created: ${teamId}`);

  // Approve contracts to spend USDC
  console.log("✅ Approving contracts...");
  await usdc.connect(client).approve(swiftSplit.address, ethers.utils.parseUnits("2000", 6));
  await usdc.connect(client).approve(teamSplitter.address, ethers.utils.parseUnits("2000", 6));

  // Create individual payment
  console.log("💸 Creating individual payment...");
  const paymentTx = await swiftSplit.connect(client).createPayment(
    [freelancer1.address],
    [ethers.utils.parseUnits("500", 6)],
    "INV-DEMO-001"
  );
  const paymentReceipt = await paymentTx.wait();
  const paymentEvent = paymentReceipt.events.find(e => e.event === 'PaymentCreated');
  const paymentId = paymentEvent.args.paymentId;
  console.log(`✅ Payment created: ${paymentId}`);

  // Execute individual payment
  console.log("⚡ Executing individual payment...");
  await swiftSplit.connect(client).executePayment(paymentId);

  // Execute team payment
  console.log("👨‍💻 Executing team payment...");
  await teamSplitter.connect(client).executeTeamPayment(
    teamId,
    ethers.utils.parseUnits("1500", 6),
    "INV-DEMO-002"
  );

  console.log("\n🎉 Sample data created successfully!");
  console.log("📊 Sample Data Summary:");
  console.log(`- Team ID: ${teamId}`);
  console.log(`- Individual Payment ID: ${paymentId}`);
  console.log(`- Freelancer 1: ${freelancer1.address}`);
  console.log(`- Freelancer 2: ${freelancer2.address}`);
  console.log(`- Freelancer 3: ${freelancer3.address}`);
  console.log(`- Client: ${client.address}`);

  // Display final balances
  console.log("\n💰 Final Balances:");
  const balance1 = await usdc.balanceOf(freelancer1.address);
  const balance2 = await usdc.balanceOf(freelancer2.address);
  const balance3 = await usdc.balanceOf(freelancer3.address);
  
  console.log(`Freelancer 1: ${ethers.utils.formatUnits(balance1, 6)} USDC`);
  console.log(`Freelancer 2: ${ethers.utils.formatUnits(balance2, 6)} USDC`);
  console.log(`Freelancer 3: ${ethers.utils.formatUnits(balance3, 6)} USDC`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Sample data creation failed:", error);
    process.exit(1);
  });