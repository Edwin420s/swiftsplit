require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000
      },
      viaIR: true
    }
  },
  networks: {
    // Arc Testnet
    arcTestnet: {
      url: process.env.ARC_RPC_URL || "https://sepolia-rpc.arc.network",
      chainId: 47279324479,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 2000000000, // 2 gwei
      timeout: 60000
    },
    // Arc Mainnet (for future use)
    arcMainnet: {
      url: process.env.ARC_MAINNET_RPC_URL || "https://rpc.arc.network",
      chainId: 1244,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 2000000000,
      timeout: 60000
    },
    // Local development
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    // Sepolia for testing
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: {
      arcTestnet: process.env.ARC_SCAN_API_KEY || "abc",
      arcMainnet: process.env.ARC_SCAN_API_KEY || "abc",
      sepolia: process.env.ETHERSCAN_API_KEY || ""
    },
    customChains: [
      {
        network: "arcTestnet",
        chainId: 47279324479,
        urls: {
          apiURL: "https://api-sepolia.arcscan.network/api",
          browserURL: "https://sepolia.arcscan.network"
        }
      },
      {
        network: "arcMainnet",
        chainId: 1244,
        urls: {
          apiURL: "https://api.arcscan.network/api",
          browserURL: "https://arcscan.network"
        }
      }
    ]
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    token: "ETH",
    gasPrice: 20
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    strict: true,
  },
  mocha: {
    timeout: 40000
  }
};