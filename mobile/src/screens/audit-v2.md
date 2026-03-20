# Plan de correction post-audit
**Date :** 20 mars 2026
**Base :** Rapport de contrôle du 20 mars 2026
**Objectif :** Corriger les anomalies restantes, classées par priorité

---

## SPRINT 1 — Régressions & bugs actifs (à faire en premier)

### Étape 1 — Corriger la régression son "end" (P6)
**Fichier :** `src/screens/GameOverScreen.tsx`
**Durée estimée :** 15 min

**Problème :** Le son `end` est déclenché depuis deux `useEffect` indépendants, ce qui peut provoquer 2-3 lectures simultanées.

**Correction :**
- Fusionner les deux `useEffect` en un seul
- La logique : jouer `end` une seule fois quelle que soit la situation (Boudé ou non)
- Si Boudé : jouer `end` + `HapticManager.triggerImpact()`
- Si winner : jouer `end` + `HapticManager.triggerSuccess()`
- Si loser : jouer `end` uniquement

```typescript
// AVANT (deux useEffect séparés → 3 appels possibles)
useEffect(() => {
  if (isBoudé) return;
  if (isWinner) { SoundManager.playSound('end'); HapticManager.triggerSuccess(); }
  else { SoundManager.playSound('end'); }
}, [gameState.gameId, ...]);

useEffect(() => {
  if (isBoudé) { SoundManager.playSound('end'); HapticManager.triggerImpact(); }
}, [isBoudé]);

// APRÈS (un seul useEffect → 1 appel garanti)
useEffect(() => {
  SoundManager.playSound('end');
  if (isBoudé) HapticManager.triggerImpact();
  else if (isWinner) HapticManager.triggerSuccess();
}, [gameState.gameId, currentUserId, isBoudé]);
```

---

## SPRINT 2 — Qualité du code (sans dépendance externe)

### Étape 2 — Supprimer `sum` redondant dans `Domino` (P3)
**Fichier :** `src/core/types.ts` + tous les fichiers qui créent/utilisent des dominos
**Durée estimée :** 30-45 min

**Problème :** `sum: number` est toujours `left + right`, risque d'incohérence.

**Correction :**
1. Retirer `sum` de l'interface `Domino` dans `types.ts`
2. Rechercher tous les usages de `.sum` dans le projet (`DominoEngine.ts`, `LogicEngine.ts`, `BotEngine.ts`, etc.)
3. Remplacer `domino.sum` par `domino.left + domino.right` partout
4. Retirer la propriété `sum` des endroits où les dominos sont construits (`dealGame()`)
5. Vérifier que les tests passent toujours

---

### Étape 3 — Compléter la migration des `console.log` vers LogService (SEC-6 / P5)
**Fichiers :** `SoundManager.ts`, `auth.service.ts`, `economy.service.ts`, `GameScreen.tsx`, `RewardEngine.ts`, `ScoringEngine.ts`, `BotEngine.ts`
**Durée estimée :** 45-60 min

**Problème :** ~30 appels `console.log/warn/error` directs subsistent en dehors du LogService.

**Correction par fichier :**

| Fichier | Appels directs | Action |
|---------|----------------|--------|
| `SoundManager.ts` | ~21 | Remplacer par `LogService.debug()` / `LogService.error()` |
| `auth.service.ts` | ~7 | Remplacer par `LogService.info()` / `LogService.error()` |
| `economy.service.ts` | ~11 | Remplacer par `LogService.debug()` / `LogService.error()` |
| `GameScreen.tsx` | ~6 | Remplacer par `LogService.debug()` |
| `RewardEngine.ts`, `ScoringEngine.ts`, `BotEngine.ts` | ~5-10 | Remplacer par `LogService.debug()` |

**Règle :** `console.error` → `LogService.error()` (toujours visible), `console.log/debug/warn` → `LogService.debug()` ou `LogService.warn()` (masqués en production).

---

### Étape 4 — Validation stricte de `startingHandSize` (P10)
**Fichier :** `src/core/LogicEngine.ts` (~ligne 521)
**Durée estimée :** 15 min

**Problème :** Seul un fallback silencieux existe. Un état corrompu passe sans erreur.

**Correction :**
```typescript
// Ajouter en début de computeNextRoundState()
const handSize = activeState.startingHandSize;
if (!handSize || handSize < 1 || handSize > 14 || !Number.isInteger(handSize)) {
    throw new Error(`[LogicEngine] startingHandSize invalide: ${handSize}`);
}
```

---

### Étape 5 — Whitelist de domaines pour les avatars URL (SEC-9)
**Fichier :** `src/core/avatars.ts`
**Durée estimée :** 15 min

**Problème :** N'importe quelle URL externe est acceptée comme avatar.

