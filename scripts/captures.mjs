// Captures du radar et du rapport d’exemple pour radar-des-dependances.html, et image de partage.
// Prérequis : un serveur statique sur le port 8765, lancé à la racine du dépôt :
//   python3 -m http.server 8765
// Usage : npm run captures  →  img/radar/*.jpg (JPEG qualité 80) et img/radar/partage.png (1200 × 630).
//         npm run captures -- leviers partage  →  seulement les images nommées.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const SELECTION = createRequire(import.meta.url)("../js/selection.js");
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SORTIE = path.join(RACINE, "img", "radar");
const BASE = "http://localhost:8765/";

// Sélection du rapport d’exemple : le lien « Ouvrir le rapport d’exemple » de la page
// d’accueil doit valoir OptioSelection.urlRapport("radar.html", SELECTION_EXEMPLE) (testé).
export const SELECTION_EXEMPLE = {
  tendances: ["fin-des-licences-perpetuelles", "dependance-cognitive-a-lassistant-ia", "penurie-de-competences-cyber-face-a-nis2"],
  technologies: ["vmware-vsphere-et-vcf", "oracle-database", "microsoft-365", "github-copilot"],
  date: "2026-11-25",
};

// Vues du radar, fenêtre de 1280 px ; l’ancre ouvre la fiche d’un élément de la sélection d’exemple.
// cadre : « vue » = des onglets jusqu’au bas du radar ou de la table ; « fiche » = la fenêtre modale
// de la fiche seule (sans le voile ni la page derrière), du titre jusqu’au bloc qui précède l’intitulé « jusque ».
const VUES = [
  { nom: "radar", chemin: "radar.html#fin-des-licences-perpetuelles", bas: "#radar", cadre: "vue" },
  { nom: "technologies", chemin: "radar.html#vmware-vsphere-et-vcf", bas: "#radar", cadre: "vue" },
  { nom: "mecanismes", chemin: "radar.html#mecanismes", bas: ".tp-defil", marge: 12, cadre: "vue" },
  { nom: "leviers", chemin: "radar.html#alternatives-de-virtualisation-matures", cadre: "fiche", fiche: "#lev-dialog",
    jusque: "Les mécanismes qu’il permet de contrer" },
];
// La table des mécanismes (min-width 1300 px) déborde à 1280 px : on la réduit pour montrer ses quatre colonnes.
const STYLE_VUES = ".tp{zoom:.9}";
// Fiche capturée seule : fenêtre assez haute pour l’afficher sans défilement interne, ni voile, ni ombre, ni coins arrondis.
const STYLE_FICHE = ".tp-dialog{max-height:none!important;border-radius:0!important;box-shadow:none!important}.tp-dialog::backdrop{background:transparent!important}";
const HAUTEUR_FICHE = 2400;

// Pages du rapport en mode impression : largeur A4 à 96 ppp, hauteur d’une page. Chaque capture
// isole un bloc (les autres sont masqués sans changer la mise en page), comme sur sa page imprimée.
const A4 = { width: 794, height: 1123 };
const MARGE_HAUTE = 64; // retrait du haut de page (.rapport : 20 mm en impression, sans l’en-tête répété)
const PAGES = [
  { nom: "rapport-garde", selecteur: ".rapport-garde", haut: ".rapport-garde .rapport-bandeau", marge: 0 },
  { nom: "rapport-synthese", selecteur: "#ch-synthese", marge: MARGE_HAUTE },
  { nom: "rapport-leviers", selecteur: "#ch-leviers", marge: MARGE_HAUTE },
];

const dimensions = {}; // nom → { width, height } des images produites

// Images demandées en argument (aucune : toutes).
const NOMS = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const voulu = (nom) => !NOMS.length || NOMS.includes(nom);

async function serveurDisponible() {
  try { return (await fetch(BASE + "radar.html")).ok; } catch { return false; }
}

async function attendreRendu(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600); // fin des transitions
}

async function enregistrer(page, nom, clip, options = {}) {
  const fichier = path.join(SORTIE, nom + ".jpg");
  await page.screenshot({ path: fichier, type: "jpeg", quality: 80, clip, ...options });
  dimensions[nom] = { width: clip.width, height: clip.height };
  console.log("✓ " + path.relative(RACINE, fichier) + "  " + clip.width + " × " + clip.height + "  " + Math.round(fs.statSync(fichier).size / 1024) + " Ko");
}

