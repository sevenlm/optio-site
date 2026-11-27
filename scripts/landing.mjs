// Génère les blocs indexables de radar-des-dependances.html depuis data/*.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AXES = ["Juridique", "Financier", "Humain", "Réglementaire", "Pratiques technologiques"];
const ANNEAUX = ["Sortie difficile", "Exigeante", "Maîtrisable", "Facilitée"];

export function lireDonnees(racine) {
  const lire = nom => JSON.parse(fs.readFileSync(path.join(racine, "data", nom + ".json"), "utf8"));
  return { tendances: lire("tendances"), technologies: lire("technologies"),
    mecanismes: lire("mecanismes"), leviers: lire("leviers") };
}

const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function premierePhrase(texte) {
  const t = String(texte ?? "").trim();
  const m = t.match(/^[\s\S]*?[.!?…](?=\s|$)/);
  return m ? m[0] : t;
}

const cmp = (a, b) => a.localeCompare(b, "fr");

export function blocUrgentes(donnees) {
  const liste = donnees.tendances.filter(t => t.anneau === 0)
    .sort((a, b) => a.quadrant - b.quadrant || cmp(a.titre, b.titre));
  const items = liste.map(t =>
    `<li class="carte-gen"><p class="axe-gen">${esc(AXES[t.quadrant])}</p>` +
    `<h3><a href="tendances/${esc(t.id)}.html">${esc(t.titre)}</a></h3>` +
    `<p>${esc(premierePhrase(t.risque))}</p></li>`);
  return `<ul class="grille-gen">\n${items.join("\n")}\n</ul>`;
}

export function blocExemples(donnees) {
  const parNom = new Map(donnees.technologies.map(t => [t.nom, t]));
  const citations = new Map();
  for (const t of donnees.tendances) for (const n of new Set(t.technologies || [])) citations.set(n, (citations.get(n) || 0) + 1);
  const groupes = [];
  for (const anneau of [0, 1, 2]) {
    const choisies = donnees.technologies.filter(t => t.anneau === anneau)
      .map(t => ({ t, alt: (t.alternatives || []).map(n => parNom.get(n)).find(a => a && a.anneau > anneau) }))
      .filter(x => x.alt)
      .sort((a, b) => (citations.get(b.t.nom) || 0) - (citations.get(a.t.nom) || 0) || cmp(a.t.nom, b.t.nom))
      .slice(0, 3);
    const items = choisies.map(({ t, alt }) => {
      const n = citations.get(t.nom) || 0;
      return `<li class="exemple carte-gen" data-anneau="${t.anneau}" data-alt="${alt.anneau}">` +
        `<h4><a href="technologies/${esc(t.id)}.html">${esc(t.nom)}</a></h4>` +
        `<p class="axe-gen">${esc(ANNEAUX[t.anneau])} · cité par ${n} tendance${n > 1 ? "s" : ""}</p>` +
        `<p>Alternative mieux classée : <a href="technologies/${esc(alt.id)}.html">${esc(alt.nom)}</a> (${esc(ANNEAUX[alt.anneau].toLowerCase())}).</p></li>`;
    });
    groupes.push(`<h3 class="anneau-gen">${esc(ANNEAUX[anneau])}</h3>\n<ul class="grille-gen">\n${items.join("\n")}\n</ul>`);
  }
  return groupes.join("\n");
}

export function remplacerBloc(html, nom, contenu) {
  const debut = `<!-- debut:${nom} -->`, fin = `<!-- fin:${nom} -->`;
  const i = html.indexOf(debut);
  if (i < 0) throw new Error(`Repère manquant : ${debut}`);
  const j = html.indexOf(fin, i + debut.length);
  if (j < 0) throw new Error(`Repère manquant : ${fin}`);
  return html.slice(0, i + debut.length) + contenu + html.slice(j);
}

export function genererPage(html, donnees) {
  return remplacerBloc(remplacerBloc(html, "urgentes", "\n" + blocUrgentes(donnees) + "\n"), "exemples", "\n" + blocExemples(donnees) + "\n");
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const racine = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const fichier = path.join(racine, "radar-des-dependances.html");
  const actuel = fs.readFileSync(fichier, "utf8");
  const neuf = genererPage(actuel, lireDonnees(racine));
  if (process.argv.includes("--verifier")) {
    if (neuf !== actuel) { console.error("Contenu généré périmé : lancez npm run landing"); process.exit(1); }
    console.log("Contenu généré à jour");
  } else {
    fs.writeFileSync(fichier, neuf);
    console.log("radar-des-dependances.html mis à jour");
  }
}
