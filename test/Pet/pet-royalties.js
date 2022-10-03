const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  attrIds,
  names,
  symbols,
  attrBaseURI,
  uris,
  mockVrfAddress,
  baseURI,
  RATIO,
  MINT_PRICE,
  SLAES_PRICE,
  mockVrfParams,
} = require("../../helpers/Data");

describe("Contract wide Royalties test", async () => {
  const _INTERFACE_ID_ERC165 = "0x01ffc9a7";
  const _INTERFACE_ID_ROYALTIES_EIP2981 = "0x2a55205a";
  const _INTERFACE_ID_ERC721 = "0x80ac58cd";

  beforeEach(async () => {
    [owner, uriSetter, user, userTwo, recipient] = await ethers.getSigners();

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
      mockVrfAddress,
      mockVrfParams
    );
    await pet.connect(owner).setIsActive(true, baseURI);
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
    await pet.connect(owner).setRoyalties(recipient.address, RATIO);
    await pet.connect(user).mint({
      value: ethers.utils.parseEther(MINT_PRICE),
    });

    let info = await pet.royaltyInfo(0, SLAES_PRICE);
    expect(info[1]).to.be.equal((SLAES_PRICE * RATIO) / 10000);
    expect(info[0]).to.be.equal(recipient.address);
  });
});
