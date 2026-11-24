/* Logique pure de sélection et de synthèse du rapport personnalisé (sans DOM). */
(function (racine) {
  "use strict";

  var CLE_STOCKAGE = "optio-radar-selection";
  var CLE_DERNIER_RAPPORT = "optio-radar-dernier-rapport";

  function selectionVide() {
    return { tendances: [], technologies: [], date: "" };
  }

  function unique(liste) {
    var vus = Object.create(null), sortie = [];
    for (var i = 0; i < liste.length; i++) {
      if (liste[i] && !vus[liste[i]]) {
        vus[liste[i]] = true;
        sortie.push(liste[i]);
      }
    }
    return sortie;
  }

  function encoderSelection(sel) {
    var parties = [];
    if (sel.tendances && sel.tendances.length) parties.push("t=" + sel.tendances.join(","));
    if (sel.technologies && sel.technologies.length) parties.push("x=" + sel.technologies.join(","));
    if (sel.date) parties.push("d=" + sel.date);
    return parties.join("&");
  }

  // valeur d’adresse décodée (%2C → « , ») ; encodage invalide : valeur brute
  function decoder(valeur) {
    try { return decodeURIComponent(valeur); } catch (e) { return valeur; }
  }

  function decoderSelection(recherche) {
    var sel = selectionVide();
    var texte = String(recherche || "").replace(/^\?/, "");
    var paires = texte.split("&");
    for (var i = 0; i < paires.length; i++) {
      var pos = paires[i].indexOf("=");
      if (pos < 0) continue;
      var cle = paires[i].slice(0, pos), valeur = decoder(paires[i].slice(pos + 1));
      if (cle === "t") sel.tendances = unique(valeur.split(","));
      else if (cle === "x") sel.technologies = unique(valeur.split(","));
      else if (cle === "d" && /^\d{4}-\d{2}-\d{2}$/.test(valeur)) sel.date = valeur;
    }
    return sel;
  }

  function urlRapport(base, sel) {
    return base + "?rapport=1&" + encoderSelection(sel);
  }

  // index sans prototype : « constructor » ou « __proto__ » ne sont que des identifiants inconnus
  function dico() {
    return Object.create(null);
  }

  function parId(liste) {
    var index = dico();
    for (var i = 0; i < liste.length; i++) index[liste[i].id] = liste[i];
    return index;
  }

  function comparer(a, b) {
    return a.localeCompare(b, "fr");
  }

  function synthese(sel, donnees) {
    var idxTend = parId(donnees.tendances), idxTech = parId(donnees.technologies);
    var idxMeca = parId(donnees.mecanismes), idxLev = parId(donnees.leviers);
    var absents = 0, technos = [], tendances = [], i, j;

    for (i = 0; i < sel.technologies.length; i++) {
      if (idxTech[sel.technologies[i]]) technos.push(idxTech[sel.technologies[i]]); else absents++;
    }
    for (i = 0; i < sel.tendances.length; i++) {
      if (idxTend[sel.tendances[i]]) tendances.push(idxTend[sel.tendances[i]]); else absents++;
    }
    technos.sort(function (a, b) { return a.anneau - b.anneau || comparer(a.nom, b.nom); });
    tendances.sort(function (a, b) { return a.anneau - b.anneau || comparer(a.titre, b.titre); });

    var parAnneau = [0, 0, 0, 0];
    for (i = 0; i < technos.length; i++) parAnneau[technos[i].anneau]++;
    var urgentes = 0;
    for (i = 0; i < tendances.length; i++) if (tendances[i].anneau <= 1) urgentes++;

    var compteMeca = dico(), mecanismes = [];
    for (i = 0; i < tendances.length; i++) {
      var ids = unique(tendances[i].mecanismes || []);
      for (j = 0; j < ids.length; j++) {
        if (!idxMeca[ids[j]]) continue;
        if (!compteMeca[ids[j]]) {
          compteMeca[ids[j]] = { meca: idxMeca[ids[j]], nb: 0 };
          mecanismes.push(compteMeca[ids[j]]);
        }
        compteMeca[ids[j]].nb++;
      }
    }
    mecanismes.sort(function (a, b) { return b.nb - a.nb || comparer(a.meca.nom, b.meca.nom); });

    var parLevier = dico(), leviers = [];
    function ajouter(refs) {
      for (var k = 0; k < (refs || []).length; k++) {
        var ref = refs[k];
        if (!idxLev[ref.id]) continue;
        if (!parLevier[ref.id]) {
          parLevier[ref.id] = { levier: idxLev[ref.id], commentaires: [] };
          leviers.push(parLevier[ref.id]);
        }
        var liste = parLevier[ref.id].commentaires;
        if (ref.commentaire && liste.indexOf(ref.commentaire) < 0) liste.push(ref.commentaire);
      }
    }
    for (i = 0; i < tendances.length; i++) ajouter(tendances[i].leviers);
    for (i = 0; i < mecanismes.length; i++) ajouter(mecanismes[i].meca.leviers);

    return { technos: technos, tendances: tendances, absents: absents, parAnneau: parAnneau,
      urgentes: urgentes, mecanismes: mecanismes, leviers: leviers };
  }

  function suggestions(sel, donnees) {
    var idxTend = parId(donnees.tendances), retenues = dico(), i, j;
    for (i = 0; i < sel.technologies.length; i++) retenues[sel.technologies[i]] = true;
    var parNom = dico();
    for (i = 0; i < donnees.technologies.length; i++) parNom[donnees.technologies[i].nom] = donnees.technologies[i];
    var compte = dico(), candidates = [];
    for (i = 0; i < sel.tendances.length; i++) {
      var t = idxTend[sel.tendances[i]];
      if (!t) continue;
      var noms = unique(t.technologies || []);
      for (j = 0; j < noms.length; j++) {
        var tech = parNom[noms[j]];
        if (!tech || retenues[tech.id]) continue;
        if (!compte[tech.id]) { compte[tech.id] = 0; candidates.push(tech); }
        compte[tech.id]++;
      }
    }
    // plus de tendances citantes d’abord, puis sortie la plus difficile (anneau), puis nom
    candidates.sort(function (a, b) { return compte[b.id] - compte[a.id] || a.anneau - b.anneau || comparer(a.nom, b.nom); });
    return candidates.map(function (c) { return c.id; });
  }

  function chargerSelection(stockage) {
    try {
      var brut = stockage && stockage.getItem(CLE_STOCKAGE);
      if (!brut) return selectionVide();
      var o = JSON.parse(brut);
      var date = typeof o.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.date) ? o.date : "";
      function textes(v) {
        return unique(Array.isArray(v) ? v.filter(function (s) { return typeof s === "string"; }) : []);
      }
      return { tendances: textes(o.tendances), technologies: textes(o.technologies), date: date };
    } catch (e) {
      return selectionVide();
    }
  }

  function sauverSelection(stockage, sel) {
    try {
      if (!stockage) return false;
      stockage.setItem(CLE_STOCKAGE, JSON.stringify(sel));
      return true;
    } catch (e) {
      return false;
    }
  }

  // criticité estimée : somme des urgences (3 - anneau) des tendances qui citent la technologie,
  // ramenée sur une échelle de 1 à 5 ; les leviers ne comptent pas
  function criticites(donnees) {
    var poids = dico(), max = 0, sortie = dico(), i, j;
    var techs = donnees.technologies, tendances = donnees.tendances;
    for (i = 0; i < tendances.length; i++) {
      if (tendances[i].type === "levier") continue;
      var noms = unique(tendances[i].technologies || []);
      for (j = 0; j < noms.length; j++) {
        poids[noms[j]] = (poids[noms[j]] || 0) + (3 - tendances[i].anneau);
      }
    }
    for (i = 0; i < techs.length; i++) {
      if ((poids[techs[i].nom] || 0) > max) max = poids[techs[i].nom];
    }
    for (i = 0; i < techs.length; i++) {
      var p = poids[techs[i].nom] || 0;
      sortie[techs[i].id] = { poids: p, score: max === 0 ? 1 : Math.round((1 + 4 * p / max) * 10) / 10 };
    }
    return sortie;
  }

  var api = {
    CLE_DERNIER_RAPPORT: CLE_DERNIER_RAPPORT,
    encoderSelection: encoderSelection, decoderSelection: decoderSelection, urlRapport: urlRapport,
    synthese: synthese, suggestions: suggestions,
    chargerSelection: chargerSelection, sauverSelection: sauverSelection,
    criticites: criticites
  };
  racine.OptioSelection = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
