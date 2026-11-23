# Rapport personnalisé du radar — plan de réalisation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre de retenir tendances et technologies dans le radar, montrer un aperçu libre, échanger le rapport complet contre un e-mail via Tally, et afficher ce rapport (imprimable en PDF) avec un appel au rendez-vous Cal.com.

**Architecture:** La logique pure (encodage de la sélection dans l’adresse, synthèse, suggestions, mémoire du navigateur) vit dans un nouveau fichier `js/selection.js`, chargé par `radar.html` et testé avec le lanceur de tests intégré de Node. L’interface (étoiles, volet « Mon radar », aperçu, ouverture de Tally, vue rapport) reste dans `radar.html`, comme tout le reste du radar. Les réglages externes (formulaire Tally, lien Cal.com) sont isolés dans `js/config.js`.

**Tech Stack:** HTML/CSS/JS sans framework (style ES5 du fichier existant : `var`, `function`), Node 24 `node --test` pour les tests unitaires, Playwright 1.57.0 (navigateur Chrome installé, `channel: "chrome"`) pour les tests de bout en bout, widget officiel Tally (`https://tally.so/widgets/embed.js`), Cal.com.

**Spec:** `docs/superpowers/specs/2026-11-23-rapport-personnalise-design.md`

## Global Constraints

- Site statique sur GitHub Pages (`https://optio.stratwise.fr/`) : aucun serveur, aucune base de données, aucun compte.
- Formulaire Tally : **seuls l’e-mail et le consentement RGPD** sont visibles ; la sélection et le lien du rapport passent en champs cachés.
- Tally n’est chargé **qu’au clic** sur « Recevoir mon rapport complet » ; ce clic vaut accord ; une phrase d’information figure juste sous le bouton.
- Adresse du rapport : `radar.html?rapport=1&…` ; elle porte la **date de la demande** ; le rapport est recalculé à partir des données du moment.
- Pas de plafond de sélection ; identifiants (`id`) lisibles dans l’adresse.
- Aucun chiffrage (coût, délai) dans l’aperçu ni dans le rapport.
- Rendez-vous : **Cal.com**, 30 minutes ; le lien du rapport est joint à la réservation.
- Mention RGPD : finalité « envoyer le rapport, recontacter, relancer dans le cadre de la campagne » ; conservation **trois ans après le dernier contact**.
- `localStorage` : lectures et écritures dans `try/catch` ; tout fonctionne sans stockage le temps de la visite.
- Accessible au clavier, lisible en mode sombre, sans débordement horizontal à 390 px.
- `python3 scripts/check-data.py` et `python3 scripts/check-cases.py` passent à chaque commit.
- Tout nouveau fichier servi est ajouté à `Containerfile`, `.containerignore` et `scripts/serve-local.sh` (sinon le conteneur local ne le sert pas).
- Textes visibles en français, ton factuel et sobre (pas de plaquette commerciale).

## Review Focus

- **Adresse de rapport avec un `id` inconnu ou supprimé** : le rapport s’affiche avec les éléments connus et une ligne « N éléments ne figurent plus dans le radar » ; jamais de page blanche. Test : Task 1 (`synthese` compte `absents`) et Task 5 (bout en bout).
- **Adresse de rapport vide ou mal formée** (`?rapport=1` seul, virgules en trop, doublons) : message « Ce rapport ne contient aucune sélection » avec un lien vers le radar. Test : Task 1 (`decoderSelection`) et Task 5.
- **Stockage indisponible** (navigation privée, `localStorage` qui lève une exception) : retenir et voir l’aperçu fonctionnent pendant la visite. Test : Task 1 (`chargerSelection`/`sauverSelection` avec un stockage qui lève).
- **Tally non configuré ou script bloqué** (bloqueur de publicité, réseau) : message clair sous le bouton, pas de bouton mort. Test : Task 4.
- **Sélection retenue puis donnée mise à jour** (une technologie retirée de `technologies.json`) : la pastille « Mon radar » compte seulement les éléments existants. Test : Task 2.

---

### Task 0: Committer le travail en cours

Le dépôt contient une modification non commitée de `radar.html` (liste à droite du radar, retour au radar complet au clic en dehors). Elle doit être commitée seule avant de commencer.

