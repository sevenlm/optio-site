// Fiches statiques générées par scripts/fiches.mjs : une page par technologie et par tendance,
// balises de référencement, liens internes valides, plan du site complet.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lireDonnees } from "../../scripts/landing.mjs";
import { fichiers, couper, titreTechnologie, blocSitemap, SITE } from "../../scripts/fiches.mjs";

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const d = lireDonnees(RACINE);
const f = fichiers(d);
const attr = (html, re) => (html.match(re) || [])[1];

test("une page par technologie et par tendance, plus deux index", () => {
  assert.equal(f.size, d.technologies.length + d.tendances.length + 2);
  for (const t of d.technologies) assert.ok(f.has(`technologies/${t.id}.html`), t.id);
  for (const t of d.tendances) assert.ok(f.has(`tendances/${t.id}.html`), t.id);
});

test("title ≤ 60 caractères et unique, description entre 50 et 155, canonique", () => {
  const titres = new Set();
  for (const [chemin, html] of f) {
    const titre = attr(html, /<title>([^<]*)<\/title>/).replace(/&amp;/g, "&");
    assert.ok(titre.length <= 60, `${chemin} : ${titre}`);
    assert.ok(!titres.has(titre), "title en double : " + titre);
    titres.add(titre);
    const desc = attr(html, /<meta name="description" content="([^"]*)"/).replace(/&[a-z]+;/g, "x");
    assert.ok(desc.length >= 50 && desc.length <= 155, `${chemin} (${desc.length}) : ${desc}`);
    assert.equal(attr(html, /<link rel="canonical" href="([^"]*)"/), SITE + chemin.replace(/index\.html$/, ""));
    assert.equal((html.match(/<h1>/g) || []).length, 1, chemin);
  }
});

test("liens internes : chaque cible existe", () => {
  const existe = (cible) => f.has(cible) || f.has(cible + "index.html") || fs.existsSync(path.join(RACINE, cible));
  for (const [chemin, html] of f) {
    for (const [, href] of html.matchAll(/href="(\.\.\/[^"#?]*|[a-z0-9-]+\.html)(?:#[^"]*)?"/g)) {
      const cible = path.posix.normalize(path.posix.join(path.posix.dirname(chemin), href));
      assert.ok(existe(cible), `${chemin} → ${href}`);
    }
  }
});

test("couper et titres : bornes respectées", () => {
  assert.equal(couper("court", 10), "court");
  assert.ok(couper("un texte bien trop long pour tenir", 15).length <= 15);
  assert.equal(titreTechnologie("Proxmox VE"), "Sortir de Proxmox VE : alternatives | Optio");
  assert.ok(titreTechnologie("x".repeat(80)).length <= 60);
});

test("bloc du sitemap : une entrée par page générée", () => {
  const bloc = blocSitemap([...f.keys()]);
  for (const chemin of f.keys()) assert.ok(bloc.includes(`<loc>${SITE}${chemin.replace(/index\.html$/, "")}</loc>`), chemin);
  assert.match(fs.readFileSync(path.join(RACINE, "sitemap.xml"), "utf8"), /<!-- debut:fiches -->[\s\S]*<!-- fin:fiches -->/);
});
