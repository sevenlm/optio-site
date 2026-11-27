// Référencement de la page d’accueil du radar (radar-des-dependances.html) : balises du head,
// données structurées JSON-LD (fidèles au texte visible), liens internes, maillage depuis
// index.html, radar.html et sitemap.xml, performance du chargement (scripts, polices).
// Prérequis : python3 -m http.server 8765 à la racine du dépôt (voir outils.mjs).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { BASE } from "./outils.mjs";

const PAGE = "radar-des-dependances.html";
const SITE = "https://www.weareoptio.fr/";
const CANONIQUE = SITE + PAGE;
const lire = (chemin) => readFileSync(new URL("../../" + chemin, import.meta.url), "utf8");
const net = (s) => String(s).replace(/\s+/g, " ").trim();

let navigateur;
before(async () => { navigateur = await chromium.launch({ channel: "chrome" }); });
after(async () => { await navigateur.close(); });

async function ouvrir(chemin = PAGE, attendre) {
  const contexte = await navigateur.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await contexte.newPage();
  await page.goto(BASE + chemin);
  if (attendre) await page.waitForSelector(attendre); else await page.waitForLoadState("networkidle");
  return { contexte, page };
}

// Tous les objets JSON-LD de la page, @graph déplié.
async function jsonLd(page) {
  const blocs = await page.$$eval('script[type="application/ld+json"]', (l) => l.map((s) => s.textContent));
  const objets = [];
  for (const b of blocs) {
    let d;
    assert.doesNotThrow(() => { d = JSON.parse(b); }, "JSON-LD invalide : " + b.slice(0, 120));
    for (const o of [].concat(d)) {
      if (o["@graph"]) objets.push(...o["@graph"]); else objets.push(o);
    }
  }
  return { blocs, objets };
}
const deType = (objets, t) => objets.filter((o) => [].concat(o["@type"]).includes(t));

test("balises : title, description, canonique, Open Graph, Twitter Card, langue", async () => {
  const { contexte, page } = await ouvrir();
  try {
    const titre = await page.title();
    assert.ok(titre.length <= 60, "title trop long (" + titre.length + ") : " + titre);
    assert.match(titre, /Radar des dépendances/);
    const meta = (sel) => page.$eval(sel, (m) => m.getAttribute("content")).catch(() => null);
    const desc = await meta('meta[name="description"]');
    assert.ok(desc && desc.length >= 70 && desc.length <= 155, "description (" + (desc || "").length + ") : " + desc);
    assert.equal(await page.$eval('link[rel="canonical"]', (l) => l.getAttribute("href")), CANONIQUE);
    assert.ok(await meta('meta[property="og:title"]'), "og:title absent");
    assert.ok(await meta('meta[property="og:description"]'), "og:description absent");
    assert.equal(await meta('meta[property="og:url"]'), CANONIQUE);
    assert.equal(await meta('meta[property="og:type"]'), "website");
    assert.equal(await meta('meta[property="og:image"]'), SITE + "img/radar/partage.png");
    assert.equal(await meta('meta[property="og:image:width"]'), "1200");
    assert.equal(await meta('meta[property="og:image:height"]'), "630");
    assert.ok(await meta('meta[property="og:image:alt"]'), "og:image:alt absent");
    assert.equal(await meta('meta[property="og:locale"]'), "fr_FR");
    assert.equal(await meta('meta[name="twitter:card"]'), "summary_large_image");
    assert.equal(await page.$eval("html", (h) => h.getAttribute("lang")), "fr");
    assert.equal(await page.locator("h1").count(), 1);
    // l’image de partage existe et a les dimensions annoncées
    const png = readFileSync(new URL("../../img/radar/partage.png", import.meta.url));
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1200, 630]);
  } finally { await contexte.close(); }
});

