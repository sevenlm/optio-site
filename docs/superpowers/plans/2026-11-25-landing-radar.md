# Page d’accueil du radar — plan de réalisation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer `radar-des-dependances.html`, page d’accueil marketing et très bien référencée du radar, dont toutes les actions ouvrent `radar.html`.

**Architecture:** Page statique autonome (HTML + CSS + un petit script de compteurs), au style de `index.html`. Les blocs de contenu indexable issus des données sont écrits dans la page par un script Node (`scripts/landing.mjs`) entre des commentaires repères ; les captures d’écran et l’image de partage sont produites par `scripts/captures.mjs` (Playwright) dans `img/radar/`.

**Tech Stack:** HTML/CSS, JavaScript ES5 dans la page (pas de dépendance), Node ≥ 20 (ESM) pour les scripts, Playwright 1.57 (`chromium.launch({channel:"chrome"})`) pour captures et tests, `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-25-landing-radar-design.md`

## Global Constraints

- Fichier `radar-des-dependances.html` à la racine ; adresse canonique `https://www.weareoptio.fr/radar-des-dependances.html`.
- Action principale unique « Ouvrir le radar » → `radar.html` ; action secondaire « Voir un exemple de rapport » → ancre de la section d’aperçu du rapport.
- Identité de `index.html` : logo SVG (cercle + flèche), `--encre #0B2A3C`, `--signal #00A37A`, `--vert #00775A`, gris `#8A9BA6`, polices `fonts/fonts.css` (Archivo, Instrument Sans, JetBrains Mono). Mode sombre, mobile 390 px sans débordement, clavier, contrastes AA, `prefers-reduced-motion` respecté.
- Aucun témoignage, logo client ni chiffre d’impact inventé. Chaque fait chiffré de la page est repris tel quel d’une tendance de `data/tendances.json`, avec le lien de sa source. Ne pas citer d’articles de Seven Lemesle, d’Optio ou de Stratwise comme sources.
- Contribution : liens `mailto:contact@stratwise.fr` avec objets « Radar : proposer une tendance », « Radar : signaler une erreur ou une source », « Radar : proposer une technologie ou une alternative », « Radar : relecture d’expert ».
- FAQ fondée sur le fonctionnement réel : sélection gardée dans le navigateur ; e-mail demandé seulement pour le rapport, via un formulaire Tally ; conservé trois ans après le dernier contact ; accès et suppression à contact@stratwise.fr ; rapport gratuit ; Optio est une marque de Stratwise.
- SEO : un seul `h1` ; `title` ≤ 60 caractères ; `meta description` ≤ 155 ; `lang="fr"` ; canonique ; Open Graph et Twitter Card (`summary_large_image`) avec image 1200 × 630 ; JSON-LD `WebPage`, `WebApplication` (offers 0 EUR), `Organization`, `BreadcrumbList`, `FAQPage`, `DefinedTermSet` ; `width`/`height` et `alt` sur toutes les images ; image principale `fetchpriority="high"`, autres `loading="lazy"` ; aucun script bloquant.
- `index.html` n’est modifié que pour ses liens vers le radar. `check-data.py`, `check-cases.py`, `npm test`, `npm run test:e2e` passent. Commits en français terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Ne jamais pousser.

## Review Focus

1. Données injoignables (ouverture hors serveur ou erreur réseau) : les compteurs gardent leurs valeurs écrites dans la page, aucune erreur JS (test Tâche 1).
2. Données modifiées sans relancer le générateur : le contrôle échoue et indique la commande à lancer (test Tâche 2).
3. Lien profond vers une tendance ou technologie disparue : chaque `radar.html#<id>` généré correspond à un `id` des données (test Tâche 2).
4. En-tête collant qui masque le titre d’une section atteinte par ancre : `scroll-margin-top` sur les sections (test Tâche 1).
5. Mode sombre : texte lisible sur les fonds de section, contrastes AA des boutons (test Tâche 1).

---

### Task 1: Page d’accueil — structure, textes, styles, compteurs

**Files:**
- Create: `radar-des-dependances.html`
- Test: `tests/e2e/accueil-radar.test.mjs`

