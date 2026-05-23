# DONE - Archive des taches terminees

> Archive historique des taches livrees.
> Ce fichier ne contient aucune tache active.
>
> **Flux obligatoire :** `BACKLOG.md` -> `TASKS.md` -> `DONE.md`
>
> Convention : classement par date descendante (plus recent en haut), date au format AAAA-MM-JJ.

## Mai 2026

### 2026-05-23 - Correctif freeze bot solo manche 2

- [x] **[FIX-SOLO-BOT-FREEZE-MK]** Correction du gel de tour des bots METKAYALI en solo.
  - **Probleme** : en cas d'exception dans le moteur METKAYALI, le fallback rappelait `computeBotDecision`, qui pouvait relancer METKAYALI et laisser le bot sans `PLAY_TILE` ni `PASS_TURN`.
  - **Correction** :
    - Ajout d'une decision d'urgence dans `BotEngine` qui ne rappelle jamais METKAYALI et choisit un coup legal simple, ou laisse passer le bot.
    - `useBotDecision` journalise l'erreur via `LogService`, utilise ce fallback d'urgence, capture les echecs de dispatch asynchrones et retente le tour si `canAction` ou le dispatcher n'ont pas fait avancer le `turnId`.
    - Ajout de tests hook reproduisant un crash METKAYALI et un refus temporaire de `canAction`.
  - Fichiers modifies : `mobile/src/core/BotEngine.ts`, `mobile/src/hooks/game/useBotDecision.ts`, `mobile/src/hooks/game/useActionDispatcher.ts`, `mobile/src/hooks/game/__tests__/useBotDecision.test.tsx`

- [x] **[FIX-ANIM-DOMINO-DECOUPLING]** Decouplage de l'animation domino du moteur de jeu.
  - **Probleme** : l'animation entrait dans `isGamePaused` et pouvait figer le timer / l'affichage si `FlyingDomino` ne terminait pas correctement.
  - **Correction** :
    - L'animation ne pause plus le moteur ni le timer : elle reste une couche UI decorative.
    - Suppression du gel `visualGameState` / `freezeUI` autour de l'historique.
    - Ajout d'un watchdog cote `GameScreen` et cote `FlyingDomino` pour nettoyer toute animation bloquee.
  - Fichiers modifies : `mobile/src/screens/GameScreen.tsx`, `mobile/src/components/FlyingDomino.tsx`

- [x] **[FIX-MULTI-BOT-BOUDE-LOCK]** Correction du blocage en multi avec bots apres une partie bloquee.
  - **Probleme** : en mode multijoueur avec bots, une sequence `BOUDE -> PARTIE_END -> NEXT_ROUND` pouvait etre rejetee par le verrou de tour si Firestore livrait la phase de fin pendant qu'un `PASS_TURN` etait encore en cours. Un timeout pouvait aussi marquer le joueur humain comme `DISCONNECTED`, affichant a tort l'icone hors ligne.
  - **Correction** :
    - Les transitions host `RESOLVE_BOUDE` et `NEXT_ROUND` ne dependent plus du verrou des actions de tour.
    - Le verrou local se libere aussi au changement de phase, pas seulement au changement de `turnId`.
    - Le timer ne tourne plus pendant la phase `BOUDE`.
    - `handleTimeout` ne modifie plus le statut reseau d'un joueur humain.
  - Fichiers modifies : `mobile/src/core/LogicEngine.ts`, `mobile/src/hooks/game/useGameTimers.ts`, `mobile/src/hooks/game/useTurnManager.ts`, `mobile/src/hooks/game/useActionDispatcher.ts`

- [x] **[TEST-GAME-SCENARIO-RUNNER]** Ajout d'un runner de tests automatises anti-freeze.
  - **Objectif** : simuler des matchs complets reproductibles pour detecter les blocages moteur avant test manuel.
  - **Couverture** :
    - Matchs seedes en solo et en multijoueur avec bots.
    - Modes `MANCHE`, `SCORE`, `VICTOIRE` et `COCHON`.
    - Scenarios forces pour partie bloquee (`BOUDE`) et timeout humain sans fausse deconnexion.
    - Invariants a chaque etape : phase valide, joueur courant existant, statut humain preserve, fin de match sous limite anti-boucle.
  - Fichier ajoute : `mobile/src/core/__tests__/GameScenarioRunner.test.ts`

