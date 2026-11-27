# Refonte visuelle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer les motifs de modèle générique (gros chiffres, étiquettes, cartes) par une présentation de rapport d’expert, et ramener les montants d’exemple à l’échelle des entreprises de 2 000 à 20 000 salariés.

**Architecture:** Site statique sans build : CSS et JS en ligne dans `index.html` et `radar-des-dependances.html`. On garde les noms de classes testés, on change le balisage et le CSS. Le cas n° 1 passe au modèle de calcul de la spec, porté dans `scripts/check-cases.py`.

**Tech Stack:** HTML/CSS/JS sans framework, Python 3 pour les contrôles, Node `node:test` + Playwright pour les tests.

**Spec:** `docs/superpowers/specs/2026-11-27-refonte-visuelle-design.md` (maquettes : `.superpowers/brainstorm/43055-1795775386/content/direction-c-variantes.html` variante C3, `frise-libre-v3.html`).

## Global Constraints

- Palette inchangée : `--encre:#0B2A3C`, `--signal:#00A37A`, `--vert:#00775A` ; texte blanc sur fond sombre ; titres en Archivo, texte en Instrument Sans, chiffres en JetBrains Mono. Aucune nouvelle police ni dépendance.
- Textes du site inchangés sauf montants du cas n° 1 et indicateur de taille.
- Indicateur de taille, texte exact : « Estimation pour une entreprise de 2 000 à 20 000 salariés ».
- Pas de tiret long dans le texte visible ; apostrophes typographiques (’).
- Tous les tests existants restent verts (`npm test`, `npm run test:e2e`), ainsi que `check-data.py`, `check-cases.py`, `node scripts/landing.mjs --verifier`.

## Review Focus

- Mobile 390 px : la frise LIBRE à cinq colonnes et les tableaux de cas doivent passer en colonne sans défilement horizontal → test dans la tâche 3.
- Mode sombre (`prefers-color-scheme: dark`) : le panneau du haut de page et les tableaux restent lisibles → test de contraste AA dans la tâche 2.
- Montants : la page, la spec et `check-cases.py` doivent dire la même chose pour le cas n° 1 → tâche 1.
- Navigation des cas au clavier (flèches) conservée après passage aux tableaux → test existant à garder vert, tâche 3.
- Le panneau du haut de page dérive du même tableau `F` que le tableau de bord : un seul jeu de données → tâche 2.

---

### Task 1: Montants à l’échelle de la cible

**Files:**
- Modify: `scripts/check-cases.py` (cas 1)
- Modify: `index.html` (cas 1 : situation, composantes, barres, décision, gain, hypothèses ; tableau `F` du tableau de bord ; indicateur de taille sous les cas et sous le tableau de bord)
- Modify: `docs/spec-tcd-et-indice-reversibilite.md` (§ 3.9 et annexe JSON)
- Test: `tests/e2e/index-seo.test.mjs` (ajout)

**Interfaces:**
- Produces: `def tcd_spec(C0, h, hN, mE, I, K, P, M, T, A, D=6, R=6, rho=0.8, iota=0.5, H=5) -> dict` dans `scripts/check-cases.py`, retournant `{"rester", "renegocier", "sortir"}` en M€ (modèle § 3.6 de la spec, sans indexation ni actualisation).
- Produces: classe CSS `.echelle` (pastille verte + texte) utilisée par les tâches 2 et 3.

