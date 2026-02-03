import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { parseUnits } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { AmountInput } from '../components/AmountInput';
import { SaisenButton } from '../components/SaisenButton';
import { StatusDisplay } from '../components/StatusDisplay';
import { ResultModal } from '../components/ResultModal';
import { useJpycApproval } from '../hooks/useJpycApproval';
import { useNftEligibility } from '../hooks/useNftEligibility';
import { useSaisen } from '../hooks/useSaisen';
import { DEFAULT_CHAIN_ID, resolveSupportedChainId } from '../lib/chains';
import { JPYC_DECIMALS } from '../lib/contracts';

const MIN_AMOUNT = 115;

// Ripple effect component
function Ripple({ x, y, onComplete }: { x: number; y: number; onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0.6 }}
      animate={{ scale: 4, opacity: 0 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      className="absolute w-32 h-32 rounded-full border border-shu pointer-events-none"
      style={{ left: x - 64, top: y - 64 }}
    />
  );
}

export function SaisenPage() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const [amount, setAmount] = useState(MIN_AMOUNT);
  const [showResult, setShowResult] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const autoSwitchAttemptedRef = useRef(false);
  const rippleIdRef = useRef(0);

  const amoyChainId = DEFAULT_CHAIN_ID;
  const currentChainId = resolveSupportedChainId(chainId);

  // Auto-switch to Amoy
  useEffect(() => {
    if (!isConnected) {
      autoSwitchAttemptedRef.current = false;
      return;
    }
    if (chainId === amoyChainId) {
      autoSwitchAttemptedRef.current = true;
      return;
    }
    if (!autoSwitchAttemptedRef.current && chainId !== undefined) {
      switchChain({ chainId: amoyChainId });
      autoSwitchAttemptedRef.current = true;
    }
  }, [isConnected, chainId, amoyChainId, switchChain]);

  const {
    balance,
    needsApproval,
    hasEnoughBalance,
    executeApprove,
    isApproving,
    approveSuccess,
    refetchAllowance,
  } = useJpycApproval({
    userAddress: address,
    chainId: currentChainId,
    amount: parseUnits(amount.toString(), JPYC_DECIMALS),
  });

  const {
    isEligible,
    currentMonthLabel,
    nftBalance,
    refetchEligibility,
  } = useNftEligibility({
    userAddress: address,
    chainId: currentChainId,
  });

  const {
    executeSaisen,
    isSending,
    isConfirming,
    isConfirmed,
    saisenHash,
    saisenError,
    saisenResult,
    resetSaisen,
  } = useSaisen({ chainId: currentChainId });

  useEffect(() => {
    if (approveSuccess) {
      refetchAllowance();
    }
  }, [approveSuccess, refetchAllowance]);

  useEffect(() => {
    if (isConfirmed && saisenResult) {
      refetchEligibility();
    }
  }, [isConfirmed, saisenResult, refetchEligibility]);

  const shouldShowResult = showResult || (isConfirmed && saisenResult != null);

  const handleCloseResult = () => {
    setShowResult(false);
    resetSaisen();
  };

  const addRipple = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = rippleIdRef.current++;
    setRipples((prev) => [...prev, { id, x, y }]);
  }, []);

  const removeRipple = useCallback((id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleSaisen = (e: React.MouseEvent) => {
    addRipple(e);
    executeSaisen(amount);
  };

  return (
    <>
      <div className="flex-1 flex flex-col justify-center relative">
        {/* Ripple container */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <AnimatePresence>
            {ripples.map((ripple) => (
              <Ripple
                key={ripple.id}
                x={ripple.x}
                y={ripple.y}
                onComplete={() => removeRipple(ripple.id)}
              />
            ))}
          </AnimatePresence>
        </div>

        {!isConnected ? (
          // Landing - Disconnected state
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center text-center"
          >
            {/* Hero text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-12"
            >
              <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl tracking-[0.05em] text-washi leading-tight mb-4">
                デジタル<br />
                <span className="text-shu">お賽銭</span>
              </h2>
              <p className="font-mono text-xs tracking-[0.3em] uppercase text-washi/40">
                A new form of offering
              </p>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="font-serif text-sm sm:text-base text-washi/60 leading-relaxed max-w-xs mb-12"
            >
              ブロックチェーンで奉納する<br />
              新しい参拝のカタチ
            </motion.p>

            {/* Connect prompt */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-sumi-lighter to-transparent" />
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-washi/30">
                Connect wallet to begin
              </p>
            </motion.div>
          </motion.div>
        ) : (
          // Connected state
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center w-full"
          >
            {/* Status */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="w-full mb-12"
            >
              <StatusDisplay
                isEligible={isEligible}
                currentMonthLabel={currentMonthLabel}
                nftBalance={nftBalance}
              />
            </motion.div>

            {/* Amount Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full mb-8"
            >
              <AmountInput
                value={amount}
                onChange={setAmount}
                minAmount={MIN_AMOUNT}
                balance={balance}
                decimals={JPYC_DECIMALS}
              />
            </motion.div>

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full"
            >
              <SaisenButton
                amount={amount}
                minAmount={MIN_AMOUNT}
                needsApproval={needsApproval}
                hasEnoughBalance={hasEnoughBalance}
                isApproving={isApproving}
                isSending={isSending}
                isConfirming={isConfirming}
                onApprove={executeApprove}
                onSaisen={handleSaisen}
              />

              {saisenError && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 border border-shu/30 bg-shu/5"
                >
                  <p className="font-mono text-xs text-shu text-center">
                    {saisenError.message}
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Result Modal */}
      <ResultModal
        isOpen={shouldShowResult}
        onClose={handleCloseResult}
        amount={amount}
        monthId={saisenResult?.monthId}
        minted={saisenResult?.minted ?? false}
        txHash={saisenHash}
        chainId={currentChainId}
      />
    </>
  );
}
