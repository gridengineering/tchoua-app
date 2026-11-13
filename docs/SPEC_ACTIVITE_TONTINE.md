# Spécification fonctionnelle — Activité de tontine

Version 1.0 — 13 novembre 2026
Périmètre : moteur de tontine multi-associations de Tchoua (cycle, parts, cotisations, bénéficiaires, historiques).

---

## 1. Objet et principes

Une **activité de tontine** est un contrat collectif daté qui organise :

1. la **souscription** de parts par les membres ;
2. le **versement** de cotisations à chaque session ;
3. la **désignation** d'un ou plusieurs bénéficiaires par session ;
4. la **distribution** d'un montant par part bénéficiaire ;
5. la **clôture** du cycle selon une règle explicite.

Principes directeurs :

- **Aucune règle figée** : chaque paramètre est défini au niveau de l'activité et peut varier d'une association à l'autre, d'une activité à l'autre.
- **Cycle indépendant** : chaque activité possède son propre cycle, ses propres sessions et son propre solde. Deux activités de la même association ne partagent ni leurs parts ni leur pot.
- **Traçabilité intégrale** : chaque cotisation, souscription, désignation, distribution et ajustement produit un mouvement horodaté et attribué à un membre.
- **Transparence** : chaque membre voit ses propres mouvements ; le bureau voit l'ensemble. L'historique global de l'association est consultable par tous les membres.
- **Idempotence** : une session ne peut être clôturée qu'une fois ; une distribution validée n'est jamais recalculée silencieusement.

---

## 2. Vocabulaire

| Terme | Définition |
|---|---|
| **Part** | Unité de participation. Une part complète vaut `partAmount`. |
| **Fraction de part** | 1, 1/2 ou 1/4 de part selon `minShareFraction` et `allowPartialShares`. |
| **Souscription** | Engagement d'un membre à verser `partsCount × partAmount` à chaque session. |
| **Cotisation** | Versement effectif d'un membre pour une session, égal à `partsCount × partAmount` (ou montant déclaré si paiement partiel autorisé). |
| **Pot / cagnotte** | Somme des cotisations encaissées disponibles pour la session. |
| **Part bénéficiaire** | Part attribuée à un bénéficiaire lors d'une session ; elle donne droit à `beneficiaryAmountPerShare`. |
| **Bénéficiaire** | Membre désigné pour recevoir une ou plusieurs parts lors d'une session. |
| **Cycle** | Période complète entre l'ouverture et la clôture de l'activité. |
| **Session** | Rencontre (mensuelle, hebdomadaire, etc.) durant laquelle on cotise et on distribue. |

---

## 3. Paramètres de l'activité

### 3.1 Paramètres financiers

| Paramètre | Type | Obligatoire | Description |
|---|---|---|---|
| `partAmount` | montant | oui | Valeur d'une part complète. |
| `contributionAmount` | montant | non | Montant de référence affiché ; si absent, calculé comme `partAmount`. |
| `beneficiaryAmountPerShare` | montant | non | Montant reçu par part bénéficiaire. Si absent, égal au pot disponible divisé par les parts à distribuer, ou à `partAmount`. |
| `minShareFraction` | 1 / 0,5 / 0,25 | oui | Plus petite fraction souscriptible. |
| `allowPartialShares` | booléen | oui | Autorise 1/2 et 1/4 de part. |
| `maxSharesPerMember` | nombre | non | Plafond de parts par membre (null = illimité). |
| `maxPartsPerSession` | entier | oui | Nombre maximal de parts bénéficiaires distribuées par session. |
| `maxBeneficiarySharesPerSession` | nombre | non | Plafond de parts qu'un même bénéficiaire peut recevoir sur une session. |
| `allowSameBeneficiaryMultipleShares` | booléen | oui | Autorise un bénéficiaire à recevoir plusieurs parts sur la même session. |
| `distributionMode` | enum | oui | `RANDOM`, `ORDER`, `AUCTION`, `CONSENSUS`, `ROTATION`. |

### 3.2 Paramètres de cycle