**Interfaces:**
- Produces (pour les tâches 2 à 4) :
  - commentaires repères vides à remplir par le générateur : `<!-- debut:urgentes -->…<!-- fin:urgentes -->` (dans la section « Les tendances les plus urgentes ») et `<!-- debut:exemples -->…<!-- fin:exemples -->` (dans « Exemples de technologies classées ») ;
  - compteurs : éléments `<span data-compteur="tendances">53</span>` (idem `technologies` 279, `mecanismes` 53, `leviers` 37), valeurs de repli écrites en dur ;
  - emplacements d’images avec `id` : `img-radar` (accroche), `img-technologies`, `img-mecanismes`, `img-leviers`, `img-rapport-garde`, `img-rapport-synthese`, `img-rapport-leviers` ; `src` provisoires vers `img/radar/<nom>.jpg` (fichiers créés en Tâche 3) ;
  - sections avec `id` : `constat`, `fonctionnement`, `comprendre`, `urgentes`, `exemples`, `rapport`, `confiance`, `contribuer`, `faq`.

- [ ] **Step 1: Write the failing tests** `tests/e2e/accueil-radar.test.mjs` (reprendre `ouvrir`/`erreurs` de `tests/e2e/outils.mjs` si utile ; viewport 1280×900 sauf mention) :
  - `structure` : un seul `h1`, de texte « Où votre système d’information est-il enfermé ? » ; sections `#constat, #fonctionnement, #comprendre, #urgentes, #exemples, #rapport, #confiance, #contribuer, #faq` présentes dans cet ordre ; `#comprendre` contient les termes « tendance », « technologie », « mécanisme », « levier », « matrice » (chacun dans un `h3` ou `dt`).
  - `actions` : chaque lien de texte « Ouvrir le radar » a `href="radar.html"` (au moins 3 : en-tête, accroche, appel final) ; « Voir un exemple de rapport » a `href="#rapport"` ; un lien vers le rapport d’exemple `radar.html?rapport=1&r=` existe dans `#rapport`.
  - `contribuer` : 4 liens `mailto:contact@stratwise.fr?subject=` dont les objets décodés sont exactement les 4 objets des Global Constraints ; un lien `mailto:contact@stratwise.fr` aussi dans `#faq` et dans le pied.
  - `compteurs` : après chargement, `[data-compteur=tendances]` vaut le nombre d’entrées de `data/tendances.json` (idem technologies, mécanismes, leviers) ; avec `page.route("**/data/*.json", r => r.abort())`, les valeurs restent celles écrites dans la page et la liste d’erreurs JS est vide.
  - `ancres` : après `location.hash="#faq"`, le haut du titre de `#faq` est sous le bas de l’en-tête collant.
  - `mobile` : viewport 390×844, `document.documentElement.scrollWidth <= 390` ; le bouton « Ouvrir le radar » de l’en-tête est visible.
  - `sombre` : `colorScheme:"dark"`, la couleur du texte de `#comprendre p` et son fond calculé ont un rapport de contraste ≥ 4,5.
  - Aucune erreur JS dans tous les tests.
- [ ] **Step 2: Run** `node --test tests/e2e/accueil-radar.test.mjs` (serveur `python3 -m http.server 8765` à la racine) — attendu : échecs (page absente).
- [ ] **Step 3: Implement** la page selon la structure de la spec (sections 1 à 11, « Contribuez au radar » avant la FAQ, en-tête collant, pied comme `index.html`), textes dans le ton de `index.html` (direct, factuel, vouvoiement), CSS intégré inspiré de `index.html`, petit script de fin de page (ES5) qui charge `data/*.json` et met à jour les compteurs sans décaler la mise en page. Les trois faits du « constat » sont repris tels quels de tendances de l’anneau Fort, chacun avec un lien vers sa source. FAQ et contribution selon les Global Constraints. Les images peuvent manquer à ce stade (Tâche 3) : garder `width`/`height` et `alt`.
- [ ] **Step 4: Run** `node --test tests/e2e/accueil-radar.test.mjs` puis `npm test && npm run test:e2e` — attendu : tout passe.
- [ ] **Step 5: Commit** `feat(accueil): page d’accueil du radar des dépendances`

---

### Task 2: Contenu indexable généré depuis les données

