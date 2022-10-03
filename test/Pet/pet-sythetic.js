const { expect } = require("chai");
const { ethers } = require("hardhat");
const { utils } = require("ethers");

const {
  Level,
  Species,
  Characteristic,
  tokenId,
  _tokenId,
  hatTokenId,
  hatBaseURI,
  _hatTokenId,
  MINT_PRICE,
  PET_NFT,
  baseURI,
  updateTokenURI,
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

describe("Pet Sythetic", () => {
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

  describe("ERC3664 function test", async () => {
    beforeEach(async () => {
      await pet.connect(owner).setIsActive(true, baseURI);
      await pet.connect(user).mint({
        value: utils.parseEther(MINT_PRICE),
      });
    });

    describe("Basic function test", () => {
      it("Check Pet Token speices and characteristic", async () => {
        let species = await pet.textOf(tokenId, Species);
        species = utils.toUtf8String(utils.arrayify(species));
        expect(species).to.be.equal("Monkey");

        let characteristic = await pet.textOf(tokenId, Characteristic);
        characteristic = utils.toUtf8String(utils.arrayify(characteristic));
        expect(characteristic).to.be.equal("Lazy");
      });
      it("Component ownerOf and balanceOf", async () => {
        expect(await hat.ownerOf(hatTokenId)).to.be.eq(pet.address);
        expect(await hat["balanceOf(address)"](pet.address)).to.be.eq(1);
      });

      it("Mint multiple token", async () => {
        await pet.connect(user).mint({
          value: utils.parseEther(MINT_PRICE),
        });
        expect(await hat.ownerOf(_hatTokenId)).to.be.eq(pet.address);
        expect(await hat["balanceOf(address)"](pet.address)).to.be.eq(2);
      });
    });

    describe("Separate", () => {
      it("Separate hat from token", async () => {
        //Init => pet.connect(user) mints two tokens
        await pet.connect(user).mint({
          value: utils.parseEther(MINT_PRICE),
        });
        //Expect
        expect(await pet.primaryAttributeOf(tokenId)).to.equal(PET_NFT);

        await expect(
          pet
            .connect(uriSetter)
            .separateOne(tokenId, hatTokenId, hat.address, updateTokenURI)
        )
          .to.emit(hat, "Transfer")
          .withArgs(pet.address, user.address, hatTokenId);

        await expect(
          pet
            .connect(uriSetter)
            .separateOne(_tokenId, _hatTokenId, hat.address, updateTokenURI)
        )
          .to.emit(pet, "SetTokenURI")
          .withArgs(uriSetter.address, _tokenId, updateTokenURI);

        expect(await pet["balanceOf(address)"](user.address)).to.equal(2);
        expect(await pet.ownerOf(tokenId)).to.equal(user.address);
        expect(await pet.tokenURI(tokenId)).to.equal(updateTokenURI);

        expect(await hat["balanceOf(address)"](user.address)).to.equal(2);
        expect(await hat.ownerOf(hatTokenId)).to.equal(user.address);
        expect(await hat.tokenURI(hatTokenId)).to.equal(hatBaseURI + "0.json");
      });

      it("Error if execute separateOne() when subToken is separated", async () => {
        await pet
          .connect(uriSetter)
          .separateOne(tokenId, hatTokenId, hat.address, updateTokenURI);
        await expect(
          pet
            .connect(uriSetter)
            .separateOne(tokenId, hatTokenId, hat.address, updateTokenURI)
        ).to.be.reverted;
      });

      it("Check URI of subToken after separate are same", async () => {
        //before
        expect(await hat.tokenURI(hatTokenId)).to.equal(hatBaseURI + "0.json");

        //after
        await pet
          .connect(uriSetter)
          .separateOne(tokenId, hatTokenId, hat.address, updateTokenURI);
        expect(await hat.tokenURI(hatTokenId)).to.equal(hatBaseURI + "0.json");
      });
    });

    describe("Transfer", async () => {
      it("Transfer the Pet NFT", async () => {
        await expect(
          pet
            .connect(user)
            ["safeTransferFrom(address,address,uint256)"](
              user.address,
              recipient.address,
              tokenId
            )
        )
          .to.emit(pet, "Transfer")
          .withArgs(user.address, recipient.address, tokenId);
        expect(await pet.ownerOf(tokenId)).to.be.equal(recipient.address);
      });

      it("Owner of subToken should be update when transfer", async () => {
        await pet
          .connect(user)
          ["safeTransferFrom(address,address,uint256)"](
            user.address,
            recipient.address,
            tokenId
          );

        let synthesizedTokens = await pet.getSynthesizedTokens(tokenId);
        synthesizedTokens.map((item) => {
          expect(item.owner).to.be.equal(recipient.address);
        });
      });

      it("Error if direct transfer subToken that still on the PET", async () => {
        await expect(
          hat
            .connect(user)
            .transferFrom(user.address, recipient.address, hatTokenId)
        ).to.be.reverted;
      });
    });

    describe("Combine", async () => {
      beforeEach(async () => {
        await pet.connect(userTwo).mint({
          value: utils.parseEther(MINT_PRICE),
        });

        await pet
          .connect(uriSetter)
          .separateOne(_tokenId, _hatTokenId, hat.address, updateTokenURI);

        await expect(
          hat
            .connect(userTwo)
            .transferFrom(userTwo.address, user.address, _hatTokenId)
        ).not.to.be.reverted;
      });
      it("Change components with two tokens", async () => {
        //Init
        expect(await hat.ownerOf(_hatTokenId)).to.equal(user.address);
        await pet
          .connect(uriSetter)
          .separateOne(tokenId, hatTokenId, hat.address, updateTokenURI);

        //Expect
        await expect(
          hat
            .connect(user)
            .transferFrom(user.address, userTwo.address, hatTokenId)
        )
          .to.emit(hat, "Transfer")
          .withArgs(user.address, userTwo.address, hatTokenId);

        await expect(
          pet
            .connect(uriSetter)
            .combine(tokenId, [_hatTokenId], [hat.address], updateTokenURI)
        )
          .to.emit(hat, "Transfer")
          .withArgs(user.address, pet.address, _hatTokenId);

        // let subTokens = await pet.getSynthesizedTokens(tokenId);
        // console.log(subTokens);
        // subTokens.map((token) => {
        //   expect([8002, 8003, 8004, 8005, 8006]).to.include(
        //     token.id.toNumber()
        //   );
        // });
      });

      it("Error if combine one component with duplicate attribute", async () => {
        expect(await hat.ownerOf(_hatTokenId)).to.equal(user.address);
        await expect(
          pet
            .connect(uriSetter)
            .combine(tokenId, [_hatTokenId], [hat.address], updateTokenURI)
        ).to.be.revertedWith("duplicate sub token type");
      });

      it("Error if primary attribute of subToken is PET", async () => {
        await pet
          .connect(userTwo)
          .transferFrom(userTwo.address, user.address, _tokenId);
        await expect(
          pet
            .connect(uriSetter)
            .combine(tokenId, [_tokenId], [pet.address], updateTokenURI)
        ).to.be.revertedWith("not support combine between primary token");
      });
    });

    describe("Upgradable and Updatable test", async () => {
      it("attributesOf() test", async () => {
        let attrs = await pet.attributesOf(tokenId);
        attrs.map((attr) => {
          expect([PET_NFT, Level, Species, Characteristic]).to.include(
            attr.toNumber()
          );
        });
      });

      it("Level upgrade", async () => {
        expect(await pet.levelOf(tokenId, Level)).to.equal(0);

        await pet.connect(user).upgrade(tokenId, Level, 1);
        expect(await pet.levelOf(tokenId, Level)).to.equal(1);
      });

      it("Error if caller of upgrade() is not approved ", async () => {
        await expect(
          pet.connect(owner).upgrade(tokenId, Level, 1)
        ).to.be.revertedWith("caller is not token owner nor approved");
      });

      it("Error if upgrade exceed two level", async () => {
        expect(await pet.levelOf(tokenId, Level)).to.equal(0);
        await expect(
          pet.connect(user).upgrade(tokenId, Level, 2)
        ).to.be.revertedWith("ERC3664Upgradable: invalid level");
      });

      it("Error if upgrade exceed maximum level", async () => {
        for (let i = 1; i <= 11; i++) {
          if (i <= 10) {
            await pet.connect(user).upgrade(tokenId, Level, i);
          } else {
            await expect(
              pet.connect(user).upgrade(tokenId, Level, i)
            ).to.be.revertedWith(
              "ERC3664Upgradable: exceeded the maximum level"
            );
          }
        }
      });
    });
  });
  describe("Added new component contract ", async () => {
    beforeEach(async () => {
      const Cloth = await ethers.getContractFactory("Cloth");
      cloth = await Cloth.deploy();

      await pet.connect(owner).setIsActive(true, baseURI);
      await pet.connect(user).mint({
        value: utils.parseEther(MINT_PRICE),
      });

      await cloth.connect(user).setApprovalForAll(pet.address, true);
    });
    it("Combine with new component", async () => {
      await expect(pet.setComponents("Cloth", cloth.address)).not.to.be
        .reverted;
      await expect(cloth.connect(user).mint()).not.to.be.reverted;
      await expect(
        pet
          .connect(uriSetter)
          .combine(tokenId, [0], [cloth.address], updateTokenURI)
      ).not.to.be.reverted;
      const subTokens = await pet.getSynthesizedTokens(tokenId);
      expect(subTokens.length).to.be.eq(3);
    });
  });
});
