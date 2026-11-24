# Figures, chapitrage et sommaire du rapport — plan de réalisation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Le rapport personnalisé (`radar.html?rapport=1&…`) gagne des chapitres numérotés, un sommaire (volet à l’écran, page à l’impression), deux radars de la sélection, une matrice criticité × réversibilité et la table de l’enfermement.

**Architecture:** Tout se passe dans `rendreRapport(sel)` de `radar.html` (IIFE ES5, helpers `el()` et `s()`), qui construit le rapport en DOM. Les figures sont des SVG/HTML statiques construits par de nouvelles fonctions du même fichier, qui réutilisent la géométrie existante (`C`, `R`, `angles`, `segment`, `etiquettesAnneaux`, `placer`). Le seul calcul nouveau et pur, la criticité, va dans `js/selection.js` pour être testé unitairement.

**Tech Stack:** HTML/CSS/JS ES5 sans dépendance ; tests `node --test` (unitaires) et Playwright 1.57 avec `chromium.launch({channel:"chrome"})` (bout en bout, serveur `python3 -m http.server 8765` à la racine).

**Spec:** `docs/superpowers/specs/2026-11-24-rapport-figures-design.md` (complète `docs/superpowers/specs/2026-11-23-rapport-personnalise-design.md`)

## Global Constraints