| Paramètre | Valeurs | Description |
|---|---|---|
| `cycleMode` | `FIXED_SESSIONS` | Cycle clos après N sessions. |
| | `FIXED_PERIOD` | Cycle clos à une date de fin. |
| | `UNTIL_ALL_BENEFITED` | Cycle clos quand toutes les parts souscrites ont été distribuées. |
| `cycleSessions` | entier | Nombre de sessions prévues (mode `FIXED_SESSIONS`). |
| `cycleStart` | date | Début du cycle (défaut : première session ou création). |
| `cycleEnd` | date | Fin prévue (mode `FIXED_PERIOD`). |
| `cycleConfig` | JSON | Extensions : jour de session, tolérance de retard, report de pot, règles d'ajustement. |

### 3.3 Contraintes de cohérence

- `minShareFraction` ∈ {1 ; 0,5 ; 0,25}.
- Si `allowPartialShares = false`, alors `minShareFraction = 1`.
- `maxBeneficiarySharesPerSession ≥ 1`.
- `cycleSessions ≥ 1` si `cycleMode = FIXED_SESSIONS`.
- `cycleEnd > cycleStart` si `cycleMode = FIXED_PERIOD`.
- `beneficiaryAmountPerShare` ne peut pas dépasser `partAmount × nombre de parts distribuables` sans confirmation explicite (alerte de solvabilité).

---

## 4. Souscription et parts

### 4.1 Règles

1. Un membre actif peut souscrire entre `minShareFraction` et `maxSharesPerMember` parts (ou sans plafond).
2. Une souscription est un engagement récurrent : à chaque session, la cotisation attendue est `partsCount × partAmount`.
3. La souscription peut être modifiée entre deux sessions, jamais rétroactivement sur une session clôturée.
4. Un membre peut souscrire **plusieurs parts** ; sa cotisation par session est multipliée d'autant.
5. Un membre peut souscrire **une demi-part ou un quart de part** si autorisé ; sa cotisation et son droit bénéficiaire sont proportionnels.

### 4.2 Calculs

```
cotisationAttendue(membre, session) = partsCount(membre) × partAmount
totalPartsSouscrites = Σ partsCount(membre)
droitBénéficiaire(membre) = partsCount(membre) × beneficiaryAmountPerShare
```

### 4.3 Scénarios

- **S1** — 12 membres, 1 part, 12 sessions : chaque membre cotise 12 fois ; 12 bénéficiaires d'une part.
- **S2** — 12 membres, certains 2 parts : le nombre de parts bénéficiaires par session peut passer à 2 si le pot le permet.
- **S3** — Membre à 1/2 part : cotise la moitié, reçoit la moitié d'une part bénéficiaire.
- **S4** — Membre déjà bénéficiaire : il continue de cotiser ; ses parts bénéficiaires suivantes sont possibles si `allowSameBeneficiaryMultipleShares = true`.

---

## 5. Sessions et pot

### 5.1 Cycle de vie d'une session

`PLANNED → OPEN → HELD → CLOSED` (ou `CANCELLED`).

- **PLANNED** : date fixée, aucune cotisation saisie.
- **OPEN** : les cotisations peuvent être enregistrées.
- **HELD** : la session a eu lieu ; les cotisations sont figées.
- **CLOSED** : les bénéficiaires sont distribués et le pot est reporté ou épuisé.

### 5.2 Pot disponible

```
pot(session) = Σ cotisations encaissées(session)
             + report du pot précédent (si configuré)
             + ajustements validés
```

### 5.3 Nombre de parts bénéficiaires distribuables

```
partsDistribuables(session) = min(
  maxPartsPerSession,
  floor(pot(session) / beneficiaryAmountPerShare)
)
```

Si `beneficiaryAmountPerShare` est absent :

```
partsDistribuables(session) = min(maxPartsPerSession, nombre de parts restantes)
montantParPart = pot(session) / partsDistribuables(session)
```

### 5.4 Report

- Si le pot ne permet pas de distribuer une part entière, le reliquat est **reporté** à la session suivante (paramétrable).
- Si le pot dépasse le montant nécessaire, l'excédent peut :
  - augmenter le nombre de parts distribuées dans la limite de `maxPartsPerSession` ;
  - ou être reporté ;
  - ou alimenter la caisse de l'association selon `cycleConfig.surplusRule`.