async function capturerVues(navigateur) {
  for (const v of VUES) {
    // contexte neuf à chaque vue : aucun filtre ni sélection hérité de la vue précédente
    if (!voulu(v.nom)) continue;
    const hauteur = v.cadre === "fiche" ? HAUTEUR_FICHE : 800;
    const contexte = await navigateur.newContext({ viewport: { width: 1280, height: hauteur }, colorScheme: "light", deviceScaleFactor: 1, reducedMotion: "reduce" });
    const page = await contexte.newPage();
    await page.goto(BASE + v.chemin);
    await page.waitForSelector("#stats .stat");
    await page.addStyleTag({ content: STYLE_VUES + (v.cadre === "fiche" ? STYLE_FICHE : "") });
    await attendreRendu(page);
    if (v.cadre === "fiche") {
      const clip = await page.evaluate(({ fiche, jusque }) => {
        const d = document.querySelector(fiche);
        if (!d || !d.open) return null;
        const b = d.getBoundingClientRect();
        const fin = [...d.querySelectorAll("dt")].find((e) => e.textContent.trim() === jusque);
        if (!fin) return null;
        // l’intitulé et ce qui suit sont masqués : le bas de la capture garde la marge intérieure de la fiche
        for (let e = fin; e; e = e.nextElementSibling) e.style.visibility = "hidden";
        for (let e = fin.parentElement.nextElementSibling; e; e = e.nextElementSibling) e.style.visibility = "hidden";
        const marge = parseFloat(getComputedStyle(d).paddingTop);
        return { x: Math.round(b.left), y: Math.round(b.top), width: Math.round(b.width), height: Math.round(fin.previousElementSibling.getBoundingClientRect().bottom - b.top + marge) };
      }, { fiche: v.fiche, jusque: v.jusque });
      if (!clip) throw new Error("fiche introuvable ou fermée : " + v.fiche + " / " + v.jusque);
      await enregistrer(page, v.nom, clip);
    } else {
      const haut = (await page.locator("[role=tablist]").first().boundingBox()).y - 16;
      const bas = await page.locator(v.bas).first().evaluate((e) => e.getBoundingClientRect().bottom + scrollY);
      const clip = { x: 0, y: Math.round(haut), width: 1280, height: Math.round(bas + (v.marge ?? 24) - haut) };
      await enregistrer(page, v.nom, clip, { fullPage: true });
    }
    await contexte.close();
  }
}

