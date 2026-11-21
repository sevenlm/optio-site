#!/usr/bin/env python3
"""Vitalité des projets : lit le champ optionnel « depot » (« propriétaire/dépôt ») de technologies.json
et interroge l'API GitHub. Échec si le dépôt est archivé, introuvable, ou sans commit depuis plus d'un an.
Usage : python3 scripts/check-vitality.py [--jours N]   (GITHUB_TOKEN facultatif, évite la limite de débit)"""
import json, os, sys, urllib.request, urllib.error
from datetime import datetime, timezone
jours = int(sys.argv[sys.argv.index("--jours") + 1]) if "--jours" in sys.argv else 365
X = json.load(open("data/technologies.json", encoding="utf-8"))
en = {"Accept": "application/vnd.github+json"}
if os.environ.get("GITHUB_TOKEN"): en["Authorization"] = "Bearer " + os.environ["GITHUB_TOKEN"]
def api(chemin):
    try: return json.load(urllib.request.urlopen(urllib.request.Request("https://api.github.com/" + chemin, headers=en), timeout=30))
    except urllib.error.HTTPError as h: return None if h.code == 404 else sys.exit(f"{chemin} : HTTP {h.code}")
err, n = [], 0
for x in X:
    if not x.get("depot"): continue
    n += 1
    r = api("repos/" + x["depot"])
    if r is None: err.append(f"{x['nom']} : dépôt {x['depot']} introuvable"); continue
    age = (datetime.now(timezone.utc) - datetime.fromisoformat(r["pushed_at"].replace("Z", "+00:00"))).days
    rel = api(f"repos/{x['depot']}/releases/latest")
    print(f"{x['nom']:35} dernier commit il y a {age:4d} j, dernière version {rel['tag_name'] if rel else '—'}")
    if r["archived"]: err.append(f"{x['nom']} : dépôt archivé")
    if age > jours: err.append(f"{x['nom']} : aucun commit depuis {age} jours")
print("\n".join(err) if err else f"OK : {n} dépôts vivants")
sys.exit(1 if err else 0)