---

## 6. Bénéficiaires

### 6.1 Désignation

- Chaque session désigne `partsDistribuables` parts bénéficiaires.
- Un membre peut recevoir :
  - une seule part (par défaut) ;
  - plusieurs parts si `allowSameBeneficiaryMultipleShares = true` et dans la limite de `maxBeneficiarySharesPerSession`.
- Un membre ne peut pas recevoir plus de parts qu'il n'en a souscrites, sauf règle contraire explicite (`cycleConfig.allowOverReceive`).
- Un membre peut recevoir plusieurs fois au cours du cycle (une part par session ou plusieurs si autorisé).

### 6.2 Modes de désignation

| Mode | Règle |
|---|---|
| `RANDOM` | Tirage aléatoire parmi les membres éligibles n'ayant pas encore bénéficié (ou tous si `allowRepeat`). |
| `ORDER` | Ordre de souscription ou ordre défini par le bureau. |
| `ROTATION` | Tourniquet selon l'ordre des membres. |
| `AUCTION` | Les membres enchérissent la décote ; le pot est distribué au plus offrant. |
| `CONSENSUS` | Le bureau désigne, avec justification obligatoire. |

### 6.3 Éligibilité

Un membre est éligible s'il :

- est actif ;
- a souscrit au moins `minShareFraction` ;
- est à jour de ses cotisations (ou dans la tolérance `cycleConfig.lateTolerance`) ;
- n'a pas atteint son quota de parts bénéficiaires ;
- n'a pas déjà reçu le nombre maximal de tours (`cycleConfig.maxTurnsPerMember`).

### 6.4 Calcul de la distribution

```
montantBénéficiaire = partsBénéficiaires × beneficiaryAmountPerShare
```

Si le pot est inférieur, la distribution est bloquée ou partielle selon `cycleConfig.insufficientPotRule` (`BLOCK`, `PARTIAL`, `DEFER`).

---

## 7. Modes de cycle

### 7.1 Nombre de sessions fixe

- `cycleSessions = N` (ex. 12 sessions mensuelles).
- Le cycle se termine après la N-ième session clôturée.
- Si toutes les parts sont épuisées avant N, le cycle peut être clos par anticipation (`cycleConfig.earlyClose`).
- Si des parts restent après N, elles sont reportées ou remboursées selon `cycleConfig.remainderRule`.

### 7.2 Période fixe

- `cycleEnd` définit la fin.
- Le nombre de sessions est déduit de la fréquence.
- À la date de fin, les parts non distribuées suivent `cycleConfig.remainderRule`.

### 7.3 Jusqu'à épuisement des parts

- Le cycle continue tant que `partsDistribuées < partsSouscrites`.
- Le nombre de sessions est variable ; il dépend du pot et de `maxPartsPerSession`.
- Si le pot croît, le nombre de parts par session peut augmenter.
- Le cycle s'arrête automatiquement quand toutes les parts ont un bénéficiaire.

### 7.4 Formule de progression

```
progression = cycleMode = FIXED_SESSIONS
  ? sessionsTenues / cycleSessions
  : partsDistribuées / partsSouscrites
```

---

## 8. Solde et équilibre du cycle

```
soldeCycle = Σ cotisations encaissées − Σ distributions validées
```

- **Solde positif** : pot disponible (report ou réserve).
- **Solde négatif** : distributions supérieures aux encaissements ; interdit sauf avance de caisse explicite (`cycleConfig.advanceAllowed`).
- Le solde est calculé **par activité**, jamais consolidé entre activités.
- Le solde d'une session : `cotisations(session) − distributions(session)`.

### 8.1 Historique

Trois niveaux sont exposés :

1. **Par membre** : cotisations, bénéfices reçus, net.
2. **Par session** : cotisations, distributions, solde, pot.
3. **Par activité** : cumul du cycle et solde.

---

## 9. Historique des cotisations et des bénéficiaires

