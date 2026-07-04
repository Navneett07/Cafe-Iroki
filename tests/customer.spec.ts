import { test, expect } from '@playwright/test';

test.describe('Customer App', () => {
  test('has title and displays homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Cafe Iroki/);
    await expect(page.getByText('Discover Japanese-Inspired Flavors')).toBeVisible();
  });

  test('can navigate to menu', async ({ page }) => {
    await page.goto('/');
    // Click on Menu link
    const menuLink = page.locator('a[href="/menu"]').first();
    await menuLink.click();
    await expect(page).toHaveURL(/.*\/menu/);
    await expect(page.getByText('Our Menu')).toBeVisible();
  });

  test('can navigate to reservation', async ({ page }) => {
    await page.goto('/');
    const reserveLink = page.locator('a[href="/reserve"]').first();
    await reserveLink.click();
    await expect(page).toHaveURL(/.*\/reserve/);
    await expect(page.getByText('Book a Table')).toBeVisible();
  });
});
