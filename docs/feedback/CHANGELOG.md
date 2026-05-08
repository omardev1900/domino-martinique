# 📝 CHANGELOG — Domino Martiniquais

> Journal des changements notables, classés par date (plus récent en premier).

---

## [2.5.0] — 2026-05-08

### Ajouté
- **IA MÈTKAYALI (Niveau 4)** — nouveau niveau de difficulté "Maître Absolu" disponible en solo. Le bot utilise un moteur Monte-Carlo (500 simulations par coup) pour anticiper toute la suite de la partie, contre les 3 niveaux précédents qui ne regardaient qu'un coup à l'avance.
- **Bots adaptatifs** — la difficulté des bots s'adapte automatiquement au grade Ligue des Cochons du joueur. Le grade définit un niveau plancher (impossible de jouer en dessous), mais le joueur peut choisir un niveau supérieur comme défi. Les niveaux inférieurs au grade sont grisés dans le sélecteur.
- **Admin** — nouveau niveau 🧠 Mèt Kayali disponible dans le dropdown de création de bots (`/dashboard/bots`).

---

## [2.4.3] — 2026-05-08

### Ajouté
- **Tchat consommable** — les phrases et emojis payants s'achètent désormais en packs d'usages (ex : 50 envois pour 100 coins) plutôt qu'à vie. Le nombre d'envois restants est affiché directement dans la bulle de tchat. Les items gratuits restent illimités. L'admin peut configurer le nombre d'usages par achat depuis `/dashboard/chat`.

---

## [2.4.2] — 2026-05-08

### Corrigé
- **Ligue des Cochons** — harmonisation du grade affiché dans toute l'app. Auparavant le même joueur pouvait voir « Débutant » sur l'avatar de match, « Apprenti Boucher » sur la carte de partage et « Sans grade » dans le classement. Désormais le label est cohérent partout : « Sans grade » pour 0 cochon, puis les 8 paliers officiels (« Apprenti 1 » → « Légende du Grouin »).
- **Audio Safari iOS** — l'app ne lance plus d'erreur quand le navigateur Safari iOS refuse de jouer un son. Les SFX restent désactivés sur Safari iOS (limitation du navigateur, à fixer post-lancement avec un fallback WebAudio).

---

## [2.4.1] — 2026-05-06

### Ajouté
- **Partage social** — bouton « Partager ma victoire » en fin de match : génère une image (carte avec logo, nom du joueur, cochons infligés, rang) et l'ouvre dans la sheet de partage native (WhatsApp, Instagram, etc.). Bouton similaire au passage de palier Ligue des Cochons (carte grade capturée comme image).
- **Page Politique de confidentialité** — nouvelle page sur la landing page (`/politique-de-confidentialite`), accessible depuis le footer. Contient la procédure de suppression de compte (section dédiée), les droits RGPD, et les informations sur les données collectées. Requise par Google Play Console.

---

## [2.3.9] — 2026-05-06

### Ajouté
- **Notifications push** — l'app demande la permission au lancement et enregistre le token FCM dans Firestore. L'admin peut envoyer des notifications à tous les joueurs depuis `/dashboard/notifications` (nécessite un build EAS).

---

## [2.3.8] — 2026-05-06

### Ajouté
- **Sentry monitoring** — les crashs et erreurs JS sont désormais capturés automatiquement et visibles en temps réel sur le dashboard Sentry (`happy-agency.sentry.io`).

---

## [2.3.7] — 2026-05-06

### Ajouté
- **Pubs étendues** — les publicités admin-managed peuvent désormais apparaître dans 5 nouveaux écrans : Boutique, Vestiaire, Mes Stats, Classement et Ligue des Cochons. La pub s'affiche 2 secondes après l'ouverture de chaque écran, sans bloquer la navigation.
- **Admin** — 5 nouveaux placements disponibles dans le formulaire de création/édition d'une pub (`STORE`, `COLLECTION`, `STATS`, `LEADERBOARD`, `LIGUE`). L'admin peut aussi désigner une pub comme "Cadeau du jour" (🎁) depuis la liste.

---

## [2.3.6] — 2026-05-06

### Modifié
- **Cadeau quotidien** — les 300 coins journaliers ne sont plus accordés automatiquement. Un bouton "📺 Voir une pub → +300 🪙" s'affiche à l'accueil une fois par jour. Si une pub admin est programmée, elle passe en premier ; le bouton cadeau apparaît ensuite. Si aucune pub admin n'est disponible, une pub est quand même jouée avant le crédit.

## [2.3.5] — 2026-05-06

