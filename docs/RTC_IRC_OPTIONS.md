# Tchoua — proposition RTC / IRC interne

## 1. Besoin

- Visioconférence interne de type Teams / Zoom, sans service externe.
- Chat de groupe par association, canaux, partage de documents et d’images.
- Échanges strictement limités aux membres d’une même association.
- Un membre appartenant à plusieurs associations peut échanger avec les membres de chacune d’elles, mais jamais avec ceux d’une association dont il n’est pas membre.
- Les réunions planifiées dans Tchoua doivent pouvoir ouvrir une salle vidéo.
- Les pièces partagées ne doivent pas être accessibles publiquement.

## 2. État actuel

- Chat existant : `AssocMessage`, canaux `GENERAL`, `BUREAU`, `ANNONCES`, activités.
- Le chat est en **polling** (pas de WebSocket), sans upload de fichier intégré.
- Aucun service RTC.
- HAProxy termine le TLS sur `162.19.169.28` et route `www.tchoua.com` vers le CT 104.
- DNS chez OVH (`ns109.ovh.net`), aucun sous-domaine `meet` / `chat` / `turn` pour l’instant.
- CT 104 : 4 vCPU, 16 Go, 86 Go libres. Hôte : 7,5 Go réellement disponibles, 1,2 To libres sur `vg-data`.

## 3. Modèle d’accès à appliquer

```
Association A
  ├── espace de discussion A (membres A uniquement)
  ├── réunions A (salles vidéo A)
  └── fichiers A (accès membres A)

Association B
  ├── espace de discussion B
  ├── réunions B
  └── fichiers B

Membre X ∈ A et B  → voit A et B
Membre Y ∈ A seulement → ne voit jamais B
Message direct X ↔ Z autorisé si X et Z partagent au moins une association active
```

Contrôles à appliquer côté serveur, pas seulement dans l’interface :

- appartenance active à l’association ;
- KYC minimal éventuel ;
- consentements plateforme ;
- rôle bureau pour les canaux `BUREAU` ;
- vérification de l’association commune pour chaque message direct ;
- refus des fichiers dont l’association ne correspond pas ;
- journal d’audit des accès et des suppressions.

## 4. Options

### Option A — Tchoua Chat 2.0 + Jitsi Meet (recommandée)

- Chat : évolution du chat actuel, temps réel via **Centrifugo** (Apache 2.0), fichiers via S3/MinIO, messages directs contrôlés par Tchoua.
- RTC : **Jitsi Meet** auto-hébergé, salle par association/réunion, JWT signé par Tchoua.
- Avantages :
  - aucune duplication de comptes ;
  - contrôle d’accès exact au niveau Tchoua ;
  - expérience intégrée au produit ;
  - Jitsi est mature, open source, avec partage d’écran et enregistrement ;
  - déploiement progressif possible.
- Inconvénients :
  - développement du chat temps réel et des uploads ;
  - interface vidéo Jitsi moins personnalisable que LiveKit ;
  - 8 à 12 jours de développement + 2 à 3 jours d’infrastructure.
- Ressources : Jitsi 4 vCPU / 4 Go ; Centrifugo 1 vCPU / 512 Mo ; stockage fichiers séparé.

### Option B — Mattermost + Jitsi

- Mattermost Team Edition auto-hébergé : équipes, canaux, fils, recherche, fichiers, applications mobiles, appels via Jitsi.
- Une équipe Mattermost par association ; un utilisateur rejoint les équipes de ses associations.
- Avantages : produit Teams-like immédiat, mobile, notifications, recherche, administration.
- Inconvénients :
  - comptes et annuaire à synchroniser avec Tchoua ;
  - les messages directs Mattermost sont ouverts à tous par défaut : il faut un **plugin/app custom** pour interdire les DM hors association commune ;
  - deux interfaces et deux sauvegardes.
- Effort : 4 à 6 jours, dont 2 jours de plugin de contrôle des DM et provisioning.
- Ressources : 4 Go + PostgreSQL, Jitsi 4 Go.

### Option C — Rocket.Chat + Jitsi

