import { expect, test } from '@playwright/test';
import path from 'node:path';

test('fixture page is reachable for extension e2e harness', async ({ page }) => {
  const fixture = `file://${path.resolve('public/test-pages/test-form.html')}`;
  await page.goto(fixture);
  await expect(page.locator('form')).toHaveCount(1);
});