- L'historique des cotisations liste : date, membre, session, parts, montant, mode de paiement, statut, référence.
- L'historique des bénéficiaires liste : date, membre, session, parts, montant, mode de désignation, validé par.
- **La différence entre les cotisations et les bénéficiaires d'un cycle donne le solde du cycle.**
- Toute correction crée un mouvement d'ajustement, jamais une suppression.

---

## 10. Intérêts et prêts (activité tontine)

Lorsque l'activité porte des prêts :

- Chaque remboursement comprend un principal et un intérêt.
- L'intérêt est réparti entre les membres **au prorata du capital détenu à la date de décaissement** du prêt.
- Formule :

```
quotePart(membre) = capital(membre, datePrêt) / Σ capital(membres, datePrêt)
partIntérêt(membre) = intérêtRemboursé × quotePart(membre)
```

- L'historique des intérêts est consultable :
  - par membre ;
  - par remboursement (avec composition détaillée) ;
  - par période (mois, trimestre, année) ;
  - au niveau de l'association.
- Les dividendes annuels peuvent être calculés à partir de ces intérêts ou d'un taux de répartition paramétré (`dividendRate`).

---

## 11. Règles de gestion et cas limites

| Cas | Comportement |
|---|---|
| Membre absent à une session | Cotisation due ; amende éventuelle selon le règlement ; éligibilité bénéficiaire suspendue si `cycleConfig.strictAttendance`. |
| Cotisation partielle | Statut `PARTIAL` ; le reliquat reste dû ; la part bénéficiaire est réduite au prorata si `cycleConfig.proportionalBenefit`. |
| Cotisation en retard | Statut `LATE` ; pénalité selon `sanctionsConfig` ; peut bloquer l'éligibilité. |
| Pot insuffisant | `BLOCK` (défaut), `PARTIAL` ou `DEFER`. |
| Pot excédentaire | Report, part supplémentaire (dans la limite du plafond) ou caisse. |
| Membre sortant | Ses cotisations restent acquises ; ses parts bénéficiaires non reçues sont recalculées ou remboursées. |
| Membre décédé | Traitement selon le règlement (ayant droit, solidarité) ; traçabilité obligatoire. |
| Annulation de session | Les cotisations restent, la distribution est annulée avec mouvement inverse. |
| Double distribution | Interdite : contrainte d'unicité (session, membre, rang de part). |
| Changement de `partAmount` en cours de cycle | Interdit sauf nouvelle version de cycle ; sinon avenant avec date d'effet. |
| Changement de `beneficiaryAmountPerShare` | Possible entre sessions ; jamais rétroactif. |
| Clôture anticipée | Autorisée si `cycleConfig.earlyClose` ; les parts restantes sont traitées selon `remainderRule`. |
| Réouverture | Interdite après clôture ; un nouveau cycle doit être créé. |

---

## 12. Cycle de vie de l'activité

```
BROUILLON → OUVERTE → EN_COURS → CLÔTURÉE → ARCHIVÉE
```

- **BROUILLON** : paramètres modifiables, aucune cotisation.
- **OUVERTE** : souscriptions ouvertes, sessions planifiées.
- **EN_COURS** : au moins une session tenue.
- **CLÔTURÉE** : plus de session ni de distribution.
- **ARCHIVÉE** : lecture seule, historiques conservés.

Transitions journalisées (`ActivityLifecycleEvent`) avec auteur, date, motif.

---

## 13. Modèle de données (extrait)

```
AssociationActivity
  partAmount, contributionAmount, beneficiaryAmountPerShare
  minShareFraction, allowPartialShares, maxSharesPerMember
  maxPartsPerSession, maxBeneficiarySharesPerSession
  allowSameBeneficiaryMultipleShares, distributionMode
  cycleMode, cycleSessions, cycleStart, cycleEnd, cycleConfig

ActivitySubscription
  membershipId, partsCount, joinedAt, status

ActivitySession
  activityId, sessionNumber, scheduledAt, heldAt, status, potAmount

ActivityContribution
  sessionId, membershipId, amount, partsCount, status, paidAt, paymentMethod

ActivityBeneficiary
  sessionId, membershipId, partsCount, amount, mode, validatedBy, paidAt
```

