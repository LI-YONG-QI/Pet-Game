const { assert, expect } = require("chai");
const { BigNumber } = require("ethers");
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

//It is TDD test
const _INTERFACE_ID_ERC165 = "0x01ffc9a7";
const _INTERFACE_ID_ROYALTIES_EIP2981 = "0x2a55205a";
const _INTERFACE_ID_ERC721 = "0x80ac58cd";

const util = ethers.utils;

describe("Pet contract test", () => {
  //Mock data
  const HAT = 8001;
  const GLASS = 8002;
  const HAND = 8003;
  const PANTS = 8004;
  const CLOTH = 8005;

  const HAT_URI =
    "https://ipfs.io/ipfs/QmVxhYesuZHBqJPa3ZNRVBxJW53kLJS1KiuLfWfd5HQGvS/8001.json";
  const HAT_ONE = 8006;

  const tokenId = 0;
  const tokenIdOne = 1;
  const tokenIdURI =
    "https://ipfs.io/ipfs/QmVxhYesuZHBqJPa3ZNRVBxJW53kLJS1KiuLfWfd5HQGvS/0.json";
  const tokenIdOneURI =
    "https://ipfs.io/ipfs/QmVxhYesuZHBqJPa3ZNRVBxJW53kLJS1KiuLfWfd5HQGvS/1.json";
  const updateTokenIdURI =
    "https://ipfs.io/ipfs/QmTy4MZftZcDq1ZVMoS6iJF7Q7pp39nVCPKeLQ9WbY8bYB";
  const emptyAddrss = "0x0000000000000000000000000000000000000000";

  const MINT_PRICE = "0.005";
  const SLAES_PRICE = 10000;
  const RATIO = 1000; //2.5%

  let owner;
  let user;

  let address;
  let pet;

  describe("Pet contract test", async () => {
    beforeEach(async () => {
      [owner, user, userTwo, recipient] = await ethers.getSigners();
      const Pet = await ethers.getContractFactory("Pet");
      pet = await Pet.deploy(attrIds, names, symbols, uris);
      address = pet.address;

      userSigner = pet.connect(user);
      ownerSigner = pet.connect(owner);

      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });

    describe("Basic ERC721 function test", async () => {
      it("Mint function test", async () => {
        //Expect
        await expect(userSigner.setIsActive(true)).to.be.reverted;
        await expect(ownerSigner.setIsActive(true)).not.to.be.reverted;
        await userSigner.mint(tokenId, {
          value: util.parseEther(MINT_PRICE),
        });

        await expect(
          ownerSigner.mint(tokenIdOne, {
            value: util.parseEther(MINT_PRICE),
          })
        )
          .to.emit(pet, "Transfer")
          .withArgs(emptyAddrss, owner.address, tokenIdOne);

        expect(await pet.ownerOf(tokenId)).to.equal(user.address);
        expect(await pet["balanceOf(address)"](user.address)).to.equal(1);
        expect(await pet.tokenURI(tokenId)).to.equal(tokenIdURI);

        expect(await pet.ownerOf(tokenIdOne)).to.equal(owner.address);
        expect(await pet["balanceOf(address)"](owner.address)).to.equal(1);
        expect(await pet.tokenURI(tokenIdOne)).to.equal(tokenIdOneURI);
      });

      it("Call setBaseURI() from owner", async () => {
        //Init
        await ownerSigner.setIsActive(true);
        await userSigner.mint(tokenId, {
          value: util.parseEther(MINT_PRICE),
        });
        expect(await pet.tokenURI(tokenId)).to.be.equal(tokenIdURI);

        //Expect
        await expect(ownerSigner.setBaseURI("http://testURI/")).not.to.be
          .reverted;
        expect(await pet.tokenURI(tokenId)).to.be.equal(
          "http://testURI/0.json"
        );

        //change URI with separete
        await expect(userSigner.separateOne(tokenId, HAT, updateTokenIdURI)).not
          .to.be.reverted;

        expect(await pet.tokenURI(tokenId)).to.be.equal(updateTokenIdURI);
      });

      it("Error if caller of setBaseURI() is not owner", async () => {
        await expect(userSigner.setBaseURI("http://testURI/")).to.be.reverted;
      });

      it("Check subTokens with other tokenId", async () => {
        await userSigner.mint(6, { value: util.parseEther(MINT_PRICE) });

        let subTokens = await pet.getSynthesizedTokens(6);
        subTokens.map((token) => {
          expect([8031, 8032, 8033, 8034, 8035]).to.include(
            token.id.toNumber()
          );
        });
      });
    });

    describe("ERC3664 function test", async () => {
      beforeEach(async () => {
        await ownerSigner.setIsActive(true);
        await userSigner.mint(tokenId, {
          value: util.parseEther(MINT_PRICE),
        });
      });

      describe("Separate", () => {
        it("Separate component of hat from token", async () => {
          //Init => User mints two tokens
          await userSigner.mint(tokenIdOne, {
            value: util.parseEther(MINT_PRICE),
          });
          //Expect
          expect(await pet.primaryAttributeOf(tokenId)).to.equal(PET_NFT);

          await expect(userSigner.separateOne(tokenId, HAT, updateTokenIdURI))
            .to.emit(pet, "Transfer")
            .withArgs(pet.address, user.address, HAT);

          await expect(
            userSigner.separateOne(tokenIdOne, HAT_ONE, updateTokenIdURI)
          )
            .to.emit(pet, "SetTokenURI")
            .withArgs(user.address, tokenIdOne, updateTokenIdURI);

          expect(await pet.ownerOf(tokenId)).to.equal(user.address);
          expect(await pet["balanceOf(address)"](user.address)).to.equal(4);
          expect(await pet.tokenURI(tokenId)).to.equal(updateTokenIdURI);
          // expect(await pet.tokenURI(HAT)).to.equal(HAT_URI);
        });

        it("Error if execute separateOne() from user that not the owner of token", async () => {
          await expect(
            ownerSigner.separateOne(tokenId, HAT, updateTokenIdURI)
          ).to.be.revertedWith("caller is not token owner nor approved");
          await expect(
            pet.connect(userTwo).separateOne(tokenId, HAT, updateTokenIdURI)
          ).to.be.revertedWith("caller is not token owner nor approved");
        });

        it("Error if execute separateOne() when subToken is separated", async () => {
          await userSigner.separateOne(tokenId, HAT, updateTokenIdURI);
          await expect(userSigner.separateOne(tokenId, HAT, updateTokenIdURI))
            .to.be.reverted;
        });

        it("Check URI of subToken after separate are same", async () => {
          //before
          expect(await pet.tokenURI(HAT)).to.equal(HAT_URI);

          //after
          await userSigner.separateOne(tokenId, HAT, updateTokenIdURI);
          expect(await pet.tokenURI(HAT)).to.equal(HAT_URI);
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
            userSigner.transferFrom(user.address, recipient.address, HAT)
          ).to.be.revertedWith(
            "ERC721: transfer caller is not owner nor approved"
          );
        });
      });

      describe("Combine", async () => {
        beforeEach(async () => {
          await pet.connect(userTwo).mint(tokenIdOne, {
            value: util.parseEther(MINT_PRICE),
          });

          await pet
            .connect(userTwo)
            .separateOne(tokenIdOne, HAT_ONE, updateTokenIdURI);

          await expect(
            pet
              .connect(userTwo)
              .transferFrom(userTwo.address, user.address, HAT_ONE)
          ).not.to.be.reverted;
        });
        it("Change components with two tokens", async () => {
          //Init
          await userSigner.separateOne(tokenId, HAT, updateTokenIdURI);

          //Expect
          await expect(
            userSigner.transferFrom(user.address, userTwo.address, HAT)
          )
            .to.emit(pet, "Transfer")
            .withArgs(user.address, userTwo.address, HAT);

          expect(await pet.ownerOf(HAT_ONE)).to.equal(user.address);
          await expect(userSigner.combine(tokenId, [HAT_ONE], updateTokenIdURI))
            .to.emit(pet, "Transfer")
            .withArgs(user.address, pet.address, HAT_ONE);

          let subTokens = await pet.getSynthesizedTokens(tokenId);
          subTokens.map((token) => {
            expect([8002, 8003, 8004, 8005, 8006]).to.include(
              token.id.toNumber()
            );
          });
        });
        it("Error if combine one component with duplicate attribute", async () => {
          //Expect
          expect(await pet.ownerOf(HAT_ONE)).to.equal(user.address);
          await expect(
            userSigner.combine(tokenId, [HAT_ONE], updateTokenIdURI)
          ).to.be.revertedWith("duplicate sub token type");
        });
        it("Error if primary attribute of token is not PET", async () => {
          await userSigner.separateOne(tokenId, HAT, updateTokenIdURI);

          await expect(
            userSigner.combine(HAT, [HAT_ONE], updateTokenIdURI)
          ).to.be.revertedWith("only support primary token been combine");
        });

        it("Error if primary attribute of subToken is PET", async () => {
          await pet
            .connect(userTwo)
            .transferFrom(userTwo.address, user.address, tokenIdOne);
          await expect(
            userSigner.combine(tokenId, [tokenIdOne], updateTokenIdURI)
          ).to.be.revertedWith("not support combine between primary token");
        });

        it("Error if caller is not sub token owner", async () => {
          expect(await pet.ownerOf(HAT_ONE)).to.equal(user.address);
          await userSigner.transferFrom(user.address, userTwo.address, HAT_ONE);

          await expect(
            userSigner.combine(tokenId, [HAT_ONE], updateTokenIdURI)
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
          await expect(
            ownerSigner.upgrade(tokenId, Level, 1)
          ).to.be.revertedWith("caller is not token owner nor approved");
        });

        it("Upgrade level of subToken", async () => {
          expect(await pet.levelOf(HAT, Level)).to.equal(0);
          await userSigner.upgrade(HAT, Level, 1);
          expect(await pet.levelOf(HAT, Level)).to.equal(1);
        });

        it("Error if upgrade exceed two level", async () => {
          expect(await pet.levelOf(HAT, Level)).to.equal(0);
          await expect(userSigner.upgrade(HAT, Level, 2)).to.be.revertedWith(
            "ERC3664Upgradable: invalid level"
          );
        });

        it("Error if upgrade exceed two level", async () => {
          for (let i = 1; i <= 11; i++) {
            if (i <= 10) {
              await userSigner.upgrade(HAT, Level, i);
            } else {
              await expect(
                userSigner.upgrade(HAT, Level, i)
              ).to.be.revertedWith(
                "ERC3664Upgradable: exceeded the maximum level"
              );
            }
          }
        });

        it("Upgrade level with subToken before separate", async () => {
          await expect(userSigner.upgrade(HAT, Level, 1)).not.to.be.reverted;
          await expect(userSigner.separateOne(tokenId, HAT, updateTokenIdURI))
            .not.to.be.reverted;
          expect(await pet.levelOf(HAT, Level)).to.be.equal(1);
        });
      });
    });

    describe("Contract wide Royalties test", async () => {
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
});
