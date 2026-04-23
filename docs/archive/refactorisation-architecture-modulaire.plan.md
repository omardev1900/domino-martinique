---
name: refactorisation-dominos-architecture-modulaire
overview: Refactoriser le moteur de jeu de dominos vers une architecture modulaire centrée sur un LogicEngine pur et un pipeline de hooks (useTurnManager, useActionDispatcher, useBotDecision) tout en éliminant les ~60 erreurs TypeScript et en stabilisant les timeouts, bots et reconnections.
todos:
  - id: types-cleanup
    content: Centraliser la création de GameState de test (createBaseGameState) et corriger tous les appels manquants de turnId et autres champs requis.
    status: completed
  - id: logicengine-hardening
    content: Rendre LogicEngine la seule source de vérité pour les mutations de GameState, y compris l’incrément de turnId et le calcul du prochain round/manche.
    status: completed
  - id: turnmanager-locks
    content: Renforcer useTurnManager comme unique gestionnaire du verrou isProcessingMove et de l’immunité de tour, et le brancher partout.
    status: completed
  - id: actiondispatcher-refactor
    content: Refactoriser useActionDispatcher pour gérer toute l’orchestration des actions (PLAY, PASS, TIMEOUT, NEXT_ROUND, RESOLVE_BOUDE) avec vérification de turnId.
    status: completed
  - id: botdecision-module
    content: Isoler la logique de décision des bots dans un module pur (computeBotDecision) et brancher useBotDecision dessus, en supprimant les verrous internes aux bots.
    status: completed
  - id: gameengine-decomposition
    content: Démonter progressivement le hook monolithique useGameEngine en façade légère au-dessus de useTurnManager/useActionDispatcher/useBotDecision.
    status: pending
  - id: gamescreen-wiring
    content: Recâbler GameScreen pour utiliser uniquement les nouveaux piliers et nettoyer toutes les références obsolètes (executeMoveRef, handlePassTurn interne, isProcessingMove locaux).
    status: pending
  - id: tests-and-tsc
    content: Mettre à jour tous les tests (components, hooks, core) pour les nouvelles signatures et s’assurer que npx tsc --noEmit passe sans erreur.
    status: completed
isProject: false
---

# Plan de refactorisation dominos : architecture modulaire & stabilisation TSC

## Vue d’ensemble architecturale

- **Objectif**: Centraliser toute la logique métier dans un `LogicEngine` pur (State + Action -> New State) et orchestrer les effets (Firebase, timers, bots, audio, UI) via trois hooks principaux : `useTurnManager`, `useActionDispatcher`, `useBotDecision`.
- **Critères de succès**:
  - Les 3 bugs critiques sont corrigés (pas de cascade de bots, pas de blocage sur déconnexion, pas de verrou zombie après reconnexion).
  - `npx tsc --noEmit` passe sans erreur.
  - Le pipeline de tour est linéaire et testable : `GameScreen` → `useTurnManager` → `useActionDispatcher` → `LogicEngine` / `BotEngine`.

```mermaid
flowchart TD
  gameScreen[GameScreen] --> turnManager[useTurnManager]
  gameScreen --> gameTimers[useGameTimers]
  gameScreen --> actionDispatcher[useActionDispatcher]
  gameScreen --> botDecision[useBotDecision]

  actionDispatcher --> logicEngine[LogicEngine (pur)]
  botDecision --> botEngine[BotEngine (pur)]

  gameSync[useGameSync] --> gameScreen
  turnManager --> actionDispatcher
  gameTimers --> actionDispatcher
```

## Phase 1 – Cartographie & consolidation du modèle de domaine

- **[mobile/src/core/types.ts](mobile/src/core/types.ts)**
  - Vérifier la définition de `GameState` (présence de `turnId`, champs obligatoires/optionnels) et documenter la sémantique de `turnId` (incrémenté à chaque transition de tour, clé d’invalidation des timers et décisions de bots).
  - Identifier tous les champs qui doivent être systématiquement initialisés (ex: `history`, `firstPlayerOfRound`, `mancheResult`, `talonMort`, `startingHandSize`, `roundNumber`, `mancheNumber`, `turnDuration`, `lastActionTimestamp`).

