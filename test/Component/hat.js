const { expect } = require("chai");
const { ethers } = require("hardhat");
const { tokenId, hatBaseURI, emptyAddress } = require("../../helpers/Data");

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
      expect(await hat.ownerOf(tokenId)).to.equal(owner.address);
      expect(await hat.tokenURI(tokenId)).to.equal(
        "https://ipfs.io/ipfs/HatCID/0.json"
      );
      expect(await hat.getCurrentTokenId()).to.equal(1);

      let subToken = await hat.getSubTokens(tokenId);
      expect(subToken.primaryToken).to.be.equal(emptyAddress);
      expect(subToken.primaryTokenId).to.be.equal(0);
    });
  });
});