- Équipes, canaux, fichiers, visioconférence Jitsi intégrée, applications mobiles.
- Avantages : très proche de Slack/Teams, nombreuses intégrations.
- Inconvénients :
  - MongoDB + Node, empreinte plus lourde ;
  - même problème de DM globaux à brider ;
  - administration plus complexe.
- Effort : 5 à 7 jours.
- Ressources : 6 à 8 Go + Jitsi 4 Go.

### Option D — Element / Matrix + Jitsi ou LiveKit

- Synapse + Element Web, espaces Matrix par association, fichiers, appels, chiffrement de bout en bout.
- Avantages : confidentialité forte, standard ouvert, multi-appareils.
- Inconvénients :
  - déploiement et exploitation les plus lourds ;
  - fédération à désactiver pour garantir l’isolation ;
  - expérience moins « Teams » pour le grand public ;
  - provisioning des espaces et modération à construire.
- Effort : 8 à 12 jours.
- Ressources : 8 Go minimum.

### Option E — Nextcloud Talk

- Talk pour chat/vidéo, Nextcloud pour les fichiers, groupes par association.
- Avantages : collaboration documentaire intégrée, clients mobiles.
- Inconvénients : PHP/Nextcloud lourd, visioconférence moins fluide à grande échelle, comptes à synchroniser.
- Effort : 5 à 7 jours.
- Ressources : 6 à 8 Go.

### Option F — LiveKit + Tchoua Chat 2.0

- LiveKit (SFU WebRTC) pour la vidéo, avec interface React sur mesure dans Tchoua.
- Avantages : meilleur contrôle UX, scalable, enregistrement/egress, data channels, TURN intégré.
- Inconvénients : interface vidéo à développer ; plus d’ingénierie que Jitsi.
- Effort : 12 à 18 jours.
- Ressources : 4 vCPU / 4 Go + TURN + Redis.

## 5. Comparaison

| Option | Chat complet | Vidéo | Contrôle d’accès strict | Effort | Recommandation |
|---|---|---|---|---|---|
| **A. Tchoua + Jitsi** | À construire | Jitsi | **Excellent** | 8–12 j | **Recommandée** |
| B. Mattermost + Jitsi | Oui | Jitsi | Bon après plugin | 4–6 j | Rapide mais DM à brider |
| C. Rocket.Chat + Jitsi | Oui | Jitsi | Bon après plugin | 5–7 j | Lourde |
| D. Element/Matrix | Oui | Jitsi/LiveKit | Très bon | 8–12 j | Confidentialité maximale |
| E. Nextcloud Talk | Oui | Talk | Bon | 5–7 j | Fichiers intégrés |
| F. LiveKit + Tchoua | À construire | LiveKit | Excellent | 12–18 j | Meilleur RTC long terme |

## 6. Architecture recommandée (Option A)

```text
Navigateur membre
   │ HTTPS / WSS
   ▼
HAProxy (162.19.169.28)
   ├── www.tchoua.com ─────────────► CT104 Next.js
   ├── chat.tchoua.com ────────────► Centrifugo (CT105)
   ├── meet.tchoua.com ────────────► Jitsi Meet (CT105)
   └── fichiers ───────────────────► S3 OVH ou MinIO (bucket privé)

CT104 Next.js
   ├── émet les JWT Jitsi (room + association + rôle + expiration)
   ├── émet les JWT Centrifugo (userId + associations autorisées)
   ├── contrôle les uploads et les messages
   └── publie les événements chat

Jitsi
   ├── Prosody / Jicofo / JVB
   └── coturn (TURN/TLS) pour les réseaux restrictifs
```

### Salles vidéo

- `assoc-{associationId}-reunion-{meetingId}` pour une réunion planifiée.
- `assoc-{associationId}-canal-{channel}` pour un appel de groupe.
- `dm-{hash(userA,userB)}` pour un appel 1:1, autorisé uniquement si les deux membres partagent une association.
- JWT émis par Tchoua après vérification de l’appartenance, avec expiration courte.
- Modérateur : bureau ; membres : participants ; invités extérieurs : interdits par défaut.
- Salle d’attente Jitsi activée, mot de passe de réunion optionnel.

