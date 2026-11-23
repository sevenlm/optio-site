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
| `scripts/check-data.py` | structure, liens, typographie et règles du radar (`--warn` : sources manquantes, textes longs ; `--placeholders` : marqueurs à compléter dans `index.html` et `radar.html`) | CI à chaque push, prek avant commit et push |
| `scripts/check-cases.py` | cohérence des cas chiffrés avec `index.html` | CI, prek avant commit et push |
| `scripts/check-links.py` | liens des sources (échoue sur 404, 410, domaine introuvable ; les sites qui bloquent les robots sont seulement signalés) | CI chaque lundi, prek avant chaque push et à la demande (ignoré sans réseau) |
| `scripts/check-vitality.py` | activité des dépôts open source (API GitHub) | CI chaque lundi, prek à la demande |

Avec [prek](https://github.com/j178/prek) (configuration dans `prek.toml`) : `prek install --hook-type pre-commit --hook-type pre-push` active `check-data` et `check-cases` avant chaque commit et chaque push, et `check-links` avant chaque push (environ une minute) ; `prek run check-links --hook-stage manual` le lance à la demande.

## Rapport personnalisé : réglages

> **À faire avant de fusionner sur `main`** : renseigner `tallyFormId` et `calLien` dans `js/config.js`. Tant que `tallyFormId` est vide, le bouton « Recevoir mon rapport complet (PDF) » n'ouvre aucun formulaire en production : il affiche seulement le message de repli (écrire à contact@stratwise.fr avec le lien du rapport). Une fois les valeurs renseignées, faire un essai de bout en bout avec le vrai formulaire : demande depuis « Mon radar », réception de l'e-mail, ouverture du rapport, réservation Cal.com.

Les réglages sont dans `js/config.js` (`window.OPTIO_CONFIG`) ; une valeur vide signifie « non configuré ».

| Clé | Rôle |
|---|---|
| `tallyFormId` | identifiant du formulaire Tally (ex. `wXyZ12`). Vide : en local (`localhost`, `127.0.0.1`) le clic ouvre directement le rapport, ailleurs un message invite à écrire à Optio avec le lien du rapport |
| `calLien` | lien de prise de rendez-vous Cal.com : boutons « Réserver 30 minutes » du rapport (le lien du rapport y est joint dans `notes=`) et e-mail envoyé au répondant. Vide : les boutons mènent à `index.html#contact` |
| `urlSite` | URL publique de `radar.html`, base du lien du rapport personnel (en local, `localhost` ou `127.0.0.1`, l'adresse de la page est utilisée à la place) |

Tally n'est chargé qu'au clic sur « Recevoir mon rapport complet (PDF) » : le clic vaut consentement, la phrase d'information est affichée sous le bouton.

Création du formulaire Tally :

- champs visibles : e-mail et consentement ;
- champs cachés : `selection` (sélection encodée) et `rapport` (lien du rapport personnel) ;
- e-mail au répondant (offre Pro) contenant le lien `@rapport` et le lien Cal.com ;
- notification à Optio à chaque envoi ;
- si Tally est utilisé en pleine page plutôt qu'en popup, « Redirect on completion » doit pointer vers le champ caché `@rapport`.

## Tests

Prérequis : Node.js et Google Chrome installés (les tests de bout en bout utilisent le Chrome du poste via Playwright).

```bash
npm install                      # Playwright
python3 -m http.server 8765      # à la racine du dépôt, dans un autre terminal
npm test                         # tests unitaires (js/selection.js)
npm run test:e2e                 # tests de bout en bout du radar (http://localhost:8765)
```
