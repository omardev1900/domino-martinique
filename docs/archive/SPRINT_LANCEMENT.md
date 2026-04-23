# 🚨 SPRINT LANCEMENT — Détail technique

> Contexte : bugs et manques bloquant la mise en production.
> Source : Retour client #2 du 21 avril 2026 → `FEEDBACK_CLIENT.md`
> Checkboxes actives → `TASKS.md`

**Objectif :** corriger tout ce fichier avant la première mise en prod.

---

## 🔴 BUGS BLOQUANTS — Multijoueur

---

### [R2-B1] Boudé invisible pour les autres joueurs en multi

**Comportement observé :**
- En solo : le message "Boudé" + animation avatar s'affichent correctement pour le joueur
- En multi : seul le joueur réellement boudé voit son propre état — les adversaires ne voient rien

**Cause probable :**
L'état Boudé n'est pas écrit dans Firestore. Il est géré localement dans l'état React du joueur concerné uniquement. Les autres clients n'ont donc aucun signal à écouter.

**Piste d'investigation :**
1. Vérifier dans `useActionDispatcher` si l'action Boudé écrit un champ dans le document Firestore de la room (ex: `players[id].isBoude = true`)
2. Vérifier dans `useTurnManager` ou `useGameEngine` si les autres clients lisent ce champ depuis le snapshot Firestore
3. Vérifier dans l'UI (`GameScreen` ou composant avatar) si l'affichage du badge Boudé dépend de l'état local ou de l'état Firestore

**Correction attendue :**
- Écrire `isBoude: true` dans Firestore via `useActionDispatcher` au moment où le joueur est boudé
- Remettre à `false` au début du tour suivant de ce joueur
- L'UI de tous les clients lit ce champ depuis le snapshot Firestore en temps réel

**Fichiers probablement concernés :**
- `src/hooks/game/useActionDispatcher.ts`
- `src/hooks/game/useTurnManager.ts`
- `src/core/LogicEngine.ts` (si la détection Boudé est une fonction pure)
- Composant avatar / `GameScreen.tsx`

---

### [R2-B2] Égalité : bug double jouable (mauvais double autorisé)

**Comportement observé :**
En cas d'égalité en fin de round, n'importe quelle double peut être jouée alors que seul le plus grand double parmi les joueurs en égalité devrait être autorisé.

**Cause probable :**
Non encore investigué.

**Piste d'investigation :**
1. Trouver dans `LogicEngine.ts` la fonction qui détermine les coups jouables en situation d'égalité
2. Vérifier que le filtre s'applique uniquement aux joueurs concernés par l'égalité (pas à tous)
3. Vérifier que "plus grand double" compare bien la valeur totale de la tuile (ex: [6|6] > [5|5])

**Correction attendue :**
- La fonction de validation des coups jouables doit, en cas d'égalité, restreindre les doubles autorisées au plus grand double détenu parmi les joueurs à égalité
- Couvrir ce cas avec un test unitaire dans `LogicEngine.test.ts`

**Fichiers probablement concernés :**
- `src/core/LogicEngine.ts` — fonction de calcul des coups jouables
- `src/core/LogicEngine.test.ts` — ajouter les cas de test

---

### [R2-B3] Affichage égalité dépasse l'écran

**Comportement observé :**
Le composant d'affichage de l'égalité sort des limites de l'écran.

**Piste d'investigation :**
- Vérifier les dimensions du composant (width/height fixes vs. pourcentages)
- Vérifier sur petits écrans (< 360px de large)
- Probablement un `position: absolute` sans contrainte de bords

**Correction attendue :**
Contraindre le composant avec `maxWidth`, `paddingHorizontal`, ou ajuster le positionnement absolu avec des marges sûres.

**Fichiers probablement concernés :**
- Composant overlay égalité (à identifier — probablement dans `UnifiedResultOverlay` ou similaire)

---

### [R2-B4] Impossible de couper le son

