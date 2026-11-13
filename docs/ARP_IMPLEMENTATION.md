# Implémentation ARP dans Tchoua

Référence : *Tchoua Association Resource Planning — Étude fonctionnelle et technique de référence*, édition du 13 novembre 2026 (168 pages), et *Référentiel des domaines* (36 domaines, 144 invariants).

## 1. Ce qui est livré

Le code ne se contente pas d'ajouter des pages de lecture : il introduit un **cadre ARP versionné** qui conditionne les nouvelles souscriptions et sépare les notions que l'étude demande de ne plus confondre.

| Brique | Emplacement | État |
|---|---|---|
| Référentiel des 36 domaines (options, invariants, formulaires, workflow, exceptions, recettes, indicateurs) | `src/data/arp-domaines.json`, `src/lib/arp/domains.ts` | Complet, généré depuis le document |
| Catalogue des 10 dimensions et des 6 conditions | `src/lib/arp/catalogue.ts` | Complet, 23 328 combinaisons |
| Recette du catalogue | `tests/fixtures/arp-catalogue-mask.ts`, `tests/unit/arp.test.ts` | Vérifie les 23 328 lignes contre `Tchoua_Catalogue_Combinaisons.csv` |
| Profil ARP par association, brouillon/publié, versions immuables | `ArpProfile`, `ArpProfileVersion`, `src/lib/arp/server.ts` | Livré |
| Validation des invariants et des conditions | `src/lib/arp/profile.ts` | Livré (contrôles C01–C06, ORG, FED, GOV, SEC, FIN) |
| Noyau des fonds, mouvements et réservations | `ArpFund`, `ArpFundMovement`, `ArpFundReservation` | Livré |
| Arithmétique monétaire exacte | `src/lib/arp/money.ts` | Livré (unités mineures entières) |
| Formules ARP (dû, disponible, attribution, échéancier, dividendes, projection) | `src/lib/arp/finance.ts` | Livré et testé |
| Garde des capacités | `src/lib/arp/server.ts#requireArpCapability` | Branché sur activités, prêts et aides |
| Interface de paramétrage | `/associations/[id]/arp` | Livrée (5 onglets) |
| Référentiel et couverture administrateur | `/admin/arp` | Livré |
| Simulateurs (prêt, attribution, solidarité) | Onglet « Simulateurs » | Livré |
| Migration SQL | `prisma/migrations/20261113_arp_core/migration.sql` | Idempotente, appliquée manuellement |

## 2. Modèle de données

### `ArpProfile`

Un seul profil par association. Champs structurants : `structure`, `status` (`DRAFT`, `ACTIVE`, `SUSPENDED`, `ARCHIVED`), `origin` (`MANUAL`, `BACKFILL`, `TEMPLATE`), `version`, `config` (JSON typé), `checks` (dernier contrôle), `draftConfig` et `draftChecks` (modifications non publiées), `effectiveAt`, `approvedById`.

- **Brouillon** : une association active peut préparer une modification sans changer le cadre en vigueur.
- **Publication** : crée une ligne `ArpProfileVersion` avec empreinte SHA-256, puis bascule `config` et incrémente `version`.
- **Import** : les associations existantes reçoivent un profil `ACTIVE` d'origine `BACKFILL` pour ne pas interrompre l'existant ; l'interface et la console admin le signalent comme « à valider ».

### `ArpProfileVersion`

Version immuable : `version`, `status`, `origin`, `config`, `checks`, `hash`, `effectiveAt`, `createdById`, `approvedById`. La contrainte `(profileId, version)` est unique.

### Fonds

- `ArpFund` : code unique par association, nom, type (`LIBRE`, `AFFECTE`, `RESERVE`, `DEPOT`), devise, activité facultative, statut.
- `ArpFundMovement` : entrée/sortie en unités mineures, date valeur, date d'occurrence, source, description, référence de correction.
- `ArpFundReservation` : montant, motif, expiration, statut (`ACTIVE`, `RELEASED`, `CONSUMED`).

