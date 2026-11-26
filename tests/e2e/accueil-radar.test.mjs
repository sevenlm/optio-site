// Page d’accueil du radar (radar-des-dependances.html) : structure, actions, contribution,
// compteurs lus dans data/*.json (avec repli), ancres sous l’en-tête collant, mobile, mode sombre.
// Prérequis : python3 -m http.server 8765 à la racine du dépôt (voir outils.mjs).
// Captures (img/radar/*) : générées par scripts/captures.mjs, vérifiées par les tests « images ».
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import { BASE, lireJeton } from "./outils.mjs";
const SELECTION = createRequire(import.meta.url)("../../js/selection.js");

const PAGE = "radar-des-dependances.html";
const lireJson = (nom) => JSON.parse(readFileSync(new URL("../../data/" + nom + ".json", import.meta.url), "utf8"));

let navigateur;
before(async () => { navigateur = await chromium.launch({ channel: "chrome" }); });
after(async () => { await navigateur.close(); });

// Erreurs JavaScript de la page ; les ressources absentes (images de la Tâche 3, données
// coupées volontairement) ne sont pas des erreurs de script.
function erreursJs(page) {
  const liste = [];
  page.on("pageerror", (e) => liste.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/^Failed to load resource/.test(m.text())) liste.push(m.text());
  });
  return liste;
}

async function ouvrirAccueil(options = {}, preparer) {
  const contexte = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, ...options });
  const page = await contexte.newPage();
  const errs = erreursJs(page);
  if (preparer) await preparer(page);
  await page.goto(BASE + PAGE);
  await page.waitForLoadState("networkidle");
  return { contexte, page, errs };
}

// Rapport de contraste WCAG entre la couleur du texte et le fond du plus proche ancêtre opaque.
function contrasteDe(el) {
  function rgb(s) { const m = s.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1 }; }
  function lum(c) {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }
  let n = el, fond = null;
  while (n && n.nodeType === 1) {
    const c = rgb(getComputedStyle(n).backgroundColor);
    if (c.a > 0) { fond = c; break; }
    n = n.parentElement;
  }
  if (!fond) fond = { r: 255, g: 255, b: 255 };
  const t = rgb(getComputedStyle(el).color);
  const l1 = lum(t), l2 = lum(fond);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

test("structure : un h1, sections dans l’ordre, notions de « Comprendre le radar »", async () => {
  const { contexte, page, errs } = await ouvrirAccueil();
  try {
    const h1 = await page.$$eval("h1", (l) => l.map((h) => h.textContent.trim()));
    assert.deepEqual(h1, ["Où votre système d’information est-il enfermé ?"]);
    const ordre = ["constat", "fonctionnement", "comprendre", "urgentes", "exemples", "rapport", "confiance", "contribuer", "faq"];
    const trouves = await page.$$eval("section[id]", (l) => l.map((s) => s.id));
    assert.deepEqual(trouves.filter((id) => ordre.includes(id)), ordre);
    const titres = await page.$$eval("#comprendre h3, #comprendre dt", (l) => l.map((x) => x.textContent.toLowerCase()));
    for (const terme of ["tendance", "technologie", "mécanisme", "levier", "matrice"]) {
      assert.ok(titres.some((t) => t.includes(terme)), "notion absente de #comprendre : " + terme + " dans " + JSON.stringify(titres));
    }
    // repères du contenu généré (Tâche 2), dans leurs sections
    const html = await page.content();
    assert.match(html, /<section[^>]*id="urgentes"[\s\S]*<!-- debut:urgentes -->[\s\S]*<!-- fin:urgentes -->[\s\S]*<section[^>]*id="exemples"/);
    assert.match(html, /<section[^>]*id="exemples"[\s\S]*<!-- debut:exemples -->[\s\S]*<!-- fin:exemples -->[\s\S]*<section[^>]*id="rapport"/);
    // emplacements d’images (Tâche 3)
    for (const id of ["img-radar", "img-technologies", "img-mecanismes", "img-leviers", "img-rapport-garde", "img-rapport-synthese", "img-rapport-leviers"]) {
      const im = await page.$eval("#" + id, (i) => ({ tag: i.tagName, src: i.getAttribute("src"), w: i.getAttribute("width"), h: i.getAttribute("height"), alt: i.getAttribute("alt") }));
      assert.equal(im.tag, "IMG", id);
      assert.match(im.src, /^img\/radar\/[a-z-]+\.jpg$/, id);
      assert.ok(+im.w > 0 && +im.h > 0 && im.alt.trim().length > 10, id + " : " + JSON.stringify(im));
    }
    assert.deepEqual(errs, []);
  } finally { await contexte.close(); }
});

