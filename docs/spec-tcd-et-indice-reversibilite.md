# Spécification — Coût total de la dépendance et indice de réversibilité

*Optio, une marque de Stratwise · Version 0.2 (proposition) · 26 novembre 2026*

---

## 1. Objet

Ce document spécifie les deux indicateurs qu’Optio utilise pour mesurer la dépendance d’une organisation à ses fournisseurs numériques :

- **le coût total de la dépendance (TCD)** : ce que coûte réellement une dépendance sur plusieurs années, comparé au coût d’un changement ;
- **l’indice de réversibilité** : la capacité, prouvée, d’une organisation à changer de fournisseur, notée sur 100.

Ils sont complétés par un indicateur simple, **la marge de manœuvre**, qui relie les deux.

La spécification sert de référence commune pour les outils (calculateur, simulateur, radar), les missions et les supports commerciaux. Toute évolution doit passer par une nouvelle version de ce document.

### 1.1 Principes

1. **Mesurer la maîtrise, pas la dépendance.** Une note haute de l’indice est une bonne nouvelle.
2. **Pas de score sans preuve.** Chaque niveau de l’indice exige un élément vérifiable.
3. **Rester est un scénario.** Le statu quo est chiffré sur la même base que les alternatives ; il n’est jamais le choix par défaut, ni un échec.
4. **Des hypothèses explicites.** Chaque paramètre du TCD est visible, modifiable et documenté.
5. **Neutralité.** Les indicateurs ne notent pas la qualité des produits et ne favorisent aucune alternative.

### 1.2 Périmètre

L’unité de mesure est **le fournisseur critique** (ou la brique technologique critique) : virtualisation, base de données, suite collaborative, service cloud, outil d’observabilité, etc. Un portefeuille regroupe plusieurs fournisseurs.

---

## 2. Glossaire

| Terme | Définition |
|---|---|
| Fournisseur critique | Fournisseur dont la défaillance arrêterait ou dégraderait fortement un processus métier critique. |
| Échéance | Date à laquelle le contrat doit être renouvelé ou dénoncé, préavis compris. |
| Délai de sortie | Durée estimée ou mesurée d’une migration complète vers une alternative, sans rupture de service. |
| Marge de manœuvre | Mois restants avant l’échéance, moins le délai de sortie. |
| Verrou actif | Situation où la marge de manœuvre est négative : il faut re-signer. |
| Irritants | Contraintes subies au quotidien du fait du fournisseur (roadmap, mises à jour, formations, obsolescence…). |
| Preuve | Élément vérifiable qui justifie une note : document, chiffrage, clause signée, test réalisé. |
| Scénario | Option comparée dans le TCD : rester, renégocier, hybrider ou réduire, sortir. |

---

## 3. Le coût total de la dépendance (TCD)

### 3.1 Définition

> **TCD = coûts directs + coûts opérationnels + coûts de risque**, cumulés sur un horizon donné.

- **Horizon :** 5 ans par défaut ; paramétrable à 3, 5, 7 ou 10 ans.
- **Unité :** euros hors taxes.
- **Pas de calcul :** mensuel.
- **Actualisation :** aucune par défaut. Un taux d’actualisation optionnel `r` peut être appliqué pour les décisions d’investissement (§ 3.6).

### 3.2 Les trois composantes chiffrées

#### Coûts directs — ce que montre la facture

| Élément | Exemple | Mode de calcul |
|---|---|---|
| Licences et abonnements | Souscription annuelle | Montant annuel ÷ 12 par mois |
| Support et maintenance | Support éditeur | Idem |
| Hausse à l’échéance | Nouveau modèle de licence | Coût × (1 + hausse) à partir du mois de l’échéance |
| Indexation annuelle | Hausse contractuelle de 5 % par an | Coût × (1 + indexation) à chaque date anniversaire |
| Matériel ou composants imposés | Bundle, matériel certifié | Montant annualisé, inclus dans le coût direct annuel |

Dans le modèle de calcul (§ 3.6), le coût direct annuel `C0` regroupe licences, support, matériel et composants imposés.

#### Coûts opérationnels — les irritants du quotidien

Ils mesurent le temps que les équipes passent à subir les décisions du fournisseur.

| Irritant | Mesure | Mode de calcul |
|---|---|---|
| Mises à jour forcées | Jours-homme par an | Jours × coût journalier moyen |
| Formations imposées | Jours de formation par an | Jours × coût journalier + frais |
| Roadmap imposée | Demandes métier bloquées ou contournées | Coût des contournements, estimé |
| Obsolescence | Extensions de support payantes, montées de version | Montant annuel |
| Compétences rares | Surcoût des experts de l’éditeur | Écart de coût journalier × jours |
| Écosystème imposé | Outils annexes obligatoires | Coût annuel des outils |

