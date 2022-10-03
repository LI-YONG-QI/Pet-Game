const { ethers } = require("hardhat");
const hre = require("hardhat");

const {
  attrIds,
  names,
  symbols,
  uris,
  attrBaseURI,
  VrfAddress,
  VrfParams,
} = require("../helpers/Data");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Address deploying the contract --> ${deployer.address}`);

  const SyntheticLogic = await ethers.getContractFactory("SyntheticLogic");
  const syntheticLogic = await SyntheticLogic.deploy();
  await syntheticLogic.deployed();
  console.log(`SyntheticLogic Contract address --> ${syntheticLogic.address}`);
  await syntheticLogic.deployTransaction.wait(5);
  try {
    console.log("Verifying SyntheticLogic contract...");
    await hre.run("verify:verify", {
      address: syntheticLogic.address,
      contract: "contracts/libraries/SyntheticLogic.sol:SyntheticLogic",
      constructorArguments: [],
    });
  } catch (err) {
    if (err.message.includes("Reason: Already Verified")) {
      console.log("Contract is already verified!");
    } else {
      console.error(err);
    }
  }

  const Pet = await ethers.getContractFactory("Pet", {
    libraries: {
      SyntheticLogic: syntheticLogic.address,
    },
  });
  const pet = await Pet.deploy(
    attrIds,
    names,
    symbols,
    uris,
    attrBaseURI,
    VrfAddress,
    VrfParams
  );
  console.log(`Token Contract address --> ${pet.address}`);
  await pet.deployTransaction.wait(5);
  try {
    console.log("Verifying Pet contract...");
    await hre.run("verify:verify", {
      address: pet.address,
      contract: "contracts/Core/Pet.sol:Pet",
      constructorArguments: [
        attrIds,
        names,
        symbols,
        uris,
        attrBaseURI,
        VrfAddress,
        VrfParams,
      ],
    });
  } catch (err) {
    if (err.message.includes("Reason: Already Verified")) {
      console.log("Contract is already verified!");
    } else {
      console.error(err);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
