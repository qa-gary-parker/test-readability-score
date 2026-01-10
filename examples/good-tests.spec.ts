import { test, expect } from '@playwright/test';

/**
 * These tests demonstrate GOOD readability practices.
 * They should score high on the readability scale.
 */

test.describe('User Authentication', () => {
  test('should display error message when login fails with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'invalid@example.com');
    await page.fill('[data-testid="password"]', 'wrongpassword');
    await page.click('[data-testid="submit"]');

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Invalid credentials');
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'validpassword');
    await page.click('[data-testid="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome');
  });

  test('should show password strength indicator when typing password', async ({ page }) => {
    await page.goto('/register');
    await page.fill('[data-testid="password"]', 'weak');

    await expect(page.locator('.password-strength')).toContainText('Weak');

    await page.fill('[data-testid="password"]', 'StrongP@ssw0rd!');
    await expect(page.locator('.password-strength')).toContainText('Strong');
  });
});

test.describe('Shopping Cart', () => {
  test('should update total price when quantity changes', async ({ page }) => {
    await page.goto('/cart');
    const initialTotal = await page.locator('.cart-total').textContent();

    await page.fill('.quantity-input', '3');
    await page.click('[data-testid="update-cart"]');

    const updatedTotal = await page.locator('.cart-total').textContent();
    expect(updatedTotal).not.toBe(initialTotal);
  });

  test('should remove item from cart when delete button is clicked', async ({ page }) => {
    await page.goto('/cart');
    const initialItemCount = await page.locator('.cart-item').count();

    await page.click('.cart-item:first-child [data-testid="remove"]');

    await expect(page.locator('.cart-item')).toHaveCount(initialItemCount - 1);
  });
});
