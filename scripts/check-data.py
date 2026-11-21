#!/usr/bin/env python3
"""Contrôle des données du radar et des marqueurs [À COMPLÉTER] restants dans index.html.
Usage : python3 scripts/check-data.py [--placeholders]   (code de sortie 1 si erreur)"""
import json, re, sys, collections
L = lambda n: json.load(open(f"data/{n}.json", encoding="utf-8"))
T, X, M, V = L("tendances"), L("technologies"), L("mecanismes"), L("leviers")
err = []
def need(cond, msg):
    if not cond: err.append(msg)

# Contrat de structure : champ -> (type, minimum d'éléments pour une liste)
STR, INT, LST = str, int, list
CONTRAT = {
    "tendances": (T, {"id": STR, "titre": STR, "quadrant": INT, "anneau": INT, "declencheur": STR, "tendance": STR, "risque": STR, "mitigations": (LST, 1), "sources": (LST, 1), "technologies": LST}),
    "technologies": (X, {"id": STR, "nom": STR, "editeur": STR, "quadrant": INT, "anneau": INT, "type": STR, "categories": (LST, 1), "dependance": STR, "alternatives": LST, "site": None, "pourquoi": STR, "sources": LST}),
    "mecanismes": (M, {"id": STR, "nom": STR, "court": STR, "symbole": STR, "couche": INT, "moment": INT, "fonctionnement": STR, "exemple": STR, "signal": STR, "leviers": (LST, 1), "sources": LST}),
    "leviers": (V, {"id": STR, "titre": STR, "axe": INT, "principe": STR, "mise_en_oeuvre": (LST, 1), "verification": STR, "limites": STR, "lies": LST, "sources": (LST, 1), "technologies": LST}),
}
for nom, (d, champs) in CONTRAT.items():
    for i, e in enumerate(d):
        for c, t in champs.items():
            nom_e = e.get("titre") or e.get("nom") or i
            if t is None: need(c in e and e[c], f"{nom} « {nom_e} » : champ « {c} » manquant"); continue
            typ, mini = t if isinstance(t, tuple) else (t, 0)
            v = e.get(c)
            ok = isinstance(v, typ) and not isinstance(v, bool) and (len(v.strip()) > 0 if typ is STR else len(v) >= mini if typ is LST else True)
            need(ok, f"{nom} « {nom_e} » : champ « {c} » absent, vide ou mal typé")
        inconnus = set(e) - set(champs) - ({"depot", "verifie", "criteres"} if nom == "technologies" else {"contexte"} if nom == "leviers" else set())
        need(not inconnus, f"{nom} « {e.get('titre') or e.get('nom')} » : champs inconnus {sorted(inconnus)}")
for e in T:
    need(e["quadrant"] in range(5) and e["anneau"] in range(4) , f"tendance « {e['titre']} » : axe, urgence ou type invalide")
    for s in e["sources"]:
        need(s.get("titre"), f"« {e['titre']} » : source sans titre")
        need(not s.get("url") or s["url"].startswith("https://"), f"« {e['titre']} » : URL non https {s.get('url')}")
for e in X:
    need(e["quadrant"] in range(4) and e["anneau"] in range(4) and e["type"] in ("p", "e", "o"), f"technologie « {e['nom']} » : axe, anneau ou type invalide")
cell = collections.Counter((e["couche"], e["moment"]) for e in M)
for k, n in cell.items(): need(n <= 3, f"mécanismes : plus de 3 dans la case couche {k[0]} / moment {k[1]} ({n})")
need(len({e["symbole"] for e in M}) == len(M) and all(len(e["symbole"]) == 2 for e in M), "mécanismes : symboles non uniques ou différents de 2 lettres")
for e in M: need(e["couche"] in range(7) and e["moment"] in range(4), f"mécanisme « {e['nom']} » : couche ou moment invalide")

ids = collections.Counter(e["id"] for e in T + X + V + M)
for i, n in ids.items(): need(n == 1 and re.fullmatch(r"[a-z0-9][a-z0-9-]*", i) and i not in ("tendances", "technologies", "mecanismes"), f"identifiant invalide ou en double : {i}")
for nom, d, k in [("tendances", T, "titre"), ("technologies", X, "nom"), ("mecanismes", M, "nom"), ("leviers", V, "titre")]:
    for a, n in collections.Counter(e[k].strip().lower() for e in d).items(): need(n == 1, f"{nom} : doublon « {a} »")
vid = {e["id"] for e in V}
for m in M:
    need(m.get("leviers"), f"mécanisme « {m['nom']} » : aucun levier")
    for k in m.get("leviers", []):
        need(k["id"] in vid, f"mécanisme « {m['nom']} » : levier « {k['id']} » absent de leviers.json")
        need(isinstance(k.get("commentaire"), str) and k["commentaire"].strip(), f"mécanisme « {m['nom']} » : lien vers « {k['id']} » sans commentaire")
    need(len({k["id"] for k in m.get("leviers", [])}) == len(m.get("leviers", [])), f"mécanisme « {m['nom']} » : levier en double")
