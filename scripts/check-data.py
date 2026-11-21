#!/usr/bin/env python3
"""Contrôle des données du radar et des marqueurs [À COMPLÉTER] restants dans index.html.
Usage : python3 scripts/check-data.py [--placeholders]   (code de sortie 1 si erreur)"""
import json, re, sys, collections
L = lambda n: json.load(open(f"data/{n}.json", encoding="utf-8"))
T, X, M = L("tendances"), L("technologies"), L("mecanismes")
err = []
def need(cond, msg):
    if not cond: err.append(msg)

for nom, d, champs in [("tendances", T, ["titre", "tendance", "risque"]), ("technologies", X, ["nom", "dependance", "pourquoi"]),
                       ("mecanismes", M, ["nom", "court", "symbole", "fonctionnement", "parade"])]:
    for i, e in enumerate(d):
        for c in champs: need(isinstance(e.get(c), str) and e[c].strip(), f"{nom}[{i}] champ « {c} » vide")
for e in T:
    need(e["quadrant"] in range(5) and e["anneau"] in range(4) and e["type"] in ("risque", "levier"), f"tendance « {e['titre']} » : axe, urgence ou type invalide")
    for s in e["sources"]:
        need(s.get("titre"), f"« {e['titre']} » : source sans titre")
        need(not s.get("url") or s["url"].startswith("https://"), f"« {e['titre']} » : URL non https {s.get('url')}")
for e in X:
    need(e["quadrant"] in range(4) and e["anneau"] in range(4) and e["type"] in ("p", "e", "o"), f"technologie « {e['nom']} » : axe, anneau ou type invalide")
for e in M: need(e["couche"] in range(7) and e["moment"] in range(4), f"mécanisme « {e['nom']} » : couche ou moment invalide")

ids = collections.Counter(e["id"] for e in T + X)
for i, n in ids.items(): need(n == 1 and re.fullmatch(r"[a-z0-9][a-z0-9-]*", i) and i not in ("tendances", "technologies", "mecanismes"), f"identifiant invalide ou en double : {i}")
for nom, d, k in [("tendances", T, "titre"), ("technologies", X, "nom"), ("mecanismes", M, "nom")]:
    for a, n in collections.Counter(e[k].strip().lower() for e in d).items(): need(n == 1, f"{nom} : doublon « {a} »")
titres = {e["titre"] for e in T}
for m in M: need(m["levier"] in titres, f"mécanisme « {m['nom']} » : levier « {m['levier']} » absent de tendances.json")
noms = {e["nom"] for e in X}
for e in T:
    for t in e.get("technologies", []): need(t in noms, f"tendance « {e['titre']} » : technologie « {t} » introuvable")
norm = lambda s: re.sub(r"[^a-z0-9]+", " ", s.lower())
for e in X:
    for a in e["alternatives"]:
        if a == "—": continue
        exact = [y for y in X if y is not e and norm(y["nom"]) == norm(a)]
        if not exact:
            c = [y["nom"] for y in X if y is not e and norm(y["nom"]) and (norm(y["nom"]) in norm(a) or norm(a) in norm(y["nom"]))]
            need(len(c) <= 1, f"technologie « {e['nom']} » : alternative « {a} » ambiguë ({', '.join(c)})")
txt = json.dumps([T, X, M], ensure_ascii=False)
need(not re.search(r"\d [%€]", txt), "espace simple avant % ou € (utiliser une espace insécable)")
need("'" not in txt, "apostrophe droite dans les données (utiliser ’)")

if "--placeholders" in sys.argv:
    for f in ("index.html",):
        for n, l in enumerate(open(f, encoding="utf-8"), 1):
            for m in re.findall(r"\[[A-ZÉÈÀ][A-ZÉÈÀ ’']{2,}\]", l): err.append(f"{f}:{n} marqueur à compléter {m}")

print("\n".join(err) if err else f"OK : {len(T)} tendances, {len(X)} technologies, {len(M)} mécanismes")
sys.exit(1 if err else 0)