### 2026-05-22 - Ajout de bots dans les salles multijoueurs

- [x] **[AMELIORATION-MULTI-LOBBY-BOT-FILL]** : Permettre à l'hôte d'ajouter un bot pour compléter une table multi de 2 joueurs.
  - **Objectif** : Rendre possible le lancement d'une table avec seulement 2 humains en comblant le joueur manquant avec un bot, avec possibilité de kick pour faire de la place.
  - **Réalisation** :
    - Ajout d'une fonctionnalité de `addBotToWaitingRoom` dans Firebase pour insérer un profil `status: 'BOT'`.
    - Mise à jour du composant `LobbyScreen` pour afficher un bouton "Ajouter Bot" pour l'hôte sur les slots vides.
    - Ajout d'une interface (Alert) permettant de choisir le niveau du bot.
    - Ajout de la logique "Retirer" pour permettre d'éjecter un bot de la salle si on veut faire de la place.
    - Préservation du statut `BOT` et de la `difficulty` dans la routine `handleStartGame` de `GameScreen`.

### 2026-05-22 - Animation fluide des dominos

- [x] **[ANIM-DOMINO]** Animation glissée des dominos pendant le jeu
  - **Objectif** : Ajouter une animation fluide lorsqu'un joueur (local, bot ou distant) pose un domino sur la table, en respectant un mouvement réaliste et sans artifice.
  - **Réalisation** :
    - Le point de départ pour le joueur local est la position de la tuile dans la main. Pour les adversaires, l'animation part de leur avatar.
    - Ajout d'une mécanique de blocage transparente avec `isGamePaused` pour empêcher de jouer par-dessus l'animation sans altérer l'état du réseau (Firestore).
    - Modification pure de l'historique de jeu (surveillance de `gameState.history`) pour attraper les coups locaux ET distants sans redondance.
  - Fichiers modifiés : `mobile/src/screens/GameScreen.tsx`, `mobile/src/components/FlyingDomino.tsx`, `mobile/src/components/GameTable.tsx`

### 2026-05-22 - Résolution Définitive Bug Reset Stats & Economie

- [x] **[UX-LEADERBOARD]** Amélioration UX et Corrections du Classement
  - **Objectif** : Rendre le classement plus attractif, lisible et résoudre les problèmes de tri dans la base de données.
  - **Réalisation** :
    - Élargissement de la récupération des données de Top 50 à Top 100.
    - Création d'une "Sticky Banner" dorée en bas de l'écran affichant toujours la position du joueur courant.
    - Ajout d'un Auto-Scroll intelligent (`scrollToIndex`) qui défile jusqu'au joueur lors d'un clic sur la bannière, s'il est dans le Top 100. S'il n'y est pas, affiche un Toast informatif.
  - **Corrections (Bugs Découverts)** :
    - Correction du champ de requête Firestore pour l'onglet "Cochons" (remplacement de `economy.cochonsGiven` par `stats.totalCochonsInflicted`) qui causait un tri aléatoire des joueurs à l'écran.
    - Correction de la valeur du bandeau (affichait les points de ligue `leaguePoints` au lieu de `totalCochonsInflicted`).

- [x] **[R6-B1-STATS-RESET]** Refonte de la synchronisation (Architecture Pull-Only stricte)
  - **Objectif** : Résoudre définitivement le bug critique où les comptes de jeu voyaient leurs données réinitialisées lors de la reconnexion, particulièrement si l'objet `stats` était manquant ou le réseau instable.
  - **Correction** :
    - **`auth.service.ts`** : Architecture séparée. Initialisation avec des zéros par défaut UNIQUEMENT au `signUp`. Pour `signIn` et `getCurrentUser`, téléchargement forcé des données avec blocage de session si le réseau échoue (Fail-Safe).
    - **`stats.service.ts`** : Suppression du "fallback destructeur" qui réinitialisait la base Firebase. Si un compte légitime ne possède pas d'objet `stats` (ex: ancien compte avec juste une `economy`), le service utilise des zéros en mémoire UNIQUEMENT et ne push plus rien dans la DB au démarrage.
    - **`economy.service.ts`** : Suppression équivalente des fallbacks de création.
    - **Tests unitaires** : `StatsService.test.ts` mis à jour et passé avec succès pour valider le comportement "Pull-Only".

