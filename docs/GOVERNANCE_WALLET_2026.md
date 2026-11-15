# Gouvernance, KYC, confiance et Wallet — 2026

## Accès

- Console : `/admin/gouvernance`
- API : `GET/PUT /api/admin/governance`
- Stockage : `system_settings.GOVERNANCE_CONFIG` (JSON), audit `GOVERNANCE_UPDATE`

Sections : KYC, Confiance, Quarantaine, Messagerie SMTP/IMAP/POP, Wallet & paiements, RBAC/IAM/ACL, Notifications Tchoua Mobile, OpenAPI 3.1.

## KYC

Chaque niveau porte :

- libellé, description, exigences, canaux, documents ;
- mode d'approbation `AUTO`, `BUREAU` ou `ADMIN` ;
- plafonds par transaction, jour et mois ;
- autorisations `deposit`, `withdrawal`, `transfer`, `video`, `chat`, `loan`, `socialAid`, `createAssociation`, `joinAssociation`.

Les seuils de montant (`amountThresholds`) exigent un niveau supérieur. `checkAssociationEligibility` et le wallet refusent une opération non autorisée avec `KYC_ACCESS_DENIED` ou `KYC_LEVEL_REQUIRED`.

## Confiance et quarantaine

- Paliers de confiance avec `min`/`max` et libellés modifiables.
- Critères avec maximum et activation ; le score est normalisé sur 100.
- `quarantineBelow` et règles `TRUST_SCORE`, `KYC_FAILED`, `REPORTS`, `MANUAL` avec restrictions login/wallet/associations/RTC et notification.
- Une règle `TRUST_SCORE` active peut automatiquement mettre une association en quarantaine (motif `AUTO_TRUST:`) et la libérer quand le score remonte.

## Wallet

### Membre

- Un seul wallet par membre (`users.wallet.userId @unique`), créé à l'inscription et en lazy.
- Opérations : dépôt, retrait, virement, historique.
- KYC et plafonds appliqués côté serveur ; prestataires filtrés par niveau KYC.
- Dépôts externes : statut `PENDING`; confirmation/refus dans `/admin/wallets` → opérations en attente.
- OTP réel par e-mail : `/api/wallet/otp`, puis code dans la transaction.

### Association

- Table `association_wallets` (une par association) et `association_wallet_transactions`.
- Page `/associations/[id]/wallet`, API `/api/associations/[id]/wallet`.
- `FUND` : transfert atomique depuis le wallet membre.
- `DEPOSIT` : Mobile Money, carte, PayPal, virement, espèces → `PENDING`.
- `WITHDRAWAL` : bureau uniquement, débit immédiat et validation administrative.

### Prestataires

MTN MoMo, Orange Money, Wave, Camtel, Visa, Mastercard, PayPal, virement bancaire, espèces. Chaque prestataire a frais, min/max, niveau KYC et instructions modifiables.

## Messagerie

`src/lib/mailer.ts` envoie les e-mails transactionnels via SMTP (nodemailer). KYC et OTP wallet utilisent SMTP en priorité, puis webhook/sendmail. IMAP/POP sont configurés pour la boîte de réception ; la synchronisation entrante n'est pas encore automatisée.

## Notifications Tchoua Mobile

`dispatchNotification` crée la notification in-app, la notification d'association et publie sur Centrifugo `user:<userId>` selon la matrice d'événements. Événements câblés : wallet (dépôt/retrait/virement), KYC approuvé/refusé, quarantaine. Les alertes administratives sont aussi publiées sur le canal utilisateur.

## OpenAPI

`GET /api/openapi.json` retourne le contrat 3.1.0 configuré (serveurs, sécurité API Key/OAuth2, scopes, chemins wallet, chat, notifications). Le contrat est public uniquement si `openapi.enabled`.
