import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lireDonnees, blocUrgentes, blocExemples, remplacerBloc, genererPage } from "../../scripts/landing.mjs";

const racine = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const donnees = lireDonnees(racine);
const page = fs.readFileSync(path.join(racine, "radar-des-dependances.html"), "utf8");

test("remplacerBloc remplace le contenu entre repères", () => {
  const html = "a<!-- debut:x -->ancien<!-- fin:x -->b";
  assert.equal(remplacerBloc(html, "x", "neuf"), "a<!-- debut:x -->neuf<!-- fin:x -->b");
});

test("remplacerBloc lève une erreur si un repère manque", () => {
  assert.throws(() => remplacerBloc("a<!-- debut:x -->b", "x", "c"), /fin:x/);
  assert.throws(() => remplacerBloc("a<!-- fin:x -->b", "x", "c"), /debut:x/);
});

test("blocUrgentes : tendances d’anneau 0, liens et échappement", () => {
  const d = { tendances: [
    { id: "a", titre: "Alpha <b>", quadrant: 1, anneau: 0, risque: "Premier & fort. Second.", technologies: [] },
    { id: "b", titre: "Beta", quadrant: 0, anneau: 0, risque: "Juridique ! Suite.", technologies: [] },
    { id: "c", titre: "Gamma", quadrant: 0, anneau: 2, risque: "Autre.", technologies: [] },
  ], technologies: [] };
  const h = blocUrgentes(d);
  assert.equal((h.match(/<li/g) || []).length, 2);
  assert.ok(h.includes('href="tendances/a.html"') && h.includes('href="tendances/b.html"'));
  assert.ok(!h.includes("tendances/c.html"));
  assert.ok(h.includes("Alpha &lt;b&gt;"));
  assert.ok(h.includes("Premier &amp; fort."));
  assert.ok(!h.includes("Second."));
  assert.ok(h.indexOf("Beta") < h.indexOf("Alpha"), "tri par axe puis titre");
});

test("blocExemples : 9 entrées au plus, alternatives mieux classées", () => {
  const h = blocExemples(donnees);
  const n = (h.match(/<li class="exemple /g) || []).length;
  assert.ok(n > 0 && n <= 9, "entrées : " + n);
  const parNom = new Map(donnees.technologies.map(t => [t.nom, t]));
  const re = /data-anneau="(\d)" data-alt="(\d)"/g;
  let m, vus = 0;
  while ((m = re.exec(h))) { vus++; assert.ok(Number(m[2]) > Number(m[1])); }
  assert.equal(vus, n);
  assert.ok(parNom.size > 0);
});

test("chaque lien de fiche généré correspond à un id existant", () => {
  const ids = new Set([...donnees.tendances, ...donnees.technologies].map(x => x.id));
  const liens = [...genererPage(page, donnees).matchAll(/(?:tendances|technologies)\/([\w-]+)\.html/g)].map(m => m[1]);
  assert.ok(liens.length > 0);
  for (const id of liens) assert.ok(ids.has(id), "id inconnu : " + id);
});

test("la page du dépôt est à jour", () => {
  assert.equal(genererPage(page, donnees), page);
});

test("la vérification détecte une donnée modifiée", () => {
  const d = { ...donnees, tendances: donnees.tendances.map((t, i) => i === 0 ? { ...t, titre: t.titre + " modifié", anneau: 0 } : t) };
  assert.notEqual(genererPage(page, d), page);
});