### 2026-05-21 - Jeu en ligne, Fix CORS & Persistance Solo
  - Fichiers modifiés : `mobile/src/core/services/stats.service.ts`, `mobile/src/core/services/economy.service.ts`, `mobile/app/home.tsx`, `mobile/src/core/__tests__/StatsService.test.ts`

- [x] **[VERSION-DISPLAY]** Homogénéisation et affichage de la version de l'application
  - **Objectif** : Afficher la version de l'application de façon homogène sur le splashscreen, les réglages et le formulaire de retour client, en lisant dynamiquement la version configurée dans `expo`.
  - **Correction** :
    - Version mise à jour à `"1.0.3"` dans `mobile/package.json` pour correspondre à `mobile/app.json` (source de vérité).
    - Lecture dynamique de la version via `Constants.expoConfig?.version` dans le Splashscreen (`mobile/app/index.tsx`), l'écran Réglages/Options (`mobile/app/modal.tsx`) et le composant Feedback (`mobile/src/components/MdcFeedbackModal.tsx`).
    - Rendu visuel soigné du label version (`v1.0.3` / `Version 1.0.3`) respectant les exigences de design de la charte de l'application.
  - Fichiers modifiés : `mobile/package.json`, `mobile/app/index.tsx`, `mobile/app/modal.tsx`, `mobile/src/components/MdcFeedbackModal.tsx`

- [x] **[R4-TECH-LEADERBOARD]** Agrégats mensuels persistants pour optimiser et fiabiliser les classements
  - **Objectif** : Éviter de charger/analyser l'intégralité de `matchHistory` de tous les joueurs côté client pour afficher les classements mensuels. Introduire une collection Firestore `users_monthly_stats` qui centralise les métriques mensuelles de chaque joueur.
  - **Nouveau schéma** : Document `/users_monthly_stats/{userId}_{yearMonth}` créé/mis à jour à chaque fin de match, changement de pseudo ou d'avatar. Champs : `cochonsGiven`, `cochonsSubis`, `pointsAccumulated`, `gamesPlayed`, `displayName`, `avatarId`, `activeFrame`.
  - **Index composites** : 3 index ajoutés dans `firestore.indexes.json` pour permettre le tri mensuel par `cochonsGiven`, `gamesPlayed` (proxy `-Cochons`) et `pointsAccumulated`.
  - **Règles Firestore** : Règle d'écriture sécurisée — chaque joueur ne peut modifier que son propre document `users_monthly_stats`.
  - **UI temps réel** : `LeagueHubView.tsx` recréé ses abonnements `onSnapshot` dynamiquement à chaque changement d'onglet (Mois/Global) ou de catégorie.
  - **Tests** : 20 tests unitaires ajoutés/adaptés dans `LeaderboardClassement.test.ts` — tous passent.
  - Fichiers modifiés : `firestore.rules`, `firestore.indexes.json`, `leaderboard.time.ts`, `leaderboard.service.ts`, `stats.service.ts`, `economy.service.ts`, `auth.service.ts`, `LeagueHubView.tsx`, `LeaderboardClassement.test.ts`

