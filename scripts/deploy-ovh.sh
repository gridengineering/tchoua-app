#!/usr/bin/env bash
# =============================================================================
# deploy-tchoua.sh — Script de Déploiement Complet sur OVH Cloud Bare Metal
# Projet : Tchoua App — Fondation NIFA
# Source : https://github.com/gridengineering/tchoua-app
# Usage  : sudo bash deploy-tchoua.sh
# OS cible : Ubuntu 22.04 LTS / Debian 12
# =============================================================================
set -e  # Arrêt immédiat en cas d'erreur

# ─── Couleurs pour l'affichage ─────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
log()   { echo -e "${GREEN}[✔] $1${NC}"; }
warn()  { echo -e "${YELLOW}[⚠] $1${NC}"; }
error() { echo -e "${RED}[✗] $1${NC}"; exit 1; }

# ─── Configuration — Modifiez ces variables ─────────────────────────────────
APP_DIR="/var/www/tchoua-app"
REPO_URL="https://github.com/gridengineering/tchoua-app.git"
BRANCH="master"
APP_PORT=3000
DOMAIN=""                 # Exemple : tchoua.votredomaine.com (laisser vide pour ignorer Nginx)
DB_NAME="tchoua_db"
DB_USER="tchoua_user"
DB_PASSWORD=""            # OBLIGATOIRE : changez ce mot de passe
NODE_VERSION="20"

# ─── Vérification des privilèges ────────────────────────────────────────────
if [[ "$EUID" -ne 0 ]]; then
  error "Ce script doit être exécuté en tant que root. Utilisez : sudo bash deploy-tchoua.sh"
fi

if [[ -z "$DB_PASSWORD" ]]; then
  error "Veuillez définir la variable DB_PASSWORD dans ce script avant de l'exécuter."
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "   🚀  Déploiement Tchoua App — OVH Cloud Bare Metal  "
echo "═══════════════════════════════════════════════════════"
echo ""

# ─── ÉTAPE 1 : Mise à jour du système ───────────────────────────────────────
log "Étape 1/10 : Mise à jour du système..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl wget git build-essential ufw

# ─── ÉTAPE 2 : Installation de Node.js via NodeSource ───────────────────────
log "Étape 2/10 : Installation de Node.js ${NODE_VERSION}..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y nodejs
  log "Node.js $(node -v) installé avec succès."
else
  warn "Node.js déjà installé : $(node -v). Skip."
fi

# Installation de PM2 (gestionnaire de processus)
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
  log "PM2 installé avec succès."
fi

# ─── ÉTAPE 3 : Installation de PostgreSQL ───────────────────────────────────
log "Étape 3/10 : Installation et configuration de PostgreSQL..."
if ! command -v psql &>/dev/null; then
  apt-get install -y postgresql postgresql-contrib
  systemctl enable postgresql
  systemctl start postgresql
fi

# Création de la base de données et de l'utilisateur
sudo -u postgres psql <<EOF
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
EOF
log "Base de données '${DB_NAME}' et utilisateur '${DB_USER}' configurés."

# ─── ÉTAPE 4 : Clonage du dépôt GitHub ─────────────────────────────────────
log "Étape 4/10 : Clonage du dépôt depuis GitHub..."
if [ -d "$APP_DIR" ]; then
  warn "Le répertoire ${APP_DIR} existe déjà. Mise à jour via git pull..."
  cd "$APP_DIR"
  git fetch origin
  git reset --hard origin/${BRANCH}
else
  git clone --branch ${BRANCH} ${REPO_URL} ${APP_DIR}
  cd "$APP_DIR"
fi
log "Code source récupéré dans ${APP_DIR}."

# ─── ÉTAPE 5 : Création du fichier .env de production ───────────────────────
log "Étape 5/10 : Création du fichier .env de production..."
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"

if [ ! -f "${APP_DIR}/.env" ]; then
cat > "${APP_DIR}/.env" <<ENVFILE
# ─── Tchoua App — Variables d'Environnement Production ───
NODE_ENV=production
DATABASE_URL="${DATABASE_URL}"

