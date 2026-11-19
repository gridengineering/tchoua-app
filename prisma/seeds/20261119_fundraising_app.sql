INSERT INTO platform_apps (
  id, slug, name, tagline, description, "developerName", "developerUrl", "repositoryUrl", "homepageUrl", "iconUrl", "coverUrl", scope, category, status, version, manifest, permissions, screenshots, "descriptionHtml", "descriptionUrl", "installCount", "createdAt", "updatedAt"
) VALUES (
  'association-fundraising', 'association-fundraising', 'Fundraising', 'Lancez et suivez les levées de fonds de votre association.', 'Aides, projets et main levées avec cagnotte cible, compte à rebours, contributions libres ou fixes et diffusion aux associations ciblées.', 'Tchoua Labs', 'https://github.com/DESTINBOAZ', 'https://github.com/DESTINBOAZ/tchoua-app-association-fundraising', '/app-demos/association-fundraising/index.html', '/app-demos/association-fundraising/preview.svg', NULL, 'ASSOCIATION', 'Solidarité', 'PUBLISHED', '1.0.0', '{"schemaVersion":"1.0","slug":"association-fundraising","name":"Fundraising","scope":"ASSOCIATION","version":"1.0.0","entryUrl":"/app-demos/association-fundraising/index.html","descriptionUrl":"/app-demos/association-fundraising/description.html","screenshots":["/app-demos/association-fundraising/preview.svg"],"permissions":["context:read","fundraising:read","fundraising:write","notifications:group"],"developer":"Tchoua Labs"}', '["context:read","fundraising:read","fundraising:write","notifications:group"]', '["/app-demos/association-fundraising/preview.svg"]', NULL, '/app-demos/association-fundraising/description.html', 0, now(), now()
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  scope = EXCLUDED.scope,
  category = EXCLUDED.category,
  status = 'PUBLISHED',
  version = EXCLUDED.version,
  manifest = EXCLUDED.manifest,
  permissions = EXCLUDED.permissions,
  screenshots = EXCLUDED.screenshots,
  "repositoryUrl" = EXCLUDED."repositoryUrl",
  "homepageUrl" = EXCLUDED."homepageUrl",
  "iconUrl" = EXCLUDED."iconUrl",
  "descriptionUrl" = EXCLUDED."descriptionUrl",
  "updatedAt" = now();