- **[mobile/src/core/LogicEngine.ts](mobile/src/core/LogicEngine.ts)**
  - Confirmer que les fonctions existantes (`dealGame`, `dealGameSolo`, `handleTurn`, `passTurn`, `resolveBoude`, `determineFirstPlayer`) sont **pures** vis-à-vis de React/Firebase/Audio.
  - Introduire une interface d’actions de haut niveau (sans React) si nécessaire, par exemple:
    - `applyPlay(state, playerId, domino, forcedSide?) => GameState` (actuel `handleTurn`).
    - `applyPass(state, playerId) => GameState` (actuel `passTurn`).
    - `applyTimeout(state, playerId) => GameState` (nouvelle fonction interne qui réutilise `applyPlay`/`applyPass`).
    - `computeNextRoundState(prevState, opts) => GameState` (facteur commun des logiques de nouvelle manche/round).
  - Standardiser l’incrément de `turnId` **uniquement** dans ces fonctions de mutation (plus jamais dans les hooks).

- **[mobile/src/core/BotEngine.ts](mobile/src/core/BotEngine.ts)**
  - Valider que `getBotMove` est déjà une fonction **pure**.
  - Ajouter un helper pur de plus haut niveau, p.ex. `computeBotDecision(gameState, playerId) => { tile, side } | null`, qui encapsule l’appel à `getBotMove` et la gestion du coup d’ouverture forcé (`getForcedOpeningDominoId`).

## Phase 2 – Nettoyage systématique des 60 erreurs TSC

### 2.1 – Manque de `turnId` dans les mocks & scripts

- **Fichiers concernés (d’après `mobile/ts_final_errors.txt`)**:
  - [scripts/verify-firebase.ts](scripts/verify-firebase.ts)
  - [src/__tests__/MultiplayerLogic.test.ts](src/__tests__/MultiplayerLogic.test.ts)
  - [src/__tests__/rules_scenarios.test.ts](src/__tests__/rules_scenarios.test.ts)
  - [src/core/__tests__/BotEngine.test.ts](src/core/__tests__/BotEngine.test.ts)
  - [src/core/__tests__/GameIntegration.test.ts](src/core/__tests__/GameIntegration.test.ts)
  - [src/core/__tests__/LogicEngine.test.ts](src/core/__tests__/LogicEngine.test.ts)
  - [src/core/__tests__/ManualSimulation.test.ts](src/core/__tests__/ManualSimulation.test.ts)
  - [src/core/__tests__/ScoringScenarios.test.ts](src/core/__tests__/ScoringScenarios.test.ts)
  - [src/core/StressTest.test.ts](src/core/StressTest.test.ts)
  - [src/hooks/useMultiplayerGame.ts](src/hooks/useMultiplayerGame.ts)
  - [src/hooks/useSoloGame.ts](src/hooks/useSoloGame.ts)
  - [testscript.ts](testscript.ts), [verify_fix.ts](verify_fix.ts)

- **Plan**:
  - Créer un utilitaire central **de tests** dans un nouveau fichier, par ex. `[src/core/testUtils.ts](src/core/testUtils.ts)`:
    - `createBaseGameState(overrides?: Partial<GameState>): GameState` qui initialise **tous** les champs obligatoires avec des valeurs cohérentes, incluant `turnId: 0`.
  - Remplacer dans tous les tests/scrits ci-dessus les littéraux `GameState` par des appels à `createBaseGameState` (en ne surchargeant que les morceaux pertinents pour chaque scénario).
  - S’assurer que `dealGame`/`dealGameSolo` retournent désormais un `Partial<GameState>` clairement typé, et que là où on les caste en `GameState` (ex: dans [mobile/src/screens/GameScreen.tsx](mobile/src/screens/GameScreen.tsx)), on complète systématiquement les champs requis.

### 2.2 – Types de tests React Native Testing Library