### Chat / fichiers

- Canaux par association et par activité, réutilisant `AssocMessage`.
- Messages directs via une table `DirectConversation` avec `associationIds` partagés.
- Upload fichiers/images : API Tchoua → stockage privé → URL signée courte.
- Limites : 25 Mo par fichier, types contrôlés, antivirus ClamAV, quotas par association.
- WebSocket Centrifugo pour la présence, les messages et les accusés de lecture.
- Conservation et suppression paramétrables ; audit des accès.

## 7. Infrastructure et réseau

### Sous-domaines à créer chez OVH

| Nom | Type | Valeur |
|---|---|---|
| `meet.tchoua.com` | A | `162.19.169.28` |
| `chat.tchoua.com` | A | `162.19.169.28` |
| `turn.tchoua.com` | A | `162.19.169.28` |

Certificats : `certbot` pour chaque nom, ou certificat wildcard `*.tchoua.com` si le DNS le permet. HAProxy accepte plusieurs `crt` sur le bind 443.

### Ports

| Usage | Port | Protocole | Destination |
|---|---|---|---|
| HTTPS / WSS | 443 | TCP | HAProxy → CT105 |
| JVB média | 10000 | UDP | DNAT vers CT105 |
| TURN | 3478 | TCP/UDP | CT105 |
| TURN TLS | 5349 | TCP | CT105 |
| TURN relay | 49160–49200 | UDP | CT105 |
| Centrifugo | 8000 | TCP interne | CT105 |

HAProxy ne transporte pas l’UDP : les flux JVB/TURN doivent être redirigés par `iptables` sur l’hôte, ou le service doit être exposé sur une IP publique dédiée. C’est le point d’infrastructure le plus sensible.

### Dimensionnement

- **CT105 dédié** : 4 vCPU, 8 Go RAM, 60 Go disque, `vmbr1`.
- Jitsi + JVB : 4 Go.
- Centrifugo : 512 Mo.
- coturn : 512 Mo.
- Marge pour OS et pics : 2 Go.
- Fichiers : bucket S3 OVH existant (`ovh-s3:proxmox-s3`) ou MinIO dédié ; ne pas stocker les vidéos dans PostgreSQL.

## 8. Mise en œuvre proposée

### Phase 0 — décision (0,5 j)

- Valider l’option A, B, C, D ou F.
- Valider les sous-domaines et l’ouverture des ports UDP.
- Valider la politique de conservation et de modération.

### Phase 1 — socle RTC (2–3 j)

- CT105, Jitsi, JWT, coturn.
- HAProxy `meet.tchoua.com`, certificat TLS.
- Salle de test, 5–10 participants, mobile et réseau 4G.
- Bouton « Rejoindre la visioconférence » sur les réunions Tchoua.

### Phase 2 — chat temps réel (3–5 j)

- Centrifugo + JWT.
- Canaux d’association, présence, messages, accusés de lecture.
- Upload images/documents, stockage privé, URL signées.
- Contrôle des messages directs par association commune.

### Phase 3 — intégration et exploitation (2–3 j)

- Interface unifiée dans l’espace membre.
- Notifications, recherche, modération, signalements.
- Sauvegardes, supervision, journaux, tests de charge.
- Documentation et formation du bureau.

## 9. Décision recommandée

**Option A — Tchoua Chat 2.0 + Jitsi Meet** pour démarrer, avec possibilité de remplacer Jitsi par LiveKit plus tard sans changer le modèle d’accès.

Elle est la seule option qui garantit nativement :

- zéro duplication des comptes ;
- contrôle des échanges par association ;
- vérification des messages directs par association commune ;
- intégration directe aux réunions, membres, KYC et rôles du bureau ;
- absence de fuite de fichiers entre associations.

Alternative si la priorité est une messagerie Teams-like immédiate : **Option B, Mattermost + Jitsi**, avec un plugin de restriction des messages directs.
