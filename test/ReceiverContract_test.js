const { expect } = require("chai");
const { defaultAbiCoder } = require("ethers/lib/utils");
const { utils } = require("ethers");
const { ethers } = require("hardhat");
const { attrIds, names, symbols, uris } = require("./helpers/Data");

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
    const ReceiverContract = await ethers.getContractFactory(
      "ReceiverContract"
    );
    const Pet2 = await ethers.getContractFactory("Pet2");
    const Pet = await ethers.getContractFactory("Pet");
    pet2 = await Pet2.deploy();
    pet = await Pet.deploy(attrIds, names, symbols, uris);
    receiverContract = await ReceiverContract.deploy(pet.address, 1000);

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
      await receiverContract.addMember(pet2.address, 500);
      expect(await receiverContract.memberExists(1)).to.be.equal(true);

      expect(await receiverContract.hasRole(MEMBER, pet2.address)).to.be.equal(
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

      await expect(ownerSigner.processRoyalties(0))
        .to.emit(receiverContract, "TransferRoyalties")
        .withArgs(owner.address, 1000, pet.address);

      let balance = await provider.getBalance(pet.address);
      expect(balance).to.be.equal("1000");
    });

    it("Grant member role with admin", async () => {
      await expect(ownerSigner.addMember(pet2.address, 500)).not.to.be.reverted;
      await expect(ownerSigner.grantRole(ADMIN, pet2.address)).not.to.be
        .reverted;
      expect(await receiverContract.hasRole(ADMIN, pet2.address)).to.be.equal(
        true
      );
    });
    it("Revoke member role with admin", async () => {
      await expect(ownerSigner.addMember(pet2.address, 500)).not.to.be.reverted;
      await expect(ownerSigner.grantRole(ADMIN, pet2.address)).not.to.be
        .reverted;
      expect(await receiverContract.hasRole(ADMIN, pet2.address)).to.be.equal(
        true
      );
      await expect(ownerSigner.revokeRole(ADMIN, pet2.address)).not.to.be
        .reverted;
      expect(await receiverContract.hasRole(ADMIN, pet2.address)).to.be.equal(
        false
      );
    });
  });
});
