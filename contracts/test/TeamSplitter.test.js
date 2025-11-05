const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TeamSplitter", function () {
  let TeamSplitter;
  let teamSplitter;
  let owner;
  let payer;
  let member1;
  let member2;
  let member3;
  let usdc;

  beforeEach(async function () {
    [owner, payer, member1, member2, member3] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy(6);
    await usdc.deployed();

    TeamSplitter = await ethers.getContractFactory("TeamSplitter");
    teamSplitter = await TeamSplitter.deploy(usdc.address);
    await teamSplitter.deployed();

    await usdc.mint(payer.address, ethers.utils.parseUnits("1000", 6));
  });

  describe("createTeam", function () {
    it("Should create a team with correct shares", async function () {
      const members = [member1.address, member2.address, member3.address];
      const shares = [5000, 3000, 2000]; // 50%, 30%, 20%
      const teamName = "Development Team";

      const tx = await teamSplitter.createTeam(members, shares, teamName);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'TeamCreated');
      const teamId = event.args.teamId;

      const team = await teamSplitter.getTeam(teamId);
      
      expect(team.name).to.equal(teamName);
      expect(team.members.length).to.equal(3);
      expect(team.shares[0]).to.equal(5000);
      expect(team.owner).to.equal(owner.address);
    });
  });

  describe("executeTeamPayment", function () {
    it("Should split payment according to shares", async function () {
      const members = [member1.address, member2.address];
      const shares = [7000, 3000]; // 70%, 30%
      
      const tx = await teamSplitter.createTeam(members, shares, "Test Team");
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'TeamCreated');
      const teamId = event.args.teamId;

      const totalAmount = ethers.utils.parseUnits("100", 6);
      await usdc.connect(payer).approve(teamSplitter.address, totalAmount);

      const member1BalanceBefore = await usdc.balanceOf(member1.address);
      const member2BalanceBefore = await usdc.balanceOf(member2.address);

      await teamSplitter.connect(payer).executeTeamPayment(teamId, totalAmount, "INV-001");

      const member1BalanceAfter = await usdc.balanceOf(member1.address);
      const member2BalanceAfter = await usdc.balanceOf(member2.address);

      expect(member1BalanceAfter.sub(member1BalanceBefore)).to.equal(ethers.utils.parseUnits("70", 6));
      expect(member2BalanceAfter.sub(member2BalanceBefore)).to.equal(ethers.utils.parseUnits("30", 6));
    });
  });
});