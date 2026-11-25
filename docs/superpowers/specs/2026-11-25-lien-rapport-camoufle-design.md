# Lien du rapport camouflé — conception courte

Date : 25 novembre 2026 · Statut : validée par le porteur du projet

**Intention** : le lien du rapport ne doit plus laisser lire ni bricoler la sélection
(`?rapport=1&t=…&x=…`). Rien d’autre : ce n’est pas une protection d’accès.

**Décidé**
- Lien : `radar.html?rapport=1&r=<jeton>`. Jeton = `2.<charge>.<empreinte>` : la sélection
  (`t=…&x=…&d=…`, encodée en `encodeURIComponent`) mélangée par OU exclusif avec un sel,
  puis encodée en base64 compatible avec les adresses ; l’empreinte est un hachage court
  (FNV-1a 32 bits, base 36) du sel et de la sélection.
- Jeton absent, tronqué, modifié ou d’une autre version : page « Ce lien de rapport n’est
  pas valide » (`data-etat="invalide"`) avec un lien vers le radar ; aucun rapport calculé.
- L’ancien format `t=…&x=…` n’est plus lu (aucun lien n’a été envoyé).
- Le champ caché Tally `selection` reste lisible (réservé à Optio) ; le champ `rapport`,
  l’e-mail, Cal.com, « Copier le lien » et « Revoir mon dernier rapport » utilisent le jeton.

**Approches** : camouflage côté page (retenu) ; lien signé par un secret serveur (vraie
protection, mais demande un service en ligne : écarté pour l’instant).

**Limite assumée** : le sel et la méthode sont dans le JavaScript public ; quelqu’un qui lit
le code peut fabriquer un jeton.
