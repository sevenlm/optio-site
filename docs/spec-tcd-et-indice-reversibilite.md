# Coût total de la dépendance et indice de réversibilité

*Spécification Optio (marque de Stratwise), version 0.2, proposition du 26 novembre 2026*

---

## 1. Objet

Optio mesure la dépendance d’une organisation à ses fournisseurs numériques avec deux indicateurs, décrits dans ce document.

- Le **coût total de la dépendance (TCD)** chiffre ce que coûte une dépendance sur plusieurs années et le compare au coût d’un changement de fournisseur.
- L’**indice de réversibilité** note sur 100 la capacité de l’organisation à changer de fournisseur, à condition de pouvoir le prouver.

Un troisième indicateur, plus simple, fait le lien entre les deux : la **marge de manœuvre**.

Le calculateur, le simulateur, le radar, les missions et les supports commerciaux s’appuient tous sur ce document. Toute modification donne lieu à une nouvelle version.

### 1.1 Principes

1. L’indice mesure la maîtrise. Plus la note est haute, mieux c’est.
2. Chaque niveau de l’indice exige un élément vérifiable. Sans preuve, la note ne monte pas.
3. Rester chez son fournisseur est un scénario comme les autres. Il est chiffré sur la même base que les alternatives, sans être ni le choix par défaut ni un échec.
4. Chaque paramètre du TCD est visible, modifiable et documenté.
5. Les indicateurs ne jugent pas la qualité des produits et ne favorisent aucune alternative.

### 1.2 Périmètre

On mesure fournisseur par fournisseur, ou brique par brique, en se limitant aux fournisseurs critiques : virtualisation, base de données, suite collaborative, service cloud, outil d’observabilité, etc. Un portefeuille regroupe plusieurs fournisseurs.

---

## 2. Glossaire

| Terme | Définition |
|---|---|
| Fournisseur critique | Fournisseur dont la défaillance arrêterait ou dégraderait fortement un processus métier critique. |
| Échéance | Date limite pour renouveler ou dénoncer le contrat, préavis compris. |
| Délai de sortie | Durée estimée ou mesurée d’une migration complète vers une alternative, sans rupture de service. |
| Marge de manœuvre | Nombre de mois avant l’échéance, moins le délai de sortie. |
| Verrou actif | Marge de manœuvre négative. L’organisation n’aura pas fini de partir à l’échéance et devra re-signer. |
| Irritants | Contraintes subies au quotidien à cause du fournisseur (roadmap, mises à jour, formations, obsolescence, etc.). |
| Preuve | Élément vérifiable qui justifie une note : document, chiffrage, clause signée, test réalisé. |
| Scénario | Option comparée dans le TCD. Il y en a quatre : rester, renégocier, réduire ou hybrider, sortir. |

---

## 3. Le coût total de la dépendance (TCD)

### 3.1 Définition

Le TCD additionne les coûts directs, les coûts opérationnels et les coûts de risque, cumulés sur un horizon donné.

| Paramètre | Valeur |
|---|---|
| Horizon | 5 ans par défaut, ou 3, 7 ou 10 ans |
| Unité | Euros hors taxes |
| Pas de calcul | Le mois |
| Actualisation | Aucune par défaut. Un taux `r` peut être appliqué pour une décision d’investissement (§ 3.6). |

### 3.2 Les trois composantes chiffrées

#### Coûts directs

Ce sont les coûts qui figurent sur la facture.

| Élément | Exemple | Mode de calcul |
|---|---|---|
| Licences et abonnements | Souscription annuelle | Montant annuel ÷ 12, chaque mois |
| Support et maintenance | Support éditeur | Idem |
| Hausse à l’échéance | Nouveau modèle de licence | Coût × (1 + hausse) à partir du mois de l’échéance |
| Indexation annuelle | Hausse contractuelle de 5 % par an | Coût × (1 + indexation) à chaque date anniversaire |
| Matériel ou composants imposés | Bundle, matériel certifié | Montant annualisé, ajouté au coût direct annuel |

Dans le modèle de calcul (§ 3.6), le coût direct annuel `C0` comprend les licences, le support, le matériel et les composants imposés.

#### Coûts opérationnels

Ils correspondent au temps que les équipes passent à subir les décisions du fournisseur.

