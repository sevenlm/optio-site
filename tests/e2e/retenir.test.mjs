// Retenir des tendances et des technologies : étoiles, pastille « Mon radar », volet, suggestions.
// Prérequis : python3 -m http.server 8765 à la racine du dépôt (voir outils.mjs).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { ouvrir, erreurs } from "./outils.mjs";

const CLE = "optio-radar-selection";
let navigateur;
before(async () => { navigateur = await chromium.launch({ channel: "chrome" }); });
after(async () => { await navigateur.close(); });

// Nouvelle page (stockage vierge), éventuellement avec une sélection déjà enregistrée.
async function page(options = {}, selection = null) {
  const contexte = await navigateur.newContext(options);
  const p = await contexte.newPage();
  const errs = erreurs(p);
  await ouvrir(p, "radar.html");
  if (selection) {
    await p.evaluate(([c, s]) => localStorage.setItem(c, JSON.stringify(s)), [CLE, selection]);
    await p.reload();
    await p.waitForSelector("#stats .stat");
  }
  return { p, errs, fermer: () => contexte.close() };
}
const texteCompteur = (p) => p.locator("#mon-radar").innerText();

test("retenir depuis la fiche", async () => {
  const { p, errs, fermer } = await page();
  assert.equal((await texteCompteur(p)).trim(), "Mon radar · 0");
  await p.locator(".ld-item").first().click();
  const bouton = p.locator("#fiche .retenir");
  assert.equal(await bouton.getAttribute("aria-pressed"), "false");
  assert.match(await bouton.innerText(), /Retenir/);
  await bouton.click();
  assert.equal(await bouton.getAttribute("aria-pressed"), "true");
  assert.match(await bouton.innerText(), /Retenu/);
  assert.equal((await texteCompteur(p)).trim(), "Mon radar · 1");
  assert.deepEqual(errs, []);
  await fermer();
});

test("retenir depuis la liste, sans ouvrir la fiche, avec persistance", async () => {
  const { p, errs, fermer } = await page({}, { tendances: ["fin-des-licences-perpetuelles"], technologies: [], date: "" });
  assert.equal((await texteCompteur(p)).trim(), "Mon radar · 1");
  const etoile = p.locator('.ld-etoile[aria-pressed="false"]').first();
  const id = await etoile.getAttribute("data-id");
  await etoile.click();
  assert.equal((await texteCompteur(p)).trim(), "Mon radar · 2");
  assert.equal(await p.locator("#fiche.mode-liste").count(), 1, "la fiche ne doit pas s’ouvrir");
  assert.equal(await p.locator(`.ld-etoile[data-id="${id}"]`).getAttribute("aria-pressed"), "true");
  await p.reload();
  await p.waitForSelector("#stats .stat");
  assert.equal(await p.locator(`.ld-etoile[data-id="${id}"]`).getAttribute("aria-pressed"), "true");
  assert.equal((await texteCompteur(p)).trim(), "Mon radar · 2");
  assert.deepEqual(errs, []);
  await fermer();
});

test("volet : liste, retrait, Échap rend le focus sans toucher aux filtres", async () => {
  const { p, errs, fermer } = await page({}, { tendances: ["fin-des-licences-perpetuelles"], technologies: ["oracle-database"], date: "" });
  await p.locator(".titre-axe").first().click(); // filtre d’axe actif
  assert.equal(await p.locator("#raz").isVisible(), true);
  assert.equal(await p.locator("#volet").isVisible(), false);
  await p.locator("#mon-radar").click();
  assert.equal(await p.locator("#volet").isVisible(), true);
  assert.equal(await p.locator("#volet .volet-item").count(), 2);
  await p.locator("#volet .volet-retirer").first().click();
  assert.equal(await p.locator("#volet .volet-item").count(), 1);
  assert.equal((await texteCompteur(p)).trim(), "Mon radar · 1");
  await p.keyboard.press("Escape");
  assert.equal(await p.locator("#volet").isVisible(), false);
  assert.equal(await p.evaluate(() => document.activeElement && document.activeElement.id), "mon-radar");
  assert.equal(await p.locator("#raz").isVisible(), true, "Échap ferme le volet sans réinitialiser les filtres");
  // fermeture par le fond
  await p.locator("#mon-radar").click();
  assert.equal(await p.locator("#volet").isVisible(), true);
  await p.mouse.click(10, 300);
  assert.equal(await p.locator("#volet").isVisible(), false);
  assert.deepEqual(errs, []);
  await fermer();
});

test("suggestions de technologies liées aux tendances retenues", async () => {
  // Avec « Virtualisation propriétaire » seule, VMware vSphere arrive 7e (ex aequo, ordre alphabétique) :
  // le rachat de VMware la fait remonter dans les 6 suggestions affichées.
  const { p, errs, fermer } = await page({}, { tendances: ["virtualisation-proprietaire", "rachats-et-consolidation-des-editeurs"], technologies: [], date: "" });
  await p.locator("#mon-radar").click();
  const sugg = p.locator("#volet .volet-sugg", { hasText: "VMware vSphere et VCF" });
  assert.equal(await sugg.count(), 1);
  assert.ok(await p.locator("#volet .volet-sugg").count() <= 6);
  assert.match(await p.locator("#volet").innerText(), /Ces tendances concernent aussi/);
  assert.match(await p.locator("#volet").innerText(), /Les utilisez-vous/);
  await sugg.click();
  assert.equal((await texteCompteur(p)).trim(), "Mon radar · 3");
  assert.equal(await p.locator("#volet .volet-item", { hasText: "VMware vSphere et VCF" }).count(), 1);
  assert.equal(await p.locator("#volet .volet-sugg", { hasText: "VMware vSphere et VCF" }).count(), 0);
  const stocke = await p.evaluate((c) => JSON.parse(localStorage.getItem(c)), CLE);
  assert.deepEqual(stocke.technologies, ["vmware-vsphere-et-vcf"]);
  assert.deepEqual(errs, []);
  await fermer();
});

test("identifiant périmé ignoré", async () => {
  const { p, errs, fermer } = await page({}, { tendances: ["tendance-disparue", "fin-des-licences-perpetuelles"], technologies: ["techno-disparue"], date: "" });
  assert.equal((await texteCompteur(p)).trim(), "Mon radar · 1");
  assert.deepEqual(errs, []);
  await fermer();
});

test("mobile 390 px : volet ouvert sans débordement", async () => {
  const { p, errs, fermer } = await page({ viewport: { width: 390, height: 844 } }, { tendances: ["virtualisation-proprietaire"], technologies: ["oracle-database"], date: "" });
  assert.equal(await p.locator("#mon-radar").isVisible(), true);
  await p.locator("#mon-radar").click();
  assert.equal(await p.locator("#volet").isVisible(), true);
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth), 390);
  assert.deepEqual(errs, []);
  await fermer();
});
