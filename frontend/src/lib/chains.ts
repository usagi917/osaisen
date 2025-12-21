import { hardhat, polygon, polygonAmoy } from 'wagmi/chains';

export const SUPPORTED_CHAIN_IDS = [polygonAmoy.id, polygon.id, hardhat.id] as const;
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

export const DEFAULT_CHAIN_ID: SupportedChainId = polygonAmoy.id;

export const isSupportedChainId = (chainId?: number): chainId is SupportedChainId =>
  chainId === polygonAmoy.id || chainId === polygon.id || chainId === hardhat.id;

export const resolveSupportedChainId = (chainId?: number): SupportedChainId =>
  isSupportedChainId(chainId) ? chainId : DEFAULT_CHAIN_ID;
