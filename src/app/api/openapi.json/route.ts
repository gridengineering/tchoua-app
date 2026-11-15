import { NextResponse } from "next/server";
import { getGovernanceConfig } from "@/lib/governance";

export async function GET() {
  const config = await getGovernanceConfig();
  const api = config.openapi;
  if (!api.enabled) return NextResponse.json({ error: "API externe désactivée" }, { status: 404 });

  const securitySchemes: Record<string, unknown> = api.auth === "API_KEY"
    ? { ApiKeyAuth: { type: "apiKey", in: "header", name: api.apiKeyHeader } }
    : api.auth === "OAUTH2"
      ? { OAuth2: { type: "oauth2", flows: { authorizationCode: { authorizationUrl: `${api.baseUrl}/oauth/authorize`, tokenUrl: `${api.baseUrl}/oauth/token`, scopes: Object.fromEntries(api.scopes.map((scope) => [scope, scope])) } } } }
      : {};

  return NextResponse.json({
    openapi: api.version,
    info: {
      title: api.title,
      version: "1.0.0",
      description: api.description,
      contact: { name: api.contactName, email: api.contactEmail },
    },
    servers: [{ url: api.baseUrl }],
    security: api.auth === "API_KEY" ? [{ ApiKeyAuth: [] }] : api.auth === "OAUTH2" ? [{ OAuth2: [] }] : [],
    components: { securitySchemes },
    paths: {
      "/wallet": {
        get: { summary: "Solde et historique du wallet membre", tags: ["Wallet"], responses: { "200": { description: "OK" }, "401": { description: "Non autorisé" } } },
      },
      "/wallet/transactions": {
        post: {
          summary: "Créer un dépôt, retrait ou virement",
          tags: ["Wallet"],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["type", "amount"], properties: { type: { type: "string", enum: ["DEPOSIT", "WITHDRAWAL", "TRANSFER"] }, amount: { type: "number" }, provider: { type: "string" }, receiverId: { type: "string" }, description: { type: "string" } } } } },
          },
          responses: { "200": { description: "Transaction enregistrée" }, "400": { description: "Requête invalide" }, "403": { description: "KYC ou droit insuffisant" } },
        },
      },
      "/associations/{associationId}/wallet": {
        get: { summary: "Wallet de l'association", tags: ["Association Wallet"], parameters: [{ name: "associationId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "OK" } } },
      },
      "/associations/{associationId}/wallet/transactions": {
        post: { summary: "Alimenter ou débiter le wallet association", tags: ["Association Wallet"], parameters: [{ name: "associationId", in: "path", required: true, schema: { type: "string" } }], responses: { "201": { description: "Créé" } } },
      },
      "/notifications": {
        get: { summary: "Notifications Tchoua Mobile", tags: ["Notifications"], responses: { "200": { description: "OK" } } },
      },
      "/associations/{associationId}/messages": {
        get: { summary: "Lire les messages", tags: ["Chat"], parameters: [{ name: "associationId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "OK" } } },
        post: { summary: "Publier un message", tags: ["Chat"], parameters: [{ name: "associationId", in: "path", required: true, schema: { type: "string" } }], responses: { "201": { description: "Créé" } } },
      },
      "/rtc/jitsi-token": {
        post: { summary: "Jeton Jitsi pour une réunion", tags: ["RTC"], responses: { "200": { description: "Jeton signé" }, "403": { description: "KYC ou adhésion insuffisante" } } },
      },
    },
  }, { headers: { "Cache-Control": "public, max-age=300" } });
}
