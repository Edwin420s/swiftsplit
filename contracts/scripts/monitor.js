const { ethers } = require("hardhat");

class SwiftSplitMonitor {
  constructor(swiftSplitAddress, teamSplitterAddress, usdcAddress) {
    this.swiftSplitAddress = swiftSplitAddress;
    this.teamSplitterAddress = teamSplitterAddress;
    this.usdcAddress = usdcAddress;
    
    this.paymentCount = 0;
    this.teamPaymentCount = 0;
    this.totalVolume = ethers.BigNumber.from(0);
  }

  async initialize() {
    const SwiftSplit = await ethers.getContractFactory("SwiftSplit");
    const TeamSplitter = await ethers.getContractFactory("TeamSplitter");
    const USDC = await ethers.getContractFactory("MockUSDC");

    this.swiftSplit = SwiftSplit.attach(this.swiftSplitAddress);
    this.teamSplitter = TeamSplitter.attach(this.teamSplitterAddress);
    this.usdc = USDC.attach(this.usdcAddress);

    console.log("📊 SwiftSplit Monitor Started");
    console.log(`Monitoring contracts at:`);
    console.log(`- SwiftSplit: ${this.swiftSplitAddress}`);
    console.log(`- TeamSplitter: ${this.teamSplitterAddress}\n`);
  }

  async startMonitoring() {
    // Set up event listeners
    this.swiftSplit.on("PaymentCreated", (paymentId, payer, recipients, amounts, invoiceId, event) => {
      this.paymentCount++;
      const totalAmount = amounts.reduce((sum, amount) => sum.add(amount), ethers.BigNumber.from(0));
      this.totalVolume = this.totalVolume.add(totalAmount);
      
      console.log(`🆕 Payment Created #${this.paymentCount}`);
      console.log(`   Payment ID: ${paymentId}`);
      console.log(`   Payer: ${payer}`);
      console.log(`   Recipients: ${recipients.length}`);
      console.log(`   Total Amount: ${ethers.utils.formatUnits(totalAmount, 6)} USDC`);
      console.log(`   Invoice: ${invoiceId}\n`);
    });

    this.swiftSplit.on("PaymentExecuted", (paymentId, payer, totalAmount, event) => {
      console.log(`✅ Payment Executed`);
      console.log(`   Payment ID: ${paymentId}`);
      console.log(`   Payer: ${payer}`);
      console.log(`   Amount: ${ethers.utils.formatUnits(totalAmount, 6)} USDC\n`);
    });

    this.teamSplitter.on("TeamCreated", (teamId, owner, name, event) => {
      console.log(`👥 Team Created`);
      console.log(`   Team ID: ${teamId}`);
      console.log(`   Owner: ${owner}`);
      console.log(`   Name: ${name}\n`);
    });

    this.teamSplitter.on("TeamPaymentExecuted", (teamId, paymentId, totalAmount, event) => {
      this.teamPaymentCount++;
      this.totalVolume = this.totalVolume.add(totalAmount);
      
      console.log(`🤝 Team Payment Executed #${this.teamPaymentCount}`);
      console.log(`   Team ID: ${teamId}`);
      console.log(`   Payment ID: ${paymentId}`);
      console.log(`   Amount: ${ethers.utils.formatUnits(totalAmount, 6)} USDC\n`);
    });

    // Periodic stats
    setInterval(() => {
      this.printStats();
    }, 30000); // Every 30 seconds

    console.log("🎯 Monitor active. Press Ctrl+C to stop.\n");
  }

  async printStats() {
    console.log("📈 Real-time Stats:");
    console.log(`   Total Payments: ${this.paymentCount}`);
    console.log(`   Total Team Payments: ${this.teamPaymentCount}`);
    console.log(`   Total Volume: ${ethers.utils.formatUnits(this.totalVolume, 6)} USDC`);
    
    try {
      const swiftSplitPaused = await this.swiftSplit.paused();
      const teamSplitterPaused = await this.teamSplitter.paused();
      console.log(`   SwiftSplit Paused: ${swiftSplitPaused}`);
      console.log(`   TeamSplitter Paused: ${teamSplitterPaused}`);
    } catch (error) {
      console.log(`   Status: Monitoring...`);
    }
    console.log("---\n");
  }

  stopMonitoring() {
    this.swiftSplit.removeAllListeners();
    this.teamSplitter.removeAllListeners();
    console.log("🛑 Monitor stopped");
  }
}

async function main() {
  const SWIFTSPLIT_ADDRESS = process.env.SWIFTSPLIT_ADDRESS;
  const TEAMSPLITTER_ADDRESS = process.env.TEAMSPLITTER_ADDRESS;
  const USDC_ADDRESS = process.env.USDC_ADDRESS;

  if (!SWIFTSPLIT_ADDRESS || !TEAMSPLITTER_ADDRESS) {
    console.error("❌ Contract addresses not set in environment");
    return;
  }

  const monitor = new SwiftSplitMonitor(SWIFTSPLIT_ADDRESS, TEAMSPLITTER_ADDRESS, USDC_ADDRESS);
  await monitor.initialize();
  await monitor.startMonitoring();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    monitor.stopMonitoring();
    process.exit(0);
  });
}

main().catch(console.error);