**Correction :**
```typescript
const ALLOWED_AVATAR_DOMAINS = [
    'firebasestorage.googleapis.com',
    'lh3.googleusercontent.com',  // Google Photos
];

if (avatarId.startsWith('http://') || avatarId.startsWith('https://')) {
    try {
        const url = new URL(avatarId);
        if (ALLOWED_AVATAR_DOMAINS.some(d => url.hostname.endsWith(d))) {
            return { uri: avatarId };
        }
    } catch {}
    return AVATAR_IMAGES.avatar_default; // URL invalide ou domaine non autorisé
}
```

---

## SPRINT 3 — Sécurité (avec dépendances ou configuration externe)

### Étape 6 — ID invité cryptographiquement sûr (SEC-5)
**Fichier :** `src/core/services/auth.service.ts`
**Dépendance :** `expo-crypto` (déjà dans le projet Expo) ou `uuid`
**Durée estimée :** 20 min

**Problème :** `Date.now() + Math.random()` — prédictible.

**Correction :**
```typescript
import * as Crypto from 'expo-crypto';

private async generateGuestId(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    const hex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return 'guest_' + hex;
}
```
> Vérifier si `expo-crypto` est déjà installé (`package.json`). Sinon : `npx expo install expo-crypto`.

---

### Étape 7 — Règles de sécurité Firestore (SEC-2)
**Fichiers :** Créer `firestore.rules` à la racine du projet
**Dépendance :** Firebase CLI (`firebase deploy --only firestore:rules`)
**Durée estimée :** 30-45 min

**Problème :** Pas de règles versionnées. La base est probablement en mode test ouvert.

**Correction — créer `firestore.rules` :**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Profils utilisateurs — lecture publique (classement), écriture propriétaire seulement
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }

    // Économie — propriétaire seulement
    match /users/{uid}/economy/{doc} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Salles de jeu — lecture pour tous les joueurs authentifiés, écriture pour les membres
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null
        && request.auth.uid in resource.data.playerIds;
      allow delete: if request.auth != null
        && request.auth.uid == resource.data.hostId;
    }

    // Classement — lecture publique, pas d'écriture directe
    match /leaderboard/{doc} {
      allow read: if request.auth != null;
      allow write: if false; // Mis à jour uniquement par Cloud Functions
    }
  }
}
```

**Déploiement :** `firebase deploy --only firestore:rules`

---

### Étape 8 — Supprimer la logique `Math.max` dans la fusion économique (SEC-3)
**Fichier :** `src/core/services/economy.service.ts`
**Durée estimée :** 20 min

**Problème :** `Math.max(local, remote)` favorise toujours les valeurs locales → triche possible.

**Correction :** Supprimer le `mergeEconomies` local-gagne et adopter une stratégie "remote wins" :
```typescript
private mergeEconomies(local: Economy, remote: Economy): Economy {
    // Remote (Firebase) est la source de vérité.
    // Local utilisé uniquement si remote absent (mode offline pur).
    return {
        coins: remote.coins ?? local.coins,
        diamonds: remote.diamonds ?? local.diamonds,
        xp: remote.xp ?? local.xp,
    };
}
```
> **Note :** Cela ne résout pas le problème de fond (validation serveur). La vraie correction est une Cloud Function, mais ce changement élimine déjà la faille la plus évidente.

---

## RÉCAPITULATIF DES ÉTAPES

| # | Étape | Priorité | Fichiers touchés | Effort |
|---|-------|----------|-----------------|--------|
| 1 | Régression son "end" (P6) | 🔴 URGENT | `GameOverScreen.tsx` | 15 min |
| 2 | Supprimer `sum` redondant (P3) | 🟡 MOYENNE | `types.ts` + moteurs | 45 min |
| 3 | Migration console.log → LogService (SEC-6) | 🟠 HAUTE | 7 fichiers | 60 min |
| 4 | Validation `startingHandSize` (P10) | 🟡 MOYENNE | `LogicEngine.ts` | 15 min |
| 5 | Whitelist domaines avatar (SEC-9) | 🟡 FAIBLE | `avatars.ts` | 15 min |
| 6 | ID invité crypto-safe (SEC-5) | 🟠 HAUTE | `auth.service.ts` | 20 min |
| 7 | Règles Firestore (SEC-2) | 🔴 CRITIQUE | `firestore.rules` (nouveau) | 45 min |
| 8 | Fusion économie remote-wins (SEC-3) | 🔴 CRITIQUE | `economy.service.ts` | 20 min |

**Total estimé : ~4h de travail**

---

## CE QUI N'EST PAS DANS CE PLAN (hors portée code)

- **SEC-4** (AsyncStorage chiffré) — Nécessite `react-native-encrypted-storage`, migration de toutes les clés existantes, et tests approfondis. Travail de fond à planifier séparément.
- **SEC-1** (rotation des clés Firebase) — Action manuelle dans Google Cloud Console.
- **C6** (renommage `PARTIE_END`) — Refactoring terminologique non prioritaire, risque de régression si mal exécuté.

---

*Plan établi le 20 mars 2026*
