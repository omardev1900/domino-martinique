> Convention : classement par date descendante (plus recent en haut), date au format AAAA-MM-JJ.

## Juin 2026

### 2026-06-05

- **[BUG-DOUBLE6-MANCHE]** : Correction du bug de règle où le premier joueur d'une nouvelle manche n'était pas celui possédant le plus gros double, suite à la persistance d'une égalité du round précédent (`tiedPlayerIds` ignoré en début de manche).
- **[BUG-BOUDE-ENDMATCH]** : Correction du bug d'affichage où le badge "🚫 BOUDÉ" restait affiché en fin de match et chevauchait la modale de résultats (nettoyage forcé de `localBoudedPlayerId` sur les phases de fin).
- **[BUG-MULTI-BLOCKED]** : Résolution du blocage fatal des parties multijoueur. Correction d'un deadlock où l'animation "BOUDÉ" verrouillait le tour indéfiniment empêchant le déclenchement de la passe automatique. Fiabilisation du moteur de synchronisation Firebase (`useGameSync`) en remplaçant la comparaison fragile d'horodatage (`lastActionTimestamp`) par une validation rigoureuse de la progression d'état (`mancheNumber`, `roundNumber`, `turnId`), ce qui évite d'ignorer des mouvements valides en cas de latence ou désynchronisation d'horloge.
- **[SENTRY-UNDEFINED-FN]** : Correction du crash Sentry `TypeError: undefined is not a function` sur l'interaction tactile (`GameScreen.tsx`). Remplacement de variables muables (`let`) par des callbacks stables (`useCallback`) pour les événements asynchrones (`handleTimeoutRef`), et sécurisation du passage des dépendances (`onSideSelect`) lors du démontage en plein appui.

### 2026-06-03

- **[BUG-ECO-GAINS]** : Gains anormaux selon les modes de jeu (fixés à +300 coins net pour le vainqueur, et +0 pour les perdants, quel que soit le mode ou le nombre de manches).
- **[SOLO-REPLAY-FEATURE]** : Ajout d'un bouton pour rejouer instantanément une partie Solo en fin de match (conserve mode, objectif et difficulté).
- **[UI-ENDMATCH-REFACTO]** : Refonte de la navigation du modale de fin de match (boutons Partager et Rejouer intégrés en haut, suppression des boutons doublons en bas, ajout de libellés).

### 2026-06-03 (Précédents)

- **[BUG-MULTI-BOUDE-LOOP]** (Fait)
  - **Problème** : En multijoueur, le jeu figeait complètement sur l'état "boudé" dans certains cas, particulièrement quand le créateur de la room abandonnait, et la réinitialisation de `tiedPlayerIds` provoquait des contraintes indues de démarreurs.
  - **Cause** : Le composant `useBotDecision` vérifiait la légitimité du bot via `roomData.createdBy !== localPlayerId`. Si le créateur quittait la room, aucun des autres joueurs ne prenait le relai, ce qui bloquait les bots et déclenchait un auto-pass continu. Par ailleurs, les id liés aux TIE n'étaient pas réinitialisés.
  - **Correction** : 
    - Modification de `useBotDecision` pour utiliser la propriété calculée `isLocalHost` (qui est correctement réattribuée en cas de départ du créateur).
    - Ajout de la propagation `isLocalHost` dans `useGameEngine`.
    - Correction de la réinitialisation de `tiedPlayerIds` dans `computeNextRoundState` (`LogicEngine.ts`).

- **[BUG-RECONNECT-MULTI]** (Fait)
  - **Problème** : Lors d'une perte réseau en mode multijoueur, l'application affichait un écran blanc. Au retour du réseau, aucune invitation n'était proposée pour rejoindre la partie (contrairement au mode solo).
  - **Correction** : 
    - Modification de `app/_layout.tsx` pour afficher `NetworkRequiredScreen` en overlay absolu, ce qui empêche le démontage critique de la structure applicative et de la navigation.
    - Ajout du composant `MultiResumeModal` et du hook `useMultiResume` pour repérer les rooms en cours (`WAITING` ou `PLAYING`) et proposer poliment au joueur de les rejoindre avec indication de perte de coins s'il ignore la demande.

- **[BUG-UI-SANS-GRADE]** (Fait)
  - **Problème** : La mention "Sans grade" s'affichait systématiquement à la fin du second match d'une session, même si le joueur avait été promu.
  - **Cause** : `playerEconomyRef.current` perdait le `leagueGrade` après l'application des récompenses.
  - **Correction** : Mise à jour de `GameScreen.tsx` pour inclure et propager le `leagueGrade` dans la mise à jour de l'économie locale.

