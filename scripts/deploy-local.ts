import { ethers } from "hardhat";

async function main() {
  const [deployer, treasury] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("Local Deployment (with MockERC20)");
  console.log("=".repeat(60));
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Treasury: ${treasury.address}`);
  console.log("=".repeat(60));

  const JPYC_DECIMALS = 18;
  const MIN_SAISEN = ethers.parseUnits("115", JPYC_DECIMALS);

  // 1. Deploy MockERC20 (JPYC)
  console.log("\n[1/4] Deploying MockERC20 (JPYC)...");
  const MockERC20Factory = await ethers.getContractFactory("MockERC20");
  const jpyc = await MockERC20Factory.deploy("JPY Coin", "JPYC", JPYC_DECIMALS);
  await jpyc.waitForDeployment();
  const jpycAddress = await jpyc.getAddress();
  console.log(`  MockERC20 (JPYC) deployed to: ${jpycAddress}`);

  // 2. Deploy OfferingsNFT1155
  console.log("\n[2/4] Deploying OfferingsNFT1155...");
  const NFTFactory = await ethers.getContractFactory("OfferingsNFT1155");
  const nft = await NFTFactory.deploy("https://example.com/metadata/");
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log(`  OfferingsNFT1155 deployed to: ${nftAddress}`);

  // 3. Deploy SaisenRouter
  console.log("\n[3/4] Deploying SaisenRouter...");
  const RouterFactory = await ethers.getContractFactory("SaisenRouter");
  const router = await RouterFactory.deploy(
    jpycAddress,
    nftAddress,
    treasury.address,
    MIN_SAISEN
  );
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log(`  SaisenRouter deployed to: ${routerAddress}`);

  // 4. Grant MINTER_ROLE to Router
  console.log("\n[4/4] Granting MINTER_ROLE to Router...");
  const MINTER_ROLE = await nft.MINTER_ROLE();
  await nft.grantRole(MINTER_ROLE, routerAddress);
  console.log(`  MINTER_ROLE granted to Router`);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("Local Deployment Complete!");
  console.log("=".repeat(60));
  console.log("\nContract Addresses:");
  console.log(`  MockERC20 (JPYC): ${jpycAddress}`);
  console.log(`  OfferingsNFT1155: ${nftAddress}`);
  console.log(`  SaisenRouter: ${routerAddress}`);
  console.log(`  Treasury: ${treasury.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
