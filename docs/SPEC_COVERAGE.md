# Couverture des spécifications — Tchoua

> Audit réalisé le 2026-11-11 sur `master` (commit de référence : `231978d`), puis complété par
> les développements de la passe « spécifications & ergonomie ».
> Légende : **OK** = implémenté et exposé dans l'UI · **Partiel** = moteur/API présent, UI ou règle
> incomplète · **Manquant** = non implémenté.

## Module 1 — Configuration & cycle de vie de l'association

| Fonction | État | Preuve / remarque |
|---|---|---|
| Paramétrage réunions (fréquence, jour, heure, quorum) | OK | `associations/[id]/parametres` → onglet Réunions |
| Collation (montant/membre + forfait hôte) | OK | Ajouté : `meetingConfig.collationRate`, `collationHostPayout` |
| Comptes bancaires & signataires | OK | Modèle `AssocBankAccount`, paramètres |
| Rôles du bureau personnalisés | OK | `bureauConfig`, `AssociationCustomRole` |
| Wizard de création | Partiel | 4 étapes (`/dashboard/associations/create`) au lieu des 7 de la spécification |
| Association parente / filles | OK | `parentId`, `/relations`, auto-adhésion au parent dans `/join` |
| Édition « master form » par onglets | OK | `/associations/[id]/parametres` |
| Règlement intérieur article par article | OK | `POST /regulations`, `MembershipRegulationApproval`, activation auto |
| Cycle de vie DRAFT → ACTIVE → SUSPENDED → DISSOLVED | OK | `/lifecycle`, journal d'audit |

## Module 2 — Membres

| Fonction | État | Preuve / remarque |
|---|---|---|
| Adhésion, parrainage, frais, validation | OK | `/join/[associationId]`, `membershipConfig` |
| Informations familiales (conjoint, enfants, parents) | OK | `User.familyInfo` |
| Statuts (actif, suspendu, radié, décédé…) | OK | `members/[id]/actions`, liquidation décès incluse |
| Ancienneté & score de fiabilité | OK | `joinedAt`, `reliabilityScore`, `MemberReliabilityScore` |

## Module 3 — Réunions & discipline

| Fonction | État | Preuve / remarque |
|---|---|---|
| Types de réunion (6 types) | OK | `reunions/new` |
| Pointage présent / retard / absent / excusé | OK | `reunions/[meetingId]` → `PATCH /meetings` |
| Amendes retard & absence progressive | OK | Calcul automatique dans `PATCH /meetings` |
| Amendes manuelles (indiscipline, commission…) | OK | `POST /meetings/[meetingId]/fines` |
| Collation : collecte + reversement à l'hôte | OK | `POST /meetings/[meetingId]/collation`, déduction des arriérés |
| Départ anticipé | Partiel | Motif d'amende disponible, pas de détection automatique d'heure de sortie |

## Module 4 — Tontines

| Fonction | État | Preuve / remarque |
|---|---|---|
| Tontine rotative, tirage mensuel, tirage unique | OK | `DrawManager`, `ActivitySession.drawResult` |
| Tontine aux enchères (mise à prix, résultat) | OK | `AuctionManager`, `auctionMinBidPct` |
| Parts multiples | OK | `partAmount`, `maxPartsPerSession` |
| Échecs de paiement & pénalités | Partiel | Sanctions générées par le moteur de répartition ; barèmes 15/20 % non paramétrables |
| Avaliste / garanties | Manquant | Pas de champ dédié (notes libres) |

## Module 5 — Fonds de solidarité

| Fonction | État | Preuve / remarque |
|---|---|---|
| Barèmes d'aide configurables | OK | `socialAidCaps` (10 catégories) |
| Demande / approbation / paiement d'aide | OK | `/aides`, `AssocSocialAidRequest` |
| Prélèvement automatique sur cagnotte | Partiel | Priorité 2 du moteur de répartition |
| Reconstitution annuelle du fonds | Manquant | Pas de bilan de déficit/répartition annuelle |

## Module 6 — Épargne, prêts & dividendes

| Fonction | État | Preuve / remarque |
|---|---|---|
| Dépôts d'épargne historisés | OK | `ActivityContribution` (EPARGNE/INVESTISSEMENT) |
| Workflow de prêt & échéancier | OK | `/prets`, `AssocLoan`, `AssocLoanRepayment` |
| Taux multiples (≤3 mois / >3 mois) | OK | `loanRate1`, `loanRate2` |
| Limites par membre & encours | OK | `loanMaxPerMember`, `loanMaxActive` |
| Pénalités de retard | Partiel | Champs de pénalité par activité ; majoration rétroactive non automatisée |
| **Répartition des bénéfices (quote-part)** | **OK** | **Ajouté** : `/dividendes`, moteur `lib/association/dividends.ts`, crédit wallet transactionnel |

