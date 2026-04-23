# Inventaire & Audit Sonore — Domino Martiniquais Mobile

## Contexte
Audit du système audio du jeu mobile pour identifier les incohérences entre les sons disponibles, ceux définis dans le SoundManager, et ceux réellement déclenchés dans la logique de jeu. Objectif : base pour améliorer l'attractivité sonore du jeu.

---

## Fichiers clés
- `mobile/src/core/audio/SoundManager.ts` — Singleton audio (expo-audio)
- `mobile/src/assets/sounds/` — 16 fichiers MP3
- `mobile/src/hooks/useSoloGame.ts` — Logique jeu solo
- `mobile/src/hooks/useMultiplayerGame.ts` — Logique multijoueur
- `mobile/src/hooks/game/useActionDispatcher.ts` — Dispatcher d'actions
- `mobile/src/hooks/game/useAutoPass.ts` — Auto-passe
- `mobile/src/screens/GameOverScreen.tsx` — Écran fin de partie
- `mobile/src/components/UnifiedResultOverlay.tsx` — Overlay résultats
- `mobile/src/screens/GameScreen.tsx` — Écran principal (preload ligne 629, unlockAudio ligne 781)
- `docs/RULES_AND_LEXICON.md` — Source de vérité des règles & déclencheurs audio

---

## INVENTAIRE COMPLET DES SONS

### Sons disponibles dans /assets/sounds/ (16 fichiers)

| Fichier | Alias SoundManager | Statut | Déclencheur réel | Problème détecté |
|---|---|---|---|---|
| `clack1.mp3` | `clack` (via playClack()) | ✅ UTILISÉ | Placement d'un domino | OK |
| `clack2.mp3` | `clack` (via playClack()) | ✅ UTILISÉ | Placement d'un domino | OK |
| `clack3.mp3` | `clack` (via playClack()) | ✅ UTILISÉ | Placement d'un domino | OK |
| `distribute.mp3` | `shuffle` | ✅ UTILISÉ | Nouvelle manche (NEXT_ROUND) + démarrage solo | OK, mais alias trompeur |
| `notify.mp3` | `notify` / `pass_turn` | ✅ UTILISÉ | Joueur passe son tour (boude individuel) | OK |
| `win.mp3` | `win` | ✅ UTILISÉ | Victoire manche/match | Double-déclenchement possible (GameOverScreen + UnifiedResultOverlay) |
| `lose.mp3` | `lose` | ✅ UTILISÉ | Défaite manche/match | Double-déclenchement possible |
| `boude.mp3` | `boude` | ⚠️ UTILISÉ INCORRECTEMENT | CHIRÉ + Boude global + auto-pass | Utilisé pour 2 événements distincts (boude ≠ chiré) |
| `timer.mp3` | `timer` | ❌ NON DÉCLENCHÉ | Alerte compte à rebours | Préchargé mais jamais appelé dans le code |
| `end_time.mp3` | `end_time` | ❌ NON DÉCLENCHÉ | Timer expiré | Préchargé mais jamais appelé |
| `start-game.mp3` | `start-game` | ❌ NON DÉCLENCHÉ | Démarrage d'une partie | Préchargé mais jamais appelé |
| `toktok.mp3` | `toktok` | ❌ NON DÉCLENCHÉ | Inconnu | Défini dans SoundManager, jamais appelé nulle part |
| `pops.mp3` | — | ❌ NON DÉFINI | Inconnu | Absent du SoundManager, aucune référence dans le code |
| `bgm1.mp3` | `bgm1` | ⚠️ INCERTAIN | Musique de fond (boucle) | Sélectable dans settings mais déclenchement initial flou |
| `bgm2.mp3` | `bgm2` | ⚠️ INCERTAIN | Musique de fond (boucle) | Idem |
| `bgm3.mp3` | `bgm3` | ⚠️ INCERTAIN | Musique de fond (boucle) | Idem |

---