- [x] **[SOLO-PERSISTENCE]** Persistance locale de l'état de jeu en Solo (Restauration après F5 / rafraîchissement)
  - **Objectif** : Permettre au joueur solo de conserver sa progression (main exacte, dominos posés sur la table, scores des manches, configuration des bots) lors d'un rechargement de page (F5 sur le Web) ou d'un redémarrage de l'application sans utiliser Firestore.
  - **Correction** : Implémentation d'une sauvegarde automatique et en temps réel de l'état de jeu dans `AsyncStorage` sous la clé `@solo_game_state:${gameId}` lors de chaque mise à jour de l'état dans `useGameSync.ts`.
  - **Restauration** : Au démarrage d'une partie dans `GameScreen.tsx`, recherche de l'état sauvegardé avant de générer une nouvelle donne de départ.
  - **Nettoyage** : Purge de la sauvegarde locale dans `handleLeaveRoom` en cas d'abandon volontaire ou à la fin d'un match.
  - Fichiers modifiés : `mobile/src/hooks/game/useGameSync.ts`, `mobile/src/screens/GameScreen.tsx`

- [x] **[ONLINE-ONLY]** Jeu en ligne obligatoire + Nettoyage AsyncStorage
  - **Connexion requise** : Intégration de `@react-native-community/netinfo`. L'application bloque l'accès et affiche un écran premium "Connexion requise" si l'appareil est hors ligne.
  - **Authentification obligatoire** : Redirection automatique vers `/login` pour tout utilisateur non authentifié (sauf pour l'écran d'accueil splash et l'écran de login).
  - **Nettoyage AsyncStorage** : Suppression de la persistance locale non critique pour les utilisateurs authentifiés. La clé `@player_stats:{uid}` (qui contenait l'historique et les statistiques locales) est supprimée de l'AsyncStorage au moment de l'authentification. Les statistiques et l'historique de jeu sont chargés directement depuis Firestore pour garantir une source de vérité unique et éviter les conflits multi-comptes sur un même appareil.
  - Fichiers modifiés : `mobile/app/_layout.tsx`, `mobile/src/core/services/stats.service.ts`, `mobile/src/core/__tests__/StatsService.test.ts`, `mobile/src/components/NetworkRequiredScreen.tsx`.

- [x] **[FIX-ZOMBIE-RECONNECTION]** Validation de la table active au démarrage (Anti écran de chargement infini)
  - **Problème** : Lors du démarrage initial de l'application, l'application redirigeait automatiquement le joueur vers la room stockée dans `active_roomId` de l'AsyncStorage sans vérifier sur Firestore si celle-ci était toujours active. Cela causait un écran noir/blanc de chargement infini ou un retour sur une table fermée/supprimée.
  - **Correction** : Implémentation d'une requête Firestore (`getDoc`) au démarrage dans `forceBackToActiveMatch`. Si la room n'existe plus ou n'a pas le statut `PLAYING`, la clé locale `active_roomId` est purgée de l'AsyncStorage et de Firestore (via `setUserActiveRoom`), et la redirection zombie est bloquée.
  - Fichier modifié : `mobile/app/_layout.tsx`.

- [x] **[CF-PROCESSMATCHREWARD-CORS]** Correction du CORS Web local sur `processMatchReward`
  - **Cause** : Les CF `onCall` v1 Firebase bloquent les origines `http://localhost` (non-HTTPS), rendant les tests de récompenses post-match impossible sur `localhost:8081`. Firebase ne permet pas la migration directe d'une CF v1 vers v2 pour une fonction existante.
  - **Solution** : Côté client uniquement — la CF `processMatchRewardHttp` (onRequest) qui gère CORS correctement sert maintenant de **chemin principal sur Web local** (au lieu d'être un fallback). La logique de détection `shouldUseWebLocalRewardHttpFallback()` court-circuite maintenant avant tout appel `httpsCallable`, évitant le blocage CORS sans modifier la CF en production.
  - **Bonus** : Extraction de la logique d'application du reward HTTP dans `callAndApplyHttpReward()` (méthode privée réutilisable). Fin de la duplication de code entre le court-circuit direct et le fallback dans le `catch`.
  - **Aucun déploiement CF** requis — `processMatchReward` en production reste inchangé.
  - Fichier modifié : `mobile/src/core/services/economy.service.ts`


- [x] **[SENTRY-AUDIO-WATCHDOG]** Fix crash fatal TypeError watchdog SoundManager (Android)
  - Le watchdog appelait `this.currentMusic.play().catch()` directement
  - Sur certains appareils expo-audio, `play()` retourne `undefined` → `.catch()` explose (FATAL, 5 users, SM-S928B Android 16)
  - Remplacé par `this.safePlayPlayer()` qui vérifie le type retour avant d'appeler `.catch()`
  - Fichier : `mobile/src/core/audio/SoundManager.ts`

- [x] **[SENTRY-AUDIO-CHROME-IOS]** Suppression des NotAllowedError autoplay Web Chrome iOS
  - Guard `isAudioAllowed` ne couvrait que Safari iOS, pas Chrome iOS (`CriOS`)
  - 31 events / 16 users en cours depuis 2 semaines sur `play.domino-martinique.online`
  - Chrome iOS ajouté au guard — même comportement que Safari iOS (audio désactivé)
  - Fichier : `mobile/src/core/audio/SoundManager.ts`



- [x] **[UX-ADMIN-SIDEBAR]** Menu latéral rétractable + Défilement horizontal des tableaux (Ads)
  - Sidebar rétractable via un toggle (chevron) pour maximiser l'espace de travail
  - Transition fluide et état persisté par session (React state)
  - Ajout du défilement horizontal (`overflow-x-auto`) sur le tableau des publicités
  - `min-width` garanti pour éviter l'écrasement des colonnes sur petits écrans

- [x] **[ECO-WELCOME-DAILY]** Reéquilibrage des constantes économie bienvenue
  - `NEW_PLAYER_COINS` : `1000` → `300` coins à la création de compte
  - `DAILY_REWARD_COINS` : `300` → `200` coins pour le cadeau du jour
  - Constante `AD_REWARD_COINS = 100` ajoutée pour la récompense pub
  - Fichier `economy.constants.ts` — aucun autre fichier à modifier
  - Joueurs existants non affectés (cadeau bienvenue = création compte uniquement)

- [x] **[ADS-REWARD]** Bouton "Voir une pub → +100 coins" en fin de match
  - Composant `AdRewardButton.tsx` créé — **réutilisable partout dans l'app**
  - Props : `coinsAmount`, `onClaim` (async), `label`, `variant` (`default`/`prominent`), `enterDelay`, `disabled`
  - Guard interne : un seul clic par montage, état `claimed` local
  - Variante `prominent` disponible pour les contextes à fort appel à l'action
  - Branché dans `UnifiedResultOverlay` (fin de match uniquement, solo et multi)
  - Chaîne de données : `GameScreen.onAdRewardClaim` → `economyService.creditAdReward()` → Firestore
  - Méthode `creditAdReward()` ajoutée à `EconomyService`
  - `GameOverlays` et `UnifiedResultOverlay` mis à jour avec la prop `onAdRewardClaim`



- [x] **[BUG-LIGUE-GRADEUP-OVERLAY]** Retour correct au `RewardOverlay` principal apres fermeture du popup de palier
  - Le `X` de la sous-modale Ligue referme uniquement le popup de grade-up
  - Le `RewardOverlay` principal redevient visible au lieu de laisser un fond vide
  - Le comportement a ete valide sur le flow Ligue cible

- [x] **[LIGUE-DEBUTANT-FIRST-COCHON]** Ajout du grade `Debutant` des le 1er cochon
  - `0 cochon` reste `Sans grade`
  - `1 cochon` donne maintenant le grade `Debutant`
  - Aucun cadre n'est debloque a ce premier palier, les seuils suivants restent inchanges
  - Les ecrans Ligue, badges, overlays et regles derivees ont ete realignes

- [x] **[AMELIORATION-HAND-AUTO-SORT]** Tri local de la main en partie
  - Ajout d'un menu `Trier` au-dessus de l'avatar du joueur local
  - V1 livree avec 3 modes : `Auto`, `Doubles`, `Somme`
  - Le tri reste purement local a l'affichage et n'impacte ni les regles ni les autres joueurs
  - En solo, l'onglet `Infos` du menu d'options affiche maintenant la difficulte des bots
  - En solo, les bots n'affichent plus de grade ni de cadre Ligue sur leurs avatars
  - Validation ciblee executee sur `PlayerHand.test.tsx`, `PlayerArea.test.tsx` et `ActionFooter.test.tsx`

### 2026-05-12 - Celebrations Ligue et finitions pre-lancement

- [x] **[LEAGUE-GRADEUP-CELEBRATION]** Passage de palier Ligue rendu plus premium
  - `applause.mp3` integre au pipeline audio et joue `800 ms` apres `leagueJingle`
  - La modale de grade-up ne se ferme plus sur simple tap hors CTA
  - Ajout de CTA explicites `Accueil` et `Continuer`
  - Le partage social du palier reste disponible dans la modale
  - Validation ciblee ajoutee sur `RewardOverlay.test.tsx` et `SoundManager.test.ts`

- [x] **[MATCH-END-APPLAUSE]** Celebration de fin de match enrichie avec un second tail audio
  - `matchEnd` reste le stinger principal du modal final
  - `applause.mp3` est maintenant joue `800 ms` apres `matchEnd`
  - Le declenchement est centralise dans `UnifiedResultOverlay` pour eviter les doublons
  - Validation ciblee ajoutee sur `UnifiedResultOverlay.test.tsx`

- [x] **[AUDIO-BGM-SIMPLIFY]** Simplification finale du modele BGM pre-lancement
  - Le runtime n'utilise plus que `appActive` et `inGame`
  - `appActive` choisit une variante locale `A/B` une seule fois par session
  - `inGame` utilise une piste locale dediee unique
  - Les ecrans utilitaires (`profil`, `parametres`, `stats`, `boutique`, `collection`) restent silencieux
  - L'interface admin audio ne peut plus modifier les affectations runtime des BGM
  - Validation executee sur les tests audio cibles et sur le build `admin`

### 2026-05-12 - Stabilisation du flow de fin de match

- [x] **[MATCH-END-OVERLAY-FLOW]** Correction de la sequence visuelle et sonore de fin de match
  - Le modal final de `MATCH_END` est maintenant arme explicitement apres le `RoundResultCard`, au lieu de dependre d'un etat d'overlay residuel
  - La transition `MANCHE_END -> MATCH_END` ne peut plus faire apparaitre brievement le modal final avant le bon timing
  - `RoundResultCard` et `UnifiedResultOverlay` reinitialisent correctement leur garde-fou audio a la fermeture
  - Le stinger `matchEnd` est joue par l'overlay final du match, sans conflit avec le resume de round
  - Validation ciblee ajoutee sur `GameScreen.gradeUp.test.tsx` et `RoundResultCard.test.tsx`

- [x] **[AUDIO-ASSET-CLEANUP]** Menage et reorganisation du dossier `assets/sounds`
  - Suppression des fichiers legacy non utilises et retrait complet de `start-game.mp3`
  - Renommage des fichiers metier pour des noms plus explicites (`stinger-*`, `sfx-shuffle`, `bgm-shared`)
  - Reorganisation en sous-dossiers `bgm/`, `sfx/`, `stingers/`
  - `SoundManager.ts` realigne sur les nouveaux chemins
  - Tests audio cibles relances avec succes

### 2026-05-11 - Stabilisation audio gameplay avant lancement

- [x] **[AUDIO-GAMEPLAY-HARDENING]** Audit, stabilisation et validation du pipeline audio en jeu
  - Separation propre entre `Musique` et `Effets` dans le runtime et dans le menu de jeu
  - Suppression des doublons majeurs sur les sons terminaux round / manche / match
  - Politique de priorite audio runtime ajoutee : BGM, SFX gameplay, UI, stingers majeurs
  - Stabilisation des transitions BGM, du watchdog, du preload et du teardown de tests
  - Tuning centralise des gains SFX (`clack`, `timer`, `end_time`, `notify`, `toktok`, stingers de fin)
  - Refactor BGM simplifie : aucune musique sur splash / login, une musique hors partie, une musique en partie
  - Fallback sonore ajoute sur l'overlay final pour mieux securiser le son de fin de match
  - Validation manuelle confirmee : BGM sur `/home`, BGM et SFX en jeu, mute fonctionnel, modals sonores OK

### 2026-05-11 - Fix gameplay Cochon + tie-break Boudé en multijoueur

- [x] **[COCHON-SCORE-FIX]** Correction de l'imputation des cochons
  - Le compteur `🐷` visible en mode Cochon correspond maintenant uniquement aux cochons infliges par le vainqueur
  - Les joueurs a `0 etoile` ne gagnent plus de `🐷` par erreur : ils recoivent seulement le malus `-1 point`
  - La condition de fin de match en mode Cochon s'appuie desormais sur `totalCochonsInfliges`
  - Les ecrans de jeu, modals de fin, resultats et recompenses lisent tous la meme source de verite
  - Tests solo, multi local et tests automatises valides

- [x] **[BOUDE-TIEBREAK-FIX]** Correction de la redonne apres egalite sur partie bloquee
  - Apres une egalite a 2 joueurs, seul un joueur ex aequo peut demarrer la redonne
  - Le starter est choisi via le plus grand double parmi les joueurs a egalite uniquement
  - Le 3e joueur non ex aequo est exclu du tie-break de redemarrage
  - Ajout d'un garde-fou UI pour fermer le modal de fin de round si le client a deja recu la phase suivante
  - Tests moteur et test d'integration ajoutes sur la sequence `BOUDE -> redonne -> premier coup force`

- [x] **[LIGUE-MOBILE-UX]** Refonte mobile de `/ligue-cochons`
  - Header compacte : titre reduit, aligne a gauche, sous-titre supprime
  - Navigation principale `Ma Ligue / Mois / Global` integree dans la barre du haut
  - Classements compactes : lignes joueurs moins hautes pour afficher plus d'entrees
  - Filtres de classement deplaces dans une colonne laterale compacte a gauche
  - Le switch `Total / Perf` n'apparait plus que sur le filtre actif
  - Scroll vertical du classement retabli apres la refonte en 2 colonnes

### 2026-05-08 - Bots adaptatifs + IA METKAYALI niveau 4

- [x] **[BOT-ADAPTIVE]** Bots adaptatifs + IA METKAYALI
  - Moteur IA 4 couches : suivi des tuiles, Monte Carlo, analyse endgame, modelisation adverse
  - Performance cible tenue : decision < 100 ms
  - Niveau 4 branche dans le jeu, le solo et l'admin
  - Tests unitaires verts

### 2026-05-08 - Harmonisation grades Ligue + logs admin + fix audio iOS + tchat consommable

- [x] **[R4-M3]** Tchat consommable a l'unite
- [x] **[R4-B-GRADES]** Harmonisation des grades de la Ligue
- [x] **[ADMIN-LOGS]** Refonte page logs admin + lien Sentry
- [x] **[AUDIO-IOS-SAFARI]** Silence des erreurs Safari iOS autour du son

### 2026-05-06 - Partage social + politique de confidentialite

- [x] **[R4-UX3]** Partage social victoire + passage de palier
- [x] **[LP-POLICY]** Page Politique de confidentialite pour la landing page

### 2026-05-06 - Sprint Post-Lancement P1

- [x] **[R4-B2]** Popup de passage de palier dans le vrai flux de jeu
- [x] **[R4-B5]** Fix web sur le domino gagnant reutilise
- [x] **[R4-M4]** Cadeau quotidien conditionne a une pub
- [x] **[R4-M2]** Pubs dans boutique, vestiaire, stats, classement et ligue
- [x] **[R4-M5]** Notifications push quotidiennes Android

### 2026-05-04

- [x] **[R4-B1]** Source de verite mensuelle unifiee pour la Ligue des Cochons
- [x] **[R4-UX1]** `/ligue-cochons` devient l'ecran maitre de la ligue
- [x] **[R4-UX2]** Separation nette entre stats mensuelles et cumulees

## Avril 2026

L'historique detaille d'avril reste archive dans `history.md` et dans les versions precedentes de ce fichier.
