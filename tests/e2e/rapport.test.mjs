// Rapport personnalisé (radar.html?rapport=1&r=<jeton>) : contenu, rendez-vous, copie du lien, impression.
// Prérequis : python3 -m http.server 8765 à la racine du dépôt (voir outils.mjs).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { BASE, erreurs, adresseRapport } from "./outils.mjs";

const CAL = "https://cal.example.test/optio/15min";
const cfg = (cal) => "window.OPTIO_CONFIG = {tallyFormId:\"\", calLien:" + JSON.stringify(cal) + ", urlSite:\"http://localhost:8765/radar.html\"};";
// VMware (anneau 0) et OpenStack (anneau 2), une tendance d’urgence forte
const ADRESSE = adresseRapport("t=fin-des-licences-perpetuelles&x=vmware-vsphere-et-vcf,openstack&d=2026-11-23");

let navigateur;
before(async () => { navigateur = await chromium.launch({ channel: "chrome" }); });
after(async () => { await navigateur.close(); });

async function rapport(chemin, { cal = CAL, viewport, scheme, permissions, sansPressePapiers } = {}) {
  const contexte = await navigateur.newContext({ viewport, colorScheme: scheme, permissions });
  const p = await contexte.newPage();
  const errs = erreurs(p);
  await p.route("**/js/config.js", (r) => r.fulfill({ contentType: "text/javascript", body: cfg(cal) }));
  if (sansPressePapiers) await p.addInitScript(() => { Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true }); });
  await p.goto(BASE + chemin);
  await p.waitForSelector("#rapport[data-etat]");
  return { p, errs, fermer: () => contexte.close() };
}

// Données brutes, lues par la page elle-même
async function donnees(p) {
  return p.evaluate(async () => {
    const noms = ["tendances", "technologies", "mecanismes", "leviers"];
    const r = await Promise.all(noms.map((n) => fetch("data/" + n + ".json").then((x) => x.json())));
    const idx = (l) => Object.fromEntries(l.map((x) => [x.id, x]));
    return { tend: idx(r[0]), tech: idx(r[1]), meca: idx(r[2]), lev: idx(r[3]) };
  });
}

