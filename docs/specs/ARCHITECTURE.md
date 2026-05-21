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
| `functions/src/index.ts` | Cloud Functions — récompenses fin de match, suppression compte |
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

---

## 7. Règles d'accès fondamentales (décisions produit définitives)

> Ces deux règles sont **non négociables** et doivent être appliquées partout dans l'app.
> Elles ont été actées progressivement au fil du développement (suppression invité, mode offline).
> Ne pas les contourner sans validation explicite du client.

### 7.1 Authentification obligatoire

- **Tout utilisateur doit être connecté** (Firebase Auth) pour accéder à l'app.
- L'écran de login/inscription est la seule page accessible sans compte.
- Le mode invité a été **supprimé définitivement** (voir CHANGELOG v2.2). Ne pas le réintroduire.
- Si un utilisateur perd sa session (token expiré, déconnexion), il est renvoyé vers le login sans exception.

### 7.2 Connexion internet obligatoire

- **Le jeu nécessite une connexion internet active**, y compris en mode solo.
- Raison : toutes les actions de jeu écrivent dans Firestore (économie, stats, leaderboard, ligue).
  Jouer hors-ligne crée des données fantômes impossibles à réconcilier correctement.
- Si l'internet est absent au démarrage ou perdu en cours de session :
  → Afficher un écran bloquant clair ("Connexion requise") avec un bouton "Réessayer".
  → Ne pas permettre l'accès au lobby, aux modes de jeu, ni à la partie.
- La détection de connexion se fait via `NetInfo` (`@react-native-community/netinfo`).

### 7.3 Ce que l'AsyncStorage peut encore stocker

Seules les données suivantes sont légitimes en stockage local :

| Donnée | Clé | Raison |
|---|---|---|
| Cache économie (UI instantanée) | `@player_economy:{uid}` | Firestore reste source de vérité |
| Préférences audio / thème | `SettingsManager` keys | Local par nature (préférences device) |
| Session auth | `STORAGE_KEY_SESSION` | Persistance login |
| Cooldowns publicités | `ad_daily_cooldown_*` | Anti-spam session |

**À supprimer** pour les joueurs authentifiés :
- `@player_stats:{uid}` — tout est dans Firestore (`users/{uid}/stats`)
- `matchHistory` local — l'historique vit dans Firestore uniquement