#### Coûts de risque — ce que coûterait une défaillance

> **Coût annuel du risque = Σ (probabilité annuelle du scénario × impact du scénario)**

| Scénario de défaillance | Impact |
|---|---|
| Interruption de service | Durée estimée de l’arrêt × coût d’une heure d’arrêt pour l’activité |
| Compromission chez le fournisseur | Coûts de remédiation, de notification, d’arrêt et d’image |
| Arrêt ou coupure du service (faillite, sanction, fin de vie) | Coût d’une migration en urgence + arrêt |

Un **plan B testé** réduit le coût de risque (paramètre `reduction_risque_plan_b`, 80 % par défaut).

### 3.3 Les dimensions qualitatives

Deux dimensions, inspirées du guide d’Alliancy (2026), ne sont pas chiffrées par défaut mais sont évaluées et présentées à côté du TCD :

| Dimension | Question | Échelle |
|---|---|---|
| Coût d’opportunité | Quel budget de transformation est absorbé par la dépendance ? | Faible, moyen, fort |
| Coût de la captivité | La dépendance se renforce-t-elle : levier de négociation perdu, sortie de plus en plus difficile ? | Faible, moyen, fort |

### 3.4 Le coût du changement

Il est comparé au TCD pour chaque scénario autre que « rester ».

| Poste | Contenu | Repères de marché |
|---|---|---|
| Préparation | Diagnostic, preuve, cadrage | Forfait de mission |
| Migration | Bascule des charges | 50 à 500 € par machine virtuelle standard avec un outil automatisé ; 1 500 à 8 000 € pour une application critique (Alliancy, 2026) |
| Refonte | Scripts, automatisation, intégrations, sauvegarde, PRA | Jusqu’à 30 à 50 % du budget de migration pour les profils très captifs (Alliancy, 2026) |
| Double exploitation | Ancienne et nouvelle plateforme en parallèle | Souvent 12 à 24 mois sur un projet moyen (Alliancy, 2026) |
| Formation et conduite du changement | Montée en compétences, accompagnement | Jours × coût journalier |
| Exploitation de l’alternative | Licences, support, hébergement, équipe | Montant annuel |

Dans le modèle de calcul (§ 3.6) :

- le coût de migration `M` regroupe migration, refonte, formation et conduite du changement ;
- la double exploitation n’est pas un forfait : elle découle du calendrier. L’alternative est payée pendant les `D` derniers mois de la sortie, et l’ancien fournisseur jusqu’à la fin de son engagement.

### 3.5 Les scénarios

| Code | Scénario | Principe |
|---|---|---|
| S0 | Rester sous contrainte | On subit la hausse à l’échéance ; irritants et risque inchangés. |
| S1 | Renégocier avec une alternative prouvée | Préparation payée ; hausse négociée plus faible ; risque réduit par le plan B. |
| S2 | Réduire ou hybrider | Une partie du périmètre migre (part `p`) ; le reste est renégocié. |
| S3 | Sortir | Préparation et migration payées ; fournisseur payé pendant le délai de sortie, puis alternative. |

### 3.6 Modèle de calcul

Notations, par mois `t` de 0 à `H × 12 − 1` :

- `C0` : coût direct annuel actuel ; `h` : hausse à l’échéance ; `hN` : hausse négociée ; `mE` : mois avant l’échéance ;
- `I` : coûts opérationnels annuels ; `K` : coût de risque annuel ; `ρ` : réduction du risque avec un plan B (0,8) ; `ι` : réduction des irritants après sortie (0,5) ;
- `P` : coût de préparation ; `M` : coût de migration ; `T` : délai de sortie en mois ; `A` : coût annuel de l’alternative ;
- `D` : durée de double exploitation en mois, `D ≤ T` (6 par défaut) ; `R` : durée minimale de réengagement en mois si l’on doit re-signer avant d’être sorti (6 par défaut) ;
- `g` : indexation annuelle du contrat (0 par défaut) ; `r` : taux d’actualisation annuel (0 par défaut).