- Site statique : aucun serveur, aucune dépendance d’exécution ajoutée ; ES5 dans `radar.html` et `js/selection.js` (pas de `let`, `const`, flèches, gabarits).
- Le rapport reste factuel : seule la criticité est une estimation, et la figure le dit avec ce titre exact : « Positionnement indicatif, estimé à partir du radar — à affiner avec vous en rendez-vous ».
- Criticité : somme, sur les tendances qui citent la technologie, d’un poids selon l’urgence (Fort 3, Élevé 2, Moyen 1, Faible 0), ramenée sur une échelle de 1 à 5.
- Chapitres, dans cet ordre : 1 Synthèse (radars et matrice), 2 Technologies retenues, 3 Tendances retenues, 4 Mécanismes probables (table en tête), 5 Sources, 6 Analysons ce rapport ensemble. Un chapitre sans contenu est omis et la numérotation suit.
- Sommaire : volet de navigation à l’écran (à gauche, collant, sur écran large ; bouton « Sommaire » sur mobile), absent à l’impression ; page « Sommaire » à l’impression seulement, juste après la page de garde, liens cliquables, sans numéros de page.
- Chaque chapitre commence sur une nouvelle page à l’impression ; aucune figure n’est coupée entre deux pages.
- Lisible en mode sombre à l’écran, à l’impression (couleurs forcées) et sur mobile 390 px sans débordement horizontal de la page.
- Chaque figure a un nom accessible (`role="img"` + `aria-label` sur le SVG, ou `figure` + `figcaption`).
- Ne pas casser le radar interactif ni les tests existants ; `python3 scripts/check-data.py` et `python3 scripts/check-cases.py` passent ; `index.html` n’est pas modifié.
- Messages de commit en français, terminés par la ligne `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Ne jamais pousser.

## Review Focus

1. Plusieurs technologies retenues dans le même anneau avec la même criticité : leurs points ne doivent pas se superposer sur la matrice (test dans la tâche 4).
2. Grande sélection (60 technologies et 20 tendances) : le rapport s’affiche sans erreur, le volet de navigation défile dans sa hauteur au lieu de déborder (test dans la tâche 2).
3. Technologie retenue qu’aucune tendance ne cite : criticité 1, point en bas de la matrice, pas de NaN (tests dans les tâches 1 et 4).
4. Palette du radar des tendances en mode rapport : `:root[data-vue="technologies"]` redéfinit `--a0..3` ; le radar des tendances du rapport doit utiliser les couleurs d’urgence des tendances quel que soit `data-vue` (test dans la tâche 3).
5. Sélection avec technologies seulement (aucune tendance) : pas de radar des tendances, pas de chapitre Tendances ni Mécanismes, numérotation continue 1 Synthèse, 2 Technologies, 3 Sources, 4 rendez-vous (test dans la tâche 2).

---

### Task 1: Criticité estimée (`criticites`)

**Files:**
- Modify: `js/selection.js` (ajout de la fonction et export dans l’objet `OptioSelection`)
- Test: `tests/unit/selection.test.js`

**Interfaces:**
- Produces: `OptioSelection.criticites(donnees) -> dico` où `donnees = {technologies:[{id, nom, …}], tendances:[{id, anneau, type?, technologies?:[noms]}]}` et le résultat est un objet sans prototype `id → {poids:number, score:number}`, une entrée par technologie de `donnees.technologies`. `score` est arrondi au dixième, entre 1 et 5.

- [ ] **Step 1: Write the failing tests** dans `tests/unit/selection.test.js` :

```js
const D = {
  technologies: [{ id: "a", nom: "A" }, { id: "b", nom: "B" }, { id: "c", nom: "C" }],
  tendances: [
    { id: "t1", anneau: 0, technologies: ["A", "B"] },
    { id: "t2", anneau: 1, technologies: ["A", "A"] },
    { id: "t3", anneau: 3, technologies: ["B"] },
    { id: "t4", anneau: 0, type: "levier", technologies: ["C"] },
    { id: "t5", anneau: 2 }
  ]
};
test("criticites : poids par urgence, nom cité une seule fois par tendance, leviers ignorés", () => {
  const c = criticites(D);
  assert.deepEqual({ ...c.a }, { poids: 5, score: 5 });
  assert.deepEqual({ ...c.b }, { poids: 3, score: 3.4 });
  assert.deepEqual({ ...c.c }, { poids: 0, score: 1 });
});
test("criticites : aucune tendance ne cite rien, tout vaut 1", () => {
  const c = criticites({ technologies: D.technologies, tendances: [] });
  assert.equal(c.a.score, 1); assert.equal(c.b.score, 1);
});
test("criticites : identifiant « constructor » sans collision avec le prototype", () => {
  const c = criticites({ technologies: [{ id: "constructor", nom: "X" }], tendances: [{ id: "t", anneau: 1, technologies: ["X"] }] });
  assert.equal(c.constructor.score, 5);
});
```

(Ajouter `criticites` à la déstructuration `require("../../js/selection.js")` en tête du fichier.)

- [ ] **Step 2: Run** `npm test` — attendu : les trois nouveaux tests échouent (`criticites is not a function`).

- [ ] **Step 3: Implement `criticites(donnees)`** : poids d’une tendance `3 - anneau` ; tendances `type === "levier"` ignorées ; chaque nom compté une fois par tendance (`unique`) ; `score = 1 + 4 * poids / poidsMax` arrondi au dixième (`Math.round(x * 10) / 10`), et 1 partout si `poidsMax === 0`. Utiliser `dico()` existant.

- [ ] **Step 4: Run** `npm test` — attendu : tout passe (14 tests).

- [ ] **Step 5: Commit** `feat(rapport): criticité estimée des technologies`

---

### Task 2: Chapitres, sommaire imprimé et volet de navigation

**Files:**
- Modify: `radar.html` (`rendreRapport`, CSS `.rapport…` et bloc `@media print`)
- Test: `tests/e2e/rapport-chapitres.test.mjs` (nouveau ; reprendre le gabarit `rapport()` de `tests/e2e/rapport.test.mjs`)
- Modify si besoin : `tests/e2e/rapport.test.mjs` (seulement si une assertion existante contredit l’omission du chapitre Mécanismes sans tendance)

**Interfaces:**
- Produces (utilisés par les tâches 3 à 5) :
  - Chaque chapitre est une `section.rapport-partie.rapport-chap` avec un `id` fixe : `ch-synthese`, `ch-technologies`, `ch-tendances`, `ch-mecanismes`, `ch-sources`, `ch-rdv`. La synthèse actuelle (`section.rapport-bloc.rapport-synthese`) devient le chapitre `ch-synthese` (garder la classe `rapport-synthese`).
  - Le `h2` de chaque chapitre garde exactement son texte actuel (« Synthèse », « Technologies retenues », « Tendances retenues », « Mécanismes probables », « Sources », « Analysons ce rapport ensemble, 15 minutes ») ; le numéro est affiché par un compteur CSS (`counter-reset` sur `#rapport`, `.rapport-chap > h2::before{content:counter(chap) ". "}`), donc absent de `innerText` et du texte accessible du titre.
  - Chaque carte de technologie a `id="fiche-<id technologie>"`, chaque carte de tendance `id="fiche-<id tendance>"`.
  - Fonction `sommaireRapport(chapitres)` où `chapitres = [{id, titre, fiches:[{id, titre}]}]` (seulement les chapitres présents) ; elle produit le volet et la page imprimée.
  - Chapitre Mécanismes omis quand `sy.mecanismes` est vide.
