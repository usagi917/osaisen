/**
 * UserOperation Test Script for Account Abstraction
 *
 * Prerequisites:
 * 1. Deploy contracts to Amoy: npx hardhat run scripts/deploy-amoy.ts --network amoy
 * 2. Set up .env with:
 *    - PIMLICO_API_KEY
 *    - ROUTER_ADDRESS_AMOY
 *    - JPYC_ADDRESS_AMOY
 * 3. Fund Paymaster with MATIC on Pimlico dashboard
 *
 * Usage:
 *   npx ts-node scripts/test-userOp.ts
 */

import { createPublicClient, createWalletClient, http, parseUnits, encodeFunctionData } from "viem";
import { polygonAmoy } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { createSmartAccountClient } from "permissionless";
import { toSimpleSmartAccount } from "permissionless/accounts";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import * as dotenv from "dotenv";

dotenv.config();

// ABIs (minimal)
const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

const ROUTER_ABI = [
  {
    name: "saisen",
    type: "function",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "isEligibleForMint",
    type: "function",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "bool" }],
  },
] as const;

async function main() {
  // Environment variables
  const PIMLICO_API_KEY = process.env.PIMLICO_API_KEY;
  const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
  const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS_AMOY as `0x${string}`;
  const JPYC_ADDRESS = process.env.JPYC_ADDRESS_AMOY as `0x${string}`;

  if (!PIMLICO_API_KEY || !PRIVATE_KEY || !ROUTER_ADDRESS || !JPYC_ADDRESS) {
    console.error("Missing environment variables!");
    console.error("Required: PIMLICO_API_KEY, PRIVATE_KEY, ROUTER_ADDRESS_AMOY, JPYC_ADDRESS_AMOY");
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("UserOperation Test");
  console.log("=".repeat(60));

  // Create clients
  const publicClient = createPublicClient({
    chain: polygonAmoy,
    transport: http(),
  });

  const pimlicoUrl = `https://api.pimlico.io/v2/polygon-amoy/rpc?apikey=${PIMLICO_API_KEY}`;

  const pimlicoClient = createPimlicoClient({
    transport: http(pimlicoUrl),
    entryPoint: {
      address: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // EntryPoint v0.6
      version: "0.6",
    },
  });

  // Create smart account from EOA
  const owner = privateKeyToAccount(PRIVATE_KEY);
  console.log(`\nOwner EOA: ${owner.address}`);

  const smartAccount = await toSimpleSmartAccount({
    client: publicClient,
    owner,
    entryPoint: {
      address: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
      version: "0.6",
    },
  });

  const smartAccountAddress = smartAccount.address;
  console.log(`Smart Account: ${smartAccountAddress}`);

  // Create smart account client with Paymaster
  const smartAccountClient = createSmartAccountClient({
    account: smartAccount,
    chain: polygonAmoy,
    bundlerTransport: http(pimlicoUrl),
    paymaster: pimlicoClient,
    userOperation: {
      estimateFeesPerGas: async () => {
        return (await pimlicoClient.getUserOperationGasPrice()).fast;
      },
    },
  });

  // Check JPYC balance
  const jpycBalance = await publicClient.readContract({
    address: JPYC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [smartAccountAddress],
  });
  console.log(`\nJPYC Balance: ${parseFloat(jpycBalance.toString()) / 1e18} JPYC`);

  if (jpycBalance === 0n) {
    console.log("\nERROR: Smart account has no JPYC!");
    console.log("Mint test JPYC to the smart account address first.");
    process.exit(1);
  }

  // Check allowance
  const allowance = await publicClient.readContract({
    address: JPYC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [smartAccountAddress, ROUTER_ADDRESS],
  });
  console.log(`Allowance to Router: ${parseFloat(allowance.toString()) / 1e18} JPYC`);

  const SAISEN_AMOUNT = parseUnits("115", 18); // 115 JPYC

  // Step 1: Approve if needed
  if (allowance < SAISEN_AMOUNT) {
    console.log("\n[1/2] Sending approve UserOperation...");
    const approveHash = await smartAccountClient.sendTransaction({
      to: JPYC_ADDRESS,
      data: encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "approve",
        args: [ROUTER_ADDRESS, SAISEN_AMOUNT * 100n], // Approve 100x for future use
      }),
    });
    console.log(`  Approve TX: ${approveHash}`);
    console.log("  Waiting for confirmation...");

    const receipt = await publicClient.waitForTransactionReceipt({ hash: approveHash });
    console.log(`  Confirmed in block: ${receipt.blockNumber}`);
  } else {
    console.log("\n[1/2] Allowance sufficient, skipping approve");
  }

  // Step 2: Saisen
  console.log("\n[2/2] Sending saisen UserOperation...");

  // Check eligibility
  const isEligible = await publicClient.readContract({
    address: ROUTER_ADDRESS,
    abi: ROUTER_ABI,
    functionName: "isEligibleForMint",
    args: [smartAccountAddress],
  });
  console.log(`  Eligible for NFT: ${isEligible}`);

  const saisenHash = await smartAccountClient.sendTransaction({
    to: ROUTER_ADDRESS,
    data: encodeFunctionData({
      abi: ROUTER_ABI,
      functionName: "saisen",
      args: [SAISEN_AMOUNT],
    }),
  });
  console.log(`  Saisen TX: ${saisenHash}`);
  console.log("  Waiting for confirmation...");

  const saisenReceipt = await publicClient.waitForTransactionReceipt({ hash: saisenHash });
  console.log(`  Confirmed in block: ${saisenReceipt.blockNumber}`);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("UserOperation Test Complete!");
  console.log("=".repeat(60));
  console.log(`\nTransaction hashes:`);
  console.log(`  https://amoy.polygonscan.com/tx/${saisenHash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
