import { test, expect } from '@playwright/test';

test.describe('route smoke tests', () => {
  test('login page renders public entry point', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/POS Apotek/i);
    await expect(page.getByRole('heading', { name: /masuk|login/i })).toBeVisible();
  });

  for (const route of ['/dashboard', '/koreksi-stok', '/pelayanan/riwayat', '/laporan/laba']) {
    test(`${route} redirects unauthenticated users`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login$/);
    });
  }
});