### Corrigé
- **Ligue des Cochons** — le popup de passage de palier s'affiche maintenant correctement en fin de match réel (flux de jeu complet).
- **Web** — le domino gagnant affiché en fin de partie correspond toujours à la partie en cours (état réinitialisé entre deux parties).

---

## [2.3.4] — 2026-05-05

### Modifié
- **Ligue des Cochons** — `/ligue-cochons` sépare désormais `Classement du mois` et `Classement global`, avec les mêmes catégories `+ Cochons / - Cochons / + Points`.
- **Aide** — les explications détaillées de la Ligue quittent la page Ligue et apparaissent maintenant dans un onglet `Ligue` du modal `Aide`.
- **Classements de Ligue** — les vues mensuelles utilisent maintenant des métriques réellement calculées sur le mois en cours (`matchs`, `cochons`, `cochons subis`, `points`).
- **Accueil** — les 3 blocs principaux (`Jouer`, `Actus`, `Ligue`) ont désormais une hauteur homogène pour un rendu plus propre selon les écrans.
- **Multijoueur** — une table vide créée par l’hôte peut maintenant être supprimée aussi depuis le lobby d’attente du jeu, pas seulement depuis les écrans de navigation.

---

## [2.7] — 2 Mai 2026

## [2.3.3] — 2026-05-04

### Modifié
- **Mes Stats** — le menu `Stats` devient `Mes Stats` pour marquer clairement qu'il s'agit du tableau de bord personnel.
- **Écran Stats** — ajout de 2 vues distinctes : `Ce mois-ci` par défaut et `Cumulé` en second.
- **Lisibilité produit** — séparation plus nette entre performance personnelle, classement global (`Rank`) et progression de Ligue.

---

## [2.3.2] — 2026-05-04

### Modifié
- **Ligue des Cochons** — l'écran `/ligue-cochons` devient le point d'entrée unique avec 3 tabs : `Ma Ligue`, `Classement`, `Infos`.
- **Accueil** — le bouton `(i)` du widget Ligue ouvre désormais la page Ligue au lieu d'un modal séparé.
- **Navigation** — suppression de `LeagueInfoModal` pour éviter les doublons entre popup et écran dédié.

---

### Dette technique
- **Tests — Firebase ESM** : mock global de `firebase/firestore`, `firebase/auth`, `firebase/storage`, `firebase/app` dans `jest.setup.js` — les 3 suites `useGameTimers`, `useGameEngine`, `IntegrationArchitecture` passent désormais sans erreur ESM.
- **Tests — GameHeader** : fichier de test réécrit pour correspondre à l'interface simplifiée du composant (3 props au lieu de 10 après la refonte R2-A5).
- **Tests — GameOverlays** : assertion `btn-quit` corrigée pour refléter le flow de confirmation en 2 étapes (btn-quit → btn-quit-confirm → onLeaveRoom).
- **Tests — useGameEngine** : mock `LogicEngine` complété avec `getForcedTieBreakDominoId` ajouté après le sprint précédent.
- **Résultat** : 51 tests, 6 suites, 0 échec.

---

## [2.6] — 2 Mai 2026

### Ajouté
- **Tchat dynamique** — Messages et emojis chargés depuis Firestore (admin-managed). Onglet Premium : achats définitifs en coins, badge ✓ après déblocage.
- **Classement Ligue** — 3 catégories : +Cochons (infligés), -Cochons (subis), +Points. Départage par nombre de matchs joués.

### Corrigé
- **Modal PARTIE BLOQUÉE** — Layout 3 colonnes : perdants à gauche/droite, gagnant au centre avec avatar et dominos.
- **Modal COCHON** — Doublon d'avatar du gagnant supprimé entre le titre et les cartes joueurs.

---

## [2.5] — 1er Mai 2026

### Ajouté
- **Suppression de compte** — Bouton dans Paramètres → onglet Compte, processus 2 étapes (avertissement + confirmation par email). Suppression définitive : profil, stats, économie, compte Firebase Auth. Conforme exigence Google Play 2024.

---

## [2.4] — 1er Mai 2026

### Ajouté
- **Onglet Historique en jeu** — Consultable depuis le menu Options pendant le match, sans interrompre la partie.

### Modifié
- **Modal CHIRÉ** — Bouton supprimé, passage automatique au round suivant (plus fluide).
- **Modal partie bloquée / égalité** — Refonte en cartes joueur côte à côte, dominos affichés verticalement pour une meilleure lisibilité.
- **Teaser de fin de round gagnant** — Version plus dramatique, mieux mise en valeur.
- **Teaser fin de round (mobile)** — Ajusté pour rester lisible sur petits écrans.
- **`/ligue-cochons`** — Compteur de progression repositionné pour ne plus chevaucher les paliers.

