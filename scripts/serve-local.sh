#!/bin/sh
# Sert le site sur http://127.0.0.1:8090 en montant les fichiers du dépôt en lecture seule :
# toute modification est visible au rechargement de la page, sans reconstruire l'image.
# Limite : un éditeur qui remplace un fichier (index.html, radar.html) laisse le conteneur sur l'ancien contenu ;
# dans ce cas : podman restart -t 1 optio-site
set -e
cd "$(dirname "$0")/.."
podman build -q -t optio-site . >/dev/null
podman rm -f -t 1 optio-site >/dev/null 2>&1 || true
podman run -d --name optio-site -p 127.0.0.1:8090:8080 --read-only --restart unless-stopped \
  -v "$PWD/index.html:/www/index.html:ro" -v "$PWD/radar.html:/www/radar.html:ro" \
  -v "$PWD/robots.txt:/www/robots.txt:ro" -v "$PWD/sitemap.xml:/www/sitemap.xml:ro" \
  -v "$PWD/data:/www/data:ro" -v "$PWD/fonts:/www/fonts:ro" -v "$PWD/js:/www/js:ro" optio-site
