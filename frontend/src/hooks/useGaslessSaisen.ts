/**
 * Hook for gasless saisen (offering) transactions using Account Abstraction
 *
 * This hook provides a way to make offerings without paying gas fees.
 * The gas is sponsored by the shrine's Paymaster.
 *
 * Prerequisites:
 * - VITE_PIMLICO_API_KEY must be set in environment
 * - Paymaster must have sufficient deposit
 * - User must have approved JPYC spending (or will be done in same batch)
 */

import { useState, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import type { Hash } from 'viem';
import {
  shouldUseGaslessMode,
  buildBatchCalldata,
  getPimlicoConfig,
  isPimlicoConfigured,
} from '../lib/userOperation';
import { getContracts } from '../lib/contracts';

export interface GaslessSaisenState {
  isLoading: boolean;
  error: Error | null;
  txHash: Hash | null;
  isGaslessAvailable: boolean;
}

export interface GaslessSaisenResult {
  state: GaslessSaisenState;
  executeGaslessSaisen: (amount: bigint) => Promise<void>;
  resetState: () => void;
}

/**
 * Hook for executing gasless saisen transactions
 */
export function useGaslessSaisen(): GaslessSaisenResult {
  const { address } = useAccount();
  const chainId = useChainId();

  const [state, setState] = useState<GaslessSaisenState>({
    isLoading: false,
    error: null,
    txHash: null,
    isGaslessAvailable: isPimlicoConfigured() && shouldUseGaslessMode(chainId),
  });

  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      txHash: null,
      isGaslessAvailable: isPimlicoConfigured() && shouldUseGaslessMode(chainId),
    });
  }, [chainId]);

  const executeGaslessSaisen = useCallback(
    async (amount: bigint) => {
      if (!address) {
        setState((prev) => ({
          ...prev,
          error: new Error('Wallet not connected'),
        }));
        return;
      }

      if (!shouldUseGaslessMode(chainId)) {
        setState((prev) => ({
          ...prev,
          error: new Error('Gasless mode not available on this network'),
        }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const contracts = getContracts(chainId);

        // Build the batch calldata for approve + saisen
        // This will be used when full AA implementation is complete
        void buildBatchCalldata(
          contracts.jpyc,
          contracts.router,
          amount
        );

        // Here we would:
        // 1. Create or get the user's Smart Account
        // 2. Build the UserOperation with batch calls
        // 3. Get paymaster sponsorship
        // 4. Sign and send the UserOperation
        // 5. Wait for receipt

        // This is a placeholder - full implementation requires:
        // - Pimlico API key to be configured
        // - Smart Account to be deployed or counterfactual
        // - Paymaster to have sufficient deposit

        const config = getPimlicoConfig(chainId);
        if (!config) {
          throw new Error(
            'Pimlico not configured. Please set VITE_PIMLICO_API_KEY'
          );
        }

        // For now, throw a more helpful error
        throw new Error(
          'Gasless transactions require Pimlico setup. ' +
            'See docs for configuration: https://docs.pimlico.io/'
        );

        // Actual implementation would be:
        // const { bundlerClient, paymasterClient } = await createPimlicoClient(chainId);
        // const smartAccount = await createSmartAccount(address, chainId);
        // const userOp = await buildUserOperation(smartAccount, batchCalls);
        // const sponsoredOp = await sponsorUserOperation(chainId, userOp);
        // const hash = await sendUserOperation(chainId, sponsoredOp);
        // const receipt = await waitForUserOperationReceipt(chainId, hash);
        // setState(prev => ({ ...prev, txHash: receipt.transactionHash, isLoading: false }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
      }
    },
    [address, chainId]
  );

  return {
    state,
    executeGaslessSaisen,
    resetState,
  };
}

/**
 * Hook to check if gasless mode is available
 */
export function useGaslessAvailability(): {
  isAvailable: boolean;
  reason: string | null;
} {
  const chainId = useChainId();

  if (!isPimlicoConfigured()) {
    return {
      isAvailable: false,
      reason: 'Pimlico API key not configured',
    };
  }

  if (!shouldUseGaslessMode(chainId)) {
    return {
      isAvailable: false,
      reason: `Chain ${chainId} does not support gasless transactions`,
    };
  }

  return {
    isAvailable: true,
    reason: null,
  };
}
