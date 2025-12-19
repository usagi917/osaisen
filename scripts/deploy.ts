import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("Osaisen Contract Deployment");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} MATIC`);
  console.log("=".repeat(60));

  // Configuration
  const config = getConfig(network.name);
  console.log("\nConfiguration:");
  console.log(`  JPYC Address: ${config.jpycAddress}`);
  console.log(`  Treasury Address: ${config.treasuryAddress}`);
  console.log(`  Min Saisen: ${ethers.formatUnits(config.minSaisen, config.jpycDecimals)} JPYC`);
  console.log(`  NFT Base URI: ${config.nftBaseUri}`);

  // 1. Deploy OfferingsNFT1155
  console.log("\n[1/3] Deploying OfferingsNFT1155...");
  const NFTFactory = await ethers.getContractFactory("OfferingsNFT1155");
  const nft = await NFTFactory.deploy(config.nftBaseUri);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log(`  OfferingsNFT1155 deployed to: ${nftAddress}`);

  // 2. Deploy SaisenRouter
  console.log("\n[2/3] Deploying SaisenRouter...");
  const RouterFactory = await ethers.getContractFactory("SaisenRouter");
  const router = await RouterFactory.deploy(
    config.jpycAddress,
    nftAddress,
    config.treasuryAddress,
    config.minSaisen
  );
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log(`  SaisenRouter deployed to: ${routerAddress}`);

  // 3. Grant MINTER_ROLE to Router
  console.log("\n[3/3] Granting MINTER_ROLE to Router...");
  const MINTER_ROLE = await nft.MINTER_ROLE();
  const tx = await nft.grantRole(MINTER_ROLE, routerAddress);
  await tx.wait();
  console.log(`  MINTER_ROLE granted to Router`);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("Deployment Complete!");
  console.log("=".repeat(60));
  console.log("\nContract Addresses:");
  console.log(`  OfferingsNFT1155: ${nftAddress}`);
  console.log(`  SaisenRouter: ${routerAddress}`);

  console.log("\nNext Steps:");
  console.log("  1. Update .env with the contract addresses");
  console.log("  2. Verify contracts on Polygonscan:");
  console.log(`     npx hardhat verify --network ${network.name} ${nftAddress} "${config.nftBaseUri}"`);
  console.log(`     npx hardhat verify --network ${network.name} ${routerAddress} ${config.jpycAddress} ${nftAddress} ${config.treasuryAddress} ${config.minSaisen}`);
  console.log("  3. Configure Paymaster whitelist with Router address");

  // Return addresses for programmatic use
  return {
    nft: nftAddress,
    router: routerAddress,
  };
}

interface DeployConfig {
  jpycAddress: string;
  treasuryAddress: string;
  minSaisen: bigint;
  jpycDecimals: number;
  nftBaseUri: string;
}

function getConfig(networkName: string): DeployConfig {
  // JPYC typically uses 18 decimals
  const jpycDecimals = 18;
  const minSaisen = ethers.parseUnits("115", jpycDecimals); // 115 JPYC

  switch (networkName) {
    case "amoy":
      return {
        // For testnet, we'll deploy a MockERC20 as JPYC or use a test token
        // Update this after deploying MockERC20 on Amoy
        jpycAddress: process.env.JPYC_ADDRESS_AMOY || ethers.ZeroAddress,
        treasuryAddress: process.env.TREASURY_ADDRESS_AMOY || ethers.ZeroAddress,
        minSaisen,
        jpycDecimals,
        nftBaseUri: "https://metadata.example.com/osaisen/",
      };

    case "polygon":
      return {
        // JPYC v2 on Polygon Mainnet
        jpycAddress: process.env.JPYC_ADDRESS_MAINNET || "0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB",
        treasuryAddress: process.env.TREASURY_ADDRESS_MAINNET || ethers.ZeroAddress,
        minSaisen,
        jpycDecimals,
        nftBaseUri: "https://metadata.shirayamahime.example/nft/",
      };

    case "hardhat":
    case "localhost":
    default:
      return {
        // For local testing, these will be overridden
        jpycAddress: ethers.ZeroAddress,
        treasuryAddress: ethers.ZeroAddress,
        minSaisen,
        jpycDecimals,
        nftBaseUri: "https://example.com/metadata/",
      };
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