async function capturerRapport(navigateur) {
  if (!PAGES.some((p) => voulu(p.nom))) return;
  const contexte = await navigateur.newContext({ viewport: A4, colorScheme: "light", deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await contexte.newPage();
  await page.emulateMedia({ media: "print", colorScheme: "light" });
  await page.goto(BASE + SELECTION.urlRapport("radar.html", SELECTION_EXEMPLE));
  await page.waitForSelector("#rapport[data-etat]");
  // en-tête et pied répétés à l’impression : fixes, ils se superposeraient au contenu capturé
  await page.addStyleTag({ content: ".rapport-impr-entete,.rapport-impr-pied{visibility:hidden!important}" });
  await attendreRendu(page);
  for (const p of PAGES) {
    if (!voulu(p.nom)) continue;
    const y = await page.evaluate(({ selecteur, haut, marge, hauteur }) => {
      const cible = document.querySelector(selecteur);
      if (!cible) return null;
      for (const frere of cible.parentElement.children) frere.style.visibility = frere === cible ? "" : "hidden";
      const y = document.querySelector(haut || selecteur).getBoundingClientRect().top + scrollY;
      // bas de page : un bloc insécable (break-inside:avoid) ou un titre coupé par le bas passerait
      // à la page suivante à l’impression ; on le masque, avec tout ce qui le suit
      const bas = y - marge + hauteur;
      for (const e of cible.querySelectorAll(".rapport-carte, .rapport-figure, h2, h3, h4, p, li")) {
        const b = e.getBoundingClientRect();
        if (b.bottom + scrollY > bas && !e.closest("[style*=hidden]")) e.style.visibility = "hidden";
      }
      return y;
    }, { selecteur: p.selecteur, haut: p.haut, marge: p.marge, hauteur: A4.height });
    if (y === null) throw new Error("élément introuvable dans le rapport : " + p.selecteur);
    await enregistrer(page, p.nom, { x: 0, y: Math.max(0, Math.round(y - p.marge)), ...A4 }, { fullPage: true });
  }
  await contexte.close();
}

// Reporte les dimensions réelles des captures sur les balises <img id="img-…"> de la page d’accueil.
function reporterDimensions() {
  const fichier = path.join(RACINE, "radar-des-dependances.html");
  let html = fs.readFileSync(fichier, "utf8");
  for (const [nom, d] of Object.entries(dimensions)) {
    const motif = new RegExp('(<img id="img-' + nom + '"[^>]*?) width="\\d+" height="\\d+"');
    if (!motif.test(html)) throw new Error("balise introuvable dans radar-des-dependances.html : img-" + nom);
    html = html.replace(motif, '$1 width="' + d.width + '" height="' + d.height + '"');
  }
  fs.writeFileSync(fichier, html);
  console.log("✓ radar-des-dependances.html : width et height des captures");
}

const LOGO = fs.readFileSync(path.join(RACINE, "index.html"), "utf8").match(/<svg width="38"[\s\S]*?<\/svg>/)[0];

export function pagePartage() {
  const logo = LOGO.replace('width="38" height="27"', 'width="76" height="54"');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<base href="${BASE}"><link rel="stylesheet" href="fonts/fonts.css">
<style>
*{margin:0;box-sizing:border-box}
html,body{width:1200px;height:630px;overflow:hidden}
body{background:#0B2A3C;color:#fff;font-family:'Instrument Sans',sans-serif;position:relative}
.texte{position:absolute;left:80px;top:72px;width:560px}
.marque{display:flex;align-items:center;gap:16px;font-family:'Archivo',sans-serif;font-weight:800;font-size:34px;letter-spacing:-.01em}
h1{margin-top:110px;font-family:'Archivo',sans-serif;font-weight:800;font-size:64px;line-height:1.02;letter-spacing:-.02em}
p{margin-top:26px;font-size:25px;line-height:1.35;color:#C9D6DC}
.capture{position:absolute;left:690px;top:66px;width:540px;height:498px;border-radius:14px 0 0 14px;border:1px solid #1E4255;border-right:0;
  background:#F3F6F7 url("img/radar/radar.jpg") 4px -100px/900px auto no-repeat;box-shadow:0 30px 60px rgba(0,0,0,.35)}
.pied{position:absolute;left:80px;bottom:56px;font-size:20px;color:#8A9BA6}
</style></head><body>
<div class="texte">
<div class="marque">${logo}<span>Optio</span></div>
<h1>Radar des dépendances numériques</h1>
<p>Repérez ce qui rend votre système d’information captif, et recevez un rapport personnalisé.</p>
</div>
<div class="capture" role="img" aria-label="Le radar des tendances"></div>
<div class="pied">www.weareoptio.fr</div>
</body></html>`;
}

async function capturerPartage(navigateur) {
  if (!voulu("partage")) return;
  const contexte = await navigateur.newContext({ viewport: { width: 1200, height: 630 }, colorScheme: "light", deviceScaleFactor: 1 });
  const page = await contexte.newPage();
  // la page est servie depuis le serveur local pour charger polices et capture
  await page.route(BASE + "__partage.html", (r) => r.fulfill({ contentType: "text/html; charset=utf-8", body: pagePartage() }));
  await page.goto(BASE + "__partage.html");
  await page.waitForLoadState("networkidle");
  await attendreRendu(page);
  const fichier = path.join(SORTIE, "partage.png");
  await page.screenshot({ path: fichier, type: "png" });
  console.log("✓ " + path.relative(RACINE, fichier) + "  1200 × 630  " + Math.round(fs.statSync(fichier).size / 1024) + " Ko");
  await contexte.close();
}

async function principal() {
  if (!(await serveurDisponible())) {
    console.error("Serveur local introuvable sur " + BASE + "\nLancez-le à la racine du dépôt :  python3 -m http.server 8765");
    process.exit(1);
  }
  const { chromium } = await import("playwright");
  fs.mkdirSync(SORTIE, { recursive: true });
  const navigateur = await chromium.launch({ channel: "chrome" });
  try {
    await capturerVues(navigateur);
    await capturerRapport(navigateur);
    await capturerPartage(navigateur); // après radar.jpg, qu’elle reprend
  } finally { await navigateur.close(); }
  reporterDimensions();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await principal();
