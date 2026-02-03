import { motion } from 'framer-motion';

interface SaisenButtonProps {
  amount: number;
  minAmount: number;
  needsApproval: boolean;
  hasEnoughBalance: boolean;
  isApproving: boolean;
  isSending: boolean;
  isConfirming: boolean;
  onApprove: () => void;
  onSaisen: (e: React.MouseEvent) => void;
}

// Loading spinner
function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function SaisenButton({
  amount,
  minAmount,
  needsApproval,
  hasEnoughBalance,
  isApproving,
  isSending,
  isConfirming,
  onApprove,
  onSaisen,
}: SaisenButtonProps) {
  const isValidAmount = amount >= minAmount;

  const getButtonState = () => {
    if (!isValidAmount) return { text: '金額を入力', disabled: true, loading: false, type: 'disabled' };
    if (!hasEnoughBalance) return { text: '残高不足', disabled: true, loading: false, type: 'disabled' };

    if (isApproving) return { text: '承認中', disabled: true, loading: true, type: 'loading' };
    if (needsApproval) return { text: 'JPYCを許可', disabled: false, loading: false, type: 'secondary' };

    if (isSending) return { text: '奉納中', disabled: true, loading: true, type: 'loading' };
    if (isConfirming) return { text: '確認中', disabled: true, loading: true, type: 'loading' };

    return { text: '奉納する', disabled: false, loading: false, type: 'primary' };
  };

  const state = getButtonState();

  return (
    <div className="w-full flex flex-col items-center">
      <motion.button
        whileHover={!state.disabled ? { scale: 1.01 } : {}}
        whileTap={!state.disabled ? { scale: 0.99 } : {}}
        onClick={needsApproval ? onApprove : onSaisen}
        disabled={state.disabled}
        className={`
          relative w-full max-w-md h-14 font-serif text-lg tracking-[0.1em]
          flex items-center justify-center gap-3
          transition-all duration-500 overflow-hidden
          ${state.type === 'primary'
            ? 'bg-shu text-washi hover:bg-shu-light'
            : state.type === 'secondary'
            ? 'border border-washi/30 text-washi hover:bg-washi/5'
            : state.type === 'loading'
            ? 'bg-sumi-light text-washi/60 cursor-wait'
            : 'bg-sumi-light text-washi/30 cursor-not-allowed'
          }
        `}
      >
        {/* Background animation for primary button */}
        {state.type === 'primary' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-shu via-shu-light to-shu"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ backgroundSize: '200% 100%' }}
          />
        )}

        <span className="relative z-10 flex items-center gap-3">
          {state.loading && <Spinner />}
          {state.text}
        </span>
      </motion.button>

      {needsApproval && !isApproving && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 font-mono text-[10px] tracking-wider text-washi/40 text-center"
        >
          Initial approval required for JPYC
        </motion.p>
      )}
    </div>
  );
}
