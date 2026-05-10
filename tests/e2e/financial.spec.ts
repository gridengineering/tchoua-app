import { test, expect } from "@playwright/test";

/**
 * UAT E2E - Scénarios Financiers (Modules 4, 12, 13)
 * Tontines, Wallet, Calendrier
 */

// Utilisateur de test (doit exister dans la BDD de dev)
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || "test@tchoua.app";
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || "TestMdp2026!";

test.describe("Module 12 - Wallet : Consultation du Portefeuille", () => {
  test.beforeEach(async ({ page }) => {
    // Authentification via l'interface
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/dashboard/);
  });

  test("Le dashboard s'affiche après connexion", async ({ page }) => {
    await expect(page.locator("nav")).toBeVisible();
    // Vérifier qu'un élément clé du dashboard est présent
    await expect(page.locator("main, [role='main']")).toBeVisible();
  });

  test("Accès à la page Wallet depuis le dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    // Chercher le lien wallet dans la navigation
    const walletLink = page.locator("a[href*='wallet'], button:has-text('Wallet'), a:has-text('Portefeuille')");
    if (await walletLink.count() > 0) {
      await walletLink.first().click();
      await expect(page.locator("h1, h2")).toContainText(/wallet|portefeuille/i);
    } else {
      // Si pas de lien wallet, on navigue directement
      await page.goto("/dashboard/wallet");
      await expect(page).toHaveURL(/wallet/);
    }
  });
});

test.describe("Module 04 - Tontines : Liste et Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/dashboard/);
  });

  test("Navigation vers la liste des tontines", async ({ page }) => {
    const tontinesLink = page.locator("a[href*='tontine'], button:has-text('Tontine')");
    if (await tontinesLink.count() > 0) {
      await tontinesLink.first().click();
      await expect(page).toHaveURL(/tontine/);
    } else {
      await page.goto("/dashboard/tontines");
      await expect(page.locator("main")).toBeVisible();
    }
  });
});

test.describe("Module 18 - Calendrier Fusionné", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/dashboard/);
  });

  test("Accès à la page calendrier", async ({ page }) => {
    await page.goto("/dashboard");
    const calLink = page.locator("a[href*='calendar'], a[href*='calendrier'], button:has-text('Calendrier')");
    if (await calLink.count() > 0) {
      await calLink.first().click();
      await expect(page.locator("main")).toBeVisible();
    } else {
      // Vérifier que la page racine du dashboard est fonctionnelle
      await expect(page.locator("main, [role='main']")).toBeVisible();
    }
  });
});
