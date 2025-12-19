import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, decodeEventLog } from 'viem';
import { ROUTER_ABI, getContracts, JPYC_DECIMALS } from '../lib/contracts';

interface UseSaisenProps {
  chainId: number;
}

interface SaisenResult {
  user: string;
  amount: bigint;
  monthId: bigint;
  minted: boolean;
}

export function useSaisen({ chainId }: UseSaisenProps) {
  const contracts = getContracts(chainId);

  // Saisen transaction
  const {
    data: saisenHash,
    writeContract: writeSaisen,
    isPending: isSending,
    error: saisenError,
    reset: resetSaisen,
  } = useWriteContract();

  // Wait for saisen confirmation
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: saisenHash,
  });

  // Parse saisen event from receipt
  const parseSaisenEvent = (): SaisenResult | null => {
    if (!receipt) return null;

    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: ROUTER_ABI,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === 'Saisen') {
          return {
            user: decoded.args.user as string,
            amount: decoded.args.amount as bigint,
            monthId: decoded.args.monthId as bigint,
            minted: decoded.args.minted as boolean,
          };
        }
      } catch {
        // Not a Saisen event, continue
      }
    }
    return null;
  };

  // Execute saisen
  const executeSaisen = (amountJpyc: number) => {
    if (!contracts.router) return;

    const amount = parseUnits(amountJpyc.toString(), JPYC_DECIMALS);

    writeSaisen({
      address: contracts.router,
      abi: ROUTER_ABI,
      functionName: 'saisen',
      args: [amount],
    });
  };

  const saisenResult = parseSaisenEvent();

  return {
    executeSaisen,
    isSending,
    isConfirming,
    isConfirmed,
    saisenHash,
    saisenError: saisenError || confirmError,
    saisenResult,
    resetSaisen,
  };
}
