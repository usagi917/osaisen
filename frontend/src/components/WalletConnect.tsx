import { useConnect, useAccount, useDisconnect, type Connector } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, LogOut, ChevronRight, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { isWalletConnectEnabled } from '../lib/wagmiConfig';

const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export function WalletConnect() {
  const { connectors, connectAsync, isPending, error } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [showConnectors, setShowConnectors] = useState(false);

  // Shorten address
  const shortAddress = address 
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : '';

  const handleConnect = async (connector: Connector, closeImmediately = false) => {
    // WalletConnectの場合は先にポップアップを閉じてQRモーダルを見えるようにする
    if (closeImmediately) {
      setShowConnectors(false);
    }
    try {
      await connectAsync({ connector });
      setShowConnectors(false);
    } catch {
      // エラー時は何もしない（WalletConnectモーダルが閉じられた場合など）
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowConnectors(false);
  };

  const walletConnectConnector = connectors.find((connector) => connector.id === 'walletConnect');
  const metaMaskConnector = connectors.find(
    (connector) => connector.id === 'metaMaskSDK' || connector.name === 'MetaMask'
  );
  const mobile = useMemo(() => isMobile(), []);

  // Backdrop to handle outside clicks
  const Backdrop = () => (
    <div 
      className="fixed inset-0 z-40" 
      onClick={() => setShowConnectors(false)} 
    />
  );

  if (isConnected && address) {
    return (
      <div className="relative">
        {showConnectors && <Backdrop />}
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setShowConnectors(!showConnectors)}
          className="relative z-50 h-8 sm:h-10 pl-3 sm:pl-4 pr-1.5 sm:pr-2 rounded-full bg-md-surface-container-high text-md-on-surface-variant flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-all hover:bg-md-surface-container-highest state-layer"
        >
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-md-secondary animate-pulse" />
          <span className="font-mono tracking-wide">{shortAddress}</span>
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center">
            <ChevronRight size={14} className={`sm:w-4 sm:h-4 transition-transform duration-200 ${showConnectors ? 'rotate-90' : ''}`} />
          </div>
        </motion.button>

        <AnimatePresence>
          {showConnectors && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute right-0 top-10 sm:top-12 min-w-[180px] sm:min-w-[200px] bg-md-surface-container rounded-2xl shadow-xl border border-md-outline-variant/20 overflow-hidden z-50 p-2"
            >
              <button
                onClick={handleDisconnect}
                className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl flex items-center gap-2.5 sm:gap-3 text-md-error hover:bg-md-error-container/10 transition-colors"
              >
                <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="text-xs sm:text-sm font-medium">切断する</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative z-50">
      {showConnectors && <Backdrop />}
      <AnimatePresence mode="wait">
        {!showConnectors ? (
          <motion.button
            key="connect-btn"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowConnectors(true)}
            className="h-8 sm:h-10 px-4 sm:px-6 rounded-full bg-blue-600 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-sm hover:bg-blue-700 hover:shadow-md transition-all state-layer"
          >
            <Wallet size={16} className="sm:w-[18px] sm:h-[18px]" />
            接続
          </motion.button>
        ) : (
          <motion.div
            key="connector-list"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="fixed inset-x-4 top-4 sm:absolute sm:inset-auto sm:right-0 sm:top-0 w-auto sm:w-80 bg-md-surface-container rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 shadow-xl border border-md-outline-variant/20 z-50 sm:origin-top-right max-h-[85vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center px-1 sm:px-2 py-1 sm:py-2 mb-1 sm:mb-2">
              <span className="text-sm font-medium text-md-on-surface">ウォレットを選択</span>
              <button
                onClick={() => setShowConnectors(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-md-surface-container-highest text-md-on-surface-variant transition-colors"
              >
                <span className="sr-only">Close</span>
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="px-1 sm:px-2">
                <p className="text-xs font-semibold tracking-wide text-md-secondary">おすすめ</p>
              </div>
              <button
                disabled={!walletConnectConnector || isPending}
                onClick={() => {
                  if (!walletConnectConnector) return;
                  handleConnect(walletConnectConnector, true);
                }}
                className="flex items-center justify-between w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl text-left text-white bg-blue-600 hover:bg-blue-700 transition-colors state-layer disabled:opacity-60"
              >
                <div className="flex flex-col gap-0.5 sm:gap-1">
                  <span className="text-xs sm:text-sm font-bold">HashPort Wallet</span>
                  <span className="text-[10px] sm:text-xs text-blue-100">
                    {mobile ? 'タップして接続手順を表示' : 'QRコードをスキャンして接続'}
                  </span>
                </div>
                <ChevronRight size={16} className="text-blue-100 shrink-0" />
              </button>
              {mobile && (
                <div className="px-2 py-2 text-[10px] sm:text-[11px] leading-relaxed text-md-on-surface-variant bg-md-surface-container-high rounded-xl">
                  <p className="font-semibold mb-1">スマホでの接続手順:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>上のボタンをタップ</li>
                    <li>表示される画面で「Copy link」をタップ</li>
                    <li>HashPort Walletアプリを開く</li>
                    <li>WalletConnect接続でリンクを貼り付け</li>
                  </ol>
                </div>
              )}
              {!isWalletConnectEnabled && (
                <div className="px-2 text-[10px] sm:text-[11px] leading-snug text-md-error">
                  WalletConnectのProject IDが未設定です。frontend/.env に
                  VITE_WALLETCONNECT_PROJECT_ID を設定してください。
                </div>
              )}
            </div>

            <div className="h-px bg-md-outline-variant/30 my-1" />

            <div className="flex flex-col gap-2 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto no-scrollbar">
              <div className="px-1 sm:px-2">
                <p className="text-xs font-semibold tracking-wide text-md-on-surface-variant">その他のウォレット</p>
              </div>
              <div className="flex flex-col gap-1">
                {metaMaskConnector && (
                  <button
                    onClick={() => handleConnect(metaMaskConnector)}
                    disabled={isPending}
                    className="flex items-center justify-between w-full p-2.5 sm:p-3 rounded-xl text-left text-md-on-surface hover:bg-md-surface-container-high transition-colors state-layer group"
                  >
                    <span className="text-xs sm:text-sm font-medium group-hover:text-md-primary transition-colors">MetaMask</span>
                    <ChevronRight size={16} className="text-md-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-1 px-2 text-[10px] sm:text-[11px] text-md-error">
                {error.message}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