- [ ] **Step 1: Vérifier les contrôles**

Run: `python3 scripts/check-data.py && python3 scripts/check-cases.py`
Expected: deux lignes `OK : …`

- [ ] **Step 2: Commit**

```bash
git add radar.html
git commit -m "feat(radar): liste des éléments retenus à droite du radar, retour au radar complet au clic en dehors"
```

---

### Task 1: Logique de sélection (`js/selection.js`)

**Files:**
- Create: `js/selection.js`
- Create: `package.json`, `tests/unit/selection.test.js`
- Modify: `.gitignore` (ajouter `node_modules/`), `Containerfile`, `.containerignore`, `scripts/serve-local.sh` (servir `js/`)

**Interfaces:**
- Produces (objet global `window.OptioSelection` dans le navigateur, `module.exports` sous Node) :
  - `Selection` = `{ tendances: string[], technologies: string[], date: string /* "AAAA-MM-JJ" */ }`
  - `encoderSelection(sel: Selection) -> string` : `"t=<id>,<id>&x=<id>,<id>&d=AAAA-MM-JJ"` (paramètres vides omis, ordre conservé).
  - `decoderSelection(recherche: string) -> Selection` : accepte `location.search` (avec ou sans `?`), ignore les valeurs vides, dédoublonne en gardant le premier, `date` vaut `""` si absente ou invalide.
  - `urlRapport(base: string, sel: Selection) -> string` : `base + "?rapport=1&" + encoderSelection(sel)`.
  - `synthese(sel: Selection, donnees: {tendances, technologies, mecanismes, leviers}) -> Synthese` où `donnees` sont les tableaux bruts de `data/*.json` et :
    - `technos` : entrées de `technologies.json` retenues, triées par `anneau` croissant puis `nom` (`localeCompare(…, "fr")`) ;
    - `tendances` : entrées retenues, triées par `anneau` croissant puis `titre` ;
    - `absents: number` : identifiants retenus introuvables ;
    - `parAnneau: number[4]` : nombre de technos par anneau 0..3 ;
    - `urgentes: number` : tendances retenues d’anneau 0 ou 1 ;
    - `mecanismes: {meca, nb}[]` : mécanismes cités par les tendances retenues (`tendance.mecanismes`), `nb` = nombre de tendances qui le citent, triés par `nb` décroissant puis `nom` ;
    - `leviers: {levier, commentaires: string[]}[]` : leviers des tendances retenues (`tendance.leviers[].id`) et des mécanismes ci-dessus (`mecanisme.leviers[].id`), sans doublon, avec les commentaires associés.
  - `suggestions(sel: Selection, donnees) -> string[]` : `id` des technologies citées par nom dans `tendance.technologies` des tendances retenues, absentes de la sélection, ordonnées par nombre de tendances qui les citent (décroissant) puis `nom`.
  - `chargerSelection(stockage: Storage|null) -> Selection` et `sauverSelection(stockage: Storage|null, sel: Selection) -> boolean` ; clé `"optio-radar-selection"` ; toute exception rend une sélection vide / `false`.
  - `CLE_DERNIER_RAPPORT = "optio-radar-dernier-rapport"` (utilisée par Task 5).

- [ ] **Step 1: Écrire les tests qui échouent** dans `tests/unit/selection.test.js` (`node:test`, `node:assert/strict`, données lues depuis `data/*.json`) :

