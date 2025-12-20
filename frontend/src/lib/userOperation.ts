/**
 * Account Abstraction (ERC-4337) utilities for gasless transactions
 *
 * This module provides utilities for:
 * - Creating and managing Smart Accounts
 * - Sponsoring transactions via Paymaster
 * - Building and sending UserOperations
 *
 * Prerequisites:
 * - Pimlico API key (get one at https://dashboard.pimlico.io/)
 * - Bundler URL (from Pimlico)
 * - Paymaster URL (from Pimlico)
 */

import {
  type Address,
  type Hash,
  type Hex,
  encodeFunctionData,
} from 'viem';
import { polygonAmoy, polygon } from 'viem/chains';
import { ERC20_ABI, ROUTER_ABI } from './contracts';

// Types for UserOperation
export interface UserOperation {
  sender: Address;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: Hex;
  signature: Hex;
}

export interface PaymasterConfig {
  apiKey: string;
  bundlerUrl: string;
  paymasterUrl: string;
}

export interface SmartAccountConfig {
  owner: Address;
  chainId: number;
}

// Chain configurations
export const CHAIN_CONFIG = {
  [polygonAmoy.id]: {
    name: 'Polygon Amoy',
    bundlerUrl: (apiKey: string) =>
      `https://api.pimlico.io/v2/polygon-amoy/rpc?apikey=${apiKey}`,
    paymasterUrl: (apiKey: string) =>
      `https://api.pimlico.io/v2/polygon-amoy/rpc?apikey=${apiKey}`,
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as Address,
    simpleAccountFactory: '0x9406Cc6185a346906296840746125a0E44976454' as Address,
  },
  [polygon.id]: {
    name: 'Polygon Mainnet',
    bundlerUrl: (apiKey: string) =>
      `https://api.pimlico.io/v2/polygon/rpc?apikey=${apiKey}`,
    paymasterUrl: (apiKey: string) =>
      `https://api.pimlico.io/v2/polygon/rpc?apikey=${apiKey}`,
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as Address,
    simpleAccountFactory: '0x9406Cc6185a346906296840746125a0E44976454' as Address,
  },
} as const;

/**
 * Build calldata for JPYC approve transaction
 */
export function buildApproveCalldata(
  spender: Address,
  amount: bigint
): Hex {
  return encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [spender, amount],
  });
}

/**
 * Build calldata for saisen (offering) transaction
 */
export function buildSaisenCalldata(amount: bigint): Hex {
  return encodeFunctionData({
    abi: ROUTER_ABI,
    functionName: 'saisen',
    args: [amount],
  });
}

/**
 * Build batch calldata for approve + saisen in one transaction
 * (Requires Smart Account with batch execution support)
 */
export function buildBatchCalldata(
  jpycAddress: Address,
  routerAddress: Address,
  amount: bigint
): {
  approveCall: { target: Address; data: Hex; value: bigint };
  saisenCall: { target: Address; data: Hex; value: bigint };
} {
  return {
    approveCall: {
      target: jpycAddress,
      data: buildApproveCalldata(routerAddress, amount),
      value: 0n,
    },
    saisenCall: {
      target: routerAddress,
      data: buildSaisenCalldata(amount),
      value: 0n,
    },
  };
}

/**
 * Check if Pimlico API key is configured
 */
export function isPimlicoConfigured(): boolean {
  const apiKey = import.meta.env.VITE_PIMLICO_API_KEY;
  return typeof apiKey === 'string' && apiKey.length > 0;
}

/**
 * Get Pimlico configuration
 */
export function getPimlicoConfig(chainId: number): PaymasterConfig | null {
  const apiKey = import.meta.env.VITE_PIMLICO_API_KEY;
  if (!apiKey) return null;

  const chainConfig = CHAIN_CONFIG[chainId as keyof typeof CHAIN_CONFIG];
  if (!chainConfig) return null;

  return {
    apiKey,
    bundlerUrl: chainConfig.bundlerUrl(apiKey),
    paymasterUrl: chainConfig.paymasterUrl(apiKey),
  };
}

/**
 * Create a Pimlico client for sending UserOperations
 * This is a factory function that creates the necessary clients
 *
 * Note: This is a placeholder implementation. When Pimlico is configured,
 * update this function to use the actual permissionless library.
 * See: https://docs.pimlico.io/permissionless/how-to/accounts/use-simple-account
 */