- **[mobile/src/components/game/__tests__/ActionFooter.test.tsx](mobile/src/components/game/__tests__/ActionFooter.test.tsx)**, **GameHeader**, **GameOverlays**, **PlayerArea**
  - Corriger l’usage de la RTNL:
    - Utiliser `getByTestId` / `queryByTestId` (casse camelCase) au lieu de `getByTestID` si nécessaire, en alignement avec les types de `@testing-library/react-native`.
    - Introduire un alias local typé si utile : `type RenderAPI = ReturnType<typeof render>;`.
  - Pour les tags JSX custom `mock-player-hand`, `mock-player-avatar`:
    - Créer un fichier de déclaration global, p.ex. `[mobile/src/types/test-jsx.d.ts](mobile/src/types/test-jsx.d.ts)` qui déclare dans `JSX.IntrinsicElements` ces tags comme `any`, **ou** convertir ces tags en composants React déclarés localement dans les tests.

- **[mobile/src/components/game/__tests__/GameOverlays.test.tsx](mobile/src/components/game/__tests__/GameOverlays.test.tsx)**
  - Corriger le chemin d’import: remplacer `../UnifiedResultOverlay` par `../../UnifiedResultOverlay` pour pointer sur [mobile/src/components/UnifiedResultOverlay.tsx](mobile/src/components/UnifiedResultOverlay.tsx).

### 2.3 – Tests des hooks de jeu

- **[mobile/src/hooks/game/__tests__/useBotManager.test.tsx](mobile/src/hooks/game/__tests__/useBotManager.test.tsx)**
  - Mettre à jour les appels à `useBotManager` pour inclure le nouveau callback requis `onBotPass` (mock no-op).
  - Aligner les expectations sur la nouvelle logique (bot qui appelle `onBotPass` en cas d’absence de coup valide).

- **[mobile/src/hooks/game/__tests__/useGameEngine.test.tsx](mobile/src/hooks/game/__tests__/useGameEngine.test.tsx)**
  - Corriger les erreurs de syntaxe (prop spacing / JSX mal formé signalé dans `mobile/ts_final_errors.txt`).
  - Aligner les props de `useGameEngine` sur sa signature actuelle (suppression de `setIsHardLocked` ou réintégration propre dans le type si on conserve le concept).
  - À terme, réduire ce test à vérifier que `useGameEngine` délègue bien à `useActionDispatcher` (voir Phase 4), plutôt que re-tester toute la logique métier.

- **[mobile/src/hooks/game/__tests__/useGameSync.test.ts](mobile/src/hooks/game/__tests__/useGameSync.test.ts)**
  - Fournir le callback requis `signalPlayerOnline` (mock async no-op) dans toutes les invocations de `useGameSync`.

- **[mobile/src/hooks/game/__tests__/useGameTimers.test.tsx](mobile/src/hooks/game/__tests__/useGameTimers.test.tsx)**
  - Mettre à jour les tests pour refléter la nouvelle interface de `useGameTimers`:
    - Fournir `localPlayerId` et `onTimeout(playerId, turnIdFromTimer)`.
    - Ne plus attendre un champ `isHardLocked` dans le résultat (ou l’ajouter au hook si on décide de l’exposer réellement, mais de façon cohérente avec `useTurnManager`).

### 2.4 – Erreurs GameScreen liées à l’ancienne architecture

- Les erreurs de `src/screens/GameScreen.tsx` dans le log tsc pointent vers une version antérieure (absence de `useBotManager`, `executeMoveRef`, `handlePassTurn`, etc.).
- Avec la nouvelle architecture (voir Phase 3), on fera:
  - **GameScreen** ne déclare plus de refs métiers comme `executeMoveRef` / `handlePassTurn` ; tout passe par `dispatch(ActionCommand)`.
  - Les types des handlers bots (`onBotPlay`, `onBotPass`) seront explicitement typés via `Domino` / `PlayerId` pour éliminer les `implicit any`.

## Phase 3 – Séparation stricte en 4 piliers

### 3.1 – LogicEngine (bibliothèque pure)

- **[mobile/src/core/LogicEngine.ts](mobile/src/core/LogicEngine.ts)**
  - S’assurer qu’aucun import React/Firebase/Audio ne subsiste (actuellement OK).
  - Étendre/clarifier les fonctions:
    - `handleTurn` et `passTurn` restent les entrées principales pour PLAY/PASS.
    - Extraire la logique de « round suivant / manche suivante » dans une fonction pure `computeNextRoundState(prevState, opts)` partagée entre `useGameEngine` et `useActionDispatcher`.
    - Optionnel: introduire un mini « reducer » pur `reduceGameState(state, action)` si utile pour les tests, mais garder l’API existante pour ne pas casser.
  - Vérifier que l’incrément de `turnId` est **centralisé** ici (par ex. dans `handleTurn`, `passTurn`, `computeNextRoundState`).