# NextAuth.js — CHANGEZ CES VALEURS !
NEXTAUTH_URL="http://${DOMAIN:-localhost}:${APP_PORT}"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Firebase (remplacer par vos clés)
NEXT_PUBLIC_FIREBASE_API_KEY="VOTRE_CLE_FIREBASE"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="votre-projet.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="votre-projet"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="votre-projet.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="000000000000"
NEXT_PUBLIC_FIREBASE_APP_ID="1:000000000000:web:000000000000"
ENVFILE
  log "Fichier .env créé. Pensez à compléter les clés Firebase et NextAuth."
else
  warn "Fichier .env déjà existant. Pas écrasé."
fi

# ─── ÉTAPE 6 : Installation des dépendances Node ────────────────────────────
log "Étape 6/10 : Installation des dépendances npm..."
cd "$APP_DIR"
npm ci --omit=dev

# ─── ÉTAPE 7 : Migration de la base de données (Prisma) ─────────────────────
log "Étape 7/10 : Génération du client Prisma et migrations..."
npx prisma generate
npx prisma migrate deploy
log "Migrations Prisma appliquées sur PostgreSQL."

# ─── ÉTAPE 8 : Build de l'application Next.js ───────────────────────────────
log "Étape 8/10 : Build de production Next.js..."
npm run build
log "Build Next.js terminé avec succès."

# ─── ÉTAPE 9 : Démarrage avec PM2 ───────────────────────────────────────────
log "Étape 9/10 : Démarrage de l'application avec PM2..."
pm2 delete tchoua-app 2>/dev/null || true
pm2 start npm --name "tchoua-app" -- start -- -p ${APP_PORT}
pm2 save
pm2 startup systemd -u root --hp /root | bash || true
log "Application démarrée sur le port ${APP_PORT} et configurée pour le démarrage automatique."

# ─── ÉTAPE 10 : Configuration de Nginx (si DOMAIN est défini) ───────────────
if [[ -n "$DOMAIN" ]]; then
  log "Étape 10/10 : Configuration de Nginx comme reverse proxy pour ${DOMAIN}..."
  apt-get install -y nginx

  cat > "/etc/nginx/sites-available/tchoua-app" <<NGINXCONF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Sécurité — Headers HTTP
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Limite de taille des uploads (pour les photos CNI)
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Cache statique Next.js
    location /_next/static/ {
        alias ${APP_DIR}/.next/static/;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
NGINXCONF

  ln -sf /etc/nginx/sites-available/tchoua-app /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx
  log "Nginx configuré pour le domaine ${DOMAIN}."

  # HTTPS avec Certbot (Let's Encrypt)
  if ! command -v certbot &>/dev/null; then
    apt-get install -y certbot python3-certbot-nginx
  fi
  warn "Pour activer HTTPS, exécutez : certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
else
  log "Étape 10/10 : DOMAIN non défini — configuration Nginx ignorée."
  warn "L'application est accessible sur http://$(hostname -I | awk '{print $1}'):${APP_PORT}"
fi

# ─── Pare-feu UFW ───────────────────────────────────────────────────────────
log "Configuration du pare-feu UFW..."
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw --force enable

# ─── Résumé final ───────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}   ✅  Déploiement Tchoua App TERMINÉ !${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  📁 Répertoire    : ${APP_DIR}"
echo "  🌐 Port          : ${APP_PORT}"
echo "  🗄️  Base de données : ${DB_NAME} (PostgreSQL)"
if [[ -n "$DOMAIN" ]]; then
  echo "  🔗 URL           : http://${DOMAIN}"
fi
echo ""
echo "  Commandes utiles :"
echo "    pm2 logs tchoua-app   → Voir les logs en temps réel"
echo "    pm2 restart tchoua-app → Redémarrer l'application"
echo "    pm2 status            → Statut des processus"
echo ""
warn "⚠️  N'oubliez pas de compléter les clés API dans ${APP_DIR}/.env"
echo ""
