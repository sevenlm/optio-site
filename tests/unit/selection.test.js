"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { encoderSelection, decoderSelection, urlRapport, synthese, suggestions,
  chargerSelection, sauverSelection, criticites, jetonSelection, lireJeton,
  selectionDepuisAdresse } = require("../../js/selection.js");

function lire(nom) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "../../data", nom + ".json"), "utf8"));
}
const donnees = { tendances: lire("tendances"), technologies: lire("technologies"),
  mecanismes: lire("mecanismes"), leviers: lire("leviers") };

test("encode et décode sans perte", () => {
  const sel = { tendances: ["fin-des-licences-perpetuelles"], technologies: ["vmware-vsphere-et-vcf","oracle-database"], date: "2026-11-23" };
  assert.equal(encoderSelection(sel), "t=fin-des-licences-perpetuelles&x=vmware-vsphere-et-vcf,oracle-database&d=2026-11-23");
  assert.deepEqual(decoderSelection("?rapport=1&" + encoderSelection(sel)), sel);
});
test("décode une adresse mal formée", () => {
  assert.deepEqual(decoderSelection("?rapport=1&t=a,,a,b&x=&d=pas-une-date"), { tendances: ["a","b"], technologies: [], date: "" });
  assert.deepEqual(decoderSelection(""), { tendances: [], technologies: [], date: "" });
});
test("urlRapport : jeton opaque, sans identifiant lisible", () => {
  const sel = { tendances: ["fin-des-licences-perpetuelles"], technologies: ["vmware-vsphere-et-vcf"], date: "2026-11-23" };
  const u = urlRapport("https://www.weareoptio.fr/radar.html", sel);
  assert.match(u, /^https:\/\/www\.weareoptio\.fr\/radar\.html\?rapport=1&r=2\.[A-Za-z0-9_-]+\.[a-z0-9]+$/);
  const jeton = u.split("&r=")[1];
  assert.ok(!/vmware|licences|t=|x=|d=|2026-11-23/.test(jeton), jeton);
  assert.deepEqual(selectionDepuisAdresse(u.slice(u.indexOf("?"))), sel);
});
test("jeton : aller-retour, y compris identifiants inattendus", () => {
  for (const sel of [
    { tendances: [], technologies: ["x1"], date: "" },
    { tendances: ["a", "b"], technologies: ["c"], date: "2026-11-25" },
    { tendances: ["éàü-ok"], technologies: ["constructor", "__proto__"], date: "" }
  ]) assert.deepEqual(lireJeton(jetonSelection(sel)), sel);
});
test("jeton modifié, tronqué, vide ou d’une autre version : refusé", () => {
  const j = jetonSelection({ tendances: ["fin-des-licences-perpetuelles"], technologies: ["vmware-vsphere-et-vcf"], date: "2026-11-23" });
  const [v, charge, emp] = j.split(".");
  const autre = charge.slice(0, 5) + (charge[5] === "A" ? "B" : "A") + charge.slice(6);
  for (const mauvais of [v + "." + autre + "." + emp, v + "." + charge + "." + emp + "x", j.slice(0, j.length - 3),
    "3." + charge + "." + emp, "", "2..", "n’importe quoi", "2.%%%." + emp, null, undefined])
    assert.equal(lireJeton(mauvais), null, String(mauvais));
});
// Jetons figés : changer le sel, le mélange, l’empreinte ou l’encodage casserait les liens déjà envoyés
test("jeton : format figé (liens déjà envoyés)", () => {
  const sel = { tendances: ["fin-des-licences-perpetuelles"], technologies: ["vmware-vsphere-et-vcf", "openstack"], date: "2026-11-23" };
  const fige = "2.ey1yYGEgdmR3LH5kcWR-c2phOX91ZnlqeWdkaG13fjR5LWZiZXV9dTl_fH16ZHZkP2hmLGZzaT57f3V6entscWoiZS8_IjMmPT4jOT0j.iuoiae";
  assert.equal(jetonSelection(sel), fige);
  assert.deepEqual(lireJeton(fige), sel);
  assert.deepEqual(lireJeton("2..x79m2a"), { tendances: [], technologies: [], date: "" });
});
test("selectionDepuisAdresse : r absent ou ancien format refusé", () => {
  assert.equal(selectionDepuisAdresse("?rapport=1"), null);
  assert.equal(selectionDepuisAdresse("?rapport=1&t=fin-des-licences-perpetuelles&x=vmware-vsphere-et-vcf"), null);
  assert.equal(selectionDepuisAdresse(""), null);
});
test("jeton : longueur raisonnable même avec tout le radar retenu", () => {
  const sel = { tendances: donnees.tendances.map((t) => t.id), technologies: donnees.technologies.map((x) => x.id), date: "2026-11-25" };
  const brut = encoderSelection(sel).length, jeton = jetonSelection(sel).length;
  assert.ok(jeton < brut * 1.5, jeton + " vs " + brut);
  assert.deepEqual(lireJeton(jetonSelection(sel)), sel);
});
test("synthèse : tri, anneaux, absents, urgentes", () => {
  // anneau 2 puis 0 ; technos : anneau 3, 0, 1 (+ un identifiant inconnu)
  const s = synthese({
    tendances: ["facturation-de-lia-a-lusage", "fin-des-licences-perpetuelles"],
    technologies: ["proxmox-ve", "vmware-vsphere-et-vcf", "nutanix-ahv", "inconnu"], date: ""
  }, donnees);
  assert.equal(s.absents, 1);
  assert.deepEqual(s.technos.map(x => x.id), ["vmware-vsphere-et-vcf", "nutanix-ahv", "proxmox-ve"]);
  assert.deepEqual(s.tendances.map(x => x.id), ["fin-des-licences-perpetuelles", "facturation-de-lia-a-lusage"]);
  assert.deepEqual(s.parAnneau, [1, 1, 0, 1]);
  assert.equal(s.parAnneau.reduce((a, b) => a + b, 0), s.technos.length);
  assert.equal(s.urgentes, 1);
  const s2 = synthese({ tendances: ["hausses-de-prix-soutenues", "fin-des-licences-perpetuelles", "saas-dabord"], technologies: [], date: "" }, donnees);
  assert.equal(s2.urgentes, 3); // anneaux 1, 0 et 1
});
test("synthèse : mécanismes comptés et leviers sans doublon", () => {
  const s = synthese({ tendances: ["ia-integree-doffice-dans-les-suites", "hausses-de-prix-soutenues"], technologies: [], date: "" }, donnees);
  // meca-hausses… cité par les deux tendances, meca-offres-groupees par une seule
  assert.equal(s.mecanismes[0].meca.id, "meca-hausses-unilaterales-et-indexation");
  assert.equal(s.mecanismes[0].nb, 2);
  assert.equal(s.mecanismes[1].nb, 1);
  assert.equal(s.mecanismes[1].meca.id, "meca-offres-groupees");
  for (let i = 1; i < s.mecanismes.length; i++) assert.ok(s.mecanismes[i - 1].nb >= s.mecanismes[i].nb);
  const ids = s.leviers.map(l => l.levier.id);
  assert.equal(new Set(ids).size, ids.length);
  // « cout-total-de-la-dependance » est cité par les deux tendances et par un mécanisme : un seul élément, plusieurs commentaires
  const cout = s.leviers.find(l => l.levier.id === "cout-total-de-la-dependance");
  assert.ok(cout);
  assert.ok(cout.commentaires.length >= 2);
  assert.equal(new Set(cout.commentaires).size, cout.commentaires.length);
  const hausses = donnees.tendances.find(t => t.id === "hausses-de-prix-soutenues");
  const commentaire = hausses.leviers.find(l => l.id === "cout-total-de-la-dependance").commentaire;
  assert.ok(cout.commentaires.includes(commentaire));
});
test("suggestions : technologies des tendances retenues, hors sélection", () => {
  const sel = { tendances: ["fin-des-licences-perpetuelles", "hausses-de-prix-soutenues"], technologies: ["servicenow"], date: "" };
  const r = suggestions(sel, donnees);
  assert.ok(r.length > 0);
  assert.ok(!r.includes("servicenow"));
  assert.equal(new Set(r).size, r.length);
  const compte = id => {
    const nom = donnees.technologies.find(x => x.id === id).nom;
    return sel.tendances.filter(t => donnees.tendances.find(y => y.id === t).technologies.includes(nom)).length;
  };
  for (let i = 1; i < r.length; i++) assert.ok(compte(r[i - 1]) >= compte(r[i]));
  assert.equal(compte(r[0]), 2);
  // VMware est cité par les deux tendances : il précède toute technologie citée une seule fois
  assert.equal(compte("vmware-vsphere-et-vcf"), 2);
  assert.ok(r.indexOf("vmware-vsphere-et-vcf") >= 0);
  assert.ok(r.indexOf("vmware-vsphere-et-vcf") < r.findIndex(id => compte(id) === 1));
});
test("suggestions : à égalité, sortie la plus difficile d’abord, puis nom", () => {
  // les 9 technologies de « Virtualisation propriétaire » sont citées une fois chacune
  const r = suggestions({ tendances: ["virtualisation-proprietaire"], technologies: [], date: "" }, donnees);
  assert.deepEqual(r, [
    "ibm-power-aix-et-ibm-i", "mainframe-ibm-z-z-os", "vmware-vsphere-et-vcf", // anneau 0
    "huawei-dcs-fusioncompute", "hyper-v-et-azure-local", "nutanix-ahv", "vmware-tanzu", "windows-server", // anneau 1
    "xenserver-ex-citrix-hypervisor" // anneau 2
  ]);
});
test("stockage qui lève une exception", () => {
  const casse = { getItem(){ throw new Error("x"); }, setItem(){ throw new Error("x"); } };
  assert.deepEqual(chargerSelection(casse), { tendances: [], technologies: [], date: "" });
  assert.equal(sauverSelection(casse, { tendances: ["a"], technologies: [], date: "" }), false);
});
test("décode des virgules encodées (%2C) et des caractères encodés", () => {
  assert.deepEqual(decoderSelection("?rapport=1&t=fin-des-licences-perpetuelles&x=vmware-vsphere-et-vcf%2Coracle-database&d=2026-11-23"),
    { tendances: ["fin-des-licences-perpetuelles"], technologies: ["vmware-vsphere-et-vcf", "oracle-database"], date: "2026-11-23" });
  // encodage invalide : valeur brute conservée
  assert.deepEqual(decoderSelection("?x=a%E0%A4,b").technologies, ["a%E0%A4", "b"]);
});
test("identifiants égaux à des noms d’Object.prototype : comptés absents, sans erreur", () => {
  const s = synthese({ tendances: ["constructor", "toString"], technologies: ["__proto__", "hasOwnProperty", "oracle-database"], date: "" }, donnees);
  assert.equal(s.absents, 4);
  assert.deepEqual(s.technos.map((x) => x.id), ["oracle-database"]);
  assert.deepEqual(s.tendances, []);
  assert.deepEqual(suggestions({ tendances: ["constructor", "__proto__"], technologies: ["toString"], date: "" }, donnees), []);
});
test("tous les identifiants inconnus : synthèse vide, absents comptés", () => {
  const s = synthese({ tendances: ["t-disparue"], technologies: ["x-disparue", "y-disparue"], date: "2026-11-23" }, donnees);
  assert.equal(s.absents, 3);
  assert.deepEqual([s.technos, s.tendances, s.mecanismes, s.leviers, s.parAnneau, s.urgentes], [[], [], [], [], [0, 0, 0, 0], 0]);
});

