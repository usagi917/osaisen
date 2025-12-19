import { motion } from 'framer-motion';
import { Gift, CheckCircle } from 'lucide-react';

interface StatusDisplayProps {
  isEligible: boolean;
  currentMonthLabel: string;
  nftBalance: bigint;
}

export function StatusDisplay({
  isEligible,
  currentMonthLabel,
  nftBalance,
}: StatusDisplayProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md p-4 rounded-3xl border border-md-outline-variant bg-md-surface-container-low flex items-center justify-between relative overflow-hidden"
    >
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          isEligible 
            ? 'bg-md-tertiary-container text-md-on-tertiary-container' 
            : 'bg-md-secondary-container text-md-on-secondary-container'
        }`}>
          {isEligible ? <Gift size={24} /> : <CheckCircle size={24} />}
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-md-on-surface-variant font-medium tracking-wider uppercase mb-0.5">
            {currentMonthLabel} Monthly NFT
          </span>
          <span className={`text-base font-medium ${isEligible ? 'text-md-on-surface' : 'text-md-on-surface-variant'}`}>
            {isEligible ? '今月の御朱印を受け取る' : '授与済み'}
          </span>
        </div>
      </div>

      <div className="text-right relative z-10">
        {Number(nftBalance) > 0 && (
          <div className="text-xs font-medium text-md-on-surface-variant bg-md-surface-container-high px-3 py-1.5 rounded-full">
            保有数: <span className="text-md-on-surface ml-1">{nftBalance.toString()}</span>
          </div>
        )}
      </div>
      
      {/* State Layer (Hover Effect) */}
      <div className="absolute inset-0 bg-md-on-surface opacity-0 hover:opacity-[0.08] transition-opacity pointer-events-none" />
    </motion.div>
  );
}
