
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    // Adjust this expectation based on the actual title of your app
    await expect(page).toHaveTitle(/Creation Studio/i);
});

test('navigation to tools', async ({ page }) => {
    await page.goto('/');
    // Check if main navigation elements exist
    // This is a basic smoke test
    const main = page.locator('main');
    await expect(main).toBeVisible();
});
