const { expect } = require("chai");
const { ethers } = require("hardhat");

const {
  attrIds,
  names,
  symbols,
  uris,
  PET_NFT,
  HAT_NFT,
  GLASS_NFT,
  HAND_NFT,
  PANTS_NFT,
  CLOTH_NFT,
  Level,
  Species,
  Characteristic,
} = require("./helpers/Data");

const util = ethers.utils;

describe("Basic", () => {
  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    const Hat = await ethers.getContractFactory("Hat");
    hat = await Hat.deploy();

    const Pet = await ethers.getContractFactory("PetTest");
    pet = await Pet.deploy(attrIds, names, symbols, uris);

    userSigner = pet.connect(user);
    ownerSigner = pet.connect(owner);
    await ownerSigner.setComponent("Hat", hat.address);
  });

  describe("Basic", () => {
    beforeEach(async () => {
      await ownerSigner.setIsActive(true);
      await userSigner.mint(0, hat.address, {
        value: util.parseEther("0.005"),
      });
    });

    it("Token of owner should be Pet contract", async () => {
      expect(await hat.ownerOf(0)).to.be.equal(pet.address);

      let SynthesizedTokens = await pet.getSynthesizedTokens(0);
      expect(SynthesizedTokens[0].owner).to.be.eq(user.address);
    });
  });
});