- **[GAMEPLAY-BOT-RHYTHM]** & **[UI/UX] Visibilité "boudé"** (Fait)
  - **Problème** : Les bots jouaient trop vite, son "toktok" en double, et pas de texte "boudé" sur le plateau.
  - **Cause** : L'état `isMoveAnimationPending` n'était pas envoyé au composant, et `useAutoPass` doublonnait le son du dispatcher.
  - **Correction** :
    - Pause de la réflexion des bots pendant le vol des dominos.
    - Centralisation du son "toktok" dans `useActionDispatcher.ts`.
    - Ajout d'une modale texte "Vous êtes boudé" ou "[Nom] est boudé" au centre du `GameScreen`.




  - **Cause racine (identifiée en production)** : `pushToFirebase()` échouait **silencieusement sur 100% des appels** depuis le client Web. Le SDK Firestore v9 modular rejette toute écriture contenant un champ `undefined`. La fonction ne nettoyait que 2 champs hardcodés (`lastDailyRewardTimestamp`, `chatInventoryMigratedAt`) mais pas les autres optionnels (`lastStoreAdTimestamp`, `unlockedChatItems`, etc.). L'erreur était catchée sans rethrow → Firestore n'avait jamais l'économie → la CF `processMatchReward` lisait 0 et récompensait depuis 0.
  - **Cause secondaire** : Race condition `listenToEconomy` — un snapshot Firestore périmé (avant propagation du write) pouvait écraser le cache local correct (500 coins → 300 dans l'UI).
  - **Corrections** :
    - `economy.service.ts` — `pushToFirebase` : nettoyage GÉNÉRIQUE via `Object.entries` (supprime tout champ `undefined` au lieu de 2 champs hardcodés).
    - `economy.service.ts` — `pushToFirebase` : compteur `pendingWrites` (incrémenté avant `setDoc`, décrémenté dans `finally`).
    - `economy.service.ts` — `listenToEconomy` : ignore le snapshot si `pendingWrites > 0`.
    - `auth.service.ts` — `signUp` : flag `@new_player_coins_protected` (garde-fou résiduel si le push est lent).

  - **Problème** : quand `home.tsx` appelle `syncFromFirebase` dans les millisecondes suivant la création du compte, Firestore peut retourner `economy: {}` ou `coins: 0` si la propagation du `pushToFirebase` n'est pas encore terminée. `mergeEconomies` prend alors `remote.coins = 0` et écrase le cache local qui contenait les 300 coins.
  - **Correction** :
    - `auth.service.ts` : après `pushToFirebase` dans `signUp`, pose le flag `@new_player_coins_protected = 300` dans AsyncStorage.
    - `economy.service.ts` : dans `syncFromFirebase`, si ce flag est présent et que `downloadedEconomy.coins < protectedCoins`, restaure les coins locaux, re-pousse vers Firestore et consomme le flag.
  - **Sécurité** : SEC-3 préservé — on ne restaure que si les coins Firestore sont *inférieurs* à la valeur attendue, jamais supérieurs. Le flag n'est actif que les quelques secondes après la création de compte.

- [x] **[ECO-OBJECTIVES-DEFAULT]** Valeurs par défaut des modes de jeu revues à la hausse dans `solo.tsx` et `lobby.tsx` (solo + multijoueur) :
  - Mode Victoire : `5` → `10` victoires
  - Mode Score : `10` → `25` points
  - Mode Cochon : `3` → `5` cochons
  - Mode Manche : `3` → `5` manches
  - L'état initial `useState` aligné sur VICTOIRE = 10.

- [x] **[ECO-AD-TIMER-REWARD]** Cooldown de la pub vidéo en boutique réduit de **1 heure à 3 minutes** (`3 600 000 ms` → `180 000 ms`) dans `store.tsx` et commentaire synchronisé dans `economy.types.ts`.

- [x] **[ANIM-DOMINO-POLISH]** Amélioration de l'animation des dominos posés : trajectoire plus naturelle, timing plus fluide, positionnement fiable depuis la main ou l'avatar, sans recoupler l'animation au moteur de jeu.

- [x] **[ECO-REBALANCE]** Révision de l'économie : coût d'un jeu multi et gains de victoire ajustés dans `economy.constants.ts` et Cloud Function.

- [x] **[BUG-LEAGUE-TIER-REWARD]** Palier Ligue des Cochons : coins de récompense désormais crédités et affichés dans l'animation `RewardOverlay`. `LEAGUE_FRAMES_ENABLED` ne bloque plus `frameCoinsBonus` ni l'affichage de la modale grade-up quand `shouldHideMainRewardContent`.

- [x] **[BUG-DOMINO-SIZE-ON-RESUME]** Dominos qui rétrécissaient au retour en jeu (appel, notification) — layout React Native recalcule maintenant correctement les dimensions après un `AppState` change vers `active`.

- [x] **[BUG-APP-RESUME-AFTER-CALL]** Reprise de partie après un appel téléphonique fiabilisée — reconnexion Firestore et focus audio/game correctement restaurés au retour d'interruption.

- [x] **[R6-B1-STATS-RESET]** Bug majeur résolu : statistiques et économie (coins, diamants, ligue) ne sont plus remises à zéro lors de la connexion. Architecture Pull-Only stricte implémentée.

- [x] **[BUG-MULTI-GRADE-DISPLAY]** Grade/cadre Ligue qui disparaissait parfois en cours de partie multi — le snapshot Firestore transporte maintenant correctement le `leagueGrade` du profil joueur à chaque mise à jour de la room.

### 2026-06-01

- [x] **[ADMIN-NEWS-MANAGER]** Accès à `/dashboard/news` ouvert aux managers
  - Retrait de `/dashboard/news` de la liste `SUPERADMIN_ONLY` dans `layout.tsx`
  - Suppression de `superadminOnly: true` sur l'entrée `Actualités` dans `Sidebar.tsx`
  - Les règles Firestore étaient déjà permissives (`isAdmin()`) : aucun changement côté DB
  - Les managers peuvent désormais créer, modifier, activer/désactiver et supprimer des actualités

## Mai 2026

### 2026-05-29

- [x] **[BUG-UX-DAILY-GIFT-MODAL-DUPLICATE]** Correction des apparitions multiples et intempestives du modal "Cadeau du Jour".
  - **Problème** : Le modal pouvait s'afficher en double car le `useFocusEffect` de l'accueil se redéclenchait. De plus, il pouvait réapparaître chez un joueur ayant déjà réclamé le cadeau si le pull Firestore (qui écrase le local) ramenait un timestamp obsolète juste après l'action.
  - **Solution** : 
    1. Ajout de gardes dans `home.tsx` (`if (showWelcomeReward || showDailyReward || pendingDailyReward) return;`) pour ne jamais reprogrammer un affichage si un est déjà en attente.
    2. Modification de `syncFromFirebase` dans `economy.service.ts` pour qu'il utilise `mergeEconomies(local, remote)` au lieu d'un écrasement brutal. Le `lastDailyRewardTimestamp` le plus récent (via `Math.max`) est désormais conservé de force.

- [x] **[BUG-BLOCKED-ROUND-BEFORE-MATCH-END-DUPLICATE]** Correction du clignotement du modal de Round Bloqué à la fin d'une manche/match.
  - **Problème** : Lorsque la phase passe de `BOUDE` directement à `MANCHE_END` ou `MATCH_END`, le modal `RoundResultCard` était réaffiché une seconde fois par l'effet de ces phases, provoquant un clignotement désagréable.
  - **Solution** : Ajout de la garde `boudeHandledRef.current` pour les phases `MANCHE_END` et `MATCH_END` (tout comme c'était déjà le cas pour `PARTIE_END`) afin de passer directement au flux suivant (Overlay de Manche/Match ou Publicité) sans réafficher la carte de résultat du round bloqué qui a déjà été montrée.

- [x] **[FEAT-STORE-AD]** Ajout d'une carte vidéo récompensée dans la boutique.
  - **Objectif** : Permettre aux joueurs de gagner 100 coins supplémentaires en regardant une pub, avec un cooldown d'une heure.
  - **Technique** : Création du composant `StoreAdCard` intégré à la grille des items, ajout du timestamp `lastStoreAdTimestamp` dans le profil économique, et logique d'affichage adaptative selon le cooldown calculé.

- [x] **[FEAT-STORE-REVIEW]** Stratégie de notation et filtre de satisfaction
  - **Objectif** : Capter les notes 5 étoiles de manière organique sans enfreindre les règles Google Play (Incentivized Ratings interdites).
  - **Implémentation** : Ajout du hook `useStoreReviewStrategy` qui compte les victoires (`@domino_win_count`). Au bout de 1, 5, 10, 20... victoires, la `SatisfactionFilterModal` s'affiche.
  - **Logique** : Si le joueur aime -> appel natif `expo-store-review`. S'il n'aime pas trop -> redirection vers le `MdcFeedbackModal`. Dès qu'un choix (autre que "Plus tard") est fait, l'état `@domino_has_answered_review` est sauvegardé et la popup ne réapparaîtra plus jamais.

- [x] **[FEAT-FORCE-UPDATE]** Mise à jour obligatoire via Play Store
  - **Problème** : Les anciens clients peuvent causer des bugs s'ils ne sont pas à jour avec le serveur.
  - **Solution** : Ajout d'un système de blocage distant via Firestore (`config/appSettings`).
  - **Implémentation** : Création du hook `useForceUpdate` et du composant `ForceUpdateModal` (impossible à fermer). Le bouton redirige directement vers le Play Store. Le système ignore la vérification s'il tourne sur le Web ou en cas d'erreur réseau pour ne jamais bloquer le joueur par erreur.
  - Fichiers modifiés : `mobile/src/hooks/useForceUpdate.ts`, `mobile/src/components/ForceUpdateModal.tsx`, `mobile/app/_layout.tsx`, `mobile/firestore.rules`

- [x] **[BUG-SOLO-RESUME]** Partie solo perdue après interruption (appel, mise en arrière-plan, OS kill)
  - **Problème** : Le `gameId` solo était généré avec `Date.now()` à chaque lancement, rendant impossible la restauration de l'état AsyncStorage sauvegardé entre deux sessions.
  - **Correction A** : `gameId` stable `solo-${uid}` — même joueur = même clé AsyncStorage, garantissant la restauration après toute interruption.
  - **Correction B** : Détection de partie en cours dans `solo.tsx` au retour sur l'écran (`useFocusEffect`) + bandeau ⏸️ animé avec deux actions : **Reprendre** (navigue directement) / **Nouvelle partie** (confirmation Alert + purge de l'ancienne clé).
  - **Correction C** : Dans `startSoloGame()`, si l'état restauré est en phase `MATCH_END` (OS a tué l'app avant `handleLeaveRoom`), la clé est purgée et une nouvelle partie démarre au lieu de bloquer le joueur sur un écran de fin fantôme.
  - Fichiers modifiés : `mobile/app/solo.tsx`, `mobile/src/screens/GameScreen.tsx`

