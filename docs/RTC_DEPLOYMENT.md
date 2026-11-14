# Tchoua RTC / Chat — déploiement 2026

## Sous-domaines et certificats

| Nom | Usage | Destination |
|---|---|---|
| `meet.tchoua.com` | Jitsi Meet | HAProxy → CT109 `192.168.100.109:8000` |
| `chat.tchoua.com` | Centrifugo (WebSocket) | HAProxy → CT109 `192.168.100.109:8100` |
| `turn.tchoua.com` | TURN / STUN | DNAT → CT109 `3478`, `5349` |

Certificat Let's Encrypt `tchoua-rtc` (meet + chat + turn), valable jusqu'au **12 février 2027**, émis par `certbot --standalone --http-01-port 8888`. Le certificat est concaténé dans `/etc/ssl/private/tchoua-rtc.pem` pour HAProxy et copié vers `/etc/turnserver/turn.{crt,key}` pour coturn.

Le hook de renouvellement `/etc/letsencrypt/renewal-hooks/deploy/tchoua-rtc.sh` reconstruit le PEM, recharge HAProxy et met à jour le certificat TURN. Vérification : `certbot renew --dry-run`.

## Conteneur

Le VMID **105** est déjà occupé par la VM `NEOBT` ; le service utilise donc **CT109 `TCHOUA-COMM`** :

- 4 vCPU, 8 Go de RAM, 60 Go de disque, `192.168.100.109/24`, passerelle `192.168.100.1` ;
- Debian/Ubuntu LXC privilégié pour Docker (`lxc.apparmor.profile: unconfined`) ;
- Jitsi Docker dans `/opt/jitsi` (images `ghcr.io/jitsi/*:stable`) ;
- Centrifugo Docker `centrifugo/centrifugo:v6` sur le port hôte `8100` ;
- coturn système sur `3478`/`5349`.

Services : `docker compose ps` dans `/opt/jitsi`, `docker ps`, `systemctl status coturn`.

## Jitsi

`.env` (dans `/opt/jitsi`) : `PUBLIC_URL=https://meet.tchoua.com`, `ENABLE_AUTH=1`, `AUTH_TYPE=jwt`, `JWT_APP_ID=tchoua`, `ENABLE_GUESTS=0`, `ENABLE_LOBBY=1`, `DISABLE_HTTPS=1` (TLS terminé par HAProxy), `JVB_PORT=10000`, `JVB_ADVERTISE_IPS=162.19.169.28`.

Le secret `JWT_APP_SECRET` est partagé avec l'application Tchoua via `JITSI_JWT_APP_SECRET` dans `/var/www/tchoua-app/.env` sur CT104. Ne jamais l'écrire dans un document ou un commit.

L'application émet un JWT court (1 h) dans `POST /api/rtc/jitsi-token` après contrôle de l'adhésion et de l'éligibilité KYC. La salle est imposée par le serveur :

- réunion : `assoc-<associationId>-reunion-<meetingId>` ;
- appel de groupe : `assoc-<associationId>-general`.

Le bouton **Visio** est présent dans les cartes de réunion et dans l'onglet Chat.

## Chat temps réel

Centrifugo est configuré avec :

- JWT HMAC (`client.token.hmac_secret_key`) ;
- namespace `assoc` ;
- abonnements serveur via le claim `channels` ; le client ne peut pas s'abonner lui-même à un canal non accordé ;
- publication serveur uniquement (`allow_publish_for_client: false`).

Canaux :

```text
assoc:<associationId>:GENERAL
assoc:<associationId>:ANNONCES
assoc:<associationId>:BUREAU        # bureau uniquement
assoc:<associationId>:ACT_<activityId>
```

`POST /api/rtc/chat-token` vérifie l'adhésion et renvoie un token limité aux canaux autorisés. `POST /api/associations/[id]/messages` publie l'événement après insertion en base.

Fichiers : `POST /api/associations/[id]/messages/upload` (images, PDF, Word, Excel, texte, 20 Mo max) écrit dans `storage/chat/<associationId>/`, hors du dossier public. La lecture passe par `/api/associations/[id]/messages/file/[filename]` avec contrôle d'adhésion.

## Réseau

HAProxy possède les backends `meet_servers` et `chat_servers`, avec `timeout tunnel 1h` pour les WebSockets. Le certificat `tchoua-rtc` est ajouté au bind 443.

Le script `/usr/local/sbin/tchoua-rtc-nat.sh` (service `tchoua-rtc-nat.service`) applique :

- DNAT UDP `10000` → JVB ;
- DNAT TCP/UDP `3478`, `5349` → coturn ;
- DNAT UDP/TCP `49160–49200` → coturn ;
- acceptation du trafic `vmbr1 → vmbr1` nécessaire aux appels entre conteneurs.

Vérification STUN depuis l'extérieur :

```bash
python3 - <<'PY'
import socket, struct, os
msg = struct.pack('>HHI', 1, 0, 0x2112A442) + os.urandom(12)
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.settimeout(4)
s.sendto(msg, ('162.19.169.28', 3478))
print(s.recvfrom(2048)[0][:2].hex())
PY
```

## Contrôle d'accès

- Un membre ne peut obtenir un token Jitsi/Centrifugo que pour une association où il possède une adhésion non `LEFT`.
- Le JWT Jitsi contient la salle ; Jitsi refuse une salle différente.
- Les canaux `BUREAU` ne sont inclus que pour les rôles de bureau.
- Les fichiers sont privés et vérifiés à chaque lecture.
- Un membre KYC 0 ne peut pas lancer une visio : `checkAssociationEligibility` exige KYC 1, les consentements plateforme et, si activé, l'approbation du règlement.

## Limites connues

- Les identifiants TURN sont statiques et visibles dans `config.js` (nécessaire au client) ; les faire évoluer vers des identifiants éphémères HMAC si le service est exposé à grande échelle.
- Pas d'enregistrement de réunion ni de transcription.
- Les messages directs inter-associations ne sont pas encore un module séparé : l'échange passe par les canaux de l'association commune.
- Le compte `qa.rtc@tchoua.com` a été créé pour la recette ; il peut être supprimé ou conservé comme compte de test.
- Tous les comptes métier NDI MBE sont encore KYC 0 ; la visio leur sera refusée jusqu'à vérification KYC 1.
