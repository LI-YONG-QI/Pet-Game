const { expect } = require("chai");
const { ethers } = require("hardhat");
const { hatBaseURI, emptyAddress, hatTokenId } = require("../../helpers/Data");

describe("Component of Hat test", () => {
  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    const Hat = await ethers.getContractFactory("Hat");
    hat = await Hat.deploy();
    await expect(hat.setBaseURI(hatBaseURI)).not.to.be.reverted;
  });

  describe("Basic test", async () => {
    it("Mint", async () => {
      await expect(hat.mint()).not.to.be.reverted;
      expect(await hat.ownerOf(hatTokenId)).to.equal(owner.address);
      expect(await hat.tokenURI(hatTokenId)).to.equal(
        hatBaseURI + hatTokenId + ".json"
      );
      expect(await hat.getCurrentTokenId()).to.equal(hatTokenId + 1);

      let subToken = await hat.getSubTokens(hatTokenId);
      expect(subToken.primaryToken).to.be.equal(emptyAddress);
      expect(subToken.primaryTokenId).to.be.equal(0);
    });
  });
});
