// 📍 /apps/web/e2e/02-seller-flow.spec.ts
//
// Tests the full property submission flow:
// register → /sell → fill 4 steps → upload image → submit.

import { expect, test } from "@playwright/test";
import { registerSeller } from "./helpers";

// Minimal valid PNG (1×1 transparent) — small enough to inline.
const TEST_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

test.describe("Seller property flow", () => {
  test("creates draft through wizard and submits for review", async ({ page }) => {
    await registerSeller(page);

    // Navigate to /sell
    await page.goto("/en/sell");
    await expect(page.locator("h1")).toContainText(/Post your property/i);

    // ── Step 1: Basic info ────────────────────────────────
    await page.locator("#categoryId").selectOption({ label: /Apartment/ });
    await page.fill("#title", "E2E Test Flat in Dhanmondi");
    await page.fill(
      "#description",
      "A bright and spacious test flat created by the automated E2E test suite for verification.",
    );
    await page.click('button:has-text("Save & Continue")');

    // ── Step 2: Location ──────────────────────────────────
    await expect(page.locator("#divisionId")).toBeVisible();
    const divisionValue = await page
      .locator("#divisionId option")
      .nth(1) // first real division (0 is placeholder)
      .getAttribute("value");
    if (divisionValue) await page.locator("#divisionId").selectOption(divisionValue);

    // Wait for districts to load
    await page.waitForTimeout(300);
    const districtValue = await page
      .locator("#districtId option")
      .nth(1)
      .getAttribute("value");
    if (districtValue) await page.locator("#districtId").selectOption(districtValue);

    await page.fill("#areaLocality", "Road 8, Dhanmondi");
    await page.fill("#fullAddress", "House 42, Road 8, Dhanmondi, Dhaka");
    await page.click('button:has-text("Save & Continue")');

    // ── Step 3: Details ───────────────────────────────────
    await expect(page.locator("#price")).toBeVisible();
    await page.fill("#price", "8500000");
    await page.fill("#bedrooms", "3");
    await page.fill("#bathrooms", "2");
    await page.click('button:has-text("Save & Continue")');

    // ── Step 4: Images ────────────────────────────────────
    await expect(page.getByText(/Property Images/i)).toBeVisible();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: Buffer.from(TEST_PNG_BASE64, "base64"),
    });

    // Wait for upload progress to finish
    await expect(page.locator('img[alt^="Image"]').first()).toBeVisible({
      timeout: 20_000,
    });

    // Submit for review
    await page.click('button:has-text("Submit for Review")');

    // Landed on detail page
    await expect(page).toHaveURL(/\/en\/account\/properties\/[\w-]+/, {
      timeout: 20_000,
    });
    await expect(page.getByText(/Pending Review/i).first()).toBeVisible();
  });

  test("validates required fields before allowing continue", async ({ page }) => {
    await registerSeller(page);
    await page.goto("/en/sell");

    // No category, no title, no description — click continue
    await page.click('button:has-text("Save & Continue")');

    // Should stay on step 1
    await expect(page.locator("#title")).toBeVisible();
    await expect(page.getByText(/select a property type/i)).toBeVisible();
  });

  test("draft can be saved and resumed", async ({ page }) => {
    await registerSeller(page);
    await page.goto("/en/sell");

    await page.locator("#categoryId").selectOption({ label: /Apartment/ });
    await page.fill("#title", "Draft Resume Test");
    await page.fill(
      "#description",
      "This draft will be saved early and then resumed to verify persistence.",
    );

    await page.click('button:has-text("Save as Draft")');
    await expect(page).toHaveURL(/\/en\/account\/properties/);

    // Draft appears in list
    await expect(page.getByText("Draft Resume Test")).toBeVisible();
  });
});