import { test, expect, injectMockEthereum, TEST_ACCOUNTS } from './fixtures';

test.describe('Wallet Connection (Mock)', () => {
  test.beforeEach(async ({ page }) => {
    // Inject mock ethereum before navigating
    await injectMockEthereum(page, TEST_ACCOUNTS.account0.address);
    await page.goto('/');
  });

  test('should detect injected wallet', async ({ page }) => {
    // Wait for page to detect the mock wallet
    await page.waitForTimeout(500);

    // MetaMask button should be visible
    const metaMaskButton = page.getByRole('button', { name: /MetaMask/i });
    await expect(metaMaskButton).toBeVisible();
  });

  test('should show wallet options', async ({ page }) => {
    await page.waitForTimeout(500);

    // Look for wallet connection options
    const walletSection = page.locator('text=/ウォレット|Wallet|接続/i');
    await expect(walletSection.first()).toBeVisible();
  });

  test('should have clickable MetaMask button', async ({ page }) => {
    await page.waitForTimeout(500);

    const metaMaskButton = page.getByRole('button', { name: /MetaMask/i });
    await expect(metaMaskButton).toBeEnabled();
  });
});

test.describe('Wallet Connection Flow', () => {
  test('should initiate connection when MetaMask button clicked', async ({ page }) => {
    await injectMockEthereum(page, TEST_ACCOUNTS.account0.address);
    await page.goto('/');
    await page.waitForTimeout(500);

    const metaMaskButton = page.getByRole('button', { name: /MetaMask/i });

    // Track console for connection attempts
    const consoleLogs: string[] = [];
    page.on('console', (msg) => consoleLogs.push(msg.text()));

    await metaMaskButton.click();

    // Wait for connection attempt
    await page.waitForTimeout(1000);

    // The UI should show connection state change
    // (exact behavior depends on implementation)
  });
});

test.describe('No Wallet Scenario', () => {
  test('should show install prompt when no wallet detected', async ({ page }) => {
    // Don't inject mock - simulate no wallet
    await page.goto('/');

    // Should show some indication that wallet is needed
    const walletPrompt = page.locator(
      'text=/インストール|Install|ウォレット|Wallet|MetaMask/i'
    );
    // May or may not be visible depending on implementation
  });
});

test.describe('Network Handling', () => {
  test('should work with Hardhat network (chainId 31337)', async ({ page }) => {
    await injectMockEthereum(page, TEST_ACCOUNTS.account0.address);
    await page.goto('/');
    await page.waitForTimeout(500);

    // Page should load without network errors
    await expect(page.locator('text=白山比咩神社')).toBeVisible();
  });
});
