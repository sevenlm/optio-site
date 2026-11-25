// Rapport personnalisé : chapitre « Leviers possibles ».
// Prérequis : python3 -m http.server 8765 à la racine du dépôt (voir outils.mjs).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { BASE, erreurs, adresseRapport } from "./outils.mjs";

const cfg = "window.OPTIO_CONFIG = {tallyFormId:\"\", calLien:\"https://cal.example.test/optio/15min\", urlSite:\"http://localhost:8765/radar.html\"};";
const COMPLET = adresseRapport("t=fin-des-licences-perpetuelles&x=vmware-vsphere-et-vcf,openstack&d=2026-11-23");
const TECHNOS_SEULES = adresseRapport("x=vmware-vsphere-et-vcf&d=2026-11-23");

let navigateur;
before(async () => { navigateur = await chromium.launch({ channel: "chrome" }); });
after(async () => { await navigateur.close(); });

async function rapport(chemin, options = {}) {
  const contexte = await navigateur.newContext(options);
  const p = await contexte.newPage();
  const errs = erreurs(p);
  await p.route("**/js/config.js", (r) => r.fulfill({ contentType: "text/javascript", body: cfg }));
  await p.goto(BASE + chemin);
  await p.waitForSelector("#rapport[data-etat]");
  return { p, errs, fermer: () => contexte.close() };
}

const ids = (p) => p.$$eval("#rapport .rapport-chap", (l) => l.map((s) => s.id));

// Leviers attendus, calculés dans la page à partir des données brutes :
// leviers des tendances retenues, parades des mécanismes probables, leviers citant une technologie retenue.
// Renvoie [{id, titre, rep:[noms]}] : les deux leviers de mesure, puis les autres triés par nombre d’éléments (décroissant) puis titre.
function attendus(p, tendIds, techIds) {
  return p.evaluate(async ([tendIds, techIds]) => {
    const lire = (n) => fetch("data/" + n + ".json").then((x) => x.json());
    const [tend, tech, meca, lev] = await Promise.all(["tendances", "technologies", "mecanismes", "leviers"].map(lire));
    const parLev = new Map(lev.map((l) => [l.id, l]));
    const rep = new Map();
    // un élément = un type et un nom (un mécanisme peut porter le nom d’une tendance)
    const ajouter = (id, nom, type) => {
      if (!parLev.has(id)) return;
      if (!rep.has(id)) rep.set(id, []);
      if (!rep.get(id).some((r) => r.nom === nom && r.type === type)) rep.get(id).push({ nom, type });
    };
    const tends = tend.filter((t) => tendIds.includes(t.id));
    const mecIds = [...new Set(tends.flatMap((t) => t.mecanismes || []))];
    for (const t of tends) for (const a of t.leviers || []) ajouter(a.id, t.titre, "t");
    for (const m of meca.filter((m) => mecIds.includes(m.id))) for (const a of m.leviers || []) ajouter(a.id, m.nom, "m");
    for (const x of tech.filter((x) => techIds.includes(x.id))) for (const l of lev) if ((l.technologies || []).includes(x.nom)) ajouter(l.id, x.nom, "x");
    // « Mesurer avant de décider » : coût total de la dépendance puis indice de réversibilité, toujours en tête
    const MESURES = ["cout-total-de-la-dependance", "indice-de-reversibilite-fonde-sur-la-preuve"];
    const fiche = (id) => ({ id, titre: parLev.get(id).titre, rep: (rep.get(id) || []).map((r) => r.nom) });
    const autres = [...rep.keys()].filter((id) => !MESURES.includes(id)).map(fiche)
      .sort((a, b) => b.rep.length - a.rep.length || a.titre.localeCompare(b.titre, "fr"));
    return MESURES.map(fiche).concat(autres);
  }, [tendIds, techIds]);
}

