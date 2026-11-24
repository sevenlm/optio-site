// Rapport personnalisé : figures de la synthèse (radars de la sélection).
// Prérequis : python3 -m http.server 8765 à la racine du dépôt (voir outils.mjs).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { BASE, erreurs, ouvrir } from "./outils.mjs";

const cfg = "window.OPTIO_CONFIG = {tallyFormId:\"\", calLien:\"https://cal.example.test/optio/15min\", urlSite:\"http://localhost:8765/radar.html\"};";
const COMPLET = "radar.html?rapport=1&t=fin-des-licences-perpetuelles&x=vmware-vsphere-et-vcf,openstack&d=2026-11-23";
const TECHNOS_SEULES = "radar.html?rapport=1&x=vmware-vsphere-et-vcf&d=2026-11-23";

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

// Couleur CSS → valeur rgb calculée, via un élément temporaire
const resoudre = (p, couleur) => p.evaluate((c) => {
  const d = document.createElement("div"); d.style.color = c; document.body.appendChild(d);
  const r = getComputedStyle(d).color; d.remove(); return r;
}, couleur);

test("radars : un point par élément retenu", async () => {
  const { p, errs, fermer } = await rapport(COMPLET);
  try {
    const tech = p.locator("#ch-synthese .rapport-radar[data-vue=\"technologies\"]");
    const tend = p.locator("#ch-synthese .rapport-radar[data-vue=\"tendances\"]");
    assert.equal(await tech.count(), 1);
    assert.equal(await tend.count(), 1);
    assert.equal(await p.locator("figure.rapport-figure.rapport-radar").count(), 2);
    assert.equal(await tech.locator("svg[role=\"img\"]").count(), 1);
    assert.match(await tech.locator("svg[role=\"img\"]").getAttribute("aria-label"), /^Radar des technologies : 2 retenues sur \d+$/);
    assert.match(await tend.locator("svg[role=\"img\"]").getAttribute("aria-label"), /^Radar des tendances : 1 retenue sur \d+$/);
    assert.equal(await tech.locator(".pt-retenu").count(), 2);
    assert.equal(await tend.locator(".pt-retenu").count(), 1);
    assert.equal(await tech.locator("ol.rapport-legende li").count(), 2);
    assert.equal(await tend.locator("ol.rapport-legende li").count(), 1);
    assert.equal(await tech.locator("figcaption").count(), 1);
    // légende dans l’ordre des numéros, numéros identiques à ceux du radar
    const nums = await tech.locator(".pt-retenu text").allTextContents();
    const leg = await tech.locator("ol.rapport-legende li .rapport-legende-num").allTextContents();
    assert.deepEqual(leg, nums.slice().sort((a, b) => a - b));
    assert.ok((await tech.locator("ol.rapport-legende").innerText()).includes("OpenStack"));
    // figures statiques : rien de focalisable, aucune animation
    assert.equal(await p.locator(".rapport-radar [tabindex]").count(), 0);
    // après les chiffres de la synthèse
    assert.equal(await p.evaluate(() => {
      const f = document.querySelector("#ch-synthese .rapport-radar"), c = [...document.querySelectorAll("#ch-synthese .rapport-chiffre")].pop();
      return !!(c.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING);
    }), true);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("radars : mêmes positions que le radar interactif", async () => {
  const { p, errs, fermer } = await rapport(COMPLET);
  const ctx = await navigateur.newContext();
  try {
    const pt = await p.$eval(".rapport-radar[data-vue=\"technologies\"] .pt-retenu circle", (c) => [c.getAttribute("cx"), c.getAttribute("cy")].map(Number));
    const n = await p.$eval(".rapport-radar[data-vue=\"technologies\"] .pt-retenu text", (t) => t.textContent);
    const q = await ctx.newPage();
    await ouvrir(q, "radar.html#technologies");
    await q.waitForSelector("#radar .blip");
    const ref = await q.evaluate((num) => {
      const b = [...document.querySelectorAll("#radar .blip")].find((g) => g.querySelector("text").textContent === num);
      const c = b.querySelector("circle:not(.halo)"); return [c.getAttribute("cx"), c.getAttribute("cy")].map(Number);
    }, n);
    assert.ok(Math.abs(ref[0] - pt[0]) < 0.01 && Math.abs(ref[1] - pt[1]) < 0.01, "position différente");
    assert.deepEqual(errs, []);
  } finally { await ctx.close(); await fermer(); }
});

test("radars : technologies seules", async () => {
  const { p, errs, fermer } = await rapport(TECHNOS_SEULES);
  try {
    assert.equal(await p.locator(".rapport-radar[data-vue=\"technologies\"]").count(), 1);
    assert.equal(await p.locator(".rapport-radar[data-vue=\"tendances\"]").count(), 0);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("radar des tendances : couleurs d’urgence", async () => {
  const ctx = await navigateur.newContext();
  const q = await ctx.newPage();
  await ouvrir(q, "radar.html");
  const attendu = await resoudre(q, (await q.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--a0"))).trim());
  await ctx.close();
  const { p, errs, fermer } = await rapport(COMPLET);
  try {
    const lire = () => p.$eval(".rapport-radar[data-vue=\"tendances\"] path.anneau-0", (e) => getComputedStyle(e).fill);
    assert.equal(await lire(), attendu);
    // indépendant de la vue courante du radar
    await p.evaluate(() => document.documentElement.setAttribute("data-vue", "technologies"));
    assert.equal(await lire(), attendu);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("radars : mode sombre et impression", async () => {
  const { p, errs, fermer } = await rapport(COMPLET, { colorScheme: "dark" });
  try {
    for (const f of await p.locator(".rapport-figure").all()) assert.ok(await f.isVisible());
    await p.emulateMedia({ media: "print" });
    assert.equal(await p.$eval(".rapport-figure", (f) => getComputedStyle(f).breakInside), "avoid");
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("radars : mobile sans débordement", async () => {
  const { p, errs, fermer } = await rapport(COMPLET, { viewport: { width: 390, height: 844 } });
  try {
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    const b = await p.locator(".rapport-radar svg").first().boundingBox();
    assert.ok(b.width > 200 && b.x + b.width <= 390);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

// Criticité calculée dans la page à partir des données brutes du radar
const criticitesPage = (p) => p.evaluate(async () => {
  const [technologies, tendances] = await Promise.all(["technologies", "tendances"].map((n) => fetch("data/" + n + ".json").then((r) => r.json())));
  return { technologies, tendances, crit: { ...window.OptioSelection.criticites({ technologies, tendances, mecanismes: [], leviers: [] }) } };
});

test("matrice : position et criticité", async () => {
  const { p, errs, fermer } = await rapport(COMPLET, { viewport: { width: 1280, height: 900 } });
  try {
    const m = p.locator("#ch-synthese figure.rapport-figure.rapport-matrice");
    assert.equal(await m.count(), 1);
    assert.equal(await m.locator(".pt-matrice").count(), 2);
    assert.equal(await m.locator("svg[role=\"img\"]").getAttribute("aria-label"), "Matrice criticité et réversibilité : 2 technologies");
    const { crit } = await criticitesPage(p);
    const pts = await m.locator(".pt-matrice").evaluateAll((gs) => gs.map((g) => ({ id: g.getAttribute("data-id"), crit: g.getAttribute("data-criticite"), cx: Number(g.querySelector("circle").getAttribute("cx")) })));
    for (const pt of pts) assert.equal(Number(pt.crit), crit[pt.id].score, pt.id);
    const cx = Object.fromEntries(pts.map((pt) => [pt.id, pt.cx]));
    assert.ok(cx["vmware-vsphere-et-vcf"] < cx["openstack"], "VMware doit être à gauche d’OpenStack");
    const leg = await m.locator("ol.rapport-legende").innerText();
    assert.ok(leg.includes("OpenStack") && /VMware/.test(leg));
    const cap = await m.locator("figcaption").innerText();
    assert.ok(cap.startsWith("Positionnement indicatif, estimé à partir du radar — à affiner avec vous en rendez-vous"), cap);
    assert.ok(cap.includes("Criticité estimée : urgence des tendances du radar qui citent la technologie (forte 3, élevée 2, moyenne 1, faible 0), ramenée de 1 à 5."), cap);
    // après les radars
    assert.equal(await p.evaluate(() => {
      const r = document.querySelector("#ch-synthese .rapport-radars"), f = document.querySelector("#ch-synthese .rapport-matrice");
      return !!(r.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING);
    }), true);
    // numéros lisibles : taille rendue ≥ 8 px
    const taille = await m.locator(".pt-matrice text").first().evaluate((t) => {
      const svg = t.ownerSVGElement; return parseFloat(t.getAttribute("font-size")) * svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
    });
    assert.ok(taille >= 8, "numéro rendu à " + taille + " px");
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("matrice : points sans recouvrement", async () => {
  const technologies = await fetch(BASE + "data/technologies.json").then((r) => r.json());
  const ids = technologies.filter((x) => x.anneau === 0).map((x) => x.id);
  assert.ok(ids.length > 2);
  const { p, errs, fermer } = await rapport("radar.html?rapport=1&x=" + ids.join(",") + "&d=2026-11-23");
  try {
    const cs = await p.locator(".rapport-matrice .pt-matrice circle").evaluateAll((l) => l.map((c) => ["cx", "cy", "r"].map((k) => Number(c.getAttribute(k)))));
    assert.equal(cs.length, ids.length);
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
      const d = Math.hypot(cs[i][0] - cs[j][0], cs[i][1] - cs[j][1]);
      assert.ok(d >= 2 * cs[i][2] - 1e-6, "points " + i + " et " + j + " à " + d.toFixed(2));
    }
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("matrice : technologie sans tendance", async (t) => {
  const { p: q, fermer: f0 } = await rapport(COMPLET);
  const { technologies, tendances } = await criticitesPage(q);
  await f0();
  const cites = new Set(tendances.filter((x) => x.type !== "levier").flatMap((x) => x.technologies || []));
  const libre = technologies.find((x) => !cites.has(x.nom));
  if (!libre) { t.skip("aucune technologie sans tendance dans les données"); return; }
  const { p, errs, fermer } = await rapport("radar.html?rapport=1&x=vmware-vsphere-et-vcf,openstack," + libre.id + "&d=2026-11-23");
  try {
    const pts = await p.locator(".rapport-matrice .pt-matrice").evaluateAll((gs) => gs.map((g) => ({ id: g.getAttribute("data-id"), crit: g.getAttribute("data-criticite"), cy: Number(g.querySelector("circle").getAttribute("cy")) })));
    const pt = pts.find((x) => x.id === libre.id);
    assert.equal(pt.crit, "1");
    assert.equal(pt.cy, Math.max(...pts.map((x) => x.cy)));
    assert.ok(pts.every((x) => Number.isFinite(x.cy)));
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("matrice : absente sans technologie", async () => {
  const { p, errs, fermer } = await rapport("radar.html?rapport=1&t=fin-des-licences-perpetuelles&d=2026-11-23");
  try {
    assert.equal(await p.locator(".rapport-matrice").count(), 0);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("matrice : mobile sans débordement", async () => {
  const { p, errs, fermer } = await rapport(COMPLET, { viewport: { width: 390, height: 844 } });
  try {
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    const b = await p.locator(".rapport-matrice svg").boundingBox();
    assert.ok(b.width > 250 && b.x + b.width <= 390);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});
