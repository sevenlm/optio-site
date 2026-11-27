// Outils communs aux tests de bout en bout du radar.
// Prérequis : un serveur statique sur le port 8765, lancé à la racine du dépôt :
//   python3 -m http.server 8765
// Les tests utilisent le Chrome installé (chromium.launch({ channel: "chrome" })).
export const BASE = "http://localhost:8765/";

// Ouvre une page du site et attend que les données soient chargées (#stats rempli).
export async function ouvrir(page, chemin) {
  await page.goto(BASE + (chemin || "radar.html"));
  await page.waitForSelector("#stats .stat");
}

// Collecte les erreurs JavaScript et les console.error de la page.
// À appeler avant ouvrir() ; renvoie un tableau qui se remplit au fil du test.
export function erreurs(page) {
  const liste = [];
  page.on("pageerror", (e) => liste.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") liste.push(m.text()); });
  return liste;
}

// Adresse d’un rapport au format camouflé, à partir d’une sélection lisible « t=…&x=…&d=… ».
import { createRequire } from "node:module";
const SELECTION = createRequire(import.meta.url)("../../js/selection.js");
export function adresseRapport(lisible, base = "radar.html") {
  return SELECTION.urlRapport(base, SELECTION.decoderSelection("?" + lisible));
}
export const lireJeton = SELECTION.lireJeton;

// Contraste WCAG entre la couleur du texte d’un élément et le premier fond opaque de ses ancêtres.
// Sérialisable : passer contrasteDe.toString() à page.$$eval puis new Function("return " + f)().
export function contrasteDe(el) {
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
