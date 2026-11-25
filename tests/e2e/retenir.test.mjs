// Retenir des tendances et des technologies : étoiles, pastille « Mon radar », volet, suggestions.
// Prérequis : python3 -m http.server 8765 à la racine du dépôt (voir outils.mjs).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { ouvrir, erreurs, adresseRapport } from "./outils.mjs";

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
  // piège du focus : Tab et Maj+Tab restent dans le volet
  const actif = () => p.evaluate(() => ({ id: document.activeElement.id, dansVolet: document.getElementById("volet").contains(document.activeElement) }));
  assert.equal((await actif()).id, "volet-fermer");
  await p.keyboard.press("Shift+Tab");
  let a = await actif();
  assert.ok(a.dansVolet && a.id !== "volet-fermer", "Maj+Tab depuis le premier bouton va au dernier du volet");
  await p.keyboard.press("Tab");
  assert.equal((await actif()).id, "volet-fermer", "Tab depuis le dernier revient au premier");
  for (let i = 0; i < 12; i++) await p.keyboard.press("Tab");
  assert.ok((await actif()).dansVolet);
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
  const { p, errs, fermer } = await page({}, { tendances: ["virtualisation-proprietaire"], technologies: [], date: "" });
  await p.locator("#mon-radar").click();
  const sugg = p.locator("#volet .volet-sugg", { hasText: "VMware vSphere et VCF" });
  assert.equal(await sugg.count(), 1);
  assert.ok(await p.locator("#volet .volet-sugg").count() <= 6);
  assert.match(await p.locator("#volet").innerText(), /Ces tendances concernent aussi/);
  assert.match(await p.locator("#volet").innerText(), /Les utilisez-vous/);
  await sugg.click();
  assert.equal((await texteCompteur(p)).trim(), "Mon radar · 2");
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

