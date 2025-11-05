const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SwiftSplit Integration", function () {
  let SwiftSplit, TeamSplitter, MockUSDC;
  let swiftSplit, teamSplitter, usdc;
  let owner, client, freelancer1, freelancer2, freelancer3;

  beforeEach(async function () {
    [owner, client, freelancer1, freelancer2, freelancer3] = await ethers.getSigners();

    // Deploy MockUSDC
    MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy(6);
    await usdc.deployed();

    // Deploy SwiftSplit
    SwiftSplit = await ethers.getContractFactory("SwiftSplit");
    swiftSplit = await SwiftSplit.deploy(usdc.address, ethers.utils.parseUnits("50000", 6));
    await swiftSplit.deployed();

    // Deploy TeamSplitter
    TeamSplitter = await ethers.getContractFactory("TeamSplitter");
    teamSplitter = await TeamSplitter.deploy(usdc.address, ethers.utils.parseUnits("50000", 6));
    await teamSplitter.deployed();

    // Fund client
    await usdc.mint(client.address, ethers.utils.parseUnits("10000", 6));
  });

  describe("End-to-End Workflow", function () {
    it("Should handle complete freelance payment workflow", async function () {
      // Step 1: Client approves contracts
      await usdc.connect(client).approve(swiftSplit.address, ethers.utils.parseUnits("5000", 6));
      await usdc.connect(client).approve(teamSplitter.address, ethers.utils.parseUnits("5000", 6));

      // Step 2: Create individual payment
      const recipients = [freelancer1.address];
      const amounts = [ethers.utils.parseUnits("1000", 6)];
      
      const tx1 = await swiftSplit.connect(client).createPayment(recipients, amounts, "INV-001");
      const receipt1 = await tx1.wait();
      const event1 = receipt1.events.find(e => e.event === 'PaymentCreated');
      const paymentId = event1.args.paymentId;

      // Step 3: Execute individual payment
      await swiftSplit.connect(client).executePayment(paymentId);
      
      // Verify payment
      const payment = await swiftSplit.getPayment(paymentId);
      expect(payment.status).to.equal(1); // COMPLETED

      // Step 4: Create team
      const teamTx = await teamSplitter.connect(client).createTeam(
        [freelancer1.address, freelancer2.address, freelancer3.address],
        [4000, 3500, 2500], // 40%, 35%, 25%
        "Web Dev Team"
      );
      const teamReceipt = await teamTx.wait();
      const teamEvent = teamReceipt.events.find(e => e.event === 'TeamCreated');
      const teamId = teamEvent.args.teamId;

      // Step 5: Execute team payment
      const teamPaymentTx = await teamSplitter.connect(client).executeTeamPayment(
        teamId,
        ethers.utils.parseUnits("2000", 6),
        "INV-002"
      );
      await teamPaymentTx.wait();

      // Verify balances
      const balance1 = await usdc.balanceOf(freelancer1.address);
      const balance2 = await usdc.balanceOf(freelancer2.address);
      const balance3 = await usdc.balanceOf(freelancer3.address);

      expect(balance1).to.equal(ethers.utils.parseUnits("1800", 6)); // 1000 + 800
      expect(balance2).to.equal(ethers.utils.parseUnits("700", 6));  // 700
      expect(balance3).to.equal(ethers.utils.parseUnits("500", 6));  // 500
    });

    it("Should handle payment failures gracefully", async function () {
      // Try to create payment with insufficient allowance
      const recipients = [freelancer1.address];
      const amounts = [ethers.utils.parseUnits("1000", 6)];
      
      await usdc.connect(client).approve(swiftSplit.address, ethers.utils.parseUnits("500", 6));
      
      await expect(
        swiftSplit.connect(client).createPayment(recipients, amounts, "INV-003")
      ).to.be.revertedWith("Insufficient allowance");
    });
  });

  describe("Security Features", function () {
    it("Should allow pausing and unpausing", async function () {
      await swiftSplit.pause();
      
      const recipients = [freelancer1.address];
      const amounts = [ethers.utils.parseUnits("100", 6)];
      await usdc.connect(client).approve(swiftSplit.address, amounts[0]);
      
      await expect(
        swiftSplit.connect(client).createPayment(recipients, amounts, "INV-004")
      ).to.be.revertedWith("Pausable: paused");
      
      await swiftSplit.unpause();
      
      // Should work after unpausing
      await swiftSplit.connect(client).createPayment(recipients, amounts, "INV-004");
    });

    it("Should enforce maximum payment limits", async function () {
      const recipients = [freelancer1.address];
      const amounts = [ethers.utils.parseUnits("60000", 6)]; // Exceeds max
      
      await usdc.connect(client).approve(swiftSplit.address, amounts[0]);
      
      await expect(
        swiftSplit.connect(client).createPayment(recipients, amounts, "INV-005")
      ).to.be.revertedWith("Payment amount exceeds maximum");
    });
  });
});