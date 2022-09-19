const { ethers, hardhatArguments } = require("hardhat");
const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Address deploying the contract --> ${deployer.address}`);

  const Hat = await ethers.getContractFactory("Hat");
  const hat = await Hat.deploy();
  console.log(`Token Contract address --> ${hat.address}`);

  //await hat.deployTransaction.wait(5);

  // await hre.run("verify:verify", {
  //   address: hat.address,
  //   contract: "contracts/Component/Hat.sol:Hat",
  //   constructorArguments: [],
  // });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
