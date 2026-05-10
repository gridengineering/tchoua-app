#!/usr/bin/env bash
# =============================================================================
# push-dockerhub.sh — Build & Push vers Docker Hub (espace tchoua)
# Image : tchoua/tchoua-app
# Usage : bash scripts/push-dockerhub.sh [VERSION]
# Exemple : bash scripts/push-dockerhub.sh 1.0.0
# =============================================================================
set -e

DOCKER_NAMESPACE="tchoua"
IMAGE_NAME="tchoua-app"
FULL_IMAGE="${DOCKER_NAMESPACE}/${IMAGE_NAME}"
VERSION="${1:-latest}"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔] $1${NC}"; }
warn() { echo -e "${YELLOW}[⚠] $1${NC}"; }

echo ""
echo "═══════════════════════════════════════════════════════"
echo "   🐳  Build & Push Tchoua App → Docker Hub"
echo "   Image : ${FULL_IMAGE}:${VERSION}"
echo "═══════════════════════════════════════════════════════"
echo ""

# ─── Vérification Docker ─────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "Docker n'est pas installé. Installez-le depuis https://docs.docker.com/get-docker/"
  exit 1
fi

# ─── Connexion Docker Hub ────────────────────────────────────────────────────
log "Connexion à Docker Hub sous le namespace '${DOCKER_NAMESPACE}'..."
docker login

# ─── Build Multi-Platform (amd64 + arm64) ────────────────────────────────────
log "Build de l'image Docker multi-platform (linux/amd64, linux/arm64)..."
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag "${FULL_IMAGE}:${VERSION}" \
  --tag "${FULL_IMAGE}:latest" \
  --push \
  .

log "Image poussée avec succès :"
echo "  → docker pull ${FULL_IMAGE}:${VERSION}"
echo "  → docker pull ${FULL_IMAGE}:latest"
echo ""
warn "Lien Docker Hub : https://hub.docker.com/r/${FULL_IMAGE}"
echo ""
