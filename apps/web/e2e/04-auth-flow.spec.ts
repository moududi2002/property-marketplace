// 📍 /apps/web/e2e/04-auth-flow.spec.ts
//
// Tests the auth flows: register → login → protected redirect → logout.

import { expect, test } from "@playwright/test";
import { login, logout, registerSeller, uniquePhone } from "./helpers";

test.describe("Auth flow", () => {
  test("protected /account redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/en/account");
    await expect(page).toHaveURL(/\/en\/login/);
  });

  test("register a new seller and land on /account", async ({ page }) => {
    const { name } = await registerSeller(page);

    // /account shows the newly created user's details
    await expect(page.locator("h1")).toContainText("My Account");
    await expect(page.getByText(name)).toBeVisible();
  });

  test("login with existing user, then logout", async ({ page }) => {
    const { phone, password } = await registerSeller(page);

    // Logout
    await logout(page);

    // Log back in
    await login(page, phone, password);
    await expect(page.locator("h1")).toContainText("My Account");

    // Logout again
    await logout(page);
  });

  test("register with invalid phone shows field error", async ({ page }) => {
    await page.goto("/en/register");
    await page.fill("#name", "Bad Phone User");
    await page.fill("#phone", "123");
    await page.fill("#password", "Test@12345");
    await page.fill("#confirmPassword", "Test@12345");
    await page.click('button[type="submit"]');

    // Backend returns Zod-style field errors
    await expect(page.getByText(/সঠিক বাংলাদেশি মোবাইল নম্বর|valid mobile/i)).toBeVisible();
  });

  test("login with wrong password shows error", async ({ page }) => {
    const { phone } = await registerSeller(page);
    await logout(page);

    await page.goto("/en/login");
    await page.fill("#identifier", phone);
    await page.fill("#password", "WrongPassword123");
    await page.click('button[type="submit"]');

    await expect(page.getByText(/Invalid credentials/i)).toBeVisible();
  });

  test("duplicate phone registration returns conflict", async ({ page }) => {
    const { phone } = await registerSeller(page);
    await logout(page);

    await page.goto("/en/register");
    await page.fill("#name", "Duplicate");
    await page.fill("#phone", phone);
    await page.fill("#password", "Test@12345");
    await page.fill("#confirmPassword", "Test@12345");
    await page.click('button[type="submit"]');

    await expect(page.getByText(/already registered/i)).toBeVisible();
  });
});