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
      await hat.mint(0, 0);
      expect(await hat.ownerOf(0)).to.equal(owner.address);
    });
  });
});