```js
test("encode et décode sans perte", () => {
  const sel = { tendances: ["fin-des-licences-perpetuelles"], technologies: ["vmware-vsphere-et-vcf","oracle-database"], date: "2026-11-23" };
  assert.equal(encoderSelection(sel), "t=fin-des-licences-perpetuelles&x=vmware-vsphere-et-vcf,oracle-database&d=2026-11-23");
  assert.deepEqual(decoderSelection("?rapport=1&" + encoderSelection(sel)), sel);
});
test("décode une adresse mal formée", () => {
  assert.deepEqual(decoderSelection("?rapport=1&t=a,,a,b&x=&d=pas-une-date"), { tendances: ["a","b"], technologies: [], date: "" });
  assert.deepEqual(decoderSelection(""), { tendances: [], technologies: [], date: "" });
});
test("urlRapport", () => {
  assert.equal(urlRapport("https://optio.stratwise.fr/radar.html", { tendances: [], technologies: ["x1"], date: "2026-11-23" }),
    "https://optio.stratwise.fr/radar.html?rapport=1&x=x1&d=2026-11-23");
});
test("synthèse : tri, anneaux, absents, urgentes", () => {
  const s = synthese({ tendances: [/* deux id réels d’anneaux 2 puis 0 */], technologies: [/* id réels + "inconnu" */], date: "" }, donnees);
  // assertions : s.absents === 1 ; s.technos trié par anneau ; s.parAnneau somme = technos connues ; s.urgentes compte les anneaux 0–1
});
test("synthèse : mécanismes comptés et leviers sans doublon", () => { /* nb décroissant ; un levier cité deux fois n’apparaît qu’une fois avec ses deux commentaires */ });
test("suggestions : technologies des tendances retenues, hors sélection", () => { /* aucune techno déjà retenue ; ordre par fréquence */ });
test("stockage qui lève une exception", () => {
  const casse = { getItem(){ throw new Error("x"); }, setItem(){ throw new Error("x"); } };
  assert.deepEqual(chargerSelection(casse), { tendances: [], technologies: [], date: "" });
  assert.equal(sauverSelection(casse, { tendances: ["a"], technologies: [], date: "" }), false);
});
```

Les commentaires `/* … */` désignent des données à choisir dans `data/*.json` ; les assertions qu’ils décrivent sont obligatoires.

- [ ] **Step 2: Lancer les tests, constater l’échec**

Run: `node --test tests/unit/`
Expected: FAIL (`Cannot find module '../../js/selection.js'`)

- [ ] **Step 3: Implémenter `js/selection.js`** avec les signatures ci-dessus ; en-tête `(function(racine){ … })(typeof window!=="undefined"?window:globalThis)` qui expose `racine.OptioSelection` et `module.exports` quand il existe. Créer `package.json` : `{"private": true, "scripts": {"test": "node --test tests/unit/", "test:e2e": "node --test tests/e2e/"}, "devDependencies": {"playwright": "1.57.0"}}`.

- [ ] **Step 4: Lancer les tests, constater le succès**

Run: `node --test tests/unit/`
Expected: PASS, 7 tests

- [ ] **Step 5: Servir `js/` dans le conteneur** : `COPY js/ /www/js/` dans `Containerfile`, `!js/` dans `.containerignore`, `-v "$PWD/js:/www/js:ro"` dans `scripts/serve-local.sh`.

- [ ] **Step 6: Commit**

```bash
git add js/selection.js tests/unit/selection.test.js package.json .gitignore Containerfile .containerignore scripts/serve-local.sh
git commit -m "feat(radar): logique de sélection et de synthèse du rapport personnalisé"
```

---

### Task 2: Retenir (étoiles, pastille « Mon radar », volet, suggestions)

**Files:**
- Modify: `radar.html` (styles, barre de filtres `#bande`, fonctions `fiche()`, `listeDroite()`, chargement des données)
- Create: `tests/e2e/outils.mjs`, `tests/e2e/retenir.test.mjs`

**Interfaces:**
- Consumes: `OptioSelection.chargerSelection`, `sauverSelection`, `suggestions` (Task 1).
- Produces (dans la closure de `radar.html`) :
  - `var maSelection` : `Selection` courante, initialisée par `chargerSelection(localStorage)` puis filtrée sur les `id` existants.
  - `estRetenu(x) -> boolean`, `basculerRetenu(x) -> void` (x = élément de `T` ou `TECH` ; met à jour `maSelection`, sauvegarde, rafraîchit étoiles, pastille et volet).
  - `ouvrirVolet() -> void`, `fermerVolet() -> void` ; conteneur `<aside id="volet" class="volet" aria-label="Mon radar">`.
  - Élément `<button id="mon-radar" class="mon-radar">` dans la barre de filtres, texte « Mon radar · N ».
  - `function rendreVolet()` : point d’entrée que Task 3 complète avec l’aperçu.
