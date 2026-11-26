// Appels à l’action du radar : pied de fiche, message au premier élément retenu, bandeau, rendez-vous.
// Prérequis : python3 -m http.server 8765 à la racine du dépôt (voir outils.mjs).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { ouvrir, erreurs } from "./outils.mjs";

let navigateur;
before(async () => { navigateur = await chromium.launch({ channel: "chrome" }); });
after(async () => { await navigateur.close(); });

async function page() {
  const contexte = await navigateur.newContext();
  const p = await contexte.newPage();
  const errs = erreurs(p);
  await ouvrir(p, "radar.html");
  return { p, errs, fermer: () => contexte.close() };
}

test("pied de fiche, puis message au premier élément retenu, une seule fois", async () => {
  const { p, errs, fermer } = await page();
  await p.locator(".ld-item").first().click();
  const cta = p.locator("#fiche .fiche-cta");
  await cta.locator("button.cta-non").click();
  assert.equal((await p.locator("#mon-radar").innerText()).trim(), "Mon radar · 1");
  assert.equal(await cta.locator("button.cta-non").isVisible(), false);
  assert.equal(await cta.locator("button.cta-oui").isVisible(), true);
  assert.equal(await p.evaluate(() => document.activeElement.textContent), "Ouvrir Mon radar");
  assert.equal(await p.locator("#astuce").isVisible(), true);
  await p.locator("#astuce .astuce-fermer").click();
  assert.equal(await p.locator("#astuce").count(), 0);
  // retirer puis retenir à nouveau : pas de second message, même après rechargement
  await p.locator("#fiche .fiche-haut .retenir").click();
  await p.reload();
  await p.waitForSelector("#stats .stat");
  await p.locator('#fiche .fiche-haut .retenir[aria-pressed="false"]').click();
  assert.equal((await p.locator("#mon-radar").innerText()).trim(), "Mon radar · 1");
  assert.equal(await p.locator("#astuce").count(), 0);
  assert.deepEqual(errs, []);
  await fermer();
});

test("bandeau : ouvre Mon radar ; rendez-vous avec le lien du rapport si sélection", async () => {
  const { p, errs, fermer } = await page();
  const rdv = p.locator("#cta-rapport a.lien-rdv");
  assert.doesNotMatch(await rdv.getAttribute("href"), /notes=/);
  await p.locator('.ld-etoile[aria-pressed="false"]').first().click();
  assert.match(decodeURIComponent(await rdv.getAttribute("href")), /notes=Mon rapport : http.*\?rapport=1&r=/);
  await p.locator("#astuce .astuce-fermer").click();
  await p.locator("#cta-construire").click();
  assert.equal(await p.locator("#volet").isVisible(), true);
  assert.match(decodeURIComponent(await p.locator("#volet a.lien-rdv").getAttribute("href")), /\?rapport=1&r=/);
  assert.deepEqual(errs, []);
  await fermer();
});
