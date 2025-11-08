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
  let nonMember;
  let usdc;

  beforeEach(async function () {
    [owner, payer, member1, member2, member3, nonMember] = await ethers.getSigners();

    // Use external USDC for testing (in real tests, this would be a test USDC)
    // For now, we'll skip USDC-dependent tests or use a mock setup
    // usdc = await ethers.getContractAt("IERC20", "0xA0b86a33E6441e88C5F2712C3E9b74B5F0c5c6d8"); // Example mainnet USDC

    // Deploy TeamSplitter
    TeamSplitter = await ethers.getContractFactory("TeamSplitter");
    teamSplitter = await TeamSplitter.deploy(usdc.address, ethers.parseUnits("50000", 6));
    await teamSplitter.deployed();

    // Fund payer
    await usdc.mint(payer.address, ethers.parseUnits("10000", 6));
  });

  describe("createTeam", function () {
    it("Should create a team with correct shares", async function () {
      const members = [member1.address, member2.address, member3.address];
      const shares = [5000, 3000, 2000]; // 50%, 30%, 20%
      const teamName = "Development Team";

      const tx = await teamSplitter.createTeam(teamName, members, shares);

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'TeamCreated');
      const teamId = event.args.teamId;

      const team = await teamSplitter.getTeam(teamId);
      
      expect(team.name).to.equal(teamName);
      expect(team.members.length).to.equal(3);
      expect(team.shares[0]).to.equal(5000);
      expect(team.shares[1]).to.equal(3000);
      expect(team.shares[2]).to.equal(2000);
      expect(team.owner).to.equal(owner.address);
      expect(team.active).to.be.true;
    });

    it("Should fail if shares don't total 100%", async function () {
      const members = [member1.address, member2.address];
      const shares = [5000, 4000]; // 90% total - should fail

      await expect(
        teamSplitter.createTeam("Invalid Team", members, shares)
      ).to.be.revertedWith("Total shares must equal 10000 (100%)");
    });

    it("Should fail with too many team members", async function () {
      const members = Array(21).fill(member1.address); // 21 members
      const shares = Array(21).fill(476); // ~4.76% each

      await expect(
        teamSplitter.createTeam("Large Team", members, shares)
      ).to.be.revertedWith("Too many team members");
    });
  });

  describe("executeTeamPayment", function () {
    let teamId;

    beforeEach(async function () {
      const members = [member1.address, member2.address];
      const shares = [7000, 3000]; // 70%, 30%
      
      const tx = await teamSplitter.createTeam("Test Team", members, shares);

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'TeamCreated');
      teamId = event.args.teamId;

      await usdc.connect(payer).approve(teamSplitter.address, ethers.parseUnits("10000", 6));
    });

    it("Should split payment according to shares", async function () {
      const totalAmount = ethers.parseUnits("100", 6);

      const member1BalanceBefore = await usdc.balanceOf(member1.address);
      const member2BalanceBefore = await usdc.balanceOf(member2.address);

      await teamSplitter.connect(payer).executeTeamPayment(teamId, totalAmount, "INV-001");

      const member1BalanceAfter = await usdc.balanceOf(member1.address);
      const member2BalanceAfter = await usdc.balanceOf(member2.address);

      expect(BigInt(member1BalanceAfter) - BigInt(member1BalanceBefore)).to.equal(BigInt(ethers.parseUnits("70", 6)));
      expect(BigInt(member2BalanceAfter) - BigInt(member2BalanceBefore)).to.equal(BigInt(ethers.parseUnits("30", 6)));
    });

    it("Should fail if team is inactive", async function () {
      await teamSplitter.deactivateTeam(teamId);

      await expect(
        teamSplitter.connect(payer).executeTeamPayment(teamId, ethers.parseUnits("100", 6), "INV-002")
      ).to.be.revertedWith("Team is not active");
    });

    it("Should fail if amount exceeds maximum", async function () {
      const excessAmount = ethers.parseUnits("60000", 6);

      await expect(
        teamSplitter.connect(payer).executeTeamPayment(teamId, excessAmount, "INV-003")
      ).to.be.revertedWith("Amount exceeds maximum");
    });
  });

  describe("team management", function () {
    let teamId;

    beforeEach(async function () {
      const members = [member1.address, member2.address];
      const shares = [6000, 4000];
      
      const tx = await teamSplitter.createTeam("Management Team", members, shares);

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'TeamCreated');
      teamId = event.args.teamId;
    });

    it("Should update team members and shares", async function () {
      const newMembers = [member1.address, member2.address, member3.address];
      const newShares = [5000, 3000, 2000];

      await teamSplitter.updateTeam(teamId, newMembers, newShares);

      const team = await teamSplitter.getTeam(teamId);
      expect(team.members.length).to.equal(3);
      expect(team.shares[2]).to.equal(2000);
    });

    it("Should deactivate and activate team", async function () {
      await teamSplitter.deactivateTeam(teamId);
      
      let team = await teamSplitter.getTeam(teamId);
      expect(team.active).to.be.false;

      await teamSplitter.activateTeam(teamId);
      
      team = await teamSplitter.getTeam(teamId);
      expect(team.active).to.be.true;
    });

    it("Should only allow owner to update team", async function () {
      const newMembers = [member1.address];
      const newShares = [10000];

      await expect(
        teamSplitter.connect(nonMember).updateTeam(teamId, newMembers, newShares)
      ).to.be.revertedWith("Not team owner");
    });
  });

  describe("emergency functions", function () {
    let teamId;

    beforeEach(async function () {
      const members = [member1.address, member2.address];
      const shares = [5000, 5000];
      
      const tx = await teamSplitter.createTeam("Emergency Team", members, shares);

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'TeamCreated');
      teamId = event.args.teamId;
    });

    it("Should allow owner to emergency deactivate team", async function () {
      await teamSplitter.emergencyDeactivateTeam(teamId);

      const team = await teamSplitter.getTeam(teamId);
      expect(team.active).to.be.false;
    });

    it("Should not allow non-owner to emergency deactivate", async function () {
      await expect(
        teamSplitter.connect(nonMember).emergencyDeactivateTeam(teamId)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("getter functions", function () {
    let teamId;

    beforeEach(async function () {
      const members = [member1.address, member2.address, member3.address];
      const shares = [4000, 3500, 2500];
      
      const tx = await teamSplitter.createTeam("Getter Test Team", members, shares);

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'TeamCreated');
      teamId = event.args.teamId;
    });

    it("Should return user teams", async function () {
      const userTeams = await teamSplitter.getUserTeams(member1.address);
      expect(userTeams.length).to.equal(1);
      expect(userTeams[0]).to.equal(teamId);
    });

    it("Should return team member count", async function () {
      const count = await teamSplitter.getTeamMemberCount(teamId);
      expect(count).to.equal(3);
    });
  });
});