for e in V:
    need(e["axe"] in range(5), f"levier « {e['titre']} » : axe invalide")
    need(e.get("mise_en_oeuvre") and e.get("sources"), f"levier « {e['titre']} » : mise en œuvre ou source manquante")
    for s_ in e["sources"]:
        need(s_.get("titre") and (not s_.get("url") or s_["url"].startswith("https://")), f"levier « {e['titre']} » : source invalide")
    for i in e.get("lies", []): need(i in vid and i != e["id"], f"levier « {e['titre']} » : lien « {i} » invalide")
    for t in e.get("technologies", []): need(t in {x["nom"] for x in X}, f"levier « {e['titre']} » : technologie « {t} » introuvable")
noms = {e["nom"] for e in X}
import datetime
for e in X:
    v = e.get("verifie")
    if v is not None: need(isinstance(v, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", v) and datetime.date.fromisoformat(v) <= datetime.date.today(), f"{e['nom']} : « verifie » doit être une date AAAA-MM-JJ non future")
for e in T:
    for t in e.get("technologies", []): need(t in noms, f"tendance « {e['titre']} » : technologie « {t} » introuvable")
norm = lambda s: re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()
def cible(e, a):
    n = norm(a); ex = [y for y in X if y is not e and norm(y["nom"]) == n]
    if ex: return ex[0]
    c = [y for y in X if y is not e and norm(y["nom"]) and (norm(y["nom"]) in n or n in norm(y["nom"]))]
    return c[0] if len(c) == 1 else (None if len(c) == 0 else False)
avert = []
groupes = lambda e: {c.split(" > ")[0] for c in e["categories"]}
lignes = lambda e: set(e["categories"])
for e in X:
    need(isinstance(e.get("categories"), list) and e["categories"], f"technologie « {e['nom']} » : categories manquantes")
    for a in e["alternatives"]:
        if a == "—": continue
        y = cible(e, a)
        if y is False: err.append(f"technologie « {e['nom']} » : alternative « {a} » ambiguë"); continue
        if y is None: err.append(f"« {e['nom']} » : l’alternative « {a} » n’est pas une entrée du radar"); continue
        need(groupes(e) & groupes(y), f"« {e['nom']} » ({e['categories'][0]}) → « {y['nom']} » ({y['categories'][0]}) : catégories différentes")
        need(y["anneau"] >= e["anneau"], f"« {e['nom']} » → « {y['nom']} » : alternative dans un anneau moins bon")
        if y["anneau"] == e["anneau"]:
            need(any(cible(y, b) is e for b in y["alternatives"] if b != "—"), f"« {e['nom']} » ↔ « {y['nom']} » : anneau égal, mais la relation n’est pas réciproque")
# Avertissements (non bloquants) : pairs de même catégorie non reliées
for e in X:
    liens = {id(cible(e, a)) for a in e["alternatives"] if a != "—"}
    for y in X:
        if y is e or not (lignes(e) & lignes(y)): continue
        if y["anneau"] >= e["anneau"] and id(y) not in liens: avert.append(f"{e['nom']} -> {y['nom']}")
txt = json.dumps([T, X, M, V], ensure_ascii=False)
need(not re.search(r"\d [%€]", txt), "espace simple avant % ou € (utiliser une espace insécable)")
need("'" not in txt, "apostrophe droite dans les données (utiliser ’)")

if "--placeholders" in sys.argv:
    for f in ("index.html",):
        for n, l in enumerate(open(f, encoding="utf-8"), 1):
            for m in re.findall(r"\[[A-ZÉÈÀ][A-ZÉÈÀ ’']{2,}\]", l): err.append(f"{f}:{n} marqueur à compléter {m}")

# Avertissements de complétude : sources et longueurs
sans_src = lambda d, k: [e.get(k) for e in d if not e.get("sources")]
LONG = [("tendances", T, "tendance", 900), ("technologies", X, "dependance", 300), ("mecanismes", M, "exemple", 450), ("leviers", V, "principe", 500)]
if "--warn" in sys.argv:
    print("AVERTISSEMENTS (%d) :\n" % len(avert) + "\n".join(avert))
    print(f"\nSans source : technologies {len(sans_src(X, 'nom'))}/{len(X)}, mécanismes {len(sans_src(M, 'nom'))}/{len(M)}")
    print("Levers sans source externe (URL) :", sum(1 for e in V if not any(x.get("url") for x in e["sources"])), "/", len(V))
    print("Mécanismes sans année dans l'exemple :", sum(1 for e in M if not re.search(r"(19|20)\d\d", e["exemple"])), "/", len(M))
    for n, d, k, m in LONG:
        for e in d:
            if len(e[k]) > m: print(f"Long : {n} « {e.get('titre') or e.get('nom')} » ({k} : {len(e[k])} car.)")
print("\n".join(err) if err else f"OK : {len(T)} tendances, {len(X)} technologies, {len(M)} mécanismes, {len(V)} leviers")
sys.exit(1 if err else 0)