### 3.2 – useTurnManager (autorité & verrou global)

- **[mobile/src/hooks/game/useTurnManager.ts](mobile/src/hooks/game/useTurnManager.ts)**
  - Garder la responsabilité unique de `isProcessingMove` :
    - `isProcessingMove: MutableRefObject<boolean>` partagé avec tous les callers.
    - `acquireLock()` / `releaseLock()` utilisés par **tous** les chemins qui modifient le state (humain, bot, timeout, next round).
  - Confirmer que l’effet `useEffect` sur `gameState?.turnId` fait bien:
    - `turnMountedAtRef.current = Date.now()`.
    - `isProcessingMove.current = false` à chaque changement de tour pour éliminer les verrous zombies lors des reconnexions.
  - Si nécessaire, exposer `getTurnAgeMs()` depuis `useTurnManager` (ou partager la ref d’`IMMUNITY` avec `useGameTimers`) afin que l’immunité de tour soit pilotée par une seule source de vérité.

### 3.3 – useActionDispatcher (cerveau de l’écran de jeu)

- **[mobile/src/hooks/game/useActionDispatcher.ts](mobile/src/hooks/game/useActionDispatcher.ts)**
  - Étendre le type `ActionCommand` pour inclure le `turnId` dans les timeouts:
    - `| { type: 'TIMEOUT'; playerId: PlayerId; turnId: number }`.
  - Entrées du hook (déjà en place) : `gameState`, `localPlayerId`, `isSoloMode`, `gameId`, `isLocalHost`, `roomData`, `startingHandSize`, `acquireLock`, `releaseLock`, `safeUpdateGameState`, `setGameState`, `clearAllTurnTimers`, `setOvertime`, `onTilePlayed`.
  - **Refactoriser les branches de switch**:
    - `PLAY_TILE` et `PASS_TURN` délèguent directement à `LogicEngine.handleTurn` / `LogicEngine.passTurn` (ce qui est déjà le cas) et gèrent sons + reset timers + `lastActionTimestamp`.
    - `TIMEOUT`:
      - Utiliser `command.turnId` pour vérifier que le timeout est encore valide (comparaison avec `gameState.turnId`), similaire à ce qui existe dans `handleTimeout` de `useGameEngine` et dans `useGameTimers`.
      - Pour un joueur **bot ou déconnecté**, autoriser l’hôte / solo à déclencher même si le `turnId` a glissé de ±1 (tolérance).
      - Reproduire la logique de décision: forced opening via `getForcedOpeningDominoId`, sinon meilleur coup via `getValidMoves`/`getBotMove` (ou, après factorisation, via `LogicEngine.applyTimeout` ou `BotEngine.computeBotDecision`).
    - `NEXT_ROUND` et `RESOLVE_BOUDE` :
      - S’appuyer sur `LogicEngine.computeNextRoundState` pour ne pas dupliquer la logique avec `useGameEngine`.
  - À la fin de chaque action réussie (`newState` défini):
    - Mettre `newState.lastActionTimestamp = Date.now()`.
    - Utiliser `safeUpdateGameState` en multi, `setGameState` en solo.
    - **Ne pas oublier de relâcher le verrou** en cas d’action ignorée ou erreur.

### 3.4 – useBotDecision (module de calcul pur + hook fin)

- **Nouveau module pur**: `[mobile/src/core/BotDecision.ts](mobile/src/core/BotDecision.ts)` (ou dans `BotEngine`)
  - Exposer une fonction pure:
    - `computeBotDecision(state: GameState, playerId: string): { tile: Domino; side: 'start' | 'left' | 'right' } | null`.
    - Gérer le coup d’ouverture forcé (`getForcedOpeningDominoId`), sinon s’appuyer sur `getBotMove`.

