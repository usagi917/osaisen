import { motion, AnimatePresence } from 'framer-motion';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  monthId?: bigint;
  minted: boolean;
  txHash?: string;
  chainId: number;
}

export function ResultModal({
  isOpen,
  onClose,
  amount,
  monthId,
  minted,
  txHash,
  chainId,
}: ResultModalProps) {
  const getExplorerUrl = (hash: string) => {
    switch (chainId) {
      case 80002:
        return `https://amoy.polygonscan.com/tx/${hash}`;
      case 137:
        return `https://polygonscan.com/tx/${hash}`;
      default:
        return `https://polygonscan.com/tx/${hash}`;
    }
  };

  const formatMonthId = (id: bigint): string => {
    const num = Number(id);
    const year = Math.floor(num / 100);
    const month = num % 100;
    return `${year}年${month}月`;
  };

  const explorerUrl = txHash ? getExplorerUrl(txHash) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-sumi/90 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-sumi border border-sumi-lighter p-8 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-washi/30 hover:text-washi transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>

            {/* Content */}
            <div className="flex flex-col items-center text-center pt-4">
              {/* Success icon with ink spread animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.4, duration: 0.8, delay: 0.1 }}
                className="relative mb-8"
              >
                <div className="w-20 h-20 border border-shu flex items-center justify-center text-shu">
                  <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                  >
                    <motion.path
                      d="M8 16L14 22L24 10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    />
                  </motion.svg>
                </div>

                {/* Ripple effect */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.6 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="absolute inset-0 border border-shu"
                />
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-serif text-2xl text-washi mb-2"
              >
                奉納完了
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="font-mono text-[10px] tracking-[0.2em] uppercase text-washi/40 mb-8"
              >
                Offering Complete
              </motion.p>

              {/* Amount */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <p className="font-serif text-5xl text-washi mb-2">
                  {amount.toLocaleString()}
                </p>
                <p className="font-mono text-xs tracking-[0.3em] uppercase text-washi/40">
                  JPYC
                </p>
              </motion.div>

              {/* NFT Minted notification */}
              {minted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="w-full border border-shu/30 bg-shu/5 p-6 mb-8 relative"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-shu">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="8" width="18" height="13" rx="1" />
                        <path d="M12 8V21" />
                        <path d="M3 12H21" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-shu mb-1">
                        NFT Granted
                      </p>
                      <p className="font-serif text-base text-washi">
                        {monthId && formatMonthId(monthId)} 御朱印
                      </p>
                    </div>
                  </div>

                  {/* Stamp effect */}
                  <motion.div
                    initial={{ opacity: 0, scale: 1.5, rotate: 15 }}
                    animate={{ opacity: 0.15, scale: 1, rotate: -12 }}
                    transition={{ delay: 0.7, duration: 0.4 }}
                    className="absolute right-4 bottom-4 font-serif text-4xl text-shu border-2 border-current px-2 py-1"
                  >
                    済
                  </motion.div>
                </motion.div>
              )}

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex gap-3 w-full"
              >
                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 h-12 border border-sumi-lighter flex items-center justify-center gap-2 font-mono text-xs tracking-wider text-washi/60 hover:border-washi/30 hover:text-washi transition-all duration-300"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 1H2C1.5 1 1 1.5 1 2V12C1 12.5 1.5 13 2 13H12C12.5 13 13 12.5 13 12V8" />
                      <path d="M9 1H13V5" />
                      <path d="M13 1L6 8" />
                    </svg>
                    Explorer
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="flex-1 h-12 bg-shu flex items-center justify-center gap-2 font-mono text-xs tracking-wider text-washi hover:bg-shu-light transition-colors"
                >
                  Close
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
