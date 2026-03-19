# Rapport d'Audit — Projet Mobile React Native (Jeu de Dominos)
**Date :** 18 mars 2026
**Périmètre :** Audit complet — qualité du code, fonctionnalités, contradictions, sécurité
**Statut :** LECTURE SEULE — aucune modification effectuée

---

## TABLE DES MATIÈRES

1. [Vue d'ensemble du projet](#1-vue-densemble)
2. [Qualité du code](#2-qualité-du-code)
3. [Fonctionnalités](#3-fonctionnalités)
4. [Contradictions & Incohérences](#4-contradictions--incohérences)
5. [Sécurité](#5-sécurité)
6. [Synthèse & Priorités](#6-synthèse--priorités)

---

## 1. VUE D'ENSEMBLE

### Architecture générale
- **Framework :** React Native + Expo (SDK 54), architecture Expo Router (routage fichier-based)
- **Backend :** Firebase (Auth + Firestore)
- **Langage :** TypeScript (mode strict)
- **Navigation :** Stack + Tabs (Expo Router), orientation forcée **paysage**
- **Taille du projet :** ~50 fichiers source principaux, ~15 MB d'assets audio

### Stack technologique
| Couche | Technologie |
|--------|------------|
| UI | React 19.1, React Native 0.81.5 |
| Navigation | Expo Router 6.0 |
| Animations | React Native Reanimated 4.1 |
| Auth | Firebase Auth (email/password + mode invité) |
| Base de données | Firestore (temps réel via onSnapshot) |
| Stockage local | AsyncStorage |
| Audio | expo-audio + expo-av |
| State management | useState + hooks composés (pas de Redux) |

### Structure des dossiers
```
mobile/
├── app/                    ← Routes Expo Router (screens)
│   ├── index.tsx           ← Splash / vérification auth
│   ├── login.tsx           ← Connexion Firebase
│   ├── home.tsx            ← Sélection du mode de jeu
│   ├── solo.tsx            ← Configuration partie solo
│   ├── lobby.tsx           ← Lobby multijoueur
│   ├── game/[id].tsx       ← Écran de jeu dynamique
│   ├── profile.tsx         ← Profil utilisateur
│   ├── store.tsx           ← Boutique cosmétique
│   ├── leaderboard.tsx     ← Classement
│   └── stats.tsx           ← Statistiques joueur
│
├── src/
│   ├── core/               ← Moteurs de jeu (logique pure)
│   │   ├── DominoEngine.ts ← Placements valides, IA bot
│   │   ├── LogicEngine.ts  ← Déroulement des parties
│   │   ├── ScoringEngine.ts← Calcul des scores
│   │   ├── BotEngine.ts    ← Décisions bot
│   │   ├── RewardEngine.ts ← Récompenses fin de match
│   │   ├── audio/          ← SoundManager, HapticManager
│   │   └── services/       ← Firebase, Auth, Economy, Store, Stats
│   │
│   ├── hooks/game/         ← Hooks React (orchestration)
│   │   ├── useGameEngine.ts
│   │   ├── useActionDispatcher.ts
│   │   ├── useGameTimers.ts
│   │   ├── useTurnManager.ts
│   │   ├── useBotDecision.ts
│   │   ├── useAutoPass.ts
│   │   ├── useGameSync.ts
│   │   └── useConnectionStatus.ts
│   │
│   ├── components/         ← Composants UI réutilisables
│   └── screens/            ← Screens principaux
```

---

## 2. QUALITÉ DU CODE

### Points positifs ✅

1. **Séparation logique/UI propre** — Les moteurs de jeu (`DominoEngine`, `LogicEngine`, `ScoringEngine`) sont des fonctions pures sans dépendance React. Architecture exemplaire.
2. **TypeScript strict** — `tsconfig.json` avec `strict: true` et alias `@/*`. Bon niveau de typage.
3. **Pattern Singleton approprié** — `SoundManager` et `SettingsManager` correctement implémentés.
4. **Immutabilité des états** — Utilisation systématique de spread (`{...state, ...updates}`) et `JSON.parse(JSON.stringify())` pour cloner l'état avant modification.
5. **Stale closure évité** — `useRef` utilisé dans `useBotDecision.ts` pour accéder au dernier état du jeu sans dépendance useEffect.
6. **Gestion de la déconnexion** — `useConnectionStatus` marque automatiquement les joueurs offline et les remplace par un bot.
7. **Debouncing audio** — Fenêtre de 100ms pour éviter la saturation sonore.

---

### Problèmes de qualité identifiés ⚠️

#### P1 — Duplication de la logique d'immunité de timer
**Fichiers :** [useGameTimers.ts](src/hooks/game/useGameTimers.ts) + [useTurnManager.ts](src/hooks/game/useTurnManager.ts)
**Sévérité :** HAUTE

`TURN_IMMUNITY_MS` et `turnMountedAtRef` sont dupliqués dans deux hooks différents. Si les deux horloges dérivent, un timeout peut être déclenché par le timer mais **rejeté** par le TurnManager, sans feedback pour le joueur.

```typescript
// useGameTimers.ts
if (remaining === 0 && turnAge >= TURN_IMMUNITY_MS) { // Déclenche
// useTurnManager.ts
if (turnAge < TURN_IMMUNITY_MS) return false; // Rejette — deux refs différentes!
```

---

#### P2 — `JSON.parse(JSON.stringify())` comme pattern de clonage
**Fichiers :** [LogicEngine.ts](src/core/LogicEngine.ts) (lignes ~282, ~374)
**Sévérité :** MOYENNE

Ce pattern casse les champs non-sérialisables (fonctions, `undefined`, `Date`). Il masque aussi les corruptions silencieuses de l'état.

---

#### P3 — `sum` redondant dans l'interface `Domino`
**Fichier :** [src/core/types.ts](src/core/types.ts)
**Sévérité :** FAIBLE

```typescript
interface Domino {
    left: DominoSide;
    right: DominoSide;
    isDouble: boolean;
    sum: number;  // ← Redondant : toujours left + right
}
```
Si `left` ou `right` est modifié sans recalculer `sum`, l'état devient incohérent.

---

#### P4 — Multiple `setGameState` depuis des hooks différents
**Fichiers :** [useGameSync.ts](src/hooks/game/useGameSync.ts) + [useGameEngine.ts](src/hooks/game/useGameEngine.ts)
**Sévérité :** MOYENNE

Plusieurs hooks appellent `setGameState` de façon indépendante, sans source de vérité unique. Risque de mises à jour concurrentes qui s'écrasent.

---

#### P5 — Logs console en production
**Fichiers :** Quasi tous les services et hooks
**Sévérité :** MOYENNE (aussi sécurité — voir section 5)

Des centaines de `console.log` avec données sensibles resteront actifs en production. Aucun système de logging conditionnel (`__DEV__`) n'est en place.

---

#### P6 — Son "end" joué deux fois sur GameOverScreen
**Fichier :** [src/screens/GameOverScreen.tsx](src/screens/GameOverScreen.tsx)
**Sévérité :** FAIBLE

```typescript
SoundManager.playSound('end'); // Ligne A — toujours
// ...
if (isBoudé) {
  SoundManager.playSound('end'); // Ligne B — doublon si Boudé
}
```
Le debounce de 100ms atténue le problème mais l'intention du code est ambiguë.

---

#### P7 — Son "pass_turn" référencé mais asset manquant
**Fichier :** [src/core/audio/SoundManager.ts](src/core/audio/SoundManager.ts)
**Sévérité :** FAIBLE

Le code référence `playSound('pass_turn')` mais le fichier audio correspondant n'existe pas dans `src/assets/sounds/`. Erreur silencieuse à l'exécution.

---

#### P8 — `isBot` et `isDisconnected` cumulés sans enum clair
**Fichiers :** [src/core/types.ts](src/core/types.ts), [useConnectionStatus.ts](src/hooks/game/useConnectionStatus.ts)
**Sévérité :** MOYENNE

Quand un joueur humain se déconnecte, le code fait :
```typescript
{ ...player, isBot: true, isDisconnected: true }
```
Un vrai bot et un humain déconnecté sont alors **indiscernables**. La reconnexion est confuse : le joueur est marqué `isBot: true` même après retour en ligne.

---

#### P9 — Absence de tests unitaires visibles
**Sévérité :** HAUTE

Le projet a `jest` configuré (`jest.config.js`, `jest-expo`) mais **aucun fichier de test** n'a été trouvé (`*.test.ts`, `*.spec.ts`). Les moteurs de jeu sont testables en tant que fonctions pures, mais aucun test n'existe.

---

#### P10 — `startingHandSize` non validé dans `computeNextRoundState`
**Fichier :** [src/core/LogicEngine.ts](src/core/LogicEngine.ts) (~ligne 505)
**Sévérité :** MOYENNE

La fonction accède `activeState.startingHandSize` sans valider qu'il s'agit d'un nombre positif. Un état corrompu (ancienne partie sauvegardée) pourrait causer des comportements inattendus.

---

## 3. FONCTIONNALITÉS

### Fonctionnalités implémentées ✅

| Fonctionnalité | État | Fichiers clés |
|---------------|------|--------------|
| Mode solo avec 3 niveaux de difficulté bot | ✅ Complet | `BotEngine.ts`, `solo.tsx` |
| Mode multijoueur temps réel (Firebase) | ✅ Complet | `firebase.ts`, `useGameSync.ts` |
| Authentification (email/password + invité) | ✅ Complet | `auth.service.ts` |
| Système économique (pièces, XP, diamants) | ✅ Complet | `economy.service.ts`, `RewardEngine.ts` |
| Boutique cosmétique | ✅ Présent | `store.service.ts`, `store.tsx` |
| Classement global | ✅ Présent | `leaderboard.service.ts` |
| Statistiques joueur | ✅ Présent | `stats.service.ts` |
| Système de reconnexion automatique | ✅ Présent | `useConnectionStatus.ts` |
| Vote pour revanche | ✅ Présent | `firebase.ts → voteForRematch()` |
| Récompenses quotidiennes | ✅ Présent | `DailyRewardModal.tsx` |
| Thèmes de table | ✅ Présent | `tableThemes.ts` |
| Modes de jeu (Manche / Score / Cochon) | ✅ Présent | `types.ts → GameMode` |
| Gestion des Boudés (partie bloquée) | ✅ Présent | `useAutoPass.ts`, `ScoringEngine.ts` |
| Timer de tour avec overtime | ✅ Présent | `useGameTimers.ts` |
| Chat rapide en jeu | ✅ Présent | `QuickChat.tsx` |
| Sons & vibrations | ✅ Présent | `SoundManager.ts`, `HapticManager.ts` |
| Aide/règles en jeu | ✅ Présent | `HelpOverlay.tsx`, `RulesPanel.tsx` |

---

### Fonctionnalités incomplètes ou manquantes ⚠️

#### F1 — Pas de mécanisme "tirage du talon" (talon mort)
Les joueurs ne peuvent piocher que dans leur main initiale. S'il n'y a plus de talon ou que le joueur est bloqué, le `useAutoPass` gère automatiquement le "passe". Il n'est pas clair si cela est intentionnel (règles simplifiées) ou une omission.

#### F2 — Tournoi non implémenté
La page `home.tsx` affiche une carte "Tournoi" mais ce mode n'est pas fonctionnel (route inexistante ou désactivée). Risque de confusion utilisateur.

#### F3 — Boutique partiellement connectée à l'économie
Les achats en boutique déduisent les pièces côté client uniquement (voir section sécurité). Pas de validation serveur.

#### F4 — `/(tabs)/explore.tsx` — écran vide ou placeholder
L'écran "Explore" dans la navigation à onglets semble être un placeholder Expo par défaut, potentiellement non supprimé.

---

## 4. CONTRADICTIONS & INCOHÉRENCES

### C1 — Double attribution de points dans MANCHE WIN
**Fichier :** [src/core/ScoringEngine.ts](src/core/ScoringEngine.ts)
**Sévérité :** HAUTE — Déséquilibre économique

Le gagnant d'une manche reçoit des points **deux fois** :
- **Boucle 1** (lignes ~45-57) : +1 `totalRoundWins` ET +1 `totalPoints`
- **Boucle 2** (lignes ~110-136) : +`cochonCount` supplémentaire à `totalPoints`

Résultat : le gagnant accumule des points différemment selon le chemin d'exécution. La sémantique de `totalPoints` est ambiguë (round wins? round wins + bonus?).

---

### C2 — `firstPlayerOfRound` sémantique surchargée
**Fichier :** [src/core/ScoringEngine.ts](src/core/ScoringEngine.ts) + [src/core/LogicEngine.ts](src/core/LogicEngine.ts)
**Sévérité :** HAUTE — Avantage joueur potentiel

Ce champ est utilisé pour :
1. Identifier le gagnant du round (pour attribuer les étoiles)
2. Déterminer qui commence le round suivant

En cas de **Chirée**, le gagnant du round (qui réinitialise la manche) reçoit l'avantage de commencer en premier, ce qui pourrait être non intentionnel.

---

### C3 — Reset des étoiles dans deux endroits différents
**Fichiers :** [ScoringEngine.ts](src/core/ScoringEngine.ts) (commentaire explicite) + [GameScreen.tsx](src/screens/GameScreen.tsx) (`handleNextRound`)
**Sévérité :** MOYENNE — Risque de données obsolètes

Le code commente lui-même le problème :
```typescript
// On ne remet PAS les étoiles à 0 ici.
// L'effacement des étoiles se fera via handleNextRound...
```
Si un crash survient entre la fin de manche et le clic "Suivant", les étoiles persistent incorrectement — surtout problématique en multijoueur.

---

### C4 — Fenêtres d'immunité désynchronisées
**Fichiers :** [useGameTimers.ts](src/hooks/game/useGameTimers.ts) + [useTurnManager.ts](src/hooks/game/useTurnManager.ts)
**Sévérité :** MOYENNE — Timeouts manqués ou intempestifs

Deux `useRef` différents (`turnMountedAtRef`) dans deux hooks distincts mesurent le même début de tour. Si le composant monte les hooks dans des ordres différents, les mesures diffèrent et la logique d'immunité devient incohérente.

---

### C5 — Boucle infinie possible sur TIE lors d'un Boudé
**Fichier :** [src/core/ScoringEngine.ts](src/core/ScoringEngine.ts) + [src/core/LogicEngine.ts](src/core/LogicEngine.ts)
**Sévérité :** MOYENNE — Crash potentiel

Quand un Boudé aboutit à une égalité parfaite (même somme dans les mains de tous les joueurs), le moteur renvoie `'TIE'` et relance un redeal. Si le nouveau tirage produit encore une égalité identique, le jeu peut boucler indéfiniment. Aucun garde-fou (compteur max de re-deals) n'est en place.

---

### C6 — Phase `PARTIE_END` vs `MANCHE_END` — comportements opposés
**Fichier :** [src/core/LogicEngine.ts](src/core/LogicEngine.ts) `computeNextRoundState`
**Sévérité :** FAIBLE — Confusion de code

```typescript
currentMancheStars: isMancheEnd ? 0 : (originalPlayer?.currentMancheStars ?? 0),
```
En `PARTIE_END` (fin de round simple), les étoiles sont **conservées**. En `MANCHE_END`, elles sont **réinitialisées**. C'est correct par design, mais contre-intuitif car `PARTIE_END` suggère une fin totale alors qu'il s'agit d'un simple round.

---

### C7 — autoplay web : fallback potentiellement jamais vrai
**Fichier :** [src/core/audio/SoundManager.ts](src/core/audio/SoundManager.ts)
**Sévérité :** FAIBLE — Régression web

```typescript
private get isAudioAllowed(): boolean {
    if (Platform.OS !== 'web') return true;
    if (typeof navigator !== 'undefined' && 'userActivation' in navigator) {
        return (navigator as any).userActivation.hasBeenActive;
    }
    return this.userInteracted; // ← Peut ne jamais passer à true
}
```
Sur les navigateurs ne supportant pas `navigator.userActivation`, le son ne joue jamais.

---

## 5. SÉCURITÉ

### 🔴 SEC-1 — CRITIQUE : Clés Firebase exposées dans `.env`
**Fichier :** `.env`
**Impact :** CRITIQUE

Le fichier `.env` contient **toutes les clés Firebase en clair**, dont la clé API publique :
```
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyBJnQ...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=domino-martinique-v1
EXPO_PUBLIC_FIREBASE_APP_ID=1:916243245615:web:974a0b8d9896885e5534da
```

**Risques immédiats :**
- N'importe qui avec ces clés peut lire/écrire dans Firestore
- Accès à tous les profils utilisateurs, économie, parties
- Si ce fichier est dans git (même supprimé), les clés sont dans l'historique

**Action immédiate requise :**
1. Révoquer la clé API dans Google Cloud Console
2. Régénérer toutes les clés Firebase
3. Vérifier que `.env` est dans `.gitignore` ET absent de l'historique git
4. Utiliser `git filter-branch` ou BFG pour purger l'historique si nécessaire

---

### 🔴 SEC-2 — CRITIQUE : Aucune règle de sécurité Firestore
**Fichier :** [src/core/services/firebase.ts](src/core/services/firebase.ts)
**Impact :** CRITIQUE

Sans règles Firestore explicites, la base de données est en mode "test" (lecture/écriture ouverte). N'importe quel utilisateur authentifié peut :
- Lire tous les profils de tous les utilisateurs
- Modifier la collection `rooms` (supprimer des joueurs, terminer des parties)
- Modifier l'économie d'autres joueurs
- Accéder au catalogue de la boutique

**Règles minimales à implémenter :**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid in resource.data.playerIds;
    }
  }
}
```

---

### 🔴 SEC-3 — CRITIQUE : Économie manipulable côté client
**Fichier :** [src/core/services/economy.service.ts](src/core/services/economy.service.ts)
**Impact :** CRITIQUE — Triche

La stratégie de fusion locale/distante utilise `Math.max` :
```typescript
private mergeEconomies(local, remote) {
    return {
        coins: Math.max(local.coins, remote.coins ?? 0), // Local gagne toujours!
        diamonds: Math.max(local.diamonds, remote.diamonds ?? 0),
        xp: Math.max(local.xp, remote.xp ?? 0),
    };
}
```

**Scénario d'attaque :**
1. Joueur modifie `@player_economy` dans AsyncStorage (accessible sur appareils rootés)
2. Passe en ligne — la fusion favorise les valeurs locales (les plus élevées)
3. Les pièces/diamants frauduleux sont synchronisés vers Firebase

---

### 🟠 SEC-4 — HAUTE : AsyncStorage non chiffré
**Fichiers :** Tous les services
**Impact :** HAUTE

Toutes les données persistantes (profil, économie, inventaire, préférences) sont stockées en JSON plein texte dans AsyncStorage, accessible sur tout appareil rooté.

**Clés sensibles exposées :**
```
@user_session_active
@guest_profile_data  ← Profil utilisateur
@player_economy       ← Monnaie, XP, niveau
@guest_inventory      ← Items possédés
@player_stats         ← Historique des parties
```

---

### 🟠 SEC-5 — HAUTE : ID invité prévisible
**Fichier :** [src/core/services/auth.service.ts](src/core/services/auth.service.ts)
**Impact :** HAUTE

```typescript
private generateGuestId(): string {
    return 'guest_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
```

`Date.now()` n'a qu'une précision à la milliseconde. `Math.random()` n'est pas cryptographiquement sûr. Un attaquant connaissant l'heure approximative de création d'un compte invité peut **énumérer les IDs** et accéder aux données d'autres joueurs.

---

### 🟠 SEC-6 — HAUTE : Logs console avec données sensibles
**Fichiers :** `auth.service.ts`, `economy.service.ts`, `firebase.ts`
**Impact :** HAUTE

Des centaines de `console.log` exposent en production :
- Noms d'affichage et avatars
- Soldes de portefeuilles (coins, XP, level)
- IDs de rooms Firebase
- Erreurs système avec chemins internes

Aucun système de filtrage conditionnel `__DEV__` n'est en place.

---

### 🟡 SEC-7 — MOYENNE : Validation des entrées absente
**Fichiers :** `firebase.ts`, `auth.service.ts`
**Impact :** MOYENNE

Aucune validation sur :
- `displayName` (pas de longueur max, pas de filtre de contenu)
- `roomName` (injection potentielle dans l'UI)
- `passcode` (pas de format requis)
- Paramètres économiques (pas de bornes sur coins/XP)

---

### 🟡 SEC-8 — MOYENNE : Pas de rate limiting
**Impact :** MOYENNE

Aucun throttle sur les opérations Firebase :
- Création de rooms (spam possible)
- Achats en boutique (spam possible)
- Mises à jour d'état de jeu (flood possible)

---

### 🟡 SEC-9 — FAIBLE : URLs d'avatar non filtrées
**Impact :** FAIBLE

```typescript
// avatars.ts
if (avatarId.startsWith('http://') || avatarId.startsWith('https://')) {
    return { uri: avatarId }; // N'importe quelle URL acceptée
}
```
Un utilisateur mal intentionné peut injecter une URL arbitraire (tracking pixel, ressource externe non maîtrisée).

---

## 6. SYNTHÈSE & PRIORITÉS

### Tableau de bord des risques

| # | Catégorie | Sévérité | Problème |
|---|-----------|----------|---------|
| SEC-1 | Sécurité | 🔴 CRITIQUE | Clés Firebase exposées dans `.env` |
| SEC-2 | Sécurité | 🔴 CRITIQUE | Firestore sans règles de sécurité |
| SEC-3 | Sécurité | 🔴 CRITIQUE | Économie manipulable côté client |
| SEC-4 | Sécurité | 🟠 HAUTE | AsyncStorage non chiffré |
| SEC-5 | Sécurité | 🟠 HAUTE | ID invité prévisible |
| C1 | Logique | 🔴 HAUTE | Double attribution de points manche |
| C2 | Logique | 🔴 HAUTE | `firstPlayerOfRound` sémantique ambiguë |
| P1 | Qualité | 🟠 HAUTE | Immunité timer dupliquée |
| C5 | Logique | 🟠 HAUTE | Boucle infinie possible sur TIE Boudé |
| P9 | Qualité | 🟠 HAUTE | Absence totale de tests unitaires |
| C3 | Logique | 🟡 MOYENNE | Reset étoiles dans deux endroits |
| C4 | Logique | 🟡 MOYENNE | Fenêtres d'immunité désynchronisées |
| P4 | Qualité | 🟡 MOYENNE | Multiple setGameState sans source unique |
| P8 | Qualité | 🟡 MOYENNE | isBot + isDisconnected sans enum |
| SEC-6 | Sécurité | 🟠 HAUTE | Logs sensibles en production |
| F2 | Fonctionnel | 🟡 MOYENNE | Mode Tournoi affiché mais non implémenté |
| P7 | Qualité | 🟢 FAIBLE | Son pass_turn manquant |
| P6 | Qualité | 🟢 FAIBLE | Son "end" joué deux fois |
| C7 | Logique | 🟢 FAIBLE | Autoplay web fragile |

---

### Plan d'action recommandé

#### Sprint 1 — Urgence sécurité (IMMÉDIAT)
1. **Révoquer et régénérer** les clés Firebase
2. **Implémenter les règles Firestore** (minimum requis avant production)
3. **Purger `.env` de l'historique git** si jamais commité
4. **Déplacer la validation économique côté serveur** (Cloud Functions)

#### Sprint 2 — Stabilité logique
5. **Documenter et tester** la logique de points (C1, C2)
6. **Unifier `turnMountedAtRef`** dans un seul hook partagé (C4, P1)
7. **Ajouter un garde-fou anti-boucle** sur les re-deals de Boudé TIE (C5)
8. **Clarifier le reset des étoiles** dans ScoringEngine uniquement (C3)

#### Sprint 3 — Qualité & maintenabilité
9. **Écrire des tests unitaires** pour DominoEngine, LogicEngine, ScoringEngine
10. **Remplacer isBot+isDisconnected** par un enum `playerStatus`
11. **Filtrer les console.log** avec `__DEV__` ou supprimer en production
12. **Ajouter la validation des entrées** (displayName, roomName, economy bounds)
13. **Ajouter l'asset son manquant** ou supprimer la référence "pass_turn"

---

*Rapport généré le 18 mars 2026 — Aucune modification de code effectuée.*
