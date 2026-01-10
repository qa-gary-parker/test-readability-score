import { test, expect } from '@playwright/test';

/**
 * These tests demonstrate POOR readability practices.
 * They should score low on the readability scale.
 */

test.describe('Tests', () => {
  // BAD: Vague test name
  test('test1', async ({ page }) => {
    await page.goto('/');
    await page.click('button');
  });

  // BAD: No assertions
  test('works', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input', 'test');
    await page.fill('input', 'pass');
    await page.click('button');
  });

  // BAD: Too many assertions, deeply nested, very long
  test('should handle everything in one test', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    await page.click('a[href="/products"]');
    await expect(page).toHaveURL('/products');
    await expect(page.locator('.product')).toHaveCount(10);
    await expect(page.locator('.product:first-child')).toBeVisible();
    await expect(page.locator('.product:first-child .price')).toBeVisible();
    await expect(page.locator('.product:first-child .title')).toBeVisible();
    await page.click('.product:first-child');
    await expect(page).toHaveURL(/\/products\/\d+/);
    await expect(page.locator('.product-details')).toBeVisible();
    await expect(page.locator('.add-to-cart')).toBeEnabled();
    await page.click('.add-to-cart');
    await expect(page.locator('.cart-count')).toContainText('1');
    await page.click('.cart-icon');
    await expect(page).toHaveURL('/cart');
    await expect(page.locator('.cart-item')).toHaveCount(1);

    if (await page.locator('.discount-available').isVisible()) {
      await page.click('.apply-discount');
      if (await page.locator('.discount-error').isVisible()) {
        await page.fill('.discount-code', 'VALID');
        await page.click('.apply-discount');
        if (await page.locator('.discount-success').isVisible()) {
          await expect(page.locator('.total')).toContainText('discount');
        }
      }
    }

    await page.click('.checkout');
    await expect(page).toHaveURL('/checkout');
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'test@test.com');
    await page.fill('#address', '123 Test St');
    await page.fill('#city', 'Test City');
    await page.fill('#zip', '12345');
    await page.fill('#card', '4111111111111111');
    await page.fill('#exp', '12/25');
    await page.fill('#cvv', '123');
    await page.click('.place-order');
    await expect(page).toHaveURL('/confirmation');
    await expect(page.locator('.order-number')).toBeVisible();
  });

  // BAD: Magic numbers and strings without context
  test('misc', async ({ page }) => {
    await page.goto('/api/data?limit=47&offset=123');
    await page.waitForTimeout(3500);
    await expect(page.locator('div')).toHaveCount(47);
    await page.evaluate(() => {
      localStorage.setItem('xyz', 'abc123def456');
    });
  });

  // BAD: Test name too short, unclear purpose
  test('a', async ({ page }) => {
    await page.goto('/x');
  });

  // BAD: Test does nothing meaningful
  test('basic test', async ({ page }) => {
    // TODO: add assertions
    await page.goto('/');
  });
});
