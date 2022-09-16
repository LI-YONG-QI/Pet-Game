const { assert, expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

const {
  Level,
  Species,
  Characteristic,
  attrIds,
  names,
  symbols,
  uris,
  tokenId,
  tokenURI,
  _tokenId,
  _tokenURI,
  hatTokenId,
  hatBaseURI,
  _hatTokenId,
  MINT_PRICE,
  PET_NFT,
  baseURI,
  attrBaseURI,
  emptyAddress,
  updateTokenURI,
  RATIO,
  SLAES_PRICE,
} = require("../contracts/helpers/Data");

//It is TDD test
const _INTERFACE_ID_ERC165 = "0x01ffc9a7";
const _INTERFACE_ID_ROYALTIES_EIP2981 = "0x2a55205a";
const _INTERFACE_ID_ERC721 = "0x80ac58cd";

const util = ethers.utils;

describe("Pet contract test", () => {
  let owner;
  let user;
  let pet;

  beforeEach(async () => {
    [owner, user, userTwo, recipient] = await ethers.getSigners();

    const SyntheticLogic = await ethers.getContractFactory("SyntheticLogic");
    const syntheticLogic = await SyntheticLogic.deploy();

    const Pet = await ethers.getContractFactory("Pet", {
      libraries: {
        SyntheticLogic: syntheticLogic.address,
      },
    });
    pet = await Pet.deploy(attrIds, names, symbols, uris, attrBaseURI);

    const Hat = await ethers.getContractFactory("Hat");
    hat = await Hat.deploy();

    const Hand = await ethers.getContractFactory("Hand");
    hand = await Hand.deploy();

    userSigner = pet.connect(user);
    ownerSigner = pet.connect(owner);

    await pet.setComponents("Hat", hat.address);
    await pet.setComponents("Hand", hand.address);

    await hat.setBaseURI(hatBaseURI);

    await hat.connect(user).setApprovalForAll(pet.address, true);
  });

  describe("Basic ERC721 function test", async () => {
    it("Mint function test", async () => {
      //Expect
      await expect(userSigner.setIsActive(true, baseURI)).to.be.reverted;
      await expect(ownerSigner.setIsActive(true, baseURI)).not.to.be.reverted;
      await userSigner.mint(tokenId, {
        value: util.parseEther(MINT_PRICE),
      });
      await expect(
        ownerSigner.mint(_tokenId, {
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
      await ownerSigner.setIsActive(true, baseURI);
      await userSigner.mint(tokenId, {
        value: util.parseEther(MINT_PRICE),
      });
      expect(await pet.tokenURI(tokenId)).to.be.equal(tokenURI);

      //Expect
      await expect(ownerSigner.setBaseURI("http://testURI/")).not.to.be
        .reverted;
      expect(await pet.tokenURI(tokenId)).to.be.equal("http://testURI/0.json");
    });

    it("Error if caller of setBaseURI() is not owner", async () => {
      await expect(userSigner.setBaseURI("http://testURI/")).to.be.reverted;
    });
  });

  describe("ERC3664 function test", async () => {
    beforeEach(async () => {
      await ownerSigner.setIsActive(true, baseURI);
      await userSigner.mint(tokenId, {
        value: util.parseEther(MINT_PRICE),
      });
    });

    describe("Basic function test", () => {
      it("Component ownerOf and balanceOf", async () => {
        expect(await hat.ownerOf(hatTokenId)).to.be.eq(pet.address);
        expect(await hat["balanceOf(address)"](pet.address)).to.be.eq(1);
      });

      it("Mint multiple token", async () => {
        await userSigner.mint(_tokenId, {
          value: util.parseEther(MINT_PRICE),
        });
        expect(await hat.ownerOf(_hatTokenId)).to.be.eq(pet.address);
        expect(await hat["balanceOf(address)"](pet.address)).to.be.eq(2);
      });
    });

    describe("Separate", () => {
      it("Separate hat from token", async () => {
        //Init => User mints two tokens
        await userSigner.mint(_tokenId, {
          value: util.parseEther(MINT_PRICE),
        });
        //Expect
        expect(await pet.primaryAttributeOf(tokenId)).to.equal(PET_NFT);

        await expect(
          userSigner.separateOne(
            tokenId,
            hatTokenId,
            hat.address,
            updateTokenURI
          )
        )
          .to.emit(hat, "Transfer")
          .withArgs(pet.address, user.address, hatTokenId);

        await expect(
          userSigner.separateOne(
            _tokenId,
            _hatTokenId,
            hat.address,
            updateTokenURI
          )
        )
          .to.emit(pet, "SetTokenURI")
          .withArgs(user.address, _tokenId, updateTokenURI);

        expect(await pet.ownerOf(tokenId)).to.equal(user.address);
        expect(await pet["balanceOf(address)"](user.address)).to.equal(2);
        expect(await pet.tokenURI(tokenId)).to.equal(updateTokenURI);

        expect(await hat["balanceOf(address)"](user.address)).to.equal(2);
        expect(await hat.tokenURI(hatTokenId)).to.equal(hatBaseURI + "0.json");
      });

      it("Error if execute separateOne() from user that not the owner of token", async () => {
        await expect(
          ownerSigner.separateOne(
            tokenId,
            hatTokenId,
            hat.address,
            updateTokenURI
          )
        ).to.be.revertedWith("caller is not token owner nor approved");
        await expect(
          pet
            .connect(userTwo)
            .separateOne(tokenId, hatTokenId, hat.address, updateTokenURI)
        ).to.be.revertedWith("caller is not token owner nor approved");
      });

      it("Error if execute separateOne() when subToken is separated", async () => {
        await userSigner.separateOne(
          tokenId,
          hatTokenId,
          hat.address,
          updateTokenURI
        );
        await expect(
          userSigner.separateOne(
            tokenId,
            hatTokenId,
            hat.address,
            updateTokenURI
          )
        ).to.be.reverted;
      });

      it("Check URI of subToken after separate are same", async () => {
        //before
        expect(await hat.tokenURI(hatTokenId)).to.equal(hatBaseURI + "0.json");

        //after
        await userSigner.separateOne(
          tokenId,
          hatTokenId,
          hat.address,
          updateTokenURI
        );
        expect(await hat.tokenURI(hatTokenId)).to.equal(hatBaseURI + "0.json");
      });
    });

    describe("Transfer", async () => {
      it("Transfer the Pet NFT", async () => {
        await expect(
          userSigner["safeTransferFrom(address,address,uint256)"](
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
        await userSigner["safeTransferFrom(address,address,uint256)"](
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
        await pet.connect(userTwo).mint(_tokenId, {
          value: util.parseEther(MINT_PRICE),
        });

        await pet
          .connect(userTwo)
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
        await userSigner.separateOne(
          tokenId,
          hatTokenId,
          hat.address,
          updateTokenURI
        );

        //Expect
        await expect(
          hat
            .connect(user)
            .transferFrom(user.address, userTwo.address, hatTokenId)
        )
          .to.emit(hat, "Transfer")
          .withArgs(user.address, userTwo.address, hatTokenId);

        await expect(
          userSigner.combine(
            tokenId,
            [_hatTokenId],
            [hat.address],
            updateTokenURI
          )
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
          userSigner.combine(
            tokenId,
            [_hatTokenId],
            [hat.address],
            updateTokenURI
          )
        ).to.be.revertedWith("duplicate sub token type");
      });

      // Legacy, because component contract not contain "combine" function
      // it("Error if primary attribute of token is not PET", async () => {
      //   await userSigner.separateOne(
      //     tokenId,
      //     hatTokenId,
      //     hat.address,
      //     updateTokenURI
      //   );

      //   await expect(
      //     userSigner.combine(
      //       hatTokenId,
      //       [_hatTokenId],
      //       [hat.address],
      //       updateTokenURI
      //     )
      //   ).to.be.revertedWith("only support primary token been combine");
      // });

      it("Error if primary attribute of subToken is PET", async () => {
        await pet
          .connect(userTwo)
          .transferFrom(userTwo.address, user.address, _tokenId);
        await expect(
          userSigner.combine(tokenId, [_tokenId], [pet.address], updateTokenURI)
        ).to.be.revertedWith("not support combine between primary token");
      });

      it("Error if caller is not sub token owner", async () => {
        expect(await hat.ownerOf(_hatTokenId)).to.equal(user.address);
        await hat
          .connect(user)
          .transferFrom(user.address, userTwo.address, _hatTokenId);

        await expect(
          userSigner.combine(
            tokenId,
            [_hatTokenId],
            [hat.address],
            updateTokenURI
          )
        ).to.be.revertedWith("caller is not sub token owner");
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

        await userSigner.upgrade(tokenId, Level, 1);
        expect(await pet.levelOf(tokenId, Level)).to.equal(1);
      });

      it("Error if caller of upgrade() is not approved ", async () => {
        await expect(ownerSigner.upgrade(tokenId, Level, 1)).to.be.revertedWith(
          "caller is not token owner nor approved"
        );
      });

      // Legacy the component and token not in same contract
      // If need to add attribute, need to update component contract
      // it("Upgrade level of subToken", async () => {
      //   expect(await pet.levelOf(hatTokenId, Level)).to.equal(0);
      //   await userSigner.upgrade(hatTokenId, Level, 1);
      //   expect(await pet.levelOf(hatTokenId, Level)).to.equal(1);
      // });

      it("Error if upgrade exceed two level", async () => {
        expect(await pet.levelOf(tokenId, Level)).to.equal(0);
        await expect(userSigner.upgrade(tokenId, Level, 2)).to.be.revertedWith(
          "ERC3664Upgradable: invalid level"
        );
      });

      it("Error if upgrade exceed maximum level", async () => {
        for (let i = 1; i <= 11; i++) {
          if (i <= 10) {
            await userSigner.upgrade(tokenId, Level, i);
          } else {
            await expect(
              userSigner.upgrade(tokenId, Level, i)
            ).to.be.revertedWith(
              "ERC3664Upgradable: exceeded the maximum level"
            );
          }
        }
      });

      // Legacy
      // it("Upgrade level with subToken before separate", async () => {
      //   await expect(userSigner.upgrade(hatTokenId, Level, 1)).not.to.be
      //     .reverted;
      //   await expect(
      //     userSigner.separateOne(
      //       tokenId,
      //       hatTokenId,
      //       hat.address,
      //       updateTokenURI
      //     )
      //   ).not.to.be.reverted;
      //   expect(await pet.levelOf(hatTokenId, Level)).to.be.equal(1);
      // });
    });
  });

  describe("Contract wide Royalties test", async () => {
    beforeEach(async () => {
      await ownerSigner.setIsActive(true, baseURI);
    });

    it("Check interface", async () => {
      expect(
        await pet.supportsInterface(_INTERFACE_ID_ERC165),
        "Error Royalties 165"
      ).to.be.true;

      expect(
        await pet.supportsInterface(_INTERFACE_ID_ROYALTIES_EIP2981),
        "Error Royalties 2981"
      ).to.be.true;

      expect(
        await pet.supportsInterface(_INTERFACE_ID_ERC721),
        "Error Royalties 721"
      ).to.be.true;
    });

    it("Token has right royalties when mint", async () => {
      await ownerSigner.setRoyalties(recipient.address, RATIO);
      await userSigner.mint(tokenId, {
        value: util.parseEther(MINT_PRICE),
      });

      let info = await pet.royaltyInfo(0, SLAES_PRICE);
      expect(info[1]).to.be.equal((SLAES_PRICE * RATIO) / 10000);
      expect(info[0]).to.be.equal(recipient.address);
    });
  });
});
