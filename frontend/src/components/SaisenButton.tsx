import { motion } from 'framer-motion';
import { Send, Lock, Loader2 } from 'lucide-react';

interface SaisenButtonProps {
  amount: number;
  minAmount: number;
  needsApproval: boolean;
  hasEnoughBalance: boolean;
  isApproving: boolean;
  isSending: boolean;
  isConfirming: boolean;
  onApprove: () => void;
  onSaisen: () => void;
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
    if (!isValidAmount) return { text: '金額を入力', icon: null, disabled: true, type: 'disabled' };
    if (!hasEnoughBalance) return { text: '残高不足', icon: null, disabled: true, type: 'disabled' };
    
    if (isApproving) return { text: '承認中...', icon: <Loader2 className="animate-spin" />, disabled: true, type: 'loading' };
    if (needsApproval) return { text: 'JPYCを許可する', icon: <Lock />, disabled: false, type: 'secondary' };
    
    if (isSending) return { text: '奉納中...', icon: <Loader2 className="animate-spin" />, disabled: true, type: 'loading' };
    if (isConfirming) return { text: '確認中...', icon: <Loader2 className="animate-spin" />, disabled: true, type: 'loading' };

    return { text: '奉納する', icon: <Send />, disabled: false, type: 'primary' };
  };

  const state = getButtonState();

  const styles = {
    primary: 'bg-md-blue-container text-md-on-blue-container hover:shadow-md',
    secondary: 'bg-md-secondary-container text-md-on-secondary-container hover:shadow-md',
    loading: 'bg-md-surface-container-highest text-md-on-surface-variant cursor-wait opacity-80',
    disabled: 'bg-md-surface-container-high text-md-on-surface-variant/50 cursor-not-allowed',
  };

  const buttonStyle = styles[state.type as keyof typeof styles];

  return (
    <div className="w-full max-w-md mt-4">
      <motion.button
        whileHover={!state.disabled ? { scale: 1.01 } : {}}
        whileTap={!state.disabled ? { scale: 0.98 } : {}}
        onClick={needsApproval ? onApprove : onSaisen}
        disabled={state.disabled}
        className={`w-full h-14 rounded-full text-lg font-medium tracking-wide flex items-center justify-center gap-3 transition-all relative overflow-hidden state-layer shadow-sm ${buttonStyle}`}
      >
        {state.icon}
        {state.text}
      </motion.button>

      {needsApproval && !isApproving && (
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="text-center text-md-on-surface-variant text-xs mt-3 bg-md-surface-container px-4 py-2 rounded-xl mx-auto inline-block"
        >
          初回のみコントラクトへのアクセス許可が必要です
        </motion.p>
      )}
    </div>
  );
}
