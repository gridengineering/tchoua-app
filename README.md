# Tchoua App - Solidarité Digitale

## À Propos de Tchoua

Les organisations qui pratiquent l'économie sociale et solidaire, telles que les associations, les coopératives, les entreprises sociales, les groupes d'entraide et les mouvements sociaux, visent la viabilité et la durabilité à long terme et la transition de l'économie informelle à l'économie formelle. Opérant dans tous les secteurs de l'économie, elles mettent en pratique un ensemble de valeurs intrinsèques à leur fonctionnement et conformes au respect des personnes et de la planète, à l'égalité et à l'équité, à l'interdépendance, à l'autogestion, à la transparence et à la responsabilité, ainsi qu'à la promotion du travail décent et des conditions de vie dignes.

C'est dans cette vision que s'inscrit **Tchoua**, une plateforme digitale conçue pour outiller, structurer et sécuriser la gestion financière et administrative de ces associations, tontines et groupes d'entraide.

## Fonctionnalités Principales de la Plateforme

Tchoua propose une suite de modules complets pour répondre aux exigences complexes de gouvernance de l'économie sociale :

- **Module 1 : Configuration et Paramétrage Global** - Création guidée d'associations, paramétrage des règles, réunions, structure du bureau, validation du règlement intérieur article par article et gestion des relations associations parent/fille.
- **Module 2 : Gestion des Membres** - Processus d'adhésion avec système de parrainage, suivi détaillé des profils (incluant les informations familiales essentielles pour les aides sociales), et historique des statuts (Actif, Suspendu, Radié).
- **Module 3 : Gestion des Réunions et Discipline** - Suivi en temps réel par le Secrétariat des présences, gestion des retards, des absences justifiées/non justifiées, organisation de la collation rotative, et application d'amendes disciplinaires.
- **Module 4 : Tontines (Cotisations)** - Support de modèles variés : tontines classiques à tirage et tontines à enchères. Gestion stricte des échecs de paiement, pénalités, garanties (avalistes) et redistribution des résidus.
- **Module 5 : Fonds de Solidarité** - Alimentation par cotisations fixes ou prélèvements sur cagnottes. Gestion des décaissements et aides pour des événements spécifiques (santé, heureux événements, décès).
- **Module 6 : Fonds d'Investissement et Prêts (Épargne & Crédit)** - Outil d'épargne avec octroi de crédits basé sur un algorithme d'arbitrage de solvabilité. Calcul automatisé des intérêts, échéanciers, pénalités de retard et versement de dividendes annuels.
- **Module 7 : Gestion Financière, Recouvrement et Comptabilité** - Gestion de la caisse, traçabilité des virements, relevés de compte individuels, et algorithme de compensation des dettes (recouvrement croisé sur les avoirs du membre).
- **Module 8 : Moteur de Fréquence et Planification** - Programmation flexible des sessions (journalière, hebdomadaire, mensuelle, annuelle) avec ajustement automatique pour les jours fériés.
- **Module 9 : Répartition Financière (Algorithme)** - Système intelligent traitant un versement global de membre pour le répartir automatiquement entre ses différentes obligations (tontine, prêt, solidarité) selon un ordre de priorité strict.
- **Module 10 : Architecture des Données** - Schéma relationnel robuste (Prisma) modélisant le multi-associations, les multi-activités et le cycle de vie financier.
- **Module 11 : Authentification Sociale et Droits d'Accès** - Authentification fluide via réseaux sociaux (Google, Facebook). Séparation stricte via RBAC entre les Utilisateurs Système (Administration plateforme) et les Membres (Bureau et simples adhérents).
- **Module 12 : Wallet Intégré (Portefeuille Électronique)** - Compte pivot personnel permettant au membre de payer ses engagements ou de recevoir des fonds (gains, dividendes). Intègre les paiements Mobile Money (Orange Money, MTN MoMo).
- **Module 13 : Calendrier Financier Consolidé** - Vue unifiée de l'agenda d'un membre à travers toutes ses associations, prévoyant ses futures entrées (vert) et sorties (rouge) de fonds.

## Déploiement et Démarrage (Tech Stack)

Ce projet est une application [Next.js](https://nextjs.org/) utilisant une architecture moderne (React, TypeScript, Prisma).

### Démarrage Rapide (Local)

Pour lancer le serveur de développement en local :

```bash
npm run dev
# ou
yarn dev
```

Ouvrez ensuite [http://localhost:3000](http://localhost:3000) dans votre navigateur. Les modifications apportées dans le code (dossier `src/app/`) sont mises à jour automatiquement.

### Déploiement

La solution est optimisée pour être déployée via la [Plateforme Vercel](https://vercel.com/new). Consultez la [documentation Next.js](https://nextjs.org/docs/app/building-your-application/deploying) pour plus d'informations sur les environnements de production.