test("json-ld : JSON valide, types attendus, FAQ et glossaire fidèles à la page", async () => {
  const { contexte, page } = await ouvrir();
  try {
    const { blocs, objets } = await jsonLd(page);
    assert.ok(blocs.length >= 1, "aucun bloc JSON-LD");
    for (const t of ["WebPage", "WebApplication", "Organization", "BreadcrumbList", "FAQPage", "DefinedTermSet"]) {
      assert.equal(deType(objets, t).length, 1, "type " + t + " : " + deType(objets, t).length);
    }
    // FAQ : mêmes questions et réponses que le texte visible de #faq
    const visibles = await page.$$eval("#faq details", (l) => l.map((d) => ({
      q: d.querySelector("summary").textContent, r: d.querySelector("summary ~ *").textContent,
    })));
    const faq = deType(objets, "FAQPage")[0].mainEntity;
    assert.equal(faq.length, visibles.length);
    faq.forEach((q, i) => {
      assert.equal(q["@type"], "Question");
      assert.equal(net(q.name), net(visibles[i].q));
      assert.equal(q.acceptedAnswer["@type"], "Answer");
      assert.equal(net(q.acceptedAnswer.text), net(visibles[i].r));
    });
    // confidentialité : la finalité de l’e-mail, mot pour mot comme sous le bouton du radar
    const finalite = lire("radar.html").match(/Votre e-mail sert à ([^.]+)\./)[1];
    const conf = faq.find((q) => /données/.test(q.name));
    assert.ok(net(conf.acceptedAnswer.text).includes("sert à " + finalite), "FAQ : finalité absente : " + finalite);
    // glossaire : les cinq notions de #comprendre
    const notions = await page.$$eval("#comprendre h3", (l) => l.map((h) => h.textContent));
    const termes = deType(objets, "DefinedTermSet")[0].hasDefinedTerm;
    assert.equal(termes.length, 5);
    assert.deepEqual(termes.map((t) => net(t.name)), notions.map(net));
    for (const t of termes) assert.ok(t["@type"] === "DefinedTerm" && t.description.length > 40, JSON.stringify(t));
    // application gratuite
    const app = deType(objets, "WebApplication")[0];
    assert.equal(app.name, "Radar des dépendances numériques");
    assert.equal(app.url, SITE + "radar.html");
    assert.equal(app.applicationCategory, "BusinessApplication");
    assert.equal(app.operatingSystem, "Web");
    assert.equal(app.inLanguage, "fr");
    assert.equal(app.offers.price, "0");
    assert.equal(app.offers.priceCurrency, "EUR");
    // organisation : Optio, marque de Stratwise
    const org = deType(objets, "Organization")[0];
    assert.equal(org.name, "Optio");
    assert.equal(org.url, SITE);
    const logo = org.logo && (org.logo.url || org.logo);
    assert.ok(logo && logo.startsWith(SITE), "logo absent");
    assert.equal((await fetch(new URL(logo.slice(SITE.length), BASE))).status, 200, logo);
    assert.equal(org.parentOrganization && org.parentOrganization.name, "Stratwise");
    // fil d’Ariane : Optio → Radar des dépendances
    const fil = deType(objets, "BreadcrumbList")[0].itemListElement;
    assert.deepEqual(fil.map((e) => [e.position, e.name, e.item]), [[1, "Optio", SITE], [2, "Radar des dépendances", CANONIQUE]]);
    // page
    const wp = deType(objets, "WebPage")[0];
    assert.equal(wp.url, CANONIQUE);
    assert.equal(wp.inLanguage, "fr");
  } finally { await contexte.close(); }
});

test("liens internes : chaque href et src relatif répond 200, chaque ancre a sa cible", async () => {
  const { contexte, page } = await ouvrir();
  try {
    const refs = await page.$$eval("[href], [src]", (l) => l.flatMap((e) => ["href", "src"].map((a) => e.getAttribute(a)).filter(Boolean)));
    const relatifs = [...new Set(refs.filter((h) => !/^(https?:|mailto:|data:|tel:|\/\/)/.test(h)))];
    assert.ok(relatifs.length > 10, JSON.stringify(relatifs));
    const ids = await page.$$eval("[id]", (l) => l.map((e) => e.id));
    for (const h of relatifs) {
      if (h.startsWith("#")) { assert.ok(h === "#" || ids.includes(h.slice(1)), "ancre sans cible : " + h); continue; }
      const url = new URL(h, BASE + PAGE);
      url.hash = "";
      const r = await fetch(url);
      assert.equal(r.status, 200, h);
    }
  } finally { await contexte.close(); }
});

