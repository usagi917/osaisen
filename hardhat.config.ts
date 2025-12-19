import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
const POLYGON_AMOY_RPC = process.env.POLYGON_AMOY_RPC || "https://rpc-amoy.polygon.technology";
const POLYGON_MAINNET_RPC = process.env.POLYGON_MAINNET_RPC || "https://polygon-rpc.com";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    amoy: {
      url: POLYGON_AMOY_RPC,
      chainId: 80002,
      accounts: [PRIVATE_KEY],
    },
    polygon: {
      url: POLYGON_MAINNET_RPC,
      chainId: 137,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      polygonAmoy: POLYGONSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
    },
  },
};

export default config;
