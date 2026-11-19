# Tchoua App — Fundraising

Extension **Espace association** pour lancer et suivre des levées de fonds : aides, projets, main levées et autres initiatives solidaires.

## Fonctionnalités

- Types de campagne : `AIDE`, `PROJET`, `MAIN_LEVEE`, `AUTRE`
- Fiche complète : contexte & justification, objectifs, résultats attendus, bénéficiaires
- Cagnotte cible, dates de début et de fin, compte à rebours
- Contribution `FIXE` ou `LIBRE`
- Contributeur `ANONYME`, `IDENTIFIE` ou `AU_CHOIX`
- Portée `ASSOCIATION`, `ALL_ASSOCIATIONS`, `PUBLIC`
- Publication dans le groupe de chaque association cible + notifications membres
- Contributions promesses/reçues, confirmation par le bureau, export CSV
- Page publique `/projets` pour les campagnes de portée `PUBLIC`

## Lancement

L’app est réservée au fondateur et au bureau. Elle s’ouvre depuis **Apps marketplace → Fundraising** avec un jeton de lancement `tchoua_token`.

## API

- `GET /api/fundraising?associationId=...`
- `POST /api/fundraising`
- `GET /api/fundraising/:id`
- `PATCH /api/fundraising/:id`
- `DELETE /api/fundraising/:id`
- `GET/POST /api/fundraising/:id/contributions`
- `PATCH /api/fundraising/:id/contributions/:contributionId`
- `GET /api/fundraising/:id/report` (`?format=csv`)

## Développement

Le module est un app statique Tchoua Apps (HTML/CSS/JS) utilisant le SDK contexte et les API plateforme. Il ne stocke aucun secret côté client.