- Volet écran : `nav.rapport-nav.ecran-seul` avec `aria-label="Sommaire du rapport"`, contenant un `button.rapport-nav-bouton` (« Sommaire », `aria-expanded`, `aria-controls`) visible seulement sous 1100 px, et une `ol` de liens `a[href="#ch-…"]`, avec sous-listes des fiches (`a[href="#fiche-…"]`) pour les chapitres 2 et 3. À partir de 1100 px : le rapport passe en grille (volet ~240 px à gauche, `position:sticky`, `max-height:calc(100vh - 32px)`, `overflow:auto`, contenu à droite, largeur de lecture actuelle 900 px). Le lien du chapitre en cours porte `aria-current="location"` (IntersectionObserver ; sans IntersectionObserver, rien n’est surligné et rien ne casse).
- Page imprimée : `nav.rapport-sommaire.imprime-seul` insérée juste après `.rapport-garde`, titre « Sommaire » (élément non numéroté, pas de classe `rapport-chap`), `ol` des chapitres avec liens `#ch-…`, sans numéros de page.

- [ ] **Step 1: Write the failing tests** dans `tests/e2e/rapport-chapitres.test.mjs` :
  - `chapitres complets dans l’ordre` : adresse `radar.html?rapport=1&t=fin-des-licences-perpetuelles&x=vmware-vsphere-et-vcf,openstack&d=2026-11-23` → `ids de #rapport .rapport-chap` égal à `["ch-synthese","ch-technologies","ch-tendances","ch-mecanismes","ch-sources","ch-rdv"]` ; `getComputedStyle(h2,"::before").content` du chapitre `ch-sources` contient `5`.
  - `technologies seules : chapitres omis et numérotation continue` : `?rapport=1&x=vmware-vsphere-et-vcf&d=2026-11-23` → ids `["ch-synthese","ch-technologies","ch-sources","ch-rdv"]` ; `::before` de `ch-sources` contient `3`.
  - `volet écran large` (viewport 1280×900) : `.rapport-nav` visible, `.rapport-nav-bouton` caché ; liens de chapitres (`.rapport-nav a[href^="#ch-"]`) = 6 ; un lien `a[href="#fiche-vmware-vsphere-et-vcf"]` existe ; après `#ch-sources.scrollIntoView()` et 500 ms, `.rapport-nav a[href="#ch-sources"]` a `aria-current="location"`.
  - `volet mobile` (viewport 390×844) : liste du volet cachée, bouton « Sommaire » visible avec `aria-expanded="false"` ; clic → `aria-expanded="true"` et liens visibles ; `document.documentElement.scrollWidth <= 390`.
  - `impression` : `page.emulateMedia({media:"print"})` → `.rapport-nav` non visible ; `.rapport-sommaire` visible, placé juste après `.rapport-garde`, avec 6 liens `#ch-…` ; `getComputedStyle(.rapport-chap).breakBefore === "page"` pour chaque chapitre.
  - `grande sélection` : 60 premiers `id` de `data/technologies.json` et 20 premiers de `data/tendances.json` (lus par `fetch` dans la page, adresse construite avec `OptioSelection.urlRapport` ou à la main) → `data-etat="complet"`, aucune erreur JS, sur 1280×900 la hauteur de `.rapport-nav` ≤ 900.
  - Tous les tests : liste `erreurs(p)` vide.

