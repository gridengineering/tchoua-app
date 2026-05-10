import { test, expect } from "@playwright/test";

/**
 * UAT E2E - Scénarios Modules Avancés (Modules 5, 7, 9)
 * Prêts, Solidarité, Marketplace
 */

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || "test@tchoua.app";
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || "TestMdp2026!";

test.describe("Module 05 - Prêts & Crédit Communautaire", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/dashboard/);
  });

  test("Accès à la section Prêts", async ({ page }) => {
    await page.goto("/dashboard/prets");
    await expect(page.locator("main, [role='main']")).toBeVisible();
  });
});

test.describe("Module 07 - Solidarité & Aide Sociale", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/dashboard/);
  });

  test("Accès à la section Solidarité", async ({ page }) => {
    await page.goto("/dashboard/solidarite");
    await expect(page.locator("main, [role='main']")).toBeVisible();
  });
});

test.describe("Module 08 - Rapports & Comptabilité", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/dashboard/);
  });

  test("Accès à la section Rapports", async ({ page }) => {
    await page.goto("/dashboard/rapports");
    await expect(page.locator("main, [role='main']")).toBeVisible();
  });
});

test.describe("Module 15 - Marketplace", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/dashboard/);
  });

  test("Accès à la Marketplace", async ({ page }) => {
    await page.goto("/dashboard/marketplace");
    await expect(page.locator("main, [role='main']")).toBeVisible();
  });
});
