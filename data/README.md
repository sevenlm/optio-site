# Données du radar

`radar.html` charge ces trois fichiers au démarrage. Pour modifier le contenu
du radar, on édite uniquement ces fichiers : le HTML n'a pas à changer.

| Fichier | Vue |
|---|---|
| `tendances.json` | Tendances |
| `technologies.json` | Technologies |
| `mecanismes.json` | Mécanismes d'enfermement |
| `leviers.json` | *Non chargé* : leviers de liberté mis de côté (voir plus bas) |

**Numérotation** : le numéro affiché sur le radar et l'ancre d'URL (`#t-07`,
`#x-042`) dépendent de la **position** de l'entrée dans le fichier. Ajouter une
entrée en fin de liste ne change rien aux liens existants ; en insérer ou en
supprimer une au milieu décale les numéros suivants.

**Vérification** : au chargement, la page contrôle les champs obligatoires et
les codes. En cas d'erreur, le message s'affiche sous le titre de la page et
indique le fichier, l'entrée et le champ en cause.

## tendances.json

```json
{
  "titre": "Fin des licences perpétuelles",
  "quadrant": 0,
  "anneau": 0,
  "type": "risque",
  "contexte": "Texte du bloc « Contexte » (facultatif).",
  "quoi": "Ce qui se passe.",
  "pourquoi": "Pourquoi cela compte.",
  "faire": ["Action 1", "Action 2"],
  "sources": [{ "titre": "Nom de la source", "url": "https://…" }]
}
```

- `quadrant` (l'axe) : 0 Juridique · 1 Financier · 2 Humain · 3 Réglementaire ·
  4 Pratiques technologiques
- `anneau` : 0 Agir maintenant · 1 Préparer · 2 Surveiller · 3 Signal faible
- `type` : `risque` (tendance qui renforce la dépendance) ou `levier` (levier de liberté).
  Le filtre « Type » et la légende n'affichent que les types présents dans le fichier.
- `sources[].url` peut valoir `null` pour une source sans lien (ex. « Observation Optio »).

## leviers.json (mis de côté)

Les 23 leviers de liberté ont été retirés du radar des tendances en novembre 2026.
Ils gardent le format de `tendances.json`, mais leur `quadrant` correspond encore
aux anciens quadrants (3 = « Leviers de liberté ») et doit être réaffecté à l'un
des cinq axes avant de les remettre dans `tendances.json`. Tant qu'ils sont absents,
les liens « Voir le levier » des fiches mécanismes ne s'affichent pas.

## technologies.json

```json
{
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
- `levier` : **titre exact** d'une tendance de `tendances.json`. Il crée le lien
  « Voir le levier… ». Si le titre ne correspond à aucune tendance, le lien
  n'apparaît pas et un avertissement s'affiche dans la console du navigateur.

## Tester en local

Les fichiers sont chargés par `fetch`, ce qui ne fonctionne pas quand on ouvre
la page en double-cliquant dessus (`file://`). Il faut lancer un serveur à la
racine du dépôt :

```sh
python3 -m http.server
# puis ouvrir http://localhost:8000/radar.html
```

Sur GitHub Pages, rien à faire : les fichiers sont servis à côté de la page.