- [ ] **Step 2: Run** `npx node --test tests/e2e/rapport-chapitres.test.mjs` (serveur sur 8765) — attendu : échecs (pas de `.rapport-chap`).

- [ ] **Step 3: Implement** dans `rendreRapport` : sections numérotées, ids, omission du chapitre Mécanismes sans mécanisme, `sommaireRapport(chapitres)` appelé une fois la liste des chapitres connue ; CSS écran (grille ≥ 1100 px, volet collant, bouton mobile) et impression (`.rapport-chap{break-before:page}`, sommaire imprimé sur sa propre page, volet masqué). Mode sombre : utiliser uniquement les variables existantes (`--surface`, `--line`, `--text-2`…).

- [ ] **Step 4: Run** `npm test && npm run test:e2e` — attendu : tout passe (anciens et nouveaux).

- [ ] **Step 5: Commit** `feat(rapport): chapitres numérotés, sommaire imprimé et volet de navigation`

---

### Task 3: Radars de la sélection

**Files:**
- Modify: `radar.html` (nouvelle fonction, appel dans le chapitre Synthèse, CSS)
- Test: `tests/e2e/rapport-figures.test.mjs` (nouveau)

**Interfaces:**
- Consumes: chapitre `#ch-synthese` (tâche 2) ; `C`, `R`, `angles(n)`, `segment(r0,r1,a0,a1)`, `etiquettesAnneaux(V)`, `placer(items, rb)`, `rb()`, `VUES`, `TECH`, `T`, `deja`, `vue`.
- Produces: `figureRadar(nomVue, retenus) -> HTMLElement` où `nomVue` vaut `"technologies"` ou `"tendances"` et `retenus` est la liste des objets internes (`TECH`/`T`) retenus. Retourne `figure.rapport-figure.rapport-radar[data-vue=nomVue]` contenant un SVG `role="img"` (aria-label « Radar des technologies : N retenues sur M » / « Radar des tendances : N retenues sur M »), une `figcaption`, et une légende `ol.rapport-legende` (numéro affiché sur le radar + nom, dans l’ordre des numéros).
- Placement : réutiliser `placer` comme `radarLie` le fait (basculer temporairement `vue`, `placer(liste, rb())`, `deja[nomVue]=true`, restaurer `vue`), pour que les positions soient celles du radar interactif.
- Dessin statique : segments d’anneaux colorés (`--x0..3` pour les technologies ; couleurs d’urgence des tendances pour les tendances), titres de secteurs comme `radarLie`, autres éléments en petits points pâles, éléments retenus en cercles pleins numérotés (`class="pt-retenu"`), aucune animation, aucun gestionnaire d’événement. Couleurs des tendances : ne pas dépendre de `:root[data-vue]` (prendre des variables dédiées au rapport ou fixer `data-vue` des figures de façon que `--a0..3` soient celles des tendances).
- Les deux radars sont insérés dans `#ch-synthese` après les chiffres existants, côte à côte au-dessus de 900 px de large disponible, empilés en dessous ; chacun seulement si sa liste est non vide. `break-inside:avoid` sur `.rapport-figure`.

