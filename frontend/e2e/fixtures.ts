import { test as base, expect } from '@playwright/test';

/**
 * Extended test fixtures for Web3 testing
 *
 * For full wallet integration testing, consider using:
 * - @synthetixio/synpress for MetaMask automation
 * - Mock wallet provider for unit-style E2E tests
 */

// Test wallet addresses (Hardhat default accounts)
export const TEST_ACCOUNTS = {
  account0: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  },
  account1: {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  },
} as const;

// Mock window.ethereum for testing without MetaMask
export async function injectMockEthereum(page: any, account: string = TEST_ACCOUNTS.account0.address) {
  await page.addInitScript((accountAddress: string) => {
    (window as any).ethereum = {
      isMetaMask: true,
      selectedAddress: accountAddress,
      chainId: '0x7a69', // 31337 in hex (Hardhat)
      networkVersion: '31337',
      _metamask: { isUnlocked: () => Promise.resolve(true) },

      request: async ({ method, params }: { method: string; params?: any[] }) => {
        switch (method) {
          case 'eth_requestAccounts':
          case 'eth_accounts':
            return [accountAddress];
          case 'eth_chainId':
            return '0x7a69';
          case 'net_version':
            return '31337';
          case 'wallet_switchEthereumChain':
            return null;
          case 'wallet_addEthereumChain':
            return null;
          case 'personal_sign':
            return '0x' + '00'.repeat(65);
          case 'eth_sign':
            return '0x' + '00'.repeat(65);
          case 'eth_signTypedData_v4':
            return '0x' + '00'.repeat(65);
          case 'eth_sendTransaction':
            return '0x' + '00'.repeat(32);
          case 'eth_getTransactionReceipt':
            return {
              status: '0x1',
              blockNumber: '0x1',
              blockHash: '0x' + '00'.repeat(32),
              transactionHash: params?.[0] || '0x' + '00'.repeat(32),
            };
          default:
            console.log('Mock ethereum: unhandled method', method);
            return null;
        }
      },

      on: (event: string, callback: Function) => {
        // Store event handlers for later emission
        if (!(window as any)._ethHandlers) {
          (window as any)._ethHandlers = {};
        }
        (window as any)._ethHandlers[event] = callback;
      },

      removeListener: () => {},
      removeAllListeners: () => {},

      emit: (event: string, ...args: any[]) => {
        const handler = (window as any)._ethHandlers?.[event];
        if (handler) handler(...args);
      },
    };

    // Also set on window for legacy support
    (window as any).web3 = { currentProvider: (window as any).ethereum };
  }, account);
}

// Extended test with Web3 fixtures
export const test = base.extend<{
  mockWallet: void;
}>({
  mockWallet: async ({ page }, use) => {
    await injectMockEthereum(page);
    await use();
  },
});

export { expect };
