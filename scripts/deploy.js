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

  console.log(syntheticLogic.address);

  const Pet = await ethers.getContractFactory("Pet", {
    libraries: {
      SyntheticLogic: syntheticLogic.address,
    },
  });
  const pet = await Pet.deploy(attrIds, names, symbols, uris, attrBaseURI);
  console.log(`Token Contract address --> ${pet.address}`);

  const Hat = await ethers.getContractFactory("Hat");
  const hat = await Hat.deploy(pet.address);
  console.log(`Token Contract address --> ${hat.address}`);

  const Hand = await ethers.getContractFactory("Hand");
  const hand = await Hand.deploy(pet.address);
  console.log(`Token Contract address --> ${hand.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