- [ ] **Step 1: Write the failing tests** dans `tests/e2e/rapport-figures.test.mjs` :
  - `radars : un point par élément retenu` : adresse complète de la tâche 2 → `.rapport-radar[data-vue="technologies"] svg[role="img"]` existe et contient 2 `.pt-retenu` ; `.rapport-radar[data-vue="tendances"]` contient 1 `.pt-retenu` ; chaque légende a autant d’`li` que de points ; les deux figures sont dans `#ch-synthese`.
  - `radars : technologies seules` : `?rapport=1&x=vmware-vsphere-et-vcf&d=2026-11-23` → pas de `.rapport-radar[data-vue="tendances"]`.
  - `radar des tendances : couleurs d’urgence` : la couleur de remplissage calculée du segment de l’anneau 0 du radar des tendances est égale à `getComputedStyle(document.documentElement).getPropertyValue("--a0")` lue sur une page radar normale en vue Tendances (comparer les valeurs `rgb` calculées).
  - `radars : mode sombre et impression` : `colorScheme:"dark"` → aucune erreur, figures visibles ; `emulateMedia({media:"print"})` → `getComputedStyle(.rapport-figure).breakInside === "avoid"`.

- [ ] **Step 2: Run** `npx node --test tests/e2e/rapport-figures.test.mjs` — attendu : échecs.

- [ ] **Step 3: Implement** `figureRadar` et son insertion.

- [ ] **Step 4: Run** `npm test && npm run test:e2e` — attendu : tout passe.

- [ ] **Step 5: Commit** `feat(rapport): radars des technologies et des tendances retenues`

---

### Task 4: Matrice criticité × réversibilité

**Files:**
- Modify: `radar.html` (nouvelle fonction, appel dans `#ch-synthese` après les radars, CSS)
- Test: `tests/e2e/rapport-figures.test.mjs`

**Interfaces:**
- Consumes: `OptioSelection.criticites(donnees)` (tâche 1) appelée avec `DONNEES_BRUTES` ; `#ch-synthese` (tâche 2) ; numéros `x.n` des technologies (mêmes numéros que le radar de la tâche 3).
- Produces: `figureMatrice(technos, crit) -> HTMLElement` où `technos` est la liste des objets `TECH` retenus et `crit` le résultat de `criticites`. Retourne `figure.rapport-figure.rapport-matrice` avec :
  - un SVG `role="img"` (aria-label « Matrice criticité et réversibilité : N technologies ») ; axe horizontal = anneau, 4 colonnes de gauche à droite « Sortie difficile », « Exigeante », « Maîtrisable », « Facilitée » (libellés `VUES.technologies.anneaux` ou `courts`), fonds de colonne `--x0..3` ; axe vertical = criticité de 1 (bas) à 5 (haut), graduée 1 à 5, libellé « Criticité estimée ↑ » ;
  - un point par technologie : `circle` dans un `g.pt-matrice` avec `data-id`, `data-criticite` (le `score`), numéro `x.n` dans le cercle ;
  - points d’une même colonne et de criticité proche (même dixième arrondi à 0,5) répartis horizontalement dans la colonne pour que deux centres soient séparés d’au moins le diamètre ;
  - `figcaption` dont la première phrase est exactement « Positionnement indicatif, estimé à partir du radar — à affiner avec vous en rendez-vous », suivie de : « Criticité estimée : urgence des tendances du radar qui citent la technologie (forte 3, élevée 2, moyenne 1, faible 0), ramenée de 1 à 5. » ;
  - une légende `ol.rapport-legende` numéro + nom.
- Affichée seulement s’il y a au moins une technologie retenue.

