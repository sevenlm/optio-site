// Demande du rapport : Tally chargé au clic seulement, repli, champs cachés, mention RGPD.
// Prérequis : python3 -m http.server 8765 à la racine du dépôt (voir outils.mjs).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { ouvrir, erreurs, lireJeton } from "./outils.mjs";
import { createRequire } from "node:module";
const decoderSelectionLisible = (q) => createRequire(import.meta.url)("../../js/selection.js").decoderSelection("?" + q);

const CLE = "optio-radar-selection";
const SEL = { technologies: ["tibco", "openstack"], tendances: ["fin-des-licences-perpetuelles"], date: "" };
let navigateur;
before(async () => { navigateur = await chromium.launch({ channel: "chrome" }); });
after(async () => { await navigateur.close(); });

function aujourdhui() {
  const d = new Date(), z = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
}

// config : script JS remplaçant js/config.js ; tally : "simule" | "echec" | undefined.
async function volet({ config, tally, viewport, scheme, hote } = {}) {
  const contexte = await navigateur.newContext({ viewport, colorScheme: scheme });
  const p = await contexte.newPage();
  const errs = erreurs(p);
  const requetes = [];
  p.on("request", (r) => requetes.push(r.url()));
  if (config !== undefined) await p.route("**/js/config.js", (r) => r.fulfill({ contentType: "text/javascript", body: config }));
  if (tally === "simule") await p.route("**/tally.so/widgets/embed.js", (r) => r.fulfill({ contentType: "text/javascript", body: "window.Tally = { openPopup: function(id, opts){ window.__tally = {id: id, opts: opts}; } };" }));
  if (tally === "vide") await p.route("**/tally.so/widgets/embed.js", (r) => r.fulfill({ contentType: "text/javascript", body: "/* sans Tally */" }));
  if (tally === "lent") await p.route("**/tally.so/widgets/embed.js", async (r) => { await new Promise((ok) => setTimeout(ok, 700)); await r.fulfill({ contentType: "text/javascript", body: "window.Tally = { openPopup: function(id, opts){ window.__n = (window.__n || 0) + 1; } };" }); });
  if (tally === "echec") await p.route("**/tally.so/**", (r) => r.abort());
  // Hôte non local simulé : les requêtes vers exemple.test sont servies par localhost:8765.
  if (hote) await contexte.route("http://" + hote + ":8765/**", async (r) => r.fulfill({ response: await r.fetch({ url: r.request().url().replace(hote, "localhost") }) }));
  const base = hote ? "http://" + hote + ":8765/" : undefined;
  if (base) { await p.goto(base + "radar.html"); await p.waitForSelector("#stats .stat"); } else await ouvrir(p, "radar.html");
  await p.evaluate(([c, s]) => localStorage.setItem(c, JSON.stringify(s)), [CLE, SEL]);
  await p.reload();
  await p.waitForSelector("#stats .stat");
  await p.locator("#mon-radar").click();
  await p.waitForSelector("#volet:not([hidden]) #demander-rapport");
  return { p, errs, requetes, fermer: () => contexte.close() };
}
const cfg = (id) => 'window.OPTIO_CONFIG = {tallyFormId:"' + id + '", calLien:"", urlSite:"http://localhost:8765/radar.html"};';

