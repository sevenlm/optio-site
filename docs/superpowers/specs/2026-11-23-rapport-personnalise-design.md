# Rapport personnalisé du radar — conception

Date : 23 novembre 2026 · Statut : relu, à valider par le porteur du projet

## Intention

Le radar des dépendances (`radar.html`) devient le **lead magnet** d’une campagne
marketing d’Optio. Un DSI ou décideur y retient les tendances et les technologies
qui le concernent, voit gratuitement un aperçu de son exposition, puis laisse son
e-mail pour obtenir son **rapport complet**. Ce rapport n’est pas une fin en soi :
c’est le support d’un **rendez-vous de 15 minutes** avec Optio pour l’analyser et
étudier plus avant ses dépendances nocives. L’indicateur de succès est le nombre
de rendez-vous pris, et la liste d’e-mails sert à relancer ceux qui n’en prennent
pas tout de suite.

## Objectifs

- Permettre de retenir tendances et technologies depuis le radar, et de retrouver
  sa sélection en revenant.
- Montrer un **aperçu libre** qui donne envie d’en savoir plus sans livrer
  l’analyse.
- Échanger le **rapport complet** contre un e-mail (et le consentement RGPD), via
  Tally, sans serveur.
- Rendre le rapport complet **consultable à une adresse personnelle** et
  **téléchargeable en PDF**.
- Pousser à la **prise de rendez-vous** : dans le rapport et dans l’e-mail de
  confirmation.
- Donner à Optio, à chaque demande, le contact **et la sélection**, pour préparer
  l’échange.

## Non-objectifs

- Pas de serveur, de base de données ni de compte utilisateur : le site reste
  statique sur GitHub Pages.
- Pas d’envoi automatisé d’un rapport personnalisé par e-mail au lancement (Zapier,
  Make, outil d’emailing) : Optio traite les demandes à la main.
- Pas de chiffrage (coût total, délais) dans le rapport : c’est le travail d’Optio
  en rendez-vous et en mission.
- Pas de CRM : les réponses restent dans Tally au lancement.

## Anti-objectifs (échec même si « ça marche »)

- Un formulaire long : **seuls l’e-mail et le consentement RGPD** sont demandés.
- Un aperçu qui livre déjà tout : plus personne ne laisse son e-mail.
- Un rapport qui ressemble à une plaquette commerciale : il doit rester factuel,
  sourcé et utile même sans Optio, pour être crédible et circuler en interne.
- Casser le radar existant (filtres, liste à droite, piste horizontale, liens
  tendances ↔ technologies, mode sombre, mobile).

## Contraintes

- **Site statique** (GitHub Pages, domaine `optio.stratwise.fr`). Tout est calculé
  dans la page à partir de `data/*.json`.
- **Identifiants stables** : chaque tendance, technologie, mécanisme et levier a un
  champ `id` (slug, 46 caractères au plus). Ce sont eux qui encodent la sélection.
- **Données disponibles** : une tendance porte `mecanismes` (liste d’`id`),
  `leviers` (liste de `{id, commentaire}`) et `technologies` (noms) ; un mécanisme
  porte ses `leviers` ; une technologie porte `anneau`, `pourquoi`, `dependance`,
  `alternatives`, `site`, `sources`.
- **Tally** : champs cachés et redirection après envoi (avec valeurs du formulaire
  dans l’adresse) sont gratuits. **Optio prend l’offre Tally Pro** pour l’e-mail
  de confirmation au répondant. La notification à Optio est gratuite.
- **Prise de rendez-vous : Cal.com** (logiciel libre, auto-hébergeable), retenu
  plutôt que Calendly pour rester souverain et libre. Le lien de réservation
  reçoit le lien du rapport (préremplissage), pour qu’Optio l’ait dans
  l’invitation.
- **RGPD** : mention réécrite pour la finalité élargie (envoyer le rapport,
  recontacter, relancer dans le cadre de la campagne), avec une conservation de
  **trois ans après le dernier contact**, à valider par la personne qui porte la
  conformité. Le marqueur `[DURÉE DE CONSERVATION]` de la landing est remplacé de
  la même façon.
- **Contrôles du dépôt** : `scripts/check-data.py` et `check-cases.py` passent avant
  chaque commit ; ne pas les casser.
- Accessible au clavier, lisible en mode sombre, utilisable sur mobile.

## Approches considérées

1. **Raccourci Tally (retenue)** — l’aperçu s’affiche dans la page ; le bouton
   « Recevoir mon rapport complet » ouvre un formulaire Tally (e-mail + RGPD) qui
   reçoit la sélection en champ caché ; après envoi, Tally redirige vers l’adresse
   du rapport complet ; Tally envoie un e-mail de confirmation simple avec l’appel
   au rendez-vous ; Optio traite les demandes à la main. Rien à héberger ni à
   maintenir en plus.
2. **Tally + automatisation (Zapier ou Make)** — un scénario envoie un e-mail
   personnalisé avec le lien du rapport. Plus robuste (prouve l’adresse e-mail),
   mais plus d’outils à payer et maintenir pour un gain modeste au lancement.
   Pourra se brancher plus tard sans toucher au radar.
3. **Rapport uniquement par e-mail, sans redirection** — perd l’effet immédiat et
   ramène au besoin d’automatisation.

