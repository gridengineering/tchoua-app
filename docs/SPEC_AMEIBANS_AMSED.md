# Spécification — AMEIBANS, AMSED et généralisation multi-formes

Version 1.0 — 13 novembre 2026
Sources : Statuts AMEIBANS révisés 2018 ; Règlement intérieur du Comité directeur (2013 et recueil 2023) ; Règlement intérieur AMSED 2024 ; Recueil des textes de base et textes annexes (décembre 2023).

---

## 1. Pourquoi ces deux associations sont structurantes

L'**AMEIBANS** (Amicale de l'Élite Extérieure et Intérieure Bansoa) est une **amicale nationale** de ressortissants, régie par la loi camerounaise n° 90/053 du 19 décembre 1990. Elle fédère des **sections** locales et porte des activités de solidarité, de développement et de promotion culturelle.

L'**AMSED** (AMEIBANS Section de Douala) est le **démembrement local** de l'AMEIBANS pour le Littoral. Elle applique les statuts nationaux et son propre règlement intérieur, avec des activité de tontine, de fonds de solidarité, de fonds d'investissement, de collation et d'aides familiales.

À eux deux, ils couvrent les deux niveaux que la plateforme doit savoir gérer :

- **niveau fédérateur** : une association mère avec des sections, des cotisations nationales, un fonds national et des organes de gouvernance ;
- **niveau local** : une section autonome dans sa gestion quotidienne, avec ses tontines, ses fonds propres et ses règles de discipline.

C'est le socle du positionnement de Tchoua : **plateforme de référence de toutes les formes d'association de type tontine en Afrique**.

---

## 2. AMEIBANS — spécificités

### 2.1 Identité et objets

- Association économique, sociale et culturelle, à but non lucratif.
- Siège à Bansoa ; durée illimitée.
- Objets : épanouissement social, culturel et économique ; liens fraternels ; culture Bansoa ; développement du village, de l'arrondissement et du département ; promotion des établissements scolaires, universitaires et centres de formation professionnelle.

### 2.2 Gouvernance