## SONS SANS DÉCLENCHEUR (5 sons muets)

| Son | Problème | Son attendu selon RULES_AND_LEXICON.md |
|---|---|---|
| `timer.mp3` | Jamais déclenché | Doit jouer quand le timer de tour passe sous un seuil (ex: <5s) |
| `end_time.mp3` | Jamais déclenché | Doit jouer quand le temps de tour expire |
| `start-game.mp3` | Jamais déclenché | Doit jouer au lancement d'une partie |
| `toktok.mp3` | Jamais déclenché, rôle inconnu | Non spécifié dans les docs |
| `pops.mp3` | Absent du SoundManager | Non spécifié dans les docs |

---

## ÉVÉNEMENTS SANS SON (déficits audio)

Selon `docs/RULES_AND_LEXICON.md`, ces événements devraient avoir un son :

| Événement de jeu | Son prévu (docs) | Situation actuelle |
|---|---|---|
| **Cochon infligé** (0 victoires = malus cochon) | "Special pig cry" | ❌ Aucun son spécifique — `win.mp3` utilisé par défaut dans UnifiedResultOverlay pour COCHON |
| **Chiré** (1-1-1 reset) | "Swipe/reset sound" | ❌ `boude.mp3` utilisé à la place — son incorrect |
| **Démarrage de partie** | Signal sonore | ❌ `start-game.mp3` existe mais n'est jamais déclenché |
| **Alerte timer** | Son d'urgence | ❌ `timer.mp3` préchargé mais jamais joué |
| **Fin de timer** | Son d'expiration | ❌ `end_time.mp3` préchargé mais jamais joué |

---

## INCOHÉRENCES DÉTECTÉES

1. **`boude.mp3` sur-utilisé** : joué pour Boude (blocage individuel), Chiré (1-1-1 reset) et auto-pass — 3 événements distincts avec le même son.

2. **Cochon non différencié** : `win.mp3` est joué même quand un joueur reçoit un cochon (malus) dans UnifiedResultOverlay — sémantiquement incorrect.

3. **Double déclenchement win/lose** : `win.mp3` et `lose.mp3` sont potentiellement appelés deux fois (GameOverScreen.tsx + UnifiedResultOverlay.tsx).

4. **BGM sans démarrage explicite** : La BGM est configurable dans les settings mais aucun démarrage automatique n'est visible au lancement de GameScreen. Risque de silence persistant.

5. **`start-game.mp3` inutilisé** : Le son existe, est préchargé, mais `playSound('start-game')` n'est jamais appelé.

6. **`pops.mp3` orphelin** : Fichier présent sur disque, absent du SoundManager — complètement inutilisé.

7. **`toktok.mp3` défini mais jamais déclenché** : Présent dans le preload du SoundManager mais aucun `playSound('toktok')` dans le codebase.

---

## PLAN D'AMÉLIORATION (à valider)

### Corrections prioritaires
1. Déclencher `start-game.mp3` au lancement de GameScreen (après unlockAudio)
2. Déclencher `timer.mp3` quand le timer passe sous 5 secondes
3. Déclencher `end_time.mp3` quand le timer expire
4. Créer un son dédié pour le **Cochon** (ou réutiliser `toktok.mp3`)
5. Créer un son dédié pour le **Chiré** (ou réutiliser `pops.mp3`)
6. Corriger l'usage de `boude.mp3` : uniquement pour le blocage total (partie bouée)
7. Éviter le double-déclenchement win/lose entre GameOverScreen et UnifiedResultOverlay
8. Vérifier et corriger le démarrage de la BGM

### Attribution suggérée des sons non utilisés
| Son | Nouvel usage suggéré |
|---|---|
| `toktok.mp3` | Son de cochon infligé |
| `pops.mp3` | Son de chiré (1-1-1 reset) |
| `start-game.mp3` | Lancement de partie |
| `timer.mp3` | Alerte timer < 5s |
| `end_time.mp3` | Timer expiré (forcer le passe) |