**Disponible = solde (entrées − sorties) − réservations actives.** Une sortie ne peut jamais dépasser ce disponible. Une réservation consommée crée un décaissement lié et ne modifie pas le solde deux fois.

## 3. Catalogue et conditions

Les dix dimensions : organisation, adhésion, cotisation, tontine, crédit, aide, canal, devise, connexion, validation.

Les six conditions sont calculées, pas stockées en 23 328 lignes :

| Code | Déclenchement | Champs requis |
|---|---|---|
| C01 | cotisation `nature` + tontine ouverte | valorisation, règle de liquidité |
| C02 | tontine `encheres` + connexion `hors_ligne` | assiette, clôture, politique d'offre hors ligne |
| C03 | canal `mobile_money` + connexion `hors_ligne` | prestataire, politique hors ligne, confirmation externe |
| C04 | devise `conversion` | source, date, marge, devise de présentation |
| C05 | adhésion `familiale` + aide ouverte | unité de plafond, définition du ménage |
| C06 | crédit ouvert + validation `simple` | seuil de décision, règle de déport |

La recette compare la sortie du moteur aux 23 328 lignes du CSV officiel, y compris la qualification « conditionnelle / sans condition supplémentaire ».

## 4. Invariants exécutables

Le moteur refuse notamment :

- une devise absente ou invalide (INT01) ;
- une section sans association mère ou sans mode d'héritage (FED01/FED02) ;
- une fédération sans règle de délégués (FED03) ;
- une double validation sans séparation des fonctions (SEC) ;
- une conversion sans cours, date, marge ou devise de présentation (C04) ;
- un crédit sans seuil ni déport (C06) ;
- une aide familiale sans définition du ménage (C05) ;
- une enchère sans assiette nommée (C02) ;
- la désactivation de l'audit, de l'isolation, de l'exactitude monétaire, de la concurrence, de l'immutabilité des versions, du journal équilibré ou de l'interdiction de fonds négatifs (REG04, FIN01, FIN04) ;
- un module désactivé alors que sa dimension est ouverte.

## 5. Points d'application

`requireArpCapability` est appelé avant :

- la création d'une activité (`POST /api/associations/[id]/activities`) ;
- une demande de prêt (`POST /api/associations/[id]/loans`) ;
- une demande d'aide (`POST /api/associations/[id]/social-aids`).

Les remboursements, approbations, corrections et liquidations ne sont **pas** bloqués par une désactivation : l'étude exige de préserver les obligations existantes.

Un profil `DRAFT` bloque les nouvelles souscriptions avec un message explicite ; les associations importées sont `ACTIVE` pour éviter une rupture.

## 6. API

| Route | Méthode | Usage |
|---|---|---|
| `/api/associations/[id]/arp` | GET | Profil, brouillon, contrôles, capacités, versions, fonds |
| `/api/associations/[id]/arp` | PUT | Enregistrer un brouillon (`publish:false`) ou publier (`publish:true`) |
| `/api/associations/[id]/arp/funds` | GET/POST | Lister / créer un fonds |
| `/api/associations/[id]/arp/funds/[fundId]` | GET/PATCH | Détail / renommer ou clôturer |
| `/api/associations/[id]/arp/funds/[fundId]/movements` | POST | Entrée ou sortie avec contrôle du disponible |
| `/api/associations/[id]/arp/funds/[fundId]/reservations` | POST | Réserver un montant |
| `/api/associations/[id]/arp/funds/[fundId]/reservations/[reservationId]` | PATCH | Libérer ou consommer |
| `/api/arp/referential` | GET | Référentiel des 36 domaines |
| `/api/admin/arp` | GET | Couverture ARP des associations (admin système) |

Toutes les routes vérifient la session, l'appartenance à l'association et, pour les écritures, `EDIT_SETTINGS`. La publication est réservée au président, au fondateur ou à l'administrateur système.

