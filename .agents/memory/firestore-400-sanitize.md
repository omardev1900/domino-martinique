---
name: Firestore 400 — écritures à assainir
description: Toute écriture Firestore de gameState doit nettoyer undefined/NaN/Infinity, sinon 400 Bad Request.
---

Règle : toute écriture Firestore contenant du gameState (ou données calculées) doit passer par un sanitizer récursif (undefined → null, NaN/Infinity → null).

**Why :** Firestore rejette silencieusement (400 sur documents:commit) les payloads avec NaN/Infinity/undefined. Sources typiques : `Math.min(...[])` → Infinity dans le scoring, champs optionnels undefined dans les patchs partiels. Deux sanitizers existent : `cleanUndefineds` (useGameSync/safeUpdateGameState) et `sanitizeForFirestore` (firebase.ts, utilisé par updateGameState).

**How to apply :** toute nouvelle fonction d'écriture (updateDoc/setDoc/transaction.update) sur `rooms/` doit réutiliser `sanitizeForFirestore` — ne jamais écrire de données calculées brutes.

Aussi : les refs de timers de sécurité (ex. filet 12s de fin de round) doivent être remises à `null` dans le cleanup d'effet, sinon un rerun de l'effet désarme le filet sans re-arm possible (pattern `if (!ref.current)`).