- **[mobile/src/hooks/game/useBotDecision.ts](mobile/src/hooks/game/useBotDecision.ts)**
  - Transformer ce hook pour qu’il soit **strictement responsable d’appeler `dispatch`** en se basant sur la décision pure :
    - Sur changement de `gameState.turnId`/`phase`, vérifier si le joueur courant est un bot ou un joueur déconnecté.
    - En multi, ne déclencher que si `roomData.createdBy === localPlayerId` (l’hôte).
    - Appliquer une petite latence (setTimeout) mais **sans gérer de lock interne** — uniquement `dispatch({ type: 'PLAY_TILE' ... })` ou `dispatch({ type: 'PASS_TURN' ... })`.
  - Supprimer toute logique de `isProcessingMove` de ce hook (laisser `useTurnManager` gérer l’autorité).

- **Migration de useBotManager**:
  - Converger `useBotManager` vers ce nouveau pattern ou le supprimer une fois `useBotDecision` branché partout:
    - Dans [mobile/src/screens/GameScreen.tsx](mobile/src/screens/GameScreen.tsx), remplacer l’usage de `useBotManager` par `useBotDecision` qui appelle `dispatch` pour PLAY/PASS et notifie l’UI via callbacks (pour animations) au besoin.

### 3.5 – useGameTimers (timeouts robustes, sans cascade)

- **[mobile/src/hooks/game/useGameTimers.ts](mobile/src/hooks/game/useGameTimers.ts)**
  - Garder le comportement actuel de **clock locale pure**, mais:
    - S’assurer que `onTimeout` est toujours appelé avec le `capturedTurnIdRef.current`.
    - Ne plus rien faire qui touche à des verrous ou à la logique métier (ce qui est déjà le cas).
  - Dans [mobile/src/screens/GameScreen.tsx](mobile/src/screens/GameScreen.tsx), modifier l’appel:
    - `onTimeout: (pId, turnId) => dispatch({ type: 'TIMEOUT', playerId: pId, turnId })`.

## Phase 4 – Démontage du hook monolithique useGameEngine

- **[mobile/src/hooks/game/useGameEngine.ts](mobile/src/hooks/game/useGameEngine.ts)**
  - **Étape 1 – Cartographie**:
    - Marquer par bloc ce qui relève de:
      - Verrou global & immunités (`isProcessingMove`, `turnMountedAtRef`, `TURN_IMMUNITY_MS`).
      - Orchestration des actions (executeMove, handlePlayDomino, handlePassTurn, handleTimeout, handleOverlayContinue, handleNextRound).
      - Logique de scoring/Boudé (déjà passée dans `resolveBoude` / `finalizeRound`).
      - Effets UI (Alerts, sons).
  - **Étape 2 – Redirection vers les nouveaux piliers**:
    - Remplacer, à l’intérieur de `useGameEngine`, les appels directs à `handleTurn`/`passTurn`/timeouts par des appels à `dispatch` de `useActionDispatcher` et à `useTurnManager`.
    - Déplacer les règles d’autorité TIMEOUT (hôte vs non-hôte, bot vs humain, déconnecté) dans `useActionDispatcher`.
    - Déplacer la logique d’auto-Boudé (auto-pass après délai si aucun coup valide) dans un hook dédié ou dans `useActionDispatcher`.
  - **Étape 3 – Réduction**:
    - Une fois `GameScreen` migré sur le trio `useTurnManager` + `useActionDispatcher` + `useBotDecision`, réduire `useGameEngine` à un **facade de compatibilité** utilisée uniquement dans d’anciens écrans/tests si nécessaire.
    - Mettre à jour les tests de `useGameEngine` pour qu’ils vérifient simplement que:
      - `handlePlayDomino` appelle `dispatch(PLAY_TILE)` avec les bons paramètres.
      - `handlePassTurn` appelle `dispatch(PASS_TURN)`.
      - `handleTimeout` appelle `dispatch(TIMEOUT)` avec `turnId` capturé.

## Phase 5 – Raccordement UI (GameScreen & composants de jeu)