export async function createPimlicoClient(chainId: number) {
  const config = getPimlicoConfig(chainId);
  if (!config) {
    throw new Error('Pimlico is not configured. Set VITE_PIMLICO_API_KEY in .env');
  }

  const { http, createPublicClient } = await import('viem');

  const chain = chainId === polygon.id ? polygon : polygonAmoy;

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  // Placeholder clients - actual implementation requires permissionless setup
  // When Pimlico API key is configured, implement using:
  // import { createPimlicoClient } from "permissionless/clients/pimlico"
  // See: https://docs.pimlico.io/permissionless

  return {
    bundlerClient: {
      estimateUserOperationGas: async (_params: unknown) => {
        throw new Error('Bundler client not configured. Set up Pimlico first.');
      },
      sendUserOperation: async (_params: unknown) => {
        throw new Error('Bundler client not configured. Set up Pimlico first.');
      },
      waitForUserOperationReceipt: async (_params: unknown) => {
        throw new Error('Bundler client not configured. Set up Pimlico first.');
      },
    },
    paymasterClient: {
      sponsorUserOperation: async (_params: unknown) => {
        throw new Error('Paymaster client not configured. Set up Pimlico first.');
      },
    },
    publicClient,
    chain,
    config,
  };
}

/**
 * Estimate gas for a UserOperation
 *
 * Note: This is a placeholder. Implement with actual permissionless library
 * when Pimlico is configured.
 */
export async function estimateUserOperationGas(
  _chainId: number,
  _userOp: Partial<UserOperation>
): Promise<{
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
}> {
  // Placeholder - will throw when called
  throw new Error(
    'estimateUserOperationGas: Pimlico not configured. ' +
    'Set VITE_PIMLICO_API_KEY and implement with permissionless library.'
  );
}

/**
 * Get paymaster sponsorship for a UserOperation
 *
 * Note: This is a placeholder. Implement with actual permissionless library
 * when Pimlico is configured.
 */
export async function sponsorUserOperation(
  _chainId: number,
  _userOp: Partial<UserOperation>
): Promise<{
  paymasterAndData: Hex;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
}> {
  // Placeholder - will throw when called
  throw new Error(
    'sponsorUserOperation: Pimlico not configured. ' +
    'Set VITE_PIMLICO_API_KEY and implement with permissionless library.'
  );
}

/**
 * Send a UserOperation through the bundler
 *
 * Note: This is a placeholder. Implement with actual permissionless library
 * when Pimlico is configured.
 */
export async function sendUserOperation(
  _chainId: number,
  _userOp: UserOperation
): Promise<Hash> {
  // Placeholder - will throw when called
  throw new Error(
    'sendUserOperation: Pimlico not configured. ' +
    'Set VITE_PIMLICO_API_KEY and implement with permissionless library.'
  );
}

/**
 * Wait for a UserOperation to be included in a block
 *
 * Note: This is a placeholder. Implement with actual permissionless library
 * when Pimlico is configured.
 */
export async function waitForUserOperationReceipt(
  _chainId: number,
  _hash: Hash
): Promise<{
  success: boolean;
  transactionHash: Hash;
}> {
  // Placeholder - will throw when called
  throw new Error(
    'waitForUserOperationReceipt: Pimlico not configured. ' +
    'Set VITE_PIMLICO_API_KEY and implement with permissionless library.'
  );
}

/**
 * Helper to check if we should use AA (gasless) mode
 */
export function shouldUseGaslessMode(chainId: number): boolean {
  // Only use AA on supported chains with Pimlico configured
  const isSupported = chainId in CHAIN_CONFIG;
  const isConfigured = isPimlicoConfigured();

  return isSupported && isConfigured;
}

/**
 * Get the entry point address for a chain
 */
export function getEntryPointAddress(chainId: number): Address {
  const config = CHAIN_CONFIG[chainId as keyof typeof CHAIN_CONFIG];
  if (!config) {
    throw new Error(`Chain ${chainId} is not supported for AA`);
  }
  return config.entryPoint;
}

/**
 * Get the simple account factory address for a chain
 */
export function getSimpleAccountFactoryAddress(chainId: number): Address {
  const config = CHAIN_CONFIG[chainId as keyof typeof CHAIN_CONFIG];
  if (!config) {
    throw new Error(`Chain ${chainId} is not supported for AA`);
  }
  return config.simpleAccountFactory;
}

// Export types
export type { Address, Hash, Hex };
