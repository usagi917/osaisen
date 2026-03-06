import { test, expect } from '@playwright/test';

test.describe('Saisen Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main page with header', async ({ page }) => {
    // Check main heading (御賽銭)
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display wallet connection button when not connected', async ({ page }) => {
    // Look for connect wallet button (zen-button with 接続する)
    const connectButton = page.getByRole('button', { name: /接続する/i });
    await expect(connectButton).toBeVisible();
  });

  test('should display landing page when not connected', async ({ page }) => {
    // When not connected, should show landing hero text
    await expect(page.locator('text=デジタル')).toBeVisible();
    await expect(page.locator('text=お賽銭')).toBeVisible();
    // Should mention 115 JPYC in how-to section
    await expect(page.locator('text=115')).toBeVisible();
  });

  test('should not show amount input when wallet not connected', async ({ page }) => {
    // In new UI, input is only shown when connected
    const amountInput = page.locator('input[type="number"], input[type="text"]');
    await expect(amountInput).toHaveCount(0);
  });
});

test.describe('Amount Input Validation', () => {
  // Amount input is only visible when wallet is connected
  // These tests require mock wallet injection
});

test.describe('Responsive Design', () => {
  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');

    // Page should still show main content (header h1)
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should be tablet responsive', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');

    // On tablet+, vertical shrine name should be visible
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