### 2026-05-27

- [x] **[BUG-LEAGUE-TIER-REWARD]** Palier Ligue des Cochons : coins de récompense non crédités et non affichés dans l'animation. La modale grade-up doit aussi afficher les coins gagnés lors du passage de palier.
- [x] **[BUG-DOMINO-SIZE-ON-RESUME]** Dominos qui rétrécissent au retour en jeu (appel, notification) — layout non recalculé après AppState `active`.

### 2026-05-24 - Stabilisation affichage tour pendant animation

- [x] **[BUG-TURN-ADVANCE-BEFORE-DOMINO-LAND]** Correction du passage visuel trop tot au joueur suivant pendant l'animation domino.
  - **Probleme** : le compteur, le joueur actif et les dominos jouables du prochain joueur pouvaient s'afficher avant que le domino joue soit visuellement pose sur le plateau.
  - **Correction** :
    - L'UI garde le joueur qui vient de jouer comme reference visuelle jusqu'a la fin complete de l'animation.
    - Le moteur de jeu peut continuer a preparer l'etat suivant, mais l'affichage du tour suivant attend la pose definitive du domino.
    - Ajout d'un test de regression sur `GameScreen` pour verifier que l'UI ne libere pas le prochain tour pendant l'animation.
  - Fichiers modifies : `mobile/src/screens/GameScreen.tsx`, `mobile/src/screens/__tests__/GameScreen.gradeUp.test.tsx`
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

