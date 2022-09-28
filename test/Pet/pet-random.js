const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  attrIds,
  names,
  symbols,
  uris,
  attrBaseURI,
  tokenId,
  _tokenId,
  Characteristic,
  MINT_PRICE,
  baseURI,
  _chainlinkParams,
} = require("../../helpers/Data");

describe("Pet random number test", () => {
  beforeEach(async () => {
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
      VrfCoordinatorV2Mock.address,
      _chainlinkParams
    );
  });
  it("Pet receive random number", async () => {
    await VrfCoordinatorV2Mock.addConsumer(1, pet.address);
    let tx = await pet.requestRandomWords();
    let { events } = await tx.wait();
    let [reqId] = events.filter((x) => x.event === "RequestedRandomness")[0]
      .args;
    await expect(VrfCoordinatorV2Mock.fulfillRandomWords(reqId, pet.address))
      .to.emit(VrfCoordinatorV2Mock, "RandomWordsFulfilled")
      .withArgs(reqId, reqId, 0, true);

    await expect(pet.setIsActive(baseURI, true)).not.to.be.reverted;

    await expect(
      pet.connect(user).mint({ value: ethers.utils.parseEther(MINT_PRICE) })
    ).not.to.be.reverted;
    let characteristic = await pet.textOf(tokenId, Characteristic);

    await expect(
      pet.connect(user).mint({ value: ethers.utils.parseEther(MINT_PRICE) })
    ).not.to.be.reverted;
    let _characteristic = await pet.textOf(_tokenId, Characteristic);

    console.log(`Characteristic of tokenId 0 is ${characteristic}`);
    console.log(`Characteristic of tokenId 1 is ${_characteristic}`);
    expect(characteristic, _characteristic).not.to.be.true;
  });
});