test("maillage : sitemap, menu et pied de index.html, en-tête de radar.html", async () => {
  const sitemap = lire("sitemap.xml");
  assert.match(sitemap, new RegExp("<url><loc>" + CANONIQUE.replace(/\./g, "\\.") + "</loc><lastmod>\\d{4}-\\d{2}-\\d{2}</lastmod></url>"));
  // pages principales datées ; les fiches générées (technologies/, tendances/) n’ont pas de lastmod
  for (const loc of sitemap.match(/<url>.*?<\/url>/g).filter((l) => !/\/(technologies|tendances)\//.test(l))) assert.match(loc, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/, loc);

  let { contexte, page } = await ouvrir("index.html");
  try {
    for (const zone of ["header nav", "main", "footer"]) {
      assert.ok(await page.locator(zone + ' a[href="' + PAGE + '"]').count() >= 1, "lien absent de index.html : " + zone);
    }
  } finally { await contexte.close(); }

  ({ contexte, page } = await ouvrir("radar.html", "#stats .stat"));
  try {
    const lien = page.locator('.entete a[href="' + PAGE + '"]');
    assert.equal(await lien.count(), 1);
    assert.equal(await lien.isVisible(), true);
    assert.match(await lien.textContent(), /Découvrir le radar/);
  } finally { await contexte.close(); }

  // en mode rapport, le lien de découverte disparaît
  ({ contexte, page } = await ouvrir("radar.html?rapport=1", ".entete a.rapport-retour"));
  try {
    assert.equal(await page.locator('.entete a[href="' + PAGE + '"]').isVisible(), false);
  } finally { await contexte.close(); }
});

test("performance : aucun script bloquant dans le head, polices préchargées", async () => {
  const { contexte, page } = await ouvrir();
  try {
    const bloquants = await page.$$eval("head script", (l) => l.filter((s) => {
      const t = (s.getAttribute("type") || "").trim();
      const js = !t || /javascript|module/.test(t);
      return js && !s.defer && !s.async && t !== "module";
    }).map((s) => s.outerHTML.slice(0, 80)));
    assert.deepEqual(bloquants, []);
    const polices = await page.$$eval('link[rel="preload"][as="font"]', (l) => l.map((x) => ({
      href: x.getAttribute("href"), type: x.getAttribute("type"), co: x.hasAttribute("crossorigin"),
    })));
    assert.ok(polices.length >= 1, "aucune police préchargée");
    const css = lire("fonts/fonts.css");
    for (const p of polices) {
      assert.ok(p.co, "preload sans crossorigin : " + p.href);
      assert.equal(p.type, "font/woff2");
      assert.ok(css.includes(p.href.replace(/^fonts\//, "")), "police préchargée absente de fonts.css : " + p.href);
      assert.equal((await fetch(new URL(p.href, BASE))).status, 200, p.href);
    }
    // toutes les images ont dimensions et alt ; seule la principale est prioritaire
    const imgs = await page.$$eval("img", (l) => l.map((i) => ({ id: i.id, w: i.getAttribute("width"), h: i.getAttribute("height"), alt: i.getAttribute("alt"), fp: i.getAttribute("fetchpriority"), ll: i.getAttribute("loading") })));
    for (const i of imgs) assert.ok(+i.w > 0 && +i.h > 0 && i.alt, JSON.stringify(i));
    assert.deepEqual(imgs.filter((i) => i.fp === "high").map((i) => i.id), ["img-radar"]);
    for (const i of imgs.filter((i) => i.fp !== "high")) assert.equal(i.ll, "lazy", i.id);
  } finally { await contexte.close(); }
});
