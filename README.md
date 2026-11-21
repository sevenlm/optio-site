# Landing page Optio — V2 « Voie libre » — design reference

This is a design mockup created in a visual design tool, exported as a
standalone page. Treat it as a REFERENCE MOCKUP, not production code:
the markup and inline styles carry the design's precise values — colors,
font sizes, spacing, radii, shadows, layout — which an implementation
should replicate faithfully in its own components and styling system
rather than copy wholesale.

## Contents

- `design/Landing-v2.dc.html` — the artboard (a Design Component: an `<x-dc>`
  template + a small logic class). The values to replicate live in its
  inline `style="…"` attributes and the `<helmet><style>` block.
- `design/support.js`, `design/vendor/react*.js` — the runtime that renders the
  component in a browser; not part of the design.

## Viewing

Serve the folder (e.g. `python3 -m http.server`) and open `design/Landing-v2.dc.html`;
some browsers block the scripts over file://.

## Radar des dépendances (`radar.html`)

Le contenu du radar (tendances, technologies, mécanismes d'enfermement) est
dans le dossier `data/`, au format JSON. Voir [`data/README.md`](data/README.md)
pour le format des fichiers et la façon de tester en local.

## Contrôles

| Script | Rôle | Quand |
|---|---|---|
| `scripts/check-data.py` | structure, liens, typographie et règles du radar (`--warn` : sources manquantes, textes longs ; `--placeholders` : marqueurs à compléter dans `index.html`) | CI à chaque push, prek avant commit et push |
| `scripts/check-cases.py` | cohérence des cas chiffrés avec `index.html` | CI, prek avant commit et push |
| `scripts/check-links.py` | liens des sources (échoue sur 404, 410, domaine introuvable ; les sites qui bloquent les robots sont seulement signalés) | CI chaque lundi, prek avant chaque push et à la demande (ignoré sans réseau) |
| `scripts/check-vitality.py` | activité des dépôts open source (API GitHub) | CI chaque lundi, prek à la demande |

Avec [prek](https://github.com/j178/prek) (configuration dans `prek.toml`) : `prek install --hook-type pre-commit --hook-type pre-push` active `check-data` et `check-cases` avant chaque commit et chaque push, et `check-links` avant chaque push (environ une minute) ; `prek run check-links --hook-stage manual` le lance à la demande.