test("actions : « Ouvrir le radar » partout vers radar.html, exemple de rapport", async () => {
  const { contexte, page, errs } = await ouvrirAccueil();
  try {
    const liens = await page.$$eval("a", (l) => l.filter((a) => a.textContent.trim() === "Ouvrir le radar")
      .map((a) => ({ href: a.getAttribute("href"), zone: a.closest("header") ? "entete" : a.closest(".hero") ? "accroche" : a.closest(".final") ? "final" : "autre" })));
    assert.ok(liens.length >= 3, JSON.stringify(liens));
    for (const l of liens) assert.equal(l.href, "radar.html");
    for (const zone of ["entete", "accroche", "final"]) assert.ok(liens.some((l) => l.zone === zone), "« Ouvrir le radar » absent : " + zone);
    const exemple = await page.$$eval("a", (l) => l.filter((a) => a.textContent.trim() === "Voir un exemple de rapport").map((a) => a.getAttribute("href")));
    assert.ok(exemple.length >= 1);
    for (const h of exemple) assert.equal(h, "#rapport");
    const rapport = await page.$$eval("#rapport a[href^='radar.html?rapport=1&r=']", (l) => l.map((a) => a.getAttribute("href")));
    assert.equal(rapport.length, 1);
    const sel = lireJeton(new URL(rapport[0], BASE).searchParams.get("r"));
    assert.deepEqual(sel, {
      tendances: ["fin-des-licences-perpetuelles", "dependance-cognitive-a-lassistant-ia", "penurie-de-competences-cyber-face-a-nis2"],
      technologies: ["vmware-vsphere-et-vcf", "oracle-database", "microsoft-365", "github-copilot"],
      date: "2026-11-25",
    });
    assert.deepEqual(errs, []);
  } finally { await contexte.close(); }
});

test("contribuer : quatre objets préremplis, contact aussi dans la FAQ et le pied", async () => {
  const { contexte, page, errs } = await ouvrirAccueil();
  try {
    const objets = await page.$$eval("#contribuer a[href^='mailto:contact@stratwise.fr?subject=']",
      (l) => l.map((a) => decodeURIComponent(a.getAttribute("href").split("subject=")[1])));
    assert.deepEqual(objets.sort(), [
      "Radar : proposer une tendance",
      "Radar : signaler une erreur ou une source",
      "Radar : proposer une technologie ou une alternative",
      "Radar : relecture d’expert",
    ].sort());
    assert.ok(await page.locator("#faq a[href^='mailto:contact@stratwise.fr']").count() >= 1, "FAQ sans contact");
    assert.ok(await page.locator("footer a[href^='mailto:contact@stratwise.fr']").count() >= 1, "pied sans contact");
    assert.deepEqual(errs, []);
  } finally { await contexte.close(); }
});

const NOMS = ["tendances", "technologies", "mecanismes", "leviers"];
const lireCompteurs = (page) => page.$$eval("[data-compteur]", (l) => l.map((x) => [x.dataset.compteur, x.textContent.trim()]));

