import { useReadContract } from 'wagmi';
import type { Address } from 'viem';
import { ROUTER_ABI, NFT_ABI, getContracts } from '../lib/contracts';
import type { SupportedChainId } from '../lib/chains';

interface UseNftEligibilityProps {
  userAddress?: Address;
  chainId: SupportedChainId;
}

export function useNftEligibility({ userAddress, chainId }: UseNftEligibilityProps) {
  const contracts = getContracts(chainId);

  // Check if user is eligible for mint this month
  const {
    data: isEligible,
    refetch: refetchEligibility,
    error: eligibilityError,
    isLoading: isEligibilityLoading,
  } = useReadContract({
    address: contracts.router,
    abi: ROUTER_ABI,
    functionName: 'isEligibleForMint',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  // Get current month ID
  const {
    data: currentMonthId,
    error: currentMonthError,
    isLoading: isCurrentMonthLoading,
  } = useReadContract({
    address: contracts.router,
    abi: ROUTER_ABI,
    functionName: 'getCurrentMonthId',
  });

  // Get user's last mint month ID
  const {
    data: lastMintMonthId,
    error: lastMintError,
    isLoading: isLastMintLoading,
  } = useReadContract({
    address: contracts.router,
    abi: ROUTER_ABI,
    functionName: 'lastMintMonthId',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  // Get NFT balance for current month
  const {
    data: nftBalance,
    error: balanceError,
    isLoading: isBalanceLoading,
  } = useReadContract({
    address: contracts.nft,
    abi: NFT_ABI,
    functionName: 'balanceOf',
    args: userAddress && currentMonthId ? [userAddress, currentMonthId] : undefined,
    query: {
      enabled: !!userAddress && !!currentMonthId,
    },
  });

  const isLoading = isEligibilityLoading || isCurrentMonthLoading || isLastMintLoading || isBalanceLoading;
  const error = eligibilityError || currentMonthError || lastMintError || balanceError;

  // Format month ID to readable string (e.g., 202601 -> "2026年1月")
  const formatMonthId = (monthId: bigint | undefined): string => {
    if (!monthId) return '';
    const id = Number(monthId);
    const year = Math.floor(id / 100);
    const month = id % 100;
    return `${year}年${month}月`;
  };

  return {
    isEligible: isEligible ?? false,
    isLoading,
    error,
    currentMonthId,
    lastMintMonthId,
    nftBalance: nftBalance ?? 0n,
    currentMonthLabel: formatMonthId(currentMonthId),
    refetchEligibility,
  };
}