- [ ] **Step 1: Test** — dans `tests/e2e/index-seo.test.mjs`, `test("montants : indicateur de taille et cas 1 à l’échelle")` : `#exemples .echelle` et `#tableau .echelle` contiennent exactement le texte de l’indicateur ; le texte de `#exemples` contient « 600 k€ par an », « 5,0 M€ », « 3,7 M€ », « 3,3 M€ » et « 1,8 M€ économisés ».
- [ ] **Step 2:** `npm run test:e2e` → ce test échoue.
- [ ] **Step 3:** Écrire `tcd_spec` (port de la formule § 3.6) et remplacer `C[1]` par `tcd_spec(0.6, .6, .15, 14, 0.045, 0.087, 0.06, 0.24, 18, 0.36)`. Valeurs attendues : rester 5,04, renégocier 3,72, sortir 3,26.
- [ ] **Step 4:** Mettre à jour le cas 1 de `index.html` : 600 k€ par an, puis 960 k€ après l’échéance ; coûts opérationnels 45 k€, risque 87 k€ ; barres 100 % / 74 % / 65 % ; gain « 1,8 M€ économisés sur cinq ans » ; hypothèses : préparation 60 k€, migration 240 k€, alternative 360 k€ par an, six mois de double exploitation, réengagement de six mois à l’échéance, hausse renégociée de 15 %. Ajouter `<p class="echelle">` sous `.illus` et sous le tableau de bord.
- [ ] **Step 5:** Tableau `F` : Virtualisation `tcd:5.0`, Identité `1.9`, Collaboratif `2.5`, Base de données `8.2`, Réseau `0.6`, Sauvegarde `0.4` (indices et marges inchangés). Mettre à jour le libellé `aria-label` du graphique TCD s’il cite des montants.
- [ ] **Step 6:** Spec § 3.9 : `C0` = 600 k€, `I` = 45 k€, `K` = 87 k€, `P` = 60 k€, `M` = 240 k€, `A` = 360 k€ ; TCD 5,0 / 3,7 / 3,3 M€ ; gain 1,8 M€ ; retour 30 mois ; ratio (0,06 + 0,24 + 0,18) ÷ 0,6 = 0,8 ; ajouter la phrase « Montants à l’échelle d’une entreprise de 2 000 à 20 000 salariés. » ; JSON de l’annexe aligné.
- [ ] **Step 7:** `python3 scripts/check-cases.py` → OK ; `npm run test:e2e` → tout vert.
- [ ] **Step 8:** Commit `feat(cas): montants à l’échelle des entreprises de 2 000 à 20 000 salariés`.

### Task 2: Haut de page C3

**Files:**
- Modify: `index.html` (section `.hero`, CSS `.chiffres` supprimée, nouveau `.panneau`, script du tableau de bord)
- Test: `tests/e2e/index-seo.test.mjs` (ajout)

**Interfaces:**
- Consumes: tableau `F` et `.echelle` (tâche 1).
- Produces: `#hero-panneau` rempli par la même fonction que `#dash-kpis` : `kpisDe(F) -> Array<[libellé, valeur]>` (fournisseurs suivis, indice moyen, verrous actifs, TCD à 5 ans).

- [ ] **Step 1: Test** — `test("haut de page : panneau d’indicateurs, plus de gros chiffres")` : `.hero .chiffres` absent ; `#hero-panneau` a 4 lignes dont les valeurs égalent celles de `#dash-kpis` ; `.hero .echelle` présent ; `.hero .sources-hero` contient « Cigref », « Gartner », « Elée » ; contraste ≥ 4,5 des textes du panneau en clair et en sombre (reprendre `contrasteDe` de `accueil-radar.test.mjs`).
- [ ] **Step 2:** Lancer → échec.
- [ ] **Step 3:** Grille deux colonnes dans `.hero` (texte à gauche, panneau à droite, une colonne sous 900 px). Panneau : fond `#0f3347`, filets `#22465b`, libellés à gauche, valeurs en JetBrains Mono à droite, en-tête « Portefeuille d’exemple », indicateur de taille dessous. Les quatre chiffres sourcés deviennent une ligne `.sources-hero` (texte 14 px, `#a9bcc8`) : « +76 % en cinq ans (Cigref et Asterès, mai 2026) · coûts VMware ×2 ou plus (Gartner, mars 2025) · plus de 80 % des éditeurs passés à l’abonnement (Elée, septembre 2025) · 140 Md€ de surcoût annuel estimé en Europe sur 2026-2030 ». Extraire `kpisDe(F)` et l’utiliser pour `#dash-kpis` et `#hero-panneau`.
- [ ] **Step 4:** Tests verts (`npm run test:e2e`).
- [ ] **Step 5:** Commit `feat(accueil): haut de page avec panneau d’indicateurs`.

