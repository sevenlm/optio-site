#!/usr/bin/env python3
"""Recalcule les quatre cas chiffrés de index.html à partir de leurs hypothèses (M€ sur 60 mois) et vérifie
que la page affiche les mêmes montants. Usage : python3 scripts/check-cases.py   (code 1 si écart)"""
import re, sys
f = lambda x: f"{x:.1f}".replace(".", ",")
def croissance(base, taux, n=5): return sum(base * (1 + taux) ** k for k in range(n))
C = {}
def tcd_spec(C0, h, hN, mE, I, K, P, M, T, A, D=6, R=6, rho=0.8, iota=0.5, H=5):
    """Modèle de calcul de la spec TCD (§ 3.6), mois par mois, sans indexation ni actualisation. Montants en M€."""
    contrat = lambda t, hausse: C0 * (1 + hausse if t >= mE else 1) / 12
    F = T if T <= mE else max(T, mE + R)
    mois = range(H * 12)
    rester = sum(contrat(t, h) + I / 12 + K / 12 for t in mois)
    renegocier = P + sum(contrat(t, hN) + I / 12 + (1 - rho) * K / 12 for t in mois)
    sortir = P + sum(contrat(t, h) + M / T + I / 12 + K / 12 + (A / 12 if t >= T - D else 0) if t < T
                     else A / 12 + (1 - iota) * I / 12 + (1 - rho) * K / 12 + (contrat(t, h) if t < F else 0) for t in mois)
    return dict(rester=rester, renegocier=renegocier, sortir=sortir)


def retour_et_ratio(C0, h, hN, mE, I, K, P, M, T, A, D=6, R=6, rho=0.8, iota=0.5, H=5):
    """Délai de retour de la sortie (premier mois où le cumul passe sous celui du statu quo) et ratio (P + M + D × A/12) ÷ C0."""
    contrat = lambda t, hausse: C0 * (1 + hausse if t >= mE else 1) / 12
    F = T if T <= mE else max(T, mE + R)
    cs = c0 = 0
    for t in range(H * 12):
        c0 += contrat(t, h) + I / 12 + K / 12
        cs += (P if t == 0 else 0) + (contrat(t, h) + M / T + I / 12 + K / 12 + (A / 12 if t >= T - D else 0) if t < T
              else A / 12 + (1 - iota) * I / 12 + (1 - rho) * K / 12 + (contrat(t, h) if t < F else 0))
        if cs < c0: return t + 1, (P + M + D * A / 12) / C0
    return None, (P + M + D * A / 12) / C0
# Cas 1 : 600 k€/an, +60 % à l'échéance (mois 14), 18 mois pour partir ; exploitation 45 k€ et risque 87 k€ par an ;
# préparation 60 k€, migration 240 k€, alternative 360 k€/an, double exploitation et réengagement de 6 mois (spec § 3.9)
CAS1 = (0.6, .6, .15, 14, 0.045, 0.087, 0.06, 0.24, 18, 0.36)
C[1] = tcd_spec(*CAS1)
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
    err = [f"Cas {k} : {a} = {f(b)} M€ absent de index.html" for k, v in C.items() for a, b in v.items() if f"{f(b)}\u202fM€" not in txt and f"{f(b)} M€" not in txt]
    gains = {1: C[1]["rester"] - C[1]["sortir"], 2: C[2]["cloud"] - C[2]["alternative"], 3: C[3]["rester"] - C[3]["migrer"], 4: C[4]["rester"] - C[4]["partielle"]}
    err += [f"Cas {k} : gain {f(g)} M€ absent de index.html" for k, g in gains.items() if not re.search(f(g) + r"[\u202f ]M€ économisés", txt)]
    # le même cas sert d’exemple à la spec (§ 3.9)
    spec = open("docs/spec-tcd-et-indice-reversibilite.md", encoding="utf-8").read()
    mois, ratio = retour_et_ratio(*CAS1)
    attendus = [f"| S0, rester sous contrainte | {f(C[1]['rester'])} M€ |", f"| S1, renégocier avec une alternative prouvée | {f(C[1]['renegocier'])} M€ |",
                f"| S3, sortir | {f(C[1]['sortir'])} M€ |", f"gagner {f(gains[1])} M€", f"au bout de {mois} mois", f"soit {f(ratio).rstrip('0').rstrip(',')}."]
    err += [f"Spec § 3.9 : « {a} » absent" for a in attendus if a not in spec]
    print("\n".join(err) if err else "OK : montants des cas cohérents avec la page et la spec"); sys.exit(1 if err else 0)
