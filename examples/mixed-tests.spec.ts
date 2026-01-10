import { test, expect } from '@playwright/test';

/**
 * These tests demonstrate MIXED readability.
 * Some are good, some have issues.
 */

test.describe('Search Feature', () => {
  // GOOD: Clear name, reasonable assertions
  test('should display search results when user enters query', async ({ page }) => {
    await page.goto('/search');
    await page.fill('[data-testid="search-input"]', 'playwright');
    await page.click('[data-testid="search-button"]');

    await expect(page.locator('.search-results')).toBeVisible();
    await expect(page.locator('.result-item')).toHaveCount(10);
  });

  // MEDIUM: Name could be more specific
  test('handles empty search', async ({ page }) => {
    await page.goto('/search');
    await page.click('[data-testid="search-button"]');

    await expect(page.locator('.error')).toContainText('enter a search term');
  });

  // POOR: Vague name
  test('filters work', async ({ page }) => {
    await page.goto('/search?q=test');
    await page.click('.filter-category');
    await page.click('text=Electronics');
    await expect(page.locator('.result-item')).toHaveCount(5);
  });
});

test.describe('Form Validation', () => {
  // GOOD: Descriptive name with action verb
  test('should validate email format and display appropriate error message', async ({ page }) => {
    await page.goto('/contact');
    await page.fill('[data-testid="email"]', 'not-an-email');
    await page.click('[data-testid="submit"]');

    await expect(page.locator('.field-error')).toContainText('valid email');
  });

  // MEDIUM: Acceptable but could be clearer
  test('required fields validation', async ({ page }) => {
    await page.goto('/contact');
    await page.click('[data-testid="submit"]');

    await expect(page.locator('.field-error')).toHaveCount(3);
  });

  // GOOD: Clear cause and effect
  test('should clear error message when user corrects invalid input', async ({ page }) => {
    await page.goto('/contact');
    await page.fill('[data-testid="email"]', 'bad');
    await page.click('[data-testid="submit"]');
    await expect(page.locator('.field-error')).toBeVisible();

    await page.fill('[data-testid="email"]', 'valid@email.com');
    await page.click('[data-testid="submit"]');
    await expect(page.locator('.field-error')).not.toBeVisible();
  });
});
