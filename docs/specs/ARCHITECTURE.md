# 🏗️ ARCHITECTURE — Domino Martiniquais

> Document technique de référence. Mis à jour uniquement quand l'architecture change.

---

## 1. Architecture clé du moteur de jeu

Le moteur de jeu est **modulaire et unidirectionnel** :

```
GameScreen
    └── useGameEngine (façade)
            ├── useTurnManager         — Verrou anti-race conditions
            ├── useActionDispatcher    — Point d'entrée unique des mutations
            └── useBotDecision         — IA bots désolidarisée
                    └── LogicEngine.ts — Fonctions pures (aucune dépendance externe)
```

**Règle d'or :** Toute nouvelle action de jeu doit passer par `useActionDispatcher` → `LogicEngine`.

Voir `docs/archive/refactoring-summary.md` pour le détail historique du refactor.

---

## 2. Fichiers critiques

> Ne pas restructurer sans discussion.

| Fichier | Rôle |
|---|---|
| `mobile/src/core/LogicEngine.ts` | Toute la logique métier (fonctions pures) |
| `mobile/src/core/ScoringEngine.ts` | Calcul scores, cochons, manches |
| `mobile/src/core/BotEngine.ts` | IA des bots (3 niveaux, 4ᵉ planifié) |
| `mobile/src/core/RewardEngine.ts` | Calcul récompenses + grade ligue |
| `mobile/src/hooks/game/useActionDispatcher.ts` | Point d'entrée unique des actions |
| `mobile/src/hooks/game/useTurnManager.ts` | Verrou anti-double-action |
| `mobile/src/core/services/league.service.ts` | Logique Ligue des Cochons |
| `functions/src/processMatchReward.ts` | Cloud Function — récompenses fin de match |
| `mobile/app/_layout.tsx` | Stack Expo Router + Sidebar globale |
| `mobile/src/components/Sidebar.tsx` | Menu latéral permanent (R2-A3) |

---

## 3. Conventions de code

- **TypeScript strict** — pas de `any` sauvages
- **Logs** via `LogService` (pas de `console.*` directs)
- **Validation** des inputs utilisateur via **Zod**
- **Tests** : toute logique dans `LogicEngine` doit être testée
- **Clés secrètes** dans `.env` (jamais versionnées)
- **Firestore** : écriture atomique dans `useActionDispatcher` (try/finally)
- **Cloning** : `structuredClone`, jamais `JSON.parse(JSON.stringify())`
- **Nouveaux composants** : reproduire le pattern de `src/features/auth/`
- **Nouvelles features** : pattern Custom Hooks (`useGameEngine`, etc.)

---

## 4. Architecture Firebase

### Collections principales
- `users/{uid}` — profil + économie (coins, xp, leagueGrade, cochonsGiven, etc.)
- `rooms/{roomId}` — salles de jeu multi
- `tournaments/{id}` — (à venir, Bloc 11)
- `ads/{adId}` — publicités admin-managed (R2-M7)
- `feedbacks/{id}` — retours utilisateurs via bouton MDC
- `store_catalog/{id}` — boutique
- `news/{id}` — actualités admin
- `stats/{docId}` — stats globales lecture seule
- `admins/{uid}` — liste des admins
- `bots/{id}` — bots pool
- `config/{docId}` — configuration globale

### Règles
Définies dans `firestore.rules` à la racine. Helper `isAdmin()` pour les écritures admin.

---

## 5. Navigation mobile

- **Expo Router** en mode Stack
- **Sidebar** permanente (`Sidebar.tsx`) injectée dans `_layout.tsx` via `flexDirection: 'row'`
- Feature flag `USE_NEW_SIDEBAR` dans `mobile/src/core/config/navigation.config.ts`
- Routes masquées pour la sidebar : `/`, `/login`, `/lobby`, `/game-modes`, `/modal`, `/game/*`, `/join/*`, `/news/*`

---

## 6. Points sensibles

- **Race conditions** en multijoueur → gérées par `useTurnManager` (verrou)
- **Synchro Firestore** → toujours lire via listener `onSnapshot`, jamais de polling
- **Cache économie** → AsyncStorage local, Firestore est la source de vérité (listener dans `home.tsx`)
- **Leagues périmées** → toujours recalculer le grade via `getLeagueGrade(cochonsGiven)`, ne jamais lire `eco.leagueGrade` stocké (voir bug B-LEAGUE-THRESHOLDS)