| Irritant | Mesure | Mode de calcul |
|---|---|---|
| Mises à jour forcées | Jours-homme par an | Jours × coût journalier moyen |
| Formations imposées | Jours de formation par an | Jours × coût journalier + frais |
| Roadmap imposée | Demandes métier bloquées ou contournées | Estimation du coût des contournements |
| Obsolescence | Extensions de support payantes, montées de version | Montant annuel |
| Compétences rares | Surcoût des experts de l’éditeur | Écart de coût journalier × jours |
| Écosystème imposé | Outils annexes obligatoires | Coût annuel des outils |

#### Coûts de risque

Ils estiment ce que coûterait une défaillance du fournisseur. Le coût annuel du risque est la somme, pour chaque scénario de défaillance, de sa probabilité annuelle multipliée par son impact.

| Scénario de défaillance | Impact |
|---|---|
| Interruption de service | Durée estimée de l’arrêt × coût d’une heure d’arrêt pour l’activité |
| Compromission chez le fournisseur | Coûts de remédiation, de notification, d’arrêt et d’image |
| Arrêt du service (faillite, sanction, fin de vie) | Coût d’une migration en urgence, plus l’arrêt |

Un plan B testé réduit le coût de risque de 80 % par défaut (paramètre `reduction_risque_plan_b`).

### 3.3 Les dimensions qualitatives

Deux autres dimensions, reprises du guide d’Alliancy (2026), ne sont pas chiffrées par défaut. On les évalue et on les présente à côté du TCD.

| Dimension | Question | Échelle |
|---|---|---|
| Coût d’opportunité | Quelle part du budget de transformation la dépendance absorbe-t-elle ? | Faible, moyen, fort |
| Coût de la captivité | La dépendance se renforce-t-elle, avec moins de poids dans les négociations et une sortie de plus en plus difficile ? | Faible, moyen, fort |

### 3.4 Le coût du changement

Pour chaque scénario autre que « rester », on compare le TCD au coût du changement.

| Poste | Contenu | Repères de marché |
|---|---|---|
| Préparation | Diagnostic, preuve, cadrage | Forfait de mission |
| Migration | Bascule des charges | De 50 à 500 € par machine virtuelle standard avec un outil automatisé, de 1 500 à 8 000 € pour une application critique (Alliancy, 2026) |
| Refonte | Scripts, automatisation, intégrations, sauvegarde, PRA | Jusqu’à 30 à 50 % du budget de migration pour les profils très captifs (Alliancy, 2026) |
| Double exploitation | Ancienne et nouvelle plateforme en parallèle | Souvent 12 à 24 mois sur un projet moyen (Alliancy, 2026) |
| Formation et conduite du changement | Montée en compétences, accompagnement | Jours × coût journalier |
| Exploitation de l’alternative | Licences, support, hébergement, équipe | Montant annuel |

Le modèle de calcul (§ 3.6) regroupe la migration, la refonte, la formation et la conduite du changement dans le coût de migration `M`. La double exploitation n’y figure pas sous forme de forfait, elle découle du calendrier. L’alternative est payée pendant les `D` derniers mois de la sortie, et l’ancien fournisseur jusqu’à la fin de son engagement.

### 3.5 Les scénarios

| Code | Scénario | Hypothèses |
|---|---|---|
| S0 | Rester sous contrainte | La hausse à l’échéance s’applique. Irritants et risque ne changent pas. |
| S1 | Renégocier avec une alternative prouvée | La préparation est payée. La hausse négociée est plus faible et le plan B réduit le risque. |
| S2 | Réduire ou hybrider | Une part `p` du périmètre migre, le reste est renégocié. |
| S3 | Sortir | Préparation et migration sont payées. Le fournisseur est payé jusqu’à la fin de son engagement, puis l’alternative prend le relais. |

### 3.6 Modèle de calcul

Le calcul se fait mois par mois, pour `t` allant de 0 à `H × 12 − 1`. Les notations sont les suivantes.

| Notation | Signification | Défaut |
|---|---|---|
| `C0` | Coût direct annuel actuel | |
| `h` | Hausse à l’échéance | |
| `hN` | Hausse négociée | |
| `mE` | Nombre de mois avant l’échéance | |
| `I` | Coûts opérationnels annuels | |
| `K` | Coût de risque annuel | |
| `ρ` | Réduction du risque grâce à un plan B | 0,8 |
| `ι` | Réduction des irritants après la sortie | 0,5 |
| `P` | Coût de préparation | |
| `M` | Coût de migration | |
| `T` | Délai de sortie, en mois | |
| `A` | Coût annuel de l’alternative | |
| `D` | Durée de double exploitation en mois, avec `D ≤ T` | 6 |
| `R` | Durée minimale de réengagement en mois, si l’on doit re-signer avant d’être sorti | 6 |
| `g` | Indexation annuelle du contrat | 0 |
| `r` | Taux d’actualisation annuel | 0 |

