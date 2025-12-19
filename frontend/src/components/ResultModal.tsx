import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ExternalLink, Gift, Share2 } from 'lucide-react';

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
      case 80002: // Amoy
        return `https://amoy.polygonscan.com/tx/${hash}`;
      case 137: // Polygon
        return `https://polygonscan.com/tx/${hash}`;
      default:
        return `https://polygonscan.com/tx/${hash}`; // Default fallback
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-md-surface-container-lowest/80 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-md-surface-container rounded-[2rem] p-6 shadow-2xl overflow-hidden border border-md-outline-variant/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button (Icon Button) */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-md-on-surface-variant hover:bg-md-on-surface/10 transition-colors z-20"
            >
              <X size={24} />
            </button>

            <div className="flex flex-col items-center relative z-10 pt-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                className="w-20 h-20 bg-md-primary-container rounded-full flex items-center justify-center mb-6 text-md-on-primary-container shadow-lg"
              >
                <Check size={40} className="stroke-[3]" />
              </motion.div>

              <h2 className="type-headline-medium text-md-on-surface mb-1">奉納完了</h2>
              <p className="text-md-on-surface-variant text-sm mb-8">Thank you for your donation</p>

              <div className="text-center mb-8">
                <span className="type-display-large text-md-primary font-medium">
                  {amount.toLocaleString()}
                </span>
                <span className="type-headline-medium text-md-on-surface-variant ml-2">JPYC</span>
              </div>

              {minted && (
                <motion.div
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="w-full bg-md-tertiary-container text-md-on-tertiary-container rounded-2xl p-4 mb-6 flex items-center gap-4 relative overflow-hidden group"
                >
                  <div className="p-3 bg-md-on-tertiary-container/10 rounded-full">
                    <Gift size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold tracking-wider opacity-80">NFT GRANTED</p>
                    <p className="font-bold text-lg">
                      {monthId && formatMonthId(monthId)} 御朱印
                    </p>
                  </div>
                  {/* Stamp Effect */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 2, rotate: 10 }}
                    animate={{ opacity: 0.2, scale: 1, rotate: -10 }}
                    className="absolute right-0 bottom-0 text-md-on-tertiary-container border-4 border-current rounded-lg p-2 font-black text-4xl rotate-[-15deg] pointer-events-none"
                  >
                    済
                  </motion.div>
                </motion.div>
              )}

              <div className="flex gap-3 w-full">
                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 h-12 rounded-full border border-md-outline text-md-primary flex items-center justify-center gap-2 hover:bg-md-primary/10 transition-colors state-layer text-sm font-medium"
                  >
                    <ExternalLink size={18} />
                    詳細
                  </a>
                )}
                {/* Share Button (Filled Button) */}
                <button className="flex-1 h-12 rounded-full bg-md-primary-container text-md-on-primary-container flex items-center justify-center gap-2 hover:shadow-md transition-all state-layer text-sm font-medium">
                  <Share2 size={18} />
                  シェア
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