```
contrat(t, hausse) = C0 × (1 + g)^⌊t/12⌋ / 12                si t < mE
                   = C0 × (1 + g)^⌊t/12⌋ × (1 + hausse) / 12  sinon

fin d’engagement F = T                      si T ≤ mE
                   = max(T, mE + R)         sinon (verrou actif : on re-signe)

S0 : Σ [ contrat(t, h) + I/12 + K/12 ]

S1 : P + Σ [ contrat(t, hN) + I/12 + (1 − ρ) × K/12 ]

S3 : P + Σ_{t < T}  [ contrat(t, h) + M/T + I/12 + K/12 + 𝟙(t ≥ T − D) × A/12 ]
       + Σ_{t ≥ T}  [ A/12 + (1 − ι) × I/12 + (1 − ρ) × K/12 + 𝟙(t < F) × contrat(t, h) ]

S2 : p × S3 + (1 − p) × S1   (approximation ; détailler par vague si besoin)
```

Avec actualisation, chaque terme du mois `t` est multiplié par `1 / (1 + r)^(t/12)`. Les coûts de préparation `P` sont comptés au mois 0.

Simplifications assumées : le coût de l’alternative `A` et les coûts `I` et `K` ne sont pas indexés ; la migration `M` est répartie uniformément sur le délai de sortie ; en cas de réengagement, la hausse appliquée est la hausse à l’échéance `h`.

### 3.7 Indicateurs dérivés

| Indicateur | Formule |
|---|---|
| Gain du meilleur scénario | TCD(S0) − min(TCD des autres scénarios) |
| Délai de retour | Premier mois où le cumul du scénario devient inférieur au cumul de S0 |
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
| Délai de sortie (`T`) | mois | Pour S3 | Estimation, puis mesure du pilote |
| Coût annuel de l’alternative (`A`) | € HT | Pour S2 et S3 | Offres comparées |
| Part migrée (`p`) | % | Pour S2 | Périmètre retenu |
| Durée de double exploitation (`D`) | mois | Pour S2 et S3 (6 par défaut) | Plan de migration |
| Durée minimale de réengagement (`R`) | mois | Si verrou actif (6 par défaut) | Proposition du fournisseur |
| Indexation annuelle (`g`) | % | Non (0 par défaut) | Contrat |
| Taux d’actualisation (`r`) | % | Non (0 par défaut) | Direction financière |

### 3.9 Exemple de calcul

Une plateforme de virtualisation : `C0` = 2 M€, `h` = 60 %, `mE` = 14 mois, `I` = 150 k€, `K` = 290 k€, `hN` = 15 %, `P` = 105 k€, `M` = 800 k€, `T` = 18 mois, `A` = 1,2 M€, `D` = 6 mois, `R` = 6 mois, sans indexation ni actualisation, horizon 5 ans.

| Scénario | TCD sur 5 ans |
|---|---|
| S0 — Rester sous contrainte | 16,8 M€ |
| S1 — Renégocier avec une alternative prouvée | 12,3 M€ |
| S3 — Sortir | 10,8 M€ |

Verrou actif : 18 mois de sortie pour 14 mois avant l’échéance. Il faut donc re-signer au mois 14 pour 6 mois au moins, et l’ancien fournisseur est payé jusqu’au mois 20.

Gain du meilleur scénario : 6,0 M€. Délai de retour de la sortie : 29 mois. Ratio coût de sortie / coût annuel : (0,105 + 0,8 + 0,6) ÷ 2 = 0,75.

### 3.10 Restitution

- une courbe des coûts cumulés par scénario, avec le repère de l’échéance ;
- des barres comparant le TCD de chaque scénario, le meilleur en vert ;
- le détail par composante et par année ;
- la liste des hypothèses, toujours visible.

---

## 4. L’indice de réversibilité

### 4.1 Définition

> **Indice = somme des notes ÷ (nombre d’axes × 5) × 100**, arrondi à l’entier.

Il mesure, par fournisseur critique, la capacité prouvée à en changer.

### 4.2 Les axes (version 0.2)

La version 0.1 comptait sept axes. La version 0.2 en propose **neuf**, regroupés en quatre familles, pour deux raisons : les compétences, auparavant optionnelles, deviennent un axe à part entière ; le contrat et le cadre juridique sont séparés, comme dans le guide d’Alliancy.

| Famille | Axe | Question posée |
|---|---|---|
| Technique | Interopérabilité | Les échanges reposent-ils sur des standards ouverts ? |
| Technique | Portabilité des données | Peut-on extraire les données dans un format réutilisable, à un coût connu ? |
| Technique | Exclusivité fonctionnelle | Utilise-t-on des fonctions propriétaires sans équivalent standard ? |
| Technique | Écosystème | Le fournisseur impose-t-il ses outils annexes et ses intégrations ? |
| Marché | Alternatives fonctionnelles | Existe-t-il des alternatives matures, et ont-elles été évaluées ? |
| Marché | Maîtrise des coûts | Les coûts, y compris de sortie, sont-ils connus et prévisibles ? |
| Droit | Contrats | Durée, préavis, clauses de réversibilité, d’assistance à la sortie et d’audit |
| Droit | Cadre juridique et réglementaire | Droit applicable, exposition extraterritoriale, conformité (DORA, NIS 2, Data Act) |
| Humain | Compétences | Les équipes savent-elles opérer une alternative ? |

