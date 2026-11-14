# Conformité KYC, confiance et quarantaine

## KYC

| Niveau | Ce qui est demandé | Validation |
|---|---|---|
| KYC 0 | Compte créé | — |
| KYC 1 | E-mail, SMS ou WhatsApp vérifié par code à 6 chiffres + nom, téléphone, ville | automatique après vérification d'un canal |
| KYC 2 | Pièce d'identité (CNI, passeport, titre de séjour) + photo type passeport + adresse | bureau ou administration |
| KYC 3 | KYC 2 + preuve de localisation (plan, facture ou capture Google Maps) + origine des fonds | bureau de niveau ≥ 3 ou administration |

Le niveau est porté par `User.kycLevel` : il est donc valable dans toutes les associations du membre.
Un validateur du bureau ne peut approuver qu'un niveau inférieur ou égal à son propre niveau KYC ; l'administration principale peut débloquer un dossier.

### Livraison des codes

Le code est généré côté serveur et haché en SHA-256. Les adaptateurs sont :

- **E-mail** : `KYC_EMAIL_WEBHOOK_URL` (fournisseur transactionnel) ou `sendmail` local. Pour une livraison fiable en production, configurer un relais Postfix/SMTP sortant ou un webhook e-mail.
- **SMS / WhatsApp** : `KYC_SMS_WEBHOOK_URL` ou `KYC_WHATSAPP_WEBHOOK_URL`, recevant `{ channel, to, message, code }`. `KYC_MESSAGING_TOKEN` est envoyé en `Authorization: Bearer`.
- `KYC_EMAIL_FROM` permet de changer l'expéditeur.
- `KYC_DEV_MODE=1` renvoie `devCode` dans la réponse **uniquement pour les tests** ; ne jamais l'activer en production.

Endpoints : `POST /api/kyc/verify/start`, `POST /api/kyc/verify/confirm`.

### Pièces jointes

`POST /api/kyc/documents` (multipart, 8 Mo max, JPEG/PNG/WEBP/PDF) écrit dans `storage/kyc/<userId>/`. Les fichiers ne sont jamais publics : `GET /api/kyc/documents/[id]` vérifie le propriétaire, le bureau de l'association ou l'administration. La base ne stocke que le chemin et les métadonnées.

## Confiance des associations

`src/lib/trust.ts` calcule un score sur 100 :

- qualité de la fiche et des contacts ;
- statuts et règlement intérieur ;
- documents et autorisations ;
- niveau d'activité ;
- membres actifs ;
- régularité des réunions sur 90 jours ;
- conformité financière (compte déclaré) ;
- fiabilité moyenne des membres ;
- couverture KYC ;
- absence de membre en quarantaine.

Paliers : Découverte (20), Bronze (40), Argent (60), Or (80), Platine (95).
`POST /api/admin/trust` recalcule une association (`associationId`) ou toutes. Le résultat est aussi affiché sur la fiche association.

## Quarantaine

`POST /api/admin/quarantine` avec `entity: "association" | "user"`, `id`, `action: "QUARANTINE" | "RELEASE"`, `reason`.
Un utilisateur en quarantaine ne peut plus se connecter ; une association en quarantaine bloque les nouvelles participations et opérations financières via `checkAssociationEligibility`.

## Administration

- `/admin/kyc` : tous les membres, filtres KYC/statut/association, regroupements, pièces et validation.
- `/admin/confiance` : scores, détails par critère, recalcul et quarantaine des associations.
- `/admin/historique` : chronologie complète d'une association ou d'un membre (KYC, consentements, adhésions, cotisations, prêts, aides, réunions, audit), export JSON.
