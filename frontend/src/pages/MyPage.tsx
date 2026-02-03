import { useEffect, useMemo, useRef, useState } from 'react';
import { useAccount, useReadContracts, useSwitchChain } from 'wagmi';
import { DEFAULT_CHAIN_ID, resolveSupportedChainId } from '../lib/chains';
import { motion } from 'framer-motion';
import { StatusDisplay } from '../components/StatusDisplay';
import { useGoshuinHistory } from '../hooks/useGoshuinHistory';
import { useNftEligibility } from '../hooks/useNftEligibility';
import { getContracts, NFT_ABI } from '../lib/contracts';

const formatMonthId = (monthId?: bigint): string => {
  if (!monthId || monthId === 0n) return '';
  const id = Number(monthId);
  const year = Math.floor(id / 100);
  const month = id % 100;
  return `${year}年${month}月`;
};

interface GoshuinMetadata {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
}

const METADATA_CACHE_PREFIX = 'nft-metadata-';

const getMetadataFromCache = (monthId: string): GoshuinMetadata | null => {
  const cacheKey = `${METADATA_CACHE_PREFIX}${monthId}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as GoshuinMetadata;
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
      throw new Error('Invalid cache structure');
    }
  } catch (err) {
    console.warn('[MyPage] Cache corrupted, clearing', {
      cacheKey,
      error: err instanceof Error ? err.message : String(err),
    });
    try {
      localStorage.removeItem(cacheKey);
    } catch {
      // 削除失敗は無視
    }
  }
  return null;
};

const setMetadataToCache = (monthId: string, metadata: GoshuinMetadata): void => {
  const cacheKey = `${METADATA_CACHE_PREFIX}${monthId}`;
  try {
    localStorage.setItem(cacheKey, JSON.stringify(metadata));
  } catch (err) {
    console.warn('[MyPage] Failed to save cache', {
      cacheKey,
      error: err instanceof Error ? err.message : String(err),
      isQuotaError: err instanceof DOMException && err.name === 'QuotaExceededError',
    });
  }
};

const normalizeIpfsUrl = (uri?: string): string | null => {
  if (!uri) return null;
  if (!uri.startsWith('ipfs://')) return uri;
  const gateway = (import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/')
    .trim()
    .replace(/\/?$/, '/');
  const path = uri.replace('ipfs://', '');
  const normalizedPath = path.startsWith('ipfs/') ? path.slice(5) : path;
  return `${gateway}${normalizedPath}`;
};

const tokenIdToHex = (tokenId: bigint): string =>
  tokenId.toString(16).padStart(64, '0');

const resolveTokenUri = (rawUri: string, tokenId: bigint): string => {
  let uri = rawUri.trim();
  if (uri.includes('{id}')) {
    uri = uri.replace('{id}', tokenIdToHex(tokenId));
  } else if (uri.endsWith('/')) {
    uri = `${uri}${tokenId}.json`;
  } else if (!uri.endsWith('.json')) {
    uri = `${uri}/${tokenId}.json`;
  }
  return uri;
};

export function MyPage() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const autoSwitchAttemptedRef = useRef(false);

  const amoyChainId = DEFAULT_CHAIN_ID;
  const currentChainId = resolveSupportedChainId(chainId);

  useEffect(() => {
    if (!isConnected) {
      autoSwitchAttemptedRef.current = false;
      return;
    }
    if (chainId === amoyChainId) {
      autoSwitchAttemptedRef.current = true;
      return;
    }
    if (!autoSwitchAttemptedRef.current && chainId !== undefined) {
      switchChain({ chainId: amoyChainId });
      autoSwitchAttemptedRef.current = true;
    }
  }, [isConnected, chainId, amoyChainId, switchChain]);

  const { isEligible, currentMonthLabel, nftBalance, lastMintMonthId } = useNftEligibility({
    userAddress: address,
    chainId: currentChainId,
  });

  const { months, isLoading, error, refetch, isPartial, rangeInfo } = useGoshuinHistory({
    userAddress: address,
    chainId: currentChainId,
  });

  const contracts = getContracts(currentChainId);
  const metadataBaseUrl = (import.meta.env.VITE_METADATA_BASE_URL || '').trim();

  const uriContracts = useMemo(
    () =>
      months.map((monthId) => ({
        address: contracts.nft,
        abi: NFT_ABI,
        functionName: 'uri',
        args: [monthId],
        chainId: currentChainId,
      })),
    [contracts.nft, currentChainId, months]
  );

  const { data: uriData } = useReadContracts({
    contracts: uriContracts,
    query: { enabled: months.length > 0 },
  });

  const metadataUrls = useMemo(() => {
    return months.map((monthId, index) => {
      if (metadataBaseUrl) {
        const resolved = resolveTokenUri(metadataBaseUrl, monthId);
        return normalizeIpfsUrl(resolved);
      }
      const uriEntry = uriData?.[index] as { result?: string } | undefined;
      if (!uriEntry?.result) return null;
      const resolved = resolveTokenUri(uriEntry.result, monthId);
      return normalizeIpfsUrl(resolved);
    });
  }, [metadataBaseUrl, months, uriData]);

  // localStorageからキャッシュを取得
  const cachedMetadata = useMemo(() => {
    const cached: Record<string, GoshuinMetadata> = {};
    months.forEach((monthId) => {
      const key = monthId.toString();
      const fromCache = getMetadataFromCache(key);
      if (fromCache) {
        cached[key] = fromCache;
      }
    });
    return cached;
  }, [months]);

  const [fetchedMetadata, setFetchedMetadata] = useState<Record<string, GoshuinMetadata>>({});
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);

  // キャッシュとfetch結果をマージ
  const metadataById = useMemo(
    () => ({ ...cachedMetadata, ...fetchedMetadata }),
    [cachedMetadata, fetchedMetadata]
  );

  const missingMonthIds = useMemo(
    () => months.filter((monthId) => !metadataById[monthId.toString()]),
    [metadataById, months]
  );

  useEffect(() => {
    let cancelled = false;

    const fetchMetadata = async () => {
      if (missingMonthIds.length === 0) {
        setIsMetadataLoading(false);
        return;
      }

      setIsMetadataLoading(true);

      const entries = await Promise.all(
        missingMonthIds.map(async (monthId) => {
          const key = monthId.toString();
          const index = months.findIndex((id) => id === monthId);
          const url = index >= 0 ? metadataUrls[index] : null;
          if (!url) return null;
          try {
            const response = await fetch(url);
            if (!response.ok) return null;
            const data = (await response.json()) as GoshuinMetadata;
            return [key, data] as const;
          } catch {
            return null;
          }
        })
      );

      if (cancelled) return;

      setFetchedMetadata((prev) => {
        const next = { ...prev };
        entries.forEach((entry) => {
          if (!entry) return;
          const [key, data] = entry;
          next[key] = data;
          // localStorageにキャッシュ
          setMetadataToCache(key, data);
        });
        return next;
      });

      setIsMetadataLoading(false);
    };

    void fetchMetadata();

    return () => {
      cancelled = true;
    };
  }, [metadataUrls, missingMonthIds, months]);

  const lastMintLabel = useMemo(
    () => formatMonthId(lastMintMonthId),
    [lastMintMonthId]
  );

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl text-washi mb-1">御朱印帳</h2>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-washi/40">
              Goshuin Collection
            </p>
          </div>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.hash = 'saisen';
              }
            }}
            className="zen-button"
          >
            <span>奉納する</span>
          </button>
        </div>
      </motion.div>

      {!isConnected ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center text-center"
        >
          <p className="font-serif text-base text-washi/60 mb-2">
            ウォレットを接続してください
          </p>
          <p className="font-mono text-[10px] tracking-wider text-washi/30">
            Connect wallet to view collection
          </p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Status */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatusDisplay
              isEligible={isEligible}
              currentMonthLabel={currentMonthLabel}
              nftBalance={nftBalance}
            />
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-washi/40 mb-1">
                  Total
                </p>
                <p className="font-mono text-lg text-washi">{months.length}</p>
              </div>
              <div className="w-px h-8 bg-sumi-lighter" />
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-washi/40 mb-1">
                  Latest
                </p>
                <p className="font-mono text-sm text-washi">{lastMintLabel || '---'}</p>
              </div>
            </div>

            <button
              onClick={refetch}
              disabled={isLoading}
              className="p-2 text-washi/30 hover:text-washi transition-colors disabled:opacity-50"
            >
              <svg
                className={isLoading ? 'animate-spin' : ''}
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M14 8A6 6 0 1 1 8 2" />
                <path d="M8 2L10 4L6 4Z" fill="currentColor" stroke="none" />
              </svg>
            </button>
          </motion.div>

          {isPartial && (
            <p className="font-mono text-[10px] text-washi/30">
              Recent blocks only. Configure VITE_ROUTER_START_BLOCK_* for full history.
            </p>
          )}
          {rangeInfo && <div className="sr-only" />}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 border border-shu/30 bg-shu/5"
            >
              <p className="font-mono text-xs text-shu">{error.message}</p>
            </motion.div>
          )}

          {/* Collection Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="aspect-[3/4] bg-sumi-light animate-pulse"
                />
              ))}
            </div>
          ) : months.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <p className="font-serif text-base text-washi/40 mb-2">
                まだ御朱印がありません
              </p>
              <p className="font-mono text-[10px] tracking-wider text-washi/20">
                Make an offering to receive your first goshuin
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-4"
            >
              {months.map((monthId, index) => (
                <motion.div
                  key={monthId.toString()}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative border border-sumi-lighter hover:border-washi/20 transition-colors duration-300 overflow-hidden"
                >
                  {/* Image */}
                  <div className="aspect-[3/4] bg-sumi-light relative">
                    {(() => {
                      const metadata = metadataById[monthId.toString()];
                      const imageUrl = normalizeIpfsUrl(metadata?.image) ?? null;
                      if (!imageUrl) {
                        return (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <p className="font-mono text-[10px] text-washi/30">
                              {isMetadataLoading ? 'Loading...' : 'No image'}
                            </p>
                          </div>
                        );
                      }
                      return (
                        <img
                          src={imageUrl}
                          alt={metadata?.name || `${formatMonthId(monthId)} 御朱印`}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      );
                    })()}

                    {/* Stamp overlay */}
                    <div className="absolute right-2 bottom-2 font-serif text-xs text-shu/60 border border-shu/40 px-1.5 py-0.5 rotate-[-8deg] bg-sumi/80">
                      済
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 bg-sumi">
                    <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-washi/40 mb-1">
                      Goshuin
                    </p>
                    <p className="font-serif text-sm text-washi">
                      {formatMonthId(monthId)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
