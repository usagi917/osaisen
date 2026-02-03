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
  } catch (error) {
    console.warn(`[parseBigInt] Failed to parse value: "${trimmed}"`, error);
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

      // セッションキャッシュから取得
      const cacheKey = `goshuin-${chainId}-${userAddress}`;
      const cached = sessionStorage.getItem(cacheKey);
      let cachedMonths: bigint[] = [];
      let cachedEndBlock = startBlock;

      if (cached) {
        try {
          const parsed = JSON.parse(cached) as { months: string[]; endBlock: string };
          if (!Array.isArray(parsed.months) || typeof parsed.endBlock !== 'string') {
            throw new Error('Invalid cache structure');
          }
          cachedMonths = parsed.months.map((m) => BigInt(m));
          cachedEndBlock = BigInt(parsed.endBlock);
        } catch (err) {
          console.warn('[useGoshuinHistory] Cache corrupted, clearing', {
            cacheKey,
            error: err instanceof Error ? err.message : String(err),
          });
          sessionStorage.removeItem(cacheKey);
        }
      }

      // キャッシュ済みブロック以降のみスキャン
      const actualStartBlock = cachedEndBlock > startBlock ? cachedEndBlock + 1n : startBlock;

      // チャンク分割を事前に作成
      const chunks: { fromBlock: bigint; toBlock: bigint }[] = [];
      for (let fromBlock = actualStartBlock; fromBlock <= latestBlock; fromBlock += chunkSize) {
        const toBlock = fromBlock + chunkSize - 1n > latestBlock
          ? latestBlock
          : fromBlock + chunkSize - 1n;
        chunks.push({ fromBlock, toBlock });
      }

      // 並列でイベント取得
      const results = await Promise.all(
        chunks.map(({ fromBlock, toBlock }) =>
          publicClient.getContractEvents({
            address: contracts.router,
            abi: ROUTER_ABI,
            eventName: 'Saisen',
            args: { user: userAddress },
            fromBlock,
            toBlock,
          })
        )
      );

      // 結果を集約
      const collected: bigint[] = [...cachedMonths];
      results.flat().forEach((log) => {
        if (log.args?.minted && typeof log.args?.monthId === 'bigint') {
          collected.push(log.args.monthId);
        }
      });

      const uniqueMonths = Array.from(new Set(collected.map((id) => id.toString()))).map(
        (value) => BigInt(value)
      );

      uniqueMonths.sort((a, b) => (a === b ? 0 : a > b ? -1 : 1));
      setMonths(uniqueMonths);
      setIsPartial(partial);
      setRangeInfo({ start: startBlock, end: latestBlock });

      // セッションキャッシュに保存
      try {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            months: uniqueMonths.map((m) => m.toString()),
            endBlock: latestBlock.toString(),
          })
        );
      } catch (err) {
        console.warn('[useGoshuinHistory] Failed to save cache', {
          cacheKey,
          error: err instanceof Error ? err.message : String(err),
          isQuotaError: err instanceof DOMException && err.name === 'QuotaExceededError',
        });
      }
    } catch (err) {
      const normalizedError = err instanceof Error ? err : new Error(String(err));
      console.error('[useGoshuinHistory] Failed to fetch offering history', {
        chainId,
        userAddress,
        error: normalizedError,
      });
      setError(normalizedError);
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