Contraintes :

- `(activityId, sessionNumber)` unique.
- `(sessionId, membershipId, rank)` unique pour les parts bénéficiaires.
- `partsCount > 0` et multiple de `minShareFraction`.
- `amount ≥ 0`.

---

## 14. API

| Endpoint | Rôle |
|---|---|
| `GET /api/associations/{id}/history` | Historique normalisé, filtres, regroupements, pagination. |
| `GET /api/associations/{id}/interests` | Intérêts par membre, remboursement, période. |
| `GET /api/associations/{id}/activities/{actId}/cycle` | Synthèse du cycle, membres, sessions, bénéficiaires. |
| `POST /api/associations/{id}/activities/{actId}/sessions` | Ouvrir une session. |
| `POST /api/associations/{id}/activities/{actId}/contributions` | Enregistrer une cotisation. |
| `POST /api/associations/{id}/activities/{actId}/beneficiaries` | Désigner un bénéficiaire. |
| `POST /api/associations/{id}/activities/{actId}/close` | Clôturer le cycle. |

Toutes les routes vérifient l'appartenance à l'association et le rôle requis.

---

## 15. Vues et restitutions

- **Liste** : mouvements paginés, filtres type/date/membre/activité, recherche.
- **Kanban** : regroupement par membre, activité, type ou mois.
- **Graphique** : flux encaissés/décaissés par groupe.
- **Grille (pivot)** : groupes × types de mouvement, totaux et net.
- **Fiche membre** : historique personnel, intérêts, solde.
- **Fiche activité** : cycle, sessions, bénéficiaires, solde.
- Export CSV/PDF des historiques et du cycle.

---

## 16. Sécurité et permissions

- Membre : voit ses mouvements, ses intérêts, sa situation ; peut consulter l'historique global de l'association.
- Trésorier / Président / Secrétaire : voient tous les mouvements, peuvent corriger avec justification.
- Admin système : paramétrage global, audit.
- Toute action sensible (correction, clôture, distribution) est journalisée avec auteur, date, avant/après.

---

## 17. Exemples de calcul

### Exemple A — 12 sessions, 1 part, 12 membres

- `partAmount = 50 000`, `beneficiaryAmountPerShare = 550 000`, `maxPartsPerSession = 1`.
- Chaque session : 12 × 50 000 = 600 000 encaissés ; 550 000 distribués ; solde +50 000 reporté.
- Après 12 sessions : 12 bénéficiaires, solde = 600 000.

### Exemple B — 8 membres, parts multiples

- 4 membres à 1 part, 4 à 2 parts → 12 parts.
- `maxPartsPerSession = 2`, pot = 600 000, `beneficiaryAmountPerShare = 300 000`.
- 2 bénéficiaires par session ; 6 sessions pour épuiser 12 parts.

### Exemple C — Jusqu'à épuisement

- 20 parts, `maxPartsPerSession = 1`, pot variable.
- Session 1 : pot 100 000 → 1 part ; session 2 : pot 250 000 → 2 parts ; etc.
- Le cycle s'arrête quand 20 parts ont été distribuées.

### Exemple D — Demi-part

- `minShareFraction = 0,5`, membre à 0,5 part, `partAmount = 100 000`.
- Cotisation = 50 000 ; bénéfice = 0,5 × `beneficiaryAmountPerShare`.

---

## 18. Critères d'acceptation

1. Un cycle peut être créé avec l'un des trois modes et ses paramètres.
2. Les souscriptions acceptent 1, 1/2 et 1/4 de part selon la configuration.
3. Une cotisation est calculée à partir des parts souscrites.
4. Le nombre de parts bénéficiaires par session respecte le pot et les plafonds.
5. Un membre peut recevoir plusieurs parts si autorisé.
6. Le solde du cycle est égal aux cotisations moins les distributions.
7. Les historiques membre, activité et association sont paginés, filtrables et regroupables.
8. Les intérêts sont répartis au prorata du capital et détaillés par remboursement.
9. Aucune distribution ne peut être dupliquée ou rétroactive.
10. Toutes les actions sont journalisées et consultables.