## 7. Interface

### `/associations/[id]/arp`

- **Profil** : identité, finalités, statut juridique, pays, devise, fuseau, modèle, gouvernance, adhésions, famille, noyau financier, invariants.
- **Modules & conditions** : les 10 dimensions, la qualification calculée, les champs requis par condition, les 12 modules, les garde-fous.
- **Fonds & réservations** : création, mouvements, réservations, consommation/libération, historique.
- **Simulateurs** : échéancier (principal constant, annuité, in fine), attribution de tontine (pot/plafond/droits restants), projection de solidarité.
- **Versions** : historique, empreinte, date d'effet.

Les erreurs sont recalculées côté client à chaque modification, puis revérifiées côté serveur à l'enregistrement et à la publication.

### `/admin/arp`

Deux vues : couverture des associations (statut, origine, version, complétude, modules, fonds) et référentiel complet des 36 domaines avec recherche.

## 8. Recette

`tests/unit/arp.test.ts` — 20 tests :

- 36 domaines, 144 invariants ;
- 23 328 combinaisons identiques au CSV ;
- détection C01–C06 ;
- capacités déduites ;
- refus conversion/crédit/invariants ;
- configuration complète acceptée ;
- normalisation partielle ;
- conversion et formatage exacts ;
- dû net, partiel, trop-perçu, remise ;
- disponible d'épargne et de fonds ;
- attribution 650 000 / 300 000 / plafond 2 → 2 parts, 600 000, reste 50 000 ;
- pot 250 000 / droit 300 000 → 0 part ;
- fraction 0,25 ;
- échéancier 120 000 / 3 / 3 % → 43 600, 42 400, 41 200 ; intérêts 7 200 ;
- taux zéro → 33 333, 33 333, 33 334 ;
- dividende 5 433 499 / 7 → 776 215 + 6 × 776 214 ;
- répartition 1 000 / 3 → 334, 333, 333 ;
- minimum des limites de prêt ;
- projection 100 × 6 000 × 12 × 90 % = 6 480 000.

Suite complète : **137 tests / 8 suites**, `tsc --noEmit` propre, build Next 16 réussi.

## 9. Couverture des 36 domaines