- `tests/e2e/outils.mjs` exporte `ouvrir(page, chemin)` (sert `http://localhost:8765/<chemin>`, attend `#stats`), `erreurs(page) -> string[]` (pageerror + console.error), et documente le prérequis : `python3 -m http.server 8765` lancé à la racine du dépôt.

- [ ] **Step 1: Écrire les tests de bout en bout qui échouent** (`tests/e2e/retenir.test.mjs`, `node:test` + Playwright `chromium.launch({channel:"chrome"})`) :
  - `retenir depuis la fiche` : ouvrir une tendance, cliquer `.retenir` → `aria-pressed="true"` et `#mon-radar` affiche « Mon radar · 1 ».
  - `retenir depuis la liste` : cliquer l’étoile d’une ligne `.ld-item` → compteur 2 ; l’étoile reste cochée après rechargement (persistance).
  - `volet` : clic sur `#mon-radar` → `#volet` visible avec 2 éléments ; retirer un élément → compteur 1 ; `Escape` ferme le volet et rend le focus à `#mon-radar`.
  - `suggestions` : avec la tendance « Virtualisation propriétaire » retenue, le volet propose au moins « VMware vSphere et VCF » ; un clic l’ajoute.
  - `identifiant périmé` : `localStorage["optio-radar-selection"]` contient un `id` inconnu → le compteur l’ignore.
  - `mobile 390 px` : volet ouvert, `scrollWidth` = 390 ; `erreurs(page)` vide dans chaque test.

- [ ] **Step 2: Lancer, constater l’échec**

Run: `python3 -m http.server 8765 &` puis `npx playwright --version && node --test tests/e2e/retenir.test.mjs`
Expected: FAIL (`#mon-radar` introuvable)

- [ ] **Step 3: Implémenter** : charger `js/selection.js` avant le script principal ; bouton `.retenir` (« ☆ Retenir » / « ★ Retenu », `aria-pressed`) en tête de fiche tendance et technologie ; étoile `.ld-etoile` dans chaque ligne de `listeDroite()` (clic sans ouvrir la fiche) ; pastille `#mon-radar` dans `#bande` (visible dans les vues Tendances et Technologies) ; volet latéral droit (fermeture : bouton, `Escape`, clic sur le fond) listant tendances puis technologies retenues (retirer, ouvrir la fiche), puis « Ces tendances concernent aussi : … Les utilisez-vous ? » avec les 6 premières suggestions en pastilles cliquables.

- [ ] **Step 4: Lancer, constater le succès**

Run: `node --test tests/e2e/retenir.test.mjs && node --test tests/unit/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add radar.html tests/e2e/outils.mjs tests/e2e/retenir.test.mjs
git commit -m "feat(radar): retenir tendances et technologies, volet Mon radar"
```

---

### Task 3: Aperçu libre dans le volet

**Files:**
- Modify: `radar.html` (`rendreVolet()`, styles)
- Create: `tests/e2e/apercu.test.mjs`

**Interfaces:**
- Consumes: `OptioSelection.synthese` (Task 1), `maSelection`, `rendreVolet()` (Task 2), `DONNEES_BRUTES` = `{tendances, technologies, mecanismes, leviers}` (tableaux JSON tels que chargés, à conserver au chargement).
- Produces: `<section class="apercu">` en tête du volet, et `<button id="demander-rapport" class="voir-radar">` « Recevoir mon rapport complet (PDF) » que Task 4 branche.

- [ ] **Step 1: Écrire les tests qui échouent** :
  - Avec 3 technos d’anneaux 0, 0, 2 et 2 tendances dont 1 d’anneau 0 : `.apercu` montre « 3 technologies », barres par anneau avec les nombres 2 / 0 / 1 / 0, « 2 tendances, dont 1 urgente ».
  - Mécanismes : au plus 3 noms puis « + N » quand il y en a plus de 3.
  - Trois blocs `.verrou` (« Alternatives mieux classées », « Leviers et parades », « Détail par technologie ») sans aucun texte de levier ni d’alternative à l’intérieur.
  - Sélection vide : l’aperçu invite à retenir et `#demander-rapport` est `disabled`.
  - Aucun chiffre monétaire (`€`, `$`) dans `.apercu`.

