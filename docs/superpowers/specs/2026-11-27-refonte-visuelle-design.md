# Refonte visuelle du site Optio

*Conception validée en séance le 27 novembre 2026, avec les maquettes de `.superpowers/brainstorm/43055-1795775386/content/`.*

## Intention

Le site ressemble aujourd’hui au modèle de page des éditeurs de logiciels : haut de page sombre avec rangée de gros chiffres, petites étiquettes vertes au-dessus de chaque titre, cartes arrondies identiques. Un DSI doit en retirer une impression de sérieux, de maîtrise du sujet et de positionnement premium, et comprendre qu’Optio l’aidera à faire passer les bons messages à sa direction et à ses équipes.

## Objectifs

- Garder l’identité actuelle : bleu nuit `#0B2A3C`, vert `#00A37A` / `#00775A`, texte blanc sur fond sombre, titres en Archivo.
- Remplacer les motifs de modèle générique par une présentation de rapport d’expert : filets, frise, tableaux.
- Ramener tous les montants d’exemple à l’échelle de la cible et le dire sur la page.

## Hors périmètre

- L’application `radar.html` (seules les pages d’accueil et les fiches générées changent).
- Les textes : on garde ceux du site, réécrits le 26 novembre. Aucune nouvelle accroche.
- Les citations illustratives et la FAQ, inchangées.

## Décisions

### Cible et montants

- Cible : entreprises de 2 000 à 20 000 salariés.
- Le cas n° 1 (virtualisation) passe à 600 k€ par an, hausse de 60 % dans 14 mois, 18 mois pour partir, et utilise le modèle de calcul de la spec (§ 3.6) : préparation 60 k€, migration 240 k€, alternative 360 k€ par an, irritants 45 k€, risque 87 k€, double exploitation 6 mois, réengagement 6 mois. Résultat : rester 5,0 M€, renégocier 3,7 M€, sortir 3,3 M€, gain 1,8 M€.
- La spec TCD (§ 3.9 et § 4.8) reprend ce même exemple.
- Les cas 2, 3 et 4 (300 k€, 600 k€, 1,2 M€ par an) sont déjà à l’échelle et restent tels quels.
- Le tableau de bord d’exemple est recalé dans les mêmes proportions (la virtualisation reprend le cas n° 1).
- Un indicateur discret, « Estimation pour une entreprise de 2 000 à 20 000 salariés », accompagne les cas, le tableau de bord et le panneau du haut de page.
- `scripts/check-cases.py` recalcule le cas n° 1 avec le modèle de la spec.

### Haut de page (variante C3)

- Fond bleu nuit, titre et texte actuels, deux boutons actuels.
- À droite, un panneau d’indicateurs de portefeuille (indice moyen, verrous actifs, coût total à 5 ans, économie possible), tiré du tableau de bord recalé, avec l’indicateur de taille.
- La rangée des quatre gros chiffres disparaît. Les chiffres sourcés deviennent une ligne de texte discrète sous le haut de page, avec leurs sources.

### Sections intérieures (variante X)

- Plus de petites étiquettes vertes au-dessus des titres, sur l’accueil comme sur la page du radar.
- Méthode LIBRE : frise horizontale sur une ligne de temps (point vert par étape), première lettre de chaque étape en vert et plus grande (maquette `frise-libre-v3.html`). Pas de cartes.
- Cas chiffrés : chaque cas devient un tableau comparatif (scénarios, coût total, meilleur scénario en vert), sans carte arrondie. La navigation entre les quatre cas est conservée.
- Offres et autres listes en cartes : remplacées par des listes séparées par des filets.
- Les trois composantes du TCD gardent leur présentation en colonnes à filet supérieur, déjà sobre.

### Choix laissés au constructeur

- Les polices restent celles du site (Archivo, Instrument Sans, JetBrains Mono) : les maquettes utilisaient IBM Plex pour aller vite, ce n’est pas un choix.
- Le détail des espacements, la version mobile et le mode sombre suivent l’existant.
- La page du radar applique les mêmes règles (étiquettes, cartes) sans maquette dédiée.

## Contraintes

- Les tests existants restent verts, en particulier les contrastes AA en clair et en sombre, la FAQ et les données structurées.
- `check-cases.py`, `check-data.py` et `landing.mjs --verifier` passent.
- Pas de nouvelle dépendance ni de nouvelle police.

## Approches envisagées

| Approche | Retenue | Raison |
|---|---|---|
| A · Note de cabinet (blanc, empattements) | Non | Trop éloignée de l’identité bleu et vert que le client veut garder. |
| B · Instrument de mesure (gris, panneau de données) | En partie | Son panneau d’indicateurs est repris dans C3. |
| C · Dossier de décision (sombre, livrable au premier plan) | Oui, variante C3 | Garde la palette et met en avant ce que reçoit la direction. |
| Y · Étapes et messages pour direction et équipes | Non | Ajoutait du texte nouveau ; la frise X a été préférée. |