test("compteurs : valeurs lues dans data/*.json", async () => {
  const { contexte, page, errs } = await ouvrirAccueil();
  try {
    const attendus = Object.fromEntries(NOMS.map((n) => [n, String(lireJson(n).length)]));
    await page.waitForFunction((a) => [...document.querySelectorAll("[data-compteur]")]
      .every((x) => x.textContent.trim() === a[x.dataset.compteur]), attendus);
    const valeurs = await lireCompteurs(page);
    for (const n of NOMS) assert.ok(valeurs.some(([k]) => k === n), "compteur absent : " + n);
    for (const [k, v] of valeurs) assert.equal(v, attendus[k], k);
    assert.deepEqual(errs, []);
  } finally { await contexte.close(); }
});

test("compteurs : suivent les données sans relancer quoi que ce soit (liste de 7 tendances simulée)", async () => {
  const { contexte, page, errs } = await ouvrirAccueil({}, (p) => p.route("**/data/tendances.json",
    (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify(Array.from({ length: 7 }, (_, i) => ({ id: "t" + i }))) })));
  try {
    await page.waitForFunction(() => [...document.querySelectorAll("[data-compteur=tendances]")].every((x) => x.textContent === "7"), null, { timeout: 5000 });
    assert.equal(await page.textContent("[data-compteur=technologies]"), String(lireJson("technologies").length));
    assert.deepEqual(errs, []);
  } finally { await contexte.close(); }
});

test("compteurs : données injoignables,valeurs écrites dans la page et aucune erreur", async () => {
  const brut = readFileSync(new URL("../../" + PAGE, import.meta.url), "utf8");
  const ecrits = [...brut.matchAll(/data-compteur="([a-z]+)">([^<]*)</g)].map((m) => [m[1], m[2].trim()]);
  assert.ok(ecrits.length >= 4);
  for (const [k, v] of ecrits) assert.ok(NOMS.includes(k) && /^\d+$/.test(v), k + "=" + v);
  const { contexte, page, errs } = await ouvrirAccueil({}, (p) => p.route("**/data/*.json", (r) => r.abort()));
  try {
    assert.deepEqual(await lireCompteurs(page), ecrits);
    assert.deepEqual(errs, []);
  } finally { await contexte.close(); }
});

test("ancres : le titre de la section atteinte reste sous l’en-tête collant", async () => {
  // défilement instantané (prefers-reduced-motion) : on vérifie la position d’arrivée, pas
  // l’animation, qui dépasse le délai quand toute la suite tourne en parallèle
  const { contexte, page, errs } = await ouvrirAccueil({ reducedMotion: "reduce" });
  try {
    for (const id of ["faq", "rapport", "comprendre"]) {
      await page.evaluate((h) => { location.hash = h; }, "#" + id);
      await page.waitForFunction((i) => {
        // le titre et le haut de la section (scroll-margin-top) restent sous l’en-tête collant
        const t = document.querySelector("#" + i + " h2").getBoundingClientRect().top;
        const s = document.getElementById(i).getBoundingClientRect().top;
        const e = document.querySelector("header").getBoundingClientRect().bottom;
        return t >= e && s >= e - 1 && t < innerHeight;
      }, id, { timeout: 4000 });
    }
    assert.deepEqual(errs, []);
  } finally { await contexte.close(); }
});

test("mobile 390 px : pas de débordement, « Ouvrir le radar » visible dans l’en-tête", async () => {
  for (const colorScheme of ["light", "dark"]) {
    const { contexte, page, errs } = await ouvrirAccueil({ viewport: { width: 390, height: 844 }, colorScheme });
    try {
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth) <= 390, "débordement horizontal");
      assert.equal(await page.locator("header a", { hasText: "Ouvrir le radar" }).isVisible(), true);
      assert.deepEqual(errs, []);
    } finally { await contexte.close(); }
  }
});

