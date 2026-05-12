import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";
const DEMO_EMAIL = "demo@tchoua.cm";
const DEMO_PASSWORD = "demo123";

// Helper : login via UI
async function login(page: any) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', DEMO_EMAIL);
  await page.fill('input[type="password"]', DEMO_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|associations)/, { timeout: 10000 });
}

// ═══════════════════════════════════════════════════════════════════════════
// UAT-1 : Composants React intégrés (nécessite auth)
// ═══════════════════════════════════════════════════════════════════════════
test.describe("UAT-1 : Composants React intégrés", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("LifecycleBadge affiche le statut correctement", async ({ page }) => {
    await page.goto(`${BASE_URL}/associations/assoc-emergence-yaounde`);
    await expect(page.locator("[data-testid='lifecycle-badge']")).toBeVisible({ timeout: 10000 });
  });

  test("NotificationsBell est présente dans le header", async ({ page }) => {
    await page.goto(`${BASE_URL}/associations/assoc-emergence-yaounde`);
    await expect(page.locator("[data-testid='notifications-bell']")).toBeVisible({ timeout: 10000 });
  });

  test("Les 3 nouveaux onglets sont présents", async ({ page }) => {
    await page.goto(`${BASE_URL}/associations/assoc-emergence-yaounde`);
    await expect(page.locator("[data-testid='tab-governance']")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("[data-testid='tab-relations']")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("[data-testid='tab-reports']")).toBeVisible({ timeout: 10000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// UAT-2 à UAT-7 : API — toutes protégées par auth (401 sans auth)
// ═══════════════════════════════════════════════════════════════════════════
test.describe("UAT-2 : Cycle de vie — API", () => {
  test("GET /api/associations retourne 401 sans auth", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/associations?all=true`);
    expect(res.status()).toBe(401);
  });

  test("PATCH /associations/[id]/lifecycle retourne 401 sans auth", async ({ request }) => {
    const res = await request.patch(`${BASE_URL}/api/associations/assoc-femmes-actives/lifecycle`, {
      data: { toStatus: "ACTIVE" },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe("UAT-3 : Gouvernance — API", () => {
  test("GET /associations/[id]/elections retourne 401 sans auth", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/associations/assoc-emergence-yaounde/elections`);
    expect(res.status()).toBe(401);
  });

  test("GET /associations/[id]/workflows retourne 401 sans auth", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/associations/assoc-emergence-yaounde/workflows`);
    expect(res.status()).toBe(401);
  });
});

test.describe("UAT-4 : Rapports — API", () => {
  test("GET /associations/[id]/reports retourne 401 sans auth", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/associations/assoc-emergence-yaounde/reports`);
    expect(res.status()).toBe(401);
  });

  test("POST /associations/[id]/reports retourne 401 sans auth", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/associations/assoc-emergence-yaounde/reports`, {
      data: { type: "ACTIVITY", title: "Test", format: "CSV" },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe("UAT-5 : Relations — API", () => {
  test("GET /associations/[id]/relations retourne 401 sans auth", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/associations/assoc-emergence-yaounde/relations`);
    expect(res.status()).toBe(401);
  });
});

test.describe("UAT-6 : Notifications & Webhooks — API", () => {
  test("GET /associations/[id]/notifications retourne 401 sans auth", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/associations/assoc-emergence-yaounde/notifications`);
    expect(res.status()).toBe(401);
  });

  test("GET /associations/[id]/webhooks retourne 401 sans auth", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/associations/assoc-emergence-yaounde/webhooks`);
    expect(res.status()).toBe(401);
  });
});

test.describe("UAT-7 : Audit — API", () => {
  test("GET /associations/[id]/audit-logs retourne 401 sans auth", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/associations/assoc-emergence-yaounde/audit-logs`);
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// UAT-8 : Smoke tests
// ═══════════════════════════════════════════════════════════════════════════
test.describe("UAT-8 : Smoke tests", () => {
  test("La page d'accueil charge sans erreur", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("La page /academie charge sans erreur", async ({ page }) => {
    await page.goto(`${BASE_URL}/academie`);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("La page /associations/[id] charge sans erreur 500", async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/associations/assoc-emergence-yaounde`);
    expect(res?.status()).not.toBe(500);
  });
});