### 4.3 L’échelle et la preuve

| Note | Niveau | Preuve attendue |
|---|---|---|
| 0 | Verrouillé : aucune sortie envisageable aujourd’hui | — |
| 1 | Possible en théorie, rien de documenté | Une déclaration |
| 3 | Possible avec un effort identifié et chiffré | Une étude, un chiffrage, une clause signée |
| 5 | Maîtrisé : testé ou démontré | Un test de bascule, une extraction réalisée, un pilote |

Seules les notes 0, 1, 3 et 5 sont admises. L’échelle est volontairement non linéaire : passer de 1 à 3, puis de 3 à 5, récompense la preuve plutôt que l’intention.

### 4.4 Les niveaux par axe

| Axe | 0 | 1 | 3 | 5 |
|---|---|---|---|---|
| Interopérabilité | Formats et API propriétaires uniquement | Des standards existent, non utilisés | Standards utilisés sur l’essentiel, écarts identifiés | Échanges standards, testés avec une autre solution |
| Portabilité des données | Aucune extraction possible | Extraction annoncée, jamais faite | Extraction chiffrée en délai et en coût | Extraction complète réalisée et rechargée ailleurs |
| Exclusivité fonctionnelle | Fortement dépendant de fonctions exclusives | Usages propriétaires non recensés | Usages recensés, écarts chiffrés | Usages recensés et couverts par l’alternative |
| Écosystème | Écosystème entièrement imposé | Dépendances annexes connues, non traitées | Outils annexes recensés, alternatives identifiées | Outils annexes remplaçables, remplacement testé |
| Alternatives fonctionnelles | Aucune alternative connue | Alternatives citées, non évaluées | Alternatives comparées et chiffrées | Alternative éprouvée en pilote sur un périmètre réel |
| Maîtrise des coûts | Coûts imprévisibles, hausses subies | Coûts actuels connus, sortie inconnue | Coût total et coût de sortie estimés | Coût total et coût de sortie mesurés, trajectoire suivie |
| Contrats | Engagement long, aucune clause de sortie | Clauses génériques, non vérifiées | Clauses de réversibilité, préavis et audit négociés | Clauses de sortie négociées et exercées lors d’un test |
| Cadre juridique et réglementaire | Exposition non évaluée | Exposition connue, non traitée | Exposition évaluée, mesures définies (chiffrement, clauses) | Exposition maîtrisée et vérifiée (clés maîtrisées, offre qualifiée, clauses de type Oméga) |
| Compétences | Aucune compétence sur une alternative | Quelques personnes sensibilisées | Plan de montée en compétences chiffré | Équipes formées et ayant opéré l’alternative |

### 4.5 Règles de calcul

1. **Règle d’or :** tant qu’aucun axe n’atteint 5, l’indice est **plafonné à 69**. Pas de voie libre sans preuve.
2. **Validité de la preuve :** une note de 5 fondée sur un test de plus de 12 mois redescend à 3 jusqu’au test suivant.
3. **Axe non évalué :** il est noté 0 et signalé comme tel ; l’indice est marqué « provisoire » si plus de deux axes ne sont pas évalués.
4. **Pondération :** aucune par défaut. Une pondération par famille peut être définie pour un client, à condition d’être affichée à côté de l’indice.

### 4.6 Les zones

| Indice | Zone | Lecture |
|---|---|---|
| 0 à 39 | Verrouillé | Les prochains renouvellements se décideront surtout du côté du fournisseur. |
| 40 à 69 | Sous contrainte | La liberté dépend encore du calendrier du fournisseur. |
| 70 à 100 | Voie libre | Le choix est réel ; il reste à l’entretenir. |

### 4.7 Indicateurs associés

| Indicateur | Définition | Usage |
|---|---|---|
| Marge de manœuvre | Mois avant l’échéance − délai de sortie | Négative : verrou actif |
| Criticité métier | Note de 1 à 5, impact d’un arrêt sur l’activité | Croisée avec l’indice dans une matrice |
| Priorité absolue | Criticité ≥ 4 et indice < 40 | Fournisseurs à traiter en premier |

### 4.8 Exemple de calcul

La même plateforme de virtualisation, notée sur les neuf axes :