```
contrat(t, hausse) = C0 × (1 + g)^⌊t/12⌋ / 12                si t < mE
                   = C0 × (1 + g)^⌊t/12⌋ × (1 + hausse) / 12  sinon

fin d’engagement F = T                      si T ≤ mE
                   = max(T, mE + R)         sinon (verrou actif, il faut re-signer)

S0 = Σ [ contrat(t, h) + I/12 + K/12 ]

S1 = P + Σ [ contrat(t, hN) + I/12 + (1 − ρ) × K/12 ]

S3 = P + Σ_{t < T}  [ contrat(t, h) + M/T + I/12 + K/12 + 𝟙(t ≥ T − D) × A/12 ]
       + Σ_{t ≥ T}  [ A/12 + (1 − ι) × I/12 + (1 − ρ) × K/12 + 𝟙(t < F) × contrat(t, h) ]

S2 = p × S3 + (1 − p) × S1     (approximation, à détailler par vague si besoin)
```

Si un taux d’actualisation est retenu, chaque terme du mois `t` est multiplié par `1 / (1 + r)^(t/12)`. La préparation `P` est comptée au mois 0.

Le modèle fait plusieurs simplifications. Le coût de l’alternative `A` et les coûts `I` et `K` ne sont pas indexés. La migration `M` est répartie à parts égales sur le délai de sortie. En cas de réengagement, c’est la hausse à l’échéance `h` qui s’applique.

### 3.7 Indicateurs dérivés

| Indicateur | Formule |
|---|---|
| Gain du meilleur scénario | TCD(S0) − min(TCD des autres scénarios) |
| Délai de retour | Premier mois où le cumul du scénario passe sous le cumul de S0 |
| Ratio coût de sortie / coût annuel | (P + M + D × A/12) ÷ C0 |
| État du verrou | Actif si T > mE |

### 3.8 Données d’entrée

| Champ | Unité | Obligatoire | Source habituelle |
|---|---|---|---|
| Coût direct annuel actuel (`C0`) | € HT | Oui | Contrat, achats |
| Hausse à l’échéance (`h`) | % | Oui | Proposition du fournisseur, estimation |
| Mois avant l’échéance (`mE`) | mois | Oui | Contrat (préavis inclus) |
| Coûts opérationnels annuels (`I`) | € HT | Recommandé | Entretiens avec les équipes |
| Coût de risque annuel (`K`) | € HT | Recommandé | Analyse d’impact, RSSI |
| Hausse négociée (`hN`) | % | Pour S1 | Hypothèse de négociation |
| Coût de préparation (`P`) | € HT | Pour S1 à S3 | Proposition de mission |
| Coût de migration (`M`) | € HT | Pour S2 et S3 | Chiffrage, repères du § 3.4 |
| Délai de sortie (`T`) | mois | Pour S3 | Estimation, puis mesure lors du pilote |
| Coût annuel de l’alternative (`A`) | € HT | Pour S2 et S3 | Offres comparées |
| Part migrée (`p`) | % | Pour S2 | Périmètre retenu |
| Durée de double exploitation (`D`) | mois | Pour S2 et S3 (6 par défaut) | Plan de migration |
| Durée minimale de réengagement (`R`) | mois | Si verrou actif (6 par défaut) | Proposition du fournisseur |
| Indexation annuelle (`g`) | % | Non (0 par défaut) | Contrat |
| Taux d’actualisation (`r`) | % | Non (0 par défaut) | Direction financière |

### 3.9 Exemple de calcul

Prenons une plateforme de virtualisation avec les valeurs suivantes : `C0` = 600 k€, `h` = 60 %, `mE` = 14 mois, `I` = 45 k€, `K` = 87 k€, `hN` = 15 %, `P` = 60 k€, `M` = 240 k€, `T` = 18 mois, `A` = 360 k€, `D` = 6 mois, `R` = 6 mois. Il n’y a ni indexation ni actualisation, et l’horizon est de 5 ans. Les montants sont à l’échelle d’une entreprise de 2 000 à 20 000 salariés.