**Files:**
- Create: `scripts/landing.mjs`
- Create: `tests/unit/landing.test.mjs`
- Modify: `package.json` (script `"landing": "node scripts/landing.mjs"` ; `"test"` lance aussi `tests/unit/*.test.mjs`)
- Modify: `radar-des-dependances.html` (blocs générés)

**Interfaces:**
- Consumes: repères `debut:urgentes`/`fin:urgentes`, `debut:exemples`/`fin:exemples` (Tâche 1).
- Produces (exports ESM de `scripts/landing.mjs`) :
  - `lireDonnees(racine: string) -> {tendances, technologies, mecanismes, leviers}`
  - `blocUrgentes(donnees) -> string` : une liste HTML des tendances d’anneau 0 (Fort), triées par axe puis titre ; pour chacune : titre en lien `radar.html#<id>`, axe, première phrase du champ `risque`.
  - `blocExemples(donnees) -> string` : pour chaque anneau de technologie 0, 1 et 2, les 3 technologies citées par le plus de tendances (égalité : nom), chacune avec son anneau, sa première alternative mieux classée présente dans le radar et le lien `radar.html#<id>`.
  - `remplacerBloc(html: string, nom: string, contenu: string) -> string` : remplace le contenu entre `<!-- debut:<nom> -->` et `<!-- fin:<nom> -->` ; lève une erreur si un repère manque.
  - `genererPage(html: string, donnees) -> string`
  - CLI : `node scripts/landing.mjs` réécrit la page ; `node scripts/landing.mjs --verifier` sort en code 1 avec le message « Contenu généré périmé : lancez npm run landing » si la page diffère de `genererPage`.
  - Tout texte des données est échappé (`& < > "`).

- [ ] **Step 1: Write the failing tests** `tests/unit/landing.test.mjs` :
  - `remplacerBloc` remplace le contenu entre repères et lève une erreur si un repère manque.
  - `blocUrgentes` sur un jeu de données réduit (3 tendances dont 2 d’anneau 0) : 2 entrées, liens `radar.html#<id>`, texte échappé (`<b>` → `&lt;b&gt;`).
  - `blocExemples` sur les vraies données : 9 entrées au plus, chaque alternative a un anneau strictement supérieur à celui de la technologie.
  - Tous les `radar.html#<id>` produits par `genererPage` sur les vraies données correspondent à un `id` existant.
  - La page du dépôt est à jour : `genererPage(page, vraiesDonnees) === page`.
- [ ] **Step 2: Run** `npm test` — attendu : échecs (module absent).
- [ ] **Step 3: Implement** `scripts/landing.mjs`, puis `npm run landing` pour remplir la page.
- [ ] **Step 4: Run** `npm test && node scripts/landing.mjs --verifier && npm run test:e2e` — attendu : tout passe ; modifier temporairement un titre dans une copie des données en mémoire (test) prouve que la vérification échoue.
- [ ] **Step 5: Commit** `feat(accueil): tendances urgentes et exemples de technologies générés depuis les données`

---

### Task 3: Captures et image de partage

**Files:**
- Create: `scripts/captures.mjs`
- Create: `img/radar/*.jpg` (générés), `img/radar/partage.png` (1200 × 630)
- Modify: `radar-des-dependances.html` (dimensions réelles des images si besoin)
- Modify: `package.json` (script `"captures": "node scripts/captures.mjs"`)

**Interfaces:**
- Consumes: `adresseRapport` (`tests/e2e/outils.mjs`) ou `OptioSelection.urlRapport` (`js/selection.js`) pour le jeton du rapport d’exemple ; identifiants d’images de la Tâche 1.
- Produces : `img/radar/radar.jpg`, `technologies.jpg`, `mecanismes.jpg`, `leviers.jpg`, `rapport-garde.jpg`, `rapport-synthese.jpg`, `rapport-leviers.jpg`, `partage.png` ; le lien du rapport d’exemple de `#rapport` utilise le même jeton.
- Sélection d’exemple (fixe) : tendances `fin-des-licences-perpetuelles`, `dependance-cognitive-a-lassistant-ia`, `penurie-de-competences-cyber-face-a-nis2` ; technologies `vmware-vsphere-et-vcf`, `oracle-database`, `microsoft-365`, `github-copilot` (vérifier les `id` dans les données ; date `2026-11-25`).