| Axe | Note | Preuve |
|---|---|---|
| Interopérabilité | 1 | — |
| Portabilité des données | 3 | Estimation interne d’extraction |
| Exclusivité fonctionnelle | 1 | — |
| Écosystème | 1 | — |
| Alternatives fonctionnelles | 3 | Comparatif de deux solutions, chiffré |
| Maîtrise des coûts | 1 | — |
| Contrats | 1 | — |
| Cadre juridique et réglementaire | 3 | Analyse d’exposition réalisée |
| Compétences | 1 | — |

Somme : 15 sur 45, soit un **indice de 33 sur 100 : verrouillé**. Marge de manœuvre : 14 − 18 = **−4 mois, verrou actif**. Criticité 5 : **priorité absolue**.

### 4.9 Entretien de la réversibilité

| Action | Fréquence | Déclencheur d’alerte |
|---|---|---|
| Revue de l’indice | Trimestrielle | Pas de revue depuis plus de 92 jours |
| Test de bascule | Annuelle pour les criticités ≥ 4 | Pas de test depuis plus de 12 mois |
| Revue de réversibilité des nouveaux contrats critiques | À chaque signature | Portabilité < 3 ou contrats < 3 |
| Suivi de la marge de manœuvre | Mensuelle à 24 mois de l’échéance | Marge négative, ou inférieure à 3 mois |

---

## 5. Articulation entre les deux indicateurs

- **L’indice éclaire le choix du scénario :** un indice bas sur les alternatives ou les compétences rend la sortie plus longue et plus coûteuse dans le TCD.
- **La preuve fait progresser les deux :** un pilote fait passer plusieurs axes à 5, réduit l’incertitude sur le délai de sortie et sur le coût de migration, et active la réduction du coût de risque.
- **La marge de manœuvre relie les deux :** elle utilise le délai de sortie, mesuré pour l’indice, et l’échéance, utilisée par le TCD.

---

## 6. Correspondances

### 6.1 Avec le guide d’Alliancy (2026)

| Alliancy | Optio |
|---|---|
| Six dimensions : technologique, commerciale, contractuelle, données, juridique et réglementaire, compétences | Neuf axes en quatre familles (§ 4.2) |
| Notation de 1 (faible adhérence) à 5 (captivité totale) | Notation inverse : 0 (verrouillé) à 5 (maîtrisé) |
| Profils agile, contraint, captif | Zones voie libre, sous contrainte, verrouillé |
| Coût du statu quo en quatre dimensions | TCD en trois composantes chiffrées et deux dimensions qualitatives (§ 3.2 et 3.3) |

### 6.2 Avec DORA

Les éléments de l’indice alimentent le registre d’informations sur les prestataires : substituabilité (axes alternatives et portabilité), possibilité de réintégration (compétences), existence d’un plan de sortie testé (règle de validité de la preuve).

---

## 7. Gouvernance du référentiel

- **Versions :** numérotées (0.1, 0.2…), avec un journal des changements ; un indice est toujours publié avec la version utilisée.
- **Licence proposée :** Creative Commons BY-SA 4.0, pour un référentiel partagé et réutilisable.
- **Contributions :** retours de missions, d’entretiens avec des DSI et de l’écosystème (associations professionnelles, éditeurs, utilisateurs).

### Journal des changements

| Version | Date | Changements |
|---|---|---|
| 0.1 | Octobre 2026 | Sept axes, échelle 0-1-3-5, règle d’or, TCD en trois composantes et quatre scénarios |
| 0.2 | Novembre 2026 | Neuf axes en quatre familles (compétences en axe standard, contrat et cadre juridique séparés) ; validité de la preuve à 12 mois ; dimensions qualitatives du TCD ; repères de coûts de changement ; scénario S2 « réduire ou hybrider » ; double exploitation, réengagement en cas de verrou actif, indexation et actualisation intégrés au modèle de calcul |

---

## Annexe — Modèle de données (JSON)

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
    "cout_direct_annuel": 2000000,
    "hausse_echeance": 0.60,
    "couts_operationnels_annuels": 150000,
    "cout_risque_annuel": 290000,
    "hausse_negociee": 0.15,
    "cout_preparation": 105000,
    "cout_migration": 800000,
    "cout_annuel_alternative": 1200000,
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
      "alternatives": { "description": "Comparatif de deux solutions, chiffré", "date": "2026-10-20" },
      "juridique": { "description": "Analyse d’exposition réalisée", "date": "2026-11-02" }
    },
    "plan_sortie_teste": false,
    "date_dernier_test": null,
    "date_derniere_revue": "2026-11-15"
  }
}
```