### Corrigé
- **Synchro economy / leaderboard (solo)** — Les gains et compteurs des parties solo authentifiées remontent désormais correctement dans le leaderboard.
- **STATISTIQUES DU MOIS** — Décompte correct des manches en 5 / 4 / 2 / 1 / -1 points.
- **Comptage des manches** — Toutes les manches sont maintenant comptabilisées (certaines étaient ignorées).
- **Mode Cochon — écran de fin** — Vue rendue scrollable, footer toujours accessible (correction du blocage apparent sur mobile).

---

## [2.3] — 25 Avril 2026

### Ajouté
- **Reset mot de passe** — Flow "Mot de passe oublié ?" sur l'écran de connexion : saisie email → lien Firebase envoyé → message de confirmation
- **Google Sign-In** — Intégration complète (masquée, sera activée au passage en test interne Google Play)
- **Universal Links WhatsApp Android** — Lien d'invitation cliquable (bleu) dans WhatsApp sur Android, ouvre directement la table. iOS prévu post-lancement.
- **Sidebar améliorée** — Avatar cliquable → Profil, icône Réglages → page paramètres complète (onglets Audio / Profil / Compte + bouton déconnexion)

### Corrigé
- **AdBannerModal** — Fallback image automatique si la vidéo publicitaire ne peut pas être lue
- **Sidebar** — Icônes Profil et Réglages pointaient vers la même page

---

## [2.2] — Avril 2026

### Ajouté
- **Ligue des Cochons** — Système de progression lifetime complet (4 paliers : 30/150/250/500 cochons infligés)
- **Cadres d'avatar animés** — Argent, Or, Diamant Néon, Feu (débloqués par palier)
- **Onglet Cochons dans le Leaderboard** — Classement par `cochonsGiven`
- **Code de table court** — 6 caractères (réduit depuis format long)
- **Lien d'invitation WhatsApp** — Deep-link avec code pré-rempli
- **Refonte UX Solo & Lobby** — Flow en 2 étapes (Choix du Mode → Configuration), cards 21% largeur

### Modifié
- **processMatchReward (Cloud Function)** — Incrémentation `cochonsGiven` + déblocage de palier Ligue
- **Leaderboard** — Tri par `cochonsGiven` sur l'onglet COCHONS

### Supprimé
- **Mode invité** — Supprimé définitivement du code client + comptes anonymes existants purgés

---

## [2.2.1] — 15 Avril 2026 — Patch : Bug Ligue des Cochons (leaguePoints = 0)

### Corrigé

#### 🐛 Bug majeur : `leaguePoints` toujours à 0 malgré des parties jouées

**Contexte :** Les comptes de test avaient tous `leaguePoints = 0` en Firebase.
La jauge "Cochons du mois" sur l'écran d'accueil affichait donc toujours 0.
Cause : triple chaîne de bugs dans la **collecte** des données. `ScoringEngine` et `RewardEngine` étaient corrects.

**Correction 1 — `GameScreen.tsx` ligne 366**
- ❌ `cochons: localPlayer.totalCochons` → champ ambigu = cochons **reçus** (malus)
- ✅ `cochons: localPlayer.totalCochonsInfliges` → compteur permanent cumulatif des cochons **infligés**,
  correctement incrémenté par `ScoringEngine` à chaque fin de manche

**Correction 2 — `GameOverScreen.tsx` ligne 78**
- ❌ `if (!isMancheOver && !isBoudé) return;`
  → Double-enregistrement : lors de la dernière manche (`MATCH_END`), `GameOverScreen` ET `GameScreen`
  appelaient tous deux `recordMatchResult()`, dupliquant les cochons comptabilisés
- ✅ `if ((!isMancheOver && !isBoudé) || isMatchOver) return;`
  → `GameOverScreen` = manches intermédiaires uniquement / `GameScreen` = MATCH_END exclusivement

**Correction 3 — `stats.service.ts` lignes 140–145**
- ❌ `economyService.setEconomy({ leaguePoints: stats.totalCochonsInflicted })` supprimé
  → Cette ligne **écrasait** Firebase avec le compteur local AsyncStorage (qui repart à 0 à chaque réinstallation)
- ✅ `leaguePoints` géré **exclusivement** par `RewardEngine` via `processServerReward()` dans `GameScreen`
  → Firebase est désormais la seule source de vérité, sans race condition possible

