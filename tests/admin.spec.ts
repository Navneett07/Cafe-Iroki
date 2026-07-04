import { test, expect } from '@playwright/test';

test.describe('Admin App', () => {
  test('redirects to login when unauthenticated', async ({ page }) => {
    // Vite serves admin at /admin.html during dev with vite config?
    // Actually our playwright config points to localhost:5173 which is the customer app.
    // In our vercel config, /admin rewrites to /admin.html
    // In dev mode, we can access it via /admin.html
    await page.goto('/admin.html');
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByPlaceholder('Admin Email')).toBeVisible();
  });
});