| Scénario | TCD sur 5 ans |
|---|---|
| S0, rester sous contrainte | 5,0 M€ |
| S1, renégocier avec une alternative prouvée | 3,7 M€ |
| S3, sortir | 3,3 M€ |

Le verrou est actif, puisque la sortie prend 18 mois et que l’échéance tombe dans 14 mois. L’organisation doit donc re-signer au mois 14 pour au moins 6 mois, et paie l’ancien fournisseur jusqu’au mois 20.

La sortie fait gagner 1,8 M€ sur cinq ans par rapport au statu quo et devient rentable au bout de 30 mois. Le ratio coût de sortie / coût annuel vaut (0,06 + 0,24 + 0,18) ÷ 0,6, soit 0,8.

### 3.10 Restitution

Le TCD est présenté avec :

- la courbe des coûts cumulés de chaque scénario, sur laquelle l’échéance est repérée ;
- des barres qui comparent le TCD des scénarios, le meilleur en vert ;
- le détail par composante et par année ;
- la liste des hypothèses, toujours visible.

---

## 4. L’indice de réversibilité

### 4.1 Définition

L’indice se calcule fournisseur par fournisseur. On divise la somme des notes par le nombre d’axes multiplié par 5, puis on multiplie par 100 et on arrondit à l’entier. Il mesure la capacité de l’organisation à changer de fournisseur, telle qu’elle peut la prouver.

### 4.2 Les axes

La version 0.1 comptait sept axes. La version 0.2 en compte neuf, répartis en quatre familles. Les compétences, jusqu’ici optionnelles, deviennent un axe à part entière. Le contrat et le cadre juridique sont séparés, comme dans le guide d’Alliancy.

| Famille | Axe | Question posée |
|---|---|---|
| Technique | Interopérabilité | Les échanges reposent-ils sur des standards ouverts ? |
| Technique | Portabilité des données | Peut-on extraire les données dans un format réutilisable, pour un coût connu ? |
| Technique | Exclusivité fonctionnelle | Utilise-t-on des fonctions propriétaires sans équivalent standard ? |
| Technique | Écosystème | Le fournisseur impose-t-il ses outils annexes et ses intégrations ? |
| Marché | Alternatives fonctionnelles | Existe-t-il des alternatives matures, et les a-t-on évaluées ? |
| Marché | Maîtrise des coûts | Les coûts, y compris ceux de la sortie, sont-ils connus et prévisibles ? |
| Droit | Contrats | Durée, préavis, clauses de réversibilité, d’assistance à la sortie et d’audit |
| Droit | Cadre juridique et réglementaire | Droit applicable, exposition extraterritoriale, conformité (DORA, NIS 2, Data Act) |
| Humain | Compétences | Les équipes savent-elles faire fonctionner une alternative ? |

### 4.3 L’échelle et la preuve

| Note | Niveau | Preuve attendue |
|---|---|---|
| 0 | Verrouillé, aucune sortie envisageable aujourd’hui | Aucune |
| 1 | Possible en théorie, rien de documenté | Une déclaration |
| 3 | Possible, avec un effort identifié et chiffré | Une étude, un chiffrage, une clause signée |
| 5 | Maîtrisé, testé ou démontré | Un test de bascule, une extraction réalisée, un pilote |

Seules les notes 0, 1, 3 et 5 sont admises. L’écart entre deux niveaux grandit à mesure qu’on monte, pour que la note récompense ce qui est prouvé plutôt que ce qui est prévu.

### 4.4 Les niveaux par axe