- [ ] **Step 1: Write the failing test** (dans `tests/e2e/accueil-radar.test.mjs`) `images` : chaque `img` de la page se charge (`naturalWidth > 0`), a `alt` non vide, `width` et `height` ; l’image de l’accroche a `fetchpriority="high"`, les autres `loading="lazy"` ; `img/radar/partage.png` mesure 1200 × 630 ; chaque JPEG pèse moins de 250 Ko.
- [ ] **Step 2: Run** — attendu : échecs.
- [ ] **Step 3: Implement** `scripts/captures.mjs` (serveur local 8765 requis, le script le vérifie et l’indique) : captures écran clair 1280 px du radar, de la vue Technologies, de la table des mécanismes, de la vue Leviers, et du rapport d’exemple en mode impression (garde, synthèse, leviers), JPEG qualité 80 ; `partage.png` = petite page HTML aux couleurs d’Optio (logo, « Radar des dépendances numériques », accroche) rendue en 1200 × 630. Lancer `npm run captures`, regarder chaque image et corriger les cadrages.
- [ ] **Step 4: Run** `npm test && npm run test:e2e` — attendu : tout passe.
- [ ] **Step 5: Commit** `feat(accueil): captures du radar et du rapport, image de partage`

---

### Task 4: Référencement, données structurées, liens et déploiement

**Files:**
- Modify: `radar-des-dependances.html` (`head`, JSON-LD)
- Modify: `sitemap.xml`, `index.html` (liens seulement), `radar.html` (lien « Découvrir le radar »)
- Modify: `Containerfile`, `.containerignore`, `scripts/serve-local.sh` (nouvelle page et `img/`)
- Create: `tests/e2e/accueil-seo.test.mjs`

**Interfaces:**
- Consumes: page complète (Tâches 1 à 3), `img/radar/partage.png`.

- [ ] **Step 1: Write the failing tests** `tests/e2e/accueil-seo.test.mjs` :
  - `balises` : `title` ≤ 60 caractères et contient « Radar des dépendances » ; `meta description` ≤ 155 et ≥ 70 ; `link[rel=canonical]` = `https://www.weareoptio.fr/radar-des-dependances.html` ; `og:title`, `og:description`, `og:url` (= canonique), `og:image` (= `https://www.weareoptio.fr/img/radar/partage.png`), `og:image:width` 1200, `og:image:height` 630, `og:locale` `fr_FR`, `twitter:card` `summary_large_image` ; `html[lang=fr]`.
  - `json-ld` : chaque `script[type="application/ld+json"]` est du JSON valide ; les `@type` `WebPage`, `WebApplication`, `Organization`, `BreadcrumbList`, `FAQPage`, `DefinedTermSet` sont présents ; le nombre de questions de `FAQPage` égale le nombre de questions visibles dans `#faq`, avec le même texte ; `WebApplication.offers.price` vaut `"0"` et `priceCurrency` `"EUR"`.
  - `liens internes` : chaque `href` relatif de la page répond 200 sur le serveur local (ancres : la cible existe).
  - `maillage` : `sitemap.xml` contient la nouvelle adresse avec `lastmod` ; le menu et le pied de `index.html` ont un lien vers `radar-des-dependances.html` ; `radar.html` a un lien vers `radar-des-dependances.html`.
  - `performance` : aucun `script` sans `defer`/`async` dans le `head` ; les polices sont préchargées (`link[rel=preload][as=font]`).
- [ ] **Step 2: Run** — attendu : échecs.
- [ ] **Step 3: Implement** le `head` et le JSON-LD (glossaire = termes de `#comprendre`, FAQ = questions de `#faq`), sitemap (`lastmod` du jour), liens de `index.html` (menu « Radar », pied, et une mention dans le corps près de la méthode) et de `radar.html` (lien discret « Découvrir le radar » dans l’en-tête du radar, hors mode rapport), fichiers de conteneur.
- [ ] **Step 4: Run** `npm test && npm run test:e2e && python3 scripts/check-data.py && python3 scripts/check-cases.py && node scripts/landing.mjs --verifier` — attendu : tout passe.
- [ ] **Step 5: Commit** `feat(accueil): référencement, données structurées et maillage`
