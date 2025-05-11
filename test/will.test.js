const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WillEscrow", function () {
  let willEscrow;
  let owner;
  let beneficiary;
  let otherAccount;

  beforeEach(async function () {
    [owner, beneficiary, otherAccount] = await ethers.getSigners();
    const WillEscrow = await ethers.getContractFactory("WillEscrow");
    willEscrow = await WillEscrow.deploy();
    await willEscrow.deployed();
  });

  describe("Deposit", function () {
    it("Should allow deposit with valid parameters", async function () {
      const releaseTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const depositAmount = ethers.utils.parseEther("1.0");

      await expect(willEscrow.connect(owner).deposit(beneficiary.address, releaseTime, { value: depositAmount }))
        .to.emit(willEscrow, "Deposit")
        .withArgs(owner.address, beneficiary.address, depositAmount, releaseTime);

      const escrow = await willEscrow.getEscrowDetails(owner.address);
      expect(escrow.beneficiary).to.equal(beneficiary.address);
      expect(escrow.amount).to.equal(depositAmount);
      expect(escrow.released).to.equal(false);
    });

    it("Should not allow deposit with zero amount", async function () {
      const releaseTime = Math.floor(Date.now() / 1000) + 3600;
      await expect(willEscrow.connect(owner).deposit(beneficiary.address, releaseTime, { value: 0 }))
        .to.be.revertedWith("Must deposit some ETH");
    });

    it("Should not allow deposit with past release time", async function () {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      await expect(willEscrow.connect(owner).deposit(beneficiary.address, pastTime, { value: ethers.utils.parseEther("1.0") }))
        .to.be.revertedWith("Release time must be in the future");
    });
  });

  describe("Release", function () {
    it("Should allow beneficiary to release funds after release time", async function () {
      const releaseTime = Math.floor(Date.now() / 1000) + 2; // 2 seconds from now
      const depositAmount = ethers.utils.parseEther("1.0");

      await willEscrow.connect(owner).deposit(beneficiary.address, releaseTime, { value: depositAmount });

      // Wait for release time
      await new Promise(resolve => setTimeout(resolve, 3000));

      const initialBalance = await ethers.provider.getBalance(beneficiary.address);
      await willEscrow.connect(beneficiary).releaseFunds(owner.address);
      const finalBalance = await ethers.provider.getBalance(beneficiary.address);

      expect(finalBalance.sub(initialBalance)).to.equal(depositAmount);
    });

    it("Should not allow non-beneficiary to release funds", async function () {
      const releaseTime = Math.floor(Date.now() / 1000) + 3600;
      const depositAmount = ethers.utils.parseEther("1.0");

      await willEscrow.connect(owner).deposit(beneficiary.address, releaseTime, { value: depositAmount });

      await expect(willEscrow.connect(otherAccount).releaseFunds(owner.address))
        .to.be.revertedWith("Only beneficiary can release");
    });
  });
}); 