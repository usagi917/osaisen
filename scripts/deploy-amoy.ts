import { ethers, network } from "hardhat";

async function main() {
  if (network.name !== "amoy") {
    throw new Error("This script is for Amoy testnet only. Use: npx hardhat run scripts/deploy-amoy.ts --network amoy");
  }

  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("Amoy Testnet Deployment");
  console.log("=".repeat(60));
  console.log(`Deployer: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} MATIC`);

  if (balance === 0n) {
    console.log("\nERROR: Deployer has no MATIC!");
    console.log("Get testnet MATIC from: https://faucet.polygon.technology/");
    process.exit(1);
  }
  console.log("=".repeat(60));

  const JPYC_DECIMALS = 18;
  const MIN_SAISEN = ethers.parseUnits("115", JPYC_DECIMALS);

  // Treasury address (use deployer if not set)
  const treasuryAddress = process.env.TREASURY_ADDRESS_AMOY || deployer.address;
  console.log(`Treasury: ${treasuryAddress}`);

  // 1. Deploy MockERC20 (Test JPYC)
  console.log("\n[1/4] Deploying MockERC20 (Test JPYC)...");
  const MockERC20Factory = await ethers.getContractFactory("MockERC20");
  const jpyc = await MockERC20Factory.deploy("Test JPY Coin", "tJPYC", JPYC_DECIMALS);
  await jpyc.waitForDeployment();
  const jpycAddress = await jpyc.getAddress();
  console.log(`  MockERC20 (tJPYC) deployed to: ${jpycAddress}`);

  // 2. Deploy OfferingsNFT1155
  console.log("\n[2/4] Deploying OfferingsNFT1155...");
  const NFTFactory = await ethers.getContractFactory("OfferingsNFT1155");
  const nft = await NFTFactory.deploy("https://metadata.example.com/osaisen/");
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log(`  OfferingsNFT1155 deployed to: ${nftAddress}`);

  // 3. Deploy SaisenRouter
  console.log("\n[3/4] Deploying SaisenRouter...");
  const RouterFactory = await ethers.getContractFactory("SaisenRouter");
  const router = await RouterFactory.deploy(
    jpycAddress,
    nftAddress,
    treasuryAddress,
    MIN_SAISEN
  );
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log(`  SaisenRouter deployed to: ${routerAddress}`);

  // 4. Grant MINTER_ROLE to Router
  console.log("\n[4/4] Granting MINTER_ROLE to Router...");
  const MINTER_ROLE = await nft.MINTER_ROLE();
  const tx = await nft.grantRole(MINTER_ROLE, routerAddress);
  await tx.wait();
  console.log(`  MINTER_ROLE granted to Router`);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("Amoy Deployment Complete!");
  console.log("=".repeat(60));
  console.log("\nContract Addresses (save these to .env):");
  console.log(`  JPYC_ADDRESS_AMOY=${jpycAddress}`);
  console.log(`  NFT_ADDRESS_AMOY=${nftAddress}`);
  console.log(`  ROUTER_ADDRESS_AMOY=${routerAddress}`);
  console.log(`  TREASURY_ADDRESS_AMOY=${treasuryAddress}`);

  console.log("\nVerification Commands:");
  console.log(`  npx hardhat verify --network amoy ${jpycAddress} "Test JPY Coin" "tJPYC" 18`);
  console.log(`  npx hardhat verify --network amoy ${nftAddress} "https://metadata.example.com/osaisen/"`);
  console.log(`  npx hardhat verify --network amoy ${routerAddress} ${jpycAddress} ${nftAddress} ${treasuryAddress} ${MIN_SAISEN}`);

  console.log("\nPolygonscan Links:");
  console.log(`  tJPYC: https://amoy.polygonscan.com/address/${jpycAddress}`);
  console.log(`  NFT: https://amoy.polygonscan.com/address/${nftAddress}`);
  console.log(`  Router: https://amoy.polygonscan.com/address/${routerAddress}`);

  console.log("\nNext Steps:");
  console.log("  1. Mint test JPYC tokens to test users");
  console.log("  2. Test saisen() function");
  console.log("  3. Configure Paymaster with Router address");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
