# Appels à l’action du radar — conception courte

Date : 26 novembre 2026 · Statut : validée par le porteur du projet

**Intention** : sur `radar.html`, rien ne dit que retenir ☆ construit un rapport, et la fiche
comme le bas de page sont des impasses. Mener le visiteur vers « Mon radar » puis le rapport.

**Décidé**
- Conversion principale : la demande du rapport (« Mon radar » → « Recevoir mon rapport
  complet (PDF) »). Secondaire, discrète : « Réserver 15 minutes » (Cal.com, `calLien`).
- Pied de fiche (tendances et technologies) : « Cette tendance vous concerne ? » /
  « Vous utilisez cette technologie ? », « Retenez-la : elle alimentera votre rapport
  personnalisé. » et un bouton qui la retient ; une fois retenue, « Ouvrir Mon radar ».
  Pas sur les mécanismes ni les leviers (on ne peut pas les retenir).
- Message au premier élément retenu, une seule fois par navigateur (`localStorage`), y compris
  par « Tout retenir » : « Premier élément retenu. Votre rapport se construit dans Mon radar. »
  avec « Ouvrir Mon radar » et une croix. Pas de disparition automatique. Pas affiché si le
  volet est déjà ouvert.
- Volet « Mon radar », sous le bouton du rapport : « Une question ? Réserver 15 minutes → ».
- Bandeau après « La méthode » : « Votre rapport personnalisé, gratuit », contenu du rapport
  (alternatives mieux classées, leviers et parades, détail par technologie), bouton
  « Construire mon rapport » qui ouvre le volet (vide, il explique déjà l’étoile), lien
  « Réserver 15 minutes → ».
- Le lien Cal.com porte dans `notes=` le lien du rapport de la sélection courante quand elle
  n’est pas vide ; sans `calLien`, il mène à `index.html#contact`.
- Aucune mesure d’audience : Tally et Cal.com comptent déjà demandes et réservations.
- Rien de nouveau en mode rapport (`?rapport=1`) : `#contenu` et le volet y sont masqués.

**Écarté** : appels directs vers les offres d’`index.html` ; rendez-vous mis au même niveau
que le rapport ; ligne d’aide permanente près de la pastille.