**Choix** : approche 1, retenue par le porteur du projet. **Contrepartie acceptée** :
l’adresse du rapport est calculée dans la page ; quelqu’un d’astucieux peut l’ouvrir
sans remplir le formulaire. On ne cherche pas à l’empêcher.

## Ce qui est décidé

### Parcours

```
Radar → je retiens mes tendances et technologies
      → « Mon radar · N » → aperçu libre
      → « Recevoir mon rapport complet » → formulaire Tally (e-mail + RGPD)
            champ caché : la sélection
      → envoi → Tally redirige vers le rapport complet (adresse personnelle)
            → lecture à l’écran, téléchargement en PDF
      → e-mail de confirmation Tally avec l’appel à prendre rendez-vous
      → Optio reçoit la notification (contact + sélection) et rappelle
```

### Retenir

- Un bouton **☆ Retenir** dans chaque fiche de tendance et de technologie, et une
  étoile sur chaque ligne de la liste à droite du radar.
- Une pastille **« Mon radar · N »** toujours visible dans la barre de filtres ; elle
  ouvre un volet avec la sélection (retirer un élément, ouvrir sa fiche) et le
  bouton « Voir mon aperçu ».
- Dans le volet, un **coup de pouce** : « Ces tendances concernent aussi … Les
  utilisez-vous ? », qui propose en un clic les technologies reliées aux tendances
  retenues.
- La sélection est gardée dans le navigateur (`localStorage`, lectures et écritures
  protégées) pour la retrouver en revenant ; sans stockage, tout fonctionne quand
  même le temps de la visite.

### Aperçu (libre)

- Exposition des technologies retenues par anneau de sortie (difficile, exigeante,
  maîtrisable, facilitée).
- Nombre de tendances retenues, dont urgentes (anneaux Fort et Élevé).
- Les **mécanismes d’enfermement probables** : ceux reliés aux tendances retenues,
  nommés seulement (les premiers, puis « + N »).
- Les sections détaillées (alternatives, leviers, parades) apparaissent
  **verrouillées**.
- Bouton « Recevoir mon rapport complet (PDF) ».

### Formulaire Tally

- **Le clic sur « Recevoir mon rapport complet » vaut accord** pour charger Tally :
  pas d’étape d’accord séparée. Une phrase d’information figure juste sous le
  bouton (formulaire hébergé par Tally, adresse IP transmise, finalité, renvoi vers
  la mention RGPD).
- Champs visibles : **e-mail** et **consentement RGPD**. Rien d’autre.
- Champ caché : la sélection.
- Redirection après envoi vers l’adresse du rapport complet construite avec la
  sélection.
- E-mail de confirmation au répondant (Tally Pro) : message simple, lien vers son
  rapport, appel à prendre rendez-vous (15 minutes) avec le lien Cal.com.
- Notification à Optio à chaque envoi.

### Rapport complet

Adresse personnelle `radar.html?rapport=…`, lisible à l’écran et mise en page pour
l’impression (« Enregistrer en PDF » du navigateur) :

1. Page de garde : titre, date, sélection.
2. Synthèse de l’exposition (comme l’aperçu, en complet).
3. Pour chaque technologie retenue : anneau, « pourquoi cet anneau », ce qui crée
   la dépendance, alternatives mieux classées, tendances qui la concernent, site
   officiel.
4. Pour chaque tendance retenue : risque, leviers avec leur commentaire.
5. Mécanismes probables et leurs parades (leviers reliés).
6. Sources citées.
7. Dernière page : appel au rendez-vous « Analysons ce rapport ensemble, 15 minutes »,
   avec le lien de réservation Cal.com (lien du rapport joint).

Décisions du constructeur, validées dans la conversation :

- **Vue à jour, pas un instantané** : le rapport est recalculé à partir des données
  du moment ; l’adresse porte la **date de la demande**, affichée en page de garde.
  Un `id` qui ne figure plus dans le radar est signalé en une ligne (« N éléments
  ne figurent plus dans le radar »), sans bloquer le reste.
- **Pas de plafond de sélection** : les `id` restent lisibles dans l’adresse ;
  même tout sélectionné, l’adresse reste d’une longueur acceptable. Optio lit le
  rapport en ouvrant le lien de la notification.
- **La page du rapport se suffit à elle-même** : bouton « Copier le lien de mon
  rapport », dernier rapport gardé dans le navigateur, appel au rendez-vous bien
  visible.

### Traitement côté Optio

À la main, à partir des réponses Tally (e-mail + sélection, et lien vers le rapport).

## Laissé au constructeur

- Le format exact de la sélection dans l’adresse (par exemple deux paramètres, un
  pour les tendances et un pour les technologies, avec les `id`), tant qu’il reste
  stable et tient dans une adresse raisonnable.
- Le placement exact de la pastille « Mon radar » et du volet, l’animation
  d’ouverture, l’emplacement des étoiles.
- La façon d’intégrer Tally (fenêtre surgissante officielle de Tally ou page Tally
  dédiée) et le passage du champ caché. Tally n’est chargé qu’au clic.
- Les styles d’impression (sauts de page, en-têtes, masquage de l’interface).
- Les identifiants Tally (formulaire, URL de redirection) et le lien Cal.com :
  prévoir des réglages faciles à renseigner.
- L’ordre de tri dans l’aperçu et le rapport (urgence puis difficulté de sortie
  semblent naturels).