- [ ] **Step 1: Write the failing tests** (même fichier) :
  - `matrice : position et criticité` : adresse complète → `.rapport-matrice .pt-matrice` = 2 ; pour chacun, `data-criticite` égal à `OptioSelection.criticites(...)[id].score` calculé dans la page ; le centre `cx` de VMware (anneau 0) < celui d’OpenStack (anneau 2) ; la légende contient les deux noms ; `figcaption` commence par « Positionnement indicatif, estimé à partir du radar — à affiner avec vous en rendez-vous ».
  - `matrice : points sans recouvrement` : sélection de toutes les technologies d’anneau 0 (ids lus dans `data/technologies.json`) → pour toute paire de `.pt-matrice circle`, distance entre centres ≥ 2 × r.
  - `matrice : technologie sans tendance` : choisir dans les données une technologie qu’aucune tendance ne cite (la chercher dans la page ; si aucune n’existe, `test.skip` avec un message) → `data-criticite="1"` et `cy` maximal de la figure (en bas).
  - `matrice : absente sans technologie` : `?rapport=1&t=fin-des-licences-perpetuelles&d=2026-11-23` → pas de `.rapport-matrice`.

- [ ] **Step 2: Run** `npx node --test tests/e2e/rapport-figures.test.mjs` — attendu : les nouveaux tests échouent.

- [ ] **Step 3: Implement** `figureMatrice` et son insertion.

- [ ] **Step 4: Run** `npm test && npm run test:e2e` — attendu : tout passe.

- [ ] **Step 5: Commit** `feat(rapport): matrice criticité et réversibilité, criticité estimée`

---

### Task 5: Table de l’enfermement

**Files:**
- Modify: `radar.html` (nouvelle fonction, appel en tête de `#ch-mecanismes`, CSS)
- Test: `tests/e2e/rapport-figures.test.mjs`

**Interfaces:**
- Consumes: `sy.mecanismes` (`[{meca:{id, couche, moment, symbole, court, nom}, nb}]`) ; tous les mécanismes de `DONNEES_BRUTES.mecanismes` ; `COUCHES` (ordre d’affichage des 7 couches), `COUCHE_LIB` (libellés) et `MOMENTS` (4 libellés) déjà définis dans `radar.html` ; couleurs `--fam0..6` / `--fam0t..6t` déjà utilisées par la table de la vue Mécanismes.
- Produces: `figureTable(probables) -> HTMLElement` : `figure.rapport-figure.rapport-table` contenant une grille HTML (pas de SVG) 7 lignes (dans l’ordre `COUCHES`, comme la vue Mécanismes) × 4 colonnes avec en-têtes de moments et libellés de couches ; dans chaque case, une tuile par mécanisme de cette couche et de ce moment (symbole, `title` = nom) ; les mécanismes probables portent la classe `allume` et `aria-label` = nom, les autres sont pâles ; `figcaption` : « N mécanisme(s) probable(s), M / 7 couches touchées » (pluriels accordés via `pluriel`). Sur mobile, la grille défile dans sa figure (`overflow-x:auto`) sans faire déborder la page.

- [ ] **Step 1: Write the failing tests** (même fichier) :
  - `table : mécanismes probables allumés` : adresse complète → `.rapport-table` est le premier élément après le `h2` de `#ch-mecanismes` (ou la première figure du chapitre) ; 4 en-têtes de moments et 7 libellés de couches ; nombre de `.allume` = `OptioSelection.synthese(...).mecanismes.length` ; nombre total de tuiles = nombre de mécanismes de `data/mecanismes.json` ; la légende indique ce nombre et le nombre de couches distinctes des probables.
  - `table : mobile` : viewport 390×844 → `document.documentElement.scrollWidth <= 390`.
  - `table : impression` : `breakInside === "avoid"` sur la figure ; tuiles `.allume` d’une couleur de fond différente des tuiles pâles.

- [ ] **Step 2: Run** `npx node --test tests/e2e/rapport-figures.test.mjs` — attendu : les nouveaux tests échouent.

- [ ] **Step 3: Implement** `figureTable` et son insertion.

- [ ] **Step 4: Run** `npm test && npm run test:e2e && python3 scripts/check-data.py && python3 scripts/check-cases.py` — attendu : tout passe.

- [ ] **Step 5: Commit** `feat(rapport): table de l’enfermement avec les mécanismes probables`