- [x] **[TEST-RESOLVE-BOUDE-TIEBREAK]** Securisation automatisee de la redonne apres egalite BOUDE.
  - **Objectif** : verrouiller la regle qui exclut les joueurs non ex aequo du choix du starter apres une partie bloquee a egalite.
  - **Correction / clarification** :
    - Le test hook `RESOLVE_BOUDE` verifie maintenant la regle metier stable : le starter de redonne doit etre parmi les joueurs ex aequo, sans imposer un joueur precis alors que les mains sont redistribuees.
    - Ajout d'un test moteur repete confirmant qu'un perdant non ex aequo n'est jamais choisi apres redonne BOUDE.
  - Fichiers modifies : `mobile/src/hooks/game/__tests__/useActionDispatcher.test.ts`, `mobile/src/core/__tests__/LogicEngine.test.ts`

### 2026-05-22 - Ajout de bots dans les salles multijoueurs

- [x] **[AMELIORATION-MULTI-LOBBY-BOT-FILL]** : Permettre Ã  l'hÃ´te d'ajouter un bot pour complÃ©ter une table multi de 2 joueurs.
  - **Objectif** : Rendre possible le lancement d'une table avec seulement 2 humains en comblant le joueur manquant avec un bot, avec possibilitÃ© de kick pour faire de la place.
  - **RÃ©alisation** :
    - Ajout d'une fonctionnalitÃ© de `addBotToWaitingRoom` dans Firebase pour insÃ©rer un profil `status: 'BOT'`.
    - Mise Ã  jour du composant `LobbyScreen` pour afficher un bouton "Ajouter Bot" pour l'hÃ´te sur les slots vides.
    - Ajout d'une interface (Alert) permettant de choisir le niveau du bot.
    - Ajout de la logique "Retirer" pour permettre d'Ã©jecter un bot de la salle si on veut faire de la place.
    - PrÃ©servation du statut `BOT` et de la `difficulty` dans la routine `handleStartGame` de `GameScreen`.