**Flux corrigé :**
```
ScoringEngine → cochonCount dans mancheHistory ✅
GameOverScreen → manches intermédiaires uniquement ✅
GameScreen (MATCH_END) → recordMatchResult(totalCochonsInfliges) + processServerReward() ✅
                       → RewardEngine → leaguePoints incrémenté correctement dans Firebase ✅
```

---

## [2.1] — Mars 2026

### Ajouté
- **HelpOverlay interactif** — Règles accessibles via le bouton "?" en jeu
- **Feedback sensoriel** — Shake avatar en cas de "Boudé"
- **Animations générales** — FlyingDomino, RewardOverlay, UnifiedResultOverlay, FadeInUp Leaderboard
- **Refonte UI Statistiques** — Layout paysage
- **Refonte UI Écran de Victoire** — Animation "Pluie de richesses"
- **Boutique & Cosmétiques** — Skins de table/dominos, inventaire hybride
- **Chat emoji** — Émoticônes prédéfinies en cours de partie
- **Volume BGM par défaut** — Réduit à 0.25/0.3 pour meilleur confort

### Modifié
- **GameScreen.tsx** — Refactor complet en Custom Hooks (`useGameEngine`, `useActionDispatcher`, `useTurnManager`, `useBotDecision`)
- **IA des Bots** — Refonte 3 niveaux : TI_MANMAY / MAPIPI / GRAN_MOUN + `BotService` Firestore

### Corrigé
- Désynchronisation multijoueur (host freeze en transition de round)
- Bug cascade timer/bots corrigé
- Boudé reste affiché longtemps chez les adversaires → résolu
- Double-attribution de score → résolu

---

## [2.0] — Février–Mars 2026

### Ajouté
- **Mode Manche** — Limite manche + Tie-breaker + Chiré fonctionnels
- **Mode Cochon** — Partie se termine sur quota de cochons atteint
- **Badges Cochon** — Comptage et affichage en jeu
- **Stats profil** — Enregistrement en fin de match (+1 victoire, points, cochons)
- **Fiabilisation Timer** — `turnMountedAtRef` centralisé, immunité 5s début de tour
- **Plein écran web mobile** — `unlockAudio()` au premier touch
- **Affichage numéro round/manche** — Avant le début de chaque partie

### Modifié
- **Architecture modulaire** — Séparation LogicEngine / useTurnManager / useActionDispatcher / useBotDecision
- **structuredClone** remplace `JSON.parse(JSON.stringify())` partout
- **Migration console.* → LogService** — 43 appels migrés

### Corrigé
- Bug domino initial en R1 (doit être le plus grand double)
- Bug raccord si domino double
- Garde-fou anti-boucle (Boudé TIE) — compteur max de re-deals
- Reset des étoiles centralisé dans ScoringEngine
- Rendu serpent déterministe (bug domino vertical corrigé)

---

## [1.0] — Janvier–Février 2026

### Ajouté
- **Projet initialisé** — React Native + Expo + Firebase
- **Authentification** — Firebase Auth (email)
- **Mode Solo** — 2 niveaux IA (débutant / intermédiaire)
- **Mode Multijoueur** — Tables publiques + tables privées (code/invitation)
- **Moteur de jeu complet** — Distribution Fisher-Yates, validation coups, sens anti-horaire
- **Système de score** — Étoiles, manches, cochons, chiré, Le Camion
- **127 tests unitaires** — 0% failure
- **Sécurité Firestore** — Rules pour rooms, bots, store, users
- **Cloud Function processMatchReward** — Validation économique côté serveur
- **Rotation des clés Firebase** — `.env` jamais versionné
- **Validation Zod** — Inputs utilisateur
- **Debounce updateGameState** — 300ms par roomId
- **Dashboard Admin** — Next.js (analytics, bans, bots, config, leaderboard, logs, notifications, players, store, tables, tournaments)

---

## Convention de versioning

- **Majeure (X.0)** : Refonte architecture ou fonctionnalité majeure
- **Mineure (X.Y)** : Nouveau bloc fonctionnel complet
- **Patch (X.Y.Z)** : Corrections de bugs et ajustements
## [2.3.1] — 2026-05-04

### Modifié
- **Ligue des Cochons** — la progression affichée est maintenant mensuelle et synchronisée entre l’accueil, `Ma Ligue` et l’écran Ligue.
- **Écran Ligue** — suppression des repères de jauge trompeurs ; affichage recentré sur les paliers du mois et les bonus en coins.
