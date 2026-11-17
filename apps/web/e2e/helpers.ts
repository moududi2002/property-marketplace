// 📍 /apps/web/e2e/helpers.ts
//
// Shared utilities for E2E tests.
// All helpers assume tests can create their own unique data (via
// timestamps) so the suite is idempotent across runs.

import { expect, type Page } from "@playwright/test";

/** Unique phone number per run — avoids DB collisions between runs. */
export function uniquePhone(): string {
  const now = Date.now();
  const tail = String(now).slice(-8).padStart(8, "0");
  return `017${tail}`;
}

/** Unique email per run. */
export function uniqueEmail(): string {
  return `e2e-${Date.now()}@example.com`;
}

/** Login as a given identifier. Waits for redirect to /account. */
export async function login(
  page: Page,
  identifier: string,
  password: string,
): Promise<void> {
  await page.goto("/en/login");
  await page.fill("#identifier", identifier);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/en\/account/, { timeout: 15_000 });
}

/** Register a new seller and land on /account. Returns credentials. */
export async function registerSeller(page: Page): Promise<{
  phone: string;
  password: string;
  name: string;
}> {
  const phone = uniquePhone();
  const password = "Test@12345";
  const name = `E2E Seller ${Date.now()}`;

  await page.goto("/en/register");
  await page.fill("#name", name);
  await page.fill("#phone", phone);
  await page.fill("#email", uniqueEmail());
  await page.fill("#password", password);
  await page.fill("#confirmPassword", password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/en\/account/, { timeout: 15_000 });

  return { phone, password, name };
}

/** Logout via the header user menu. */
export async function logout(page: Page): Promise<void> {
  // Open user menu (avatar button)
  const avatarButton = page.locator('header button[aria-haspopup="menu"]');
  if ((await avatarButton.count()) === 0) return;
  await avatarButton.click();
  await page.click('button:has-text("Log out")');
  await expect(page).toHaveURL(/\/(en|bn)\/?$/);
}