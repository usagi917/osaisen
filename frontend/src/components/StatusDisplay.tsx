import { motion } from 'framer-motion';

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full border border-sumi-lighter p-6 relative overflow-hidden"
    >
      {/* Background pattern - subtle */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }} />
      </div>

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Status indicator */}
          <div className={`
            w-12 h-12 flex items-center justify-center
            ${isEligible ? 'text-shu' : 'text-success'}
          `}>
            {isEligible ? (
              // Gift icon for eligible
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="8" width="18" height="13" rx="1" />
                <path d="M12 8V21" />
                <path d="M3 12H21" />
                <path d="M12 8C12 8 12 5 9 5C6 5 6 8 9 8" />
                <path d="M12 8C12 8 12 5 15 5C18 5 18 8 15 8" />
              </svg>
            ) : (
              // Check icon for completed
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12L11 15L16 9" />
              </svg>
            )}
          </div>

          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-washi/40 mb-1">
              {currentMonthLabel} NFT
            </p>
            <p className={`font-serif text-base ${isEligible ? 'text-washi' : 'text-washi/60'}`}>
              {isEligible ? '今月の御朱印を受け取る' : '授与済み'}
            </p>
          </div>
        </div>

        {/* NFT count */}
        {Number(nftBalance) > 0 && (
          <div className="text-right">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-washi/40 mb-1">
              Total
            </p>
            <p className="font-mono text-lg text-washi">
              {nftBalance.toString()}
            </p>
          </div>
        )}
      </div>

      {/* Decorative corner */}
      {isEligible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute top-0 right-0 w-16 h-16"
        >
          <div className="absolute top-0 right-0 w-0 h-0 border-t-[64px] border-t-shu/10 border-l-[64px] border-l-transparent" />
        </motion.div>
      )}
    </motion.div>
  );
}
