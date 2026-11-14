# Alignement des associations sur leurs textes fondateurs

Les trois associations importées ont été alignées sur leurs documents officiels le 14 novembre 2026.

| Association | Source | Points repris |
|---|---|---|
| ETS NDI MBE | Règlement intérieur du Fonds d'Investissement « NDI MBE ET FILS » v1.0, 02/11/2022 | Apports libres sans minimum, admission à l'unanimité, virement exclusif, prêts 2 %/mois jusqu'à 3 mois puis 4 %/mois, compte CCP Bank, quote-part des intérêts au prorata du capital, publications mensuelles, majorité d'unanimité pour modifier le règlement |
| AMEIBANS | Statuts révisés 2018 + règlement intérieur du Comité directeur 2021 | Association loi 1990, siège Bansoa, AG annuelle janvier-février avec convocation 45 jours et quorum 1/2, CD semestriel à 2/3, droit d'adhésion 10 000 FCFA, cotisation annuelle 15 000 FCFA, fonds de dépôt 10 000 FCFA/membre, décès 300 000 FCFA, aide maladie 10 000 FCFA/jour (3 à 15 jours), sections ≥ 10 membres |
| AMSED | Règlement intérieur AMSED 2024 | Section AMEIBANS de Douala, parrainage obligatoire, cotisation annuelle 15 000 FCFA, fonds de solidarité 72 000 FCFA payable en 10 mois, réserve légale 20 000 FCFA/membre, tontine annuelle 25 000 FCFA avec enchères à 5 %, fonds d'investissement 5 000 FCFA/mois, prêts 3 %/mois sur 2 mois et plafonnés au double de la mise, collation 3 000 FCFA/150 000 FCFA, aides et sanctions détaillées |

## Fichiers mis à jour

- `associations.membershipConfig`, `meetingConfig`, `socialAidCaps`, `sanctionsConfig`, `bankConfig`, `bureauConfig`, `description`
- `arp_profiles.config` et nouvelle version `arp_profile_versions`
- Activité de test NDI MBE clôturée : le règlement NDI MBE ne prévoit pas de tontine
- Plafond de prêt NDI MBE ramené à la trésorerie disponible (ratio 100 %)

Le script reproductible est `scripts/align-associations-from-reglements.ts`. Il valide chaque configuration ARP avant écriture et crée une version d'audit.

## Valeurs ARP après alignement

| Association | Organisation | Cotisation | Tontine | Crédit | Aide | Canal |
|---|---|---|---|---|---|---|
| NDI MBE | autonome | parts | aucune | amortissable | aucune | banque |
| AMSED | section | fixe | enchères | amortissable | forfait | espèces |
| AMEIBANS | fédération | fixe | aucune | aucun | forfait | banque |