| Organe | Composition | Périodicité / règles |
|---|---|---|
| Assemblée générale | Tous les adhérents | Annuelle entre janvier et février ; convocation 45 jours avant ; quorum moitié des adhérents ; amendements 2/3 ; autres décisions majorité simple |
| Comité directeur | Délégués de section (10 % de l'effectif, plafond 11) + suppléants | Réunions semestrielles ; décisions 2/3 avec quorum 2/3 ; instance d'appel des sections |
| Bureau exécutif | Président, vice-président, SG + adjoint, trésorier + adjoint, 2 commissaires aux comptes | Mandat 3 ans renouvelable une fois ; fonctions gratuites ; retraits bancaires avec 2 signatures sur 3 |
| Commissions spécialisées | Études économiques et financières ; infrastructure et équipement ; affaires sociales ; affaires juridiques et conflits | Avis consultatifs ; membres désignés pour 3 ans maximum |
| Sections | Structure de base ; au moins 10 membres | Règlement intérieur approuvé par le Comité directeur ; un membre peut militer dans plusieurs sections, vote national dans sa localité de résidence |

### 2.3 Membres et ressources

- Conditions : ressortissants Bansoa, cadres public/privé, chefs d'entreprise ou professions libérales, responsables traditionnels ; admission provisoire entérinée par le Comité directeur.
- Droit d'adhésion : **10 000 FCFA**.
- Cotisation annuelle : **15 000 FCFA**.
- Membres à considération spéciale : 25 ans de vie active ou invalidité validée ; **−50 %** de contribution et exemption de déplacement.
- Ressources : droits d'adhésion, cotisations annuelles, placements, amendes, productions artistiques et intellectuelles, excédents des établissements promus.

### 2.4 Finances et assistance

- Budget de fonctionnement et d'investissement ; caisse d'avance de **50 000 FCFA** en début d'exercice.
- Dépenses d'investissement > **300 000 FCFA** : mise en concurrence obligatoire.
- Fonds national de dépôt provisionnel : **10 000 FCFA par membre**.
- Décès d'un membre : **300 000 FCFA** (200 000 famille, 50 000 gerbe, 50 000 section).
- Aide maladie : **10 000 FCFA/jour** d'hospitalisation, **3 à 15 jours par an**, contrôle par une équipe de la section et certificat médical.
- Distinctions **EPI BANSOA** (bronze, argent, or) : sélection triennale, 10 % des candidats, ancienneté de 10/15/25 ans.

### 2.5 Traduction dans Tchoua

- Association `type = AMICALE`, sans parent.
- `membershipConfig` : conditions, droit d'adhésion 10 000, cotisation 15 000, statut spécial.
- `meetingConfig` : AG annuelle, quorum, convocation 45 jours, ratio de délégués.
- `socialAidCaps` : hospitalisation 10 000/jour (3–15 jours), décès 300 000, dépôt 10 000.
- `sanctionsConfig` : retards et absences des délégués.
- Activités : droit d'adhésion, cotisation annuelle, fonds de solidarité national, aide maladie, aide décès.
- Documents : statuts 2018, recueil 2023, règlement du Comité directeur 2013.
- Articles de règlement : 14 articles synthétiques.

---

## 3. AMSED — spécificités

### 3.1 Identité

- Section AMEIBANS de Douala, créée en application des articles 3, 30 et 31 des statuts.
- Regroupement des ressortissants Bansoa du Littoral.
- Réunions : **premiers samedis à compter du 5 de chaque mois**, de **15 h à 19 h**, en rotation chez les adhérents ou au foyer BANSOA de Douala.

### 3.2 Gouvernance de section

- Assemblée générale de section (organe suprême), Comité directeur de section (CDS), Conseil des sages.
- Quorum : **3/5 des inscrits** ; majorité simple des présents ; élections au scrutin secret uninominal majoritaire à un tour.
- CDS : président, vice-président, SG, deux secrétaires adjoints, trésorier, trésorier adjoint, deux commissaires aux comptes, censeur, conseillers.
- Mandat de 3 ans, fonctions gratuites.
- Ancienneté : 5 ans (président, vice-président, trésorier), 3 ans (secrétaires adjoints), 1 an (autres).
- Parrainage obligatoire pour tout candidat.

### 3.3 Discipline

| Manquement | Sanction |
|---|---|
| Retard (> 30 min) | 500 FCFA |
| Une absence | 1 000 FCFA |
| Deux absences consécutives | 3 000 FCFA |
| Trois absences consécutives | 5 000 FCFA |
| Départ avant 19 h | 500 FCFA |
| Bavardage non autorisé | 500 FCFA |
| Indiscipline caractérisée | 3 000 FCFA |
| Intervention non autorisée | 500 FCFA |
| Fausse nouvelle | 3 000 FCFA + blâme |
| Engagement non mandaté | 10 000 FCFA |
| Commission manquée | 5 000 FCFA |
| Absence AG nationale | 20 000 FCFA |
| Absence aux obsèques | 25 000 FCFA |

Échelle : avertissement, blâme, suspension, amendes, déchéance, poursuites.

### 3.4 Fonds de solidarité

- Non récupérable, reconstitué chaque année.
- Réserve légale : **20 000 FCFA × nombre d'adhérents**.
- Nouvel adhérent : **72 000 FCFA** la première année, payable en 10 mois, saisissable sur les cotisations ou le capital du fonds d'investissement.
- Reconstitution annuelle à parts égales ; déficit comblé immédiatement.

### 3.5 Tontine

- Tontine **annuelle obligatoire de 25 000 FCFA et ses multiples** ; paliers d'au moins 4 membres.
- Cotisations mensuelles ; attribution par **enchères publiques**, mise à prix **5 %** du taux.
- Défaillance : majoration de **15 %** si le membre n'a pas encore bénéficié, **20 %** s'il a déjà bénéficié ; classement des défaillants en dernier.
- Bénéficiaire : chèque non daté ou reconnaissance de dette.
- Intérêts répartis en lots, mise à prix 2 %, grand lot plafonné au double de la participation individuelle.
- Retard de cotisation après remise de la cagnotte : pénalité de 5 %.

### 3.6 Aides

| Événement | Montant |
|---|---|
| Hospitalisation membre | 70 000 FCFA |
| Hospitalisation conjoint | 50 000 FCFA |
| Maladie grave (prêt sans intérêt) | jusqu'à 100 000 FCFA |
| Mariage (premier) | 50 000 FCFA |
| Naissance | 20 000 FCFA (+10 000 jumeaux) |
| Décès membre | 900 000 FCFA (enterrement 150 000, transport 300 000, restauration 300 000, boissons 130 000, divers 20 000) |
| Décès conjoint | 405 000 FCFA |
| Décès enfant | 50 000 FCFA (<10 ans) / 100 000 FCFA (>10 ans) |
| Décès père/mère | 100 000 FCFA |
| Veillée | obligatoire 3 jours à Douala ; absence = commission manquée |

### 3.7 Fonds d'investissement et collation

- Contribution obligatoire : **5 000 FCFA/mois**.
- Prêts : **2 mois maximum**, taux minimum **3 %/mois**, plafonnés au **double de la mise** de l'emprunteur ; retard : taux doublé ; suspension des nouveaux prêts.
- Redistribution annuelle d'une part des bénéfices ; 75 % de la quote-part du défunt aux enfants à la rentrée scolaire, 25 % aux ayants droits.
- Collation : **3 000 FCFA/séance** ; **150 000 FCFA** au récipiendaire, arriérés déduits.

### 3.8 Traduction dans Tchoua

- Association `type = SECTION`, `parentId = AMEIBANS`.
- `meetingConfig` : premier samedi après le 5, 15 h–19 h, quorum 3/5, rotation, collation 3 000/150 000.
- `socialAidCaps` : 10 postes d'aide détaillés.
- `sanctionsConfig` : 13 amendes.
- Activités : tontine aux enchères (25 000, 12 sessions, mise à prix 5 %), fonds de solidarité (6 000/mois), fonds d'investissement (5 000/mois, prêt 3 %/2 mois, plafond 2×), collation (3 000), trois caisses d'aides.
- Documents : RI AMSED 2024, statuts AMEIBANS, recueil 2023, RI national 2013.
- Articles de règlement : 14 articles synthétiques.

---

## 4. Comparaison structurante

| Dimension | AMEIBANS (national) | AMSED (section) |
|---|---|---|
| Niveau | Fédération / amicale mère | Section locale |
| Rattachement | Aucun | AMEIBANS |
| Organe suprême | AG nationale | AG de section |
| Réunions | AG annuelle + CD semestriel | Premier samedi mensuel, 15 h–19 h |
| Quorum | 1/2 des adhérents | 3/5 des inscrits |
| Bureau | Bureau exécutif national | Comité directeur de section |
| Cotisation | 15 000 FCFA/an | 72 000 FCFA/an (solidarité) + 5 000/mois (FI) + 25 000 (tontine) + 3 000 (collation) |
| Tontine | Non prévue au niveau national | Tontine aux enchères de 25 000 et multiples |
| Aide maladie | 10 000/jour, 3–15 jours | 70 000 forfait membre, 50 000 conjoint, prêt 100 000 |
| Décès | 300 000 FCFA | 900 000 membre, 405 000 conjoint, 100 000 parent |
| Fonds | Fonds national de dépôt | Solidarité + investissement + collation |
| Distinctions | EPI BANSOA | Non prévues |
| Discipline | Amendes des délégués | 13 sanctions de séance |

---

## 5. Modèle généralisé « toutes formes d'association »

### 5.1 Dimensions de configuration

Toute association est décrite par huit dimensions, toutes paramétrables :

1. **Forme juridique / type** : amicale, section, fédération, tontine, coopérative, mutuelle, association culturelle, professionnelle, religieuse, ONG, fondation, club, groupe de femmes, groupe de jeunes, association villageoise.
2. **Niveau hiérarchique** : primaire, section, fédération, confédération.
3. **Gouvernance** : organes, composition, quorum, majorités, mandats, éligibilité, incompatibilités, suppléance.
4. **Adhésion** : conditions, parrainage, droit d'adhésion, cotisation, statut spécial, radiation, démission, remboursement.
5. **Réunions** : périodicité, jour, heure, lieu, rotation, convocation, ordre du jour, quorum, procès-verbaux.
6. **Ressources** : cotisations, fonds affectés, collectes, subventions, placements, amendes, productions.
7. **Activités financières** : tontines (rotative, ASCA, enchères), épargne, prêts, investissement, collation, achats groupés, nature.
8. **Protection sociale** : catalogue d'aides (maladie, maternité, mariage, décès, scolarité, catastrophe), plafonds, conditions, délais, pièces justificatives.

### 5.2 Règles de généralisation

- **Aucune règle métier codée en dur** : chaque montant, seuil, quorum et délai est un paramètre de l'association ou de l'activité.
- **Héritage de configuration** : une section hérite des statuts et du règlement de l'association mère, puis peut surcharger ses paramètres locaux (cotisations, aides, tontines).
- **Fonds nationaux vs fonds locaux** : les fonds peuvent être marqués `NATIONAL`, `SECTION` ou `SHARED` ; un fonds national est alimenté par les sections et redistribué selon une clé de répartition.
- **Multi-niveaux** : une association peut avoir des enfants (sections) et un parent (fédération) ; les rôles et droits sont évalués au niveau concerné.
- **Modèles réutilisables** : chaque forme est enregistrée comme modèle (`AssociationTemplate`) avec ses activités, son règlement et ses paramètres ; la création d'une nouvelle association part d'un modèle puis ajuste.
- **Localisation** : langues, devises, jours fériés, formats de date, moyens de paiement (Mobile Money, espèces, banque, nature, temps).
- **Traçabilité** : chaque règle appliquée produit un mouvement horodaté, avec auteur, motif et pièce justificative.

### 5.3 Modèles livrés

| Modèle | Catégorie | Usage |
|---|---|---|
| AMEIBANS — Amicale nationale | AMICALE | Amicales d'élites, associations de ressortissants, fédérations communautaires |
| AMSED — Section locale | SECTION | Sections locales, antennes régionales, démembrements |
| Modèles existants | TONTINE, FAMILLE, COMMERCE, VILLAGE, PROJET, RELIGIEUX, EPARGNE | Tontines, familles, commerçants, villages, projets, groupes religieux, épargne |

### 5.4 Modules nécessaires à la couverture complète

| Module | État | Commentaire |
|---|---|---|
| Associations multi-niveaux | ✅ | `parentId`, sections, pages détail |
| Modèles et activités types | ✅ | Admin templates + activités |
| Gouvernance (bureau, mandats) | ✅ | `bureauConfig`, élections, mandats |
| Adhésion et cotisations | ✅ | Config, contributions, relances |
| Réunions, présences, amendes | ✅ | Réunions, collation, sanctions |
| Tontines flexibles | ✅ | Parts, fractions, cycles, enchères |
| Prêts et intérêts | ✅ | Prêts, remboursements, répartition |
| Aides sociales | ✅ | Catalogue, plafonds, demandes |
| Fonds affectés | 🟡 | Activités par fonds ; clé de répartition nationale à généraliser |
| Comptabilité OHADA | 🟡 | Rapports et exports ; plan comptable complet à venir |
| Fédération / sections | 🟡 | Hiérarchie et modèles ; consolidation multi-sections à venir |
| Distinctions honorifiques | 🟡 | Modèle de données à ajouter |
| Multi-pays / multi-devises | 🟡 | Devise et langue paramétrables ; règles juridiques par pays à modéliser |
| Mobile offline / USSD / SMS | ⬜ | À planifier pour les zones à faible connectivité |
| Signature électronique | ⬜ | À intégrer pour les PV et résolutions |

---

## 6. Intégration réalisée

- Association **AMEIBANS** créée (`type = AMICALE`), 5 activités, 14 articles, 3 documents, TAMPOLLA SERGE membre.
- Association **AMSED** (`type = SECTION`, `parentId = AMEIBANS`), 7 activités, 14 articles, 4 documents, TAMPOLLA SERGE membre.
- Modèles **AMEIBANS — Amicale nationale** et **AMSED — Section locale** créés dans l'administration, avec activités types et règlements.
- Types d'association ajoutés au formulaire de création et à la liste : amicale, section, fédération, culturelle, professionnelle.
- Catégories de modèles étendues : AMICALE, SECTION, FEDERATION, CULTUREL, PROFESSIONNEL.
- Affichage du rattachement « Section de … » sur la fiche association.

---

## 7. Feuille de route Afrique

1. **Bibliothèque juridique par pays** : Cameroun (loi 90/053), OHADA, Côte d'Ivoire, Sénégal, Bénin, Togo, Gabon, Congo, RDC, Nigeria, Ghana.
2. **Multi-devises et multi-langues** : XAF, XOF, NGN, GHS, USD/EUR ; FR, EN, ES, DE + langues locales.
3. **Paiements** : MTN MoMo, Orange Money, Wave, Moov, Airtel, Flutterwave, Stripe.
4. **Mode hors ligne** : saisie des cotisations en local, synchronisation différée.
5. **USSD / SMS** : consultation du solde et confirmation de cotisation sans smartphone.
6. **Consolidation fédérale** : tableau de bord national agrégeant les sections, fonds et effectifs.
7. **Conformité** : registres légaux, assemblées, quorums, archives, signature électronique.
8. **Marketplace de modèles** : les associations partagent leurs statuts et règlements comme modèles.

---

## 8. Critères d'acceptation

1. AMEIBANS et AMSED apparaissent dans la liste des associations de TAMPOLLA SERGE.
2. AMSED est rattachée à AMEIBANS et la fiche affiche « Section de … ».
3. Chaque association possède ses activités, ses articles de règlement et ses documents téléchargeables.
4. Les paramètres (cotisations, quorums, aides, sanctions) sont modifiables sans code.
5. Les modèles AMEIBANS et AMSED sont disponibles pour créer de nouvelles associations.
6. Les types amicale, section et fédération sont proposés à la création.
7. Aucun montant ni règle des deux règlements n'est codé en dur.
8. Les historiques et cycles restent disponibles par association et par activité.
