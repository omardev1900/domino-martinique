# ✅ TASKS_DONE — Archive des tâches terminées

> **Rôle** : archive historique de toutes les tâches livrées.
> **Ne contient aucune tâche active** — tout ce qui est ici est figé.
>
> **Flux** : `TASKS_TODO.md` → `TASKS.md` → **`TASKS_DONE.md`**
>
> Convention : classement par date descendante (plus récent en haut), date au format AAAA-MM-JJ.

---

## 📅 Mai 2026

### 2026-05-05 — Ligue mensuelle & aide (session Codex)

- [x] **[R4-UX4]** `/ligue-cochons` — séparation du hub Ligue en `Ma Ligue`, `Classement du mois`, `Classement global`
  - **Classement du mois** : mêmes familles `+ Cochons / - Cochons / + Points`, mais calculées depuis le mois courant (`matchHistory`)
  - **Classement global** : mêmes familles, calculées sur le cumul historique
  - **Perf / Total** : conservé sur les 2 tabs avec seuil de qualification à 10 matchs
  - **Source dédiée** : `leaderboard.service.ts` expose désormais des métriques mensuelles (`cochons`, `cochons subis`, `points`, `matchs joués`) pour alimenter le hub Ligue

- [x] **[R4-UX5]** Aide — déplacement des `Infos Ligue`
  - **Suppression** : l’onglet `Infos` sort de `/ligue-cochons`
  - **Ajout** : nouvel onglet `Ligue` dans `HelpOverlay`
  - **Composant partagé** : contenu Ligue factorisé dans `LeagueInfoContent.tsx`

### 2026-05-02 — Admin Manager (P1 priorité)
- [x] **[ADMIN-MANAGER]** Système de rôles manager avec accès limité
  - **Firestore Rules** : Ajout `isSuperAdmin()` avec fallback rétrocompatible. Collections sensibles (users, config, feedbacks, logs) = superadmin-only. Collections manager (bots, store, chat, ads, tournaments) = isAdmin()
  - **AdminAuth** : Lecture champ `role` depuis Firestore, fallback `superadmin` si absent, exposé dans `AdminState`
  - **Layout** : Redirection si manager tente accès routes superadmin-only
  - **Sidebar** : Filtrage items selon rôle, affichage badge rôle (jaune/bleu), listener feedbacks conditionné
  - **API Routes** : `/api/admins` (GET + POST), `/api/admins/[uid]` (PATCH + DELETE), sécurisées avec `verifyIdToken()` + `isSuperAdmin` check
  - **Page `/dashboard/access`** : UI CRUD (table admins, ajout modal, modification rôle, suppression avec self-delete bloqué)
  - **Rétrocompatibilité** : Admins existants sans champ `role` = superadmin automatiquement

### 2026-05-02 — Dette technique — Tests (TECH-TEST-1/2/3)

