require("@nomiclabs/hardhat-waffle");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
// task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
//   const accounts = await hre.ethers.getSigners();

//   for (const account of accounts) {
//     console.log(account.address);
//   }
// });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");

require("dotenv").config();

const privateKey = process.env.PRIVATE_KEY;
//const endpointRinkeby = process.env.RINKEBY_URL;
const endpointMumbai = process.env.MUMBAI_URL;
const etherscanKey = process.env.ETHERSCAN_API_KEY;
const mumbaiKey = process.env.POLYGON_API_KEY;
const endpointGoerli = process.env.GOERLI_URL;

module.exports = {
  solidity: {
    version: "0.8.11",
    settings: {
      optimizer: {
        enabled: true,
        runs: 150,
      },
    },
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    goerli: {
      url: endpointGoerli,
      accounts: [`0x${privateKey}`],
    },
    mumbai: {
      url: endpointMumbai,
      accounts: [`0x${privateKey}`],
    },
  },

  etherscan: {
    apiKey: {
      polygonMumbai: mumbaiKey,
      goerli: etherscanKey,
    },
  },
};
