# Spécification Technique — Gestion du Cycle de Vie Complet d'une Association

## Tchoua — Plateforme de Gestion Communautaire

**Version** : 1.0  
**Date** : 2026-05-11  
**Statut** : Spécification Fonctionnelle et Technique  
**Langue** : Français (référence) — traductions disponibles en EN, ES, DE, GHOMALA, EWONDO, DOUALA, FULFULDE

---

## Table des Matières

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Glossaire](#2-glossaire)
3. [Architecture des Relations Inter-Associations](#3-architecture-des-relations-inter-associations)
4. [Modèle de Données](#4-modèle-de-données)
5. [Cycle de Vie Complet](#5-cycle-de-vie-complet)
6. [Paramétrage Universel](#6-paramétrage-universel)
7. [Gouvernance et Permissions](#7-gouvernance-et-permissions)
8. [Workflows Détaillés](#8-workflows-détaillés)
9. [Règles Métier](#9-règles-métier)
10. [API et Interfaces](#10-api-et-interfaces)
11. [Exigences Non-Fonctionnelles](#11-exigences-non-fonctionnelles)

---

## 1. Vue d'Ensemble

### 1.1 Objectif

Le présent document spécifie les exigences fonctionnelles et techniques pour la gestion du **cycle de vie complet** d'une association au sein de la plateforme Tchoua. Il couvre la création, la configuration, l'exploitation et la clôture d'une association, ainsi que les **relations hiérarchiques et horizontales** entre associations (mère, filles, sœurs).

### 1.2 Périmètre

| Domaine | Description |
|---------|-------------|
| **Création** | Wizard guidé, templates prédéfinis, configuration manuelle |
| **Modification** | Tout paramètre modifiable à tout moment par les ayants-droit |
| **Cycle** | Fréquences, échéances, périodes probatoires, renouvellement |
| **Session** | Ouverture, déroulement, clôture, archivage |
| **Activités** | Tontine, épargne, prêts, solidarité, nature, investissement, achats groupés |
| **Rapports** | Financiers, administratifs, statistiques, conformité OHADA |
| **Membres** | Adhésion, rôles, parrainage, scoring, historique |
| **Bureau** | Élection, révocation, délégation, intérim |
| **Réunion** | Convocation, ordre du jour, PV, vote, quorum |
| **Relations** | Associations mères, filiales, sœurs (partenariats) |

### 1.3 Principes Directeurs

1. **Paramétrabilité totale** : Aucun paramètre n'est figé après la création.
2. **Traçabilité absolue** : Toute modification est versionnée et auditable.
3. **Gouvernance flexible** : Le créateur et le bureau peuvent modifier les règles selon des quorum configurables.
4. **Multi-niveaux** : Support natif des relations hiérarchiques entre associations.
5. **Conformité réglementaire** : Respect des standards OHADA et des pratiques communautaires.

---

## 2. Glossaire

| Terme | Définition |
|-------|------------|
| **Association** | Entité organisationnelle regroupant des membres autour d'objectifs communs (tontine, coopérative, mutuelle, etc.) |
| **Association Mère** | Association parente pouvant créer, superviser et consolider des associations filles |
| **Association Fille** | Association créée sous l'égide d'une association mère, héritant optionnellement de certains paramètres |
| **Association Sœur** | Association indépendante liée par un partenariat formel (échanges de données, transferts, garanties croisées) |
| **Bureau** | Organe exécutif composé minimalement d'un Président, d'un Secrétaire et d'un Trésorier |
| **Créateur** | Utilisateur ayant initié la création de l'association. Détient des droits spéciaux jusqu'à la désignation d'un bureau stable |
| **Cycle** | Période de fonctionnement de l'association (ex: année civile, année fiscale, cycle de tontine) |
| **Session** | Réunion formelle de l'association où se déroulent les opérations programmées |
| **Activité** | Fonction métier activée au sein de l'association (tontine, prêt, solidarité, etc.) |
| **Quorum** | Seuil minimal de participation requis pour valider une décision. Configurable par type de décision |
| **Règlement Intérieur (RI)** | Document juridique interne définissant les règles de fonctionnement. Généré automatiquement, modifiable à tout moment |

---

## 3. Architecture des Relations Inter-Associations

### 3.1 Types de Relations

```
┌─────────────────────────────────────────────────────────────┐
│                    ASSOCIATION MÈRE                         │
│              (Fédération / Union / Coopérative)            │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   FILLE A    │  │   FILLE B    │  │   FILLE C    │     │
│  │ (Tontine     │  │ (Solidarité) │  │ (Invest.)    │     │
│  │  Village 1)  │  │              │  │              │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
│                   ┌────────┴────────┐                       │
│                   │   ASSOCIATION    │                       │
│                   │    SŒUR X        │                       │
│                   │  (Partenaire)    │                       │
│                   └──────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Modèle de Relation

```typescript
interface AssociationRelation {
  id: string;
  sourceId: string;           // Association source
  targetId: string;           // Association cible
  type: "PARENT" | "CHILD" | "SISTER";
  status: "ACTIVE" | "SUSPENDED" | "DISSOLVED";
  
  // Paramètres de la relation
  config: {
    allowConsolidatedReports: boolean;  // Rapports croisés autorisés
    allowFundTransfers: boolean;        // Transferts de fonds
    allowMemberSharing: boolean;        // Partage d'annuaire
    allowCrossGuarantees: boolean;      // Garanties croisées pour prêts
    inheritanceRules: {
      copyTemplates: boolean;
      copyRules: boolean;
      copyActivities: boolean;
      copyFeeStructure: boolean;
    };
    consolidationScope: "FULL" | "FINANCIAL_ONLY" | "REPORTS_ONLY";
  };
  
  createdAt: Date;
  createdBy: string;          // Référence utilisateur
}
```

### 3.3 Règles de Relation

| Relation | Création | Suppression | Droits Hérités | Consolidation |
|----------|----------|-------------|----------------|---------------|
| **Mère → Fille** | Bureau de la mère | Bureau de la mère OU bureau de la fille (selon config) | Templates, règles, structure de frais (optionnel) | Rapports consolidés, fonds communs |
| **Fille → Mère** | Bureau de la mère | Bureau de la mère OU bureau de la fille (selon config) | Aucun (remonte les données) | Remonte les rapports |
| **Sœur → Sœur** | Bureau des deux côtés (accord mutuel) | Bureau des deux côtés (accord mutuel) | Aucun | Partage selon config |

---

## 4. Modèle de Données

### 4.1 Entité `Association`

```typescript
interface Association {
  id: string;                    // CUID
  slug: string;                  // Identifiant URL unique
  
  // Identité
  name: string;
  description: string;
  acronym?: string;
  logoUrl?: string;
  bannerUrl?: string;
  
  // Typologie
  type: AssociationType;         // TONTINE_CLUB | COOPERATIVE | SOLIDARITY | INVESTMENT | AGRICULTURAL | MUTUAL | OTHER
  legalStatus?: string;          // Statut juridique si enregistrée
  registrationNumber?: string;   // Numéro d'enregistrement officiel
  
  // Relations hiérarchiques
  parentId?: string;             // Référence association mère
  childIds: string[];            // Références associations filles
  sisterRelations: AssociationRelation[];
  
  // Localisation
  region: string;
  city: string;
  country: string;               // Par défaut "CM" (Cameroun)
  geoCoordinates?: { lat: number; lng: number };
  
  // Cycle de vie
  status: AssociationStatus;     // DRAFT | PENDING | ACTIVE | SUSPENDED | DISSOLVED
  lifecycle: {
    createdAt: Date;
    activatedAt?: Date;
    suspendedAt?: Date;
    dissolvedAt?: Date;
    currentCycleStart: Date;
    currentCycleEnd?: Date;
    cycleDuration: number;       // En mois
    autoRenew: boolean;          // Renouvellement automatique
  };
  
  // Paramétrage global
  settings: AssociationSettings;
  
  // Activités activées
  activities: ActivityConfig[];
  
  // Bureau
  bureau: BureauConfig;
  
  // Règlement intérieur
  rules: RulesConfig;
  
  // Paramètres financiers
  finance: FinanceConfig;
  
  // Audit
  auditLog: AuditEntry[];
  version: number;               // Version du schéma de l'association
}
```

### 4.2 Entité `AssociationSettings` (Tout Paramétrable)

```typescript
interface AssociationSettings {
  // Membership
  membership: {
    openEnrollment: boolean;           // Adhésion libre ou sur invitation
    approvalRequired: boolean;         // Validation bureau obligatoire
    sponsorshipRequired: boolean;      // Parrainage obligatoire
    probationPeriodMonths: number;     // Période probatoire (0 = aucune)
    maxMembers?: number;               // Limite de membres
    minAge?: number;
    maxAge?: number;
    genderRestriction?: "NONE" | "FEMALE_ONLY" | "MALE_ONLY";
    registrationFee: number;           // Frais d'inscription
    annualFee: number;                 // Cotisation annuelle de base
    membershipCardEnabled: boolean;    // Carte membre numérique
  };
  
  // Sessions
  sessions: {
    frequency: SessionFrequency;       // WEEKLY | BIWEEKLY | MONTHLY | QUARTERLY | CUSTOM
    customIntervalDays?: number;
    defaultDayOfWeek?: number;         // 0=Dimanche, 1=Lundi...
    defaultTimeOfDay: string;          // "14:00"
    quorumRequired: boolean;
    quorumPercentage: number;          // Ex: 50 = 50% des membres
    minAttendanceForDistribution: number; // Membres min pour une session valide
    autoOpenReminderHours: number;     // Rappel avant ouverture
    autoCloseAfterHours: number;       // Fermeture auto après X heures
    allowRemoteAttendance: boolean;    // Participation à distance
    requirePhysicalSignature: boolean; // Signature physique du PV
  };
  
  // Bureau
  bureau: {
    electionFrequencyMonths: number;   // Fréquence des élections
    maxTerms: number;                  // Mandats max consécutifs
    minBureauSize: number;             // Minimum 3 (Président, Secrétaire, Trésorier)
    maxBureauSize: number;
    roles: CustomRole[];               // Rôles personnalisés au-delà des standards
    requireGenderBalance: boolean;     // Parité requise
    allowCoPresidency: boolean;        // Co-présidence autorisée
    removalQuorum: number;             % pour révoquer un membre du bureau
  };
  
  // Notifications
  notifications: {
    channels: ("PUSH" | "SMS" | "EMAIL" | "WHATSAPP")[];
    reminderRules: ReminderRule[];
    doNotDisturbStart: string;         // "22:00"
    doNotDisturbEnd: string;           // "07:00"
    language: string;                  // Langue par défaut des communications
  };
  
  // Sécurité
  security: {
    require2FAForSensitive: boolean;   // 2FA pour opérations sensibles
    sessionTimeoutMinutes: number;
    maxLoginAttempts: number;
    passwordPolicy: "STANDARD" | "STRONG";
    auditRetentionMonths: number;
  };
  
  // Rapports
  reports: {
    autoGenerateMonthly: boolean;
    autoGenerateQuarterly: boolean;
    autoGenerateAnnual: boolean;
    reportFormat: ("PDF" | "EXCEL" | "CSV")[];
    distributionList: string[];        // IDs membres recevant les rapports
    ohadaCompliance: boolean;          // Conformité OHADA
  };
}
```

### 4.3 Entité `ActivityConfig`

```typescript
interface ActivityConfig {
  id: string;
  type: ActivityType;
  // TONTINE_ROTATIVE | TONTINE_ASCA | TONTINE_ENCHERES | 
  // EPARGNE | AIDE_SOLIDAIRE | PRET | NATURE | 
  // INVESTISSEMENT | ACHATS_GROUPES | COLLECTION
  
  enabled: boolean;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  
  // Paramètres spécifiques au type
  config: ActivitySpecificConfig;
  
  // Droits
  permissions: {
    whoCanCreate: RoleLevel[];
    whoCanModify: RoleLevel[];
    whoCanDelete: RoleLevel[];
    whoCanView: RoleLevel[];
    approvalRequiredFor: OperationType[];
  };
  
  // Fréquence et planification
  schedule: {
    frequency: ActivityFrequency;
    startDate: Date;
    endDate?: Date;
    autoStart: boolean;
    autoRemind: boolean;
  };
}
```

### 4.4 Entité `BureauConfig`

```typescript
interface BureauConfig {
  // Membres du bureau
  members: BureauMember[];
  
  // État
  status: "ACTIVE" | "TRANSITION" | "INTERIM" | "DISSOLVED";
  
  // Mandat actuel
  currentTerm: {
    termNumber: number;
    startedAt: Date;
    endsAt: Date;
    electedBy: string[];           // IDs des votants
    electionQuorum: number;        // % atteint lors de l'élection
    electionMethod: "UNANIMITY" | "MAJORITY" | "RELATIVE";
  };
  
  // Historique des mandats
  termHistory: TermRecord[];
  
  // Délégations temporaires
  delegations: Delegation[];
  
  // Réunions du bureau
  meetings: BureauMeeting[];
}

interface BureauMember {
  membershipId: string;
  userId: string;
  role: RoleType;
  title: string;                    // Intitulé personnalisé
  isInterim: boolean;
  delegatedFrom?: string;           // Si intérim
  electedAt: Date;
  mandateEnd: Date;
  signatureUrl?: string;
  permissions: Permission[];        // Droits spécifiques surchargés
}
```

### 4.5 Entité `RulesConfig` (Règlement Intérieur)

```typescript
interface RulesConfig {
  version: number;
  lastModifiedAt: Date;
  lastModifiedBy: string;
  
  // Sections du RI
  sections: RuleSection[];
  
  // Paramètres clés extraits pour usage programmatique
  extractedParams: {
    lateContributionPenalty: number;       // % ou montant fixe
    absencePenalty: number;
    maxConsecutiveAbsences: number;
    expulsionThreshold: number;            // Score minimum
    loanMaxRatio: number;                  // % du fonds total
    loanInterestRate: number;              // % par mois
    treasuryInterestRate: number;          // % pour prêts caisse
    distributionMethod: DistributionType;
    votingMethod: VotingMethod;
    amendmentQuorum: number;               // % pour modifier le RI
  };
  
  // Approbations
  approvals: {
    adoptedAt?: Date;
    adoptedByQuorum: number;
    amendmentHistory: AmendmentRecord[];
  };
  
  // Document généré
  generatedDocument?: {
    url: string;
    generatedAt: Date;
    pdfHash: string;             // Hash SHA-256 pour intégrité
  };
}
```

---

## 5. Cycle de Vie Complet

### 5.1 États du Cycle de Vie

```
┌─────────┐    Création    ┌──────────┐   Activation   ┌─────────┐
│  DRAFT  │ ─────────────→ │ PENDING  │ ─────────────→ │ ACTIVE  │
└─────────┘                └──────────┘                └────┬────┘
     ↑                                                      │
     │                    ┌──────────┐   Suspension        │
     │   Dissolution      │SUSPENDED │ ←───────────────────┤
     └────────────────────┤          │ ────────────────────┘
                          └────┬─────┘      Réactivation
                               │
                               ↓ Dissolution définitive
                          ┌──────────┐
                          │DISSOLVED │
                          └──────────┘
```

### 5.2 Description des États

| État | Description | Transition Possible |
|------|-------------|---------------------|
| **DRAFT** | Association en cours de création. Seul le créateur y a accès. | → PENDING (soumission) |
| **PENDING** | En attente de validation du bureau (si config) ou activation. | → ACTIVE (validation) |
| **ACTIVE** | Association pleinement opérationnelle. | → SUSPENDED, → DISSOLVED |
| **SUSPENDED** | Activités temporairement interrompues. Lecture seule pour les membres. | → ACTIVE (réactivation), → DISSOLVED |
| **DISSOLVED** | Association dissoute. Données archivées, accès historique uniquement. | Aucune |

### 5.3 Cycle Annuel / Périodique

```
Cycle N
├── Phase 1 : Préparation (configurable, défaut: 2 semaines avant)
│   ├── Convocation des membres
│   ├── Publication de l'ordre du jour
│   └── Préparation des documents
├── Phase 2 : Assemblée Générale (obligatoire pour renouvellement)
│   ├── Bilan moral et financier
│   ├── Élection / Renouvellement du bureau
│   └── Vote sur les amendements au RI
├── Phase 3 : Exécution
│   ├── Sessions régulières
│   ├── Activités programmées
│   └── Opérations courantes
├── Phase 4 : Clôture
│   ├── Génération des rapports annuels
│   ├── Archivage des documents
│   └── Préparation du cycle N+1
└── Transition → Cycle N+1
```

---

## 6. Paramétrage Universel

### 6.1 Philosophie

> **Aucun paramètre n'est figé. Tout est modifiable à tout moment par les entités autorisées, sous réserve du quorum configuré.**

### 6.2 Matrice de Paramétrage

| Paramètre | Valeur par Défaut | Modifiable par | Quorum Requis | Impact |
|-----------|-------------------|----------------|---------------|--------|
| Nom | (défini à la création) | Créateur, Bureau | Unanimité | Faible |
| Type | (défini à la création) | Créateur, Bureau | 2/3 | Fort |
| Activités activées | Toutes | Bureau | Majorité | Fort |
| Fréquence sessions | Mensuel | Bureau | Majorité | Moyen |
| Montant cotisation | (défini à la création) | Bureau | 2/3 | Fort |
| Taux prêts | 5%/mois | Bureau | 2/3 | Fort |
| Rôles du bureau | Standards | Bureau | 2/3 | Moyen |
| Règlement intérieur | Généré auto | Bureau | 2/3 | Fort |
| Relations inter-assos | Aucune | Bureau | 2/3 | Fort |
| Quorum de vote | 50% | Bureau | 2/3 | Critique |
| Durée mandat | 12 mois | Bureau | 2/3 | Moyen |
| Frais d'inscription | 0 | Bureau | Majorité | Moyen |
| Barèmes solidarité | Standards | Bureau | Majorité | Fort |

### 6.3 Système de Versioning des Paramètres

```typescript
interface ParameterChange {
  id: string;
  parameterPath: string;         // Ex: "settings.membership.maxMembers"
  oldValue: any;
  newValue: any;
  changedAt: Date;
  changedBy: string;             // ID utilisateur
  changedByRole: RoleType;
  reason?: string;               // Justification
  approvalQuorum: number;        // % atteint pour la modification
  votes: VoteRecord[];           // Historique du vote si applicable
  effectiveAt: Date;             // Date d'effet (immédiat ou différé)
  rolledBackAt?: Date;           // Si annulation
  rolledBackBy?: string;
}
```

---

## 7. Gouvernance et Permissions

### 7.1 Hiérarchie des Droits

```
Niveau 0 : SUPER_ADMIN (plateforme)
    └── Accès technique d'urgence, support
    
Niveau 1 : CRÉATEUR
    └── Droits complets jusqu'à la désignation d'un bureau stable
    └── Peut transférer ses droits à un autre membre
    └── Peut modifier tous les paramètres sans quorum (phase initiale)
    
Niveau 2 : BUREAU
    ├── PRÉSIDENT
    │   └── Droits exécutifs complets, signature des documents
    ├── SECRÉTAIRE
    │   └── Gestion administrative, convocations, PV
    ├── TRÉSORIER
    │   └── Gestion financière, validation des paiements
    ├── VICE-PRÉSIDENT
    │   └── Délégation possible du Président
    ├── CENSEUR / AUDITEUR
    │   └── Lecture seule + rapports d'audit
    └── RÔLES PERSONNALISÉS
        └── Droits configurables par le bureau
        
Niveau 3 : MEMBRE
    └── Droits selon les permissions configurées par activité
    
Niveau 4 : INVITÉ / PENDANT
    └── Lecture limitée, pas de droit de vote
```

### 7.2 Matrice des Permissions par Rôle

| Action | Créateur | Président | Secrétaire | Trésorier | Membre |
|--------|----------|-----------|------------|-----------|--------|
| Modifier nom/description | ✓ | ✓ | ✗ | ✗ | ✗ |
| Activer/Désactiver activité | ✓ | ✓ | ✗ | ✗ | ✗ |
| Modifier paramètres financiers | ✓ | ✓ | ✗ | ✓* | ✗ |
| Modifier RI | ✓ | ✓ | ✓ | ✗ | ✗ |
| Élection bureau | ✓ | ✓ | ✓ | ✗ | ✓ (vote) |
| Révoquer membre bureau | ✓ | ✓ | ✗ | ✗ | ✗ |
| Valider adhésion | ✓ | ✓ | ✓ | ✗ | ✗ |
| Créer session | ✓ | ✓ | ✓ | ✗ | ✗ |
| Clôturer session | ✓ | ✓ | ✓ | ✓ | ✗ |
| Valider paiement | ✓ | ✓ | ✗ | ✓ | ✗ |
| Générer rapport | ✓ | ✓ | ✓ | ✓ | ✓ (si autorisé) |
| Créer relation inter-asso | ✓ | ✓ | ✗ | ✗ | ✗ |
| Dissoudre association | ✓ | ✓ | ✗ | ✗ | ✗ |
| *Avec quorum selon config | | | | | |

### 7.3 Mécanisme de Vote

```typescript
interface VotingConfig {
  // Types de décisions
  decisionTypes: {
    routine: { quorum: 0.33; method: "MAJORITY" };      // 33% + majorité simple
    standard: { quorum: 0.50; method: "MAJORITY" };      // 50% + majorité simple
    important: { quorum: 0.66; method: "MAJORITY" };     // 66% + majorité qualifiée
    critical: { quorum: 0.75; method: "UNANIMITY" };     // 75% + unanimité
    constitutional: { quorum: 1.00; method: "UNANIMITY" }; // 100% + unanimité
  };
  
  // Durée des scrutins
  votingPeriodHours: number;        // Défaut: 72h pour votes asynchrones
  allowProxy: boolean;              // Vote par procuration
  maxProxiesPerMember: number;      // Max 2 procuration
  allowRemoteVoting: boolean;       // Vote à distance
  secretBallot: boolean;            // Vote secret
}
```

### 7.4 Tableau des Actions sur les Membres

Le tableau ci-dessous définit l'ensemble des actions applicables sur les membres d'une association, avec leurs conditions d'exécution, leurs effets et les rôles habilités.

| Action | Qui peut l'executer | Conditions | Effets | Notification |
|--------|---------------------|------------|--------|--------------|
| **Inviter** | Fondateur, President, Secretaire | Aucune | Le membre recoit une invitation par email / SMS / notification push avec un lien d'adhesion securise (token signe, 72h de validite). | Email + SMS + Push au candidat |
| **Accepter une demande** | Fondateur, President, Secretaire | Demande d'adhesion en attente (status = PENDING) | Le membre passe en statut Actif (ACTIVE). Attribution du numero d'adherent. Generation de la carte membre numerique. Envoi du kit de bienvenue. | Email + SMS au nouveau membre. Notification au parrain. |
| **Refuser une demande** | Fondateur, President, Secretaire | Demande d'adhesion en attente. **Motif obligatoire** (min. 20 caracteres). | Notification de refus au demandeur avec le motif. Archivage de la demande (pas de suppression). Possibilite de re-demander apres 30 jours. | Email au demandeur avec motif |
| **Suspendre** | Fondateur, President | Apres 3 manquements consecutifs (configurable : retard de cotisation, absence non justifiee, violation du RI). | Le membre ne peut plus participer aux sessions ni voter. Gel de ses fonds (ni retrait ni pret). Acces en lecture seule a l'historique. Droit de defense : le membre peut soumettre un recours ecrit dans les 7 jours. | Email + SMS au membre suspendu. Notification au bureau. |
| **Reactiver** | Fondateur, President | Apres regularisation (paiement des arrieres, excuses acceptees, engagement ecrit). | Retablissement complet des droits. Le membre retrouve son historique, ses fonds et sa position dans les rotations. Mise a jour du score de fiabilite. | Email + SMS au membre reactive. Notification a tous les membres. |
| **Exclure** | Fondateur, President (avec validation d'un 2eme membre du bureau obligatoire) | Motif grave et documente : fraude, vol, violence, divulgation de donnees confidentielles. Vote du bureau a 2/3 requis. | Liquidation des avoirs (remboursement selon barème). Perte de tous les droits. Acces historique conserve en lecture seule. Interdiction de re-adhesion pendant 24 mois (configurable). | Email + SMS au membre exclu. PV de sanction genere. Archivage. |
| **Blacklister** | Fondateur (avec Maker-Checker : validation par un 2eme Fondateur ou Admin Systeme) | Exclusion definitive + impossibilite de revenir. Motif exceptionnel : recidive apres exclusion, comportement criminel. | Empêche toute future adhesion dans TOUTE association de la plateforme. Flag global sur le compte utilisateur. Reversible uniquement par Admin Systeme apres revision. | Email au membre. Alerte Admin Plateforme. |
| **Promouvoir au bureau** | Fondateur, President | Membre actif (status = ACTIVE) depuis au moins 3 mois (configurable). Score de fiabilite >= 200/500. Aucune sanction en cours. | Attribution d'un role (Vice-President, Secretaire, Tresorier, etc.). Mise a jour des permissions CRUD associees. Acces aux tableaux de bord specifiques. | Email au membre promu. Notification a tous les membres. Mise a jour de l'annuaire. |
| **Retrograder** | Fondateur, President | Membre du bureau (status de role actif). Vote du bureau a majorite simple. Motif recommande. | Retour au statut Membre Simple (MEMBER). Perte des permissions specifiques au role. Conservation de l'historique du mandat. Pas de penalite financiere. | Email au membre retrograde. Notification au bureau. |
| **Changer de role** | Fondateur uniquement | Bureau uniquement (pas de changement de role pour les membres simples). Nouveau role vacant ou cree. | Modification des permissions associees. Transfert des responsabilites documentees. Mise a jour des signatures numeriques si applicable. | Email au membre concerne. Mise a jour de l'organigramme. |
| **Modifier les parametres membre** | Fondateur, President, Secretaire | Parametres : role, numero de telephone, email, region. **Impossible** : modification du nom sans preuve (CNI). | Mise a jour du profil. Verification de l'unicite (email / telephone). Notification au membre de tout changement. | Email au membre pour toute modification. |
| **Transferer la propriete** | Fondateur uniquement | Le Fondateur peut transferer ses droits speciaux a un autre membre actif. Vote unanime du bureau si Fondateur toujours present. | Le nouveau Fondateur herite de tous les droits d'urgence. L'ancien Fondateur devient membre simple ou conseiller d'honneur. Irreversible sans vote de l'AG. | Notification a tous les membres. Mise a jour des statuts juridiques. |

#### Delais et Recours

| Action | Delai de prise d'effet | Recours possible | Delai de recours |
|--------|------------------------|------------------|------------------|
| Accepter | Immédiat | Non | N/A |
| Refuser | Immédiat | Oui (re-demande) | 30 jours |
| Suspendre | Immédiat | Oui (recours ecrit) | 7 jours |
| Reactiver | Immédiat | Non | N/A |
| Exclure | 48h (periode de grace) | Oui (AG extraordinaire) | 14 jours |
| Blacklister | Immédiat | Oui (aupres Admin Systeme) | 90 jours |
| Promouvoir | Immédiat | Non | N/A |
| Retrograder | Immédiat | Oui (recours au President) | 7 jours |
| Changer de role | Immédiat | Non | N/A |

---

## 8. Workflows Détaillés

### 8.1 Workflow : Création d'une Association

```
[Utilisateur connecté]
    │
    ▼
┌─────────────────┐
│ 1. SÉLECTION    │ ──→ Mode : Template (A30/NDI MBE/AMSED/BLANK)
│    DU MODE      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. IDENTITÉ     │ ──→ Nom, description, type, région, logo
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. ACTIVITÉS    │ ──→ Sélection des modules à activer
│                 │ ──→ Configuration par activité
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. BUREAU       │ ──→ Désignation initiale (auto-créateur = Président)
│    INITIAL      │ ──→ Ou invitation manuelle des rôles
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. PARAMÈTRES   │ ──→ Cotisations, fréquences, quorum, barèmes
│    FINANCIERS   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. RÈGLEMENT    │ ──→ Génération automatique basée sur les paramètres
│    INTÉRIEUR    │ ──→ Édition manuelle possible
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 7. VALIDATION   │ ──→ Récapitulatif complet
│                 │ ──→ Acceptation des conditions
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 8. LANCEMENT    │ ──→ Statut : ACTIVE
│                 │ ──→ Invitations envoyées aux membres potentiels
└─────────────────┘
```

### 8.2 Workflow : Session de Réunion

```
[Date d'échéance - 48h]
    │
    ▼
┌─────────────────┐
│ 1. CONVOCATION  │ ──→ Notification automatique à tous les membres
│    AUTOMATIQUE  │ ──→ Ordre du jour généré (ou défini par le Secrétaire)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. OUVERTURE    │ ──→ Président ouvre la session dans l'app
│    PAR LE       │ ──→ Verrouillage date/heure
│    PRÉSIDENT    │ ──→ Début du pointage
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. POINTAGE     │ ──→ Membres présents marqués
│                 │ ──→ Absences enregistrées avec motif
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. COTISATIONS  │ ──→ Saisie des versements (cash/mobile/nature)
│                 │ ──→ Validation par le Trésorier
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. OPÉRATIONS   │ ──→ Distribution du pot (si tontine)
│    MÉTIERS      │ ──→ Prêts caisse
│                 │ ──→ Solidarité urgente
│                 │ ──→ Autres activités programmées
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. CLÔTURE      │ ──→ Validation du bureau
│                 │ ──→ Calcul du reliquat
│                 │ ──→ Génération du PV
│                 │ ──→ Application des sanctions (si retard/absence)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 7. ARCHIVAGE    │ ──→ Session verrouillée en lecture seule
│                 │ ──→ Documents stockés avec hash d'intégrité
└─────────────────┘
```

### 8.3 Workflow : Élection du Bureau

```
[Date d'échéance du mandat - 30j]
    │
    ▼
┌─────────────────┐
│ 1. CONVOCATION  │ ──→ AG extraordinaire pour élection
│    AG ÉLECTORALE│ ──→ Présentation des candidatures (auto-déclaration)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. CANDIDATURES │ ──→ Dépôt des candidatures (7 jours avant)
│                 │ ──→ Validation des éligibilités
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. CAMPAGNE     │ ──→ Présentation des programmes (optionnel)
│                 │ ──→ Débat (optionnel, selon config)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. VOTE         │ ──→ Scrutin (présentiel ou à distance)
│                 │ ──→ Calcul du quorum
│                 │ ──→ Décompte des voix
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. PROCLAMATION │ ──→ Résultats publiés
│                 │ ──→ Contestation possible (48h)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. INSTALLATION │ ──→ Passation des charges
│                 │ ──→ Mise à jour des rôles
│                 │ ──→ Notification aux membres
└─────────────────┘
```

### 8.4 Workflow : Modification du Règlement Intérieur

```
[Initiateur: Créateur ou Bureau]
    │
    ▼
┌─────────────────┐
│ 1. PROPOSITION  │ ──→ Identification de l'article à modifier
│                 │ ──→ Rédaction de l'amendement
│                 │ ──→ Justification
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. DIFFUSION    │ ──→ Publication aux membres (7 jours de réflexion)
│                 │ ──→ Commentaires possibles
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. VOTE         │ ──→ Quorum : selon config (défaut 66%)
│                 │ ──→ Durée : 72h (asynchrone) ou AG
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. APPLICATION  │ ──→ Si adopté : mise à jour effective
│                 │ ──→ Version incrémentée
│                 │ ──→ Document régénéré
│                 │ ──→ Notification aux membres
└─────────────────┘
```

### 8.5 Workflow : Relation Inter-Association (Mère/Fille)

```
[Association Mère — Bureau]
    │
    ▼
┌─────────────────┐
│ 1. DÉCISION     │ ──→ Vote du bureau de la mère
│    DE CRÉATION  │ ──→ Définition du type de fille (tontine, solidarité...)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. CONFIG       │ ──→ Héritage des paramètres (sélectionnable)
│    HÉRITAGE     │ ──→ Templates, règles, structure de frais
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. CRÉATION     │ ──→ Wizard pré-rempli avec les paramètres hérités
│    FILLE        │ ──→ Modification possible avant validation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. VALIDATION   │ ──→ Bureau de la mère valide
│    CROISÉE      │ ──→ Bureau de la fille accepte la relation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. OPÉRATION    │ ──→ Rapports consolidés disponibles
│                 │ ──→ Transferts de fonds possibles (selon config)
│                 │ ──→ Garanties croisées activables
└─────────────────┘
```

---

---

## 9. Gestion des Reunions

### 9.1 Types de Reunions

Le systeme Tchoua supporte nativement six types de reunions, chacun avec ses regles de quorum, de notification et de procedure. Tous les parametres sont configurables par l'association.

| Type de Reunion | Description | Participants | Periodicite | Quorum par Defaut | Duree Max |
|-----------------|-------------|--------------|-------------|-------------------|-----------|
| **Session Ordinaire** | Session reguliere de tontine : cotisation, designation du beneficiaire, distribution du pot. | Tous les membres | Selon frequence configuree (hebdo, mensuel, trimestriel) | 50% des membres | 3h |
| **Session Extraordinaire** | Session convoquee pour un motif urgent (deces, catastrophe, litige financier). | Tous les membres | Ponctuel | 66% des membres | 2h |
| **Reunion de Bureau** | Reunion restreinte du bureau pour decisions de gestion courante. | Membres du bureau | Configurable (ex: mensuelle) | 2/3 du bureau | 2h |
| **Assemblee Generale** | Reunion annuelle de bilan moral, financier et perspectives. Vote sur les amendements. | Tous les membres | Annuelle | 75% des membres | 4h |
| **Reunion de Commission** | Reunion thematique : solidarite, investissement, discipline, education. | Membres designes par le bureau | Configurable | Majorite simple | 2h |
| **Cercle de Parole** | Reunion informelle pour resoudre les conflits interpersonnels, echanger librement. | Membres concernes (sur invitation) | Ponctuel | Aucun (participation volontaire) | 1h30 |

#### Specificites par Type

**Session Ordinaire**
- Ouverture et cloture obligatoires dans l'application
- Pointage des presences avec distinction "present", "absent justifie", "absent non justifie"
- Saisie des cotisations en temps reel
- Designation du beneficiaire selon la methode configuree
- Generation automatique du PV de session

**Session Extraordinaire**
- Convocation avec un preavis minimum de 48h (configurable)
- Ordre du jour limite a un seul motif urgent
- Decision validee si quorum atteint, meme en dehors de la periodicite habituelle
- PV condense genere automatiquement

**Reunion de Bureau**
- Peut etre convoquee par le President ou a la demande de 2 membres du bureau
- Decisions enregistrees dans le journal du bureau (pas de PV public)
- Transparence configurable : decisions publiees ou confidentielles

**Assemblee Generale**
- Obligatoire une fois par cycle (annuel par defaut)
- Presentation du bilan moral (Secretaire) et financier (Tresorier)
- Vote sur les amendements au reglement interieur
- Election ou renouvellement du bureau si echeance
- PV archive definitivement

**Reunion de Commission**
- Creees dynamiquement selon les besoins (commission solidarite, commission discipline, etc.)
- Rapport de commission soumis au bureau pour decision
- Membres designes par le bureau pour une duree determinee

**Cercle de Parole**
- Facilitee par un mediateur designe (pas forcement membre du bureau)
- Charte de confidentialite stricte
- Pas de PV formel — compte-rendu anonymise si besoin
- Objectif : resolution amiable des conflits

### 9.2 Workflows des Reunions

#### Workflow : Convocation
```
[Initiateur : President, Secretaire ou 2 membres du bureau]
    |
    V
┌─────────────────────────┐
| 1. REDACTION            | —> Titre, type, date, heure, lieu
|    DE L'ORDRE           | —> Points a traiter
|    DU JOUR              | —> Documents joints
└───────────┬─────────────┘
            |
            V
┌─────────────────────────┐
| 2. VALIDATION           | —> Si initiateur = President : auto-valide
|    BUREAU               | —> Sinon : vote bureau (majorite simple)
└───────────┬─────────────┘
            |
            V
┌─────────────────────────┐
| 3. NOTIFICATION         | —> Email + SMS + Push selon preferences
|                         | —> Preavis : 48h (ordinaire), 24h (extraordinaire)
|                         | —> Confirmation de presence demandee
└───────────┬─────────────┘
            |
            V
┌─────────────────────────┐
| 4. RAPPEL               | —> 24h avant et 2h avant la reunion
|                         | —> Rappel personnalise aux absents
└─────────────────────────┘
```

#### Workflow : Deroulement d'une Session Ordinaire
```
[President ouvre la session dans l'app]
    |
    V
┌─────────────────────────┐
| 1. OUVERTURE            | —> Date/heure verrouillees
|                         | —> Quorum calcule automatiquement
└───────────┬─────────────┘
            |
            V
┌─────────────────────────┐
| 2. POINTAGE             | —> Membres presents marques
|                         | —> Absents enregistres avec motif
|                         | —> Verification quorum
└───────────┬─────────────┘
            |
            V
┌─────────────────────────┐
| 3. DEROULEMENT          | —> Cotisations
|                         | —> Designation beneficiaire
|                         | —> Prets caisse
|                         | —> Solidarite urgente
|                         | —> Autres points
└───────────┬─────────────┘
            |
            V
┌─────────────────────────┐
| 4. CLOTURE              | —> Validation par le bureau
|                         | —> Calcul du reliquat
|                         | —> Generation du PV
|                         | —> Signatures numeriques
└───────────┬─────────────┘
            |
            V
┌─────────────────────────┐
| 5. DIFFUSION            | —> PV envoye a tous les membres
|                         | —> Rapport de session archive
└─────────────────────────┘
```

### 9.3 Regles Metier — Reunions

| Regle | Description | Quorum |
|-------|-------------|--------|
| **R-046** | Une session ordinaire ne peut etre ouverte que par le President ou le Secretaire | N/A |
| **R-047** | Le quorum d'une session extraordinaire est de 66% (configurable) | 66% |
| **R-048** | Une AG sans quorum peut etre reportee une fois. Deux reports = decision du bureau | 75% |
| **R-049** | Le PV d'une session est verrouille 24h apres la cloture (modifiable uniquement par le Secretaire avec accord du President) | Unanimite bureau |
| **R-050** | Un membre absent a 3 sessions consecutives sans justification est automatiquement signale au bureau | N/A |
| **R-051** | Les reunions de bureau peuvent se tenir a distance (visioconference) si tous les membres y consentent | 100% du bureau |
| **R-052** | Un Cercle de Parole ne peut pas produire de decision contraignante — seulement des recommandations | N/A |

---

## 10. Règles Métier

### 10.1 Règles de Création

| Règle | Description | Sanction |
|-------|-------------|----------|
| **R-001** | Le nom doit être unique au sein de la plateforme (insensible à la casse) | Blocage création |
| **R-002** | Le créateur doit avoir un compte vérifié (email + téléphone) | Blocage création |
| **R-003** | Au moins 3 rôles doivent être désignés pour l'activation (Président, Secrétaire, Trésorier) | Statut bloqué à PENDING |
| **R-004** | Une association ne peut avoir plus d'un parent actif | Blocage relation |
| **R-005** | Une association mère peut avoir maximum 20 filles actives (configurable) | Alerte + blocage |

### 10.2 Règles de Modification

| Règle | Description | Quorum |
|-------|-------------|--------|
| **R-006** | Tout paramètre peut être modifié à tout moment | Selon matrice §6.2 |
| **R-007** | La modification du type d'association nécessite un vote à 2/3 | 66% |
| **R-008** | La dissolution nécessite un vote à 3/4 des membres actifs | 75% |
| **R-009** | La suspension peut être décidée par le Président seul en cas d'urgence (48h de validité, confirmation requise) | Unanimité bureau |
| **R-010** | Le créateur conserve des droits d'urgence pendant 90 jours après l'activation, puis transfert automatique au Président | N/A |

### 10.3 Règles de Session

| Règle | Description |
|-------|-------------|
| **R-011** | Une session ne peut être ouverte que par un membre du bureau |
| **R-012** | La clôture nécessite la validation d'au moins 2 membres du bureau |
| **R-013** | Une session clôturée est immuable (lecture seule) |
| **R-014** | Le reliquat d'une session est reporté sur la session suivante |
| **R-015** | Les sanctions pour non-cotisation sont appliquées automatiquement à la clôture |

### 10.4 Règles de Membres

| Règle | Description |
|-------|-------------|
| **R-016** | Un membre ne peut être dans plus de 10 associations actives simultanément (configurable) |
| **R-017** | Le parrainage expire après 7 jours sans réponse du parrain |
| **R-018** | Un membre suspendu dans une association ne peut pas en créer une nouvelle |
| **R-019** | Le score de fiabilité est recalculé après chaque session |
| **R-020** | Un membre peut quitter volontairement une association avec un préavis de 30 jours (sauf s'il a des dettes) |

### 10.5 Règles Financières

| Règle | Description |
|-------|-------------|
| **R-021** | Le total des prêts actifs ne peut excéder 80% du fonds total (configurable) |
| **R-022** | Les taux d'intérêt sont plafonnés à 10%/mois par défaut (configurable selon législation locale) |
| **R-023** | Toute transaction > 500 000 FCFA nécessite une validation double (2 membres du bureau) |
| **R-024** | Le reliquat en caisse doit rester positif (sauf configuration express de déficit autorisé) |
| **R-025** | Les rapports financiers sont générés obligatoirement à chaque clôture de cycle |

---

## 11. Gestion des Modèles d'Association (Templates)

### 11.1 Vue d'Ensemble

Tchoua permet la **création, la publication et la réutilisation de modèles d'association** par n'importe quel utilisateur membre. Un modèle (template) est un snapshot exportable de la configuration d'une association, réutilisable pour créer de nouvelles associations pré-configurées.

**Philosophie** : *Toute association bien configurée peut devenir un modèle. Le créateur et les membres du bureau sont les propriétaires intellectuels de leur configuration et peuvent la partager avec la communauté ou la garder privée.*

### 11.2 Types de Modèles

| Type | Créateur | Visibilité | Réutilisable | Récompense |
|------|----------|------------|--------------|------------|
| **SYSTÈME** | Équipe Tchoua | Publique | Tous les utilisateurs | N/A |
| **COMMUNAUTÉ** | Membre / Bureau | Publique | Tous les utilisateurs | Points de réputation |
| **PRIVÉ** | Membre / Bureau | Restreinte | Créateur + invitations | N/A |
| **FÉDÉRATION** | Association Mère | Membres du réseau | Filles + Sœurs | N/A |

### 11.3 Conversion d'Association en Modèle

> **Principe fondamental** : N'importe quel membre d'une association (créateur, bureau ou membre actif) peut initier la conversion de **son association** en modèle. Cette action ne modifie pas l'association source — elle en crée une copie exportable.

#### 10.3.1 Droit de Conversion

| Rôle | Peut convertir en modèle ? | Quorum requis |
|------|---------------------------|---------------|
| **Créateur** | ✓ Oui, sans restriction | Aucun (phase initiale) ou selon config |
| **Président** | ✓ Oui | Aucun si créateur absent > 90j, sinon vote bureau |
| **Membre actif** | ✓ Oui, avec validation | Vote membres actifs (50%+1) si créateur et bureau absents > 180j |
| **Membre simple** | ✗ Non | — |
| **Utilisateur externe** | ✗ Non | — |

#### 10.3.2 Processus de Conversion

```
[Initiateur : Membre de l'association]
    │
    ▼
┌─────────────────────────┐
│ 1. DEMANDE DE           │ ──→ Sélection de l'association source
│    CONVERSION           │ ──→ Choix du type de modèle (COMMUNAUTÉ / PRIVÉ)
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 2. SÉLECTION DES        │ ──→ Paramètres à exporter (cocher/décocher)
│    PARAMÈTRES           │     • Identité (nom, description, type)
│                         │     • Activités et leur configuration
│                         │     • Barèmes financiers
│                         │     • Règlement intérieur
│                         │     • Structure du bureau (rôles, pas les noms)
│                         │     • Paramètres de sessions
│                         │     • Barèmes solidarité
│                         │     • NOT excluded : membres, données financières, historique
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 3. ANONYMISATION        │ ──→ Suppression automatique des données personnelles
│                         │     • Noms des membres → remplacés par "[Membre X]"
│                         │     • Emails / Téléphones → supprimés
│                         │     • Données financières historiques → exclues
│                         │     • Identifiant de l'association source → hashé
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 4. PERSONNALISATION     │ ──→ Nom du modèle (différent de l'association)
│    DU MODÈLE            │ ──→ Description marketing
│                         │ ──→ Tags (région, type, taille, secteur)
│                         │ ──→ Image de couverture
│                         │ ──→ Documentation complémentaire
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 5. VALIDATION           │ ──→ Si initiateur = Créateur ou Président : auto-validé
│                         │ ──→ Si initiateur = Membre : vote des membres actifs (72h)
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 6. PUBLICATION          │ ──→ Modèle publié dans la bibliothèque
│                         │ ──→ Association source marquée "a_un_modèle"
│                         │ ──→ Compteur d'utilisations initialisé à 0
│                         │ ──→ Attribution de points de réputation (si COMMUNAUTÉ)
└─────────────────────────┘
```

### 11.4 Modèle de Données — `AssociationTemplate`

```typescript
interface AssociationTemplate {
  id: string;                      // CUID
  slug: string;                    // URL unique
  
  // Provenance
  sourceAssociationId: string;     // Association d'origine
  sourceAssociationName: string;   // Nom anonymisé si demandé
  convertedBy: string;             // ID utilisateur initiateur
  convertedByRole: RoleType;       // Rôle au moment de la conversion
  convertedAt: Date;
  
  // Typologie
  type: "SYSTEM" | "COMMUNITY" | "PRIVATE" | "FEDERATION";
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED" | "REJECTED";
  
  // Métadonnées
  name: string;
  description: string;
  longDescription?: string;
  coverImage?: string;
  tags: string[];                  // Ex: ["village", "femmes", "agriculture", "ROSCA"]
  category: TemplateCategory;      // TONTINE | COOPERATIVE | SOLIDARITY | INVESTMENT | AGRICULTURAL | MUTUAL | MIXED
  
  // Configuration exportée
  config: {
    associationType: AssociationType;
    activities: ActivityConfig[];  // Configuration complète des activités
    settings: Partial<AssociationSettings>;  // Paramètres généraux
    rules: Partial<RulesConfig>;   // Règlement intérieur template
    finance: Partial<FinanceConfig>; // Paramètres financiers
    bureauStructure: {
      roles: CustomRole[];         // Structure des rôles
      minSize: number;
      maxSize: number;
    };
    feeStructure: {
      registrationFee: number;
      annualFee: number;
      contributionAmount: number;
      contributionFrequency: string;
    };
    solidarityScales?: SocialAidScale[];
    sessionSchedule?: SessionScheduleConfig;
  };
  
  // Statistiques
  stats: {
    usageCount: number;            // Nombre d'associations créées depuis ce modèle
    memberCount: number;           // Total de membres dans les assos créées
    averageRating: number;         // Note moyenne (1-5)
    reviewCount: number;
    popularityScore: number;       // Algorithme interne
  };
  
  // Gouvernance du modèle
  governance: {
    ownerId: string;               // Propriétaire (initiateur ou désigné)
    coOwners: string[];            // Co-propriétaires (bureau de l'asso source)
    allowForking: boolean;         // Autoriser les dérivés
    license: "MIT" | "CC_BY" | "CC_BY_SA" | "PRIVATE" | "ALL_RIGHTS_RESERVED";
    reviewRequired: boolean;       // Revue par modérateur (COMMUNITY)
  };
  
  // Révisions
  versions: TemplateVersion[];
  currentVersion: number;
  
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateVersion {
  version: number;
  changelog: string;
  config: any;                     // Snapshot complet
  publishedAt: Date;
  publishedBy: string;
  isLatest: boolean;
}

interface TemplateReview {
  id: string;
  templateId: string;
  userId: string;
  rating: number;                  // 1-5 étoiles
  comment: string;
  associationCreatedId?: string;   // Lien vers l'asso créée avec ce modèle
  helpfulVotes: number;
  createdAt: Date;
}
```

### 11.5 Bibliothèque de Modèles

#### 10.5.1 Structure de la Bibliothèque

```
Bibliothèque Tchoua
├── Modèles Système (curatés par Tchoua)
│   ├── A30 — Amicale du Trente
│   ├── NDI MBE — Fonds d'Investissement Communautaire
│   ├── AMSED — Amicale de Section
│   └── COOP-VILLAGE — Coopérative Agricole Standard
│
├── Modèles Communauté (créés par les membres)
│   ├── Top Rated (meilleure note)
│   ├── Plus Utilisés
│   ├── Récents
│   └── Par Tag / Région / Type
│
├── Mes Modèles
│   ├── Créés par moi
│   ├── Créés depuis mes associations
│   └── Modèles privés partagés avec moi
│
└── Modèles Fédération
    └── Templates hérités de mon association mère
```

#### 10.5.2 Algorithme de Classement

```typescript
function calculatePopularityScore(template: AssociationTemplate): number {
  const usageWeight = 0.40;
  const ratingWeight = 0.30;
  const recencyWeight = 0.15;
  const completenessWeight = 0.15;
  
  const usageScore = Math.log(template.stats.usageCount + 1) / Math.log(1000);
  const ratingScore = template.stats.averageRating / 5;
  const daysSinceCreation = (Date.now() - template.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 1 - (daysSinceCreation / 365));
  const completenessScore = calculateConfigCompleteness(template.config);
  
  return (
    usageScore * usageWeight +
    ratingScore * ratingWeight +
    recencyScore * recencyWeight +
    completenessScore * completenessWeight
  );
}
```

### 11.6 Gouvernance des Modèles

#### 10.6.1 Droits sur un Modèle

| Action | Créateur | Co-propriétaire | Utilisateur | Admin Plateforme |
|--------|----------|-----------------|-------------|------------------|
| Voir | ✓ | ✓ | ✓ (si publié) | ✓ |
| Utiliser | ✓ | ✓ | ✓ (si publié) | ✓ |
| Modifier | ✓ | ✗ | ✗ | ✓ (modération) |
| Archiver | ✓ | ✓ | ✗ | ✓ |
| Supprimer | ✓ | ✗ | ✗ | ✓ |
| Fork (dériver) | ✓ | ✓ | ✓ (si allowForking) | ✓ |
| Voir stats détaillées | ✓ | ✓ | ✗ | ✓ |
| Gérer reviews | ✓ | ✗ | ✗ (sauf la sienne) | ✓ |

#### 10.6.2 Fork d'un Modèle

Tout utilisateur peut créer un **fork** (dérivé) d'un modèle public, sous réserve que `allowForking = true`.

```
[Utilisateur]
    │
    ▼
┌─────────────────────────┐
│ 1. SÉLECTION            │ ──→ Choix du modèle parent
│    DU MODÈLE PARENT     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 2. FORK                 │ ──→ Création d'une copie indépendante
│                         │ ──→ Référence au parent conservée
│                         │ ──→ Nouveau nom obligatoire
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 3. MODIFICATION         │ ──→ Personnalisation libre
│                         │ ──→ Possibilité de republier en COMMUNITY
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 4. CRÉATION ASSO        │ ──→ Utilisation du fork pour créer une asso
└─────────────────────────┘
```

### 11.7 Règles Métier — Modèles

| Règle | Description | Impact |
|-------|-------------|--------|
| **R-026** | Un modèle COMMUNITY doit avoir été utilisé au moins 3 fois avant d'apparaître dans "Top Rated" | Classement |
| **R-027** | Le créateur d'un modèle COMMUNITY gagne 10 points de réputation par utilisation | Gamification |
| **R-028** | Un modèle ne peut pas être supprimé s'il a été utilisé plus de 10 fois — archivage obligatoire | Protection |
| **R-029** | Les données personnelles sont automatiquement anonymisées lors de la conversion | Confidentialité |
| **R-030** | Un modèle PRIVÉ peut être converti en COMMUNITY à tout moment par son propriétaire | Flexibilité |
| **R-031** | Un modèle COMMUNITY peut être rétrogradé en PRIVÉ uniquement si usageCount < 5 | Protection communauté |
| **R-032** | Les modèles SYSTEM ne peuvent pas être forkés — seulement utilisés directement | Intégrité |
| **R-033** | La conversion d'une association en modèle nécessite que l'association soit ACTIVE depuis au moins 90 jours | Maturité |
| **R-034** | Un modèle doit contenir au minimum : type, une activité, et une structure de frais | Qualité |
| **R-035** | Les modifications d'un modèle publié créent une nouvelle version sans impacter les associations déjà créées | Stabilité |

### 11.8 Workflows Complémentaires

#### 10.8.1 Création d'Association depuis un Modèle

```
[Utilisateur]
    │
    ▼
┌─────────────────────────┐
│ 1. CHOIX DU MODÈLE      │ ──→ Navigation bibliothèque
│                         │ ──→ Filtres (type, région, taille, note)
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 2. PRÉVISUALISATION     │ ──→ Vue détaillée du modèle
│                         │ ──→ Aperçu des paramètres
│                         │ ──→ Reviews de la communauté
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 3. PRÉ-REMPLISSAGE      │ ──→ Wizard de création pré-rempli
│                         │ ──→ Tous les paramètres modifiables
│                         │ ──→ Aucun verrou
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 4. PERSONNALISATION     │ ──→ Modification libre de tous les paramètres
│                         │ ──→ Ajout/retrait d'activités
│                         │ ──→ Ajustement des montants
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 5. VALIDATION & LANCE   │ ──→ Même workflow que création manuelle
│                         │ ──→ Crédit au modèle parent (usageCount++)
└─────────────────────────┘
```

#### 10.8.2 Mise à Jour d'un Modèle

```
[Propriétaire du modèle]
    │
    ▼
┌─────────────────────────┐
│ 1. MODIFICATION         │ ──→ Édition des paramètres du modèle
│                         │ ──→ Changelog obligatoire
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 2. NOUVELLE VERSION     │ ──→ Incrémentation du numéro de version
│                         │ ──→ Snapshot des paramètres
│                         │ ──→ Ancienne version conservée
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 3. IMPACT               │ ──→ Associations existantes : AUCUN IMPACT
│                         │ ──→ Nouvelles créations : utilisent la dernière version
│                         │ ──→ Option "Mettre à jour mon asso" proposée aux utilisateurs
└─────────────────────────┘
```

### 11.9 API — Modèles

```
# Bibliothèque publique
GET    /api/templates                       → Liste des modèles publiés
GET    /api/templates/:id                   → Détails d'un modèle
GET    /api/templates/:id/preview           → Aperçu de la configuration
GET    /api/templates/search?q=...          → Recherche
GET    /api/templates/featured              → Modèles mis en avant
GET    /api/templates/by-tag/:tag           → Filtrer par tag
GET    /api/templates/top-rated             → Top rated
GET    /api/templates/most-used             → Plus utilisés

# Conversion (depuis une association)
POST   /api/associations/:id/convert-to-template
                                   → Convertir une association en modèle
GET    /api/associations/:id/template-status
                                   → Statut de la conversion

# Gestion des modèles (propriétaire)
POST   /api/templates                     → Créer un modèle (depuis zéro)
PATCH  /api/templates/:id                 → Modifier un modèle (nouvelle version)
DELETE /api/templates/:id                 → Archiver/Supprimer
POST   /api/templates/:id/fork            → Créer un fork
POST   /api/templates/:id/publish         → Publier (DRAFT → PUBLISHED)
POST   /api/templates/:id/unpublish       → Dé-publier

# Reviews
POST   /api/templates/:id/reviews         → Ajouter un avis
GET    /api/templates/:id/reviews         → Lister les avis
PATCH  /api/templates/:id/reviews/:rid    → Modifier son avis

# Utilisation
POST   /api/templates/:id/use             → Créer une association depuis ce modèle
GET    /api/templates/:id/usage-stats     → Statistiques d'utilisation
```

### 11.10 Webhooks — Modèles

| Événement | Payload | Destinataire |
|-----------|---------|--------------|
| `template.created` | Template + Association source | Propriétaire |
| `template.published` | Template | Abonnés à la catégorie |
| `template.forked` | Template + Fork | Propriétaire du parent |
| `template.used` | Template + Nouvelle association | Propriétaire du template |
| `template.reviewed` | Template + Review | Propriétaire du template |
| `template.versioned` | Template + Version | Utilisateurs du template |

---

## 12. Gestion des Rapports

### 12.1 Types de Rapports Disponibles

Tchoua génère automatiquement un écosystème complet de rapports couvrant l'ensemble des activités de l'association. Chaque rapport est paramétrable en termes de fréquence, de destinataires, de format et de niveau de détail.

| Rapport | Contenu | Fréquence | Destinataires | Format |
|---------|---------|-----------|---------------|--------|
| **Rapport de Session** | Résumé des cotisations, bénéficiaire, présences, incidents, reliquat, prêts caisse accordés. | Après chaque session | Tous les membres | PDF, en ligne |
| **Rapport Financier Mensuel** | Entrées, sorties, soldes par activité, graphiques de trésorerie, comparatif mois précédent. | Mensuel | Bureau, membres (si configuré) | PDF, Excel |
| **Rapport Financier Annuel** | Bilan complet, évolution sur 12 mois, comparatif année précédente, projection. | Annuel | Tous les membres | PDF, Excel |
| **Rapport de Solidarité** | Aides accordées par catégorie, bénéficiaires (anonymisés si mode discret), soldes des caisses solidarité. | Trimestriel | Bureau, membres concernés | PDF |
| **Rapport de Prêts** | Prêts en cours, remboursements reçus, taux de recouvrement, retardataires, intérêts perçus. | Mensuel | Bureau, Trésorier | PDF, Excel |
| **Rapport d'Activité Membre** | Synthèse individuelle : cotisations versées, levées reçues, aides reçues, épargne accumulée, score de fiabilité. | À la demande | Le membre lui-même | PDF |
| **Rapport de Présence** | Taux de participation par membre, absences justifiées/non justifiées, retards, sanctionnés. | Mensuel | Bureau | Excel |
| **Rapport d'Audit** | Journal complet des modifications de paramètres, validations, transactions suspectes, connexions. | À la demande | Fondateur, Admin Système | PDF, Excel |
| **Procès-Verbal de Réunion** | Compte-rendu officiel des décisions, votes, ordre du jour, présences, signatures numériques. | Après chaque réunion | Tous les membres | PDF |
| **Attestation de Cotisation** | Document officiel prouvant la régularité des cotisations d'un membre sur une période donnée. | À la demande | Le membre | PDF signé numériquement |
| **Rapport Consolidé Multi-Associations** | Agrégation des données d'une association mère et de ses filles (si configuré). | Mensuel / Annuel | Bureau de la mère | PDF, Excel |
| **Rapport de Conformité OHADA** | États financiers standards (bilan, compte de résultat, flux de trésorerie) conformes SYSCOHADA. | Annuel | Bureau, Commissaire aux Comptes | PDF, Excel |

#### Paramétrage par Rapport

```typescript
interface ReportConfig {
  id: string;
  type: ReportType;
  
  // Fréquence
  schedule: {
    enabled: boolean;
    frequency: "SESSION" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL" | "ON_DEMAND";
    dayOfMonth?: number;           // Jour de génération (ex: 5 = le 5 du mois)
    timeOfDay: string;             // "08:00"
    timezone: string;              // "Africa/Douala"
    autoGenerate: boolean;         // Génération automatique
  };
  
  // Destinataires
  recipients: {
    roles: RoleType[];             // Rôles recevant le rapport
    specificMembers?: string[];    // IDs membres spécifiques
    externalEmails?: string[];     // Emails externes (comptable, avocat)
    allowSelfService: boolean;     // Le membre peut se le générer lui-même
  };
  
  // Format
  format: {
    primary: "PDF" | "EXCEL" | "CSV";
    secondary?: "PDF" | "EXCEL" | "CSV";  // Format alternatif
    language: Lang;                // Langue du rapport
    includeCharts: boolean;
    includeSignatures: boolean;
    watermark?: string;            // Filigrane optionnel
  };
  
  // Contenu
  content: {
    detailLevel: "SUMMARY" | "STANDARD" | "DETAILED" | "AUDIT";
    dateRange: "CURRENT_PERIOD" | "LAST_30_DAYS" | "CUSTOM";
    customStartDate?: Date;
    customEndDate?: Date;
    includeInactiveMembers: boolean;
    includeForecast: boolean;      // Projections
  };
  
  // Distribution
  distribution: {
    method: "EMAIL" | "IN_APP" | "BOTH";
    emailSubject?: string;
    emailBody?: string;
    requireAcknowledgment: boolean; // Accusé de réception obligatoire
    retentionDays: number;          // Durée de conservation
  };
}
```

### 12.2 Génération de Rapport

#### 11.2.1 Architecture du Moteur de Rapports

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MOTEUR DE RAPPORTS TCHOUA                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│  │   DEMANDE    │───→│   ORCHESTR.  │───→│   GATHERER   │         │
│  │  (API/Cron)  │    │              │    │  (Données)   │         │
│  └──────────────┘    └──────┬───────┘    └──────┬───────┘         │
│                             │                     │                │
│                             ▼                     ▼                │
│                      ┌──────────────┐    ┌──────────────┐         │
│                      │   TEMPLATE   │    │   AGGREGATOR │         │
│                      │   ENGINE     │←───│              │         │
│                      │  (Handlebars)│    └──────────────┘         │
│                      └──────┬───────┘                             │
│                             │                                      │
│                             ▼                                      │
│                      ┌──────────────┐    ┌──────────────┐         │
│                      │   RENDERER   │───→│   EXPORTER   │         │
│                      │  (HTML/CSS)  │    │ (PDF/Excel)  │         │
│                      └──────────────┘    └──────┬───────┘         │
│                                                  │                 │
│                                                  ▼                 │
│                                           ┌──────────────┐        │
│                                           │  DISTRIBUTOR │        │
│                                           │ (Email/App)  │        │
│                                           └──────────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 11.2.2 Pipeline de Génération

**Étape 1 — Orchestration**
- Vérification des droits du demandeur
- Sélection du template de rapport adapté au type et à la langue
- Calcul de la période couverte
- Vérification du cache (si rapport déjà généré pour la période)

**Étape 2 — Collecte des Données**
- Requêtes optimisées sur les tables pertinentes
- Agrégation des données par période, par membre, par activité
- Calcul des indicateurs dérivés (taux de recouvrement, moyenne de participation, etc.)
- Récupération des signatures numériques si requis

**Étape 3 — Rendu**
- Injection des données dans le template HTML/CSS
- Génération des graphiques (SVG inline pour PDF, images pour Excel)
- Application du style conforme à la charte de l'association
- Insertion du filigrane si configuré

**Étape 4 — Export**
- **PDF** : Conversion via headless Chromium (Puppeteer/Playwright)
- **Excel** : Génération via bibliothèque xlsx avec feuilles multiples
- **CSV** : Export plat avec encodage UTF-8 BOM

**Étape 5 — Distribution**
- Stockage dans le stockage objet (S3/MinIO) avec URL signée temporaire
- Envoi par email avec pièce jointe
- Notification in-app avec lien de téléchargement
- Demande d'accusé de réception si configuré

#### 11.2.3 Templates de Rapports

```typescript
interface ReportTemplate {
  id: string;
  type: ReportType;
  language: Lang;
  
  // Structure
  sections: ReportSection[];
  
  // Style
  style: {
    primaryColor: string;          // Couleur principale (associée à l'asso)
    fontFamily: string;
    logoUrl?: string;
    headerImage?: string;
    footerText: string;
    pageSize: "A4" | "LETTER";
    orientation: "PORTRAIT" | "LANDSCAPE";
  };
  
  // Variables injectables
  variables: {
    associationName: string;
    associationLogo: string;
    reportPeriod: string;
    generatedAt: string;
    generatedBy: string;
    // ... données spécifiques au type
  };
}

interface ReportSection {
  id: string;
  type: "HEADER" | "SUMMARY" | "TABLE" | "CHART" | "TEXT" | "SIGNATURE";
  title?: string;
  dataSource: string;              // Chemin JSON vers les données
  config: {
    columns?: TableColumn[];
    chartType?: "BAR" | "LINE" | "PIE" | "DOUGHNUT";
    textTemplate?: string;         // Handlebars template
    showTotals?: boolean;
    showPercentages?: boolean;
  };
}
```

#### 11.2.4 Génération Asynchrone

Les rapports lourds (annuels, consolidés, audits complets) sont générés de manière asynchrone :

```typescript
interface AsyncReportJob {
  id: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  
  request: ReportConfig;
  requestedBy: string;
  requestedAt: Date;
  
  progress: {
    stage: "COLLECTING" | "RENDERING" | "EXPORTING" | "DISTRIBUTING";
    percent: number;               // 0-100
    estimatedSecondsRemaining: number;
  };
  
  result?: {
    downloadUrl: string;
    expiresAt: Date;
    fileSize: number;
    checksum: string;              // SHA-256 pour intégrité
  };
  
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  
  // Notifications
  notifyOnComplete: boolean;
  notifyOnFailure: boolean;
}
```

#### 11.2.5 Planification Automatique

```typescript
interface ReportSchedule {
  id: string;
  reportType: ReportType;
  associationId: string;
  
  cronExpression: string;          // Ex: "0 8 5 * *" = 5 du mois à 8h
  timezone: string;
  
  // Exceptions
  skipIfNoActivity: boolean;       // Ne pas générer si aucune activité
  skipIfQuorumNotMet: boolean;     // Ne pas générer si quorum insuffisant
  
  // Rétroactivité
  backfill: {
    enabled: boolean;
    startDate?: Date;              // Générer les rapports manqués depuis...
    maxBackfillMonths: number;     // Limite de rétroactivité
  };
  
  // Alertes
  alerts: {
    onFailure: boolean;
    onDelay: boolean;              // Si génération > 1h après l'échéance
    recipientRoles: RoleType[];
  };
}
```

#### 11.2.6 Archivage et Conservation

| Type de Rapport | Conservation Minimale | Conservation Maximale | Action après Max |
|-----------------|----------------------|----------------------|------------------|
| Rapport de Session | 12 mois | 5 ans | Compression + archive froide |
| Rapport Financier Mensuel | 24 mois | 10 ans | Archive froide |
| Rapport Financier Annuel | Illimitée | Illimitée | Conservation permanente |
| Rapport d'Audit | 36 mois | 10 ans | Archive froide |
| Procès-Verbal | Illimitée | Illimitée | Conservation permanente |
| Attestation | 24 mois | 10 ans | Archive froide |

**Politique d'archivage** :
- Les rapports > 12 mois sont compressés (ZIP) et déplacés vers un stockage à froid
- Les rapports > 5 ans nécessitent une action manuelle pour être restaurés (48h de délai)
- Les rapports financiers annuels et les PV sont conservés indéfiniment pour conformité légale

#### 11.2.7 Rapports Programmatiques (API)

```
GET    /api/associations/:id/reports                 → Liste des rapports générés
POST   /api/associations/:id/reports                 → Demander un rapport
GET    /api/associations/:id/reports/:rid            → Télécharger un rapport
DELETE /api/associations/:id/reports/:rid            → Supprimer (soft delete)

GET    /api/associations/:id/reports/scheduled       → Planifications actives
POST   /api/associations/:id/reports/scheduled       → Créer une planification
PATCH  /api/associations/:id/reports/scheduled/:sid  → Modifier
DELETE /api/associations/:id/reports/scheduled/:sid  → Désactiver

GET    /api/associations/:id/reports/templates        → Templates disponibles
GET    /api/associations/:id/reports/stats            → Statistiques d'utilisation

POST   /api/associations/:id/reports/consolidated    → Rapport consolidé (mère + filles)
POST   /api/associations/:id/reports/audit           → Demander un rapport d'audit
POST   /api/associations/:id/reports/member/:mid     → Rapport individuel membre
```

#### 11.2.8 Règles Métier — Rapports

| Règle | Description | Impact |
|-------|-------------|--------|
| **R-036** | Un membre ne peut générer que son propre rapport d'activité (hors bureau) | Confidentialité |
| **R-037** | Les rapports financiers détaillés nécessitent au minimum le rôle de Trésorier | Sécurité |
| **R-038** | Le rapport d'audit est réservé au Fondateur et aux administrateurs système | Confidentialité |
| **R-039** | Tout rapport généré est immuable après distribution (hash SHA-256) | Intégrité |
| **R-040** | Les rapports programmés sont générés même si le bureau n'a pas ouvert de session | Fiabilité |
| **R-041** | Un rapport consolidé nécessite l'accord explicite de chaque association fille | Consentement |
| **R-042** | Les attestations de cotisation incluent un QR code de vérification anti-contrefaçon | Authenticité |
| **R-043** | La génération de rapport est bloquée si l'association est en statut SUSPENDED | Cohérence |
| **R-044** | Les rapports de plus de 5 ans sont archivés et nécessitent 48h pour restauration | Performance |
| **R-045** | Les PDF générés sont signés numériquement par la clé de l'association | Authenticité |

---

## 13. API et Interfaces

### 13.1 Endpoints Principaux

```
POST   /api/associations                    → Créer une association
GET    /api/associations/:id                → Détails d'une association
PATCH  /api/associations/:id                → Modifier une association
DELETE /api/associations/:id                → Dissoudre (soft delete)
POST   /api/associations/:id/activate       → Activer (DRAFT → ACTIVE)
POST   /api/associations/:id/suspend        → Suspendre
POST   /api/associations/:id/reactivate     → Réactiver
POST   /api/associations/:id/clone          → Cloner avec paramètres

POST   /api/associations/:id/relations      → Créer une relation
GET    /api/associations/:id/relations      → Lister les relations
DELETE /api/associations/:id/relations/:rid → Supprimer une relation

GET    /api/associations/:id/settings       → Récupérer les paramètres
PATCH  /api/associations/:id/settings       → Modifier les paramètres
POST   /api/associations/:id/settings/vote  → Voter sur une modification

GET    /api/associations/:id/bureau         → Bureau actuel
POST   /api/associations/:id/bureau/elect   → Lancer une élection
POST   /api/associations/:id/bureau/delegate → Déléguer un rôle

GET    /api/associations/:id/sessions       → Liste des sessions
POST   /api/associations/:id/sessions       → Créer une session
PATCH  /api/associations/:id/sessions/:sid  → Modifier une session
POST   /api/associations/:id/sessions/:sid/close → Clôturer

GET    /api/associations/:id/reports        → Liste des rapports
POST   /api/associations/:id/reports        → Générer un rapport
GET    /api/associations/:id/reports/consolidated → Rapport consolidé (mère + filles)

GET    /api/associations/:id/audit          → Journal d'audit complet
GET    /api/associations/:id/history        → Historique des modifications
```

### 13.2 Webhooks

| Événement | Payload | Destinataire |
|-----------|---------|--------------|
| `association.created` | Association + Créateur | Admin plateforme |
| `association.activated` | Association | Membres invités |
| `bureau.elected` | Nouveau bureau | Tous les membres |
| `session.opened` | Session + Date | Membres de l'association |
| `session.closed` | Session + Rapport | Membres de l'association |
| `parameter.changed` | Paramètre + Ancienne/Valeur | Membres (selon config) |
| `member.joined` | Membre + Parrain | Bureau |
| `member.left` | Membre + Raison | Bureau |
| `relation.created` | Relation + Associations | Bureaux concernés |

---

## 14. Exigences Non-Fonctionnelles

### 14.1 Performance

- Temps de réponse API < 200ms pour 95% des requêtes
- Génération de rapport PDF < 5s pour une association de 100 membres
- Chargement de la page association < 1s (first contentful paint)

### 14.2 Disponibilité

- SLA : 99.9% de disponibilité hors maintenance planifiée
- Maintenance planifiée : fenêtre de 2h max, annoncée 72h à l'avance
- Mode hors ligne : lecture des données en cache, saisie différée pour les cotisations cash

### 14.3 Sécurité

- Chiffrement AES-256 des données sensibles en base
- JWT RS256 avec rotation de clés mensuelle
- Audit trail immuable (écriture append-only)
- Backup quotidien avec rétention de 30 jours
- RGPD / Loi locale sur la protection des données applicable

### 14.4 Scalabilité

- Support de 10 000 associations actives simultanées
- Support de 100 000 membres par association (théorique)
- Sharding possible par région géographique

### 14.5 Accessibilité

- Conformité WCAG 2.1 niveau AA
- Support des lecteurs d'écran
- Contraste minimum 4.5:1 pour tous les textes
- Navigation au clavier complète

---

## 15. Récapitulatif : Règles d'Or de la Gestion du Cycle de Vie

Ce récapitulatif synthétise les principes fondamentaux qui régissent l'ensemble du cycle de vie d'une association au sein de Tchoua. Ces règles d'or sont immuables et constituent la charte de conception de la plateforme.

| Principe | Description | Implémentation Technique |
|----------|-------------|-------------------------|
| **Tout est paramétrable** | Aucun paramètre n'est figé. Tout peut être modifié à tout moment, dans le respect des règles de gouvernance. | `AssociationSettings` modifiable via API `PATCH /api/associations/:id/settings`. Versioning systématique avec `ParameterChange`. Matrice de paramétrage §6.2. |
| **Tout est modifiable** | Les modifications sont possibles à chaud (en cours d'exploitation) ou à froid (hors session), avec des impacts clairement documentés. | Transactions atomiques avec rollback possible. Prévisualisation des impacts avant application. Notification automatique aux membres concernés. |
| **Tout est auditable** | Chaque modification, validation, décision est enregistrée dans le journal d'audit avec horodatage, auteur, ancienne valeur, nouvelle valeur. | Table `AuditEntry` append-only. Hash SHA-256 par entrée pour garantir l'intégrité. Conservation minimale de 36 mois. API `GET /api/associations/:id/audit`. |
| **Gouvernance flexible** | Le niveau de validation est configurable : immédiat (créateur), Maker-Checker (bureau), ou vote des membres (démocratie directe). | `VotingConfig` avec 5 niveaux de décision (routine, standard, important, critical, constitutional). Quorum et méthode de vote paramétrables par type de décision. |
| **Héritage maîtrisé** | Les associations filles héritent des règles de la mère (templates, structure de frais, règlement), avec possibilité de les adapter localement. | `AssociationRelation` avec `inheritanceRules` (copyTemplates, copyRules, copyActivities, copyFeeStructure). Possibilité de surcharge post-création. |
| **Indépendance possible** | Une association fille peut devenir indépendante à tout moment, rompre la relation mère-fille, et gérer ses propres règles sans supervision. | `DELETE /api/associations/:id/relations/:rid` avec vote du bureau de la fille. Conservation des données historiques. Pas de suppression en cascade. |
| **Traçabilité totale** | L'historique complet est conservé indéfiniment, même après clôture ou dissolution de l'association. Accès en lecture seule pour les anciens membres. | Archivage immuable en statut `DISSOLVED`. Données conservées pour conformité légale. Accès restreint aux anciens membres et au bureau. Export possible pour transition vers une autre plateforme. |
| **Sécurité par conception** | Les actions sensibles (modification financière, dissolution, changement de règlement) nécessitent une double validation et une authentification forte (2FA). | `require2FAForSensitive: true` dans `AssociationSettings.security`. Validation double pour transactions > 500 000 FCFA. JWT RS256 avec rotation mensuelle. RBAC granulaire avec héritage des rôles. |

### Matrice de Conformité aux Règles d'Or

| Fonctionnalité | Paramétrable | Modifiable | Auditable | Gouvernance Flexible | Héritage | Indépendance | Traçabilité | Sécurité |
|----------------|:------------:|:----------:|:---------:|:--------------------:|:--------:|:------------:|:-----------:|:--------:|
| Création d'association | ✓ | ✓ | ✓ | ✓ | ✓ | N/A | ✓ | ✓ |
| Modification du nom | ✓ | ✓ | ✓ | ✓ | ✗ | N/A | ✓ | ✗ |
| Modification du type | ✓ | ✓ | ✓ | ✓ | ✗ | N/A | ✓ | ✓ |
| Activation d'activité | ✓ | ✓ | ✓ | ✓ | ✓ | N/A | ✓ | ✗ |
| Modification des frais | ✓ | ✓ | ✓ | ✓ | ✓ | N/A | ✓ | ✓ |
| Modification du RI | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| Élection du bureau | ✓ | ✓ | ✓ | ✓ | ✗ | N/A | ✓ | ✓ |
| Révocation membre bureau | ✓ | ✓ | ✓ | ✓ | ✗ | N/A | ✓ | ✓ |
| Création de session | ✓ | ✓ | ✓ | ✓ | ✗ | N/A | ✓ | ✗ |
| Clôture de session | ✓ | ✓ | ✓ | ✓ | ✗ | N/A | ✓ | ✓ |
| Modification des barèmes solidarité | ✓ | ✓ | ✓ | ✓ | ✓ | N/A | ✓ | ✓ |
| Création relation mère-fille | ✓ | ✓ | ✓ | ✓ | N/A | ✓ | ✓ | ✓ |
| Rupture relation mère-fille | ✓ | ✓ | ✓ | ✓ | N/A | ✓ | ✓ | ✓ |
| Conversion en modèle | ✓ | ✓ | ✓ | ✓ | ✗ | N/A | ✓ | ✗ |
| Génération de rapport | ✓ | ✓ | ✓ | ✓ | ✗ | N/A | ✓ | ✗ |
| Suspension | ✓ | ✓ | ✓ | ✓ | ✗ | N/A | ✓ | ✓ |
| Dissolution | ✓ | ✓ | ✓ | ✓ | ✗ | N/A | ✓ | ✓ |

### Checklist de Conformité pour les Développeurs

Avant de déployer toute nouvelle fonctionnalité touchant au cycle de vie d'une association, vérifier :

- [ ] **Paramétrabilité** : La fonctionnalité est-elle configurable via `AssociationSettings` ?
- [ ] **Modifiabilité** : Les paramètres peuvent-ils être changés sans recréer l'association ?
- [ ] **Audit** : Un `AuditEntry` est-il généré pour chaque action ?
- [ ] **Gouvernance** : Le quorum requis est-il respecté et configurable ?
- [ ] **Héritage** : Les associations filles héritent-elles correctement des nouveaux paramètres ?
- [ ] **Indépendance** : Une fille peut-elle fonctionner sans sa mère si la relation est rompue ?
- [ ] **Traçabilité** : L'historique est-il conservé et consultable ?
- [ ] **Sécurité** : Les actions sensibles nécessitent-elles une double validation ?

---

## Annexes

### Annexe A : Modèle de Données Prisma (Extrait)

```prisma
model Association {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String?
  type        AssociationType
  status      AssociationStatus @default(DRAFT)
  
  parentId    String?
  parent      Association?  @relation("ParentChild", fields: [parentId], references: [id])
  children    Association[] @relation("ParentChild")
  
  settings    Json          // AssociationSettings sérialisé
  activities  Activity[]
  memberships Membership[]
  sessions    Session[]
  reports     Report[]
  auditLog    AuditEntry[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String
  
  @@index([slug])
  @@index([status])
  @@index([parentId])
}

model Membership {
  id              String   @id @default(cuid())
  associationId   String
  userId          String
  role            RoleType @default(MEMBER)
  status          MemberStatus @default(PENDING)
  reliabilityScore Int     @default(100)
  sponsorId       String?
  joinedAt        DateTime @default(now())
  leftAt          DateTime?
  
  association     Association @relation(fields: [associationId], references: [id])
  
  @@unique([associationId, userId])
  @@index([associationId, status])
}

model Session {
  id              String   @id @default(cuid())
  associationId   String
  status          SessionStatus @default(DRAFT)
  scheduledAt     DateTime
  openedAt        DateTime?
  closedAt        DateTime?
  totalCollected  Int      @default(0)
  reliquat        Int      @default(0)
  
  association     Association @relation(fields: [associationId], references: [id])
  contributions   Contribution[]
  
  @@index([associationId, status])
  @@index([scheduledAt])
}
```

### Annexe B : Code d'Erreur API

| Code | Description |
|------|-------------|
| `ASSOC_001` | Nom d'association déjà utilisé |
| `ASSOC_002` | Quorum insuffisant pour la modification |
| `ASSOC_003` | Association parente invalide ou inactive |
| `ASSOC_004` | Limite de filles atteinte pour l'association mère |
| `ASSOC_005` | Modification non autorisée (droits insuffisants) |
| `ASSOC_006` | Session déjà ouverte/fermée |
| `ASSOC_007` | Membre déjà présent dans l'association |
| `ASSOC_008` | Parrainage expiré ou invalide |
| `ASSOC_009` | Limite de membres atteinte |
| `ASSOC_010` | Règlement intérieur en conflit avec un paramètre |

---

*Document rédigé conformément aux standards de spécification logicielle Tchoua. Toute modification doit être soumise à révision du comité technique.*