| Domaine | État dans Tchoua | Détail |
|---|---|---|
| 01 Identité et formes | Configuré + invariants | Profil ARP, finalités, statut déclaré, devise, modèle. Historique de renommage non ajouté. |
| 02 Fédérations et héritage | Partiel | Hiérarchie existante, parent, mode d'héritage et règle de délégués ; consolidation nationale non livrée. |
| 03 Adhésions et sorties | Partiel | Adhésions existantes, rôles, joinCode ; catégories et périodes paramétrables dans le profil, pas encore de registre de catégories dédié. |
| 04 Familles et confidentialité | Configuré | Unité de plafond, définition du ménage ; registre des personnes liées non livré. |
| 05 Gouvernance et votes | Partiel | Élections, mandats et workflows existants ; quorum/majorité paramétrés, calcul de scrutin non refondu. |
| 06 Réunions et présence | Partiel | Réunions, présences, collation existantes ; configuration ARP. |
| 07 Discipline et recours | Partiel | Sanctions et recours existants ; barèmes paramétrables. |
| 08 Documents et signatures | Partiel | Documents et articles existants ; signature électronique non intégrée. |
| 09 Moteur de règles | Livré (noyau) | Configuration typée, versionnée, validée, simulée ; pas encore d'arbre d'expression libre. |
| 10 Cotisations et affectations | Partiel | Cotisations existantes ; formules de dû, remise et trop-perçu livrées ; table d'affectation générique non créée. |
| 11 Paiements et rapprochement | Partiel | Saisie existante, idempotence paramétrée ; connecteurs opérateurs non livrés. |
| 12 Caisses, budgets, écritures | Partiel | Fonds, mouvements et réservations livrés ; journal comptable équilibré non créé. |
| 13 Souscriptions et fractions | Livré (calcul) | Champs d'activité existants, formules de fractions et plafonds testées. |
| 14 Attributions et tirages | Partiel | Modes existants, simulateur et limites ; moteur d'attribution automatique non refondu. |
| 15 Enchères et décotes | Partiel | Champs existants, assiette et clôture paramétrées ; moteur d'enchère temps réel non livré. |
| 16 Cycles et clôtures | Partiel | Cycle existant, calculs de droits ; clôture financière dédiée non livrée. |
| 17 Épargne | Partiel | Produits et contributions existants ; disponible/blocage paramétrés. |
| 18 Prêts et plafonds | Partiel | Demandes, approbations, plafonds existants ; formule de minimum livrée. |
| 19 Échéanciers et intérêts | Livré | Bibliothèque d'échéanciers + simulateur ; les prêts existants gardent leur échéancier. |
| 20 Remboursements et retards | Partiel | Remboursements et retards existants ; restructuration non unifiée. |
| 21 Garanties et cautions | Non livré | À modéliser (support, valeur admissible, réservation, libération). |
| 22 Solidarité et droits | Partiel | Catalogue et demandes existants ; plafonds engagés et cumuls à renforcer. |
| 23 Demandes d'aide et paiements | Partiel | Demandes et approbations existantes ; ventilation multi-destinataires non livrée. |
| 24 Réserves et prévision | Livré (calcul) | Simulateur de projection et de recouvrement. |
| 25 Investissements et dividendes | Partiel | Runs de dividendes existants ; clés capital-jours à généraliser. |
| 26 Projets et subventions | Non livré | Module activable mais tables projets/jalons/bailleurs absentes. |
| 27 Achats groupés et stocks | Non livré | Module activable, pas de stock ni d'inventaire. |
| 28 Patrimoine et bénévolat | Non livré | À modéliser. |
| 29 Événements et collation | Partiel | Événements et collation existants ; capacité et logistique à compléter. |
| 30 Communauté et formation | Partiel | Chat, annuaire et gamification existants ; formation/distinctions à compléter. |
| 31 Rapports et consolidation | Partiel | Rapports existants, couverture ARP admin ; consolidation inter-entités non livrée. |
| 32 Sécurité et habilitations | Partiel | Auth, permissions, isolation ; mandats temporaires et accès support à renforcer. |
| 33 Architecture et API | Livré (socle) | API ARP typée, erreurs structurées, transactions sérialisables ; outbox non livrée. |
| 34 Mobile, langues, notifications | Partiel | Responsive, thèmes et i18n existants ; mode hors ligne non livré. |
| 35 Migration et exploitation | Non livré | Scripts de déploiement existants ; restauration testée et RPO/RTO à formaliser. |
| 36 Internationalisation et devises | Partiel | Devise fonctionnelle, conversion paramétrée, arithmétique exacte ; journal multi-devises non livré. |

## 10. Limites assumées

Cette livraison installe le **cadre de gestion et le noyau de calcul**. Elle ne prétend pas réaliser les huit lots de l'étude en une passe. Les éléments suivants restent des chantiers explicitement identifiés :

1. journal comptable en partie double et plan de comptes ;
2. table générique `Obligation` / `Payment` / `Allocation` pour remplacer les tables métier spécialisées ;
3. registre des garanties et nantissements ;
4. connecteurs Mobile Money / banque avec webhooks signés et rapprochement ;
5. moteur d'enchères et de tirage avec preuve vérifiable ;
6. projets, achats, stocks, patrimoine et bénévolat ;
7. consolidation fédérale et élimination des flux réciproques ;
8. outbox, reprise après panne et tests de concurrence de bout en bout.

Le cadre ARP est le point d'ancrage de ces lots : chaque nouveau module devra lire la version de règles applicable et respecter les invariants déjà branchés.
