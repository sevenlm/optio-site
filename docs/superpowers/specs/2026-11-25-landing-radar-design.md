# Page d’accueil du radar des dépendances — conception

Date : 25 novembre 2026 · Statut : à valider par le porteur du projet

## Intention

Le radar (`radar.html`) est le lead magnet de la campagne marketing d’Optio, mais il n’a pas
de page d’entrée : un lien de campagne tombe soit sur la landing d’Optio (`index.html`, qui
vend l’accompagnement), soit directement dans l’outil, sans mode d’emploi. On crée une page
d’accueil marketing du radar qui fait comprendre en quelques secondes ce qu’il est, comment il
fonctionne et ce qu’on y gagne, et donne envie de l’ouvrir, de retenir sa sélection, de
demander son rapport, puis de prendre rendez-vous.

## Public et action attendue

- Un DSI, DSI adjoint ou responsable infrastructure / achats IT, arrivé par une campagne
  (LinkedIn, e-mail, événement), qui ne connaît ni Optio ni le radar et décide en moins de
  dix secondes s’il reste.
- Action principale unique : **ouvrir le radar** (`radar.html`). Action secondaire : voir un
  exemple de rapport (ancre dans la page).

## Objectifs

- Comprendre le radar et ses notions : tendances, technologies, mécanismes d’enfermement,
  leviers, matrice criticité × réversibilité du rapport.
- Montrer la valeur : repérer en quelques minutes ce qui rend captif, recevoir un rapport
  personnalisé gratuit, en parler 15 minutes avec Optio.
- Inspirer confiance sans preuve inventée : sources reconnues, méthode, indépendance vis-à-vis
  des éditeurs, aperçu réel du rapport.
- Être la cible des campagnes : adresse propre, aperçu de partage soigné, référençable.

## Non-objectifs

- Pas de formulaire sur la page (l’e-mail est demandé dans le radar, au moment du rapport).
- Pas de témoignages, logos clients ni chiffres d’impact inventés.
- Pas de modification de l’outil radar lui-même (hors liens vers la page).
- Pas d’outil d’analytics ajouté dans cette itération.

## Anti-objectifs (échec même si « ça marche »)

- Une page longue et bavarde qui noie l’appel à l’action.
- Une plaquette commerciale qui vend du conseil : la page vend l’usage du radar, Optio
  n’apparaît qu’en signature, dans la FAQ et via le rendez-vous du rapport.
- Des captures qui ne correspondent plus au radar réel.
- Une page lente ou cassée sur mobile.

## Contraintes

- Site statique GitHub Pages, domaine `www.weareoptio.fr`, sans dépendance d’exécution.
- Identité Optio de `index.html` : logo SVG (cercle + flèche qui bifurque), couleurs
  `--encre #0B2A3C`, `--signal #00A37A`, `--vert #00775A`, gris `#8A9BA6`, polices Archivo,
  Instrument Sans, JetBrains Mono (`fonts/`).
- Chiffres affichés exacts et à jour : lus dans `data/*.json` au chargement (53 tendances,
  279 technologies, 53 mécanismes, 37 leviers aujourd’hui), avec des valeurs écrites en dur en
  repli si le chargement échoue.
- Mode sombre, mobile 390 px sans débordement, accessible au clavier, contrastes AA.
- `index.html` n’est modifié que pour ses liens vers le radar ; `check-data.py`,
  `check-cases.py` et les tests existants passent.
- Ne pas citer les articles du porteur du projet comme sources.

## Approches considérées

1. **Page séparée `radar-des-dependances.html` (retenue par le porteur du projet)** : adresse
   propre pour les campagnes et leur suivi, radar inchangé et rapide, page référençable seule.
2. Présentation en haut de `radar.html` : un seul lien, mais outil alourdi et habitués obligés
   de faire défiler. Écartée.

## Ce qui est décidé

### Structure de la page (ordre)

1. **En-tête collant** : logo Optio (lien vers `index.html`) et bouton « Ouvrir le radar ».
2. **Accroche** : titre centré sur la question du DSI (proposition : « Où votre système
   d’information est-il enfermé ? »), sous-titre avec les chiffres du radar et la promesse
   (« repérez en quelques minutes ce qui vous rend captif, et recevez un rapport personnalisé
   gratuit »), bouton principal « Ouvrir le radar », lien secondaire « Voir un exemple de
   rapport », capture du radar.
3. **Bandeau de crédibilité** : sources réellement citées par le radar (ANSSI, Banque de France,
   DORA, NIS2, Data Act, Thoughtworks…), en texte.
4. **Le constat** : trois faits chiffrés et sourcés, repris des tendances du radar.
5. **Comment ça marche** : 1 Explorez le radar, 2 Retenez ce qui vous concerne, 3 Recevez
   votre rapport (et parlons-en 15 minutes).
