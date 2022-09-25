const { expect } = require("chai");
const { defaultAbiCoder } = require("ethers/lib/utils");
const { utils } = require("ethers");
const { ethers } = require("hardhat");
const {
  attrIds,
  names,
  symbols,
  uris,
  attrBaseURI,
} = require("../contracts/helpers/Data");

describe("Receiver contract test", () => {
  //ethers.utils.id() use to string convert to bytes32 with keccak256
  const MEMBER = utils.id("Member");
  const ADMIN = utils.id("Admin");

  const SLAES_PRICE = 10000;
  const provider = ethers.provider;

  const fromExchange = {
    memberId: 1,
    memberAmout: 6000,
    publisherAmount: 4000,
  };

  beforeEach(async () => {
    [owner, user, market] = await ethers.getSigners();

    const SyntheticLogic = await ethers.getContractFactory("SyntheticLogic");
    const syntheticLogic = await SyntheticLogic.deploy();

    const ReceiverContract = await ethers.getContractFactory(
      "ReceiverContract"
    );
    const Pet = await ethers.getContractFactory("Pet", {
      libraries: {
        SyntheticLogic: syntheticLogic.address,
      },
    });
    pet = await Pet.deploy(attrIds, names, symbols, uris, attrBaseURI);
    receiverContract = await ReceiverContract.deploy(pet.address, 1000);

    const Hat = await ethers.getContractFactory("Hat");
    hat = await Hat.deploy();

    ownerSigner = receiverContract.connect(owner);
  });
  describe("Member", async () => {
    it("Member is exist", async () => {
      expect(await receiverContract.memberExists(0)).to.be.equal(true);
      expect(await receiverContract.getMemberAddress(0)).to.be.equal(
        pet.address
      );
    });

    it("Member is not exist", async () => {
      expect(await receiverContract.memberExists(1)).to.be.equal(false);
    });

    it("Add one member", async () => {
      expect(await receiverContract.memberExists(1)).to.be.equal(false);
      await receiverContract.addMember(hat.address, 500);
      expect(await receiverContract.memberExists(1)).to.be.equal(true);
      expect(await receiverContract.getMemberAddress(1)).to.be.equal(
        hat.address
      );
      expect(await receiverContract.getMemberRoyalties(1)).to.be.equal(500);

      expect(await receiverContract.hasRole(MEMBER, hat.address)).to.be.equal(
        true
      );
    });

    it("Owner deposit ether to contract", async () => {
      let tx = {
        to: receiverContract.address,
        value: utils.parseEther("1"),
      };
      let balance = await provider.getBalance(receiverContract.address);
      expect("0.0").to.be.equal(utils.formatEther(balance));

      await expect(await owner.sendTransaction(tx))
        .to.emit(receiverContract, "Deposit")
        .withArgs(owner.address, utils.parseEther("1"), utils.parseEther("1"));
      await expect(await user.sendTransaction(tx))
        .to.emit(receiverContract, "Deposit")
        .withArgs(user.address, utils.parseEther("1"), utils.parseEther("2"));
    });

    it("Process royalties", async () => {
      let tx = {
        to: receiverContract.address,
        value: 10000,
      };
      await expect(market.sendTransaction(tx)).not.to.be.reverted;
      await receiverContract.addMember(hat.address, 500);
      expect(await receiverContract.memberExists(1)).to.be.equal(true);
      expect(await receiverContract.getMemberAddress(1)).to.be.equal(
        hat.address
      );

      await ownerSigner.processRoyalties();

      let balance = await provider.getBalance(pet.address);
      expect(balance).to.be.equal("1000");
      balance = await provider.getBalance(hat.address);
      expect(balance).to.be.equal("500");
    });

    it("Grant member role with admin", async () => {
      await expect(ownerSigner.addMember(hat.address, 500)).not.to.be.reverted;
      await expect(ownerSigner.grantRole(ADMIN, hat.address)).not.to.be
        .reverted;
      expect(await receiverContract.hasRole(ADMIN, hat.address)).to.be.equal(
        true
      );
    });
    it("Revoke member role with admin", async () => {
      await expect(ownerSigner.addMember(hat.address, 500)).not.to.be.reverted;
      await expect(ownerSigner.grantRole(ADMIN, hat.address)).not.to.be
        .reverted;
      expect(await receiverContract.hasRole(ADMIN, hat.address)).to.be.equal(
        true
      );
      await expect(ownerSigner.revokeRole(ADMIN, hat.address)).not.to.be
        .reverted;
      expect(await receiverContract.hasRole(ADMIN, hat.address)).to.be.equal(
        false
      );
    });
  });
});
