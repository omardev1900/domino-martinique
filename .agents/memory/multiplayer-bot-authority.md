---
name: Multiplayer bot authority — TIMEOUT
description: Le check d'autorité pour exécuter les TIMEOUT des bots/déconnectés doit utiliser isLocalHost, pas roomData.createdBy.
---

## Règle

Dans `mobile/src/hooks/game/useActionDispatcher.ts`, le guard TIMEOUT pour les bots/joueurs déconnectés doit utiliser `isLocalHost` (prop dynamique, suit l'élection d'hôte) et NON `roomData.createdBy !== localPlayerId` (statique, ne change jamais).

```typescript
// ✅ CORRECT
if (isBotOrDisconnected && !isSoloMode && !isLocalHost) return;

// ❌ BUGGY — créateur statique, jamais mis à jour
if (isBotOrDisconnected && !isSoloMode && roomData && roomData.createdBy !== localPlayerId) return;
```

**Why:** Si le créateur original de la room se déconnecte, l'hôte élu (premier joueur HUMAN actif) prend le relais. Avec le check `createdBy`, l'hôte élu ne peut pas exécuter les TIMEOUT → partie figée indéfiniment.

**How to apply:** Toujours utiliser `isLocalHost` comme source de vérité pour les décisions d'hôte dans useActionDispatcher. L'élection d'hôte est calculée dans GameScreen.tsx et propagée via props.
