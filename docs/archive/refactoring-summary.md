# Résumé de la Refactorisation de l'Architecture (Dominos)

## Objectifs atteints
La refactorisation complète du moteur de jeu a été effectuée avec succès afin de résoudre les problèmes de désynchronisation (Bot Cascade), de timer zombie, et d'incohérences de tour. L'objectif principal était de rendre l'état du jeu totalement déterministe et unidirectionnel.

Le projet a passé avec succès l'audit `npx tsc --noEmit` complet. 

## Nouvelle Architecture Modulaire

L'architecture est désormais divisée en piliers aux responsabilités strictes :

### 1. LogicEngine (Source de vérité pure)
[`src/core/LogicEngine.ts`]
Toute la logique métier de modification du `GameState` (jouer un domino, passer son tour, calculer les scores, déterminer le vainqueur) a été isolée dans ce module sous forme de fonctions **pures**.
- Aucune dépendance externe (Firebase, UI, Audio) n'est présente.
- La gestion du `turnId` est centralisée ici, garantissant qu'il est incrémenté de manière atomique à chaque nouvelle action valide.

### 2. useTurnManager (Gestionnaire de verrouillage)
[`src/hooks/game/useTurnManager.ts`]
Fournit un mécanisme global de verrouillage et de protection contre les `race conditions`.
- Contrôle strict via `isProcessingMove`.
- Offre `canAction` pour vérifier si le coup est autorisé.
- Protège contre les doubles actions (ex: le bouton "Passer" pressé deux fois ou un double timeout) en imposant une immunité de 5 secondes au début de chaque tour. 
- Auto-libération du verrou lors de l'incrément de `turnId`, prévenant l'UI de rester bloquée lors d'une reconnexion.

### 3. useActionDispatcher (Point d'entrée des mutations)
[`src/hooks/game/useActionDispatcher.ts`]
L'unique point d'entrée pour les commandes de jeu depuis le composant `GameScreen` ou via les effets.
- Accepte des actions structurées (PLAY_TILE, PASS_TURN, TIMEOUT, etc.).
- Effectue toutes les validations de sécurité en acquérant le verrou de `useTurnManager`.
- Délègue le calcul du nouvel état au `LogicEngine`.
- Enregistre le nouvel état sur Firebase de façon atomique (try/finally) et certifie la libération du verrou.

### 4. useBotDecision (Le cerveau des bots désolidarisé)
[`src/hooks/game/useBotDecision.ts`]
La logique des bots ne s'emmêle plus dans l'orchestration principale ou dans les timers d'interface.
- Le bot agit de manière autonome en écoutant l'état du jeu. Il vérifie que c'est bien le tour d'un bot et qu'il est "l'host" autorisé à dicter ses mouvements.
- Les actions des bots calculées de manière pure (`BotEngine.ts`) sont validées par le `useActionDispatcher` de la même manière qu'une interaction utilisateur.
- Ce module remplace avantageusement et corrige l'ancien fonctionnement instable instancié sous `useBotManager`.

### 5. useGameEngine (Façade simplifiée)
[`src/hooks/game/useGameEngine.ts`]
Ce hook n'est plus qu'une simple enveloppe. Il englobe `useTurnManager`, `useActionDispatcher` et `useBotDecision` et renvoie une API propre, simple à utiliser, pour que le composant `GameScreen` interagisse sans connaître la complexité du dessous.

## Nettoyage
- Plus de verrous locaux déclarés en doublon dans la vue.
- L'utilisation massive et non déterministe des références (`executeMoveRef`) a été supprimée.
- Les types TypeScript ont été mis à jour et validés sur l'ensemble de la codebase. Tous les `Partial<GameState>` indésirables ont été proprement convertis.

---
**Verdict de sécurité** : Les cycles infinis de timeout et la corruption de state lors de la reprise de connexion ont été résolus. L'architecture est blindée (lock system, monotonic turnId, and single channel dispatch).

---

## Instructions pour les futurs développeurs

Pour ajouter une **nouvelle action de jeu** (ex: `USE_ITEM`, `VOTE_SKIP`, etc.), suivez strictement ce workflow :

1. **Définition de l'Action (LogicEngine)**
   - Ajoutez et exportez une fonction pure dans `src/core/LogicEngine.ts` :
     ```typescript
     export const applyNewAction = (state: GameState, payload: any): GameState => {
         // Valider si le coup est possible
         // Cloner l'état, modifier et incrémenter le turnId si nécessaire
         // Retourner le nouvel état
     };
     ```

2. **Typage de la Commande (ActionDispatcher)**
   - Dans `src/hooks/game/useActionDispatcher.ts`, ajoutez votre type d'action dans l'interface `ActionCommand` :
     ```typescript
     | { type: 'NEW_ACTION', payload: any }
     ```

3. **Traitement par le Dispatcher (ActionDispatcher)**
   - Dans le switch de `useActionDispatcher.ts`, interceptez `command.type === 'NEW_ACTION'`.
   - Invoquez votre fonction pure :
     ```typescript
     newState = applyNewAction(gameState, command.payload);
     ```

4. **Validation des Règles Globales**
   - L'acquisition du verrou et les vérifications par `useTurnManager` (savoir s'il s'agit du bon tour) se font automatiquement en amont dans le `useActionDispatcher` pour chaque nouvelle commande ! Vous n'avez plus à vous soucier des *race conditions*.
   - Déclarez la commande dans `src/screens/GameScreen.tsx` ou via `useGameEngine.ts` via une fonction dédiée : `handleNewAction = () => dispatch({ type: 'NEW_ACTION', ... })`.
