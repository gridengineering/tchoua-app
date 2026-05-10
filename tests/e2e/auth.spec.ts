import { test, expect } from "@playwright/test";

/**
 * UAT E2E - Scénarios d'Authentification & Accès (Modules 1, 2, 11)
 * Conformément à SPECIFICATION.md - MODULE 4 : AUTHENTIFICATION SOCIALE
 */

test.describe("Module 01 & 11 : Inscription et Authentification", () => {
  test("La page d'accueil se charge correctement", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Tchoua/i);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("La page de connexion est accessible", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("La page d'inscription est accessible", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("form")).toBeVisible();
  });

  test("Tentative de connexion avec des identifiants vides affiche une erreur", async ({ page }) => {
    await page.goto("/login");
    await page.locator('button[type="submit"]').click();
    // Le navigateur doit afficher une validation HTML5 ou un message d'erreur
    const emailInput = page.locator('input[type="email"]');
    const isRequired = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valueMissing);
    expect(isRequired).toBe(true);
  });

  test("Accès au dashboard sans authentification redirige vers /login", async ({ page }) => {
    await page.goto("/dashboard");
    // Doit être redirigé
    await expect(page).toHaveURL(/login|register|\/$/);
  });
});