test("revoir mon dernier rapport : lien près du bouton de demande", async () => {
  const dernier = adresseRapport("x=openstack&d=2026-11-23", "http://localhost:8765/radar.html");
  const { p, errs, fermer } = await page({}, { tendances: [], technologies: ["openstack"], date: "" });
  try {
    await p.locator("#mon-radar").click();
    assert.equal(await p.locator("#volet .dernier-rapport").count(), 0, "aucun lien sans rapport gardé");
    await p.keyboard.press("Escape");
    await p.evaluate((u) => localStorage.setItem("optio-radar-dernier-rapport", u), dernier);
    await p.locator("#mon-radar").click();
    const lien = p.locator("#volet a.dernier-rapport");
    assert.equal(await lien.isVisible(), true);
    assert.match(await lien.innerText(), /Revoir mon dernier rapport/);
    assert.equal(await lien.getAttribute("href"), dernier);
    // près du bouton : dans la même section que #demander-rapport
    assert.equal(await p.locator(".apercu a.dernier-rapport").count(), 1);
    await Promise.all([p.waitForURL(/rapport=1&r=2\./), lien.click()]);
    await p.waitForSelector("#rapport[data-etat]");
    // une valeur qui n’est pas un lien de rapport http(s) est ignorée
    await p.evaluate(() => localStorage.setItem("optio-radar-dernier-rapport", "javascript:alert(1)"));
    await p.goto("http://localhost:8765/radar.html"); await p.waitForSelector("#stats .stat");
    await p.locator("#mon-radar").click();
    assert.equal(await p.locator("#volet .dernier-rapport").count(), 0);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("ouvrir sa fiche depuis le volet : le focus va sur le titre de la fiche", async () => {
  const { p, errs, fermer } = await page({}, { tendances: ["fin-des-licences-perpetuelles"], technologies: ["oracle-database"], date: "" });
  try {
    for (const [nom, id] of [["tendance", "fin-des-licences-perpetuelles"], ["technologie", "oracle-database"]]) {
      await p.locator("#mon-radar").click();
      const item = p.locator("#volet .volet-ouvrir").nth(nom === "tendance" ? 0 : 1);
      const titre = (await item.innerText()).replace(/^\d+\s*/, "").trim();
      await item.click();
      await p.waitForFunction((t) => { const a = document.activeElement; return a && a.tagName === "H2" && document.getElementById("fiche").contains(a) && a.textContent.trim() === t; }, titre, { timeout: 3000 });
      assert.equal(await p.locator("#volet").isVisible(), false);
      assert.equal(await p.evaluate(() => document.activeElement.getAttribute("tabindex")), "-1");
      assert.ok(p.url().endsWith("#" + id), p.url());
    }
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("volet modal : rôle dialog, nom accessible, reste de la page inerte", async () => {
  const { p, errs, fermer } = await page({}, { tendances: ["fin-des-licences-perpetuelles"], technologies: [], date: "" });
  try {
    const v = p.locator("#volet");
    assert.equal(await v.getAttribute("role"), "dialog");
    assert.equal(await v.getAttribute("aria-modal"), "true");
    const nom = await p.evaluate(() => { const v = document.getElementById("volet"), l = v.getAttribute("aria-labelledby"); return l ? document.getElementById(l).textContent : v.getAttribute("aria-label"); });
    assert.equal(nom.trim(), "Mon radar");
    const inertes = () => p.evaluate(() => ["contenu", "bande"].map((i) => document.getElementById(i).inert).concat([document.querySelector(".entete").inert, document.querySelector(".skip").inert]));
    assert.deepEqual(await inertes(), [false, false, false, false]);
    await p.locator("#mon-radar").click();
    assert.deepEqual(await inertes(), [true, true, true, true]);
    assert.equal(await p.evaluate(() => document.getElementById("volet").inert || document.getElementById("volet-fond").inert), false);
    await p.keyboard.press("Escape");
    assert.deepEqual(await inertes(), [false, false, false, false]);
    assert.equal(await p.evaluate(() => document.activeElement.id), "mon-radar");
    assert.equal(await p.evaluate(() => document.getElementById("etape-2").inert), true, "l’inertie propre aux filtres est conservée");
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("identifiants égaux à des noms d’Object.prototype : pastille juste, sans erreur", async () => {
  const { p, errs, fermer } = await page({}, { tendances: ["constructor", "fin-des-licences-perpetuelles"], technologies: ["__proto__", "toString"], date: "" });
  try {
    assert.equal((await texteCompteur(p)).trim(), "Mon radar · 1");
    await p.locator("#mon-radar").click();
    assert.equal(await p.locator("#volet .volet-item").count(), 1);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("tout retenir : la liste filtrée entre d’un coup dans Mon radar, puis en sort", async () => {
  const { p, errs, fermer } = await page({}, { tendances: [], technologies: [], date: "" });
  try {
    // une tendance déjà retenue hors filtre reste retenue
    // filtre sur l’axe Humain ; une tendance d’un autre axe, déjà retenue, doit rester retenue
    const ligne = p.locator(".ld-ligne:visible").filter({ hasNotText: /Humain/ }).first();
    const horsFiltre = await ligne.locator(".ld-etoile").getAttribute("data-id");
    await ligne.locator(".ld-etoile").click();
    await p.locator("#menu-axe-btn").click();
    await p.locator("#menu-axe-liste .option", { hasText: "Humain" }).click();
    await p.waitForFunction(() => document.querySelectorAll(".ld-ligne").length > 1 && document.querySelectorAll(".ld-ligne").length < 20);
    const n = await p.locator(".ld-ligne").count();
    const tout = p.locator(".ld-tout");
    assert.equal(await tout.getAttribute("aria-pressed"), "false");
    assert.match(await tout.innerText(), new RegExp("Tout retenir \\(" + n + "\\)"));
    await tout.click();
    assert.equal(await tout.getAttribute("aria-pressed"), "true");
    assert.match(await tout.innerText(), new RegExp("Tout retirer \\(" + n + "\\)"));
    assert.deepEqual(await p.locator(".ld-etoile").evaluateAll((l) => l.map((b) => b.getAttribute("aria-pressed"))), Array(n).fill("true"));
    const avecHors = (await p.evaluate((c) => JSON.parse(localStorage.getItem(c)).tendances, CLE));
    assert.ok(avecHors.includes(horsFiltre));
    assert.equal((await texteCompteur(p)).trim(), "Mon radar · " + (avecHors.length));
    // retirer : seuls les éléments listés sortent
    await tout.click();
    assert.equal(await tout.getAttribute("aria-pressed"), "false");
    assert.deepEqual(await p.evaluate((c) => JSON.parse(localStorage.getItem(c)).tendances, CLE), [horsFiltre]);
    assert.equal((await texteCompteur(p)).trim(), "Mon radar · 1");
    // un retrait individuel repasse le bouton en « Tout retenir »
    await tout.click();
    await p.locator(".ld-etoile").first().click();
    assert.equal(await tout.getAttribute("aria-pressed"), "false");
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("tout retenir : vue Technologies", async () => {
  const { p, errs, fermer } = await page({}, { tendances: [], technologies: [], date: "" });
  try {
    await p.locator("#v-technologies").click();
    await p.locator("#menu-axe-btn").click();
    const total = await p.locator(".ld-ligne").count();
    await p.locator("#menu-axe-liste .option").nth(1).click();
    await p.waitForFunction((t) => { const n = document.querySelectorAll(".ld-ligne").length; return n > 1 && n < t; }, total);
    const n = await p.locator(".ld-ligne").count();
    await p.locator(".ld-tout").click();
    const sel = await p.evaluate((c) => JSON.parse(localStorage.getItem(c)), CLE);
    assert.equal(sel.technologies.length, n);
    assert.equal(sel.tendances.length, 0);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});