test("contrastes AA en clair et en sombre : textes de section et boutons", async () => {
  for (const colorScheme of ["dark", "light"]) {
    const { contexte, page, errs } = await ouvrirAccueil({ colorScheme });
    try {
      const comprendre = await page.$$eval("#comprendre p", (l, f) => l.map((p) => [p.textContent.slice(0, 40), new Function("return " + f)()(p)]), contrasteDe.toString());
      assert.ok(comprendre.length > 0);
      for (const [t, r] of comprendre) assert.ok(r >= 4.5, colorScheme + " #comprendre p « " + t + " » : " + r.toFixed(2));
      const autres = await page.$$eval("main p, main li, main dd, main summary, .btn, footer p, footer a", (l, f) => {
        const c = new Function("return " + f)();
        return l.filter((x) => x.offsetParent !== null && x.textContent.trim()).map((x) => [x.tagName + "." + x.className + " « " + x.textContent.trim().slice(0, 30) + " »", c(x)]);
      }, contrasteDe.toString());
      for (const [t, r] of autres) assert.ok(r >= 4.5, colorScheme + " " + t + " : " + r.toFixed(2));
      assert.deepEqual(errs, []);
    } finally { await contexte.close(); }
  }
});

// Captures générées par scripts/captures.mjs (npm run captures).
test("images : chargées, dimensionnées, priorités, image de partage 1200 × 630, JPEG < 250 Ko", async () => {
  const { contexte, page, errs } = await ouvrirAccueil();
  try {
    const ids = await page.$$eval("img", (l) => l.map((i) => i.id));
    assert.ok(ids.length >= 7, JSON.stringify(ids));
    for (const id of ids) {
      const im = page.locator("#" + id);
      await im.scrollIntoViewIfNeeded();
      await page.waitForFunction((i) => { const e = document.getElementById(i); return e.complete; }, id);
      const d = await im.evaluate((i) => ({ nw: i.naturalWidth, nh: i.naturalHeight, w: i.getAttribute("width"), h: i.getAttribute("height"),
        alt: (i.getAttribute("alt") || "").trim(), prio: i.getAttribute("fetchpriority"), lazy: i.getAttribute("loading"), hero: !!i.closest(".hero") }));
      assert.ok(d.nw > 0, id + " ne se charge pas");
      assert.ok(d.alt.length > 0, id + " sans alt");
      assert.equal(+d.w, d.nw, id + " : width ≠ largeur réelle");
      assert.equal(+d.h, d.nh, id + " : height ≠ hauteur réelle");
      if (d.hero) { assert.equal(d.prio, "high", id); assert.notEqual(d.lazy, "lazy", id); }
      else assert.equal(d.lazy, "lazy", id);
    }
    assert.equal(await page.locator(".hero img[fetchpriority='high']").count(), 1);
    // image de partage : en-tête PNG (IHDR) 1200 × 630
    const png = readFileSync(new URL("../../img/radar/partage.png", import.meta.url));
    assert.equal(png.toString("latin1", 1, 4), "PNG");
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1200, 630]);
    const dossier = new URL("../../img/radar/", import.meta.url);
    const jpegs = readdirSync(dossier).filter((f) => f.endsWith(".jpg"));
    assert.ok(jpegs.length >= 7, JSON.stringify(jpegs));
    for (const f of jpegs) {
      const ko = statSync(new URL(f, dossier)).size / 1024;
      assert.ok(ko < 250, f + " : " + ko.toFixed(0) + " Ko");
    }
    assert.deepEqual(errs, []);
  } finally { await contexte.close(); }
});

test("images : le lien du rapport d’exemple utilise la sélection des captures", async () => {
  const { SELECTION_EXEMPLE } = await import("../../scripts/captures.mjs");
  const { contexte, page } = await ouvrirAccueil();
  try {
    const href = await page.$eval("#rapport a[href^='radar.html?rapport=1&r=']", (a) => a.getAttribute("href"));
    assert.equal(href, SELECTION.urlRapport("radar.html", SELECTION_EXEMPLE));
  } finally { await contexte.close(); }
});
