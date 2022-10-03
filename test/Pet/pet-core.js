const { expect } = require("chai");
const { ethers } = require("hardhat");

const {
  tokenId,
  tokenURI,
  _tokenId,
  _tokenURI,
  hatBaseURI,
  MINT_PRICE,
  baseURI,
  emptyAddress,
  _chainlinkParams,
  VrfAddress,
  VrfParams,
} = require("../../helpers/Data");

const {
  attrIds,
  names,
  symbols,
  uris,
  attrBaseURI,
} = require("../../helpers/Data");

const util = ethers.utils;

describe("Pet contract test", () => {
  beforeEach(async () => {
    const URI_SETTER = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes("URI_SETTER")
    );

    [owner, uriSetter, user, userTwo, recipient] = await ethers.getSigners();

    const VRF = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    VrfCoordinatorV2Mock = await VRF.deploy(0, 0);
    await VrfCoordinatorV2Mock.createSubscription();
    await VrfCoordinatorV2Mock.fundSubscription(
      1,
      ethers.utils.parseEther("7")
    );

    const SyntheticLogic = await ethers.getContractFactory("SyntheticLogic");
    const syntheticLogic = await SyntheticLogic.deploy();

    const Pet = await ethers.getContractFactory("Pet", {
      libraries: {
        SyntheticLogic: syntheticLogic.address,
      },
    });
    pet = await Pet.deploy(
      attrIds,
      names,
      symbols,
      uris,
      attrBaseURI,
      VrfAddress,
      VrfParams
    );

    const Hat = await ethers.getContractFactory("Hat");
    hat = await Hat.deploy();

    const Hand = await ethers.getContractFactory("Hand");
    hand = await Hand.deploy();

    await pet.setComponents("Hat", hat.address);
    await pet.setComponents("Hand", hand.address);
    await pet.grantRole(URI_SETTER, uriSetter.address);

    await hat.setBaseURI(hatBaseURI);
    await hat.connect(user).setApprovalForAll(pet.address, true);
  });

  describe("Basic ERC721 function test", async () => {
    it("Mint function test", async () => {
      //Expect
      await expect(pet.connect(user).setIsActive(true, baseURI)).to.be.reverted;
      await expect(pet.connect(owner).setIsActive(true, baseURI)).not.to.be
        .reverted;
      await pet.connect(user).mint({
        value: util.parseEther(MINT_PRICE),
      });
      await expect(
        pet.connect(owner).mint({
          value: util.parseEther(MINT_PRICE),
        })
      )
        .to.emit(pet, "Transfer")
        .withArgs(emptyAddress, owner.address, _tokenId);
      expect(await pet.ownerOf(tokenId)).to.equal(user.address);
      expect(await pet["balanceOf(address)"](user.address)).to.equal(1);
      expect(await pet.tokenURI(tokenId)).to.equal(tokenURI);

      expect(await pet.ownerOf(_tokenId)).to.equal(owner.address);
      expect(await pet["balanceOf(address)"](owner.address)).to.equal(1);
      expect(await pet.tokenURI(_tokenId)).to.equal(_tokenURI);
    });

    it("Call setBaseURI() from owner", async () => {
      //Init
      await pet.connect(owner).setIsActive(true, baseURI);
      await pet.connect(user).mint({
        value: util.parseEther(MINT_PRICE),
      });
      expect(await pet.tokenURI(tokenId)).to.be.equal(tokenURI);

      //Expect
      await expect(pet.connect(owner).setBaseURI("http://testURI/")).not.to.be
        .reverted;
      expect(await pet.tokenURI(tokenId)).to.be.equal("http://testURI/0.json");
    });

    it("Error if caller of setBaseURI() is not URI_SETTER", async () => {
      await expect(pet.connect(userTwo).setBaseURI("http://testURI/")).to.be
        .reverted;
    });
  });
});
