# Données du radar

`radar.html` charge ces trois fichiers au démarrage. Pour modifier le contenu
du radar, on édite uniquement ces fichiers : le HTML n'a pas à changer.

| Fichier | Vue |
|---|---|
| `tendances.json` | Tendances |
| `technologies.json` | Technologies |
| `mecanismes.json` | Mécanismes d'enfermement |

**Identifiants** : chaque entrée de `tendances.json` et `technologies.json` a un champ
`id` (minuscules, chiffres et tirets, unique sur les deux fichiers), qui sert d'ancre d'URL
(`radar.html#fin-des-licences-perpetuelles`). Il ne change pas quand on réordonne ou
insère des entrées. Les anciennes ancres par position (`#t-07`, `#x-042`) restent
reconnues. Le numéro affiché sur le radar dépend encore de la position dans le fichier.

**Vérification** : au chargement, la page contrôle les champs obligatoires et
les codes. En cas d'erreur, le message s'affiche sous le titre de la page et
indique le fichier, l'entrée et le champ en cause.

## tendances.json

```json
{
  "id": "fin-des-licences-perpetuelles",
  "titre": "Fin des licences perpétuelles",
  "quadrant": 0,
  "anneau": 0,
  "type": "risque",
  "declencheur": "Fait déclencheur : l’événement daté qui rend la tendance actuelle (facultatif, affiché en encadré).",
  "tendance": "La tendance : les faits chiffrés et datés.",
  "risque": "Le risque concret pour l’organisation.",
  "mitigations": ["Piste de mitigation 1", "Piste de mitigation 2"],
  "technologies": ["VMware vSphere et VCF"],
  "sources": [{ "titre": "Nom de la source", "url": "https://…" }]
}
```

- `quadrant` (l'axe) : 0 Juridique · 1 Financier · 2 Humain · 3 Réglementaire ·
  4 Pratiques technologiques
- `anneau` (urgence) : 0 Fort · 1 Élevé · 2 Moyen · 3 Faible
- `type` : `risque` (tendance qui renforce la dépendance) ou `levier` (levier de liberté).
  Le filtre « Type » et la légende n'affichent que les types présents dans le fichier.
  Les leviers sont masqués par défaut ; un lien vers un levier les affiche.
- `technologies` (facultatif) : noms **exacts** d'entrées de `technologies.json`. Ils relient la
  tendance au radar Technologies.
- `sources[].url` : lien vers la source, **obligatoire** pour chaque source affichée.

## technologies.json

```json
{
  "id": "vmware-vsphere-et-vcf",
  "nom": "VMware vSphere et VCF",
  "editeur": "Broadcom",
  "quadrant": 0,
  "anneau": 0,
  "type": "p",
  "dependance": "Ce qui crée la dépendance.",
  "alternatives": ["Proxmox VE", "XCP-ng"]
}
```

- `quadrant` : 0 Infrastructure bas niveau · 1 Middleware · 2 Données · 3 Services aux opérations
- `anneau` : 0 Sortie difficile · 1 Exigeante · 2 Maîtrisable · 3 Facilitée
- `type` : `p` propriétaire · `e` ouvert ou source disponible, éditeur unique ·
  `o` ouvert, gouvernance partagée
- `site` : lien vers le site officiel de la solution (texte), ou liste de liens
  quand l’entrée regroupe plusieurs produits.
- `pourquoi` : la raison du classement dans l’anneau, au regard des cinq critères
  (formats et API, licence et contrat, concentration, maturité des alternatives,
  compétences). Affichée dans la fiche sous la jauge.
- `criteres` (facultatif) : critères pour choisir une alternative, propres à cette
  technologie. Chaque critère est un texte, ou un objet `{ "titre": "…", "detail": "…" }`.
  Sans ce champ, la fiche affiche des pistes communes (fonctionnalités requises, taille
  du déploiement, réemploi du matériel, compétences) et deux pistes propres au domaine,
  définies dans `radar.html` (`VUES.technologies.criteres`).

## mecanismes.json

```json
{
  "nom": "Engagement long et reconduction tacite",
  "court": "Reconduction tacite",
  "symbole": "Rt",
  "couche": 0,
  "moment": 0,
  "fonctionnement": "Comment cela fonctionne.",
  "exemple": "Exemple.",
  "signal": "Le signal d'alerte.",
  "parade": "La parade.",
  "levier": "Clauses de réversibilité"
}
```

- `court` et `symbole` : libellé et symbole de la tuile dans la table.
- `couche` : 0 Contrat · 1 Licences · 2 Commercial · 3 Technique · 4 Organisation ·
  5 Juridique et géopolitique · 6 Open source
- `moment` : 0 À la signature · 1 Pendant l'usage · 2 Au renouvellement · 3 Au moment de partir
- `levier` : **titre exact** d'un levier de `tendances.json` (`type: "levier"`). Il crée le lien
  « Voir le levier… ». Si le titre ne correspond à aucune tendance, le lien
  n'apparaît pas et un avertissement s'affiche dans la console du navigateur.

## Contrôle

```sh
python3 scripts/check-data.py                 # données
python3 scripts/check-data.py --placeholders  # + marqueurs [À COMPLÉTER] dans index.html
```

Le même contrôle tourne dans GitHub Actions (`.github/workflows/check.yml`).

## Tester en local

Les fichiers sont chargés par `fetch`, ce qui ne fonctionne pas quand on ouvre
la page en double-cliquant dessus (`file://`). Il faut lancer un serveur à la
racine du dépôt :

```sh
python3 -m http.server
# puis ouvrir http://localhost:8000/radar.html
```

Sur GitHub Pages, rien à faire : les fichiers sont servis à côté de la page.
