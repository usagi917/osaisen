import { useReadContract } from 'wagmi';
import type { Address } from 'viem';
import { ROUTER_ABI, NFT_ABI, getContracts } from '../lib/contracts';

interface UseNftEligibilityProps {
  userAddress?: Address;
  chainId: number;
}

export function useNftEligibility({ userAddress, chainId }: UseNftEligibilityProps) {
  const contracts = getContracts(chainId);

  // Check if user is eligible for mint this month
  const { data: isEligible, refetch: refetchEligibility } = useReadContract({
    address: contracts.router,
    abi: ROUTER_ABI,
    functionName: 'isEligibleForMint',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  // Get current month ID
  const { data: currentMonthId } = useReadContract({
    address: contracts.router,
    abi: ROUTER_ABI,
    functionName: 'getCurrentMonthId',
  });

  // Get user's last mint month ID
  const { data: lastMintMonthId } = useReadContract({
    address: contracts.router,
    abi: ROUTER_ABI,
    functionName: 'lastMintMonthId',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  // Get NFT balance for current month
  const { data: nftBalance } = useReadContract({
    address: contracts.nft,
    abi: NFT_ABI,
    functionName: 'balanceOf',
    args: userAddress && currentMonthId ? [userAddress, currentMonthId] : undefined,
    query: {
      enabled: !!userAddress && !!currentMonthId,
    },
  });

  // Format month ID to readable string (e.g., 202601 -> "2026年1月")
  const formatMonthId = (monthId: bigint | undefined): string => {
    if (!monthId) return '';
    const id = Number(monthId);
    const year = Math.floor(id / 100);
    const month = id % 100;
    return `${year}年${month}月`;
  };

  return {
    isEligible: isEligible ?? false, // Default to false while loading
    currentMonthId,
    lastMintMonthId,
    nftBalance: nftBalance ?? 0n,
    currentMonthLabel: formatMonthId(currentMonthId),
    refetchEligibility,
  };
}
