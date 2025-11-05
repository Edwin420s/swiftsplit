const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SwiftSplit", function () {
  let SwiftSplit;
  let swiftSplit;
  let owner;
  let payer;
  let recipient1;
  let recipient2;
  let usdc;

  beforeEach(async function () {
    [owner, payer, recipient1, recipient2] = await ethers.getSigners();

    const USDC = await ethers.getContractFactory("USDC");
    usdc = await USDC.deploy();
    await usdc.deployed();

    SwiftSplit = await ethers.getContractFactory("SwiftSplit");
    swiftSplit = await SwiftSplit.deploy(usdc.address);
    await swiftSplit.deployed();

    await usdc.mint(payer.address, ethers.utils.parseUnits("1000", 6));
  });

  describe("createPayment", function () {
    it("Should create a payment with multiple recipients", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const amounts = [ethers.utils.parseUnits("100", 6), ethers.utils.parseUnits("200", 6)];
      const invoiceId = "INV-001";

      await usdc.connect(payer).approve(swiftSplit.address, ethers.utils.parseUnits("300", 6));

      await expect(swiftSplit.connect(payer).createPayment(recipients, amounts, invoiceId))
        .to.emit(swiftSplit, "PaymentCreated");
    });
  });

  describe("executePayment", function () {
    it("Should execute a payment and transfer USDC", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const amounts = [ethers.utils.parseUnits("100", 6), ethers.utils.parseUnits("200", 6)];
      const invoiceId = "INV-001";

      await usdc.connect(payer).approve(swiftSplit.address, ethers.utils.parseUnits("300", 6));

      const tx = await swiftSplit.connect(payer).createPayment(recipients, amounts, invoiceId);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'PaymentCreated');
      const paymentId = event.args.paymentId;

      const recipient1BalanceBefore = await usdc.balanceOf(recipient1.address);
      const recipient2BalanceBefore = await usdc.balanceOf(recipient2.address);

      await swiftSplit.connect(payer).executePayment(paymentId);

      const recipient1BalanceAfter = await usdc.balanceOf(recipient1.address);
      const recipient2BalanceAfter = await usdc.balanceOf(recipient2.address);

      expect(recipient1BalanceAfter.sub(recipient1BalanceBefore)).to.equal(amounts[0]);
      expect(recipient2BalanceAfter.sub(recipient2BalanceBefore)).to.equal(amounts[1]);
    });
  });
});