# ✅ TASKS_DONE — Archive des tâches terminées

> **Rôle** : archive historique de toutes les tâches livrées.
> **Ne contient aucune tâche active** — tout ce qui est ici est figé.
>
> **Flux** : `TASKS_TODO.md` → `TASKS.md` → **`TASKS_DONE.md`**
>
> Convention : classement par date descendante (plus récent en haut), date au format AAAA-MM-JJ.

---

## 📅 Avril 2026

### 2026-04-24
- [x] **[R2-A3]** Sidebar navigation — menu latéral gauche permanent façon "Dashboard jeu vidéo", feature flag `USE_NEW_SIDEBAR`, modal MDC crédits + feedback Firestore. Fichiers : `Sidebar.tsx`, `MdcFeedbackModal.tsx`, `navigation.config.ts`, `_layout.tsx`, `firestore.rules`, `home.tsx`.

### 2026-04-23
- [x] **[B-LEAGUE-THRESHOLDS]** Grade Ligue des Cochons incohérent entre accueil, Infos et Ma Ligue — `LEAGUE_THRESHOLDS` avait les valeurs décalées (APPRENTI_2 à 10 au lieu de 20, etc.) ; grade recalculé à la volée via `getLeagueGrade()` dans `LeagueInfoModal` au lieu de lire `eco.leagueGrade` périmé (`economy.constants.ts` mobile + functions, `LeagueInfoModal.tsx`).
- [x] **[R2-M5]** Classement par cochon par niveau cochon — onglet "Classement" dans le modal Ligue des Cochons (3 familles : Apprentis / Maîtres / Élite).

### 2026-04-22
- [x] **[R2-M7]** Pub au lancement Phase 1 — popup admin-managed (moteur, UI mobile, dashboard admin Next.js) + règles Firestore `ads/{adId}`.
- [x] **[R2-M3]** + **[R2-M6]** + **Refonte paliers** : 8 paliers Ligue des Cochons (`APPRENTI_1/2/3`, `MAITRE_1/2/3`, `ROI`, `LEGENDE`), cadre en jeu par couleur de grade, labels longs ("Apprenti 1", "Maître Saucissier 2", "Roi du Boudin", "Légende du Grouin") dans toute l'UI.
- [x] **[R2-A2]** Design dominos — couleurs par défaut + modification depuis admin (color pickers, preview dans modal StoreItem, persistance `skinConfig`).

### 2026-04-21 (retour client #2)
- [x] **[R2-B6]** Plein écran Android — `AppState` listener + `overlay-swipe` pour ré-appliquer l'immersive mode au retour en foreground (`_layout.tsx`).
- [x] **[R2-A5]** Plateau de jeu — `GameOptionsMenu` centré (tabs Jeu/Infos + quitter Solo) remplace les 4–5 icônes du header ; `GameHeader` réduit à 2 badges + ⚙️ (`GameHeader.tsx`, `GameOptionsMenu.tsx`, `GameScreen.tsx`).
- [x] **[R2-A6]** Popup fin de match refonte — groupe résultats + Mes gains + animation confetti / Historique via icône.
- [x] **[R2-A4]** Stats Ligue Cochons regroupées dans le (i) de l'accueil (onglets Infos / Ma Ligue dans `LeagueInfoModal`).
- [x] **[R2-B5]** Contour blanc dominos — remplacement du fond SVG `<Rect rx=8>` par `expo-linear-gradient` natif (`DominoTile.tsx`).
- [x] **[R2-B4]** Icône couper son — `toggleMute` + pause forcée BGM + `isSfxEnabled` propagé à fade/duck/watchdog (`SoundManager.ts`).
- [x] **[R2-B3]** Popup égalité qui dépassait l'écran — maxHeight + ScrollView + layout compact (`RoundResultCard.tsx`).
- [x] **[R2-B7]** Popup résultats fin de match caché par le popup du dernier round qui s'affiche en retard.
- [x] **[R2-B2]** Égalité : force le plus grand double entre les 2 en égalité uniquement.
- [x] **[R2-B8]** Status "Boudé" persistant : le badge restait affiché après la fin d'une manche.
- [x] **[R2-B1]** Boudé visible en multi — `boudePlayerId` synchro via Firestore + clignotement avatar + masquage compteur.
- [x] **[R2-M1]** Délai 2s après Boudé avant passage au joueur suivant.
- [x] **[R2-M2]** Mode Score : valeur par défaut à 10 (2e signalement).

---

## 📅 Avril 2026 — retour client #1 (14/04/2026)

- [x] **Ligue des Cochons** — 4 paliers, cadres avatar, backend + UI + leaderboard + tests *(remplacé ensuite par 8 paliers le 22/04/2026)*.
- [x] **[B1]** Dominos jouables non mis en avant au 1er tour (`PlayerHand.tsx`).
- [x] **[B2]** Dominos qui se bousculent lors du tour du joueur (`PlayerHand.tsx`).
- [x] **[B3]** Mode Cochon : inversion logique d'attribution (`ScoringEngine`).
- [x] **[B4]** Mode Score : valeur par défaut 100 → 10 (`solo.tsx`).
- [x] **[A1]** Badge "Boudé" flottant.
- [x] **[A2]** Vibration de tour + toggle en-tête in-game.
- [x] **[A3]** Dominos non jouables : suppression du grisage.
- [x] **[A4]** Objectif de partie visible en multijoueur (badge header).
- [x] **[A9]** Renommage bot "Béké" → "Chabine".
- [x] **[A15]** Taille des dominos réduite (42px → 38px).
- [x] **[M4]** Onglet DONATION dans l'overlay d'aide.

---

## 📅 Antérieur (blocs 1-9 terminés entre janvier et avril 2026)

- [x] Code table court (6 caractères).
- [x] Lien d'invitation WhatsApp Deep-Link (protocole custom `domino-martinique://`).
- [x] Suppression définitive du mode invité.
- [x] Refonte UX Mobile Solo & Lobby (flow 2 étapes).
- [x] Bloc 1 — Urgence Sécurité (Firestore rules, validation serveur, rotation clés).
- [x] Bloc 2 — Stabilité logique (tests, timer, anti-boucle, scoring).
- [x] Bloc 3 — Qualité & Sécurité (LogService, Zod, debounce, 127 tests).
- [x] Bloc 4 — Architecture (React Native Expo, Firebase, modélisation données).
- [x] Bloc 5 — Moteur de jeu martiniquais complet (Boudé, Chiré, Cochon).
- [x] Bloc 6 — UX/UI & Design System (table 3 joueurs, dominos, animations).
- [x] Bloc 7 — Moteur de jeu final (modes Cochon/Manche, IA 3 niveaux, timer).
- [x] Bloc 8 — Immersion & Métagame UI (audio, chat, boutique, overlay). *Animations domino reportées.*
- [x] Bloc 9 — Ligue des Cochons (initialement 4 paliers, refondue en 8 le 22/04/2026).