### 2026-05-22 - Animation fluide des dominos

- [x] **[ANIM-DOMINO]** Animation glissÃ©e des dominos pendant le jeu
  - **Objectif** : Ajouter une animation fluide lorsqu'un joueur (local, bot ou distant) pose un domino sur la table, en respectant un mouvement rÃ©aliste et sans artifice.
  - **RÃ©alisation** :
    - Le point de dÃ©part pour le joueur local est la position de la tuile dans la main. Pour les adversaires, l'animation part de leur avatar.
    - Ajout d'une mÃ©canique de blocage transparente avec `isGamePaused` pour empÃªcher de jouer par-dessus l'animation sans altÃ©rer l'Ã©tat du rÃ©seau (Firestore).
    - Modification pure de l'historique de jeu (surveillance de `gameState.history`) pour attraper les coups locaux ET distants sans redondance.
  - Fichiers modifiÃ©s : `mobile/src/screens/GameScreen.tsx`, `mobile/src/components/FlyingDomino.tsx`, `mobile/src/components/GameTable.tsx`

### 2026-05-22 - RÃ©solution DÃ©finitive Bug Reset Stats & Economie

- [x] **[UX-LEADERBOARD]** AmÃ©lioration UX et Corrections du Classement
  - **Objectif** : Rendre le classement plus attractif, lisible et rÃ©soudre les problÃ¨mes de tri dans la base de donnÃ©es.
  - **RÃ©alisation** :
    - Ã‰largissement de la rÃ©cupÃ©ration des donnÃ©es de Top 50 Ã  Top 100.
    - CrÃ©ation d'une "Sticky Banner" dorÃ©e en bas de l'Ã©cran affichant toujours la position du joueur courant.
    - Ajout d'un Auto-Scroll intelligent (`scrollToIndex`) qui dÃ©file jusqu'au joueur lors d'un clic sur la banniÃ¨re, s'il est dans le Top 100. S'il n'y est pas, affiche un Toast informatif.
  - **Corrections (Bugs DÃ©couverts)** :
    - Correction du champ de requÃªte Firestore pour l'onglet "Cochons" (remplacement de `economy.cochonsGiven` par `stats.totalCochonsInflicted`) qui causait un tri alÃ©atoire des joueurs Ã  l'Ã©cran.
    - Correction de la valeur du bandeau (affichait les points de ligue `leaguePoints` au lieu de `totalCochonsInflicted`).

- [x] **[R6-B1-STATS-RESET]** Refonte de la synchronisation (Architecture Pull-Only stricte)
  - **Objectif** : RÃ©soudre dÃ©finitivement le bug critique oÃ¹ les comptes de jeu voyaient leurs donnÃ©es rÃ©initialisÃ©es lors de la reconnexion, particuliÃ¨rement si l'objet `stats` Ã©tait manquant ou le rÃ©seau instable.
  - **Correction** :
    - **`auth.service.ts`** : Architecture sÃ©parÃ©e. Initialisation avec des zÃ©ros par dÃ©faut UNIQUEMENT au `signUp`. Pour `signIn` et `getCurrentUser`, tÃ©lÃ©chargement forcÃ© des donnÃ©es avec blocage de session si le rÃ©seau Ã©choue (Fail-Safe).
    - **`stats.service.ts`** : Suppression du "fallback destructeur" qui rÃ©initialisait la base Firebase. Si un compte lÃ©gitime ne possÃ¨de pas d'objet `stats` (ex: ancien compte avec juste une `economy`), le service utilise des zÃ©ros en mÃ©moire UNIQUEMENT et ne push plus rien dans la DB au dÃ©marrage.
    - **`economy.service.ts`** : Suppression Ã©quivalente des fallbacks de crÃ©ation.
    - **Tests unitaires** : `StatsService.test.ts` mis Ã  jour et passÃ© avec succÃ¨s pour valider le comportement "Pull-Only".

