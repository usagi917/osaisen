import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import type { Address } from 'viem';
import { maxUint256 } from 'viem';
import { ERC20_ABI, getContracts } from '../lib/contracts';

interface UseJpycApprovalProps {
  userAddress?: Address;
  chainId: number;
  amount: bigint;
}

export function useJpycApproval({ userAddress, chainId, amount }: UseJpycApprovalProps) {
  const contracts = getContracts(chainId);

  // Read current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: contracts.jpyc,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: userAddress ? [userAddress, contracts.router] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  // Read JPYC balance
  const { data: balance } = useReadContract({
    address: contracts.jpyc,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  // Approve transaction
  const {
    data: approveHash,
    writeContract: approve,
    isPending: isApproving,
    error: approveError,
  } = useWriteContract();

  // Wait for approval confirmation
  const { isLoading: isWaitingApproval, isSuccess: approveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Check if approval is needed
  const needsApproval = allowance !== undefined && allowance < amount;
  const hasEnoughBalance = balance !== undefined && balance >= amount;

  // Execute approve with max amount (for UX - only need to approve once)
  const executeApprove = () => {
    if (!contracts.jpyc || !contracts.router) return;

    approve({
      address: contracts.jpyc,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [contracts.router, maxUint256],
    });
  };

  return {
    allowance,
    balance,
    needsApproval,
    hasEnoughBalance,
    executeApprove,
    isApproving: isApproving || isWaitingApproval,
    approveSuccess,
    approveError,
    refetchAllowance,
  };
}
