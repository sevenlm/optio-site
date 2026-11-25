// Rapport imprimé (PDF) aux couleurs d’Optio : bandeaux, en-tête et pied répétés, typographie.
// Prérequis : python3 -m http.server 8765 à la racine du dépôt (voir outils.mjs).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { BASE, erreurs, adresseRapport } from "./outils.mjs";

const cfg = "window.OPTIO_CONFIG = {tallyFormId:\"\", calLien:\"https://cal.example.test/optio/15min\", urlSite:\"http://localhost:8765/radar.html\"};";
const COMPLET = adresseRapport("t=fin-des-licences-perpetuelles&x=vmware-vsphere-et-vcf,openstack&d=2026-11-23");
const SANS_DATE = adresseRapport("t=fin-des-licences-perpetuelles&x=openstack");
const SITE = "https://www.weareoptio.fr/";
const ENCRE = "rgb(11, 42, 60)";
const VERT = "rgb(0, 119, 90)";

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

// Texte rendu d’un lien, pseudo-élément ::after compris (l’adresse ajoutée à l’impression)
const apres = (p, s) => p.$eval(s, (a) => getComputedStyle(a, "::after").content);

test("impression : page de garde avec bandeau, logo, « Optio » et lien vers le site", async () => {
  const { p, errs, fermer } = await rapport(COMPLET);
  try {
    await p.emulateMedia({ media: "print" });
    const b = p.locator(".rapport-garde .rapport-bandeau");
    assert.ok(await b.isVisible());
    assert.equal(await b.evaluate((x) => getComputedStyle(x).backgroundColor), ENCRE);
    assert.equal(await b.locator("svg").count(), 1);
    assert.match(await b.innerText(), /Optio/);
    const lien = p.locator(".rapport-garde a[href^=\"https://www.weareoptio.fr\"]");
    assert.equal(await lien.count(), 1);
    assert.ok(await lien.isVisible());
    assert.equal(await lien.evaluate((a) => a.href), SITE);
    assert.equal((await lien.innerText()).trim(), "www.weareoptio.fr");
    assert.ok(["none", "normal"].includes(await apres(p, ".rapport-garde a[href^=\"https://www.weareoptio.fr\"]")));
    // le bandeau précède le titre
    assert.ok(await p.evaluate(() => { const b = document.querySelector(".rapport-garde .rapport-bandeau"), h = document.querySelector(".rapport-garde h1"); return !!(b.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING); }));
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("impression : en-tête et pied répétés, fixes, visibles seulement à l’impression", async () => {
  const { p, errs, fermer } = await rapport(COMPLET);
  try {
    const ent = p.locator(".rapport-impr-entete"), pied = p.locator(".rapport-impr-pied");
    assert.equal(await ent.count(), 1);
    assert.equal(await pied.count(), 1);
    assert.ok(!(await ent.isVisible()));
    assert.ok(!(await pied.isVisible()));
    await p.emulateMedia({ media: "print" });
    assert.ok(await ent.isVisible());
    assert.ok(await pied.isVisible());
    assert.equal(await ent.evaluate((x) => getComputedStyle(x).position), "fixed");
    assert.equal(await pied.evaluate((x) => getComputedStyle(x).position), "fixed");
    assert.equal(await ent.locator("svg").count(), 1);
    assert.match(await ent.innerText(), /Optio · Radar des dépendances/);
    const lien = ent.locator("a[href^=\"https://www.weareoptio.fr\"]");
    assert.equal((await lien.innerText()).trim(), "www.weareoptio.fr");
    assert.ok(["none", "normal"].includes(await apres(p, ".rapport-impr-entete a")));
    assert.equal((await pied.innerText()).trim(), "Rapport personnalisé du 23 novembre 2026");
    // l’ancien en-tête du radar (« Optio · Édition 1… ») n’est plus imprimé
    assert.equal(await p.locator(".entete").evaluate((x) => getComputedStyle(x).display), "none");
    // le contenu laisse la place à l’en-tête et au pied sur chaque page
    const m = await p.evaluate(() => {
      const r = getComputedStyle(document.getElementById("rapport"));
      const e = document.querySelector(".rapport-impr-entete").getBoundingClientRect(), f = document.querySelector(".rapport-impr-pied").getBoundingClientRect();
      return { haut: parseFloat(r.paddingTop), bas: parseFloat(r.paddingBottom), clone: r.boxDecorationBreak || r.webkitBoxDecorationBreak, eh: e.bottom, fh: window.innerHeight - f.top };
    });
    assert.equal(m.clone, "clone");
    assert.ok(m.haut > m.eh, JSON.stringify(m));
    assert.ok(m.bas > m.fh, JSON.stringify(m));
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("impression : pied sans date", async () => {
  const { p, errs, fermer } = await rapport(SANS_DATE);
  try {
    await p.emulateMedia({ media: "print" });
    assert.equal((await p.locator(".rapport-impr-pied").innerText()).trim(), "Rapport personnalisé");
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

async function couleurs(p) {
  return p.evaluate(() => {
    const cs = (s, pseudo) => getComputedStyle(document.querySelector(s), pseudo);
    return {
      h1: cs(".rapport-garde h1").color, h1f: cs(".rapport-garde h1").fontFamily,
      h2: cs("#ch-technologies > h2").color, h2f: cs("#ch-technologies > h2").fontFamily,
      h3: cs(".rapport-techno h3").color,
      num: cs("#ch-technologies > h2", "::before").color,
      texte: cs(".rapport-techno p").fontFamily,
      lien: cs(".rapport-sources a").color,
      bandeau: cs(".rapport-garde .rapport-bandeau").backgroundColor,
      fin: cs("#ch-rdv .rapport-bandeau").backgroundColor,
      entete: cs(".rapport-impr-entete").color, pied: cs(".rapport-impr-pied").color,
      fond: getComputedStyle(document.body).backgroundColor
    };
  });
}

test("impression : titres en encre (Archivo), numéros et liens en vert Optio", async () => {
  const { p, errs, fermer } = await rapport(COMPLET);
  try {
    await p.emulateMedia({ media: "print" });
    const c = await couleurs(p);
    assert.equal(c.h1, ENCRE);
    assert.equal(c.h2, ENCRE);
    assert.equal(c.h3, ENCRE);
    assert.match(c.h1f, /^"?Archivo/);
    assert.match(c.h2f, /^"?Archivo/);
    assert.match(c.texte, /^"?Instrument Sans/);
    assert.equal(c.num, VERT);
    assert.equal(c.lien, VERT);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("impression : dernière page avec bandeau, logo, bouton de réservation et lien vers le site", async () => {
  const { p, errs, fermer } = await rapport(COMPLET);
  try {
    await p.emulateMedia({ media: "print" });
    const b = p.locator("#ch-rdv .rapport-bandeau");
    assert.ok(await b.isVisible());
    assert.equal(await b.evaluate((x) => getComputedStyle(x).backgroundColor), ENCRE);
    assert.equal(await b.locator("svg").count(), 1);
    assert.match(await b.innerText(), /Optio/);
    const res = b.getByRole("link", { name: "Réserver 15 minutes" });
    assert.ok(await res.isVisible());
    assert.match(await res.getAttribute("href"), /^https:\/\/cal\.example\.test\/optio\/15min\?notes=/);
    assert.ok(["none", "normal"].includes(await res.evaluate((a) => getComputedStyle(a, "::after").content)));
    const site = b.locator("a[href^=\"https://www.weareoptio.fr\"]");
    assert.ok(await site.isVisible());
    assert.equal((await site.innerText()).trim(), "www.weareoptio.fr");
    assert.ok(["none", "normal"].includes(await site.evaluate((a) => getComputedStyle(a, "::after").content)));
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("impression : mêmes couleurs avec le thème sombre du système", async () => {
  const clair = await rapport(COMPLET, { colorScheme: "light" });
  const sombre = await rapport(COMPLET, { colorScheme: "dark" });
  try {
    await clair.p.emulateMedia({ media: "print" });
    await sombre.p.emulateMedia({ media: "print", colorScheme: "dark" });
    const a = await couleurs(clair.p), b = await couleurs(sombre.p);
    assert.deepEqual(b, a);
    assert.equal(b.h2, ENCRE);
    assert.equal(b.fond, "rgb(255, 255, 255)");
    assert.deepEqual(clair.errs, []);
    assert.deepEqual(sombre.errs, []);
  } finally { await clair.fermer(); await sombre.fermer(); }
});

test("écran : rien de nouveau n’est visible, mise en page inchangée", async () => {
  const { p, errs, fermer } = await rapport(COMPLET, { viewport: { width: 1280, height: 900 } });
  try {
    for (const s of [".rapport-impr-entete", ".rapport-impr-pied", ".rapport-bandeau"]) {
      const l = p.locator(s);
      assert.ok(await l.count() >= 1, s);
      for (const x of await l.all()) assert.ok(!(await x.isVisible()), s + " visible à l’écran");
    }
    const m = await p.evaluate(() => {
      const r = getComputedStyle(document.getElementById("rapport"));
      return { pad: r.padding, entete: getComputedStyle(document.querySelector(".entete")).display };
    });
    assert.equal(m.pad, "28px 28px 48px");
    assert.notEqual(m.entete, "none");
    assert.ok(await p.getByRole("button", { name: "Télécharger en PDF" }).isVisible());
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("PDF réel d’une grande sélection : plusieurs pages, sans erreur", async () => {
  const { p: p0, fermer: f0 } = await rapport("radar.html?rapport=1");
  const lisible = await p0.evaluate(async () => {
    const tech = await fetch("data/technologies.json").then((x) => x.json());
    const tend = await fetch("data/tendances.json").then((x) => x.json());
    return "t=" + tend.slice(0, 20).map((t) => t.id).join(",") + "&x=" + tech.slice(0, 40).map((t) => t.id).join(",") + "&d=2026-11-23";
  });
  await f0();
  const { p, errs, fermer } = await rapport(adresseRapport(lisible));
  try {
    assert.equal(await p.locator("#rapport").getAttribute("data-etat"), "complet");
    await p.evaluate(() => document.fonts.ready);
    const pdf = await p.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
    assert.ok(pdf.length > 10000, "PDF vide");
    const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
    assert.ok(pages > 5, "pages : " + pages);
    assert.ok(pdf.toString("latin1").includes("weareoptio.fr"), "lien vers le site absent du PDF");
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});
