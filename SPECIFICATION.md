# SPÉCIFICATIONS DÉTAILLÉES - TCHOUA APP (Gestion de Tontines et Associations)

Ce document détaille les spécifications fonctionnelles et techniques de l'application, en s'appuyant sur les règles métiers issues des associations modèles (AMSED, Fonds NDI MBE ET FILS, A30). 
L'application doit être hautement paramétrable pour s'adapter aux règles spécifiques de chaque association.

---

## MODULE 1 : CONFIGURATION DE L'ASSOCIATION ET PARAMÉTRAGE GLOBAL
L'application doit permettre aux fondateurs/bureau de configurer les règles de fonctionnement :

- **Organisation des Réunions** : Fréquence (ex: 1er samedi du mois, dernier dimanche), horaires (ex: 15h-19h), et mode d'hébergement (foyer fixe ou rotatif chez les membres).
- **Comptes Bancaires** : Enregistrement des RIB (ex: CCABANK, CCP Bank) et gestion des signataires requis (ex: 2 signataires minimum).
- **Structure du Bureau (Comité Directeur)** : Création de rôles personnalisés (Président, Vice-Président, SG, SG Adjoint, Trésorier, Censeur, Commissaires aux comptes, Conseillers, etc.).

### 1.1. Gestion du Cycle de Vie de l'Association
- **Création en Mode Wizard (Assistant)** : La création d'une association peut être initiée par n'importe quel membre via un processus par étapes garantissant que tous les paramètres sont correctement renseignés :
  1. *Identité* : Nom, description, logo, thème couleur.
  2. *Contacts & Localisation* : Adresses, email, téléphone, région.
  3. *Activités* : Activation des modules souhaités (Tontine, Épargne, Investissement, Aides).
  4. *Réunions* : Fréquence, mode d'hébergement.
  5. *Tontine* : Mode d'attribution des cagnottes (Tirage au sort, Enchères, etc.).
  6. *Sessions & Cycle* : Durée du cycle, nombre de sessions.
  7. *Règlement Intérieur* : Saisie du règlement structuré article par article.
- **Associations Parent / Fille** :
  - Une association peut être rattachée à une association "Parente".
  - Tout membre rejoignant une association fille devient *automatiquement* membre de l'association parente.
  - Le montant de la souscription obligatoire au parent est prélevé/géré automatiquement.
- **Édition (Master Form)** : Tous les paramètres saisis lors de la création restent modifiables à tout moment via un formulaire structuré en onglets, accessible aux fondateurs ou membres du bureau autorisés.
- **Validation stricte du Règlement Intérieur** : 
  - Lors de son adhésion, le membre doit valider le règlement **article par article**.
  - L'adhésion ne passe à l'état "Actif" que si le membre a coché l'approbation de *tous* les articles.

---

## MODULE 2 : GESTION DES MEMBRES
### 2.1. Adhésion et Profil
- **Processus d'Adhésion** :
  - Formulaire avec informations personnelles et coordonnées (Téléphone, Email).
  - Système de **Parrainage** (sélection d'un membre actif existant comme parrain).
  - Validation de l'adhésion soumise au vote/approbation du bureau (unanimité ou 2/3 des voix).
  - Paiement des frais d'adhésion initiaux (si applicable).
- **Informations Familiales (Pour les aides)** :
  - Enregistrement du premier conjoint (important pour les polygames : seule la 1ère femme déclarée est prise en charge pour les aides maladie, par ex.).
  - Enregistrement des enfants, père, mère.
### 2.2. Statuts et Traçabilité
- Statuts possibles : Actif, Suspendu, Radié, Décédé.
- Suivi de l'ancienneté (nécessaire pour l'éligibilité à certains postes du bureau ou priorités de prêts).

---

## MODULE 3 : GESTION DES RÉUNIONS ET DISCIPLINE
Le **Censeur** ou le **Secrétaire** utilise ce module pendant la séance.

### 3.1. Gestion de la Collation
- **Hôte de la réunion** : Désignation rotative.
- **Caisse de collation** : Collecte automatique (ex: 3 000 FCFA/membre) et reversement d'une somme forfaitaire à l'hôte (ex: 150 000 FCFA), déduction faite de ses propres arriérés de collation.

### 3.2. Suivi des Présences et Horaires
- **Retards** : Pointage avec heure d'arrivée (ex: si > 30 min après l'heure d'ouverture, amende automatique de 500 FCFA).
- **Absences** : 
  - Saisie de la justification (Force majeure, Maladie, Deuil).
  - Gestion de la récidive : Amende progressive (ex: 1 absence = 1000 F, 2 = 3000 F, 3 = 5000 F).
  - Système d'avertissement automatique (ex: Avertissement après 6 absences, proposition de radiation après 9).
- **Départ anticipé** : Amende (ex: 500 FCFA) si départ avant l'heure de clôture sans autorisation.

### 3.3. Gestion des Infractions (Amendes)
- Ajout manuel d'amendes lors de la réunion :
  - Bavardage / Intervention non autorisée (ex: 500 FCFA).
  - Indiscipline caractérisée / Trouble (ex: 3 000 FCFA).
  - Manquement à une commission / Colportage de fausses nouvelles / Bureau non solidaire.
- **Pénalité de retard de paiement des amendes** : Les amendes non payées le jour même peuvent subir une majoration (ex: +10%).

---

## MODULE 4 : TONTINES (COTISATIONS)
L'application doit gérer deux grands modèles de Tontines : **Classique (Tirage)** et **Enchères**.

### 4.1. Tontine à Enchères
- **Cotisation** : Suivi des versements (ex: 25 000 FCFA, possibilité de prendre plusieurs parts).
- **Mise aux Enchères** :
  - Saisie des offres d'enchères pour "acheter" la cagnotte (taux de mise à prix minimum, ex: 5%).
  - L'avant-dernier enchérisseur est tracé (s'il se désiste pour le lot suivant, il paie l'intérêt proposé en amende).
  - Le montant de l'enchère est déduit du total de la cagnotte remise.
- **Gestion des Échecs (Défauts de paiement)** :
  - Pénalité de 15% (si le membre n'a pas encore "mangé" la tontine) ou 20% (s'il a déjà bénéficié de la tontine).
  - Rétrogradation automatique : Le défaillant est relégué en fin de liste.
- **Garanties** :
  - Saisie du nom de l'Avaliste (garant) ou traçabilité du dépôt d'un chèque/reconnaissance de dette.

### 4.2. Tontine à Tirages (Petite / Grande Tontine)
- **Tirage mensuel** : Module de tirage au sort (priorité aux membres présents dans la salle).
- **Tirage unique** : Génération du calendrier complet des bénéficiaires au premier cycle. Ordre figé.
- **Résidus et Surplus** : Les surplus des cagnottes non distribués vont dans une "Caisse des résidus" pour prêter aux membres ou constituer de nouvelles cagnottes.

### 4.3. Remboursement des Intérêts (Achats d'intérêts de tontine)
- Les intérêts générés sont divisés en lots et revendus pour un délai fixe (ex: 2 mois).
- Calcul strict des pénalités si retard de remboursement des intérêts (ex: +10% de 1 à 30j, +15% de 31 à 60j, +20% de 61 à 90j).

---

## MODULE 5 : FONDS DE SOLIDARITÉ
### 5.1. Alimentation du fonds
- **Cotisation Annuelle/Initiale** : Suivi du paiement pour les nouveaux (ex: 72 000 FCFA sur 10 mois).
- **Prélèvements Tontine** : Déduction automatique d'un % ou montant fixe sur chaque cagnotte de tontine pour alimenter le fonds de solidarité.
- **Reconstitution Annuelle** : Bilan en fin d'année. S'il y a un déficit, calcul automatique du montant à répartir également entre tous les membres.

### 5.2. Décaissements et Aides (Événements)
Interface de déclaration d'événement par le membre ou le bureau avec montants d'aides pré-configurés :
- **Santé** : Hospitalisation d'un membre (ex: 70 000 F), conjoint (ex: 50 000 F), Enfant.
  - Option de "Prêt Santé d'Urgence" : Prêt à Taux 0% (ex: max 100 000 F), remboursable 3 mois après sortie de l'hôpital.