| Axe | 0 | 1 | 3 | 5 |
|---|---|---|---|---|
| Interopérabilité | Formats et API propriétaires uniquement | Des standards existent, non utilisés | Standards utilisés sur l’essentiel, écarts identifiés | Échanges standards, testés avec une autre solution |
| Portabilité des données | Aucune extraction possible | Extraction annoncée, jamais faite | Extraction chiffrée en délai et en coût | Extraction complète réalisée et rechargée ailleurs |
| Exclusivité fonctionnelle | Forte dépendance à des fonctions exclusives | Usages propriétaires non recensés | Usages recensés, écarts chiffrés | Usages recensés et couverts par l’alternative |
| Écosystème | Écosystème entièrement imposé | Dépendances annexes connues, non traitées | Outils annexes recensés, alternatives identifiées | Outils annexes remplaçables, remplacement testé |
| Alternatives fonctionnelles | Aucune alternative connue | Alternatives citées, non évaluées | Alternatives comparées et chiffrées | Alternative éprouvée en pilote sur un périmètre réel |
| Maîtrise des coûts | Coûts imprévisibles, hausses subies | Coûts actuels connus, coût de sortie inconnu | Coût total et coût de sortie estimés | Coût total et coût de sortie mesurés, trajectoire suivie |
| Contrats | Engagement long, aucune clause de sortie | Clauses génériques, non vérifiées | Clauses de réversibilité, préavis et audit négociés | Clauses de sortie négociées et exercées lors d’un test |
| Cadre juridique et réglementaire | Exposition non évaluée | Exposition connue, non traitée | Exposition évaluée, mesures définies (chiffrement, clauses) | Exposition maîtrisée et vérifiée (clés maîtrisées, offre qualifiée, clauses de type Oméga) |
| Compétences | Aucune compétence sur une alternative | Quelques personnes sensibilisées | Plan de montée en compétences chiffré | Équipes formées, qui ont déjà fait fonctionner l’alternative |

### 4.5 Règles de calcul

1. **Plafond.** Tant qu’aucun axe n’atteint 5, l’indice ne peut pas dépasser 69. On n’atteint pas la zone « voie libre » sans au moins une preuve.
2. **Validité de la preuve.** Une note de 5 qui repose sur un test de plus de 12 mois redescend à 3 jusqu’au test suivant.
3. **Axe non évalué.** Il compte pour 0 et il est signalé. Si plus de deux axes ne sont pas évalués, l’indice est marqué « provisoire ».
4. **Pondération.** Il n’y en a pas par défaut. On peut pondérer les familles pour un client, à condition d’afficher la pondération à côté de l’indice.

### 4.6 Les zones

| Indice | Zone | Ce que cela signifie |
|---|---|---|
| 0 à 39 | Verrouillé | Les prochains renouvellements se décideront surtout du côté du fournisseur. |
| 40 à 69 | Sous contrainte | La liberté de choix dépend encore du calendrier du fournisseur. |
| 70 à 100 | Voie libre | L’organisation peut réellement choisir, et doit entretenir cette capacité. |

### 4.7 Indicateurs associés

| Indicateur | Définition | Usage |
|---|---|---|
| Marge de manœuvre | Mois avant l’échéance moins délai de sortie | Négative, elle signale un verrou actif. |
| Criticité métier | Note de 1 à 5 selon l’impact d’un arrêt sur l’activité | Croisée avec l’indice dans une matrice |
| Priorité absolue | Criticité supérieure ou égale à 4 et indice inférieur à 40 | Désigne les fournisseurs à traiter en premier. |

### 4.8 Exemple de calcul

Reprenons la plateforme de virtualisation du § 3.9 et notons-la sur les neuf axes.

| Axe | Note | Preuve |
|---|---|---|
| Interopérabilité | 1 | Aucune |
| Portabilité des données | 3 | Estimation interne d’extraction |
| Exclusivité fonctionnelle | 1 | Aucune |
| Écosystème | 1 | Aucune |
| Alternatives fonctionnelles | 3 | Comparatif chiffré de deux solutions |
| Maîtrise des coûts | 1 | Aucune |
| Contrats | 1 | Aucune |
| Cadre juridique et réglementaire | 3 | Analyse d’exposition réalisée |
| Compétences | 1 | Aucune |

La somme des notes est de 15 sur 45, ce qui donne un indice de 33 sur 100, dans la zone « verrouillé ». La marge de manœuvre vaut 14 − 18, soit −4 mois, et le verrou est donc actif. Avec une criticité de 5, ce fournisseur est une priorité absolue.

### 4.9 Entretien de la réversibilité

| Action | Fréquence | Alerte |
|---|---|---|
| Revue de l’indice | Chaque trimestre | Aucune revue depuis plus de 92 jours |
| Test de bascule | Chaque année pour une criticité de 4 ou 5 | Aucun test depuis plus de 12 mois |
| Revue de réversibilité des nouveaux contrats critiques | À chaque signature | Portabilité ou contrats notés moins de 3 |
| Suivi de la marge de manœuvre | Chaque mois, à partir de 24 mois avant l’échéance | Marge négative ou inférieure à 3 mois |

---

## 5. Comment les deux indicateurs se complètent

Un indice bas sur les axes « alternatives » ou « compétences » allonge la sortie et la renchérit dans le TCD. L’indice aide donc à choisir le scénario.

