# 📬 FEEDBACK CLIENT — Retours utilisateurs (Avril 2026)

> Document brut — retours reçus de Manuel Voitier le 14 avril 2026.
> Ne pas modifier le contenu original. Statut de traitement uniquement.
> Tâches actives → `TASKS.md`

---

## 🔴 BUGS

| # | Description | Statut |
|---|---|---|
| B1 | Au 1er tour, les dominos jouables ne se lèvent pas / ne sont pas mis en avant | ✅ FIXED |
| B2 | Bug d'affichage en fin de partie : les dominos se superposent / se bousculent | ✅ FIXED |
| B3 | Mode Cochon : logique inversée — c'est celui qui inflige le cochon qui gagne | ✅ FIXED |
| B4 | Mode Score : valeur par défaut à 100 → réduire à 10 | ✅ FIXED |

---

## 🟠 MANQUES

| # | Description | Statut |
|---|---|---|
| M1 | Jauge cochons du mois : popup à l'ouverture + objectif sous forme de jauge | 📋 TASKS.md |
| M2 | Explication des paliers Ligue des Cochons dans la popup ou écran infos | 📋 TASKS.md |
| M3 | Onglet Actualités dans Admin + App : flyers/pubs en popup à la connexion | 📋 TASKS.md |
| M4 | Onglet DONATION dans les infos : texte + lien Revolut + coordonnées bancaires | ✅ FIXED |

---

## 🟡 AMÉLIORATIONS UX / DESIGN

| # | Description | Statut |
|---|---|---|
| A1 | Afficher "Boudé" en texte à côté du joueur boudé | ✅ FIXED |
| A2 | Vibration du téléphone quand c'est au joueur de jouer | ✅ FIXED |
| A3 | Ne plus griser les dominos non jouables quand c'est notre tour | ✅ FIXED |
| A4 | Afficher clairement l'objectif en cours de partie multijoueur | ✅ FIXED |
| A5 | Les dominos se superposent avec les avatars quand la table se remplit | 📋 TASKS.md |
| A6 | Afficher les récompenses en popup style "cadeau du jour" | 📋 TASKS.md |
| A7 | Navigation : avoir les onglets sur le côté | 📋 TASKS.md |
| A8 | Mode multijoueur paysage : interface brouillon, tout se superpose | 📋 TASKS.md |
| A9 | Noms des bots : retirer "Béké" → renommé en "Chabine" | ✅ FIXED |
| A10 | Indicateur du joueur actif pendant l'animation (inspiration Zimad) | 📋 TASKS.md |
| A11 | Diversité des avatars : ajouter au moins 1 blanc, 1 asiatique | 📋 TASKS.md |
| A12 | Photo de profil : upload ou import depuis Google | 📋 TASKS.md |
| A13 | Musique : corriger superposition + 3 musiques en jeu achetables en boutique | 📋 TASKS.md |
| A14 | Économie révisée : 100 coins buy-in, 250 vainqueur, pub = récupération | 📋 TASKS.md |
| A15 | Taille des dominos : réduire (42px → 38px) | ✅ FIXED |

---

## 🛒 BOUTIQUE

