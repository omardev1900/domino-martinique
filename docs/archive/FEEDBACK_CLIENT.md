# 📬 FEEDBACK CLIENT — Retours utilisateurs (Avril 2026)

> Document source : Google Doc partagé par Manuel Voitier  
> Traitement : Trié, clarifié et priorisé le 14 avril 2026

---

## 🔴 BUGS (Priorité immédiate)

| # | Description | Localisation probable |
|---|---|---|
| B1 | ✅ **FIXED** : Au 1er tour, les dominos jouables ne se lèvent pas / ne sont pas mis en avant | `PlayerHand.tsx` — Conflit animation |
| B2 | ✅ **FIXED** : Bug d'affichage en fin de partie : les dominos se superposent / se bousculent | `PlayerHand.tsx` — Layout & Scale |
| B3 | ✅ **FIXED** : **Mode Cochon** : logique inversée — c'est celui qui *inflige* le cochon qui gagne, l'objectif est de donner des cochons (pas d'en recevoir) | `LogicEngine` / UI explication |
| B4 | ✅ **FIXED** : **Mode Score** : valeur par défaut à 100 → réduire à 10 | `solo.tsx` (Reglé par Manuel) |

---

## 🟠 MANQUES (Fonctionnalités absentes)

| # | Description | Complexité |
|---|---|---|
| M1 | **Jauge cochons du mois** : afficher en popup à l'ouverture du jeu le nombre de cochons donnés ce mois + objectif sous forme de jauge | Moyenne |
| M2 | **Explication des paliers Ligue des Cochons** : lien ou section dans la popup d'ouverture (ou écran infos) | Faible |
| M3 | **Onglet Actualités dans Admin + App** : L'admin peut pousser des flyers/pubs → s'affichent en popup à la connexion, consultables dans un onglet "Actualités" | Haute |
| M4 | ✅ **FIXED** : **Onglet DONATION dans les infos** : Texte + lien Revolut + coordonnées bancaires MDC | Faible |

---

## 🟡 AMÉLIORATIONS (UX / Design)

| # | Description | Complexité |
|---|---|---|
| A1 | ✅ **FIXED** : Afficher "Boudé" en texte à coté du joueur boudé | Faible |
| A2 | ✅ **FIXED** : **Vibration** du téléphone quand c'est au joueur de jouer | Faible |
| A3 | ✅ **FIXED** : Ne plus griser les dominos non jouables quand c'est notre tour (gêne le choix) | Faible |
| A4 | ✅ **FIXED** : **Afficher clairement l'objectif** en cours de partie multijoueur (sans aller dans les infos) | Faible |
| A5 | Les dominos se superposent avec les avatars joueurs quand la table se remplit | Moyenne |
| A6 | **Afficher les récompenses en popup** (style "cadeau du jour") | Moyenne |
| A7 | **Navigation** : avoir les onglets sur le côté (layout inspiré d'un modèle reçu sur WhatsApp) | Haute |
| A8 | **Mode multijoueur paysage** : interface brouillon, tout se superpose | Haute |
| A9 | ✅ **FIXED** : **Noms des bots** : retirer "Béké" (connotation coloniale) — renommé en "Chabine" | Faible |
| A10 | **Indicateur du joueur actif** : difficile de savoir qui joue pendant l'animation — améliorer (inspiration Zimad) sans ralentir le jeu | Moyenne |
| A11 | **Diversité des avatars** : actuellement que des noirs → ajouter au moins 1 blanc, 1 asiatique | Faible |
| A12 | **Photo de profil** : permettre au joueur de charger sa photo ou importer depuis Google/réseau | Haute |
| A13 | **Musique** : la musique d'accueil doit rester jusqu'au lancement d'une partie. Les musiques se superposent → corriger. En jeu : 3 musiques disponibles, possibilité d'acheter en boutique | Moyenne |
| A14 | **Économie révisée** : 1 partie = 100 coins buy-in → vainqueur gagne 250 coins (+ 100 s'il regarde une pub) → perdants récupèrent 100 coins s'ils regardent une pub. Pas de coins en fin de mode sauf pour le vainqueur | Haute |
| A15 | ✅ **FIXED** : **Taille des dominos** : réduire légèrement (42px → 38px) | Faible |

---

## 🛒 BOUTIQUE (Nouvelles entrées)

| # | Description | Complexité |
|---|---|---|
| Shop1 | **Dominos blancs** | Faible |
| Shop2 | **Dominos avec points colorés** | Faible |
| Shop3 | **Phrases créoles** en tchat : "I fèw mal doudou", "Ti manikou"… coût 10 ou 20 coins/utilisation selon piquant | Moyenne |
| Shop4 | **Fonds de table** supplémentaires | Faible |
| Shop5 | **Mode Légende** : bots achetables — Man'X le Président, Valou le Redoutable, Chaton la Tigresse | Haute |
| Shop6 | **Pass VIP** : pas de pub, 5€/mois reconductible automatiquement | Haute |
| Shop7 | **Alimentation boutique par l'admin** : Manuel doit pouvoir ajouter des items sans toucher au code | Haute |

---

## 🎨 DESIGN (Inspiration reçue)

> Les images/captures du doc ne sont pas accessibles via texte — à récupérer directement depuis le Google Doc.  
> Éléments décrits verbalement :

| # | Description |
|---|---|
| D1 | **Accueil** : 3 modes de jeu bien mis en avant (cards visuelles) |
| D2 | **Ligue** : paliers à réviser → 500 / 1 000 / 2 000 / 5 000 cochons (au lieu de 30/150/250/500) |
| D3 | **Boutique** : nouvelle UI inspirée capture |
| D4 | **Vestiaire** : section dédiée aux cosmétiques |
| D5 | **Classement mensuel** : 3 classements distincts — Boucher / Défenseur / Scoreur |
| D6 | **Stats** : ajouter le détail des manches (5pts / 4pts / 2pts / 1pt / -1pt) type fiche ligue |
| D7 | **Paramètres** : revoir le design |

---

## 📊 Priorisation recommandée

### Sprint 1 — Bugs bloquants
### Sprint 1 — Bugs bloquants
- [x] B1, B2, B3, B4

### Sprint 2 — Quick wins UX
- [x] A1, A2
- [x] A3, A4, A9, A15, M4

### Sprint 3 — Manques fonctionnels
- M1, M2, A5, A6, A10, A13

### Sprint 4 — Fonctionnalités majeures
- M3, A7, A8, A11, A12, A14, Shop1–4

### Sprint 5 — Boutique & Monétisation
- Shop5, Shop6, Shop7, D2 (révision seuils Ligue)

### Sprint 6 — Refonte design
- D1, D3, D4, D5, D6, D7