- **Heureux événements** : Mariage (ex: 50 000 F - 1er mariage uniquement), Naissance (ex: 20 000 F + prime jumeaux).
- **Décès** :
  - Frais d'obsèques fixes selon le lien (Membre: 900k, Conjoint: 405k, Parent: 100k, Enfant: 50k-100k).
  - Ventilation détaillée (cercueil, transport, restauration, remise à la veuve/veuf).
  - Gestion des frais de délégation (transport et rafraîchissement au village).

---

## MODULE 6 : FONDS D'INVESTISSEMENT ET PRÊTS (ÉPARGNE & CRÉDIT)
### 6.1. Apports en capital (Épargne)
- Dépôts libres ou mensuels obligatoires (ex: minimum 5000 F/mois).
- Historisation stricte de la date exacte de chaque versement (impacte le calcul de la quote-part des intérêts).

### 6.2. Octroi de Prêts
- **Demande de prêt** : Workflow d'approbation par le SG et Trésorier, dépendant de la liquidité disponible.
- **Algorithme d'Arbitrage** (en cas de fonds insuffisants) : Le système doit pouvoir classer les demandes selon :
  1. Régularité des versements du membre.
  2. Solvabilité et historique de remboursement.
  3. Ancienneté et montant cumulé de son capital.
  4. Ordre chronologique de la demande.
- **Limites** : Le système bloque l'octroi si le membre dépasse sa limite (ex: 2x son capital non gagé) ou s'il a un encours non soldé.

### 6.3. Calcul des Intérêts et Échéancier
- Le système génère automatiquement l'échéancier.
- Taux configurables par l'association :
  - Exemple NDI MBE : 2% / mois les 3 premiers mois, puis 4% / mois de pénalité de retard.
  - Exemple AMSED : 3% / mois sur 2 mois max, doublement de l'intérêt si retard.
  - Exemple A30 (Caisse de résidus) : 5% / mois.

### 6.4. Remboursements et Pénalités
- Détection automatique des retards et application rétroactive de la majoration d'intérêts.
- Gel des droits d'emprunts en cas de retards successifs (ex: > 2 mois).

### 6.5. Redistribution des bénéfices / Dividendes
- Fin d'exercice (décembre) : Calcul des bénéfices générés.
- Distribution des intérêts encaissés au prorata (Quote-part) :
  - `Quote-part (Membre) = Intérêts totaux * (Capital versé par Membre / Capital total disponible)`
  - *Note technique* : Le système doit exclure du calcul du capital disponible les membres qui sont eux-mêmes en situation d'emprunt sur la période, selon la règle NDI.

---

## MODULE 7 : GESTION FINANCIÈRE, RECOUVREMENT ET COMPTABILITÉ
### 7.1. Caisse, Virement et Traçabilité
- Interdiction des espèces (Optionnel) : Suivi des virements bancaires avec upload des preuves de virement.
- Interface Trésorier pour valider les encaissements.
- Génération d'un **Relevé de Compte mensuel par membre** (Capitaux, intérêts, dettes, quote-part).

### 7.2. Consolidation des Dettes et Compensation (Recouvrement Croisé)
- En fin d'année (ou au départ/décès d'un membre), l'application doit permettre la saisie et compensation automatique des dettes d'un membre à partir de ses avoirs :
  - Déduction des amendes disciplinaires, arriérés de collation, échecs tontine sur les **bénéfices d'investissement** ou sur le **capital d'investissement**.
- **Contentieux (Huissier)** : Traçabilité des chèques/reconnaissances de dettes envoyés à l'huissier après X mois de retard.

