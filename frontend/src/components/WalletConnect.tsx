import { useConnect, useAccount, useDisconnect, type Connector } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { isWalletConnectEnabled } from '../lib/wagmiConfig';
import { humanizeError } from '../lib/errorMessages';

const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export function WalletConnect() {
  const { connectors, connectAsync, isPending, error } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [showConnectors, setShowConnectors] = useState(false);

  const shortAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : '';

  const handleConnect = async (connector: Connector, closeImmediately = false) => {
    if (closeImmediately) {
      setShowConnectors(false);
    }
    try {
      await connectAsync({ connector });
      setShowConnectors(false);
    } catch {
      // Handle error silently
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowConnectors(false);
  };

  const walletConnectConnector = connectors.find((c) => c.id === 'walletConnect');
  const metaMaskConnector = connectors.find(
    (c) => c.id === 'metaMaskSDK' || c.name === 'MetaMask'
  );
  const mobile = useMemo(() => isMobile(), []);

  // Connected state
  if (isConnected && address) {
    return (
      <div className="relative">
        {showConnectors && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowConnectors(false)}
          />
        )}

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowConnectors(!showConnectors)}
          className="relative z-50 flex items-center gap-2 py-2 px-3 border border-sumi-lighter hover:border-washi/30 transition-colors duration-300"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="font-mono text-xs tracking-wider text-washi/80">
            {shortAddress}
          </span>
        </motion.button>

        <AnimatePresence>
          {showConnectors && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 z-50 bg-sumi-light border border-sumi-lighter p-1 min-w-[160px]"
            >
              <button
                onClick={handleDisconnect}
                className="w-full text-left px-3 py-2 font-mono text-xs tracking-wider text-shu hover:bg-sumi-lighter transition-colors"
              >
                接続解除
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Disconnected state
  return (
    <div className="relative z-50">
      {showConnectors && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowConnectors(false)}
        />
      )}

      <AnimatePresence mode="wait">
        {!showConnectors ? (
          <motion.button
            key="connect"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConnectors(true)}
            className="zen-button"
          >
            <span>接続する</span>
          </motion.button>
        ) : (
          <motion.div
            key="connectors"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 sm:absolute sm:inset-auto sm:right-0 sm:top-0 sm:w-80 bg-sumi border border-sumi-lighter p-6 z-50 max-h-[85vh] overflow-y-auto no-scrollbar"
            role="dialog"
            aria-label="ウォレット接続"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-lg tracking-wide text-washi">
                接続
              </h3>
              <button
                onClick={() => setShowConnectors(false)}
                className="w-8 h-8 flex items-center justify-center text-washi/40 hover:text-washi transition-colors"
                aria-label="閉じる"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            </div>
            <p className="font-mono text-[10px] text-washi/30 mb-8">
              ウォレットはデジタルなお財布です
            </p>

            {/* Recommended */}
            <div className="mb-6">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-washi/40 mb-3">
                おすすめ
              </p>
              <button
                disabled={!walletConnectConnector || isPending}
                onClick={() => {
                  if (!walletConnectConnector) return;
                  handleConnect(walletConnectConnector, true);
                }}
                className="w-full p-4 bg-sumi-light border border-sumi-lighter hover:border-washi/30 transition-all duration-300 text-left group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm text-washi mb-1">
                      HashPort Wallet
                    </p>
                    <p className="font-mono text-[10px] text-washi/40">
                      {mobile ? 'タップして接続' : 'QRコードをスキャン'}
                    </p>
                    <p className="font-mono text-[10px] text-washi/30 mt-1">
                      初めての方におすすめ
                    </p>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="text-washi/30 group-hover:text-washi/60 transition-colors"
                  >
                    <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
              </button>

              {mobile && (
                <div className="mt-3 p-3 bg-sumi-light border border-sumi-lighter">
                  <p className="font-mono text-[10px] text-washi/60 leading-relaxed">
                    1. 上のボタンをタップ<br />
                    2. リンクをコピー<br />
                    3. HashPort Walletを開く<br />
                    4. WalletConnectで接続
                  </p>
                </div>
              )}

              {!isWalletConnectEnabled && (
                <p className="mt-3 font-mono text-[10px] text-shu">
                  この接続方法は現在ご利用いただけません
                </p>
              )}
            </div>

            {/* Other wallets */}
            <div>
              <div className="zen-divider mb-4" />
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-washi/40 mb-3">
                その他
              </p>
              {metaMaskConnector && (
                <button
                  onClick={() => handleConnect(metaMaskConnector)}
                  disabled={isPending}
                  className="w-full p-3 border border-sumi-lighter hover:border-washi/30 transition-all duration-300 text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm text-washi/80">
                        MetaMask
                      </p>
                      <p className="font-mono text-[10px] text-washi/30 mt-1">
                        暗号資産に慣れている方向け
                      </p>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="text-washi/20 group-hover:text-washi/40 transition-colors"
                    >
                      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </div>
                </button>
              )}
            </div>

            {error && (
              <div className="mt-4">
                <p className="font-mono text-[10px] text-shu">
                  {humanizeError(error).title}
                </p>
                {humanizeError(error).action && (
                  <p className="font-mono text-[10px] text-washi/40 mt-1">
                    {humanizeError(error).action}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
