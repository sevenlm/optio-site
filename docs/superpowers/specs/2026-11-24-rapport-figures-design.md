# Figures, chapitrage et sommaire du rapport personnalisé — conception courte

Date : 24 novembre 2026 · Statut : validée · Complète `2026-11-23-rapport-personnalise-design.md`

## Intention

Le rapport complet (`radar.html?rapport=1&…`) est aujourd’hui entièrement textuel. On y
ajoute des figures pour qu’il parle au premier regard, à l’écran, imprimé en PDF et
projeté pendant le rendez-vous de 15 minutes.

## Ce qui est ajouté

1. **Radars de la sélection** (juste après la synthèse) : le radar des technologies,
   technologies retenues en surbrillance, et le radar des tendances, tendances retenues
   en surbrillance. Les autres points restent visibles, en pâle, pour situer la
   sélection dans l’ensemble. Une figure sans élément retenu n’est pas affichée.
2. **Matrice criticité × réversibilité** (après les radars) : un point par technologie
   retenue.
   - Réversibilité (axe horizontal) : l’anneau de la technologie (Sortie difficile à
     gauche, Facilitée à droite). Les points d’un même anneau sont légèrement décalés
     pour ne pas se superposer.
   - Criticité (axe vertical) : **estimation** — somme, sur les tendances qui citent la
     technologie, d’un poids selon l’urgence (Fort 3, Élevé 2, Moyen 1, Faible 0),
     ramenée sur une échelle de 1 à 5.
   - Titre explicite : « Positionnement indicatif, estimé à partir du radar — à affiner
     avec vous en rendez-vous ». Mêmes zones colorées que la matrice de la landing.
3. **Table de l’enfermement** (en tête de « Mécanismes probables ») : la grille
   7 couches × 4 moments de la vue Mécanismes, avec les mécanismes probables de la
   sélection allumés et les autres en pâle, plus le décompte « N mécanismes, M / 7
   couches touchées ».

4. **Chapitrage et sommaire** (demandé par le porteur du projet) :
   - Le rapport est découpé en chapitres numérotés : 1 Synthèse (avec les radars et la
     matrice), 2 Technologies retenues, 3 Tendances retenues, 4 Mécanismes probables
     (avec la table), 5 Sources, 6 Analysons ce rapport ensemble. Un chapitre sans
     contenu (par exemple aucune tendance retenue) est omis et la numérotation suit.
   - **À l’écran** : un volet de navigation (choix du constructeur : à gauche, collant,
     sur écran large) liste les chapitres et leurs sous-parties (fiches), surligne le
     chapitre en cours de lecture, et se replie en un bouton « Sommaire » sur mobile.
     Il n’apparaît pas à l’impression.
   - **À l’impression seulement** : une page « Sommaire » juste après la page de garde,
     avec les chapitres et leurs liens (cliquables dans le PDF). Sans numéros de page :
     les navigateurs ne savent pas les calculer de façon fiable.
   - Chaque chapitre commence sur une nouvelle page à l’impression.

## Approches

1. **Dessins statiques propres au rapport (retenue par le porteur du projet)** : petites
   fonctions qui produisent des SVG simples (couleurs pleines, sans animation), en
   réutilisant la géométrie du radar (`angles`, `segment`, libellés d’anneaux). Fiable à
   l’impression, testable.
2. Réutiliser les composants interactifs du radar dans le rapport : moins de code au
   départ, mais transitions, survols et variables du mode sombre rendent l’impression
   fragile. Écartée.

## Contraintes

- Rester factuel : seule la criticité est une estimation, et elle le dit.
- Lisible en impression (couleurs forcées à l’impression, pas de coupure d’une figure
  entre deux pages), en mode sombre à l’écran et sur mobile (figures à largeur fluide).
- Chaque figure a un titre accessible (`role="img"` et `aria-label` ou `<title>`).
- Ne pas casser le radar interactif ni les tests existants ; `check-data.py` et
  `check-cases.py` passent.

## Laissé au constructeur

- Taille exacte des figures, disposition côte à côte ou empilée des deux radars selon la
  largeur.
- Numéros ou noms sur les points (noms des technologies sur la matrice ; numéros sur les
  radars, avec la correspondance dans les fiches).
- Mise en forme de la table compacte (symboles des mécanismes dans les cases).
