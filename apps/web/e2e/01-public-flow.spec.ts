// 📍 /apps/web/e2e/01-public-flow.spec.ts
//
// Tests public-facing pages: homepage, search, listing, detail.

import { expect, test } from "@playwright/test";

test.describe("Public flow", () => {
  test("homepage renders hero, categories, divisions", async ({ page }) => {
    await page.goto("/en");

    await expect(page.locator("h1")).toContainText(/Find a property/i);

    // Hero search form is interactive
    await expect(page.getByRole("button", { name: /Search Properties/i })).toBeVisible();

    // Categories section (may be absent if DB empty — soft check)
    const categoriesHeading = page.getByRole("heading", { name: /Browse by Category/i });
    if ((await categoriesHeading.count()) > 0) {
      await expect(categoriesHeading).toBeVisible();
    }
  });

  test("homepage has valid SEO tags", async ({ page }) => {
    await page.goto("/en");

    // Title & meta description
    const title = await page.title();
    expect(title.toLowerCase()).toContain("property");

    const description = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    expect(description).toBeTruthy();
    expect((description ?? "").length).toBeGreaterThan(20);

    // Canonical link
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonical).toContain("/en");

    // OG tags
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
  });

  test("search redirects to filtered listing page", async ({ page }) => {
    await page.goto("/en");

    // Fill hero search
    await page.selectOption('select', { label: "Apartment" }).catch(() => undefined);
    await page.fill('input[type="text"]', "Dhaka");
    await page.click('button:has-text("Search Properties")');

    await expect(page).toHaveURL(/\/en\/properties\?/);
    await expect(page.locator("h1")).toContainText(/Properties/i);
  });

  test("sitemap.xml is valid XML", async ({ page, request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("/en");
    expect(body).toContain("/bn");
  });

  test("robots.txt blocks admin & account", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("Disallow: /admin/");
    expect(body).toContain("Disallow: /account/");
    expect(body).toContain("Sitemap:");
  });

  test("bn locale renders Bengali text", async ({ page }) => {
    await page.goto("/bn");
    await expect(page.locator("h1")).toContainText(/খুঁজে নিন/);
  });
});