test("sélection complète : chapitre, cartes, tri et contenu", async () => {
  const { p, errs, fermer } = await rapport(COMPLET);
  try {
    assert.deepEqual(await ids(p), ["ch-synthese", "ch-technologies", "ch-tendances", "ch-mecanismes", "ch-leviers", "ch-sources", "ch-rdv"]);
    assert.equal((await p.locator("#ch-leviers > h2").innerText()).trim(), "Leviers possibles");
    const att = await attendus(p, ["fin-des-licences-perpetuelles"], ["vmware-vsphere-et-vcf", "openstack"]);
    assert.ok(att.length > 0);
    const cartes = p.locator("#ch-leviers .rapport-carte.rapport-levier");
    assert.equal(await cartes.count(), att.length);
    assert.deepEqual(await cartes.evaluateAll((l) => l.map((c) => c.id)), att.map((a) => "levier-" + a.id));
    assert.deepEqual(await cartes.evaluateAll((l) => l.map((c) => c.querySelector("h3").textContent)), att.map((a) => a.titre));

    // Contenu d’une carte : principe, mise en œuvre, vérification, limites, « Répond à »
    const lev = await p.evaluate(() => fetch("data/leviers.json").then((x) => x.json()));
    const a0 = att[0], l0 = lev.find((l) => l.id === a0.id);
    const c0 = p.locator("#levier-" + a0.id);
    const texte = await c0.innerText();
    for (const s of [l0.principe, l0.verification, l0.limites, ...l0.mise_en_oeuvre]) assert.ok(texte.includes(s), "absent : " + s);
    const h4 = await c0.locator("h4").allInnerTexts();
    for (const h of ["Répond à", "Principe", "Mise en œuvre", "Comment vérifier", "Limites"]) assert.ok(h4.map((x) => x.trim()).includes(h), "section absente : " + h);
    const rep = await c0.locator(".rapport-repond li strong").allInnerTexts();
    assert.deepEqual(rep.map((x) => x.trim()).sort(), [...a0.rep].sort());
    assert.ok(await c0.locator(".rapport-meta").first().innerText().then((t) => /Axe/.test(t)));
    // Un levier rattaché à VMware répond à la technologie
    const alt = p.locator("#levier-alternatives-de-virtualisation-matures");
    assert.equal(await alt.count(), 1);
    assert.ok((await alt.locator(".rapport-repond").innerText()).includes("VMware vSphere et VCF"));
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("technologies seules : leviers rattachés aux technologies", async () => {
  const { p, errs, fermer } = await rapport(TECHNOS_SEULES);
  try {
    assert.deepEqual(await ids(p), ["ch-synthese", "ch-technologies", "ch-leviers", "ch-sources", "ch-rdv"]);
    assert.match(await p.$eval("#ch-leviers > h2", (h) => getComputedStyle(h, "::before").content), /3/);
    const att = await attendus(p, [], ["vmware-vsphere-et-vcf"]);
    assert.equal(await p.locator("#ch-leviers .rapport-levier").count(), att.length);
    assert.equal(await p.locator("#levier-alternatives-de-virtualisation-matures").count(), 1);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("technologie sans levier propre : seuls les deux leviers de mesure", async (t) => {
  const { p: p0, fermer: f0 } = await rapport(TECHNOS_SEULES);
  const sans = await p0.evaluate(async () => {
    const tech = await fetch("data/technologies.json").then((x) => x.json());
    const lev = await fetch("data/leviers.json").then((x) => x.json());
    const cites = new Set(lev.flatMap((l) => l.technologies || []));
    const x = tech.find((x) => !cites.has(x.nom));
    return x ? x.id : null;
  });
  await f0();
  if (!sans) { t.skip("toutes les technologies ont un levier"); return; }
  const { p, errs, fermer } = await rapport(adresseRapport("x=" + sans + "&d=2026-11-23"));
  try {
    assert.deepEqual(await ids(p), ["ch-synthese", "ch-technologies", "ch-leviers", "ch-sources", "ch-rdv"]);
    assert.deepEqual(await p.locator("#ch-leviers .rapport-levier").evaluateAll((l) => l.map((c) => c.id)),
      ["levier-cout-total-de-la-dependance", "levier-indice-de-reversibilite-fonde-sur-la-preuve"]);
    assert.deepEqual((await p.locator("#ch-leviers .rapport-intertitre").allInnerTexts()).map((x) => x.trim()), ["Mesurer avant de décider"]);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("liens vers les cartes, volet et sommaire imprimé", async () => {
  const { p, errs, fermer } = await rapport(COMPLET, { viewport: { width: 1280, height: 900 } });
  try {
    const liens = await p.$$eval(".rapport-tendance li a[href^=\"#levier-\"]", (l) => l.map((a) => a.getAttribute("href")));
    assert.ok(liens.length > 0, "aucun lien de levier sous les tendances");
    for (const h of liens) assert.equal(await p.locator(h).count(), 1, "carte absente : " + h);
    const parades = await p.$$eval(".rapport-meca li a[href^=\"#levier-\"]", (l) => l.map((a) => a.getAttribute("href")));
    assert.ok(parades.length > 0, "aucun lien dans les parades");
    for (const h of parades) assert.equal(await p.locator(h).count(), 1, "carte absente : " + h);
    const n = await p.locator("#ch-leviers .rapport-levier").count();
    assert.equal(await p.locator(".rapport-nav a[href^=\"#levier-\"]").count(), n);
    assert.equal(await p.locator(".rapport-nav a[href=\"#ch-leviers\"]").count(), 1);
    await p.emulateMedia({ media: "print" });
    const som = await p.locator("nav.rapport-sommaire").innerText();
    assert.ok(som.includes("Leviers possibles"));
    assert.equal(await p.locator("#ch-leviers").evaluate((s) => getComputedStyle(s).breakBefore), "page");
    const ruptures = await p.$$eval("#ch-leviers .rapport-levier", (l) => l.map((c) => getComputedStyle(c).breakInside));
    assert.ok(ruptures.length && ruptures.every((r) => r === "avoid"), JSON.stringify(ruptures));
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("sources des leviers et mobile 390 px", async () => {
  const { p, errs, fermer } = await rapport(COMPLET, { viewport: { width: 390, height: 844 } });
  try {
    const src = p.locator(".rapport-sources");
    assert.equal(await src.locator("a[href=\"https://xcp-ng.org/blog/2022/04/13/how-bedrock-streaming-migrated-from-vmware-to-xcp-ng/\"]").count(), 1);
    assert.ok((await src.locator("h3").allInnerTexts()).includes("Alternatives de virtualisation matures"));
    const hrefs = await src.locator("a").evaluateAll((l) => l.map((a) => a.getAttribute("href")));
    assert.equal(new Set(hrefs).size, hrefs.length, "source en double");
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= 390), "débordement horizontal");
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("mesurer avant de décider : en tête, avec le résumé de la sélection", async () => {
  const { p, errs, fermer } = await rapport(COMPLET);
  try {
    const cartes = await p.locator("#ch-leviers .rapport-levier").evaluateAll((l) => l.map((c) => c.id));
    assert.deepEqual(cartes.slice(0, 2), ["levier-cout-total-de-la-dependance", "levier-indice-de-reversibilite-fonde-sur-la-preuve"]);
    assert.deepEqual((await p.locator("#ch-leviers .rapport-intertitre").allInnerTexts()).map((x) => x.trim()),
      ["Mesurer avant de décider", "Agir sur vos dépendances"]);
    const resume = (await p.locator("#levier-cout-total-de-la-dependance .repond-selection").innerText()).trim();
    assert.match(resume, /^Votre sélection · 2 technologies retenues, dont 1 en sortie difficile ; 1 tendance retenue, dont 1 urgente : chiffrez sur cinq ans/);
    assert.match(await p.locator("#levier-indice-de-reversibilite-fonde-sur-la-preuve .repond-selection").innerText(), /mesurez, preuves à l’appui/);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});
