require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    "arc-testnet": {
      url: process.env.ARC_RPC_URL || "https://arc-testnet-rpc.example.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 123456 // Replace with actual Arc testnet chain ID
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};