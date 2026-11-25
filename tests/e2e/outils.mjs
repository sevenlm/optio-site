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
