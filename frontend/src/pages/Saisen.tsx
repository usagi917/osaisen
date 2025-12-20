import { useState, useEffect, useRef } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import { parseUnits } from 'viem';
import { motion } from 'framer-motion';
import { WalletConnect } from '../components/WalletConnect';
import { AmountInput } from '../components/AmountInput';
import { SaisenButton } from '../components/SaisenButton';
import { StatusDisplay } from '../components/StatusDisplay';
import { ResultModal } from '../components/ResultModal';
import { useJpycApproval } from '../hooks/useJpycApproval';
import { useNftEligibility } from '../hooks/useNftEligibility';
import { useSaisen } from '../hooks/useSaisen';
import { JPYC_DECIMALS } from '../lib/contracts';

const MIN_AMOUNT = 115; // 115 JPYC

export function SaisenPage() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const [amount, setAmount] = useState(MIN_AMOUNT);
  const [showResult, setShowResult] = useState(false);
  const autoSwitchAttemptedRef = useRef(false);

  const amoyChainId = polygonAmoy.id;

  const currentChainId = chainId ?? amoyChainId;

  // Auto-switch to Amoy on connect (one attempt per connection)
  useEffect(() => {
    if (!isConnected) {
      autoSwitchAttemptedRef.current = false;
      return;
    }

    if (chainId === amoyChainId) {
      autoSwitchAttemptedRef.current = true;
      return;
    }

    if (!autoSwitchAttemptedRef.current && chainId != null) {
      switchChain({ chainId: amoyChainId });
      autoSwitchAttemptedRef.current = true;
    }
  }, [isConnected, chainId, amoyChainId, switchChain]);

  // Hooks
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

  // Refetch allowance after approval
  useEffect(() => {
    if (approveSuccess) {
      refetchAllowance();
    }
  }, [approveSuccess, refetchAllowance]);

  // Show result modal after confirmation
  useEffect(() => {
    if (isConfirmed && saisenResult) {
      refetchEligibility();
    }
  }, [isConfirmed, saisenResult, refetchEligibility]);

  // Derive showResult from confirmation state
  const shouldShowResult = showResult || (isConfirmed && saisenResult != null);

  const handleCloseResult = () => {
    setShowResult(false);
    resetSaisen();
  };

  const handleSaisen = () => {
    executeSaisen(amount);
  };

  return (
    <div className="min-h-[100dvh] relative flex flex-col p-6 max-w-lg mx-auto bg-md-surface text-md-on-surface font-sans">
      
      {/* Navbar */}
      <header className="flex justify-between items-center mb-8 relative z-20">
        <div>
          <h1 className="type-headline-medium font-bold tracking-tight leading-none text-md-primary">
            HAKUSAN<br/>HIME
          </h1>
          <p className="type-label-large text-md-secondary font-bold tracking-[0.2em] mt-1 opacity-80">白山比咩神社</p>
        </div>
        <WalletConnect />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center relative z-10">
        {!isConnected ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="inline-block relative">
              <div className="absolute inset-0 bg-md-primary blur-3xl opacity-20 animate-pulse" />
              <h2 className="type-display-large font-black relative drop-shadow-lg">
                DIGITAL<br />
                <span className="text-md-primary">O
                  SAISEN</span>
              </h2>
            </div>
            <p className="text-md-on-surface-variant type-headline-medium !text-lg !font-medium leading-relaxed max-w-xs mx-auto">
              ブロックチェーンで奉納する<br/>新しい参拝のカタチ
            </p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 w-full"
          >
            {/* Status Display */}
            <div className="flex justify-center">
              <StatusDisplay
                isEligible={isEligible}
                currentMonthLabel={currentMonthLabel}
                nftBalance={nftBalance}
              />
            </div>

            {/* Input Area */}
            <AmountInput
              value={amount}
              onChange={setAmount}
              minAmount={MIN_AMOUNT}
              balance={balance}
              decimals={JPYC_DECIMALS}
            />

            {/* Action Area */}
            <div>
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-md-error-container text-md-on-error-container rounded-xl text-sm text-center font-medium"
                >
                  {saisenError.message}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer Minimal */}
      <footer className="mt-8 text-center pb-safe">
        <p className="text-xs text-md-on-surface-variant opacity-60 font-mono">
          POWERED BY kuroko 
        </p>
      </footer>

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
    </div>
  );
}