test("rapport : page de garde, synthèse, technologies, tendances, mécanismes, sources, rendez-vous", async () => {
  const { p, errs, fermer } = await rapport(ADRESSE);
  try {
    const d = await donnees(p);
    const vm = d.tech["vmware-vsphere-et-vcf"], os = d.tech["openstack"], fl = d.tend["fin-des-licences-perpetuelles"];
    assert.equal(await p.locator("#rapport").getAttribute("data-etat"), "complet");
    const garde = await p.locator(".rapport-garde").innerText();
    assert.match(garde, /23 novembre 2026/);
    for (const t of [vm.nom, os.nom, fl.titre]) assert.ok(garde.includes(t), "page de garde sans « " + t + " »");

    const titres = (await p.locator("#rapport h2").allInnerTexts()).map((t) => t.trim());
    for (const t of ["Synthèse", "Mécanismes probables", "Sources"]) assert.ok(titres.includes(t), "section manquante : " + t + " dans " + titres);
    assert.equal(titres[titres.length - 1], "Analysons ce rapport ensemble, 15 minutes");

    // Synthèse : mêmes nombres que l’aperçu (synthese() sur la même sélection)
    const sy = await p.evaluate(() => {
      const sel = OptioSelection.selectionDepuisAdresse(location.search);
      return Promise.all(["tendances", "technologies", "mecanismes", "leviers"].map((n) => fetch("data/" + n + ".json").then((x) => x.json())))
        .then((r) => { const s = OptioSelection.synthese(sel, { tendances: r[0], technologies: r[1], mecanismes: r[2], leviers: r[3] }); return { parAnneau: s.parAnneau, urgentes: s.urgentes, nm: s.mecanismes.length }; });
    });
    const synth = p.locator(".rapport-synthese");
    assert.deepEqual(await synth.locator(".barre-anneau .n").allInnerTexts(), sy.parAnneau.map(String));
    assert.deepEqual(sy.parAnneau, [1, 0, 1, 0]);
    assert.match(await synth.innerText(), /2 technologies/);
    assert.match(await synth.innerText(), /1 tendance, dont 1 urgente/);

    // Une section par technologie, triées par anneau
    const techs = p.locator(".rapport-techno");
    assert.equal(await techs.count(), 2);
    const t0 = await techs.nth(0).innerText();
    assert.ok(t0.includes(vm.nom));
    assert.match(t0, /Sortie difficile/);
    assert.match(t0, /Pourquoi/);
    assert.ok(t0.includes(vm.pourquoi), "pourquoi absent");
    assert.ok(t0.includes(vm.dependance), "dépendance absente");
    assert.match(await techs.nth(0).locator(".rapport-alternatives").innerText(), /Proxmox VE/);
    assert.ok(t0.includes(fl.titre), "tendance concernée absente");
    assert.equal(await techs.nth(0).locator('a[href="' + vm.site + '"]').count(), 1);
    const t1 = await techs.nth(1).innerText();
    assert.ok(t1.includes(os.nom));
    assert.match(t1, /Sortie maîtrisable/);
    // pour OpenStack (anneau 2), seules les alternatives d’anneau 3 sont « mieux classées » ; Proxmox VE (3) en est
    assert.match(await techs.nth(1).locator(".rapport-alternatives").innerText(), /Proxmox VE/);

    // Une section par tendance : risque, leviers avec commentaire
    const tends = p.locator(".rapport-tendance");
    assert.equal(await tends.count(), 1);
    const tt = await tends.nth(0).innerText();
    assert.ok(tt.includes(fl.titre) && tt.includes(fl.risque), "risque absent");
    for (const l of fl.leviers) {
      assert.ok(tt.includes(d.lev[l.id].titre), "levier absent : " + l.id);
      assert.ok(tt.includes(l.commentaire), "commentaire absent : " + l.id);
    }

    // Mécanismes probables, avec leurs parades
    const mecas = await p.locator(".rapport-meca").allInnerTexts();
    assert.equal(mecas.length, sy.nm);
    const m0 = d.meca[fl.mecanismes[0]];
    assert.ok(mecas.join(" ").includes(m0.nom));
    assert.ok(mecas.join(" ").includes(d.lev[m0.leviers[0].id].titre), "parade du mécanisme absente");

    // Sources citées
    const sources = p.locator(".rapport-sources");
    for (const s of [...vm.sources, ...fl.sources]) assert.equal(await sources.locator('a[href="' + s.url + '"]').count(), 1, "source absente : " + s.url);

    assert.doesNotMatch(await p.locator("#rapport").innerText(), /[€$]/);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("rapport : radar masqué, onglets et filtres absents, ancre ignorée", async () => {
  const { p, errs, fermer } = await rapport(ADRESSE + "#openstack");
  try {
    for (const s of [".vues", "#bande", "#contenu", "#mon-radar"]) assert.equal(await p.locator(s).isVisible(), false, s + " visible");
    assert.equal(await p.locator("#rapport").isVisible(), true);
    await p.evaluate(() => { location.hash = "technologies"; });
    await p.waitForTimeout(200);
    assert.equal(await p.locator("#contenu").isVisible(), false);
    assert.equal(await p.locator(".rapport-techno").count(), 2);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("radar normal : pas de rapport", async () => {
  const { p, fermer } = await (async () => {
    const contexte = await navigateur.newContext();
    const p = await contexte.newPage();
    await p.goto(BASE + "radar.html");
    await p.waitForSelector("#stats .stat");
    return { p, fermer: () => contexte.close() };
  })();
  try {
    assert.equal(await p.locator("#rapport").count(), 0);
    assert.equal(await p.locator("#contenu").isVisible(), true);
  } finally { await fermer(); }
});

test("rendez-vous : lien Cal.com avec le lien du rapport dans notes=", async () => {
  const a = await rapport(ADRESSE);
  try {
    const href = await a.p.locator("a.rapport-rdv").getAttribute("href");
    assert.ok(href.startsWith(CAL + "?notes="), href);
    assert.ok(href.includes(encodeURIComponent("Mon rapport : " + a.p.url())), href);
    assert.match(await a.p.locator("a.rapport-rdv").innerText(), /Réserver 15 minutes/);
  } finally { await a.fermer(); }
  const b = await rapport(ADRESSE, { cal: CAL + "?duree=30" });
  try {
    assert.ok((await b.p.locator("a.rapport-rdv").getAttribute("href")).startsWith(CAL + "?duree=30&notes="));
  } finally { await b.fermer(); }
  const c = await rapport(ADRESSE, { cal: "" });
  try {
    assert.equal(await c.p.locator("a.rapport-rdv").getAttribute("href"), "index.html#contact");
  } finally { await c.fermer(); }
});

test("identifiant inconnu : une ligne d’avertissement, le reste s’affiche", async () => {
  const { p, errs, fermer } = await rapport(adresseRapport("t=fin-des-licences-perpetuelles&x=vmware-vsphere-et-vcf,techno-disparue&d=2026-11-23"));
  try {
    await p.getByText("1 élément ne figure plus dans le radar").waitFor({ state: "visible" });
    assert.equal(await p.locator(".rapport-techno").count(), 1);
    assert.equal(await p.locator(".rapport-tendance").count(), 1);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("rapport sans sélection : message et lien vers le radar", async () => {
  const { p, errs, fermer } = await rapport(adresseRapport(""));
  try {
    assert.equal(await p.locator("#rapport").getAttribute("data-etat"), "vide");
    await p.getByText("Ce rapport ne contient aucune sélection").waitFor({ state: "visible" });
    assert.equal(await p.locator('#rapport a[href="radar.html"]').count(), 1);
    assert.equal(await p.locator(".rapport-techno").count(), 0);
    assert.equal(await p.evaluate(() => localStorage.getItem("optio-radar-dernier-rapport")), null);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("copier le lien : presse-papiers et confirmation", async () => {
  const { p, errs, fermer } = await rapport(ADRESSE, { permissions: ["clipboard-read", "clipboard-write"] });
  try {
    await p.getByRole("button", { name: "Copier le lien de mon rapport" }).click();
    await p.getByText("Lien copié").waitFor({ state: "visible" });
    assert.equal(await p.evaluate(() => navigator.clipboard.readText()), p.url());
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("copier le lien sans API presse-papiers : champ en lecture seule sélectionné", async () => {
  const { p, errs, fermer } = await rapport(ADRESSE, { sansPressePapiers: true });
  try {
    await p.getByRole("button", { name: "Copier le lien de mon rapport" }).click();
    const champ = p.locator("#rapport input.rapport-lien");
    await champ.waitFor({ state: "visible" });
    assert.equal(await champ.inputValue(), p.url());
    assert.equal(await champ.getAttribute("readonly"), "");
    assert.equal(await p.evaluate(() => { const c = document.querySelector("#rapport input.rapport-lien"); return c.selectionStart === 0 && c.selectionEnd === c.value.length && document.activeElement === c; }), true);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("dernier rapport gardé dans le navigateur", async () => {
  const { p, fermer } = await rapport(ADRESSE);
  try {
    assert.equal(await p.evaluate(() => localStorage.getItem("optio-radar-dernier-rapport")), p.url());
  } finally { await fermer(); }
});

test("impression : interface masquée, blocs non coupés, PDF par window.print()", async () => {
  const { p, errs, fermer } = await rapport(ADRESSE);
  try {
    await p.evaluate(() => { window.__imprime = 0; window.print = () => { window.__imprime++; }; });
    await p.getByRole("button", { name: "Télécharger en PDF" }).click();
    assert.equal(await p.evaluate(() => window.__imprime), 1);
    await p.emulateMedia({ media: "print" });
    const aff = await p.evaluate(() => {
      const d = (e) => getComputedStyle(e).display;
      return {
        bande: d(document.getElementById("bande")), vues: d(document.querySelector(".vues")),
        boutons: [...document.querySelectorAll("#rapport button, #rapport a.rapport-rdv")].map(d),
        coupe: [...document.querySelectorAll(".rapport-techno, .rapport-tendance")].map((e) => getComputedStyle(e).breakInside),
        fond: getComputedStyle(document.body).backgroundColor, texte: getComputedStyle(document.querySelector(".rapport-techno p")).color
      };
    });
    assert.equal(aff.bande, "none");
    assert.equal(aff.vues, "none");
    assert.ok(aff.boutons.length >= 3 && aff.boutons.every((x) => x === "none"), JSON.stringify(aff.boutons));
    assert.ok(aff.coupe.length === 3 && aff.coupe.every((x) => x === "avoid"), JSON.stringify(aff.coupe));
    assert.equal(aff.fond, "rgb(255, 255, 255)");
    assert.equal(aff.texte, "rgb(0, 0, 0)");
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

// rapport de contraste WCAG entre la couleur du texte et le premier fond opaque
async function contraste(p, selecteur) {
  return p.evaluate((s) => {
    const rgb = (c) => c.match(/[\d.]+/g).map(Number);
    const lum = (c) => { const v = rgb(c).slice(0, 3).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
    const e = document.querySelector(s);
    let f = e, fond = null;
    while (f && !fond) { const b = getComputedStyle(f).backgroundColor; const a = rgb(b); if (a.length < 4 || a[3] > 0) fond = b; f = f.parentElement; }
    fond = fond || "rgb(255, 255, 255)";
    const l1 = lum(getComputedStyle(e).color), l2 = lum(fond);
    return { ratio: (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05), fond: lum(fond) };
  }, selecteur);
}

test("mode sombre lisible", async () => {
  const { p, errs, fermer } = await rapport(ADRESSE, { scheme: "dark" });
  try {
    for (const s of [".rapport-garde h1", ".rapport-techno p", ".rapport-tendance p", ".rapport-sources a", ".rapport-fin p"]) {
      const c = await contraste(p, s);
      assert.ok(c.fond < 0.1, s + " : fond clair en mode sombre");
      assert.ok(c.ratio >= 4.5, s + " : contraste " + c.ratio.toFixed(2));
    }
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("mobile 390 px : pas de débordement horizontal", async () => {
  const { p, errs, fermer } = await rapport(ADRESSE, { viewport: { width: 390, height: 800 } });
  try {
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth), 390);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("identifiants égaux à des noms d’Object.prototype : pas de page blanche", async () => {
  const { p, errs, fermer } = await rapport(adresseRapport("t=constructor&x=__proto__&d=2026-11-23"));
  try {
    assert.equal(await p.locator("#rapport").getAttribute("data-etat"), "vide");
    await p.getByText("2 éléments ne figurent plus dans le radar").waitFor({ state: "visible" });
    assert.doesNotMatch(await p.locator("#rapport").innerText(), /Impossible de charger/);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("tous les identifiants inconnus : avertissement et rapport vide", async () => {
  const { p, errs, fermer } = await rapport(adresseRapport("t=tendance-disparue&x=techno-disparue,toString&d=2026-11-23"));
  try {
    assert.equal(await p.locator("#rapport").getAttribute("data-etat"), "vide");
    await p.getByText("3 éléments ne figurent plus dans le radar").waitFor({ state: "visible" });
    await p.getByText("Ce rapport ne contient aucune sélection").waitFor({ state: "visible" });
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("lien camouflé : l’adresse ne montre aucun identifiant", async () => {
  const { p, errs, fermer } = await rapport(ADRESSE);
  try {
    assert.ok(!/vmware|openstack|licences|[?&][txd]=/.test(p.url()), p.url());
    assert.equal(await p.locator(".rapport-techno").count(), 2);
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

// Lien bricolé, tronqué, ancien format ou sans jeton : page « lien non valide », aucun rapport calculé
for (const [nom, chemin] of [
  ["jeton modifié", ADRESSE.replace(/(r=2\.)(.)/, (m, a, c) => a + (c === "A" ? "B" : "A"))],
  ["jeton tronqué", ADRESSE.slice(0, -4)],
  ["ancien format lisible", "radar.html?rapport=1&t=fin-des-licences-perpetuelles&x=vmware-vsphere-et-vcf,openstack&d=2026-11-23"],
  ["sans jeton", "radar.html?rapport=1"],
]) {
  test("lien non valide : " + nom, async () => {
    const { p, errs, fermer } = await rapport(chemin);
    try {
      assert.equal(await p.locator("#rapport").getAttribute("data-etat"), "invalide");
      assert.equal((await p.locator("#rapport h1").innerText()).trim(), "Ce lien de rapport n’est pas valide");
      assert.match(await p.title(), /^Lien de rapport non valide/);
      assert.equal(await p.locator('#rapport a[href="radar.html"]').count(), 1);
      assert.equal(await p.locator(".rapport-techno, .rapport-chap, .rapport-nav").count(), 0);
      assert.equal(await p.evaluate(() => localStorage.getItem("optio-radar-dernier-rapport")), null);
      assert.deepEqual(errs, []);
    } finally { await fermer(); }
  });
}

test("lien d’évitement : le focus va sur le rapport", async () => {
  const { p, errs, fermer } = await rapport(ADRESSE);
  try {
    assert.equal(await p.locator("main#rapport").getAttribute("tabindex"), "-1");
    assert.equal(await p.locator(".skip").getAttribute("href"), "#rapport");
    await p.keyboard.press("Tab");
    assert.equal(await p.evaluate(() => document.activeElement.className), "skip");
    await p.keyboard.press("Enter");
    await p.waitForFunction(() => document.activeElement && document.activeElement.id === "rapport");
    assert.deepEqual(errs, []);
  } finally { await fermer(); }
});

test("retour au radar : en haut de page à l’écran, absent à l’impression", async () => {
  for (const [chemin, vp] of [[ADRESSE, { width: 1280, height: 800 }], [ADRESSE, { width: 390, height: 844 }], ["radar.html?rapport=1", { width: 1280, height: 800 }]]) {
    const { p, errs, fermer } = await rapport(chemin, { viewport: vp });
    try {
      const haut = p.locator(".entete a.rapport-retour");
      assert.equal(await haut.count(), 1);
      assert.equal(await haut.isVisible(), true);
      assert.equal(await haut.getAttribute("href"), "radar.html");
      assert.ok((await haut.boundingBox()).y < 120, "lien de retour pas en haut");
      // sur mobile, un seul lien de retour visible en haut
      const visibles = await p.locator("a.rapport-retour, a.rapport-nav-retour").evaluateAll((l) => l.filter((a) => a.offsetParent !== null).length);
      if (vp.width < 1100) assert.equal(visibles, 1);
      await p.emulateMedia({ media: "print" });
      assert.equal(await haut.isVisible(), false);
      await Promise.all([p.waitForURL(/radar\.html$/), (async () => { await p.emulateMedia({ media: "screen" }); await haut.click(); })()]);
      await p.waitForSelector("#stats .stat");
      assert.deepEqual(errs, []);
    } finally { await fermer(); }
  }
});