Un pilote améliore les deux indicateurs à la fois. Il fait passer plusieurs axes à 5, réduit l’incertitude sur le délai de sortie et le coût de migration, et déclenche la réduction du coût de risque.

La marge de manœuvre fait le lien. Elle utilise le délai de sortie, mesuré pour l’indice, et l’échéance, qui sert au calcul du TCD.

---

## 6. Correspondances

### 6.1 Avec le guide d’Alliancy (2026)

| Alliancy | Optio |
|---|---|
| Six dimensions : technologique, commerciale, contractuelle, données, juridique et réglementaire, compétences | Neuf axes en quatre familles (§ 4.2) |
| Notes de 1 (faible adhérence) à 5 (captivité totale) | Notes dans l’autre sens, de 0 (verrouillé) à 5 (maîtrisé) |
| Profils agile, contraint et captif | Zones voie libre, sous contrainte et verrouillé |
| Coût du statu quo en quatre dimensions | TCD en trois composantes chiffrées et deux dimensions qualitatives (§ 3.2 et 3.3) |

### 6.2 Avec DORA

L’indice fournit plusieurs informations du registre des prestataires prévu par DORA : la substituabilité (axes « alternatives » et « portabilité »), la possibilité de réintégrer le service en interne (axe « compétences ») et l’existence d’un plan de sortie testé (règle de validité de la preuve).

---

## 7. Gouvernance du référentiel

Les versions sont numérotées (0.1, 0.2, etc.) et accompagnées d’un journal des changements. Un indice est toujours publié avec le numéro de la version utilisée.

Nous proposons de publier le référentiel sous licence Creative Commons BY-SA 4.0, pour que d’autres puissent le reprendre et l’améliorer.

Il s’enrichit des retours de missions, des entretiens avec des DSI et des contributions de l’écosystème (associations professionnelles, éditeurs, utilisateurs).

### Journal des changements

| Version | Date | Changements |
|---|---|---|
| 0.1 | Octobre 2026 | Sept axes, échelle 0-1-3-5, plafond à 69 sans preuve, TCD en trois composantes et quatre scénarios |
| 0.2 | Novembre 2026 | Neuf axes en quatre familles (les compétences deviennent un axe standard, le contrat et le cadre juridique sont séparés) ; validité de la preuve limitée à 12 mois ; dimensions qualitatives du TCD ; repères de coûts de changement ; scénario S2 « réduire ou hybrider » ; double exploitation, réengagement en cas de verrou actif, indexation et actualisation ajoutés au modèle de calcul |

---

## Annexe : modèle de données (JSON)

```json
{
  "fournisseur": {
    "id": "virtualisation-01",
    "nom": "Plateforme de virtualisation",
    "categorie": "Virtualisation",
    "criticite": 5,
    "mois_avant_echeance": 14,
    "delai_sortie_mois": 18
  },
  "tcd": {
    "horizon_ans": 5,
    "cout_direct_annuel": 600000,
    "hausse_echeance": 0.60,
    "couts_operationnels_annuels": 45000,
    "cout_risque_annuel": 87000,
    "hausse_negociee": 0.15,
    "cout_preparation": 60000,
    "cout_migration": 240000,
    "cout_annuel_alternative": 360000,
    "part_migree": null,
    "duree_double_exploitation_mois": 6,
    "duree_reengagement_mois": 6,
    "parametres": { "reduction_risque_plan_b": 0.8, "reduction_irritants_sortie": 0.5, "indexation_annuelle": 0, "taux_actualisation": 0 },
    "qualitatif": { "cout_opportunite": "fort", "cout_captivite": "fort" }
  },
  "indice": {
    "version_referentiel": "0.2",
    "notes": {
      "interoperabilite": 1, "portabilite": 3, "exclusivite": 1, "ecosysteme": 1,
      "alternatives": 3, "maitrise_couts": 1, "contrats": 1, "juridique": 3, "competences": 1
    },
    "preuves": {
      "portabilite": { "description": "Estimation interne d’extraction", "date": "2026-10-15" },
      "alternatives": { "description": "Comparatif chiffré de deux solutions", "date": "2026-10-20" },
      "juridique": { "description": "Analyse d’exposition réalisée", "date": "2026-11-02" }
    },
    "plan_sortie_teste": false,
    "date_dernier_test": null,
    "date_derniere_revue": "2026-11-15"
  }
}
```
