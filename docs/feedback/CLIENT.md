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
