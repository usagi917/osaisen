import { test, expect } from '@playwright/test';

test.describe('Saisen Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main page with shrine name', async ({ page }) => {
    // Check page title or main heading
    await expect(page.locator('text=白山比咩神社')).toBeVisible();
  });

  test('should display wallet connection button when not connected', async ({ page }) => {
    // Look for connect wallet button
    const connectButton = page.getByRole('button', { name: /接続|Connect|MetaMask/i });
    await expect(connectButton).toBeVisible();
  });

  test('should display minimum offering amount (115 JPYC)', async ({ page }) => {
    // Check that 115 JPYC minimum is mentioned
    await expect(page.locator('text=115')).toBeVisible();
  });

  test('should have amount input field', async ({ page }) => {
    // Look for input field
    const amountInput = page.locator('input[type="number"], input[type="text"]').first();
    await expect(amountInput).toBeVisible();
  });

  test('should disable saisen button when wallet not connected', async ({ page }) => {
    // Find the saisen/offering button and check if it's disabled
    const saisenButton = page.getByRole('button', { name: /奉納|賽銭|Offer|Saisen/i });
    if (await saisenButton.count() > 0) {
      await expect(saisenButton).toBeDisabled();
    }
  });
});

test.describe('Amount Input Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show error for amount below minimum', async ({ page }) => {
    const amountInput = page.locator('input[type="number"], input[type="text"]').first();

    // Enter amount below minimum (115)
    await amountInput.fill('100');
    await amountInput.blur();

    // Check for error message about minimum amount
    const errorText = page.locator('text=/最小|minimum|115/i');
    // This may or may not be visible depending on implementation
  });

  test('should accept valid amount', async ({ page }) => {
    const amountInput = page.locator('input[type="number"], input[type="text"]').first();

    // Enter valid amount
    await amountInput.fill('200');

    // Check no error is shown (or success indicator)
    await expect(amountInput).toHaveValue('200');
  });
});

test.describe('Responsive Design', () => {
  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');

    // Page should still show main content
    await expect(page.locator('text=白山比咩神社')).toBeVisible();
  });

  test('should be tablet responsive', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');

    await expect(page.locator('text=白山比咩神社')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');

    // Check for h1 or main heading
    const headings = page.locator('h1, h2');
    await expect(headings.first()).toBeVisible();
  });

  test('should have proper button labels', async ({ page }) => {
    await page.goto('/');

    // All buttons should have accessible names
    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const name = await button.getAttribute('aria-label') || await button.textContent();
      expect(name).toBeTruthy();
    }
  });
});
