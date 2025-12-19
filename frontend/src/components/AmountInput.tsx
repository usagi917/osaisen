import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';

interface AmountInputProps {
  value: number;
  onChange: (value: number) => void;
  minAmount: number;
  balance?: bigint;
  decimals?: number;
}

const PRESET_AMOUNTS = [115, 500, 1000, 5000];

export function AmountInput({
  value,
  onChange,
  minAmount,
  balance,
  decimals = 18,
}: AmountInputProps) {
  const balanceNumber = balance
    ? Number(balance) / Math.pow(10, decimals)
    : undefined;

  const isValidAmount = value >= minAmount;
  const hasEnoughBalance = balanceNumber === undefined || value <= balanceNumber;

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-6 py-6">
      {/* Balance Subtitle */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 text-md-on-surface-variant text-sm font-medium bg-md-surface-container px-3 py-1 rounded-full"
      >
        <Coins size={14} />
        <span>Balance: {balanceNumber?.toLocaleString() ?? '...'} JPYC</span>
      </motion.div>

      {/* Hero Input (MD3 Typography) */}
      <div className="relative w-full flex justify-center items-baseline gap-1">
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          min={minAmount}
          placeholder="0"
          className="w-full text-center bg-transparent border-none p-0 type-display-large font-normal text-md-on-surface focus:ring-0 focus:outline-none placeholder-md-on-surface-variant/20 caret-md-primary"
        />
        <span className="type-headline-medium text-md-on-surface-variant absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
          JPYC
        </span>
      </div>
      
      {/* Validation Line */}
      <div className="h-6">
        {!isValidAmount ? (
          <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-md-error text-sm font-medium bg-md-error-container/10 px-3 py-0.5 rounded-md">
            最低 {minAmount} JPYC から
          </motion.p>
        ) : !hasEnoughBalance ? (
          <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-md-error text-sm font-medium bg-md-error-container/10 px-3 py-0.5 rounded-md">
            残高不足
          </motion.p>
        ) : null}
      </div>

      {/* Preset Chips (MD3 Filter Chips) */}
      <div className="flex flex-wrap justify-center gap-3 w-full px-2">
        {PRESET_AMOUNTS.map((preset) => {
          const isSelected = value === preset;
          return (
            <motion.button
              key={preset}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(preset)}
              className={`h-8 px-4 rounded-lg text-sm font-medium transition-colors border relative overflow-hidden state-layer
                ${isSelected
                  ? 'bg-md-secondary-container text-md-on-secondary-container border-transparent'
                  : 'bg-transparent text-md-on-surface-variant border-md-outline-variant hover:bg-md-on-surface/5'
                }`}
            >
              {isSelected && <span className="mr-1.5">✓</span>}
              ¥{preset.toLocaleString()}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