- [ ] **Step 2: Lancer, constater l’échec** — Run: `node --test tests/e2e/apercu.test.mjs` — Expected: FAIL (`.apercu` introuvable)

- [ ] **Step 3: Implémenter** la section `.apercu` à partir de `synthese(maSelection, DONNEES_BRUTES)` (couleurs d’anneaux technologies `--x0..--x3`, d’urgence `--a0..--a3`), les blocs verrouillés et le bouton.

- [ ] **Step 4: Lancer, constater le succès** — Run: `node --test tests/e2e/` — Expected: PASS

- [ ] **Step 5: Commit** — `git commit -m "feat(radar): aperçu libre de l’exposition dans Mon radar"` (fichiers : `radar.html`, `tests/e2e/apercu.test.mjs`)

---

### Task 4: Tally au clic, consentement, réglages et mention RGPD

**Files:**
- Create: `js/config.js`
- Modify: `radar.html` (bouton `#demander-rapport`, phrase d’information), `index.html` (mention RGPD, marqueur `[DURÉE DE CONSERVATION]`), `README.md` (section « Rapport personnalisé : réglages »), `Containerfile`/`.containerignore`/`scripts/serve-local.sh` si `js/` n’y est pas déjà
- Create: `tests/e2e/tally.test.mjs`

**Interfaces:**
- Consumes: `urlRapport`, `encoderSelection` (Task 1), `#demander-rapport` (Task 3), `maSelection`.
- Produces:
  - `window.OPTIO_CONFIG = { tallyFormId: "", calLien: "", urlSite: "https://optio.stratwise.fr/radar.html" }` dans `js/config.js` (vide = non configuré).
  - `demanderRapport() -> void` : fixe `maSelection.date` à la date du jour (`AAAA-MM-JJ`), calcule `lien = urlRapport(OPTIO_CONFIG.urlSite, maSelection)`, charge `https://tally.so/widgets/embed.js` **à ce moment seulement**, puis `Tally.openPopup(tallyFormId, { hiddenFields: { selection: encoderSelection(maSelection), rapport: lien }, onSubmit: function(){ location.href = lien; } })`.
  - Comportements de repli : `tallyFormId` vide et `location.hostname` ∈ {`localhost`, `127.0.0.1`} → ouverture directe de `lien` (mode développement) ; `tallyFormId` vide ailleurs, ou script Tally en échec de chargement (`onerror` ou 8 s) → message `.tally-erreur` « Le formulaire n’a pas pu s’ouvrir. Écrivez-nous à contact@… en joignant ce lien : » suivi du lien du rapport.

- [ ] **Step 1: Écrire les tests qui échouent** (`tests/e2e/tally.test.mjs`) :
  - Aucune requête vers `tally.so` avant le clic (écoute `page.on("request")`).
  - En local avec `tallyFormId` vide : clic → navigation vers `radar.html?rapport=1&…&d=<date du jour>` contenant les `id` retenus.
  - Avec `tallyFormId` = `"TEST"` et la route `**/tally.so/**` interceptée qui renvoie une erreur : `.tally-erreur` visible avec le lien du rapport.
  - Avec la route Tally simulée (script qui définit `window.Tally.openPopup` et enregistre ses arguments) : `hiddenFields.rapport` = lien attendu, `hiddenFields.selection` = `encoderSelection(...)`.
  - La phrase d’information est visible sous le bouton et contient « Tally », « adresse IP », « trois ans ».

- [ ] **Step 2: Lancer, constater l’échec** — Run: `node --test tests/e2e/tally.test.mjs` — Expected: FAIL

- [ ] **Step 3: Implémenter** `js/config.js`, `demanderRapport()` et la phrase d’information (texte exact) :

> En cliquant, vous ouvrez un formulaire hébergé par Tally, qui reçoit votre adresse IP. Votre e-mail sert à vous envoyer ce rapport, à vous recontacter et à vous relancer dans le cadre de cette campagne ; il est conservé trois ans après notre dernier contact. Accès et suppression : contact@[DOMAINE].