6. **Comprendre le radar** (demandé par le porteur du projet) : une carte par notion, avec un
   petit visuel :
   - tendances : cinq axes, quatre anneaux d’urgence (Fort, Élevé, Moyen, Faible) ;
   - technologies : quatre anneaux de sortie (difficile → facilitée), alternatives toujours
     mieux classées, « pourquoi cet anneau » ;
   - mécanismes d’enfermement : la table 7 couches × 4 moments ;
   - leviers : mise en œuvre, vérification, limites ;
   - matrice criticité × réversibilité du rapport : lecture des axes, criticité estimée à
     affiner en rendez-vous.
7. **Votre rapport personnalisé** : aperçu (captures de pages du PDF : garde, synthèse avec
   radars et matrice, leviers), ce qu’il contient, gratuit en échange d’un e-mail.
8. **Pourquoi s’y fier** : sources citées pour chaque élément, indépendance vis-à-vis des
   éditeurs, classements expliqués, mise à jour régulière, prototype à valider avec des experts.
9. **Questions fréquentes** : gratuit ? quelles données sont collectées ? combien de temps ?
   que devient ma sélection ? qui est Optio ?
10. **Appel final** : « Ouvrir le radar ».
11. **Pied de page** : comme la landing Optio (marque, liens, mentions).

### Visuels

- Captures réelles du radar et du rapport, produites par un script versionné
  (`scripts/captures.mjs`, Playwright) dans un dossier d’images du dépôt, pour les régénérer
  quand le radar change. Formats légers (WebP ou PNG optimisé), dimensions fixées pour éviter
  les sauts de mise en page, texte alternatif descriptif.

### Référencement et partage

- `title`, `meta description`, balise canonique, Open Graph et Twitter Card avec une image
  d’aperçu dédiée ; ajout au `sitemap.xml`.

### Liens

- Tous les boutons d’action de la page mènent à `radar.html`.
- Le lien « Radar » du menu et du pied de `index.html` mène à la nouvelle page.
- `radar.html` ajoute un lien discret « Découvrir le radar » vers la page.

### Précisions (relecture du constructeur ; choix du concepteur, signalés au porteur)

- **Adresse** : fichier `radar-des-dependances.html`, adresse canonique
  `https://www.weareoptio.fr/radar-des-dependances.html` (même convention que `radar.html`).
  `radar.html` reste l’outil : aucune redirection.
- **Rapport d’exemple** : le rapport est une page du radar (`radar.html?rapport=1&r=<jeton>`)
  calculée dans le navigateur et imprimée en PDF par le navigateur. Le script de captures
  construit le jeton d’une sélection d’exemple réaliste et fixe (par exemple VMware vSphere,
  Oracle Database, Microsoft 365, GitHub Copilot ; Fin des licences perpétuelles, Dépendance
  cognitive à l’assistant IA, Pénurie de compétences cyber face à NIS2), sans aucune donnée
  d’entreprise : le rapport n’en contient pas. Le lien « Voir un exemple de rapport » mène à la
  section d’aperçu de la page ; un lien « Ouvrir le rapport d’exemple » ouvre ce rapport réel.
- **Outillage** : `package.json` et Playwright existent déjà (tests de bout en bout). Le script
  `scripts/captures.mjs` écrit dans `img/radar/` ; pas d’outil d’optimisation ajouté :
  captures en JPEG qualité ~80 (photos d’écran) ou PNG si plus léger.
- **Faits du constat** : écrits dans la page avec leur source (lien), repris tels quels de
  tendances du radar ; seuls les compteurs (tendances, technologies, mécanismes, leviers) sont
  lus dans `data/*.json`, avec repli en dur et sans saut de mise en page (place réservée).
- **Image d’aperçu (Open Graph)** : produite par le même script, 1200 × 630, aux couleurs
  d’Optio (logo, titre, extrait du radar).
- **FAQ** : réponses fondées sur le fonctionnement réel : la sélection reste dans le
  navigateur (stockage local) tant qu’on ne demande pas le rapport ; l’e-mail est recueilli
  par un formulaire Tally au moment du rapport, conservé trois ans après le dernier contact,
  accès et suppression à contact@stratwise.fr ; le rapport est gratuit ; quelques minutes
  suffisent ; Optio est une marque de Stratwise. Mentions légales : renvoi vers celles de
  `index.html`.

## Laissé au constructeur

- Les textes exacts (dans le ton de la landing Optio : direct, factuel, vouvoiement) et le
  choix des trois faits du constat parmi les tendances sourcées.
- Le détail graphique des visuels de « Comprendre le radar » (captures recadrées ou petits
  schémas SVG).
- Les animations légères (respect de `prefers-reduced-motion`).
