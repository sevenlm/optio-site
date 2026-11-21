#!/usr/bin/env python3
"""Recalcule les quatre cas chiffrés de index.html à partir de leurs hypothèses (M€ sur 60 mois) et vérifie
que la page affiche les mêmes montants. Usage : python3 scripts/check-cases.py   (code 1 si écart)"""
import re, sys
f = lambda x: f"{x:.1f}".replace(".", ",")
def croissance(base, taux, n=5): return sum(base * (1 + taux) ** k for k in range(n))
C = {}
# Cas 1 : 2 M€/an, +60 % à l'échéance (mois 14), 18 mois pour partir ; exploitation 0,15 et risque 0,29 par an
ex1 = 5 * (0.15 + 0.29)
rester = 2 * 14 / 12 + 3.2 * 46 / 12 + ex1
C[1] = dict(rester=rester,
            renegocier=2 * 14 / 12 + 2.3 * 46 / 12 + 0.105 + ex1,                          # hausse ramenée à 15 %, preuve 105 k€
            sortir=2 * 14 / 12 + 3.2 * 4 / 12 + 1.2 * 42 / 12 + 0.8 + 0.105 + ex1)        # 18 mois sous contrat, puis alternative
# Cas 2 : échéance imposée à la fin de l'année 2 ; alternative dès l'année 1
ex2 = 5 * (0.06 + 0.02)
C[2] = dict(cloud=0.3 * 2 + 0.42 * 3 + 0.25 + ex2, alternative=0.4 + 0.18 * 5 + ex2)
# Cas 3 : 600 k€/an, +25 % par an ; exploitation 50 k€ et risque 30 k€ par an
ex3 = 5 * (0.05 + 0.03)
C[3] = dict(rester=croissance(0.6, .25) + ex3,
            renegocier=0.15 + croissance(0.6, .10) + ex3,                                  # hausse ramenée à 10 % par an
            migrer=0.35 + croissance(0.25, .15) + ex3)
# Cas 4 : 1,2 M€/an, support +8 % par an ; exploitation 80 k€ et risque 150 k€ par an
ex4 = 5 * (0.08 + 0.15)
rester4 = croissance(1.2, .08) + ex4
C[4] = dict(rester=rester4,
            complete=1.2 + 1.2 * 1.08 + 4.0 + 3 * 0.2 + ex4,                               # 4 M€ sur 2 ans, base de remplacement 200 k€/an dès l'année 3
            partielle=1.2 + sum(0.72 * 1.04 ** k for k in range(4)) + 0.9 + 4 * 0.08 + ex4)  # 40 % migrés pour 900 k€ ; reste à +4 % par an ; 80 k€/an
if __name__ == "__main__":
    for k, v in C.items(): print(k, {a: round(b, 2) for a, b in v.items()})
    txt = open("index.html", encoding="utf-8").read()
    err = [f"Cas {k} : {a} = {f(b)} M€ absent de index.html" for k, v in C.items() for a, b in v.items() if f"{f(b)} M€" not in txt and f"{f(b)} M€" not in txt]
    gains = {1: C[1]["rester"] - C[1]["sortir"], 2: C[2]["cloud"] - C[2]["alternative"], 3: C[3]["rester"] - C[3]["migrer"], 4: C[4]["rester"] - C[4]["partielle"]}
    err += [f"Cas {k} : gain {f(g)} M€ absent de index.html" for k, g in gains.items() if not re.search(f(g) + r"[\u202f ]M€ économisés", txt)]
    print("\n".join(err) if err else "OK : montants des cas cohérents avec la page"); sys.exit(1 if err else 0)