**Comportement observé :**
Le toggle son ne fonctionne pas (ou n'existe pas en multi).

**Piste d'investigation :**
1. Vérifier si le bouton son est présent dans l'UI multijoueur (peut-être retiré par erreur)
2. Vérifier que le service audio écoute bien le changement d'état du toggle
3. Vérifier si `unlockAudio()` au premier touch interfère avec le toggle

**Correction attendue :**
Toggle son fonctionnel et persistant (AsyncStorage) accessible en multi comme en solo.

**Fichiers probablement concernés :**
- `GameScreen.tsx` (présence du bouton)
- Service audio (à identifier)

---

### [R2-B5] Contour blanc indésirable sur les dominos

**Comportement observé :**
Les dominos ont un contour blanc visible qui n'est pas voulu par le design.

**Correction attendue :**
Supprimer ou corriger le `borderColor` / `borderWidth` sur le composant domino.

**Fichiers probablement concernés :**
- Composant domino (à identifier — `DominoTile` ou similaire)

---

### [R2-B6] Plein écran non forcé — barre système reste visible

**Comportement observé :**
Sur certains téléphones, une barre latérale ou système reste affichée par-dessus le jeu.
Devices concernés : non encore identifiés.

**Piste d'investigation :**
1. Vérifier la config Expo (`app.json`) — `androidNavigationBar`, `androidStatusBar`
2. Vérifier l'usage de `expo-navigation-bar` pour masquer la barre Android
3. Tester sur un device Android avec barre de navigation en bas ET sur le côté (mode paysage)

**Correction attendue :**
Forcer le mode immersif sur Android en paysage :
```ts
import * as NavigationBar from 'expo-navigation-bar';
NavigationBar.setVisibilityAsync('hidden');
NavigationBar.setBehaviorAsync('overlay-swipe');
```

**Fichiers probablement concernés :**
- `app.json` / `app.config.ts`
- Point d'entrée (`App.tsx` ou layout racine)

---

### [R2-B7] Popup résultats fin de match caché par le popup du round

**Comportement observé :**
À la fin du match, le popup de résultats s'affiche mais est immédiatement recouvert par le popup de fin de round qui apparaît en retard.

**Cause probable :**
Les deux popups sont déclenchés presque simultanément. Le popup round (`GameOverScreen` ou `UnifiedResultOverlay`) a un `zIndex` supérieur ou s'affiche après sans vérifier si le match est terminé.

**Piste d'investigation :**
Revoir la condition dans `GameOverScreen.tsx` — d'après `CHANGELOG.md` (patch 2.2.1), la condition est :
```ts
if ((!isMancheOver && !isBoudé) || isMatchOver) return;
```
Vérifier que `isMatchOver` bloque bien l'affichage du popup round quand le match est terminé.

**Correction attendue :**
Quand `isMatchOver === true`, le popup round ne doit pas s'afficher. Seul le popup résultats match doit apparaître.

**Fichiers probablement concernés :**
- `GameOverScreen.tsx`
- `GameScreen.tsx`

---

## 🟠 MANQUES BLOQUANTS LANCEMENT

---

### [R2-M1] Délai 1 sec après Boudé avant passage au joueur suivant

**Comportement attendu :**
Quand un joueur est boudé, attendre 1 seconde avant de passer automatiquement la main au joueur suivant. Laisse le temps aux joueurs de voir l'état Boudé (lié à R2-B1).

**Fichiers probablement concernés :**
- `src/hooks/game/useTurnManager.ts`

---

### [R2-M2] Mode Score : valeur par défaut à 10

**Note :** Déjà signalé en retour #1 (B4), corrigé par Manuel dans `solo.tsx`. Vérifier que la correction est bien présente dans la version multijoueur aussi.

**Fichiers à vérifier :**
- `solo.tsx`
- Écran de configuration multijoueur (lobby)

---

### [R2-M3] Niveau Ligue Cochon visible en jeu (encadrement icônes joueurs)

**Comportement attendu :**
L'icône/avatar de chaque joueur en cours de partie doit être encadré par la couleur correspondant à son niveau Ligue Cochon (Argent / Or / Diamant / Feu).

**Fichiers probablement concernés :**
- Composant avatar joueur dans `GameScreen`
- `leagueService.ts` — pour récupérer le niveau du joueur

---

### [R2-M6] Nom long des niveaux cochons forcé

**Comportement attendu :**
Afficher "Apprenti Boucher" au lieu de "APPRENTI" partout dans l'UI.

**Fichiers probablement concernés :**
- Constantes ou enum des niveaux Ligue (à identifier)
- Partout où le nom du niveau est affiché

---

### [R2-M7] Publicité au lancement — Phase 1 : popup admin-managed

> Décision client 22/04/2026 : **2 phases produit**.
> Phase 1 produit (bloquant lancement) = popup image géré par l'admin — **décomposée ici en 3 sous-phases d'exécution**.
> Phase 2 produit (post-lancement) = AdMob. Voir `docs/specs/ADS_SYSTEM.md`.

**Spec complète → `docs/specs/ADS_SYSTEM.md`**

#### Résumé Phase 1 produit

**Firestore — collection `ads/{adId}` :**
```ts
{
  title:      string,           // label admin uniquement
  imageUrl:   string,           // visuel uploadé
  targetUrl:  string | null,    // lien au tap (optionnel)
  active:     boolean,          // ON/OFF global
  startsAt:   Timestamp,
  endsAt:     Timestamp,
  placements: AdPlacement[],    // endroits où afficher
  frequency:  'EVERY_TIME' | 'ONCE_PER_SESSION' | 'ONCE_PER_DAY'
}
```

**Placements disponibles :**
| Clé | Déclencheur |
|---|---|
| `HOME` | Focus écran d'accueil |
| `BEFORE_SOLO` | Avant de lancer une partie solo |
| `AFTER_ROUND_SOLO` | Après chaque round (solo) |
| `END_OF_MANCHE_SOLO` | Fin de manche (solo) |
| `END_OF_MATCH_SOLO` | Fin de match complet (solo) |
| `BEFORE_MULTI` | Avant de rejoindre/créer une table multi |
| `END_OF_MATCH_MULTI` | Fin de match complet (multi) |

#### Découpage d'exécution — 3 sous-phases

**Sous-phase 1 — Backend & moteur** ✅ *(livrée 2026-04-22)*
- `mobile/src/core/ad.types.ts` — types `Ad`, `AdPlacement`, `AdFrequency`
- `mobile/src/core/services/ad.service.ts` — `AdService` singleton (preload, getAdForPlacement, resetSessionCooldowns, cooldowns AsyncStorage)
- `mobile/src/core/services/ad.service.test.ts` — 14 tests (filtrage, tri, 3 fréquences, cas combiné)
- `firestore.rules` — collection `ads/{adId}` : lecture publique, écriture admin (`isAdmin()`)

**Sous-phase 2A — UI Mobile & injections** ✅ *(livrée et validée)*
- `mobile/src/components/AdBannerModal.tsx` — popup plein écran : image, bouton X, tap = ouvre `targetUrl`
- `mobile/app/_layout.tsx` — au boot : `adService.resetSessionCooldowns()` puis `adService.preload()`
- Injection `HOME` dans `mobile/app/home.tsx` (AVANT le cadeau quotidien)
- Injection `BEFORE_SOLO` dans `mobile/app/solo.tsx`
- Injection `AFTER_ROUND_SOLO` + `END_OF_MANCHE_SOLO` + `END_OF_MATCH_SOLO` + `END_OF_MATCH_MULTI` dans `mobile/src/screens/GameScreen.tsx`
- Injection `BEFORE_MULTI` dans `mobile/app/game/[id].tsx`

**Sous-phase 2B — Dashboard Admin (Next.js)** ✅ *(livrée et validée)*
- `admin/app/dashboard/ads/page.tsx` — liste des pubs + toggle ON/OFF + bouton créer
- `admin/app/dashboard/ads/[id]/page.tsx` — formulaire : URL image, URL cible, `startsAt`/`endsAt`, placements (checkboxes), fréquence (radio)
- Lien "Publicités" dans la nav admin

#### Règles d'affichage mobile (rappel spec)
1. Charger `ads` avec `active: true` au démarrage via `preload()`
2. Filtrer : `startsAt <= now <= endsAt`
3. Filtrer : `placements` contient le placement demandé
4. Vérifier cooldown selon `frequency`
5. Si plusieurs pubs valides → la plus récente (`createdAt desc`)
6. Une pub HOME passe TOUJOURS avant le cadeau quotidien

---

## 🟡 AMÉLIORATIONS PRIORITAIRES (post-bugs)

---

### [R2-A5] Plateau de jeu : un seul bouton option

Fusionner les boutons d'infos et de réglages en un seul bouton "Options" qui ouvre un panneau unique. Objectif : aérer le plateau.

### [R2-A6] Popup fin de match : refonte

Grouper dans un seul popup : résultats + Mes gains + animation. Déplacer l'historique dans une icône en haut de l'écran.

### [R2-A4] Stats Ligue Cochons dans le (i) de l'accueil

Regrouper les informations de la Ligue dans l'overlay d'aide accessible depuis l'accueil.

### [R2-M4 & M5] Classements mensuels par catégorie et par niveau cochon

Nouveaux onglets dans le Leaderboard : classement mensuel Bouchers / Défenseurs / etc. + classement par niveau cochon.

### [R2-A2] Design dominos configurable depuis admin

Couleurs des dominos et des points modifiables depuis le dashboard admin.

### [R2-A1] Animation glissement dominos

Reporté depuis Bloc 8 — à traiter ici si le temps le permet avant lancement.

---

## 🧠 Bot MÈTKAYALI — Niveau 4 IA (post-lancement)

> **Spec complète → `docs/specs/BOT_METKAYALI.md`**

**Objectif :** Ajouter un 4ᵉ niveau de difficulté IA ultra-puissant, nettement supérieur au GRAN_MOUN actuel.

**Architecture :** 4 couches de raisonnement empilées :

| Couche | Module | Rôle |
|--------|--------|------|
| 1 | **TileTracker** | Comptage parfait des 28 tuiles — déduit ce que chaque adversaire peut avoir en main |
| 2 | **MonteCarlo** | Simule 500-1000 fins de parties pour chaque coup possible → choisit le meilleur en espérance |
| 3 | **EndgameAnalyzer** | Détecte le risque de Boudé et bascule entre stratégie "vider les lourds" et "contrôler la table" |
| 4 | **OpponentModeler** | Profile chaque adversaire en temps réel, mode alerte si adversaire à 1-2 tuiles restantes |

**Fichiers clés :**
- `mobile/src/core/MeytKayaliEngine.ts` — moteur principal
- `mobile/src/core/ai/` — sous-modules (TileTracker, MonteCarlo, EndgameAnalyzer, OpponentModeler)
- Modifications : `DominoEngine.ts`, `BotEngine.ts`, `LogicEngine.ts`, `types.ts`, `bot.service.ts`

**Puissance estimée :** ~70% victoires contre 2× GRAN_MOUN sur 100 parties.

**Contrainte :** < 100ms par décision sur smartphone.

**Priorité :** Post-lancement (pas bloquant).

---

## ✅ Ordre d'attaque recommandé

1. R2-B1 + R2-M1 ensemble (Boudé multi + délai) — même zone de code
2. R2-B7 (popup caché) — risque élevé, correctif ciblé
3. R2-B2 (bug double égalité) — logique pure, testable
4. R2-B3 (affichage égalité) — UI rapide
5. R2-B4 + R2-B5 (son + contour) — corrections indépendantes
6. R2-B6 (plein écran) — config Expo
7. R2-M2 (mode score défaut) — vérification rapide
8. R2-M3 + R2-M6 (Ligue en jeu + noms longs)
9. R2-M7 (pub bidon)
10. Améliorations R2-A5, A6, A4
11. 🧠 Bot MÈTKAYALI (post-lancement)
