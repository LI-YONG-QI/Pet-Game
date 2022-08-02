const { expect } = require("chai");
const { defaultAbiCoder } = require("ethers/lib/utils");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

describe("Receiver contract test", () => {
  const SLAES_PRICE = 10000;
  const provider = ethers.provider;
  const util = ethers.utils;

  const fromExchange = {
    memberId: 1,
    memberAmout: 6000,
    publisherAmount: 4000,
  };

  beforeEach(async () => {
    [owner, m1] = await ethers.getSigners();
    const ReceiverContract = await ethers.getContractFactory(
      "ReceiverContract"
    );
    const Lens = await ethers.getContractFactory("Lens");
    const Pet = await ethers.getContractFactory("Pet");
    lens = await Lens.deploy();
    pet = await Pet.deploy();
    receiverContract = await ReceiverContract.deploy(pet.address);
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
      expect(await receiverContract.addMember(lens.address));
      expect(await receiverContract.memberExists(1)).to.be.equal(true);
    });

    it("Owner deposit ether to contract", async () => {
      let tx = {
        to: receiverContract.address,
        value: util.parseEther("1"),
      };
      let balance = await provider.getBalance(receiverContract.address);
      expect("0.0").to.be.equal(util.formatEther(balance));

      await expect(await owner.sendTransaction(tx))
        .to.emit(receiverContract, "Deposit")
        .withArgs(
          owner.address,
          ethers.utils.parseEther("1"),
          ethers.utils.parseEther("1")
        );
      await expect(await m1.sendTransaction(tx))
        .to.emit(receiverContract, "Deposit")
        .withArgs(
          m1.address,
          ethers.utils.parseEther("1"),
          ethers.utils.parseEther("2")
        );
    });

    it("Process royalties", async () => {
      //Deposit
      let tx = {
        to: receiverContract.address,
        value: util.parseEther("1"),
      };
      await owner.sendTransaction(tx);

      await receiverContract.addMember(lens.address);
      await expect(
        receiverContract.processRoyalties(
          fromExchange.memberId,
          fromExchange.memberAmout,
          fromExchange.publisherAmount,
          SLAES_PRICE
        )
      )
        .to.emit(receiverContract, "Royalties")
        .withArgs(owner.address, pet.address, lens.address);

      let balance = await provider.getBalance(pet.address);
      expect("4000").to.be.equal(balance);

      balance = await provider.getBalance(lens.address);
      expect("6000").to.be.equal(balance);
    });
  });
});
