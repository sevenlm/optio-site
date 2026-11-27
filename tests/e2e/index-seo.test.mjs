// Référencement de la page d’accueil Optio (index.html) : balises du head, mots clés visibles
// et données structurées JSON-LD fidèles au texte de la FAQ.
// Prérequis : python3 -m http.server 8765 à la racine du dépôt (voir outils.mjs).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { BASE, contrasteDe } from "./outils.mjs";

const SITE = "https://www.weareoptio.fr/";
const net = (s) => String(s).replace(/\s+/g, " ").trim();

let navigateur, contexte, page;
before(async () => {
  navigateur = await chromium.launch({ channel: "chrome" });
  contexte = await navigateur.newContext({ viewport: { width: 1280, height: 900 } });
  page = await contexte.newPage();
  await page.goto(BASE + "index.html");
  await page.waitForLoadState("networkidle");
});
after(async () => { await contexte.close(); await navigateur.close(); });

test("accueil : title, description, canonique, Open Graph", async () => {
  const titre = await page.title();
  assert.ok(titre.length <= 60, "title trop long (" + titre.length + ") : " + titre);
  assert.match(titre, /^Optio \| .*dépendance numérique/i);
  const meta = (sel) => page.$eval(sel, (m) => m.getAttribute("content")).catch(() => null);
  const desc = await meta('meta[name="description"]');
  assert.ok(desc && desc.length >= 70 && desc.length <= 155, "description (" + (desc || "").length + ") : " + desc);
  assert.equal(await page.$eval('link[rel="canonical"]', (l) => l.getAttribute("href")), SITE);
  assert.equal(await meta('meta[property="og:url"]'), SITE);
  assert.equal(await meta('meta[property="og:image"]'), SITE + "img/radar/partage.png");
});

test("accueil : mots clés présents dans le texte visible", async () => {
  const texte = net(await page.$eval("main", (m) => m.innerText)).toLowerCase();
  for (const mot of ["dépendances numériques", "réversibilité", "souveraineté numérique", "indice de résilience numérique (irn)", "dora"]) {
    assert.ok(texte.includes(mot), "mot clé absent : " + mot);
  }
});

test("accueil : JSON-LD valide, organisation et FAQ fidèle à la page", async () => {
  const blocs = await page.$$eval('script[type="application/ld+json"]', (l) => l.map((s) => s.textContent));
  assert.equal(blocs.length, 1);
  const graphe = JSON.parse(blocs[0])["@graph"];
  const deType = (t) => graphe.filter((o) => o["@type"] === t);
  const org = deType("Organization")[0];
  assert.equal(org.name, "Optio");
  assert.equal(org.url, SITE);
  assert.equal(org.parentOrganization.name, "Stratwise");
  const visibles = await page.$$eval(".faq details", (l) => l.map((d) => ({
    q: d.querySelector("summary").textContent, r: d.querySelector("summary ~ *").textContent,
  })));
  const faq = deType("FAQPage")[0].mainEntity;
  assert.equal(faq.length, visibles.length);
  faq.forEach((q, i) => {
    assert.equal(net(q.name), net(visibles[i].q));
    assert.equal(net(q.acceptedAnswer.text), net(visibles[i].r));
  });
});

const ECHELLE = "Estimation pour une entreprise de 2 000 à 20 000 salariés";

test("montants : indicateur de taille et cas 1 à l’échelle", async () => {
  for (const zone of ["#exemples", "#tableau"]) {
    assert.equal(net(await page.$eval(zone + " .echelle", (e) => e.textContent)), ECHELLE, zone);
  }
  const cas1 = net(await page.$eval("#exemples .cas", (e) => e.textContent));
  for (const t of ["600 k€ par an", "5,0 M€", "3,7 M€", "3,3 M€", "1,8 M€ économisés"]) assert.ok(cas1.includes(t), "cas 1 sans « " + t + " » : " + cas1.slice(0, 200));
});

test("haut de page : panneau d’indicateurs, plus de gros chiffres", async () => {
  assert.equal(await page.locator(".hero .chiffres").count(), 0);
  const panneau = await page.$$eval("#hero-panneau .ligne strong", (l) => l.map((e) => e.textContent));
  const kpis = await page.$$eval("#dash-kpis .kpi strong", (l) => l.map((e) => e.textContent));
  assert.equal(panneau.length, 4);
  assert.deepEqual(panneau, kpis);
  assert.equal(net(await page.$eval(".hero .echelle", (e) => e.textContent)), ECHELLE);
  const sources = await page.$eval(".hero .sources-hero", (e) => e.textContent);
  for (const s of ["Cigref", "Gartner", "Elée"]) assert.ok(sources.includes(s), s);
});

test("haut de page : contrastes AA du panneau en clair et en sombre", async () => {
  for (const colorScheme of ["light", "dark"]) {
    const ctx = await navigateur.newContext({ colorScheme, viewport: { width: 1280, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(BASE + "index.html"); await p.waitForSelector("#hero-panneau .ligne");
    const r = await p.$$eval("#hero-panneau span, #hero-panneau strong, .hero .sources-hero, .hero .echelle", (l, f) => l.map((x) => [x.textContent.slice(0, 30), new Function("return " + f)()(x)]), contrasteDe.toString());
    for (const [t, c] of r) assert.ok(c >= 4.5, colorScheme + " « " + t + " » : " + c.toFixed(2));
    await ctx.close();
  }
});

test("sections : sans étiquettes ni cartes, frise LIBRE, cas en tableaux", async () => {
  assert.equal(await page.locator("main p.sur").count(), 0);
  assert.deepEqual(await page.$$eval(".libre h3 b", (l) => l.map((b) => b.textContent)), ["L", "I", "B", "R", "E"]);
  const cas = await page.$$eval(".cas", (l) => l.map((c) => !!c.querySelector("table.scenarios")));
  assert.ok(cas.length === 4 && cas.every(Boolean), JSON.stringify(cas));
  for (const sel of [".cas", ".offre", ".libre li"]) {
    const st = await page.$eval(sel, (e) => { const s = getComputedStyle(e); return [s.borderTopLeftRadius, s.boxShadow]; });
    assert.deepEqual(st, ["0px", "none"], sel);
  }
});

test("sections : pas de défilement horizontal à 390 px", async () => {
  const ctx = await navigateur.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto(BASE + "index.html"); await p.waitForLoadState("networkidle");
  assert.ok(await p.evaluate(() => document.documentElement.scrollWidth) <= 390);
  await ctx.close();
});
