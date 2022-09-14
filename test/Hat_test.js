const { assert, expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

describe("Component of Hat test", () => {
  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    const Hat = await ethers.getContractFactory("Hat");
    hat = await Hat.deploy();
    address = hat.address;
  });

  describe("Basic test", async () => {
    it("Mint", async () => {
      await expect(hat.mint(0)).not.to.be.reverted;
      expect(await hat.ownerOf(0)).to.equal(owner.address);
    });
  });
});
