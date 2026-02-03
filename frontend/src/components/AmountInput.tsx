import { motion } from 'framer-motion';

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
    <div className="w-full flex flex-col items-center">
      {/* Balance display */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8 text-center"
      >
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-washi/40 mb-1">
          Balance
        </p>
        <p className="font-mono text-sm text-washi/70">
          {balanceNumber?.toLocaleString() ?? '---'} <span className="text-washi/40">JPYC</span>
        </p>
      </motion.div>

      {/* Main input area */}
      <div className="relative w-full flex flex-col items-center mb-8">
        {/* Large number input */}
        <div className="relative flex items-baseline justify-center gap-2">
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            min={minAmount}
            placeholder="0"
            className="w-full max-w-[240px] text-center bg-transparent border-none p-0 font-serif text-5xl sm:text-6xl md:text-7xl text-washi focus:ring-0 focus:outline-none placeholder:text-washi/10 caret-shu"
          />
        </div>

        {/* Currency label */}
        <p className="font-mono text-xs tracking-[0.3em] uppercase text-washi/30 mt-4">
          JPYC
        </p>

        {/* Underline */}
        <div className="w-full max-w-[200px] mt-4">
          <div className="h-px bg-sumi-lighter" />
          <motion.div
            className="h-px bg-shu -mt-px origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isValidAmount ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Validation message */}
      <div className="h-6 mb-6">
        {!isValidAmount ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-xs text-shu"
          >
            {minAmount} JPYC from
          </motion.p>
        ) : !hasEnoughBalance ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-xs text-shu"
          >
            Insufficient balance
          </motion.p>
        ) : null}
      </div>

      {/* Preset amounts */}
      <div className="flex flex-wrap justify-center gap-2">
        {PRESET_AMOUNTS.map((preset, index) => {
          const isSelected = value === preset;
          return (
            <motion.button
              key={preset}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onChange(preset)}
              className={`
                relative px-4 py-2 font-mono text-xs tracking-wider
                border transition-all duration-300
                ${isSelected
                  ? 'border-shu text-shu bg-shu/5'
                  : 'border-sumi-lighter text-washi/50 hover:border-washi/30 hover:text-washi/80'
                }
              `}
            >
              {isSelected && (
                <motion.div
                  layoutId="preset-indicator"
                  className="absolute inset-0 border border-shu"
                  transition={{ duration: 0.2 }}
                />
              )}
              <span className="relative z-10">¥{preset.toLocaleString()}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
