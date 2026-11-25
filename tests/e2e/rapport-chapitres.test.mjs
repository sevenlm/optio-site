// Rapport personnalisé : chapitres numérotés, sommaire imprimé et volet de navigation.
// Prérequis : python3 -m http.server 8765 à la racine du dépôt (voir outils.mjs).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { BASE, erreurs, adresseRapport } from "./outils.mjs";

const cfg = "window.OPTIO_CONFIG = {tallyFormId:\"\", calLien:\"https://cal.example.test/optio/15min\", urlSite:\"http://localhost:8765/radar.html\"};";
const COMPLET = adresseRapport("t=fin-des-licences-perpetuelles&x=vmware-vsphere-et-vcf,openstack&d=2026-11-23");
const TECHNOS_SEULES = adresseRapport("x=vmware-vsphere-et-vcf&d=2026-11-23");
const TOUS = ["ch-synthese", "ch-technologies", "ch-tendances", "ch-mecanismes", "ch-leviers", "ch-sources", "ch-rdv"];

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
const numero = (p, id) => p.$eval("#" + id + " > h2", (h) => getComputedStyle(h, "::before").content);

test("chapitres complets dans l’ordre", async () => {
  const { p, errs, fermer } = await rapport(COMPLET);
  try {
    assert.deepEqual(await ids(p), TOUS);
    assert.match(await numero(p, "ch-leviers"), /5/);
    assert.match(await numero(p, "ch-sources"), /6/);
    assert.match(await numero(p, "ch-synthese"), /1/);
    // le numéro n’est pas dans le texte du titre
    assert.equal((await p.locator("#ch-sources > h2").innerText()).trim(), "Sources");
    assert.equal(await p.getByRole("heading", { name: "Sources", exact: true }).count(), 1);
    assert.equal(await p.locator("#ch-synthese.rapport-synthese").count(), 1);
    assert.equal(await p.locator("#fiche-vmware-vsphere-et-vcf.rapport-techno").count(), 1);
    assert.equal(await p.locator("#fiche-fin-des-licences-perpetuelles.rapport-tendance").count(), 1);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("technologies seules : chapitres omis et numérotation continue", async () => {
  const { p, errs, fermer } = await rapport(TECHNOS_SEULES);
  try {
    assert.deepEqual(await ids(p), ["ch-synthese", "ch-technologies", "ch-leviers", "ch-sources", "ch-rdv"]);
    assert.match(await numero(p, "ch-sources"), /4/);
    assert.match(await numero(p, "ch-rdv"), /5/);
    assert.equal(await p.locator(".rapport-nav a[href^=\"#ch-\"]").count(), 5);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("volet écran large", async () => {
  const { p, errs, fermer } = await rapport(COMPLET, { viewport: { width: 1280, height: 900 } });
  try {
    const nav = p.locator("nav.rapport-nav.ecran-seul");
    assert.equal(await nav.getAttribute("aria-label"), "Sommaire du rapport");
    assert.ok(await nav.isVisible());
    assert.ok(!(await p.locator(".rapport-nav-bouton").isVisible()));
    assert.deepEqual(await p.$$eval(".rapport-nav a[href^=\"#ch-\"]", (l) => l.map((a) => a.getAttribute("href"))), TOUS.map((i) => "#" + i));
    assert.equal(await p.locator(".rapport-nav a[href=\"#fiche-vmware-vsphere-et-vcf\"]").count(), 1);
    assert.equal(await p.locator(".rapport-nav a[href=\"#fiche-fin-des-licences-perpetuelles\"]").count(), 1);
    // volet à gauche du contenu
    const bn = await nav.boundingBox(), bc = await p.locator("#ch-synthese").boundingBox();
    assert.ok(bn.x + bn.width <= bc.x, "volet pas à gauche du contenu");
    assert.ok(bc.width <= 900);
    // chapitre au milieu du rapport (en bas de page, c’est le dernier chapitre qui est marqué)
    await p.evaluate(() => document.getElementById("ch-mecanismes").scrollIntoView());
    await p.waitForFunction(() => document.querySelector(".rapport-nav a[href=\"#ch-mecanismes\"]").getAttribute("aria-current") === "location", null, { timeout: 3000 });
    assert.equal(await p.locator(".rapport-nav a[aria-current]").count(), 1);
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForFunction(() => document.querySelector(".rapport-nav a[href=\"#ch-synthese\"]").getAttribute("aria-current") === "location", null, { timeout: 3000 });
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("volet mobile", async () => {
  const { p, errs, fermer } = await rapport(COMPLET, { viewport: { width: 390, height: 844 } });
  try {
    const bouton = p.locator(".rapport-nav-bouton");
    const lien = p.locator(".rapport-nav a[href=\"#ch-sources\"]");
    assert.ok(await bouton.isVisible());
    assert.equal((await bouton.innerText()).trim(), "Sommaire");
    assert.equal(await bouton.getAttribute("aria-expanded"), "false");
    const cible = await bouton.getAttribute("aria-controls");
    assert.ok(cible && (await p.locator("#" + cible).count()) === 1);
    assert.ok(!(await lien.isVisible()));
    await bouton.click();
    assert.equal(await bouton.getAttribute("aria-expanded"), "true");
    assert.ok(await lien.isVisible());
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= 390), "débordement horizontal");
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("impression", async () => {
  const { p, errs, fermer } = await rapport(COMPLET);
  try {
    await p.emulateMedia({ media: "print" });
    assert.ok(!(await p.locator(".rapport-nav").isVisible()));
    const som = p.locator("nav.rapport-sommaire.imprime-seul");
    assert.ok(await som.isVisible());
    assert.ok(await p.evaluate(() => document.querySelector(".rapport-garde").nextElementSibling.classList.contains("rapport-sommaire")));
    assert.equal((await som.locator("h2").innerText()).trim(), "Sommaire");
    assert.equal(await som.locator(".rapport-chap").count(), 0);
    assert.deepEqual(await som.locator("a[href^=\"#ch-\"]").evaluateAll((l) => l.map((a) => a.getAttribute("href"))), TOUS.map((i) => "#" + i));
    const sauts = await p.$$eval("#rapport .rapport-chap", (l) => l.map((s) => getComputedStyle(s).breakBefore));
    assert.deepEqual(sauts, TOUS.map(() => "page"));
    assert.equal(await som.evaluate((s) => getComputedStyle(s).breakBefore), "page");
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("grande sélection", async () => {
  const { p: p0, fermer: f0 } = await rapport("radar.html?rapport=1");
  const lisible = await p0.evaluate(async () => {
    const tech = await fetch("data/technologies.json").then((x) => x.json());
    const tend = await fetch("data/tendances.json").then((x) => x.json());
    return "t=" + tend.slice(0, 20).map((t) => t.id).join(",") + "&x=" + tech.slice(0, 60).map((t) => t.id).join(",") + "&d=2026-11-23";
  });
  await f0();
  const adresse = adresseRapport(lisible);
  const { p, errs, fermer } = await rapport(adresse, { viewport: { width: 1280, height: 900 } });
  try {
    assert.equal(await p.locator("#rapport").getAttribute("data-etat"), "complet");
    assert.equal(await p.locator(".rapport-nav a[href^=\"#fiche-\"]").count(), 80);
    const h = await p.locator(".rapport-nav").evaluate((n) => n.getBoundingClientRect().height);
    assert.ok(h <= 900, "volet trop haut : " + h);
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    const h2 = await p.locator(".rapport-nav").evaluate((n) => { const r = n.getBoundingClientRect(); return { top: r.top, bas: r.bottom }; });
    assert.ok(h2.top >= 0 && h2.bas <= 900, "volet pas collant : " + JSON.stringify(h2));
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

// Sans sommaire (rapport vide, identifiants inconnus, données absentes) : pas de colonne de volet sur écran large
for (const [nom, chemin, panne] of [
  ["vide", adresseRapport(""), false],
  ["lien non valide", "radar.html?rapport=1", false],
  ["identifiant inconnu", adresseRapport("x=inconnu"), false],
  ["données absentes", adresseRapport("x=vmware-vsphere-et-vcf"), true],
]) {
  test("écran large sans sommaire : " + nom, async () => {
    const contexte = await navigateur.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await contexte.newPage();
    try {
      await p.route("**/js/config.js", (r) => r.fulfill({ contentType: "text/javascript", body: cfg }));
      if (panne) await p.route("**/data/tendances.json*", (r) => r.fulfill({ status: 500, body: "" }));
      await p.goto(BASE + chemin);
      await p.waitForSelector(panne ? "#rapport .rapport-bloc[role=alert]" : "#rapport[data-etat]");
      assert.equal(await p.locator(".rapport-nav").count(), 0);
      const w = await p.locator("#rapport > *").first().evaluate((x) => x.getBoundingClientRect().width);
      assert.ok(w > 600, "contenu trop étroit : " + w);
    } finally { await contexte.close(); }
  });
}

test("volet : dernier chapitre marqué en bas de page", async () => {
  const { p, errs, fermer } = await rapport(COMPLET, { viewport: { width: 1280, height: 900 } });
  try {
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await p.waitForFunction(() => document.querySelector(".rapport-nav a[href=\"#ch-rdv\"]").getAttribute("aria-current") === "location", null, { timeout: 3000 });
    assert.equal(await p.locator(".rapport-nav a[aria-current]").count(), 1);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("lien copié et lien de rendez-vous sans ancre", async () => {
  const { p, errs, fermer } = await rapport(COMPLET + "#ch-sources", { viewport: { width: 1280, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
  try {
    for (const sel of ["a.rapport-rdv", "a.rapport-rdv-haut"]) {
      const notes = new URL(await p.locator(sel).getAttribute("href")).searchParams.get("notes");
      assert.ok(notes.includes("rapport=1") && !notes.includes("#"), sel + " : " + notes);
    }
    await p.locator(".rapport-nav a[href=\"#ch-mecanismes\"]").click();
    await p.waitForFunction(() => location.hash === "#ch-mecanismes");
    await p.getByRole("button", { name: "Copier le lien de mon rapport" }).click();
    await p.waitForFunction(() => /copié/.test(document.querySelector(".rapport-statut").textContent));
    const copie = await p.evaluate(() => navigator.clipboard.readText());
    assert.equal(copie, BASE + COMPLET);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});