Dans `index.html`, remplacer `[DURÉE DE CONSERVATION]` par « trois ans après notre dernier contact ». Documenter dans `README.md` les réglages : création du formulaire Tally (champs visibles : e-mail, consentement ; champs cachés `selection` et `rapport` ; e-mail au répondant — offre Pro — avec le lien `@rapport` et le lien Cal.com ; notification à Optio), et le lien Cal.com.

- [ ] **Step 4: Lancer, constater le succès** — Run: `node --test tests/e2e/ && python3 scripts/check-data.py && python3 scripts/check-cases.py` — Expected: PASS et `OK`

- [ ] **Step 5: Commit** — `git commit -m "feat(radar): demande du rapport via Tally, au clic, avec mention RGPD"`

---

### Task 5: Vue rapport (`radar.html?rapport=1`), PDF et rendez-vous

**Files:**
- Modify: `radar.html` (démarrage : si `rapport=1`, afficher la vue rapport au lieu du radar ; styles écran et `@media print`)
- Create: `tests/e2e/rapport.test.mjs`

**Interfaces:**
- Consumes: `decoderSelection`, `synthese`, `CLE_DERNIER_RAPPORT` (Task 1), `OPTIO_CONFIG.calLien` (Task 4), `DONNEES_BRUTES` (Task 3), la palette `--x0..--x3`.
- Produces: `rendreRapport(sel: Selection) -> void` dans `<main id="rapport" class="rapport">` ; enregistre `location.href` sous `CLE_DERNIER_RAPPORT`.

- [ ] **Step 1: Écrire les tests qui échouent** (`tests/e2e/rapport.test.mjs`) :
  - Adresse avec 2 technos + 1 tendance + `d=2026-11-23` : page de garde avec « 23 novembre 2026 » et la liste de la sélection ; une section « Synthèse » (mêmes nombres que l’aperçu) ; une section par technologie (anneau, « Pourquoi », dépendance, alternatives mieux classées, tendances, lien site officiel) ; une section par tendance (risque, leviers avec commentaire) ; section « Mécanismes probables » ; section « Sources » ; dernière section « Analysons ce rapport ensemble, 30 minutes ».
  - Lien Cal.com : `href` commence par `OPTIO_CONFIG.calLien` et contient le lien du rapport encodé dans `notes=`. Si `calLien` est vide, le bouton renvoie vers `index.html#contact`.
  - Un `id` inconnu : la ligne « 1 élément ne figure plus dans le radar » est visible, le reste s’affiche.
  - `?rapport=1` seul : « Ce rapport ne contient aucune sélection » et un lien vers `radar.html`.
  - « Copier le lien de mon rapport » écrit `location.href` dans le presse-papiers (permissions Playwright `clipboard-read`, `clipboard-write`).
  - `localStorage["optio-radar-dernier-rapport"]` vaut `location.href` après affichage.
  - `page.emulateMedia({ media: "print" })` : la barre de filtres, les onglets et les boutons sont masqués (`display: none`), chaque technologie commence sur un bloc non coupé (`break-inside: avoid`).
  - Aucun `€` ni `$` dans `#rapport` ; aucune erreur console ; mode sombre lisible ; `scrollWidth` = 390 sur mobile.

- [ ] **Step 2: Lancer, constater l’échec** — Run: `node --test tests/e2e/rapport.test.mjs` — Expected: FAIL

- [ ] **Step 3: Implémenter** `rendreRapport()` : vue autonome (en-tête Optio, pas d’onglets), boutons « Télécharger en PDF » (`window.print()`), « Copier le lien de mon rapport », « Réserver 30 minutes » (Cal.com : `calLien + "?notes=" + encodeURIComponent("Mon rapport : " + location.href)`) ; feuille `@media print` (fond blanc, texte noir, liens suivis de leur adresse, sauts de page entre grandes sections).

- [ ] **Step 4: Lancer, constater le succès** — Run: `node --test tests/unit/ && node --test tests/e2e/ && python3 scripts/check-data.py` — Expected: PASS et `OK`

- [ ] **Step 5: Vérifier à la main l’impression PDF** dans Chrome (aperçu d’impression du rapport de test) : pages lisibles, pas de bloc coupé en deux.

- [ ] **Step 6: Commit** — `git commit -m "feat(radar): rapport personnalisé imprimable avec appel au rendez-vous"`