const D = {
  technologies: [{ id: "a", nom: "A" }, { id: "b", nom: "B" }, { id: "c", nom: "C" }],
  tendances: [
    { id: "t1", anneau: 0, technologies: ["A", "B"] },
    { id: "t2", anneau: 1, technologies: ["A", "A"] },
    { id: "t3", anneau: 3, technologies: ["B"] },
    { id: "t4", anneau: 0, type: "levier", technologies: ["C"] },
    { id: "t5", anneau: 2 }
  ]
};
test("criticites : poids par urgence, nom cité une seule fois par tendance, leviers ignorés", () => {
  const c = criticites(D);
  assert.deepEqual({ ...c.a }, { poids: 5, score: 5 });
  assert.deepEqual({ ...c.b }, { poids: 3, score: 3.4 });
  assert.deepEqual({ ...c.c }, { poids: 0, score: 1 });
});
test("criticites : aucune tendance ne cite rien, tout vaut 1", () => {
  const c = criticites({ technologies: D.technologies, tendances: [] });
  assert.equal(c.a.score, 1); assert.equal(c.b.score, 1);
});
test("criticites : identifiant « constructor » sans collision avec le prototype", () => {
  const c = criticites({ technologies: [{ id: "constructor", nom: "X" }], tendances: [{ id: "t", anneau: 1, technologies: ["X"] }] });
  assert.equal(c.constructor.score, 5);
});
