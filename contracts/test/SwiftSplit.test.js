const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SwiftSplit", function () {
  let SwiftSplit;
  let swiftSplit;
  let owner;
  let payer;
  let recipient1;
  let recipient2;
  let recipient3;
  let unauthorized;
  let usdc;

  beforeEach(async function () {
    [owner, payer, recipient1, recipient2, recipient3, unauthorized] = await ethers.getSigners();

    // Use external USDC for testing (in real tests, this would be a test USDC)
    // For now, we'll skip USDC-dependent tests or use a mock setup
    // usdc = await ethers.getContractAt("IERC20", "0xA0b86a33E6441e88C5F2712C3E9b74B5F0c5c6d8"); // Example mainnet USDC

    // Deploy SwiftSplit
    SwiftSplit = await ethers.getContractFactory("SwiftSplit");
    swiftSplit = await SwiftSplit.deploy(usdc.address, ethers.parseUnits("50000", 6));
    await swiftSplit.waitForDeployment();

    // Fund payer
    await usdc.mint(payer.address, ethers.parseUnits("10000", 6));
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await swiftSplit.owner()).to.equal(owner.address);
    });

    it("Should set the correct USDC token", async function () {
      expect(await swiftSplit.usdcToken()).to.equal(usdc.address);
    });

    it("Should set the correct max payment amount", async function () {
      const maxAmount = await swiftSplit.maxPaymentAmount();
      expect(maxAmount).to.equal(ethers.parseUnits("50000", 6));
    });
  });

  describe("createPayment", function () {
    it("Should create a payment with single recipient", async function () {
      const recipients = [recipient1.address];
      const amounts = [ethers.parseUnits("100", 6)];

      const invoiceId = "INV-001";

      await usdc.connect(payer).approve(swiftSplit.address, amounts[0]);

      await expect(swiftSplit.connect(payer).createPayment(recipients, amounts, invoiceId))
        .to.emit(swiftSplit, "PaymentCreated");
    });

    it("Should create a payment with multiple recipients", async function () {
      const recipients = [recipient1.address, recipient2.address, recipient3.address];
      const amounts = [
        ethers.parseUnits("100", 6),
        ethers.parseUnits("200", 6),
        ethers.parseUnits("300", 6)
      ];

      const invoiceId = "INV-002";

      await usdc.connect(payer).approve(swiftSplit.address, ethers.parseUnits("600", 6));

      const tx = await swiftSplit.connect(payer).createPayment(recipients, amounts, invoiceId);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'PaymentCreated');

      expect(event.args.payer).to.equal(payer.address);
      expect(event.args.recipients).to.deep.equal(recipients);
      expect(event.args.amounts).to.deep.equal(amounts);
      expect(event.args.invoiceId).to.equal(invoiceId);
    });

    it("Should fail with mismatched arrays", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const amounts = [ethers.parseUnits("100", 6)]; // Only one amount

      const invoiceId = "INV-003";

      await usdc.connect(payer).approve(swiftSplit.address, amounts[0]);

      await expect(
        swiftSplit.connect(payer).createPayment(recipients, amounts, invoiceId)
      ).to.be.revertedWith("Recipients and amounts length mismatch");
    });

    it("Should fail with zero amount", async function () {
      const recipients = [recipient1.address];
      const amounts = [0];

      const invoiceId = "INV-004";

      await usdc.connect(payer).approve(swiftSplit.address, amounts[0]);

      await expect(
        swiftSplit.connect(payer).createPayment(recipients, amounts, invoiceId)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should fail with invalid recipient", async function () {
      const recipients = [ethers.ZeroAddress];
      const amounts = [ethers.parseUnits("100", 6)];

      const invoiceId = "INV-005";

      await usdc.connect(payer).approve(swiftSplit.address, amounts[0]);

      await expect(
        swiftSplit.connect(payer).createPayment(recipients, amounts, invoiceId)
      ).to.be.revertedWith("Invalid recipient address");
    });

    it("Should fail with insufficient balance", async function () {
      const recipients = [recipient1.address];
      const amounts = [ethers.parseUnits("50000", 6)]; // More than payer has

      const invoiceId = "INV-006";

      await usdc.connect(payer).approve(swiftSplit.address, amounts[0]);

      await expect(
        swiftSplit.connect(payer).createPayment(recipients, amounts, invoiceId)
      ).to.be.revertedWith("Insufficient USDC balance");
    });

    it("Should fail when amount exceeds maximum", async function () {
      const recipients = [recipient1.address];
      const amounts = [ethers.parseUnits("60000", 6)]; // Exceeds max

      const invoiceId = "INV-007";

      await usdc.mint(payer.address, ethers.parseUnits("70000", 6));

      await usdc.connect(payer).approve(swiftSplit.address, amounts[0]);

      await expect(
        swiftSplit.connect(payer).createPayment(recipients, amounts, invoiceId)
      ).to.be.revertedWith("Payment amount exceeds maximum");
    });
  });

  describe("executePayment", function () {
    let paymentId;

    beforeEach(async function () {
      const recipients = [recipient1.address, recipient2.address];
      const amounts = [ethers.parseUnits("100", 6), ethers.parseUnits("200", 6)];

      const invoiceId = "INV-008";

      await usdc.connect(payer).approve(swiftSplit.address, ethers.parseUnits("300", 6));

      const tx = await swiftSplit.connect(payer).createPayment(recipients, amounts, invoiceId);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'PaymentCreated');
      paymentId = event.args.paymentId;
    });

    it("Should execute payment and transfer USDC", async function () {
      const recipient1BalanceBefore = await usdc.balanceOf(recipient1.address);
      const recipient2BalanceBefore = await usdc.balanceOf(recipient2.address);

      await swiftSplit.connect(payer).executePayment(paymentId);

      const recipient1BalanceAfter = await usdc.balanceOf(recipient1.address);
      const recipient2BalanceAfter = await usdc.balanceOf(recipient2.address);

      expect(BigInt(recipient1BalanceAfter) - BigInt(recipient1BalanceBefore)).to.equal(BigInt(ethers.parseUnits("100", 6)));
      expect(BigInt(recipient2BalanceAfter) - BigInt(recipient2BalanceBefore)).to.equal(BigInt(ethers.parseUnits("200", 6)));

      const payment = await swiftSplit.getPayment(paymentId);
      expect(payment.status).to.equal(1); // COMPLETED
    });

    it("Should emit PaymentExecuted event", async function () {
      await expect(swiftSplit.connect(payer).executePayment(paymentId))
        .to.emit(swiftSplit, "PaymentExecuted")
        .withArgs(paymentId, payer.address, ethers.parseUnits("300", 6));
    });

    it("Should fail if payment already executed", async function () {
      await swiftSplit.connect(payer).executePayment(paymentId);

      await expect(
        swiftSplit.connect(payer).executePayment(paymentId)
      ).to.be.revertedWith("Payment already processed");
    });

    it("Should fail if unauthorized user tries to execute", async function () {
      await expect(
        swiftSplit.connect(unauthorized).executePayment(paymentId)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should allow controller to execute payment", async function () {
      // Add unauthorized as controller
      await swiftSplit.setController(unauthorized.address, true);

      await swiftSplit.connect(unauthorized).executePayment(paymentId);

      const payment = await swiftSplit.getPayment(paymentId);
      expect(payment.status).to.equal(1); // COMPLETED
    });
  });

  describe("cancelPayment", function () {
    let paymentId;

    beforeEach(async function () {
      const recipients = [recipient1.address];
      const amounts = [ethers.parseUnits("100", 6)];

      const invoiceId = "INV-009";

      await usdc.connect(payer).approve(swiftSplit.address, amounts[0]);

      const tx = await swiftSplit.connect(payer).createPayment(recipients, amounts, invoiceId);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'PaymentCreated');
      paymentId = event.args.paymentId;
    });

    it("Should cancel payment by payer", async function () {
      await swiftSplit.connect(payer).cancelPayment(paymentId);

      const payment = await swiftSplit.getPayment(paymentId);
      expect(payment.status).to.equal(3); // CANCELLED
    });

    it("Should cancel payment by owner", async function () {
      await swiftSplit.connect(owner).cancelPayment(paymentId);

      const payment = await swiftSplit.getPayment(paymentId);
      expect(payment.status).to.equal(3); // CANCELLED
    });

    it("Should fail if unauthorized user tries to cancel", async function () {
      await expect(
        swiftSplit.connect(unauthorized).cancelPayment(paymentId)
      ).to.be.revertedWith("Not authorized to cancel");
    });

    it("Should fail if payment not pending", async function () {
      await swiftSplit.connect(payer).executePayment(paymentId);

      await expect(
        swiftSplit.connect(payer).cancelPayment(paymentId)
      ).to.be.revertedWith("Payment not pending");
    });
  });

  describe("emergency functions", function () {
    let paymentId;

    beforeEach(async function () {
      const recipients = [recipient1.address];
      const amounts = [ethers.parseUnits("100", 6)];

      const invoiceId = "INV-010";

      await usdc.connect(payer).approve(swiftSplit.address, amounts[0]);

      const tx = await swiftSplit.connect(payer).createPayment(recipients, amounts, invoiceId);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'PaymentCreated');
      paymentId = event.args.paymentId;
    });

    it("Should allow owner to emergency cancel", async function () {
      await swiftSplit.connect(owner).emergencyCancel(paymentId);

      const payment = await swiftSplit.getPayment(paymentId);
      expect(payment.status).to.equal(3); // CANCELLED
    });

    it("Should not allow non-owner to emergency cancel", async function () {
      await expect(
        swiftSplit.connect(unauthorized).emergencyCancel(paymentId)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("pausable functionality", function () {
    it("Should pause and unpause contract", async function () {
      await swiftSplit.pause();
      expect(await swiftSplit.paused()).to.be.true;

      await swiftSplit.unpause();
      expect(await swiftSplit.paused()).to.be.false;
    });

    it("Should not allow payments when paused", async function () {
      await swiftSplit.pause();

      const recipients = [recipient1.address];
      const amounts = [ethers.parseUnits("100", 6)];

      const invoiceId = "INV-011";

      await usdc.connect(payer).approve(swiftSplit.address, amounts[0]);

      await expect(
        swiftSplit.connect(payer).createPayment(recipients, amounts, invoiceId)
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should not allow execution when paused", async function () {
      const recipients = [recipient1.address];
      const amounts = [ethers.parseUnits("100", 6)];

      const invoiceId = "INV-012";

      await usdc.connect(payer).approve(swiftSplit.address, amounts[0]);

      const tx = await swiftSplit.connect(payer).createPayment(recipients, amounts, invoiceId);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'PaymentCreated');
      const paymentId = event.args.paymentId;

      await swiftSplit.pause();

      await expect(
        swiftSplit.connect(payer).executePayment(paymentId)
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("getter functions", function () {
    let paymentId;

    beforeEach(async function () {
      const recipients = [recipient1.address, recipient2.address];
      const amounts = [ethers.parseUnits("150", 6), ethers.parseUnits("250", 6)];

      const invoiceId = "INV-013";

      await usdc.connect(payer).approve(swiftSplit.address, ethers.parseUnits("400", 6));

      const tx = await swiftSplit.connect(payer).createPayment(recipients, amounts, invoiceId);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'PaymentCreated');
      paymentId = event.args.paymentId;
    });

    it("Should return payment details", async function () {
      const payment = await swiftSplit.getPayment(paymentId);

      expect(payment.payer).to.equal(payer.address);
      expect(payment.recipients).to.deep.equal([recipient1.address, recipient2.address]);
      expect(payment.amounts).to.deep.equal([
        ethers.parseUnits("150", 6),
        ethers.parseUnits("250", 6)
      ]);

      expect(payment.invoiceId).to.equal("INV-013");
      expect(payment.status).to.equal(0); // PENDING
    });

    it("Should return payment total", async function () {
      const total = await swiftSplit.getPaymentTotal(paymentId);
      expect(total).to.equal(ethers.parseUnits("400", 6));
    });

    it("Should fail for non-existent payment", async function () {
      const invalidPaymentId = ethers.keccak256(ethers.toUtf8Bytes("invalid"));

      await expect(
        swiftSplit.getPayment(invalidPaymentId)
      ).to.be.revertedWith("Payment does not exist");
    });
  });

  describe("access control", function () {
    it("Should allow owner to set controller", async function () {
      await swiftSplit.setController(unauthorized.address, true);

      const isController = await swiftSplit.authorizedControllers(unauthorized.address);
      expect(isController).to.be.true;
    });

    it("Should not allow non-owner to set controller", async function () {
      await expect(
        swiftSplit.connect(unauthorized).setController(unauthorized.address, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to set max payment amount", async function () {
      const newMax = ethers.parseUnits("75000", 6);

      await swiftSplit.setMaxPaymentAmount(newMax);

      const currentMax = await swiftSplit.maxPaymentAmount();
      expect(currentMax).to.equal(newMax);
    });

    it("Should not allow non-owner to set max payment amount", async function () {
      const newMax = ethers.parseUnits("75000", 6);
      
      await expect(
        swiftSplit.connect(unauthorized).setMaxPaymentAmount(newMax)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});