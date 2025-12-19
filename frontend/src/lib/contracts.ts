import type { Address } from 'viem';

// Contract addresses (update after deployment)
// For local development, run `npm run dev:setup` from root to populate these
export const CONTRACTS = {
  // Polygon Amoy Testnet
  amoy: {
    jpyc: (import.meta.env.VITE_JPYC_ADDRESS_AMOY || '0x0000000000000000000000000000000000000000') as Address,
    router: (import.meta.env.VITE_ROUTER_ADDRESS_AMOY || '0x0000000000000000000000000000000000000000') as Address,
    nft: (import.meta.env.VITE_NFT_ADDRESS_AMOY || '0x0000000000000000000000000000000000000000') as Address,
  },
  // Polygon Mainnet
  polygon: {
    jpyc: '0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB' as Address, // JPYC v2
    router: (import.meta.env.VITE_ROUTER_ADDRESS_MAINNET || '0x0000000000000000000000000000000000000000') as Address,
    nft: (import.meta.env.VITE_NFT_ADDRESS_MAINNET || '0x0000000000000000000000000000000000000000') as Address,
  },
  // Local Hardhat (deterministic addresses from fresh node)
  // These will be overridden by VITE_*_AMOY env vars if present in .env.local
  hardhat: {
    jpyc: (import.meta.env.VITE_JPYC_ADDRESS_AMOY || '0x5FbDB2315678afecb367f032d93F642f64180aa3') as Address,
    router: (import.meta.env.VITE_ROUTER_ADDRESS_AMOY || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0') as Address,
    nft: (import.meta.env.VITE_NFT_ADDRESS_AMOY || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512') as Address,
  },
} as const;

// Get contracts for current chain
export function getContracts(chainId: number) {
  switch (chainId) {
    case 80002: // Polygon Amoy
      return CONTRACTS.amoy;
    case 137: // Polygon Mainnet
      return CONTRACTS.polygon;
    case 31337: // Hardhat
      return CONTRACTS.hardhat;
    default:
      return CONTRACTS.amoy;
  }
}

// ABIs
export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
] as const;

export const ROUTER_ABI = [
  {
    name: 'saisen',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'isEligibleForMint',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'getCurrentMonthId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'minSaisen',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'lastMintMonthId',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'Saisen',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'monthId', type: 'uint256', indexed: false },
      { name: 'minted', type: 'bool', indexed: false },
    ],
  },
] as const;

export const NFT_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'uri',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'string' }],
  },
] as const;

// Constants
export const MIN_SAISEN = 115n * 10n ** 18n; // 115 JPYC (18 decimals)
export const JPYC_DECIMALS = 18;
