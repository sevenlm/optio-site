#!/usr/bin/env python3
"""Contrôle des liens des sources citées dans data/*.json.
Échec (code 1) si un lien est mort (404, 410, domaine introuvable).
Les liens bloqués (401, 403, 429, 999 : protections anti-robot) et les erreurs temporaires (délai, 5xx, TLS)
sont signalés sans faire échouer le contrôle ; `--strict` fait aussi échouer sur les erreurs temporaires.
Usage : python3 scripts/check-links.py [--strict] [--jobs N]"""
import json, socket, sys, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

STRICT = "--strict" in sys.argv
JOBS = int(sys.argv[sys.argv.index("--jobs") + 1]) if "--jobs" in sys.argv else 12
UA = {"User-Agent": "optio-site-linkcheck/1.0"}
BLOQUE = {401, 403, 429, 999}
MORT = {404, 410}
# Sites qui répondent 404 aux clients automatiques alors que la page existe : on les traite comme bloqués
FAUX_404 = ("ftc.gov",)

def liens():
    """url -> liste des entrées qui la citent"""
    res = {}
    for f in ("tendances", "technologies", "mecanismes", "leviers"):
        for e in json.load(open(f"data/{f}.json", encoding="utf-8")):
            nom = e.get("titre") or e.get("nom")
            for s in e.get("sources", []):
                if s.get("url"): res.setdefault(s["url"], []).append(f"{f} : {nom}")
    return res

def requete(url, methode):
    r = urllib.request.Request(url, headers=UA, method=methode)
    with urllib.request.urlopen(r, timeout=20) as rep:
        if methode == "GET": rep.read(1)
        return rep.status

def etat(url):
    """ok | bloque | mort | erreur, avec un détail"""
    dernier = "?"
    for methode in ("HEAD", "GET"):
        try:
            return "ok", str(requete(url, methode))
        except urllib.error.HTTPError as h:
            dernier = f"HTTP {h.code}"
            if h.code in MORT:
                if any(d in url for d in FAUX_404): return "bloque", dernier + " (anti-robot)"
                return "mort", dernier
            if h.code in BLOQUE and methode == "GET": return "bloque", dernier
        except urllib.error.URLError as u:
            if isinstance(u.reason, socket.gaierror): return "mort", "domaine introuvable"
            dernier = str(u.reason)[:80]
        except Exception as e:  # délai, TLS, connexion coupée
            dernier = type(e).__name__
    return ("bloque" if dernier.startswith("HTTP") and int(dernier.split()[1]) in BLOQUE else "erreur"), dernier

def hors_ligne():
    """Sans réseau, tous les domaines seraient « introuvables » : on ne bloque pas un push pour ça."""
    try: socket.gethostbyname("github.com"); return False
    except OSError: return True

def main():
    if hors_ligne():
        print("Pas de réseau : contrôle des liens ignoré.")
        sys.exit(0)
    L = liens()
    print(f"{len(L)} liens à contrôler…")
    with ThreadPoolExecutor(JOBS) as ex: R = dict(zip(L, ex.map(etat, L)))
    groupes = {"ok": [], "bloque": [], "erreur": [], "mort": []}
    for u, (e, d) in R.items(): groupes[e].append((u, d))
    for nom, titre in (("mort", "MORTS"), ("erreur", "Erreurs temporaires"), ("bloque", "Bloqués par le site (non vérifiables)")):
        if groupes[nom]:
            print(f"\n{titre} ({len(groupes[nom])}) :")
            for u, d in sorted(groupes[nom]): print(f"  {d:22} {u}\n{'':25}cité par : {', '.join(L[u][:2])}{' …' if len(L[u]) > 2 else ''}")
    print(f"\nOK : {len(groupes['ok'])} | bloqués : {len(groupes['bloque'])} | erreurs : {len(groupes['erreur'])} | morts : {len(groupes['mort'])}")
    sys.exit(1 if groupes["mort"] or (STRICT and groupes["erreur"]) else 0)

main()