### 2026-05-21 - Jeu en ligne, Fix CORS & Persistance Solo
  - Fichiers modifiÃ©s : `mobile/src/core/services/stats.service.ts`, `mobile/src/core/services/economy.service.ts`, `mobile/app/home.tsx`, `mobile/src/core/__tests__/StatsService.test.ts`

- [x] **[VERSION-DISPLAY]** HomogÃ©nÃ©isation et affichage de la version de l'application
  - **Objectif** : Afficher la version de l'application de faÃ§on homogÃ¨ne sur le splashscreen, les rÃ©glages et le formulaire de retour client, en lisant dynamiquement la version configurÃ©e dans `expo`.
  - **Correction** :
    - Version mise Ã  jour Ã  `"1.0.3"` dans `mobile/package.json` pour correspondre Ã  `mobile/app.json` (source de vÃ©ritÃ©).
    - Lecture dynamique de la version via `Constants.expoConfig?.version` dans le Splashscreen (`mobile/app/index.tsx`), l'Ã©cran RÃ©glages/Options (`mobile/app/modal.tsx`) et le composant Feedback (`mobile/src/components/MdcFeedbackModal.tsx`).
    - Rendu visuel soignÃ© du label version (`v1.0.3` / `Version 1.0.3`) respectant les exigences de design de la charte de l'application.
  - Fichiers modifiÃ©s : `mobile/package.json`, `mobile/app/index.tsx`, `mobile/app/modal.tsx`, `mobile/src/components/MdcFeedbackModal.tsx`

- [x] **[R4-TECH-LEADERBOARD]** AgrÃ©gats mensuels persistants pour optimiser et fiabiliser les classements
  - **Objectif** : Ã‰viter de charger/analyser l'intÃ©gralitÃ© de `matchHistory` de tous les joueurs cÃ´tÃ© client pour afficher les classements mensuels. Introduire une collection Firestore `users_monthly_stats` qui centralise les mÃ©triques mensuelles de chaque joueur.
  - **Nouveau schÃ©ma** : Document `/users_monthly_stats/{userId}_{yearMonth}` crÃ©Ã©/mis Ã  jour Ã  chaque fin de match, changement de pseudo ou d'avatar. Champs : `cochonsGiven`, `cochonsSubis`, `pointsAccumulated`, `gamesPlayed`, `displayName`, `avatarId`, `activeFrame`.
  - **Index composites** : 3 index ajoutÃ©s dans `firestore.indexes.json` pour permettre le tri mensuel par `cochonsGiven`, `gamesPlayed` (proxy `-Cochons`) et `pointsAccumulated`.
  - **RÃ¨gles Firestore** : RÃ¨gle d'Ã©criture sÃ©curisÃ©e â€” chaque joueur ne peut modifier que son propre document `users_monthly_stats`.
  - **UI temps rÃ©el** : `LeagueHubView.tsx` recrÃ©Ã© ses abonnements `onSnapshot` dynamiquement Ã  chaque changement d'onglet (Mois/Global) ou de catÃ©gorie.
  - **Tests** : 20 tests unitaires ajoutÃ©s/adaptÃ©s dans `LeaderboardClassement.test.ts` â€” tous passent.
  - Fichiers modifiÃ©s : `firestore.rules`, `firestore.indexes.json`, `leaderboard.time.ts`, `leaderboard.service.ts`, `stats.service.ts`, `economy.service.ts`, `auth.service.ts`, `LeagueHubView.tsx`, `LeaderboardClassement.test.ts`

