// Génère une page statique par technologie (technologies/<id>.html) et par tendance (tendances/<id>.html)
// depuis data/*.json, deux pages d’index et le bloc « fiches » de sitemap.xml.
// Usage : npm run fiches  (écrit les pages)  ·  npm run fiches -- --verifier  (échoue si une page est périmée)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lireDonnees, remplacerBloc } from "./landing.mjs";

export const SITE = "https://www.weareoptio.fr/";
const AXES = ["Juridique", "Financier", "Humain", "Réglementaire", "Pratiques technologiques"];
const URGENCES = ["Forte", "Élevée", "Moyenne", "Faible"];
const DOMAINES = ["Infrastructure bas niveau", "Middleware", "Données", "Services aux opérations", "Applications et postes de travail"];
const SORTIES = ["difficile", "exigeante", "maîtrisable", "facilitée"];
const TYPES = { p: "Propriétaire", e: "Ouvert ou source disponible, éditeur unique", o: "Ouvert, gouvernance partagée" };

const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cmp = (a, b) => a.localeCompare(b, "fr");
const maj = s => s.charAt(0).toUpperCase() + s.slice(1);

export function couper(texte, max) {
  const t = String(texte ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const c = t.slice(0, max - 1);
  return c.slice(0, c.lastIndexOf(" ")).replace(/[\s,;:.]+$/, "") + "…";
}

export function titreTechnologie(nom) {
  for (const t of [`Sortir de ${nom} : alternatives | Optio`, `Alternatives à ${nom} | Optio`, `${nom} | Optio`]) if (t.length <= 60) return t;
  return couper(nom, 52) + " | Optio";
}

export function titreTendance(titre) {
  for (const t of [`${titre} | Radar des dépendances`, `${titre} | Optio`]) if (t.length <= 60) return t;
  return couper(titre, 52) + " | Optio";
}

const sources = l => (l || []).length ? `<h2>Sources</h2>\n<ul class="sources">${l.map(s =>
  `<li>${s.url ? `<a href="${esc(s.url)}" rel="noopener">${esc(s.titre)}</a>` : esc(s.titre)}</li>`).join("")}</ul>` : "";

function page({ chemin, titre, description, h1, fil, corps }) {
  const url = SITE + chemin;
  const ariane = { "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: fil.map(([nom, lien], i) => ({ "@type": "ListItem", position: i + 1, name: nom, item: SITE + lien })) };
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titre)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Optio">
<meta property="og:locale" content="fr_FR">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(titre)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${SITE}img/radar/partage.png">
<link rel="stylesheet" href="../fonts/fonts.css">
<link rel="stylesheet" href="../fiches.css">
<script type="application/ld+json">${JSON.stringify(ariane)}</script>
</head>
<body>
<header class="entete"><div class="c"><a class="marque" href="../index.html">Optio</a><nav aria-label="Navigation"><a href="../radar-des-dependances.html">Radar des dépendances</a><a href="../technologies/">Technologies</a><a href="../tendances/">Tendances</a></nav></div></header>
<main class="c">
<nav class="ariane" aria-label="Fil d’Ariane">${fil.map(([nom, lien], i) => i === fil.length - 1 ? `<span aria-current="page">${esc(nom)}</span>` : `<a href="../${lien}">${esc(nom)}</a>`).join(" › ")}</nav>
<h1>${esc(h1)}</h1>
${corps}
<aside class="appel"><p>Vous voulez savoir combien coûte votre dépendance et en combien de temps vous pourriez partir ?</p><p><a class="btn" href="../index.html#contact">Parlons-en trente minutes</a> <a href="../radar-des-dependances.html">ou explorez le radar gratuit</a></p></aside>
</main>
<footer><div class="c"><p><a href="../index.html">Optio</a>, dépendances numériques et réversibilité. Une marque de Stratwise. Fiche tirée du <a href="../radar-des-dependances.html">radar des dépendances numériques</a>, édition 1 (prototype).</p></div></footer>
</body>
</html>
`;
}

export function pageTechnologie(t, d) {
  const parNom = new Map(d.technologies.map(x => [x.nom, x]));
  const sortie = SORTIES[t.anneau];
  const alts = (t.alternatives || []).filter(a => a && a !== "—").map(a => {
    const x = parNom.get(a);
    return x ? `<li><a href="${esc(x.id)}.html">${esc(a)}</a> <span class="doux">(sortie ${SORTIES[x.anneau]})</span></li>` : `<li>${esc(a)}</li>`;
  });
  const tendances = d.tendances.filter(x => (x.technologies || []).includes(t.nom)).sort((a, b) => a.anneau - b.anneau || cmp(a.titre, b.titre));
  const corps = [
    `<p class="meta">${[t.editeur, DOMAINES[t.quadrant], TYPES[t.type]].filter(Boolean).map(esc).join(" · ")}</p>`,
    `<p class="anneau a${t.anneau}">Sortie ${sortie}</p>`,
    `<h2>Pourquoi la sortie est ${sortie}</h2>\n<p>${esc(t.pourquoi)}</p>`,
    `<h2>Ce qui crée la dépendance</h2>\n<p>${esc(t.dependance)}</p>`,
    alts.length ? `<h2>Alternatives à ${esc(t.nom)}</h2>\n<ul>${alts.join("")}</ul>` : "",
    tendances.length ? `<h2>Tendances qui concernent ${esc(t.nom)}</h2>\n<ul>${tendances.map(x => `<li><a href="../tendances/${esc(x.id)}.html">${esc(x.titre)}</a> <span class="doux">(urgence ${URGENCES[x.anneau].toLowerCase()})</span></li>`).join("")}</ul>` : "",
    sources(t.sources),
    `<p class="suite"><a href="../radar.html#${esc(t.id)}">Ouvrir ${esc(t.nom)} dans le radar</a></p>`,
  ].filter(Boolean).join("\n");
  return page({ chemin: `technologies/${t.id}.html`, titre: titreTechnologie(t.nom),
    description: couper(`${t.nom}${t.editeur ? ` (${t.editeur})` : ""} : sortie ${sortie}. ${t.pourquoi}`, 155),
    h1: `Sortir de ${t.nom}`, fil: [["Optio", "index.html"], ["Technologies", "technologies/"], [t.nom, `technologies/${t.id}.html`]], corps });
}

export function pageTendance(t, d) {
  const meca = new Map(d.mecanismes.map(x => [x.id, x]));
  const lev = new Map(d.leviers.map(x => [x.id, x]));
  const parNom = new Map(d.technologies.map(x => [x.nom, x]));
  const techs = [...new Set(t.technologies || [])].map(n => parNom.get(n)).filter(Boolean).sort((a, b) => cmp(a.nom, b.nom));
  const mecas = (t.mecanismes || []).map(id => meca.get(id)).filter(Boolean);
  const levs = (t.leviers || []).map(l => [lev.get(l.id), l.commentaire]).filter(([x]) => x);
  const corps = [
    `<p class="meta">Axe ${esc(AXES[t.quadrant].toLowerCase())} · urgence ${esc(URGENCES[t.anneau].toLowerCase())}</p>`,
    `<h2>Ce qui se passe</h2>\n<p>${esc(t.tendance)}</p>`,
    `<h2>Le déclencheur</h2>\n<p>${esc(t.declencheur)}</p>`,
    `<h2>Le risque pour votre organisation</h2>\n<p>${esc(t.risque)}</p>`,
    techs.length ? `<h2>Technologies concernées</h2>\n<ul class="colonnes">${techs.map(x => `<li><a href="../technologies/${esc(x.id)}.html">${esc(x.nom)}</a></li>`).join("")}</ul>` : "",
    mecas.length ? `<h2>Comment l’enfermement se met en place</h2>\n<ul>${mecas.map(m => `<li><strong>${esc(m.nom)}.</strong> ${esc(m.fonctionnement)}</li>`).join("")}</ul>` : "",
    levs.length ? `<h2>Les leviers pour garder le choix</h2>\n<ul>${levs.map(([x, c]) => `<li><strong>${esc(x.titre)}.</strong> ${esc(c)}</li>`).join("")}</ul>` : "",
    sources(t.sources),
    `<p class="suite"><a href="../radar.html#${esc(t.id)}">Ouvrir cette tendance dans le radar</a></p>`,
  ].filter(Boolean).join("\n");
  return page({ chemin: `tendances/${t.id}.html`, titre: titreTendance(t.titre),
    description: couper(t.risque, 155), h1: t.titre,
    fil: [["Optio", "index.html"], ["Tendances", "tendances/"], [t.titre, `tendances/${t.id}.html`]], corps });
}

export function indexTechnologies(d) {
  const corps = `<p class="chapo">${d.technologies.length} technologies d’éditeurs et projets ouverts, classées selon la difficulté typique d’une sortie, avec leurs alternatives et leurs sources.</p>\n` +
    SORTIES.map((s, i) => `<h2>Sortie ${s}</h2>\n<ul class="colonnes">${d.technologies.filter(t => t.anneau === i).sort((a, b) => cmp(a.nom, b.nom))
      .map(t => `<li><a href="${esc(t.id)}.html">${esc(t.nom)}</a></li>`).join("")}</ul>`).join("\n");
  return page({ chemin: "technologies/", titre: "Sortir d’une technologie : alternatives | Optio",
    description: `${d.technologies.length} technologies classées selon la difficulté de sortie, avec leurs alternatives : virtualisation, cloud, bases de données, outils collaboratifs.`,
    h1: "Technologies et alternatives", fil: [["Optio", "index.html"], ["Technologies", "technologies/"]], corps });
}

export function indexTendances(d) {
  const corps = `<p class="chapo">${d.tendances.length} tendances qui renforcent la dépendance des organisations à leurs fournisseurs numériques, classées par axe et par urgence.</p>\n` +
    AXES.map((a, i) => `<h2>${a}</h2>\n<ul>${d.tendances.filter(t => t.quadrant === i).sort((x, y) => x.anneau - y.anneau || cmp(x.titre, y.titre))
      .map(t => `<li><a href="${esc(t.id)}.html">${esc(t.titre)}</a> <span class="doux">(urgence ${URGENCES[t.anneau].toLowerCase()})</span></li>`).join("")}</ul>`).join("\n");
  return page({ chemin: "tendances/", titre: "Tendances de la dépendance numérique | Optio",
    description: `${d.tendances.length} tendances juridiques, financières, humaines, réglementaires et technologiques qui renforcent la dépendance numérique, avec leurs sources.`,
    h1: "Tendances de la dépendance numérique", fil: [["Optio", "index.html"], ["Tendances", "tendances/"]], corps });
}

export function fichiers(d) {
  const f = new Map();
  for (const t of d.technologies) f.set(`technologies/${t.id}.html`, pageTechnologie(t, d));
  for (const t of d.tendances) f.set(`tendances/${t.id}.html`, pageTendance(t, d));
  f.set("technologies/index.html", indexTechnologies(d));
  f.set("tendances/index.html", indexTendances(d));
  return f;
}

export function blocSitemap(chemins) {
  return "\n" + chemins.map(c => `<url><loc>${SITE}${c.replace(/index\.html$/, "")}</loc></url>`).join("\n") + "\n";
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const racine = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const verifier = process.argv.includes("--verifier");
  const f = fichiers(lireDonnees(racine));
  const plan = path.join(racine, "sitemap.xml");
  const planActuel = fs.readFileSync(plan, "utf8");
  f.set("sitemap.xml", remplacerBloc(planActuel, "fiches", blocSitemap([...f.keys()].sort())));
  const perimes = [];
  for (const dossier of ["technologies", "tendances"]) {
    const attendus = new Set([...f.keys()].filter(k => k.startsWith(dossier + "/")).map(k => k.slice(dossier.length + 1)));
    const p = path.join(racine, dossier);
    for (const n of fs.existsSync(p) ? fs.readdirSync(p) : []) if (!attendus.has(n)) {
      perimes.push(`${dossier}/${n} (orpheline)`);
      if (!verifier) fs.unlinkSync(path.join(p, n));
    }
  }
  for (const [chemin, contenu] of f) {
    const p = path.join(racine, chemin);
    const actuel = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
    if (actuel === contenu) continue;
    perimes.push(chemin);
    if (!verifier) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, contenu); }
  }
  if (verifier && perimes.length) { console.error(`Fiches périmées (${perimes.length}) : lancez npm run fiches\n` + perimes.slice(0, 10).join("\n")); process.exit(1); }
  console.log(verifier ? "Fiches à jour" : `${f.size - 1} pages générées, ${perimes.length} fichier(s) écrit(s) ou supprimé(s)`);
}