| # | Description | Statut |
|---|---|---|
| Shop1 | Dominos blancs | 📋 TASKS.md |
| Shop2 | Dominos avec points colorés | 📋 TASKS.md |
| Shop3 | Phrases créoles en tchat : coût 10 ou 20 coins/utilisation | 📋 TASKS.md |
| Shop4 | Fonds de table supplémentaires | 📋 TASKS.md |
| Shop5 | Mode Légende : bots achetables (Man'X, Valou, Chaton) | 📋 TASKS.md |
| Shop6 | Pass VIP : pas de pub, 5€/mois reconductible | 📋 TASKS.md |
| Shop7 | Alimentation boutique par l'admin sans toucher au code | 📋 TASKS.md |

---

## 🎨 DESIGN

| # | Description | Statut |
|---|---|---|
| D1 | Accueil : 3 modes de jeu bien mis en avant (cards visuelles) | 📋 TASKS.md |
| D2 | Ligue : paliers révisés → 500 / 1 000 / 2 000 / 5 000 cochons | 📋 TASKS.md |
| D3 | Boutique : nouvelle UI inspirée capture | 📋 TASKS.md |
| D4 | Vestiaire : section dédiée aux cosmétiques | 📋 TASKS.md |
| D5 | Classement mensuel : 3 classements (Boucher / Défenseur / Scoreur) | 📋 TASKS.md |
| D6 | Stats : ajouter détail des manches (5pts / 4pts / 2pts / 1pt / -1pt) | 📋 TASKS.md |
| D7 | Paramètres : revoir le design | 📋 TASKS.md |

---

## 📋 RETOUR #2 — Récap du 21 avril 2026 (PRIORITÉ LANCEMENT)

> Retour reçu de Manuel Voitier le 21 avril 2026.
> **Priorité suprême** — bloque le lancement en production.

### 🔴 BUGS MULTIJOUEUR

| # | Description | Statut |
|---|---|---|
| R2-B1 | Boudé (message + animation avatar) visible en solo uniquement, pas en multi | 📋 TASKS.md |
| R2-B2 | Égalité : bug permettant de jouer n'importe quelle double au lieu du plus grand — uniquement entre les 2 en égalité | 📋 TASKS.md |
| R2-B3 | Affichage égalité dépasse l'écran | 📋 TASKS.md |
| R2-B4 | Impossible de couper le son | ✅ FIXED |
| R2-B5 | Les dominos ont un contour blanc indésirable | ✅ FIXED |
| R2-B6 | Forcer le plein écran : barre latérale qui reste affichée sur certains téléphones | 📋 TASKS.md |
| R2-B7 | En fin de match, le popup résultats est caché par celui du round qui apparaît juste après | 📋 TASKS.md |

### 🟠 MANQUES FONCTIONNELS

| # | Description | Statut |
|---|---|---|
| R2-M1 | Délai 1 sec quand on est boudé avant de passer la main au suivant | 📋 TASKS.md |
| R2-M2 | Mode Score : imposer chiffre par défaut à 10 (confirmé 2e fois) | 📋 TASKS.md |
| R2-M3 | Signe distinctif niveau Ligue Cochon visible en jeu : encadrer icônes joueurs par couleur du niveau | 📋 TASKS.md |
| R2-M4 | Classement mensuel par catégorie (Bouchers, Défenseurs, etc.) | 📋 TASKS.md |
| R2-M5 | Classement par cochon par niveau cochon | 📋 TASKS.md |
| R2-M6 | Forcer affichage nom long des niveaux cochons (ex: "Apprenti Boucher" au lieu de "APPRENTI") | 📋 TASKS.md |
| R2-M7 | Ajout pub au lancement — **Phase 1** : popup admin-managed (bloquant lancement) · **Phase 2** : AdMob post-lancement | 📋 TASKS.md |

### 🟡 AMÉLIORATIONS UX / DESIGN

| # | Description | Statut |
|---|---|---|
| R2-A1 | Ajout glissement / animation des dominos | 📋 TASKS.md |
| R2-A2 | Design dominos : couleurs dominos + couleurs points par défaut + modification depuis admin | 📋 TASKS.md |
| R2-A3 | Sidebar navigation — menu latéral gauche permanent façon Dashboard jeu vidéo | ✅ FIXED |
| R2-A4 | Regrouper stats Ligue Cochons dans le (i) de l'accueil | ✅ FIXED |
| R2-A5 | Aérer le plateau de jeu : garder un seul bouton option qui affiche infos + réglages | ✅ FIXED |
| R2-A6 | Modifier popup fin de match : grouper résultats + Mes gains + animation / Historique depuis icône en haut | ✅ FIXED |

---

## 📋 RETOUR #3 — 25 avril 2026 (Manuel Voitier)

> Retour reçu le 25 avril 2026. Verbatim conservé. Statut de traitement dans `BACKLOG.md`.

### 🔴 BUGS

| # | Description brute | Statut |
|---|---|---|
| R3-B1 | Mode Score : objectif atteint mais la partie ne se termine pas, une nouvelle manche commence | 📋 BACKLOG |
| R3-B2 | Onglet DETAILS ne fonctionne pas après une partie finie | 📋 BACKLOG |
| R3-B3 | Égalité : on ne voit pas l'affichage des points faisant égalité | 📋 BACKLOG |
| R3-B4 | Décompte cochons désynchronisé (bloqué à 89 alors que stats = 93), pas de message de félicitation pour passage au grade "Maître saucissier 2", pas de récompense reçue | 📋 BACKLOG |
| R3-B5 | Ligue : le décompte "89 / 90" est superposé avec la jauge | 📋 BACKLOG |
| R3-B6 | Boutique : affichage des dominos incorrect, superposition quand il y a coins et diamant | 📋 BACKLOG |
| R3-B7 | Mode paysage multijoueur : impossible de changer de sens | 📋 BACKLOG |
| R3-B8 | Fond d'écran violet : on voit le quadrillage (lignes noires visibles) | 📋 BACKLOG |

### 🟠 MANQUES FONCTIONNELS

| # | Description brute | Statut |
|---|---|---|
| R3-M1 | Classement mensuel : 3 classements (Scoreurs / Bouchers / Défenseurs) avec couleurs par niveau (Apprenti / Maître / Élite), visible dès le lancement | 📋 BACKLOG |
| R3-M2 | Indicateur de niveau des adversaires visible en cours de partie | 📋 BACKLOG |
| R3-M3 | Boutique — onglet PUB : phrase créole + 100 coins débloquables via pub ou 5€/mois | 📋 BACKLOG |
| R3-M4 | Aide mode Cochon incorrecte : "le mode s'arrête dès que l'objectif est atteint" → faux, il faut gagner 3 parties avec un joueur à zéro | 📋 BACKLOG |

### 🟡 AMÉLIORATIONS UX / DESIGN

| # | Description brute | Statut |
|---|---|---|
| R3-A1 | Remplacer le logo MDC bleu par le logo cochon | 📋 BACKLOG |
| R3-A2 | Statistiques 5 / 4 / 2 / 1 / -1 dans la section Ligue (onglet Infos) | 📋 BACKLOG |
| R3-A3 | Taux de victoire dans Statistiques : calcul incompréhensible | 📋 BACKLOG |
| R3-A4 | Vestiaire : pas clair, affichage à revoir | 📋 BACKLOG |
| R3-A5 | Musique : une musique à l'accueil + playlist en jeu qui change à chaque manche | 📋 BACKLOG |
| R3-A6 | Avatars : il n'y a que des noirs, problème de diversité | 📋 BACKLOG |
| R3-A7 | Les dominos ne glissent pas (confirmation R2-A1) | 📋 BACKLOG |

---

## 📋 RETOUR #4 — 04 mai 2026 (Manuel Voitier)

> Retour reçu le 04 mai 2026. Verbatim conservé. Statut de traitement dans `BACKLOG.md`.

### 🔴 BUGS

| # | Description brute | Statut |
|---|---|---|
| R4-B1 | Affichage des paliers de la Ligue des Cochons non synchronisé entre l'accueil, Ma Ligue via le (i) et l'écran Ligue. Les numéros 10 20 30 ... 250 ... ne reflètent pas la jauge en cours et doivent être supprimés ou adaptés au palier courant. | 📋 BACKLOG |
| R4-B2 | Le popup de réussite des passages aux paliers supérieurs de la ligue ne s'affiche pas. | 📋 BACKLOG |
| R4-B3 | En partie multi, les joueurs sont expulsés, la partie continue, et ils doivent saisir le code pour revenir. | 📋 BACKLOG |
| R4-B4 | Le bouton plein écran web cache l'avatar ; il faut le déplacer et n'en garder qu'un seul. | 📋 BACKLOG |
| R4-B5 | En version web, quand on gagne, il arrive que le domino gagnant affiché soit celui de la partie précédente. | 📋 BACKLOG |

### 🟠 MANQUES FONCTIONNELS

| # | Description brute | Statut |
|---|---|---|
| R4-M1 | Le niveau de la Ligue des Cochons doit redémarrer à zéro chaque début du mois. | 📋 BACKLOG |
| R4-M2 | Ajouter de la pub dans la boutique, le vestiaire, etc. | 📋 BACKLOG |
| R4-M3 | Rendre les phrases et emojis vendables à l'unité et non à vie. | 📋 BACKLOG |
| R4-M4 | Enlever les 300 coins cadeaux journaliers sauf si le joueur clique sur un bouton pour voir une pub. | 📋 BACKLOG |
| R4-M5 | Ajouter une notification quotidienne pour inviter les joueurs à venir jouer. | 📋 BACKLOG |

---

## 📋 RETOUR #5 — 06 mai 2026 (testeurs + Manuel Voitier)

> Retour reçu le 06 mai 2026 lors de sessions de test multijoueur.

### 🔴 BUGS MULTIJOUEUR

| # | Description brute | Statut |
|---|---|---|
| R5-B1 | Fin de round en multi : un joueur voit encore son tour avec le timer qui décompte, puis le message de fin de round apparaît quelques secondes après | 📋 BACKLOG |
| R5-B2 | Boudé ne s'affiche pas pour tous les joueurs | 📋 BACKLOG |
| R5-B3 | "Rodrigue reste boudé au moins 10s" — badge Boudé persistant chez certains joueurs en multi | 📋 BACKLOG |
| R5-B4 | Écran violet pour certains joueurs (Moi + Rodrigue) mais pas pour d'autres (Yoyo) | 📋 BACKLOG |
| R5-B5 | Jeu "beaucoup plus lent" depuis la dernière session | 📋 BACKLOG |

### Verbatim client (Manuel Voitier)
> "Ecran violet pr moi et rodrigue maintenant et pas pr yoyo / Qd yoyo est boudé cela ne s'affiche pas pr moi / Et toujours le bug de Rodrigue tu le vois sur les vidéo il reste boudé au moins 10s / Franchement cest bcp bcp bcp plus lent"

### 🔴 ERREURS SENTRY (session du 06/05/2026)

| # | Erreur | URL | Priorité |
|---|---|---|---|
| S-1 | `LEAGUE_GRADE_COLORS is not defined` (ReferenceError) | entry | 🔴 Critique |
| S-2 | `NotAllowedError` — permission audio refusée (5 events, 3 users) | /game/VVVWRW | 🟠 |
| S-3 | `AbortError: The operation was aborted` (4 events) | /game/VVVWRW | 🟠 |
| S-4 | AbortError: play() interrupted by pause | /game/VVVWRW | 🟡 |

---

## 📋 RETOUR #6 — 21 mai 2026

> Retour reçu le 21 mai 2026.

### 🔴 BUGS MAJEURS STATS
- Alerte bug majeur : y a un gros probleme des stats joueurs. Le joueur cmm.saghir@gmail.com avec l'id : l7zzKn7mW3frsFXCNYAaQGVxNCO2 dispose de ces Statistiques dans l'interface admin : Coins 8127, Diamants 22, Ligue APPRENTI_1, Parties jouées 33, Victoires 15, Taux de victoire 45%, Cochons infligés 12. Mais dans son espace à lui il voit que 500 coins, 0 diamants, 0 cochons du mois, niveau ligue débutant, même si j'ai fait un reset du localstorage et même en navigation privée.

---

## RETOUR #7 - 23 mai 2026

> Retour recu le 23 mai 2026 pendant une session multijoueur avec bots.

### BUGS MULTIJOUEUR
- Mode multi avec bots a la place d'adversaires humains : apres quelques rounds, la modal "partie bloquee" apparait puis disparait, ensuite plus personne ne peut jouer. L'avatar du joueur local affiche aussi l'icone de deconnexion / pas de reseau, et le header disparait.

---

## RETOUR #8 - 24 mai 2026

> Retour recu le 24 mai 2026.

### DEMANDE URGENTE PRE-LANCEMENT
- Imposer aux joueurs de telecharger les nouvelles versions quand elles sont en ligne.
---

## RETOUR #9 - 25 mai 2026

> Retour recu le 25 mai 2026.

### BUGS UX URGENTS
- Le modal de cadeau du jour apparait plusieurs fois lors de l'ouverture du jeu et un des clics ne fait rien du tout.
- Le modal de round bloque qui precede la fin d'un match apparait 2 fois avant le modal de fin de match.

---

## RETOUR #10 - 27 mai 2026

> Retour recu le 27 mai 2026 - session testeur.

### BUGS GAMEPLAY

- Quand on gagne un pallier de ligue des cochons, il ne reçoit pas les coins de récompense de ce passage et ne voit pas dans l'animation les gains en coins.
- Le niveau des grades disparait des fois lors d'un jeu multi.
- Les dominos deviennent petit quand on quitte le jeu et n'y retourne quelque soit la raison (appel, message, autre).
- Quand on reçoit un appel on a du mal a retourner au jeu.

### DEMANDES ECONOMIE / BOUTIQUE

- Modifier le systeme des coins : cout d'un jeu 100, gains 300.
- Ajouter dans la boutique la possibilite de voir une video et gagner 300 coins.