- [x] **[SOLO-PERSISTENCE]** Persistance locale de l'Ã©tat de jeu en Solo (Restauration aprÃ¨s F5 / rafraÃ®chissement)
  - **Objectif** : Permettre au joueur solo de conserver sa progression (main exacte, dominos posÃ©s sur la table, scores des manches, configuration des bots) lors d'un rechargement de page (F5 sur le Web) ou d'un redÃ©marrage de l'application sans utiliser Firestore.
  - **Correction** : ImplÃ©mentation d'une sauvegarde automatique et en temps rÃ©el de l'Ã©tat de jeu dans `AsyncStorage` sous la clÃ© `@solo_game_state:${gameId}` lors de chaque mise Ã  jour de l'Ã©tat dans `useGameSync.ts`.
  - **Restauration** : Au dÃ©marrage d'une partie dans `GameScreen.tsx`, recherche de l'Ã©tat sauvegardÃ© avant de gÃ©nÃ©rer une nouvelle donne de dÃ©part.
  - **Nettoyage** : Purge de la sauvegarde locale dans `handleLeaveRoom` en cas d'abandon volontaire ou Ã  la fin d'un match.
  - Fichiers modifiÃ©s : `mobile/src/hooks/game/useGameSync.ts`, `mobile/src/screens/GameScreen.tsx`

