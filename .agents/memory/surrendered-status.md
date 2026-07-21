---
name: SURRENDERED PlayerStatus — Abandon volontaire multijoueur
description: Le statut SURRENDERED distingue un abandon volontaire d'une déconnexion réseau ; les règles de comportement et classement sont documentées ici.
---

## Règle

`PlayerStatus = 'HUMAN' | 'BOT' | 'DISCONNECTED' | 'SURRENDERED'`

- **SURRENDERED** : joueur a cliqué "Quitter l'écran" et confirmé → abandon volontaire
- **DISCONNECTED** : coupure réseau détectée par RTDB/vigilance → accidentel

## Comportement en jeu (identique à DISCONNECTED)
- Le bot joue les tours (délai 2500ms, 12 tentatives max — `isAbsent` dans useBotDecision)
- Timer de tour réduit à 3s max (`useGameTimers`)
- Non-reconnaissable par la vigilance/RTDB (guard `status !== 'HUMAN'` les protège tous les deux)

## Classement en fin de match (spécifique à SURRENDERED)
- SURRENDERED toujours dernier dans le sort du RewardEngine, indépendamment du score/mancheWins
- Appliqué dans `mobile/src/core/RewardEngine.ts` ET `functions/src/core/RewardEngine.ts`
- DISCONNECTED n'est PAS pénalisé → classement basé sur ses points normalement

## Points d'entrée dans le code
- `signalPlayerOffline(surrendered?: boolean)` dans `useConnectionStatus.ts` : écrit SURRENDERED si true
- Appelé avec `true` dans GameScreen.tsx : confirmation dialog "Quitter l'écran" et `handleLeaveRoom`
- Appelé sans param (= false = DISCONNECTED) dans `handleBeforeUnload` (OS kill / web unload)

**Why:** Un joueur qui abandonne volontairement ne doit pas bénéficier d'un classement basé sur la performance de son bot. La règle est simple : quit = dernier.
