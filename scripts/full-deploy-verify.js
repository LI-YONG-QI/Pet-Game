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
  VrfAddress,
  VrfParams,
} = require("../helpers/Data");

async function deployVerify(address, path, args) {
  try {
    console.log("Verifying SyntheticLogic contract...");
    await hre.run("verify:verify", {
      address: address,
      contract: path,
      constructorArguments: args,
    });
  } catch (err) {
    if (err.message.includes("Reason: Already Verified")) {
      console.log("Contract is already verified!");
    } else {
      console.error(err);
    }
  }
}

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
  await syntheticLogic.deployed();
  console.log(`SyntheticLogic Contract address --> ${syntheticLogic.address}`);
  await syntheticLogic.deployTransaction.wait(5);
  await deployVerify(
    syntheticLogic.address,
    "contracts/libraries/SyntheticLogic.sol:SyntheticLogic",
    []
  );

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
  await deployVerify(pet.address, "contracts/Core/Pet.sol:Pet", [
    attrIds,
    names,
    symbols,
    uris,
    attrBaseURI,
    VrfAddress,
    VrfParams,
  ]);

  const Hat = await ethers.getContractFactory("Hat");
  const hat = await Hat.deploy();
  console.log(`Hat Contract address --> ${hat.address}`);
  await hat.deployTransaction.wait(5);
  await deployVerify(hat.address, "contracts/Component/Hat.sol:Hat", []);

  const Hand = await ethers.getContractFactory("Hand");
  const hand = await Hand.deploy();
  console.log(`Hand Contract address --> ${hand.address}`);
  await hand.deployTransaction.wait(5);
  await deployVerify(hand.address, "contracts/Component/Hand.sol:Hand", []);

  const Glass = await ethers.getContractFactory("Glasses");
  const glass = await Glass.deploy();
  console.log(`Glass Contract address --> ${glass.address}`);
  await glass.deployTransaction.wait(5);
  await deployVerify(
    glass.address,
    "contracts/Component/Glasses.sol:Glasses",
    []
  );

  const Cloth = await ethers.getContractFactory("Cloth");
  const cloth = await Cloth.deploy();
  console.log(`Cloth Contract address --> ${cloth.address}`);
  await cloth.deployTransaction.wait(5);
  await deployVerify(cloth.address, "contracts/Component/Cloth.sol:Cloth", []);

  const Pants = await ethers.getContractFactory("Pants");
  const pants = await Pants.deploy();
  console.log(`Pants Contract address --> ${pants.address}`);
  await pants.deployTransaction.wait(5);
  await deployVerify(pants.address, "contracts/Component/Pants.sol:Pants", []);

  const Governance = await ethers.getContractFactory("Governance");
  const governance = await Governance.deploy(pet.address, 1000);
  console.log(`Governance Contract address --> ${governance.address}`);
  await governance.deployTransaction.wait(5);
  await deployVerify(
    governance.address,
    "contracts/Governance/Governance.sol:Governance",
    [pet.address, 1000]
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
