import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { hardhat, polygon } from 'wagmi/chains';
import type { Address } from 'viem';
import { getContracts, ROUTER_ABI } from '../lib/contracts';
import type { SupportedChainId } from '../lib/chains';

interface UseGoshuinHistoryProps {
  userAddress?: Address;
  chainId: SupportedChainId;
}

const parseBigInt = (value?: string): bigint | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return BigInt(trimmed);
  } catch {
    return null;
  }
};

const getStartBlock = (chainId: SupportedChainId): bigint => {
  const fromEnv =
    chainId === polygon.id
      ? import.meta.env.VITE_ROUTER_START_BLOCK_MAINNET
      : chainId === hardhat.id
        ? import.meta.env.VITE_ROUTER_START_BLOCK_HARDHAT
        : import.meta.env.VITE_ROUTER_START_BLOCK_AMOY;

  return parseBigInt(fromEnv) ?? 0n;
};

export function useGoshuinHistory({ userAddress, chainId }: UseGoshuinHistoryProps) {
  const publicClient = usePublicClient({ chainId });
  const [months, setMonths] = useState<bigint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPartial, setIsPartial] = useState(false);
  const [rangeInfo, setRangeInfo] = useState<{ start: bigint; end: bigint } | null>(null);

  const chunkSize = useMemo(() => {
    return parseBigInt(import.meta.env.VITE_ROUTER_EVENT_CHUNK_SIZE) ?? 50_000n;
  }, []);

  const maxRange = useMemo(() => {
    return parseBigInt(import.meta.env.VITE_ROUTER_EVENT_MAX_RANGE) ?? 500_000n;
  }, []);

  const refetch = useCallback(async () => {
    if (!userAddress || !publicClient) {
      setMonths([]);
      setIsLoading(false);
      setError(null);
      setIsPartial(false);
      setRangeInfo(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const contracts = getContracts(chainId);
      const latestBlock = await publicClient.getBlockNumber();
      let startBlock = getStartBlock(chainId);
      let partial = false;

      if (startBlock === 0n && maxRange > 0n && latestBlock > maxRange) {
        startBlock = latestBlock - maxRange + 1n;
        partial = true;
      }

      if (startBlock > latestBlock) {
        setMonths([]);
        setIsPartial(false);
        setRangeInfo({ start: latestBlock, end: latestBlock });
        return;
      }

      const collected: bigint[] = [];
      for (let fromBlock = startBlock; fromBlock <= latestBlock; fromBlock += chunkSize) {
        const toBlock = fromBlock + chunkSize - 1n > latestBlock
          ? latestBlock
          : fromBlock + chunkSize - 1n;

        const logs = await publicClient.getContractEvents({
          address: contracts.router,
          abi: ROUTER_ABI,
          eventName: 'Saisen',
          args: { user: userAddress },
          fromBlock,
          toBlock,
        });

        logs.forEach((log) => {
          if (log.args?.minted && typeof log.args?.monthId === 'bigint') {
            collected.push(log.args.monthId);
          }
        });
      }

      const uniqueMonths = Array.from(new Set(collected.map((id) => id.toString()))).map(
        (value) => BigInt(value)
      );

      uniqueMonths.sort((a, b) => (a === b ? 0 : a > b ? -1 : 1));
      setMonths(uniqueMonths);
      setIsPartial(partial);
      setRangeInfo({ start: startBlock, end: latestBlock });
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [chainId, chunkSize, maxRange, publicClient, userAddress]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    months,
    isLoading,
    error,
    refetch,
    isPartial,
    rangeInfo,
  };
}