- [x] **[ONLINE-ONLY]** Jeu en ligne obligatoire + Nettoyage AsyncStorage
  - **Connexion requise** : IntÃ©gration de `@react-native-community/netinfo`. L'application bloque l'accÃ¨s et affiche un Ã©cran premium "Connexion requise" si l'appareil est hors ligne.
  - **Authentification obligatoire** : Redirection automatique vers `/login` pour tout utilisateur non authentifiÃ© (sauf pour l'Ã©cran d'accueil splash et l'Ã©cran de login).
  - **Nettoyage AsyncStorage** : Suppression de la persistance locale non critique pour les utilisateurs authentifiÃ©s. La clÃ© `@player_stats:{uid}` (qui contenait l'historique et les statistiques locales) est supprimÃ©e de l'AsyncStorage au moment de l'authentification. Les statistiques et l'historique de jeu sont chargÃ©s directement depuis Firestore pour garantir une source de vÃ©ritÃ© unique et Ã©viter les conflits multi-comptes sur un mÃªme appareil.
  - Fichiers modifiÃ©s : `mobile/app/_layout.tsx`, `mobile/src/core/services/stats.service.ts`, `mobile/src/core/__tests__/StatsService.test.ts`, `mobile/src/components/NetworkRequiredScreen.tsx`.

- [x] **[FIX-ZOMBIE-RECONNECTION]** Validation de la table active au dÃ©marrage (Anti Ã©cran de chargement infini)
  - **ProblÃ¨me** : Lors du dÃ©marrage initial de l'application, l'application redirigeait automatiquement le joueur vers la room stockÃ©e dans `active_roomId` de l'AsyncStorage sans vÃ©rifier sur Firestore si celle-ci Ã©tait toujours active. Cela causait un Ã©cran noir/blanc de chargement infini ou un retour sur une table fermÃ©e/supprimÃ©e.
  - **Correction** : ImplÃ©mentation d'une requÃªte Firestore (`getDoc`) au dÃ©marrage dans `forceBackToActiveMatch`. Si la room n'existe plus ou n'a pas le statut `PLAYING`, la clÃ© locale `active_roomId` est purgÃ©e de l'AsyncStorage et de Firestore (via `setUserActiveRoom`), et la redirection zombie est bloquÃ©e.
  - Fichier modifiÃ© : `mobile/app/_layout.tsx`.

- [x] **[CF-PROCESSMATCHREWARD-CORS]** Correction du CORS Web local sur `processMatchReward`
  - **Cause** : Les CF `onCall` v1 Firebase bloquent les origines `http://localhost` (non-HTTPS), rendant les tests de rÃ©compenses post-match impossible sur `localhost:8081`. Firebase ne permet pas la migration directe d'une CF v1 vers v2 pour une fonction existante.
  - **Solution** : CÃ´tÃ© client uniquement â€” la CF `processMatchRewardHttp` (onRequest) qui gÃ¨re CORS correctement sert maintenant de **chemin principal sur Web local** (au lieu d'Ãªtre un fallback). La logique de dÃ©tection `shouldUseWebLocalRewardHttpFallback()` court-circuite maintenant avant tout appel `httpsCallable`, Ã©vitant le blocage CORS sans modifier la CF en production.
  - **Bonus** : Extraction de la logique d'application du reward HTTP dans `callAndApplyHttpReward()` (mÃ©thode privÃ©e rÃ©utilisable). Fin de la duplication de code entre le court-circuit direct et le fallback dans le `catch`.
  - **Aucun dÃ©ploiement CF** requis â€” `processMatchReward` en production reste inchangÃ©.
  - Fichier modifiÃ© : `mobile/src/core/services/economy.service.ts`


- [x] **[SENTRY-AUDIO-WATCHDOG]** Fix crash fatal TypeError watchdog SoundManager (Android)
  - Le watchdog appelait `this.currentMusic.play().catch()` directement
  - Sur certains appareils expo-audio, `play()` retourne `undefined` â†’ `.catch()` explose (FATAL, 5 users, SM-S928B Android 16)
  - RemplacÃ© par `this.safePlayPlayer()` qui vÃ©rifie le type retour avant d'appeler `.catch()`
  - Fichier : `mobile/src/core/audio/SoundManager.ts`

- [x] **[SENTRY-AUDIO-CHROME-IOS]** Suppression des NotAllowedError autoplay Web Chrome iOS
  - Guard `isAudioAllowed` ne couvrait que Safari iOS, pas Chrome iOS (`CriOS`)
  - 31 events / 16 users en cours depuis 2 semaines sur `play.domino-martinique.online`
  - Chrome iOS ajoutÃ© au guard â€” mÃªme comportement que Safari iOS (audio dÃ©sactivÃ©)
  - Fichier : `mobile/src/core/audio/SoundManager.ts`



- [x] **[UX-ADMIN-SIDEBAR]** Menu latÃ©ral rÃ©tractable + DÃ©filement horizontal des tableaux (Ads)
  - Sidebar rÃ©tractable via un toggle (chevron) pour maximiser l'espace de travail
  - Transition fluide et Ã©tat persistÃ© par session (React state)
  - Ajout du dÃ©filement horizontal (`overflow-x-auto`) sur le tableau des publicitÃ©s
  - `min-width` garanti pour Ã©viter l'Ã©crasement des colonnes sur petits Ã©crans

- [x] **[ECO-WELCOME-DAILY]** ReÃ©quilibrage des constantes Ã©conomie bienvenue
  - `NEW_PLAYER_COINS` : `1000` â†’ `300` coins Ã  la crÃ©ation de compte
  - `DAILY_REWARD_COINS` : `300` â†’ `200` coins pour le cadeau du jour
  - Constante `AD_REWARD_COINS = 100` ajoutÃ©e pour la rÃ©compense pub
  - Fichier `economy.constants.ts` â€” aucun autre fichier Ã  modifier
  - Joueurs existants non affectÃ©s (cadeau bienvenue = crÃ©ation compte uniquement)

- [x] **[ADS-REWARD]** Bouton "Voir une pub â†’ +100 coins" en fin de match
  - Composant `AdRewardButton.tsx` crÃ©Ã© â€” **rÃ©utilisable partout dans l'app**
  - Props : `coinsAmount`, `onClaim` (async), `label`, `variant` (`default`/`prominent`), `enterDelay`, `disabled`
  - Guard interne : un seul clic par montage, Ã©tat `claimed` local
  - Variante `prominent` disponible pour les contextes Ã  fort appel Ã  l'action
  - BranchÃ© dans `UnifiedResultOverlay` (fin de match uniquement, solo et multi)
  - ChaÃ®ne de donnÃ©es : `GameScreen.onAdRewardClaim` â†’ `economyService.creditAdReward()` â†’ Firestore
  - MÃ©thode `creditAdReward()` ajoutÃ©e Ã  `EconomyService`
  - `GameOverlays` et `UnifiedResultOverlay` mis Ã  jour avec la prop `onAdRewardClaim`



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

### 2026-05-11 - Fix gameplay Cochon + tie-break BoudÃ© en multijoueur

- [x] **[COCHON-SCORE-FIX]** Correction de l'imputation des cochons
  - Le compteur `ðŸ�·` visible en mode Cochon correspond maintenant uniquement aux cochons infliges par le vainqueur
  - Les joueurs a `0 etoile` ne gagnent plus de `ðŸ�·` par erreur : ils recoivent seulement le malus `-1 point`
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
### 2026-05-23

- [x] **[ADMIN-MANAGER-ROLE]** Modification des autorisations du rôle manager
  - Accès autorisé à /dashboard/tables pour voir et fermer les tables
  - Accès autorisé à /dashboard/leaderboard pour voir le classement
  - Accès retiré pour /dashboard/audio
  - Correction du crash (client-side exception) sur la page /dashboard/bots due au rendu et aux propriétés optionnelles
