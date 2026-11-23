// Aperçu libre de l’exposition dans le volet « Mon radar » : chiffres et verrous, sans analyse.
// Prérequis : python3 -m http.server 8765 à la racine du dépôt (voir outils.mjs).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { ouvrir, erreurs } from "./outils.mjs";

const CLE = "optio-radar-selection";
let navigateur;
before(async () => { navigateur = await chromium.launch({ channel: "chrome" }); });
after(async () => { await navigateur.close(); });

// Ouvre le radar avec une sélection enregistrée, puis le volet.
async function volet(selection, options = {}) {
  const contexte = await navigateur.newContext(options);
  const p = await contexte.newPage();
  const errs = erreurs(p);
  await ouvrir(p, "radar.html");
  await p.evaluate(([c, s]) => localStorage.setItem(c, JSON.stringify(s)), [CLE, selection]);
  await p.reload();
  await p.waitForSelector("#stats .stat");
  await p.locator("#mon-radar").click();
  await p.waitForSelector("#volet:not([hidden]) .apercu");
  return { p, errs, fermer: () => contexte.close() };
}

const SEL3 = {
  technologies: ["vmware-vsphere-et-vcf", "tibco", "openstack"], // anneaux 0, 0, 2
  tendances: ["fin-des-licences-perpetuelles", "facturation-de-lia-a-lusage"], // anneaux 0, 2
  date: ""
};

test("aperçu : totaux, anneaux et tendances urgentes", async () => {
  const { p, errs, fermer } = await volet(SEL3);
  try {
    const ap = p.locator(".apercu");
    assert.match(await ap.innerText(), /3 technologies/);
    assert.match(await ap.innerText(), /2 tendances, dont 1 urgente/);
    const nombres = await ap.locator(".barre-anneau .n").allInnerTexts();
    assert.deepEqual(nombres, ["2", "0", "1", "0"]);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("aperçu : au plus 3 mécanismes puis « + N »", async () => {
  const peu = await volet(SEL3);
  try {
    assert.equal(await peu.p.locator(".apercu .meca-nom").count(), 2);
    assert.equal(await peu.p.locator(".apercu .meca-plus").count(), 0);
  } finally { await peu.fermer(); }
  const beaucoup = await volet({ ...SEL3, tendances: [...SEL3.tendances, "ia-integree-doffice-dans-les-suites", "virtualisation-proprietaire"] });
  try {
    assert.equal(await beaucoup.p.locator(".apercu .meca-nom").count(), 3);
    assert.match(await beaucoup.p.locator(".apercu .meca-plus").innerText(), /^\+ \d+$/);
  } finally { await beaucoup.fermer(); }
});

test("aperçu : trois blocs verrouillés sans texte d’analyse, sans montant", async () => {
  const { p, fermer } = await volet(SEL3);
  try {
    const verrous = p.locator(".apercu .verrou");
    assert.equal(await verrous.count(), 3);
    const titres = await verrous.locator(".verrou-titre").allInnerTexts();
    assert.deepEqual(titres.map((t) => t.trim()), ["Alternatives mieux classées", "Leviers et parades", "Détail par technologie"]);
    const donnees = await p.evaluate(async () => {
      const [lev, tech] = await Promise.all(["data/leviers.json", "data/technologies.json"].map((u) => fetch(u).then((r) => r.json())));
      return { leviers: lev.map((l) => l.nom || l.titre).filter(Boolean), technos: tech.map((t) => t.nom) };
    });
    const textesVerrous = (await verrous.allInnerTexts()).join(" ");
    for (const nom of donnees.leviers) assert.ok(!textesVerrous.includes(nom), "levier divulgué : " + nom);
    for (const nom of ["Proxmox VE", "XCP-ng", "Nutanix"]) assert.ok(!textesVerrous.includes(nom), "alternative divulguée : " + nom);
    assert.doesNotMatch(await p.locator(".apercu").innerText(), /[€$]/);
  } finally { await fermer(); }
});

test("sélection vide : invitation à retenir et bouton désactivé", async () => {
  const { p, fermer } = await volet({ tendances: [], technologies: [], date: "" });
  try {
    assert.match(await p.locator(".apercu").innerText(), /retenez/i);
    assert.equal(await p.locator("#demander-rapport").isDisabled(), true);
  } finally { await fermer(); }
});

test("bouton du rapport : actif avec sélection, atteignable au clavier, sans débordement à 390 px", async () => {
  const { p, fermer } = await volet(SEL3, { viewport: { width: 390, height: 800 } });
  try {
    const b = p.locator("#demander-rapport");
    assert.equal(await b.isDisabled(), false);
    assert.match(await b.innerText(), /Recevoir mon rapport complet \(PDF\)/);
    let atteint = false;
    for (let i = 0; i < 40 && !atteint; i++) {
      await p.keyboard.press("Tab");
      atteint = await p.evaluate(() => document.activeElement && document.activeElement.id === "demander-rapport");
    }
    assert.ok(atteint, "le bouton doit être atteignable à la tabulation");
    const larg = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth, document.getElementById("volet").scrollWidth, document.getElementById("volet").clientWidth]);
    assert.ok(larg[0] <= larg[1] && larg[2] <= larg[3], "débordement horizontal " + larg);
  } finally { await fermer(); }
});