## Module 7 — Finances, recouvrement

| Fonction | État | Preuve / remarque |
|---|---|---|
| Caisse de session & traçabilité | OK | `meetings/[meetingId]/caisse`, `AssocSessionContribution` |
| Relevé de compte membre | Partiel | Rapports PDF/CSV disponibles, pas de relevé mensuel dédié |
| Compensation de dettes / recouvrement croisé | Manquant | À spécifier (amendes + arriérés vs avoirs) |
| Départ / décès | Partiel | Décès : liquidation 75/25 implémentée ; départ : calcul de balance non exposé |

## Module 8 — Moteur de fréquence

| Fonction | État | Preuve / remarque |
|---|---|---|
| Quotidien / hebdo / mensuel (date, n-ième jour, quinzaine) / annuel | OK | `lib/frequency.ts` (473 lignes) |
| Jours fériés (avancer / reporter / annuler) | OK | `holidayBehavior` |
| Aperçu des 12 prochaines sessions | OK | `FrequencyPicker` + `getNextSessions` |
| **UI de configuration à la création d'activité** | **OK** | **Ajouté** : `/activities/new` et `/activities/[actId]/edit` |
| Notifications J-3 / J-1 / Jour J | Manquant | Nécessite un ordonnanceur (cron/queue) |

## Module 9 — Répartition financière

| Fonction | État | Preuve / remarque |
|---|---|---|
| Priorités 1→4, dettes, prêts, excédent | OK | `lib/distribution-engine.ts` |
| Saisie du versement global + résultat transparent | OK | `meetings/[meetingId]/caisse` |

## Module 10 — Modèle de données

80 modèles Prisma couvrant utilisateurs, associations, activités, sessions, réunions, prêts,
solidarité, wallet, templates, élections, workflows d'approbation, rapports, audit.
**OK** (voir `prisma/schema.prisma`).

## Module 11 — Utilisateurs & droits

| Fonction | État | Preuve / remarque |
|---|---|---|
| Espace admin (utilisateurs, rôles, audit, finances) | OK | `/admin/**` |
| RBAC CRUD + rôles personnalisés | OK | `SystemRole`, `permissions.ts` |
| Maker-Checker / workflow d'approbation | OK | `ApprovalWorkflow`, `/approvals` |
| Espace membre 15 modules + sélecteur d'association | OK | `sidebar.tsx`, `header.tsx` |
| **Connexion sociale (Google, Facebook, LinkedIn, X)** | **Manquant** | NextAuth configuré en Credentials uniquement ; nécessite des applications OAuth |

## Module 12 — Wallet

| Fonction | État | Preuve / remarque |
|---|---|---|
| Dépôt / retrait / transfert P2P, frais & plafonds | OK | `/wallet`, `wallet/transactions` |
| Historique immuable | OK | `WalletTransaction` |
| 2FA/OTP sur transactions sensibles | Manquant | À brancher sur un fournisseur SMS/Email |

## Module 13 — Calendrier financier

| Fonction | État | Preuve / remarque |
|---|---|---|
| Réunions + sessions agrégées | OK | `/dashboard/calendrier`, `/api/calendar` |
| Prévisions dépenses/revenus & vues mensuelle/annuelle | Partiel | Agrégation existante, pas de solde net prévisionnel par jour |

## Module 14 — Déploiement

**OK** : OVH (CT 104), Next.js 16, PostgreSQL, PM2, HAProxy, HTTPS Let's Encrypt, renouvellement
automatique. Voir `scripts/deploy-ovh.sh`.

## Corrections d'ergonomie apportées

- Boutons morts supprimés/ reliés : « Nouvelle activité », « Planifier une session », « Rapport PDF ».
- Page de détail de session créée (elle renvoyait un 404 depuis la liste des réunions).
- Contrats API corrigés sur la page activité (activité, sessions, cotisations) : les données
  n'étaient jamais affichées à cause d'un `{ activity }` / `{ sessions }` mal consommé.
- Liste des réunions : `scheduledAt` (au lieu de `date`) — dates et tri corrects.
- Collation intégrée au parcours de session et à la fiche de réunion.
- Sélection d'activité : filtres Tontine / Épargne / Solidarité corrigés (types réels).

## Reste à spécifier / prioriser

1. Connexion sociale (applications OAuth Google/Facebook/LinkedIn/X à créer).
2. Reconstitution annuelle du fonds de solidarité.
3. Compensation de dettes et solde de sortie d'un membre.
4. Notifications programmées des échéances (J-3, J-1, J).
5. 2FA/OTP wallet et double validation Maker-Checker sur les gros montants.
6. Wizard de création en 7 étapes (actuellement 4).
