// Fenêtres « levier » et « mécanisme » : croix en haut à droite, fermeture au clic en dehors.
// Prérequis : python3 -m http.server 8765 à la racine du dépôt (voir outils.mjs).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { ouvrir, erreurs } from "./outils.mjs";

let navigateur;
before(async () => { navigateur = await chromium.launch({ channel: "chrome" }); });
after(async () => { await navigateur.close(); });

const ouvert = (p, id) => p.$eval("#" + id, (d) => d.open);

for (const [nom, vue, declencheur, id] of [
  ["levier", "leviers", ".lv-carte", "lev-dialog"],
  ["mécanisme", "mecanismes", "button.tuile[aria-haspopup='dialog']", "meca-dialog"],
]) {
  test("fenêtre " + nom + " : croix en haut à droite et clic en dehors", async () => {
    for (const vp of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
      const contexte = await navigateur.newContext({ viewport: vp });
      const p = await contexte.newPage();
      const errs = erreurs(p);
      try {
        await ouvrir(p, "radar.html#" + vue);
        await p.locator(declencheur).first().waitFor();
        // croix : visible, dans le coin haut droit du cadre, ferme la fenêtre
        await p.locator(declencheur).first().click();
        assert.equal(await ouvert(p, id), true);
        const croix = p.locator("#" + id + " .tp-fermer");
        assert.equal(await croix.count(), 1);
        assert.equal(await croix.getAttribute("aria-label"), "Fermer");
        const c = await croix.boundingBox(), d = await p.locator("#" + id).boundingBox();
        assert.ok(c.x + c.width > d.x + d.width - 40 && c.y < d.y + 40, "croix pas en haut à droite : " + JSON.stringify({ c, d }));
        await croix.click();
        assert.equal(await ouvert(p, id), false);
        // clic sur le fond, hors du cadre : ferme
        await p.locator(declencheur).first().click();
        await p.mouse.click(4, vp.height - 4);
        assert.equal(await ouvert(p, id), false);
        // clic à l’intérieur du cadre (titre, marge) : reste ouvert
        await p.locator(declencheur).first().click();
        await p.locator("#" + id + " h2").click();
        const b = await p.locator("#" + id).boundingBox();
        await p.mouse.click(b.x + 6, b.y + b.height / 2);
        assert.equal(await ouvert(p, id), true);
        // la croix reste visible après défilement du contenu
        await p.$eval("#" + id, (x) => { x.scrollTop = x.scrollHeight; });
        assert.equal(await croix.isVisible(), true);
        // Échap ferme toujours
        await p.keyboard.press("Escape");
        assert.equal(await ouvert(p, id), false);
        assert.deepEqual(errs, []);
      } finally { await contexte.close(); }
    }
  });
}
