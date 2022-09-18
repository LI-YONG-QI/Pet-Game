// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const hre = require("hardhat");

const {
  attrIds,
  names,
  symbols,
  uris,
  attrBaseURI,
} = require("../contracts/helpers/Data");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const [deployer] = await ethers.getSigners();
  console.log(`Address deploying the contract --> ${deployer.address}`);

  const SyntheticLogic = await ethers.getContractFactory("SyntheticLogic");
  const syntheticLogic = await SyntheticLogic.deploy();

  const Pet = await ethers.getContractFactory("Pet", {
    libraries: {
      SyntheticLogic: syntheticLogic.address,
    },
  });
  const pet = await Pet.deploy(attrIds, names, symbols, uris, attrBaseURI);
  console.log(`Token Contract address --> ${pet.address}`);
  await pet.deployTransaction.wait(5);
  try {
    console.log("Verifying contract...");
    await hre.run("verify:verify", {
      address: pet.address,
      contract: "contracts/Pet.sol:Pet",
      constructorArguments: [attrIds, names, symbols, uris, attrBaseURI],
    });
  } catch (err) {
    if (err.message.includes("Reason: Already Verified")) {
      console.log("Contract is already verified!");
    }
  }

  const Hat = await ethers.getContractFactory("Hat");
  const hat = await Hat.deploy();
  console.log(`Hat Contract address --> ${hat.address}`);
  await hat.deployTransaction.wait(5);
  try {
    console.log("Verifying contract...");
    await hre.run("verify:verify", {
      address: hat.address,
      contract: "contracts/Component/Hat.sol:Hat",
      constructorArguments: [],
    });
  } catch (err) {
    if (err.message.includes("Reason: Already Verified")) {
      console.log("Contract is already verified!");
    }
  }

  const Hand = await ethers.getContractFactory("Hand");
  const hand = await Hand.deploy();
  console.log(`Hand Contract address --> ${hand.address}`);
  await hand.deployTransaction.wait(5);
  try {
    console.log("Verifying contract...");
    await hre.run("verify:verify", {
      address: hand.address,
      contract: "contracts/Component/Hand.sol:Hand",
      constructorArguments: [],
    });
  } catch (err) {
    if (err.message.includes("Reason: Already Verified")) {
      console.log("Contract is already verified!");
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
