# Rapport PDF aux couleurs d’Optio — conception courte

Date : 25 novembre 2026 · Statut : validée par le porteur du projet

**Intention** : le PDF du rapport (impression du navigateur) porte l’identité d’Optio et
renvoie vers le site, pour circuler en interne chez le prospect comme un document Optio.

**Identité existante** (index.html) : logo SVG (cercle + flèche qui bifurque, viewBox 0 0 40 28 :
cercle encre ou blanc, branche haute `#00A37A`, branche basse gris `#8A9BA6`) et mot « Optio » ;
couleurs `--encre #0B2A3C`, `--signal #00A37A`, `--vert #00775A`, gris `#8A9BA6` ; polices
Archivo (titres), Instrument Sans (texte), JetBrains Mono (déjà dans `fonts/`).

**Décidé (impression seulement ; l’écran ne change pas)**
- Page de garde : bandeau encre (environ un tiers de la page, pas pleine page) avec logo
  blanc et vert + « Optio » ; dessous titre, date de la sélection et lien cliquable
  « www.weareoptio.fr » vers https://www.weareoptio.fr.
- Sur chaque page : en-tête discret (petit logo, « Optio · Radar des dépendances »,
  « www.weareoptio.fr » cliquable) et pied « Rapport personnalisé du <date> » (sans date :
  « Rapport personnalisé »). Éléments `position:fixed` répétés par Chrome à l’impression ;
  le contenu ne doit jamais passer dessous (marges de page adaptées). Pas de numéros de page.
- Typographie : titres en encre (Archivo), texte Instrument Sans, numéros de chapitre et
  liens en vert Optio ; couleurs des anneaux, radars, matrice et table inchangées.
- Dernière page (rendez-vous) : bandeau encre avec logo, bouton « Réserver 15 minutes » et
  lien vers le site.
- Rendu identique quel que soit le thème (clair/sombre) du système à l’impression.

**Approche** : CSS d’impression + éléments propres à l’impression ajoutés par `rendreRapport`
(classe `imprime-seul`) ; un seul SVG de logo réutilisé.
