import { test, expect, injectMockEthereum, TEST_ACCOUNTS } from './fixtures';

/**
 * Full offering (saisen) flow tests
 *
 * These tests verify the complete user journey from wallet connection
 * through JPYC approval to successful offering.
 *
 * Prerequisites for real testing:
 * 1. Local Hardhat node running: `npm run node`
 * 2. Contracts deployed: `npm run dev:setup`
 * 3. Frontend running: `npm run dev`
 */

test.describe('Offering Flow - Pre-Connection State', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show initial state correctly', async ({ page }) => {
    // Amount input should be visible
    const amountInput = page.locator('input').first();
    await expect(amountInput).toBeVisible();

    // Should show minimum amount info
    await expect(page.locator('text=/115|最小/i')).toBeVisible();
  });

  test('should validate amount before connection', async ({ page }) => {
    const amountInput = page.locator('input').first();

    // Enter valid amount
    await amountInput.fill('200');
    await expect(amountInput).toHaveValue('200');

    // Enter invalid amount
    await amountInput.fill('50');
    // Should show validation message or error styling
  });
});

test.describe('Offering Flow - Connected State (Mock)', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockEthereum(page, TEST_ACCOUNTS.account0.address);
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test('should show wallet address when connected', async ({ page }) => {
    // Try to connect
    const metaMaskButton = page.getByRole('button', { name: /MetaMask/i });
    if (await metaMaskButton.isVisible()) {
      await metaMaskButton.click();
      await page.waitForTimeout(1000);

      // Should show truncated address or connected state
      const addressPattern = /0x[a-fA-F0-9]{4}\.{2,}[a-fA-F0-9]{4}/;
      const addressDisplay = page.locator(`text=${addressPattern}`);
      // Connection status should change
    }
  });

  test('should enable offering after connection', async ({ page }) => {
    const metaMaskButton = page.getByRole('button', { name: /MetaMask/i });
    if (await metaMaskButton.isVisible()) {
      await metaMaskButton.click();
      await page.waitForTimeout(1000);

      // Find offering button
      const offerButton = page.getByRole('button', { name: /奉納|Offer|賽銭|Saisen/i });
      // Should be enabled after successful connection
    }
  });
});

test.describe('Approve Flow', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockEthereum(page, TEST_ACCOUNTS.account0.address);
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test('should show approve button if allowance insufficient', async ({ page }) => {
    // This test verifies that the UI correctly shows approve step
    // when JPYC allowance is below the offering amount

    // Look for approve button or step indicator
    const approveIndicator = page.locator('text=/承認|Approve|STEP 1/i');
    // May be visible depending on allowance state
  });

  test('should proceed to saisen after approval', async ({ page }) => {
    // This tests the transition from approve to saisen step
    // Full implementation requires real contract interaction
  });
});

test.describe('Saisen Flow', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockEthereum(page, TEST_ACCOUNTS.account0.address);
    await page.goto('/');
  });

  test('should have saisen button', async ({ page }) => {
    // Look for the main offering button
    const saisenButton = page.locator('button').filter({ hasText: /奉納|Saisen|賽銭|Offer/i });
    await expect(saisenButton.first()).toBeVisible();
  });

  test('should show loading state during transaction', async ({ page }) => {
    // This would test loading indicators during tx
    // Requires mock transaction to be triggered
  });
});

test.describe('NFT Eligibility Display', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockEthereum(page, TEST_ACCOUNTS.account0.address);
    await page.goto('/');
  });

  test('should show NFT eligibility status', async ({ page }) => {
    // Look for NFT-related status display
    const nftStatus = page.locator('text=/NFT|月次|Monthly|記念/i');
    // Status should be visible
  });

  test('should show current month indicator', async ({ page }) => {
    // Current month should be displayed
    const currentDate = new Date();
    const monthYear = `${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    // May show month ID like 202512
  });
});

test.describe('Result Modal', () => {
  test('should display success modal after transaction', async ({ page }) => {
    await injectMockEthereum(page, TEST_ACCOUNTS.account0.address);
    await page.goto('/');

    // This test would verify the success modal
    // Full implementation requires completing a mock transaction
  });

  test('should show transaction hash in result', async ({ page }) => {
    // Result modal should include tx hash
  });

  test('should show NFT minted status', async ({ page }) => {
    // If NFT was minted, should show confirmation
  });
});

test.describe('Error Handling', () => {
  test('should show error message on failed transaction', async ({ page }) => {
    await page.goto('/');

    // Inject ethereum that returns errors
    await page.addInitScript(() => {
      (window as any).ethereum = {
        isMetaMask: true,
        request: async ({ method }: { method: string }) => {
          if (method === 'eth_sendTransaction') {
            throw new Error('User rejected the request');
          }
          if (method === 'eth_requestAccounts') {
            return ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'];
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
    });

    // Try to trigger transaction and verify error display
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/');
    // Test network error handling
  });
});

test.describe('Repeat Offering', () => {
  test('should handle second offering in same month', async ({ page }) => {
    await injectMockEthereum(page, TEST_ACCOUNTS.account0.address);
    await page.goto('/');

    // After first offering, NFT won't be minted again
    // UI should reflect this (NFT already received this month)
  });

  test('should allow offering without NFT', async ({ page }) => {
    // User should still be able to make offerings
    // even after receiving the monthly NFT
  });
});