- [x] **[TECH-TEST-1]** Assertions `totalCochons` sur perdants — ScoringScenarios était déjà vert (corrigé lors d'un sprint précédent)
- [x] **[TECH-TEST-2]** Config Jest ESM Firebase — mock global de `firebase/firestore`, `firebase/auth`, `firebase/storage`, `firebase/app` ajouté dans `jest.setup.js`
- [x] **[TECH-TEST-3]** Tests GameHeader réécrits pour la nouvelle interface (3 props), GameOverlays corrigé (flow confirmation quit en 2 étapes), mock `LogicEngine` complété avec `getForcedTieBreakDominoId`
- **Résultat** : 51 tests / 6 suites / 0 échec

---

### 2026-05-02 — Admin dashboard — Boutique, Bots IA, Tchat

**Boutique (`/dashboard/store`)**
- [x] **[ADMIN-STORE]** Upload image avatar — input fichier, preview immédiate, conversion WebP 200×200, stockage Firebase Storage `avatars/`
- [x] **[ADMIN-STORE]** Preview skin dynamique — composant live affichant 2 dominos avec les vraies couleurs sur le vrai fond de table
- [x] **[ADMIN-STORE]** Suppression du type EMOTE (remplacé par `/dashboard/chat`)
- [x] **[ADMIN-STORE]** Affichage image réelle dans la liste (au lieu de l'icône emoji générique)

**Bots IA (`/dashboard/bots`)**
- [x] **[ADMIN-BOTS]** Formulaire simplifié — nom, image, difficulté uniquement (IDs gérés en coulisses)
- [x] **[ADMIN-BOTS]** Fix firestoreId — modification et suppression utilisent désormais l'ID réel du document Firestore
- [x] **[ADMIN-BOTS]** Aperçu avatar dans la liste — image réelle si disponible, icône de difficulté sinon
- [x] **[ADMIN-BOTS]** Suppression colonnes ID et Avatar ID de la table

**Tchat en jeu (`/dashboard/chat`)**
- [x] **[R3-M3]** Page admin CRUD complète — messages et emojis gratuits ou payants, toggle activé/désactivé, ordre d'affichage
- [x] **[R3-M3]** Bouton "⚡ Initialiser les défauts" — insère les 8 messages + 12 emojis codés en dur en un clic
- [x] **[R3-M3]** `QuickChat.tsx` — fetch Firestore au démarrage, fallback sur valeurs codées en dur si hors ligne
- [x] **[R3-M3]** Onglet Premium — items payants visibles avec prix, achat définitif en coins, badge ✓ après achat
- [x] **[R3-M3]** Règles Firestore `chat_messages` déployées (lecture authentifiée)

**Infrastructure**
- [x] **[STORAGE-RULES]** Règles Firebase Storage — dossiers `bots/`, `avatars/`, `audio/` ouverts en écriture admin authentifié

### 2026-05-01 — Suppression de compte (ACCOUNT-DELETE)
- [x] **[ACCOUNT-DELETE]** Suppression de compte — exigence Google Play 2024
  - Cloud Function `deleteUserAccount` : supprime `users/{uid}`, `stats/{uid}`, `economy/{uid}` puis `auth.deleteUser(uid)`
  - `auth.service.ts` : méthode `deleteAccount()` via `httpsCallable`
  - `modal.tsx` onglet COMPTE : bouton + 2 modals de confirmation (avertissement → saisie email → suppression)
  - Déployé sur Firebase (`us-central1`)

### 2026-05-01 — Stats, UX résultats & Interface (session Codex)

**Logique / Stats**
- [x] **[FIX-ECO-SYNC-SOLO]** Synchro economy/leaderboard corrigée pour le solo authentifié — les gains et compteurs remontent désormais correctement dans le leaderboard après une partie solo.
- [x] **[FIX-MONTHLY-STATS]** `/stats` — section "STATISTIQUES DU MOIS" : décompte correct des manches gagnées en 5 / 4 / 2 / 1 / -1 points (barème officiel respecté).
- [x] **[FIX-MANCHES-COUNT]** Bug de comptage : certaines manches n'étaient pas comptabilisées dans les stats — toutes les manches sont maintenant prises en compte.

**UX — Fin de manche / résultats**
- [x] **[UX-CHIRE-AUTO]** Modal CHIRÉ — bouton supprimé, passage automatique au round suivant (plus fluide, moins d'interruption).
- [x] **[UX-BOUDE-CARDS]** Modal partie bloquée / égalité — refonte en cartes joueur côte à côte avec dominos affichés verticalement (lisibilité nettement améliorée).
- [x] **[UX-ROUND-WIN-TEASER]** Teaser de fin de round gagnant — version plus dramatique (animation/présentation renforcée).
- [x] **[UX-ROUND-WIN-MOBILE]** Version mobile du teaser ajustée pour rester lisible sur petits écrans.
- [x] **[FIX-COCHON-SCROLL]** Écran fin de partie Mode Cochon — vue rendue scrollable + footer accessible (correction du blocage apparent sur téléphone).

**Interface**
- [x] **[UX-OPTIONS-HISTORY]** Onglet "Historique" ajouté dans le menu Options pendant le match (consultation de l'historique des manches sans quitter la partie).
- [x] **[UX-LIGUE-PROGRESS]** `/ligue-cochons` — compteur de progression repositionné pour ne plus chevaucher l'affichage des paliers.

---

## 📅 Avril 2026

### 2026-04-29 — Sprint Correctif Post-Lancement (Retour client #3)
- [x] **[R3-B1]** Mode Score : blocage de fin de partie — la partie s'arrête dès l'objectif atteint ; en cas d'égalité parfaite, le jeu continue jusqu'à ce qu'un joueur prenne l'avantage.
- [x] **[R3-B4]** Synchronisation cochons & grades — compteur mis à jour en temps réel après chaque match ; fenêtre de félicitations au passage de grade (nouveau rang + total cochons).
- [x] **[R3-B2]** Onglet DÉTAILS vide en Mode Score — historique et scores s'affichent correctement quel que soit l'objectif ou la durée du match.
- [x] **[R3-B8]** Fond d'écran quadrillage — fond uni et propre sur tous les écrans clés (Accueil, Menu Solo, Lobby).
- [x] **[R3-B5]** Widget Ligue : superposition texte/jauge — espacement corrigé, grade/compteur/barre disposent chacun de leur espace dédié.
- [x] **[R3-B6]** Boutique : affichage skins & prix — dominos affichés en grand (mode paysage) ; prix coins/diamants listés séparément l'un sous l'autre.
- [x] **[R3-B3]** Égalité Boudé — en cas d'égalité parfaite en main, les scores de chaque joueur s'affichent correctement dans la fenêtre de résultat.
- [x] **[R3-M4]** Aide Mode Cochon — texte corrigé (arrêt au quota défini) ; barème clarifié : Donner 1 cochon = +1 pt, Double Cochon = +2 pts, Recevoir = -1 pt.
- [x] **[BONUS]** Modal fin de match — header affiche le contexte au centre (ex: MODE SCORE · 10 PTS).
- [x] **[BONUS]** Statistiques — suppression de la ligne "Manches Gagnées" sous le taux de victoire pour éviter toute confusion.
- [x] **[R3-B7]** Mode paysage fixe — confirmé N/A (comportement voulu, verrouillage par conception).

### 2026-04-25
- [x] **[LAUNCH-AUTH-1]** Auth — Reset mot de passe + Google Sign-In (partiel)
  - Reset MDP : `sendPasswordReset()` dans `auth.service.ts` + UI "Mot de passe oublié ?" dans `login.tsx` (message vert succès, erreurs Firebase localisées)
  - Google Sign-In : `signInWithGoogleCredential()` dans `auth.service.ts`, hook `Google.useAuthRequest` + bouton "Continuer avec Google" dans `login.tsx` — **masqué provisoirement** (`GOOGLE_SIGNIN_ENABLED = false`) jusqu'au passage en test interne Google Play (EAS build Android requis). Client IDs configurés : Web + Android (`916243245615-m3biip70ga7nlgm1mf8kqaa4tggl7g3g`), URI Expo proxy ajoutée. Réactiver en changeant `GOOGLE_SIGNIN_ENABLED = true` dans `login.tsx`.
  - Sidebar : avatar cliquable → `/profile`, Réglages → `/modal` (onglet Compte + bouton déconnexion retrouvé)
  - AdBannerModal : fallback image si vidéo échoue
- [x] **[R2-T1]** Universal Links WhatsApp (Android) — domaine `domino-martinique.online`, `intentFilters` + `assetlinks.json` Android opérationnels, page fallback `/join/<code>`, `shareToWhatsApp()` génère l'URL HTTPS, deep-link handler `join/[id].tsx`. iOS : `associatedDomains` + `apple-app-site-association` configurés avec Team ID de test (5LKJF84FN2) — build TestFlight + mise à jour Team ID prod reportés post-lancement (voir [R2-T1-IOS] dans backlog).
- [x] **[UX-NAV]** Simplification navigation — supprimé headers/flèches/titres redondants sur 7 écrans (profil, game-modes, ligue, leaderboard, stats, boutique, vestiaire), retiré item Profil de la sidebar, supprimé onglet Thème des Paramètres. Fichiers : `profile.tsx`, `game-modes.tsx`, `ligue-cochons.tsx`, `leaderboard.tsx`, `stats.tsx`, `store.tsx`, `collection.tsx`, `Sidebar.tsx`, `modal.tsx`.
- [x] **[UX-LEAGUE]** Refonte widget Ligue des Cochons — nouveau LeagueProgressWidget (icône grade 38px, compteur cochons, barre progression colorée, prochain grade, bouton info), réordonnancement onglets modal (Ma Ligue → Classement → Infos). Fichiers : `LeagueProgressWidget.tsx`, `LeagueInfoModal.tsx`.
- [x] **[UX-ADS]** Pub HOME non-intrusive — délai 3,5s avant affichage, badge "Ads" permanent, countdown 10s avant bouton fermeture, blocage back Android pendant le décompte. Fichiers : `home.tsx`, `AdBannerModal.tsx`.
- [x] **[UX-MATCH-END]** Refonte modal fin de match — fix confettis (autoStart, suppression fadeOut, boucle 3,5s), navigation (🏠 + Détails) déplacée en haut du modal. Fichier : `UnifiedResultOverlay.tsx`.
- [x] **[UX-ROUND-END]** Refonte modal fin de round — modal agrandi (92% × 82%), dominos 40px, textes épurés (suppression VICTOIRE/DANS LA MAIN/PTS), format inline Nom(score), couronne 👑 vainqueur. Fichier : `RoundResultCard.tsx`.
- [x] **[FIX-PROFILE]** Fix pseudo/avatar — regex élargie (accepte apostrophes, tirets, underscores, points), avatar auto-save ne revalide plus le displayName existant. Fichiers : `schemas.ts`, `profile.tsx`.

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
### 2026-05-04
- [x] **[R4-B1]** Ligue des Cochons — source de vérité mensuelle unifiée entre l'accueil, `Ma Ligue` et `/ligue-cochons`
  - Progression ligue recalculée depuis les cochons du mois au lieu du total historique
  - Helper partagé pour grade, seuil précédent/suivant et pourcentage de progression
  - Marqueurs de jauge trompeurs supprimés de l'écran `/ligue-cochons`
  - Écran Ligue simplifié : suppression de la logique d'équipement de cadres persistants, paliers centrés sur la progression mensuelle et les bonus coins
  - Calcul de fin de match aligné sur la progression mensuelle pour les passages de grade
- [x] **[R4-UX1]** Navigation Ligue — `/ligue-cochons` devient l'écran maître de la Ligue des Cochons
  - L'écran Ligue intègre maintenant les 3 tabs `Ma Ligue`, `Classement` et `Infos`
  - Le bouton `(i)` du widget accueil redirige désormais vers `/ligue-cochons`
  - `LeagueInfoModal` a été supprimé pour éliminer la redondance entre modal et page dédiée
  - La navigation Ligue est maintenant centralisée sur un seul point d'entrée cohérent
- [x] **[R4-UX2]** Mes Stats — séparation nette entre vue mensuelle et cumulée
  - Le menu `Stats` est renommé en `Mes Stats`
  - L'écran `/stats` ouvre désormais par défaut sur `Ce mois-ci`
  - Une seconde vue `Cumulé` permet de relire la progression globale sans confusion avec `Rank` ou `Ligue`
  - L'historique des matchs est conservé dans le même écran via le bouton dédié
