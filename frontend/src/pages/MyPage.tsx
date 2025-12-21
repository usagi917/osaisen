import { useEffect, useMemo, useRef, useState } from 'react';
import { useAccount, useReadContracts, useSwitchChain } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import { motion } from 'framer-motion';
import { BookOpen, RefreshCcw } from 'lucide-react';
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

const normalizeIpfsUrl = (uri?: string): string | null => {
  if (!uri) return null;
  if (!uri.startsWith('ipfs://')) return uri;
  const gateway = (import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/')
    .trim()
    .replace(/\/$/, '/');
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

  const amoyChainId = polygonAmoy.id;
  const currentChainId = chainId ?? amoyChainId;

  useEffect(() => {
    if (!isConnected) {
      autoSwitchAttemptedRef.current = false;
      return;
    }

    if (chainId === amoyChainId) {
      autoSwitchAttemptedRef.current = true;
      return;
    }

    if (!autoSwitchAttemptedRef.current && chainId != null) {
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
    query: {
      enabled: months.length > 0,
    },
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

  const [metadataById, setMetadataById] = useState<Record<string, GoshuinMetadata>>({});
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);

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

      setMetadataById((prev) => {
        const next = { ...prev };
        entries.forEach((entry) => {
          if (!entry) return;
          const [key, data] = entry;
          next[key] = data;
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
    <main className="flex-1 flex flex-col gap-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-md-secondary-container text-md-on-secondary-container flex items-center justify-center">
          <BookOpen size={24} />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="type-headline-medium font-bold text-md-on-surface">マイページ</h2>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.hash = 'saisen';
                }
              }}
              className="h-8 px-3 rounded-full bg-md-blue-container text-md-on-blue-container text-xs font-medium hover:shadow-md transition-shadow"
            >
              お賽銭へ
            </button>
          </div>
          <p className="text-sm text-md-on-surface-variant">あなたの御朱印帳</p>
        </div>
      </motion.div>

      {!isConnected ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="md-card md-card-elevated p-6 text-center"
        >
          <p className="text-md-on-surface font-medium">ウォレットを接続すると御朱印帳が表示されます。</p>
          <p className="text-sm text-md-on-surface-variant mt-2">
            上の「ウォレット接続」から接続してください。
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          <StatusDisplay
            isEligible={isEligible}
            currentMonthLabel={currentMonthLabel}
            nftBalance={nftBalance}
          />

          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-md-on-surface">御朱印帳</h3>
            <button
              type="button"
              onClick={refetch}
              disabled={isLoading}
              className="h-9 px-3 rounded-full bg-md-surface-container-high text-md-on-surface-variant text-xs font-medium flex items-center gap-2 hover:bg-md-surface-container-highest transition-colors disabled:opacity-60"
            >
              <RefreshCcw size={14} />
              再読み込み
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-full bg-md-surface-container-high text-md-on-surface-variant">
              合計: <span className="text-md-on-surface ml-1">{months.length}</span>
            </span>
            <span className="px-3 py-1.5 rounded-full bg-md-surface-container-high text-md-on-surface-variant">
              最終授与:
              <span className="text-md-on-surface ml-1">
                {lastMintLabel || '未取得'}
              </span>
            </span>
          </div>
          {isPartial && (
            <p className="text-[11px] text-md-on-surface-variant">
              直近ブロックのみ表示中です。全履歴を表示するには
              VITE_ROUTER_START_BLOCK_* を設定してください。
            </p>
          )}
          {rangeInfo && <div className="sr-only" />}

          {error && (
            <div className="p-4 rounded-2xl bg-md-error-container text-md-on-error-container text-sm font-medium">
              {error.message}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="md-card md-card-elevated h-28 animate-pulse"
                />
              ))}
            </div>
          ) : months.length === 0 ? (
            <div className="md-card md-card-elevated p-6 text-center text-sm text-md-on-surface-variant">
              まだ御朱印がありません。お賽銭ページから奉納すると御朱印が貯まります。
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {months.map((monthId, index) => (
                <motion.div
                  key={monthId.toString()}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="md-card md-card-elevated p-3 border border-md-outline-variant/30 relative overflow-hidden"
                >
                  <div className="relative rounded-2xl overflow-hidden bg-md-surface-container-high aspect-[3/4]">
                    {(() => {
                      const metadata = metadataById[monthId.toString()];
                      const imageUrl = normalizeIpfsUrl(metadata?.image) ?? null;
                      if (!imageUrl) {
                        return (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-xs text-md-on-surface-variant">
                            {isMetadataLoading ? '読み込み中…' : '画像なし'}
                          </div>
                        );
                      }
                      return (
                        <img
                          src={imageUrl}
                          alt={metadata?.name || `${formatMonthId(monthId)} 御朱印`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      );
                    })()}
                    <div className="absolute right-2 bottom-2 rotate-[-12deg] border-2 border-md-secondary text-md-secondary text-xs font-black px-2 py-1 rounded-md bg-md-surface/70">
                      済
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-md-on-surface-variant font-semibold tracking-wide">
                      御朱印
                    </p>
                    <p className="text-base font-bold text-md-on-surface mt-1">
                      {formatMonthId(monthId)}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-md-secondary mt-2">
                      HAKUSAN HIME
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