- **[mobile/src/screens/GameScreen.tsx](mobile/src/screens/GameScreen.tsx)**
  - **État & hooks principaux** (déjà en bonne voie) :
    - Garder `useGameSync` pour la sync Firebase.
    - Utiliser `useTurnManager({ gameState })` comme unique source de `isProcessingMove`.
    - Utiliser `useGameTimers({ gameState, isPaused, localPlayerId, onTimeout })` et connecter `onTimeout` à `dispatch(TIMEOUT, turnId)`.
    - Utiliser `useActionDispatcher` pour **toutes** les commandes: `PLAY_TILE`, `PASS_TURN`, `TIMEOUT`, `NEXT_ROUND`, `RESOLVE_BOUDE`.
    - Utiliser `useBotDecision` (ou `useBotManager` refactorisé) pour déclencher les coups de bot / passes automatiques, via `dispatch`.
  - **Handlers UI**:
    - `handlePlayDomino` / `confirmSidePlay` envoient uniquement des `dispatch({ type: 'PLAY_TILE', ... })` après les contrôles d’UI (règle d’ouverture, choix gauche/droite, etc.).
    - `handleOverlayContinue` devient un simple wrapper sur `dispatch({ type: 'NEXT_ROUND' })` ou `dispatch({ type: 'RESOLVE_BOUDE' })`.
    - `handlePassTurn` (si encore utilisé côté UI) wrappe `dispatch({ type: 'PASS_TURN', playerId })`.
  - **Anti-cascade & anti-zombie**:
    - L’interface désactive les interactions sur la main du joueur en se basant sur `isMyTurn`, `gameState.phase`, et le `isProcessingMove` fourni par `useTurnManager` — plus aucun lock interne aux bots/timers.

- **Composants de jeu** (`GameHeader`, `GameOverlays`, `PlayerArea`, `ActionFooter`)
  - S’assurer qu’aucun de ces composants ne manipule directement le state métier: ils reçoivent tout via props depuis `GameScreen`.
  - Mettre à jour/compléter les tests de ces composants pour refléter les props finales (après nettoyage des tests en Phase 2).

## Phase 6 – Passes finales TSC & robustesse

- Lancer `npx tsc --noEmit` régulièrement pendant la refactorisation.
- Une fois les 60 erreurs corrigées:
  - Activer `strict` ou au moins renforcer certaines options TS si faisable, pour éviter la réintroduction de `implicit any`.
  - Ajouter quelques tests unitaires ciblés pour les nouveaux points critiques:
    - `computeBotDecision` (scénarios simple / forced opening / aucun coup).
    - `useActionDispatcher` – TIMEOUT avec `turnId` obsolète vs valide.
    - `useTurnManager` – reset de `isProcessingMove` sur changement de `turnId`.

## Résumé des impacts principaux par fichier

- **Domaine pur**:
  - `mobile/src/core/LogicEngine.ts`: centralisation des transitions de tour et du `turnId`, ajout éventuel de helpers purs.
  - `mobile/src/core/BotEngine.ts` (+ éventuel `BotDecision.ts`): consolidation de la logique de calcul des coups de bot.

- **Hooks de coordination**:
  - `mobile/src/hooks/game/useTurnManager.ts`: unique gestionnaire du verrou global et de l’immunité de tour.
  - `mobile/src/hooks/game/useActionDispatcher.ts`: orchestrateur des actions (PLAY/PASS/TIMEOUT/NEXT_ROUND/RESOLVE_BOUDE) et des effets (Firebase, sons, timers).
  - `mobile/src/hooks/game/useBotDecision.ts`: écouteur pur des changements de tour qui décide **quoi** jouer/passer et délègue à `dispatch`.
  - `mobile/src/hooks/game/useGameTimers.ts`: horloge locale pure qui émet des timeouts avec `turnId` capturé.
  - `mobile/src/hooks/game/useGameEngine.ts`: progressivement vidé au profit des trois hooks ci-dessus, éventuelle façade de compatibilité.

- **UI & tests**:
  - `mobile/src/screens/GameScreen.tsx`: branchement propre sur les 4 piliers, suppression des refs métier orphelines.
  - `mobile/src/components/game/*` + `__tests__`: correction des types RTNL et des imports.
  - `mobile/src/hooks/game/__tests__/*`: alignement sur les signatures finales des hooks.
  - `src/core/__tests__/*` + scripts: utilisation de `createBaseGameState` avec `turnId` systématique.