### Task 3: Sections intérieures de l’accueil

**Files:**
- Modify: `index.html` (CSS `.sur`, `.libre`, `.cas`, `.comps`, `.barres`, `.offres`, `.offre` ; balisage LIBRE et cas)
- Test: `tests/e2e/index-seo.test.mjs` (ajout)

- [ ] **Step 1: Test** — `test("sections : sans étiquettes ni cartes, frise LIBRE, cas en tableaux")` : aucun `p.sur` dans `main` ; `.libre h3 b` donne `["L","I","B","R","E"]` ; chaque `.cas` contient un `table` ; `getComputedStyle` de `.cas` et `.offre` : `border-radius` = `0px` et pas d’ombre ; à 390 px, `document.documentElement.scrollWidth <= 390`.
- [ ] **Step 2:** Lancer → échec.
- [ ] **Step 3:** Supprimer les `<p class="sur">` de `index.html` et la règle `.sur`. Frise : `ol.libre` en grille de 5 colonnes avec filet supérieur 2 px encre et point vert 12 px par étape ; `<h3><b>L</b>ire</h3>` etc. (lettre en `--signal`, 800, 30 px), une colonne sous 760 px avec filet vertical. Supprimer les `<b>` de lettre isolés.
- [ ] **Step 4:** Cas : remplacer `.comps` et `.barres` par un `table` (en-tête « Coût total sur cinq ans », une ligne par scénario, montant en JetBrains Mono aligné à droite, meilleur scénario en `--vert` gras) ; `.cas` sans fond de carte ni bordure arrondie, filet supérieur. Conserver `.piste`, les boutons et le script du carrousel. Offres : liste à filets (sans bordure arrondie ni fond).
- [ ] **Step 5:** `npm test`, `npm run test:e2e`, `python3 scripts/check-cases.py` → verts.
- [ ] **Step 6:** Commit `feat(accueil): frise LIBRE et cas en tableaux, sans cartes`.

### Task 4: Page du radar alignée

**Files:**
- Modify: `radar-des-dependances.html` (CSS des `.sur`, `.notion`, `.carte-gen`, `.contribs li`, `.garanties div`, `.etapes li` ; suppression des `<p class="sur">`)
- Test: `tests/e2e/accueil-radar.test.mjs` (ajout)

- [ ] **Step 1: Test** — `test("sobriété : sans étiquettes ni cartes arrondies")` : aucun `p.sur` dans `main` ; pour `.notion`, `.carte-gen`, `.contribs li`, `.garanties > div`, `.etapes li` : `border-radius` = `0px` et `box-shadow` = `none`.
- [ ] **Step 2:** Lancer → échec.
- [ ] **Step 3:** Supprimer les étiquettes, remplacer fonds et bordures arrondies par des filets (`border-top:1px solid var(--trait)`), garder classes et ordre des sections (testés). Le test existant des contrastes AA doit rester vert.
- [ ] **Step 4:** `npm run test:e2e` et `node scripts/landing.mjs --verifier` → verts.
- [ ] **Step 5:** Commit `feat(radar): page de présentation sans étiquettes ni cartes`.

### Task 5: Vérification finale

- [ ] **Step 1:** Captures à 1280 et 390 px de l’accueil et de la page du radar (script jetable, hors dépôt), relues à l’œil contre les maquettes.
- [ ] **Step 2:** `npm test`, `npm run test:e2e`, `python3 scripts/check-data.py`, `python3 scripts/check-cases.py` → verts.
- [ ] **Step 3:** `npm run captures -- partage` si le haut de page apparaît dans l’image de partage (sinon rien).