### 7.3. Gestion du Départ ou Décès
- **Départ (Démission/Radiation)** : Calcul de la balance finale (Total dû au membre - Dettes envers l'association). Si dette > avoir, génération document pour recouvrement. Cession des parts d'investissement.
- **Décès** : Le système bloque le compte, déclenche les aides (Solidarité), et transmet les avoirs restants + Quote-part d'investissement aux enfants (ex: 75% versés à chaque rentrée scolaire) et aux ayants droit (25%).

---

## MODULE 8 : MOTEUR DE FRÉQUENCE ET PLANIFICATION DES SESSIONS

Chaque activité créée au sein d'une association (tontine, épargne, caisse de solidarité, etc.) est rythmée par des **sessions** qui déterminent les échéances de cotisation, de distribution ou de décaissement. La fréquence de ces sessions est entièrement paramétrable par le créateur de l'activité.

### 8.1. Options de Fréquence
| Type de Fréquence | Options Disponibles | Exemples Concrets |
| :--- | :--- | :--- |
| **Journalière** | Tous les jours de la semaine (Lundi au Dimanche). Possibilité de sélectionner un ou plusieurs jours spécifiques. Exclusion automatique des dimanches ou jours fériés sur demande. | - Tous les jours ouvrés (Lundi-Vendredi) <br>- Uniquement les Lundis |
| **Hebdomadaire** | Choix d'un ou plusieurs jours de la semaine. Nombre de semaines d'intervalle (ex: toutes les semaines, toutes les 2 semaines). | - Chaque Mardi <br>- Chaque Lundi et Vendredi <br>- Toutes les 2 semaines, le Jeudi |
| **Mensuelle** | **Option 1 : Par date fixe** (ex: le 05 de chaque mois). <br>**Option 2 : Par position relative** (1ère, 2ème, 3ème, 4ème, dernière occurrence d'un jour dans le mois). <br>**Option 3 : Par quinzaine** (1ère ou 2ème partie du mois avec jour précis). | - Le 01 de chaque mois <br>- Le 15 de chaque mois <br>- Le 1er Samedi du mois <br>- Le 2ème Lundi du mois <br>- Le dernier Vendredi du mois <br>- Le Mardi de la 1ère quinzaine |
| **Annuelle** | **Option 1 : Date fixe** (jour et mois précis). <br>**Option 2 : Position relative dans un mois donné** (ex: 1er Samedi de Décembre). <br>**Option 3 : Périodicité avec mois spécifiques** (choisir un ou plusieurs mois dans l'année, puis configurer le jour comme pour le mensuel). | - Le 15 Août de chaque année <br>- Le 2ème Dimanche de Janvier <br>- Le 1er Samedi de chaque trimestre (Janvier, Avril, Juillet, Octobre) |

### 8.2. Règles Transversales
| Règle | Description |
| :--- | :--- |
| **Date de début de l'activité** | La première session est automatiquement calculée à partir de la date de création de l'activité et des paramètres de fréquence. Le créateur peut également forcer une date de première session personnalisée. |
| **Gestion des sessions passées** | Si la configuration est modifiée en cours d'activité, les sessions passées restent inchangées. La nouvelle fréquence s'applique uniquement aux sessions futures. |
| **Jours fériés et chômés** | Une option "Reporter si jour férié" permet de définir un comportement automatique : session avancée la veille, reportée au lendemain, ou annulée. |
| **Calendrier prévisionnel** | Dès la configuration validée, le système génère automatiquement un calendrier prévisionnel des 12 prochaines sessions. Les membres peuvent le consulter dans l'activité. |
| **Notification des échéances** | Des rappels automatiques sont envoyés aux membres selon un paramètre distinct (ex: J-3, J-1, Jour J de la session). |

---

## MODULE 9 : RÉPARTITION FINANCIÈRE ET ENCAISSEMENT (ALGORITHME)

### 9.1. Principe Général
Lors d'une session de tontine, chaque membre effectue un versement global (en espèces, Mobile Money, virement, etc.). Ce versement unique est ensuite automatiquement réparti entre les différentes activités auxquelles le membre a souscrit au sein de l'association, selon un **ordre de priorité strict** et des **règles de traitement** propres à chaque type d'activité.

La session est ouverte par le Secrétariat (ou un membre habilité du bureau). Une fois ouverte, le système exécute la répartition pour chaque membre ayant effectué un versement, en affichant le résultat de manière transparente pour tous les participants.

### 9.2. Typologie des Activités par Priorité et Obligation
| Type d'Activité | Caractère | Priorité | Règle de Paiement |
| :--- | :--- | :--- | :--- |
| **Obligatoire Totale** | Obligatoire | Priorité 1 (Haute) | Le montant total dû doit être couvert. |
| **Échéance de Remboursement** | Obligatoire | Priorité 1 | Traitée comme une obligation totale prioritaire. |
| **Obligatoire Partielle** | Obligatoire | Priorité 2 | Un montant minimum doit être couvert ; le membre peut payer plus. |
| **Optionnelle Totale** | Optionnelle | Priorité 3 | Le membre choisit de payer ou non le montant total défini. |
| **Optionnelle Partielle** | Optionnelle | Priorité 4 (Basse) | Le membre choisit de payer ou non, et peut décider du montant qu'il verse. |

### 9.3. Règles de Traitement et Algorithme de Répartition
Le système traite chaque membre l'un après l'autre. Pour chaque membre, il exécute l'algorithme suivant :

```text
POUR CHAQUE membre ayant versé :
    Solde restant = Montant total versé par le membre
    POUR CHAQUE activité de la liste, triée par priorité croissante (1, 2, 3, 4) :
        SI l'activité est ACTIVE pour ce membre ALORS :
            Appliquer la règle de traitement correspondant au type d'activité
            Déduire le montant alloué du Solde restant
        FIN SI
    FIN POUR
    Affecter le Solde restant éventuel au compte "Excédent" du membre
FIN POUR
```

| Type d'Activité | Règle de Traitement Appliquée |
| :--- | :--- |
| **Priorité 1 (Totale & Prêt)** | **Si** Solde restant >= Montant total dû **Alors** : Succès. <br>**Sinon** : Échec. Sanctions appliquées (pénalités, blocage). |
| **Priorité 2 (Partielle)** | **Si** Solde restant >= Montant minimum requis **Alors** : Succès (montant min ou plus). <br>**Sinon** : Échec. Déclencher les sanctions. |
| **Priorité 3 (Opt. Totale)** | **Si** Solde restant >= Montant total **Alors** : Succès. <br>**Sinon** : Non payé (sans pénalité). Solde préservé. |
| **Priorité 4 (Opt. Partielle)** | Appliquer la **clé de répartition personnalisée** (ex: 2000 F fixe, ou 10% du reste, ou "tout le reste"). Allouer dans la limite du Solde. |

### 9.4. Schéma du Flux de Traitement (Exemple Pratique)
```text
Membre verse 25 000 FCFA (Mobile Money + Cash)
         │
         ▼
Session ouverte par le Secrétariat
         │
         ▼
Solde restant = 25 000 FCFA
         │
         ├──> Activité 1 : Tontine principale (Obligatoire Totale, Priorité 1, 15 000 FCFA)
         │    └──> Alloué 15 000 FCFA → Succès. Solde restant = 10 000 FCFA.
         │
         ├──> Activité 2 : Remboursement prêt (Priorité 1, 5 000 FCFA)
         │    └──> Alloué 5 000 FCFA → Succès. Solde restant = 5 000 FCFA.
         │
         ├──> Activité 3 : Caisse solidarité (Obligatoire Partielle, Priorité 2, Min 2 000 FCFA)
         │    └──> Alloué 2 000 FCFA (minimum). Solde restant = 3 000 FCFA.
         │
         ├──> Activité 4 : Épargne projet (Optionnelle Partielle, Priorité 4, Clé = 50 % du solde)
         │    └──> Alloué 1 500 FCFA (50 % de 3 000). Solde restant = 1 500 FCFA.
         │
         └──> Excédent non réparti : 1 500 FCFA (reportable ou remboursable selon règlement)
```

---

## MODULE 10 : ARCHITECTURE DES DONNÉES (PRISMA SCHEMA CONCEPTUEL)
*Ce schéma s'appuie sur la structure multi-associations et multi-activités consolidée dans le fichier `schema.prisma`.*

- **User** : Authentification, informations personnelles de base.
- **Association** : Paramétrages globaux (banque, composition du bureau, conditions d'adhésion, amendes).
- **AssociationMembership** : Rôle du membre dans l'association, ancienneté, et Score de Fiabilité (`ReliabilityScore`).
- **AssociationActivity** : Configuration spécifique d'une activité (Tontine, Épargne, Solidarité) avec paramétrage du `FrequencyConfig` et de la `Priority`.
- **ActivitySubscription** : Souscription d'un membre à une activité (incluant ses clés de répartition personnalisées).
- **ActivitySession** : Instance d'une activité générée à une date donnée par le moteur de fréquence.
- **ActivityContribution** : Versement calculé et alloué par l'algorithme de répartition financière, avec statut `PENDING`, `PAID`, `LATE` ou `FAILED`.
- **AssocMeeting** / **AssocMeetingAttendance** : Gestion des réunions physiques/virtuelles, pointage des présences et des retards.
- **AssocLoan** / **AssocLoanRepayment** : Suivi des emprunts, des taux multiples, des limites par membre et des remboursements.

---

## MODULE 11 : GESTION DES UTILISATEURS ET DES DROITS D'ACCÈS

### 11.1. Principe Général

L'application distingue deux grandes catégories d'utilisateurs, régies par des logiques de droits et d'accès distinctes :

| Catégorie | Rôle | Périmètre |
| :--- | :--- | :--- |
| **Utilisateurs Système** | Créés par l'Administrateur de la plateforme. Ils ne sont pas nécessairement membres d'une association. Leurs droits sont gérés au niveau global de l'application (Role-Based Access Control). | Plateforme entière ou modules spécifiques. |
| **Utilisateurs Membres** | Créés librement (inscription) ou invités par une association. Ils sont membres d'une ou plusieurs associations. Leurs droits sont gérés association par association. | Une ou plusieurs associations, avec un sélecteur pour naviguer. |

Un même compte utilisateur peut cumuler les deux qualités : il peut être à la fois Utilisateur Système (avec un rôle global) et Membre de plusieurs associations (avec des rôles différents dans chaque association).

### 11.2. UTILISATEURS SYSTÈME (ADMINISTRATION DE LA PLATEFORME)

#### 11.2.1. L'Administrateur Principal (Admin)
- **Création** : Un compte Admin principal est créé lors de l'initialisation de la plateforme.
- **Accès par défaut** : `admin@tchoua.com` / `Admin1234`
- **Droits** : Accès total à toutes les fonctionnalités, toutes les associations, toutes les données.
- **Responsabilités** : Gérer les utilisateurs système, configurer la plateforme, superviser les associations.

#### 11.2.2. Création d'Utilisateurs Système par l'Admin
L'Admin peut créer d'autres comptes utilisateurs avec des rôles spécifiques (ex: "Auditeur", "Support Client").
- **Étapes** : Création du compte (email, tel, password temporaire) -> Attribution de rôles -> Activation.

#### 11.2.3. Gestion des Droits : RBAC Avancé
- **Structure d'un Rôle** : Nom, Description, Permissions.
- **Granularité (CRUD)** : Create, Read, Update, Delete sur des ressources (Utilisateurs, Associations, Transactions, etc.).
- **Maker-Checker** : Validation par un tiers pour les actions sensibles.
- **Audit Log** : Enregistrement de chaque action (Qui, Quoi, Quand, Valeurs).
- **Cycle de Vie** : Inactif → Actif → Bloqué → Suspendu → Archivé.

### 11.3. UTILISATEURS MEMBRES (MEMBRES D'ASSOCIATIONS)

#### 11.3.1. Création et Affiliation
- **Inscription libre** ou **Invitation** par un membre du bureau.

#### 11.3.2. Droits par Association : Rôles Locaux
Un utilisateur peut avoir des rôles différents selon l'association (Fondateur, Président, Secrétaire, Trésorier, Membre Simple).
- **Révocation du Fondateur** : Initiée par 2 membres du bureau, double validation requise.
- **Délégation** : Possibilité de déléguer temporairement des droits à un autre membre.

#### 11.3.3. Interface Utilisateur Membre : Sélecteur d'Association
L'interface est conçue autour d'un **sélecteur d'association** omniprésent dans le header.
- **Valeur par défaut** : "Toutes mes associations" (vue consolidée).
- **Filtrage** : La sélection d'une association filtre instantanément les données de tous les modules (Tableau de Bord, Tontines, Épargne, Prêts, Solidarité, Membres).
- **Vue Consolidée** : Affiche les prochains échéanciers et alertes transverses de toutes les associations.

Tout à fait. Vous avez raison de souligner cette distinction essentielle. Les deux catégories d'utilisateurs ont des objectifs, des besoins et des périmètres d'action totalement différents. Voici une spécification détaillée des deux menus et profils de navigation distincts.

---

## Spécification Fonctionnelle : Menus et Profils de Navigation Distincts

### 1. Principe Fondamental

L'interface utilisateur se divise en **deux espaces complètement distincts**, avec chacun sa propre barre de navigation, son propre menu et sa propre logique :

| Espace | Public | Accessible via |
| :--- | :--- | :--- |
| **Espace Administration** | Utilisateurs Système (Admin et rôles délégués) | URL dédiée ou bascule depuis le compte (si l'utilisateur cumule les deux qualités). |
| **Espace Membre** | Utilisateurs Membres d'associations | Interface principale de l'application (mobile et web). |

Un utilisateur qui cumule les deux qualités (ex : Admin qui est aussi membre d'une tontine) dispose d'un **bouton de bascule** pour passer d'un espace à l'autre sans se déconnecter.

---

## PARTIE 1 : MENU ET NAVIGATION DE L'ESPACE ADMINISTRATION

### 1.1. Barre de Navigation Principale (Sidebar ou Bottom Bar)

L'espace Administration dispose d'un menu latéral (sur desktop) ou d'une barre de navigation inférieure (sur mobile) structuré comme suit :

```text
┌─────────────────────────────────────────────┐
│         ESPACE ADMINISTRATION               │
├─────────────────────────────────────────────┤
│  👤 Profil Administrateur                   │
│  📊 Tableau de Bord Admin                   │
│  👥 Gestion des Utilisateurs Système        │
│  🔐 Rôles et Permissions                    │
│  📋 Modèles d'Associations                  │
│  🏢 Supervision des Associations            │
│  💰 Audit Financier Global                  │
│  📝 Journaux (Audit Log, Access Log)        │
│  📢 Notifications et Alertes Système        │
│  ⚙️ Paramètres de la Plateforme            │
│  🔄 Bascule vers Espace Membre              │
└─────────────────────────────────────────────┘
```

### 1.2. Détail des Modules de l'Espace Administration

| Module | Icône | Fonctionnalités Accessibles |
| :--- | :--- | :--- |
| **Profil Administrateur** | 👤 | Voir/modifier mes informations personnelles, changer mot de passe, activer 2FA, voir mes sessions actives. |
| **Tableau de Bord Admin** | 📊 | Vue d'ensemble de la plateforme : nombre total d'utilisateurs, nombre d'associations, transactions du jour, alertes système, graphiques d'activité. |
| **Gestion des Utilisateurs Système** | 👥 | Liste des utilisateurs système, création, modification, activation/blocage/suppression, attribution de rôles, historique des actions. |
| **Rôles et Permissions** | 🔐 | Créer/modifier/supprimer des rôles, configurer les permissions CRUD par ressource, paramétrer le Maker-Checker pour les actions sensibles, matrice des droits. |
| **Modèles d'Associations** | 📋 | Gérer les modèles système : création, modification, publication, documentation, consultation des notes et commentaires. |
| **Supervision des Associations** | 🏢 | Liste de toutes les associations de la plateforme, consultation des détails, capacité à intervenir (débloquer, suspendre), statistiques par association. |
| **Audit Financier Global** | 💰 | Consultation de toutes les transactions financières de la plateforme, filtrage par association, par date, par type, export de rapports, détection d'anomalies. |
| **Journaux (Logs)** | 📝 | Consultation de l'Audit Log (actions utilisateurs) et de l'Access Log (connexions), filtrage avancé, export, alertes de sécurité. |
| **Notifications et Alertes Système** | 📢 | Configuration des notifications automatiques, envoi de messages à tous les utilisateurs ou à une sélection, gestion des templates de messages. |
| **Paramètres de la Plateforme** | ⚙️ | Configuration générale : monnaie par défaut (FCFA), fuseau horaire, langues disponibles, jours fériés, limites de montants, paramètres de sécurité. |
| **Bascule vers Espace Membre** | 🔄 | Permet à l'Admin (s'il est aussi membre d'associations) de basculer vers l'interface Membre. Le bouton inverse existe dans l'Espace Membre. |

### 1.3. Profil de l'Espace Administration

| Élément Visuel | Description |
| :--- | :--- |
| **Couleur dominante** | Une couleur distincte (ex : bleu foncé, gris anthracite) pour différencier immédiatement de l'espace Membre. |
| **Badge "Admin"** | Un badge visible en permanence dans l'en-tête indique "Mode Administration". |
| **Breadcrumb** | Fil d'Ariane pour naviguer dans les sous-menus. |
| **Barre de recherche globale** | Recherche parmi les utilisateurs, associations, transactions. |

---

## PARTIE 2 : MENU ET NAVIGATION DE L'ESPACE MEMBRE (VERSION COMPLÈTE)

### 2.1. Structure du Menu Principal

Le menu de l'Espace Membre est organisé en **15 modules** accessibles depuis la barre de navigation principale, avec le **sélecteur d'association** omniprésent en haut de l'interface.

```text
┌──────────────────────────────────────────────────────────────────┐
│  [🏢 Toutes mes associations ▾]          🔔 Notifications  👤 ▾  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📊 Tableau de bord                                              │
│  💰 Mes Tontines                                                 │
│  🏦 Épargne & Investissement                                     │
│  💳 Prêts & Crédit                                               │
│  🤝 Solidarité                                                   │
│  📅 Sessions & Tirage                                            │
│  👥 Membres                                                      │
│  🛒 Marketplace                                                  │
│  🎉 Événements                                                   │
│  💬 Chat de Groupe                                               │
│  🤖 Conseils IA                                                  │
│  📈 Rapports                                                     │
│  🏆 Gamification                                                 │
│  🎓 Académie                                                     │
│  👤 Mon Profil                                                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2. Détail des Modules de l'Espace Membre

| Module | Icône | Fonctionnalités Accessibles (filtrées selon l'association sélectionnée) |
| :--- | :--- | :--- |
| **Sélecteur d'Association** | 🏢 | Menu déroulant en haut de l'écran. Options : "Toutes mes associations" + chaque association par nom. Le filtre s'applique immédiatement à tous les modules. |
| **Tableau de Bord** | 📊 | **Mode "Toutes"** : Résumé consolidé (prochaines échéances, montants totaux, alertes). **Mode "Association X"** : Résumé de l'association (prochaine session, mon solde, prochain bénéficiaire, annonces du bureau). |
| **Mes Tontines** | 💰 | Liste des tontines actives, historique des levées, suivi de mes cotisations, prochain bénéficiaire, ordre de passage, statut de mes obligations. |
| **Épargne & Investissement** | 🏦 | Soldes des comptes épargne, projets d'investissement collectifs, suivi de la rentabilité, historique des versements et retraits. |
| **Prêts & Crédit** | 💳 | Demandes de prêt, prêts en cours, échéancier de remboursement, historique des prêts, taux d'intérêt appliqués, statut (accordé, en attente, remboursé). |
| **Solidarité & Aides** | 🤝 | Caisses de solidarité, demandes d'aide (naissance, décès, mariage, maladie, voyage), statut des demandes, historique des contributions et décaissements. |
| **Sessions & Tirages** | 📅 | Calendrier des sessions passées et à venir, résultats des tirages au sort, historique des bénéficiaires, procès-verbaux de session. |
| **Membres** | 👥 | Liste des membres de l'association, rôles, statuts, historique d'activité, réputation, possibilité pour le bureau de gérer les adhésions. |
| **Modèles d'Associations** | 📋 | Accès à la bibliothèque de modèles pour créer une nouvelle association. |
| **Notifications** | 🔔 | Centre de notifications : rappels de cotisation, annonces du bureau, validations, alertes de session. |
| **Profil Membre** | 👤 | Mes informations personnelles, mes associations, paramètres de notification, sécurité du compte. |

### 2.3. Profil de l'Espace Membre

| Élément Visuel | Description |
| :--- | :--- |
| **Couleur dominante** | Couleur chaude et conviviale (ex : vert, orange) pour une expérience utilisateur accueillante. |
| **Sélecteur d'Association** | Élément le plus visible, toujours présent en haut. Indique clairement dans quel contexte l'utilisateur navigue. |
| **Filtre visuel** | Lorsqu'une association est sélectionnée, un bandeau de couleur ou un liseré rappelle "Vous êtes dans : Association X". |
| **Icône d'aide contextuelle** | Des "?" sont placés à côté des termes complexes pour expliquer le vocabulaire local (tontine, njangui, etc.). |

---

## PARTIE 3 : BASCULE ENTRE LES DEUX ESPACES

Lorsqu'un utilisateur possède à la fois un rôle Système et une affiliation à au moins une association, un mécanisme de bascule est proposé.

### 3.1. Schéma de Bascule

```text
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   ESPACE ADMINISTRATION                    ESPACE MEMBRE         │
│   ┌──────────────────────┐    BASCULE    ┌──────────────────┐   │
│   │  Menu Admin          │ ◄──────────► │  Menu Membre     │   │
│   │  - Tableau de bord   │              │  - Tableau bord  │   │
│   │  - Utilisateurs      │              │  - Tontines      │   │
│   │  - Rôles             │              │  - Épargne       │   │
│   │  - Associations      │              │  - Prêts         │   │
│   │  - Audit             │              │  - Solidarité    │   │
│   │  - Logs              │              │  - Sessions      │   │
│   │  - Paramètres        │              │  - Membres       │   │
│   │                      │              │                  │   │
│   │  [Espace Membre] ────┼──────────────┼── [Espace Admin] │   │
│   │   Bouton de bascule  │              │  Bouton bascule  │   │
│   └──────────────────────┘              └──────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2. Règles de Bascule

| Règle | Description |
| :--- | :--- |
| **Visibilité** | Le bouton de bascule n'apparaît que si l'utilisateur a effectivement les deux qualités. |
| **Position** | En bas du menu (sidebar) ou dans le menu Profil, clairement identifiable avec une icône de permutation (🔄). |
| **Session** | La bascule ne déconnecte pas l'utilisateur. Il reste dans la même session. |
| **Retour** | Depuis l'Espace Membre, un bouton identique permet de revenir à l'Espace Administration. |

---

## PARTIE 4 : COMPARAISON VISUELLE DES DEUX INTERFACES

| Aspect | Espace Administration | Espace Membre |
| :--- | :--- | :--- |
| **Couleur dominante** | Froid (bleu foncé, gris) | Chaud (vert, orange, blanc) |
| **Objectif** | Gérer la plateforme, superviser, auditer | Gérer mes tontines, ma solidarité, mon épargne |
| **Menu principal** | Gestion système (Sidebar verticale sur desktop) | Modules métier (Barre horizontale ou Bottom bar) |
| **Élément central** | Liste des utilisateurs / Transactions | Sélecteur d'association |
| **Ton** | Administratif, technique | Convivial, communautaire, vocabulaire local |
| **Badge** | "Mode Administration" | Nom de l'association sélectionnée |
| **Données affichées** | Toutes les données de la plateforme | Uniquement mes données dans l'association |
| **Exemples de Permissions** | Peut voir toutes les associations, modifier les rôles | Peut voir seulement ses associations, cotiser, emprunter |

---

### 5. Exemple : Parcours d'un Super-Utilisateur (Admin + Membre)

```text
M. KAMGA se connecte
         │
         ▼
┌─────────────────────┐
│ ESPACE MEMBRE       │  ← Arrivée par défaut
│ (Association A)     │
│ - Voir mes tontines │
│ - Payer cotisation  │
└─────────┬───────────┘
          │ Il clique sur [Espace Admin]
          ▼
┌─────────────────────┐
│ ESPACE ADMIN        │
│ - Voir les logs     │
│ - Créer un rôle     │
└─────────┬───────────┘
          │ Il clique sur [Espace Membre]
          ▼
┌─────────────────────┐
│ ESPACE MEMBRE       │  ← Retour à la vue membre
│ (Association A)     │
└─────────────────────┘
```

---

Cette séparation stricte des deux espaces garantit une expérience utilisateur optimale : les administrateurs disposent d'outils puissants et techniques, tandis que les membres profitent d'une interface simple, conviviale et centrée sur leurs besoins quotidiens de gestion de tontines et de solidarité.

---

## MODULE 4 : AUTHENTIFICATION SOCIALE (SOCIAL LOGIN) – ESPACE MEMBRE

### 1. Objectif
Permettre aux utilisateurs de créer un compte ou de se connecter à l'application en utilisant leurs identifiants existants provenant de plateformes tierces (Google, Facebook, X/Twitter, LinkedIn, etc.), sans avoir à créer et retenir un mot de passe spécifique à l'application.

**Bénéfices Attendus :**
- Simplifier et accélérer le processus d'inscription (onboarding).
- Réduire les abandons lors de la création de compte.
- Diminuer les problèmes de mot de passe oublié et les tickets de support associés.
- Offrir une expérience utilisateur moderne et fluide, adaptée au contexte africain où l'usage des réseaux sociaux est très répandu.

### 2. Protocoles Techniques de Référence
L'intégration repose sur deux standards ouverts de l'IETF :

| Protocole | Rôle dans l'Application | Détail Technique |
| :--- | :--- | :--- |
| **OAuth 2.0** | Cadre d'autorisation. Permet à l'application d'accéder aux données du profil utilisateur hébergées chez le fournisseur, avec le consentement explicite de l'utilisateur. L'application ne voit jamais le mot de passe du fournisseur tiers. | L'application obtient un Access Token à portée limitée (ex: profile, email). Ce token est utilisé pour appeler l'API du fournisseur et récupérer les informations de base. |
| **OpenID Connect (OIDC)** | Couche d'authentification au-dessus d'OAuth 2.0. Vérifie l'identité de l'utilisateur de manière standardisée et sécurisée. | Le fournisseur délivre un ID Token (au format JWT - JSON Web Token) signé numériquement. Ce token contient les informations d'identité vérifiées (sub, email, name, picture). Il est validé par l'application pour s'assurer de son authenticité. |

**Résumé :** OAuth 2.0 donne la permission d'accès. OIDC prouve qui vous êtes.

### 3. Fournisseurs d'Identité Sociaux Pris en Charge

| Fournisseur | Disponibilité Web | Disponibilité Mobile | Remarques |
| :--- | :--- | :--- | :--- |
| **Google** | ✅ OAuth 2.0 / OIDC | ✅ Google Sign-In SDK (Android/iOS) | Le plus répandu. Standard OIDC, simple à intégrer. |
| **Facebook** | ✅ OAuth 2.0 | ✅ Facebook Login SDK (Android/iOS) | Très populaire en Afrique. Nécessite une app Facebook Business vérifiée. |
| **X (Twitter)** | ✅ OAuth 2.0 | ✅ API Twitter | Usage en croissance. Authentification via OAuth 2.0 avec PKCE. |
| **LinkedIn** | ✅ OAuth 2.0 / OIDC | ✅ SDK LinkedIn | Utile pour les associations professionnelles. |

### 4. Architecture d'Intégration : Solution Recommandée
Pour garantir la sécurité, la maintenabilité et la rapidité d'intégration, il est recommandé d'utiliser un service d'authentification clé en main (Auth Provider as a Service).

#### 4.1. Comparaison des Solutions Recommandées

| Solution | Avantages | Inconvénients | Coût Indicatif |
| :--- | :--- | :--- | :--- |
| **Firebase Auth** | Gratuit (limites généreuses), très bonne intégration mobile (Android/iOS), UI pré-construite (FirebaseUI), gestion native des sessions. | Moins flexible pour le web si l'on veut une UI totalement personnalisée. | Gratuit (quotas illimités pour l'auth sociale). |
| **Clerk** | Excellente UI/UX, composants React/Next.js prêts à l'emploi, gestion du cycle de vie utilisateur avancée, dashboard de gestion. | Payant au-delà d'un certain nombre d'utilisateurs actifs. | Freemium (10 000 MAU gratuits). |
| **Auth0** | Très flexible, supporte de nombreux fournisseurs, règles personnalisables, idéal pour les projets d'entreprise. | Courbe d'apprentissage plus raide, devient cher avec le volume. | Freemium (7 500 utilisateurs gratuits). |

**Recommandation pour ce projet :** **Firebase Auth** (gratuit, excellente couverture Afrique, SDK mobile robustes pour l'intégration Orange Money / MTN MoMo à terme).

---

## MODULE 12 : WALLET INTÉGRÉ (PORTEFEUILLE ÉLECTRONIQUE)

Le Wallet (portefeuille électronique) est le cœur du système transactionnel de chaque membre. Il agit comme un compte pivot personnel, indépendant des associations, mais qui permet d'interagir financièrement avec elles.

### 12.1. Fonctions Principales du Wallet
- **Paiement des Engagements** : Le membre utilise le solde de son Wallet pour régler ses cotisations, rembourser ses prêts ou payer ses amendes dans toutes les associations auxquelles il appartient.
- **Réception de Fonds** : Les gains de tontines, les aides de solidarité, ou les dividendes d'épargne versés par les associations sont directement crédités sur ce Wallet personnel.
- **Tableau de Bord Financier** :
  - **Solde Actuel** : Montant total disponible en temps réel.
  - **Historique** : Journal détaillé et immuable de toutes les transactions entrantes et sortantes (horodatage, nature de la transaction, association concernée, référence de paiement).

### 12.2. Opérations Externes (Entrées / Sorties)
- **Dépôts (Approvisionnement)** :
  - Rechargement du Wallet via Mobile Money (Orange Money, MTN MoMo, etc.), Cartes Bancaires (Visa/Mastercard), ou virements bancaires.
- **Retraits** :
  - Transfert du solde disponible du Wallet vers le compte Mobile Money personnel du membre ou vers son compte bancaire.
- **Virements Internes (Transferts P2P)** :
  - Possibilité de transférer des fonds de son Wallet vers le Wallet d'un autre membre de la plateforme Tchoua.

### 12.3. Gestion du Wallet côté Administration
Dans l'Espace Administration (Utilisateurs Système), un profil/rôle spécifique permet de gérer et superviser les comptes Wallets :
- **Profil "Gestionnaire Wallet" / "Auditeur Financier"** :
  - Consultation des soldes consolidés et traçabilité des flux globaux de la plateforme.
  - Supervision des opérations de dépôt et de retrait (statuts en attente, succès, échec) pour résoudre les litiges (réconciliations bancaires, paiements Mobile Money non aboutis).
  - Gestion des cas d'anomalies (blocage temporaire d'un compte Wallet suspect, annulation de transactions prouvées frauduleuses).
  - *Note : L'administration ne peut pas débiter un Wallet personnel sans une action système justifiée (recouvrement légal, annulation).*

### 12.4. Gestion des Frais
| Type d'Opération | Frais | Description |
| :--- | :--- | :--- |
| Dépôt Mobile Money | 1 % (min 100 FCFA, max 5 000 FCFA) | Frais prélevés par l'opérateur ou la plateforme. |
| Dépôt Carte Bancaire | 2,5 % | Frais de passerelle de paiement (Stripe/Paystack). |
| Dépôt en espèces | 500 FCFA fixe | Commission agent partenaire. |
| Retrait Mobile Money | 500 FCFA fixe | Frais opérateur + plateforme. |
| Retrait Virement Bancaire | 1 000 FCFA fixe | Frais bancaires. |
| Transfert Wallet à Wallet | Gratuit | Pas de frais entre membres. |
| Paiement vers association | Gratuit | Pas de frais internes. |
| Réception de fonds | Gratuit | Aucun frais sur la réception. |

*Paramétrage des frais : Configurable par l'Administrateur dans l'Espace Administration.*

### 12.5. Sécurité et Plafonds
#### Règles de Sécurité
| Règle | Description |
| :--- | :--- |
| Authentification forte (2FA) | Obligatoire pour les retraits > 100 000 FCFA et les transferts > 200 000 FCFA. |
| OTP (One-Time Password) | Code à usage unique envoyé par SMS/Email pour valider les transactions sensibles. |
| Biométrie | Empreinte digitale ou Face ID pour valider les transactions sur mobile (à terme). |
| Limites de montant | Plafonds journaliers, hebdomadaires et mensuels configurables. |
| Délai de réclamation | 48h pour contester une transaction. |
| Anti-fraude | Détection des transactions suspectes (montants inhabituels, adresses IP multiples). |
| Journal immuable | Toutes les transactions sont enregistrées dans un journal horodaté et inaltérable. |

#### Plafonds par Défaut
| Plafond | Montant (FCFA) |
| :--- | :--- |
| Dépôt maximum par transaction | 1 000 000 |
| Dépôt maximum par jour | 2 000 000 |
| Retrait maximum par transaction | 500 000 |
| Retrait maximum par jour | 1 000 000 |

---

## MODULE 13 : CALENDRIER FINANCIER CONSOLIDÉ

Le module Calendrier offre une vue d'ensemble sur le planning associatif et financier du membre. Il agrège les données de toutes les associations auxquelles il appartient pour éviter les oublis et aider à la planification budgétaire.

### 13.1. Affichage des Événements
Le calendrier centralise et affiche :
- **Les réunions (AssocMeeting)** : Date, heure, lieu, et association concernée.
- **Les sessions d'activités (ActivitySession)** : Les séances de tontine, d'épargne, ou autres activités prévues.

### 13.2. Prévisions Financières (Dépenses & Revenus)
Pour chaque événement listé, le calendrier calcule et met en évidence :
- **Prévisions de Dépenses (Sorties)** : Le montant total que le membre doit cotiser pour cette session (ex: part de tontine, cotisation statutaire). L'information est affichée en rouge ou avec une icône de sortie.
- **Prévisions de Revenus (Entrées)** : Si le membre est désigné comme bénéficiaire d'une tontine ou d'une aide lors de cette session, le montant estimé à recevoir est affiché en vert ou avec une icône de rentrée d'argent.

### 13.3. Modes de Vue
L'interface propose plusieurs niveaux de granularité pour s'adapter au besoin de planification :
- **Vue Mensuelle (Par défaut)** : Grille classique d'un mois affichant un résumé quotidien des événements et la somme nette (Revenus - Dépenses) attendue pour les jours chargés.
- **Vue Hebdomadaire** : Un emploi du temps détaillé par heure pour visualiser précisément l'agenda des réunions de la semaine.
- **Vue Annuelle** : Une vue macroscopique mettant en surbrillance les mois ou les périodes de forte activité financière (ex: mois de levée de grosse tontine).

### 13.4. Interactions
- **Clic sur un jour/événement** : Ouvre un panneau latéral ou une modale détaillant le décompte exact des contributions attendues et la liste des réunions prévues ce jour-là avec des liens rapides vers les espaces des associations correspondantes.

---

## MODULE 14 : DÉPLOIEMENT ET DÉMARRAGE (TECH STACK)

Ce projet est une application [Next.js](https://nextjs.org/) initialisée avec `create-next-app`.

### Démarrage Rapide (Développement)

Pour lancer le serveur de développement en local, exécutez l'une des commandes suivantes :

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
# ou
bun dev
```

Ouvrez ensuite [http://localhost:3000](http://localhost:3000) dans votre navigateur pour visualiser le résultat.

Vous pouvez commencer à modifier l'application en éditant `app/page.tsx` ou les fichiers du dossier `src/app/`. Les pages se mettront à jour automatiquement grâce au Hot Reloading.

### Déploiement

La façon la plus simple de déployer cette application Next.js est d'utiliser la [Plateforme Vercel](https://vercel.com/new).

Pour plus de détails, consultez la [Documentation de déploiement Next.js](https://nextjs.org/docs/app/building-your-application/deploying).


---

# PARTIE II — ARCHITECTURE ARP (ASSOCIATION RESOURCE PLANNING)
*Adapté de l'étude fonctionnelle et technique de référence : `Tchoua_Etude_Complete_ARP_168_pages.pdf` (36 domaines de conception, 144 invariants métier, 180 scénarios de recette, 23 328 configurations combinatoires).*

## 15. DÉCISIONS STRUCTURANTES & NOYAU COMMUN DE GESTION

L'évolution de Tchoua vers un **ARP (Association Resource Planning)** complet repose sur six décisions structurantes :
1. **Noyau commun de gestion** : séparer strictement **Personne**, **Compte utilisateur**, **Adhésion datée**, **Activité / Contrat**, **Obligation (créance)**, **Paiement (flux confirmé)** et **Affectation**.
2. **Fonds, Comptes et Budgets distincts** : le lieu de conservation (espèce, banque, Mobile Money) ne définit pas l'usage autorisé. Liquidité comptable, montant réservé et disponibilité prudente sont mesurés séparément.
3. **Règles versionnées et datées** : chaque règle stocke assiette, taux, unité, date d'effet, exceptions et autorité d'approbation afin de pouvoir rejouer tout calcul historique sans réécrire le passé.
4. **Invariants non désactivables** : isolation stricte des associations, unicité des paiements, traçabilité d'audit, conservation des sommes et contrôle de concurrence.
5. **Arbitrages documentaires explicites** :
   - Automatisation tontine : distinguer calcul du pot opérationnel et sélection/attribution atomique.
   - Multi-devises : devise fonctionnelle par entité et conversion explicite tracée (aucune addition directe de devises).
   - Visibilité des historiques : transparence agrégée pour les membres, accès restreint aux pièces médicales/personnelles.
   - Assiette des enchères : toujours nommer l'assiette (cotisation, droit brut, pot ou forfait) plutôt qu'un pourcentage ambigu.
   - Âge enfant (aides) : configurer explicitement le cas limite exact de 10 ans.
   - Sanctions successives : choisir explicitement le mode de cumul (additif, remplacement ou maximum).
   - Dividendes HORIZON : justifier tout écart entre intérêts encaissés et base distribuée sans inventer de produit.
   - Délai de convocation AG : la règle spécifique validée (ex. FEV 45 jours) prime sur le défaut générique (30 jours).

### Profils associatifs de départ
Tchoua propose 10 modèles paramétrables (sans conférer automatiquement une qualification juridique) :
- **Tontine de quartier**, **Amicale familiale**, **Section de type SLD**, **Fédération de type FEV**, **Investissement de type HORIZON**, **Groupement agricole**, **Club culturel ou sportif**, **Association de développement**, **Réseau professionnel**, **Diaspora multi-pays** *(plus profils Coopérative / Mutuelle à adapter selon le cadre légal).*

---

## 16. RÉFÉRENTIEL DES 36 DOMAINES ET 144 INVARIANTS MÉTIER

### Bloc A — Organisation, Membres et Gouvernance (D01–D09)
| Domaine | Objet | Invariants obligatoires |
| :--- | :--- | :--- |
| **D01** | Identité et formes d'organisation | `ORG01` Identifiant stable survit au renommage · `ORG02` Activation exige responsables, règles, devise et décision · `ORG03` Dissolution bloque nouveaux engagements mais autorise liquidation · `ORG04` Modèle ≠ statut juridique déposé. |
| **D02** | Fédérations, sections et héritage | `FED01` Aucun cycle hiérarchique · `FED02` Règle nationale bloquante prime ; contrats conclus gardent leur version · `FED03` Transfert modifie deux positions réciproques sans produit fictif · `FED04` Changement de parent daté sans rétroactivité. |
| **D03** | Adhésions, membres et sorties | `MEM01` Matricule unique par association (distinct de l'ID global) · `MEM02` Acceptation ≠ paiement du droit d'entrée · `MEM03` Suspension ne détruit ni épargne ni dette · `MEM04` Sortie produit un relevé contradictoire. |
| **D04** | Familles, ayants droit et confidentialité | `FAM01` Âge calculé à la date de l'événement · `FAM02` Seuil exact de 10 ans explicité · `FAM03` Relation contestée masquée de l'annuaire · `FAM04` Changement de destinataire ne modifie pas l'ouvrant droit. |
| **D05** | Gouvernance, mandats et votes | `GOV01` Liste électorale et politique figées avant ouverture · `GOV02` Unicité du droit de vote (direct ou procuration) · `GOV03` Déport et recalcul du dénominateur · `GOV04` Admin technique ne peut fabriquer un scrutin ni modifier un résultat clos. |
| **D06** | Réunions, calendrier et présence | `REU01` Récurrence en fuseau local, stockage UTC · `REU02` Report ne duplique pas la cotisation · `REU03` Présence ≠ encaissement · `REU04` Amendes automatiques contestables et liées au constat. |
| **D07** | Discipline, sanctions et recours | `SAN01` Un constat = une seule sanction par règle/version · `SAN02` Référence à l'article applicable · `SAN03` L'auteur du constat ne tranche pas seul son recours · `SAN04` Annulation par contrepassation auditée. |
| **D08** | Documents, règlements et signatures | `DOC01` Empreinte (hash) détecte modification sans prouver l'identité · `DOC02` Règle active à sa date d'effet après approbation · `DOC03` Pièces exécutables/infectées en quarantaine · `DOC04` Suppression de compte préserve les pièces d'audit. |
| **D09** | Moteur de règles et contrats d'activité | `REG01` Chaque opération garde version de règle, entrées et résultat arrondi · `REG02` Incompatibilité bloquante empêche publication · `REG03` Arithmétique décimale/entière exacte (jamais de flottants binaires) · `REG04` Invariants de sécurité non désactivables. |

### Bloc B — Flux Financiers, Tontines, Épargne et Crédit (D10–D21)
| Domaine | Objet | Invariants obligatoires |
| :--- | :--- | :--- |
| **D10** | Cotisations, appels et affectations | `COT01` Dû net = appel + ajustements - remises - affectations · `COT02` Trop-perçu = crédit (reste dû ≥ 0) · `COT03` Unicité (membre, activité, échéance, version) · `COT04` Paiement groupé conserve payeur réel et bénéficiaires. |
| **D11** | Paiements reçus et rapprochement | `PAY01` Unicité de référence prestataire · `PAY02` Timeout réseau ≠ échec financier · `PAY03` Frais explicites sans réduction silencieuse de cotisation · `PAY04` Remboursement lie paiement initial et écritures inverses. |
| **D12** | Caisses, budgets et écritures | `FIN01` Total débit = total crédit par pièce et devise · `FIN02` Transfert interne ≠ produit/charge · `FIN03` Réservation réduit le disponible sans changer la trésorerie · `FIN04` Aucun fonds affecté consommé sans autorisation. |
| **D13** | Souscriptions, parts et fractions | `PAR01` Droits distribués + restants = droits contractuels · `PAR02` Bénéficiaire précoce reste redevable des cotisations futures · `PAR03` Montant fixe exige plan de financement compatible · `PAR04` Fraction non arrondie en part entière à l'avantage. |
| **D14** | Attributions, rotations et tirages | `ATT01` Quantité limitée par pot finançable, plafond et droits restants · `ATT02` Réservation/consommation atomiques · `ATT03` Tirage refusé non répétable discrètement · `ATT04` Paiement échoué ≠ succès fictif. |
| **D15** | Enchères, décotes et partage | `ENC01` Net = droit brut - décote - frais supportés · `ENC02` Décote reste en trésorerie (pas de double encaissement) · `ENC03` Offre gagnante irrévocable · `ENC04` Horodatage serveur immuable et égalités déterministes. |
| **D16** | Cycles, clôtures et défaillances | `CYC01` Clôture réconcilie encaissements, distributions, reports, frais et transferts · `CYC02` Droit non servi tracé · `CYC03` Dette d'un défaillant survit à la clôture · `CYC04` Solde repris par écriture identifiée. |
| **D17** | Épargne, dépôts, retraits et rémunération | `EPA01` Disponible = acquis - bloqués - réservés · `EPA02` Dépôt non confirmé ne produit ni dispo ni intérêt · `EPA03` Capitalisation séparée · `EPA04` Remboursement exige liquidité réelle. |
| **D18** | Prêts : demandes, plafonds et décision | `PRE01` Autorisable = min(liquidité, limite membre, limite produit, concentration) · `PRE02` Offre expirée libère réservation · `PRE03` Demandeur ne valide pas seul son prêt · `PRE04` Cautions et encours intégrés sans double comptage. |
| **D19** | Échéanciers, intérêts et coût du crédit | `ECH01` Principal constant : `a = P/n`, `I(t) = CRD(t-1)*i` · `ECH02` Annuité constante : `A = P*i/(1-(1+i)^-n)` (si `i=0`, `P/n`) · `ECH03` Aucun frais caché dans le principal · `ECH04` Rééchelonnement versionné avec comparatif. |
| **D20** | Remboursements, retards et restructurations | `REC01` Paiement non imputé au-delà du montant confirmé disponible · `REC02` Pénalités sur assiette contractuelle plafonnée · `REC03` Restructuration conserve ancien échéancier, retards et paiements · `REC04` Recouvrement après perte tracé explicitement. |
| **D21** | Garanties, cautions et engagements | `GAR01` Capacité disponible = valeur admissible - engagements actifs · `GAR02` Garant ne s'auto-évalue pas · `GAR03` Réalisation ≤ dette + frais autorisés · `GAR04` Garantie expirée = alerte, pas suppression du prêt. |

### Bloc C — Solidarité, Investissements, Projets et Ressources (D22–D30)
| Domaine | Objet | Invariants obligatoires |
| :--- | :--- | :--- |
| **D22** | Solidarité : catalogue et droits sociaux | `SOL01` Droit = min(formule, plafonds résiduels) · `SOL02` Aides approuvées non payées consomment le plafond · `SOL03` Seuil minimum de jours ≠ jours indemnisables · `SOL04` Cumul local + national seulement si autorisé. |
| **D23** | Demandes d'aide, paiements et recours | `AID01` Évaluation avec version applicable à l'événement · `AID02` Décision, réservation et plafond atomiques · `AID03` Trésorier sans accès automatique aux pièces médicales · `AID04` Récupération d'indu = créance distincte. |
| **D24** | Réserves solidarité et prévision | `RES01` Solde projeté = initial + entrées - sorties datées · `RES02` Créance ≠ entrée certaine (taux de recouvrement explicite) · `RES03` Aides approuvées non recomptées · `RES04` Réductions datées par décision. |
| **D25** | Investissements, capital et dividendes | `DIV01` Quote-part = poids / somme poids (somme nulle interdite) · `DIV02` Somme répartie = montant décidé (méthode des plus forts restes) · `DIV03` Principal remboursé ≠ intérêt distribuable · `DIV04` Run immuable. |
| **D26** | Projets, subventions, dons et campagnes | `PRO01` Promesse non encaissée ne finance pas une sortie · `PRO02` Dépense ventilée comptée une seule fois · `PRO03` Restrictions bailleur vérifiées avant engagement · `PRO04` Clôture traite avances et reliquats. |
| **D27** | Achats groupés, stocks et nature | `ACH01` Stock final = initial + entrées - sorties - pertes · `ACH02` Coûts imputés = coût collectif · `ACH03` Réception partielle ≠ livraison totale · `ACH04` Apport nature ≠ paiement monétaire + don simultané. |
| **D28** | Patrimoine matériel, bénévolat et temps | `PAT01` Un bien a localisation et détenteur principal · `PAT02` Heures non dupliquées sur même créneau · `PAT03` Crédit temps ≠ créance monétaire automatique · `PAT04` Cession exige décision et sortie du registre. |
| **D29** | Événements, collation et logistique | `EVE01` Inscription ≤ capacité (sauf surbooking autorisé) · `EVE02` Forfait net hôte = forfait - retenues autorisées · `EVE03` Retenue pour arriérés diminue dette (pas nouvel encaissement) · `EVE04` Annulation sépare billets et forfaits. |
| **D30** | Communauté, services, formation et distinctions | `COM01` Message chat ≠ décision statutaire · `COM02` Coordonnées et difficultés masquées par défaut · `COM03` Gamification ne révèle ni dettes ni dossiers sociaux · `COM04` IA limitée aux données autorisées et confirmation humaine. |

### Bloc D — Pilotage, Sécurité, Architecture et Exploitation (D31–D36)
| Domaine | Objet | Invariants obligatoires |
| :--- | :--- | :--- |
| **D31** | Rapports, tableaux de bord et consolidation | `REP01` Indicateur documenté (formule, source, période) · `REP02` Pas d'addition multi-devises sans conversion · `REP03` Transfert interne n'augmente pas recettes consolidées · `REP04` Masquage des petits effectifs sensibles. |
| **D32** | Sécurité, habilitations et protection des données | `SEC01` Vérification `(utilisateur, association, objet)` sur chaque requête · `SEC02` Révocation immédiate de mandat · `SEC03` Aucune URL publique devinable pour pièces/exports · `SEC04` Corrections financières par opérations liées uniquement. |
| **D33** | Architecture données, API et intégrations | `ARC01` État métier + événement outbox dans la même transaction · `ARC02` Consommateurs idempotents · `ARC03` Contraintes uniques et clés de périmètre · `ARC04` Montants, devises et dates valeur typés. |
| **D34** | Mobile, accessibilité, langues et notifications | `MOB01` Synchronisation revalide identité, mandat, version et dispo · `MOB02` Brouillon synchronisé une seule fois · `MOB03` Notifications écran verrouillé sans détail sensible · `MOB04` Traduction ne modifie ni montant ni devise. |
| **D35** | Administration, migration, exploitation et support | `OPS01` Import idempotent par lot · `OPS02` Rapprochement par membre, activité, compte et devise avant bascule · `OPS03` Restauration testée jusqu'aux pièces · `OPS04` Correctif de prod par procédure métier et audit. |
| **D36** | Internationalisation, devises et modèles pays | `INT01` Montant sans devise invalide · `INT02` Précision monétaire issue du référentiel · `INT03` Cours figé sur opération confirmée · `INT04` Modèles pays activés après validation locale. |

---

## 17. ANNEXES TECHNIQUES, FIABILITÉ & RECETTE

- **Modèle conceptuel cible (Annexe 11)** : `Organisation 1→N Adhésion N→1 Personne` ; `Organisation 1→N Activité 1→N Contrat` ; `Contrat 1→N Obligation` ; `Paiement N↔N Obligation` (via `Affectation`) ; `Opération 1→N Écriture` ; `Fonds 1→N Réservation`.
- **Contrat transactionnel et reprise après panne (Annexe 12)** : soumission avec clé d'idempotence et version attendue → contrôle droits serveur → vérification invariants → engagement atomique (`état + journal + réservation + outbox`) → exécution asynchrone idempotente → rapprochement externe.
- **Couverture combinatoire (Annexes 06–08)** : 23 328 configurations bornées sur 10 axes (`organisation`, `adhesion`, `cotisation`, `tontine`, `credit`, `aide`, `canal`, `devise`, `connexion`, `validation`), 19 cas couvrant 100 % des 351 paires, 10 triples critiques (concurrence épargne/garantie/retrait, enchères sur fractions, double fonds social, etc.) et 180 scénarios de recette.
- **Critères d'acceptation (Annexe 14)** : zéro écart financier inexpliqué, zéro accès inter-association, zéro double consommation sous concurrence, RPO 24 h / RTO 4 h et latence p95 < 2 s à valider sur environnement cible.

---

## 18. EXTENSIONS PLATEFORME IMPLÉMENTÉES (WEB & MOBILE)

- **Gestion libre & import de membres** (`POST /api/associations/[id]/members`, `POST /api/associations/[id]/members/import`) : réservé au bureau/fondateur ; unicité globale email/mobile (réutilisation d'un compte existant sans doublon) ; import CSV/Excel/vCard (`.vcf`) ; confirmation par email HTML élevant automatiquement à **KYC1** (`/api/invites/confirm`) et liens **WhatsApp / SMS**.
- **Single Sign-On (SSO)** : inscription et connexion via **Google, Facebook, LinkedIn et Instagram** dans `src/lib/auth.ts`, `/login`, `/register` et `tchoua-mobile/App.tsx`.
- **Parrainage & Gamification** (`/api/referrals/invite`) : chaque membre peut inviter jusqu'à **5 emails** par envoi ou partager les liens Web & App Mobile via **WhatsApp** et depuis les **contacts téléphone** sur mobile (`expo-contacts`), en gagnant des points Gamification (`User.score` + `ScoringRecord`).
