"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { encoderSelection, decoderSelection, urlRapport, synthese, suggestions,
  chargerSelection, sauverSelection } = require("../../js/selection.js");

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
test("urlRapport", () => {
  assert.equal(urlRapport("https://optio.stratwise.fr/radar.html", { tendances: [], technologies: ["x1"], date: "2026-11-23" }),
    "https://optio.stratwise.fr/radar.html?rapport=1&x=x1&d=2026-11-23");
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