test("aucune requête vers tally.so avant le clic", async () => {
  const { p, errs, requetes, fermer } = await volet({ config: cfg("TEST"), tally: "simule" });
  try {
    await p.waitForTimeout(300);
    assert.equal(requetes.filter((u) => u.includes("tally.so")).length, 0);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("en local avec tallyFormId vide : ouverture directe du rapport", async () => {
  const { p, fermer } = await volet({ config: cfg("") });
  try {
    await Promise.all([p.waitForURL(/rapport=1/), p.locator("#demander-rapport").click()]);
    const u = new URL(p.url());
    assert.equal(u.pathname, "/radar.html");
    assert.equal(u.searchParams.get("rapport"), "1");
    const sel = lireJeton(u.searchParams.get("r"));
    assert.equal(sel.date, aujourdhui());
    for (const id of ["tibco", "openstack"]) assert.ok(sel.technologies.includes(id), id);
    assert.ok(sel.tendances.includes("fin-des-licences-perpetuelles"));
  } finally { await fermer(); }
});

test("script Tally en échec : message avec le lien du rapport", async () => {
  const { p, errs, fermer } = await volet({ config: cfg("TEST"), tally: "echec" });
  try {
    await p.locator("#demander-rapport").click();
    const m = p.locator(".tally-erreur");
    await m.waitFor({ state: "visible" });
    const txt = await m.innerText();
    assert.match(txt, /n’a pas pu s’ouvrir/);
    const sel = lireJeton(/[?&]r=([^\s&]+)/.exec(txt)[1]);
    assert.equal(sel.date, aujourdhui());
    assert.ok(sel.technologies.includes("tibco"));
    assert.match(txt, /contact@stratwise\.fr/);
    assert.ok(errs.every((e) => /tally|ERR_FAILED/i.test(e)), errs.join("\n"));
  } finally { await fermer(); }
});

test("tallyFormId vide hors local : message de repli, sans navigation", async () => {
  const { p, fermer } = await volet({ config: cfg(""), hote: "exemple.test" });
  try {
    await p.locator("#demander-rapport").click();
    await p.locator(".tally-erreur").waitFor({ state: "visible" });
    assert.ok(!/rapport=1/.test(p.url()));
    assert.match(await p.locator(".tally-erreur").innerText(), /rapport=1/);
  } finally { await fermer(); }
});

test("Tally simulé : champs cachés et redirection à l’envoi", async () => {
  const { p, errs, requetes, fermer } = await volet({ config: cfg("TEST"), tally: "simule" });
  try {
    await p.locator("#demander-rapport").click();
    await p.waitForFunction(() => window.__tally);
    const t = await p.evaluate(() => ({ id: window.__tally.id, h: window.__tally.opts.hiddenFields }));
    assert.equal(t.id, "TEST");
    // rapport : lien camouflé ; selection : lisible, réservée à Optio dans les réponses Tally
    assert.match(t.h.rapport, /^http:\/\/localhost:8765\/radar\.html\?rapport=1&r=2\.[A-Za-z0-9_-]+\.[a-z0-9]+$/);
    assert.match(t.h.selection, /^t=.*&x=.*&d=\d{4}-\d{2}-\d{2}$/);
    assert.ok(t.h.selection.endsWith("&d=" + aujourdhui()));
    assert.deepEqual(lireJeton(t.h.rapport.split("&r=")[1]), decoderSelectionLisible(t.h.selection));
    assert.ok(requetes.some((u) => u.includes("tally.so/widgets/embed.js")));
    await Promise.all([p.waitForURL(/rapport=1/), p.evaluate(() => window.__tally.opts.onSubmit({}))]);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("phrase d’information visible sous le bouton, mobile et mode sombre", async () => {
  const { p, fermer } = await volet({ config: cfg(""), viewport: { width: 390, height: 800 }, scheme: "dark" });
  try {
    const ph = p.locator(".rgpd-radar");
    await ph.scrollIntoViewIfNeeded();
    assert.ok(await ph.isVisible());
    const txt = await ph.innerText();
    for (const mot of ["Tally", "adresse IP", "trois ans", "contact@stratwise.fr"]) assert.ok(txt.includes(mot), mot);
    const bouton = await p.locator("#demander-rapport").boundingBox();
    const phrase = await ph.boundingBox();
    assert.ok(phrase.y >= bouton.y + bouton.height - 1);
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  } finally { await fermer(); }
});

test("script chargé sans Tally.openPopup : message de repli", async () => {
  const { p, fermer } = await volet({ config: cfg("TEST"), tally: "vide" });
  try {
    await p.locator("#demander-rapport").click();
    await p.locator(".tally-erreur").waitFor({ state: "visible" });
    assert.equal(await p.locator("script[data-tally]").count(), 0);
  } finally { await fermer(); }
});

test("double clic pendant le chargement : un seul script, une seule ouverture", async () => {
  const { p, fermer } = await volet({ config: cfg("TEST"), tally: "lent" });
  try {
    await p.locator("#demander-rapport").dblclick();
    await p.waitForFunction(() => window.__n >= 1);
    await p.waitForTimeout(300);
    assert.equal(await p.evaluate(() => window.__n), 1);
    assert.equal(await p.locator("script[data-tally]").count(), 1);
  } finally { await fermer(); }
});

test("en local avec une vraie config : le lien du rapport reste local", async () => {
  const prod = 'window.OPTIO_CONFIG = {tallyFormId:"TEST", calLien:"", urlSite:"https://optio.stratwise.fr/radar.html"};';
  const { p, errs, fermer } = await volet({ config: prod, tally: "simule" });
  try {
    await p.locator("#demander-rapport").click();
    await p.waitForFunction(() => window.__tally);
    const h = await p.evaluate(() => window.__tally.opts.hiddenFields);
    assert.ok(h.rapport.startsWith("http://localhost:8765/radar.html?rapport=1&"), h.rapport);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("hors local : le lien du rapport suit urlSite", async () => {
  const prod = 'window.OPTIO_CONFIG = {tallyFormId:"", calLien:"", urlSite:"https://optio.stratwise.fr/radar.html"};';
  const { p, fermer } = await volet({ config: prod, hote: "exemple.test" });
  try {
    await p.locator("#demander-rapport").click();
    const m = p.locator(".tally-erreur");
    await m.waitFor({ state: "visible" });
    assert.match(await m.innerText(), /https:\/\/optio\.stratwise\.fr\/radar\.html\?rapport=1&/);
    assert.match(await m.innerText(), /contact@stratwise\.fr/);
  } finally { await fermer(); }
});
