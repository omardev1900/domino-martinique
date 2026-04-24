# 📝 CHANGELOG — Domino Martiniquais

> Journal des changements notables, classés par date (plus récent en premier).

---

## [2.3] — 25 Avril 2026

### Ajouté
- **Reset mot de passe** — Flow "Mot de passe oublié ?" sur l'écran de connexion : saisie email → lien Firebase envoyé → message de confirmation
- **Google Sign-In** — Intégration complète (masquée, sera activée au passage en test interne Google Play)
- **Universal Links WhatsApp Android** — Lien d'invitation cliquable (bleu) dans WhatsApp sur Android, ouvre directement la table. iOS prévu post-lancement.
- **Sidebar améliorée** — Avatar cliquable → Profil, icône Réglages → page paramètres complète (onglets Audio / Profil / Compte + bouton déconnexion)

### Corrigé
- **AdBannerModal** — Fallback image automatique si la vidéo publicitaire ne peut pas être lue
- **Sidebar** — Icônes Profil et Réglages pointaient vers la même page

---

## [2.2] — Avril 2026

### Ajouté
- **Ligue des Cochons** — Système de progression lifetime complet (4 paliers : 30/150/250/500 cochons infligés)
- **Cadres d'avatar animés** — Argent, Or, Diamant Néon, Feu (débloqués par palier)
- **Onglet Cochons dans le Leaderboard** — Classement par `cochonsGiven`
- **Code de table court** — 6 caractères (réduit depuis format long)
- **Lien d'invitation WhatsApp** — Deep-link avec code pré-rempli
- **Refonte UX Solo & Lobby** — Flow en 2 étapes (Choix du Mode → Configuration), cards 21% largeur

### Modifié
- **processMatchReward (Cloud Function)** — Incrémentation `cochonsGiven` + déblocage de palier Ligue
- **Leaderboard** — Tri par `cochonsGiven` sur l'onglet COCHONS

### Supprimé
- **Mode invité** — Supprimé définitivement du code client + comptes anonymes existants purgés

---

## [2.2.1] — 15 Avril 2026 — Patch : Bug Ligue des Cochons (leaguePoints = 0)

### Corrigé

#### 🐛 Bug majeur : `leaguePoints` toujours à 0 malgré des parties jouées

**Contexte :** Les comptes de test avaient tous `leaguePoints = 0` en Firebase.
La jauge "Cochons du mois" sur l'écran d'accueil affichait donc toujours 0.
Cause : triple chaîne de bugs dans la **collecte** des données. `ScoringEngine` et `RewardEngine` étaient corrects.

**Correction 1 — `GameScreen.tsx` ligne 366**
- ❌ `cochons: localPlayer.totalCochons` → champ ambigu = cochons **reçus** (malus)
- ✅ `cochons: localPlayer.totalCochonsInfliges` → compteur permanent cumulatif des cochons **infligés**,
  correctement incrémenté par `ScoringEngine` à chaque fin de manche

**Correction 2 — `GameOverScreen.tsx` ligne 78**
- ❌ `if (!isMancheOver && !isBoudé) return;`
  → Double-enregistrement : lors de la dernière manche (`MATCH_END`), `GameOverScreen` ET `GameScreen`
  appelaient tous deux `recordMatchResult()`, dupliquant les cochons comptabilisés
- ✅ `if ((!isMancheOver && !isBoudé) || isMatchOver) return;`
  → `GameOverScreen` = manches intermédiaires uniquement / `GameScreen` = MATCH_END exclusivement

**Correction 3 — `stats.service.ts` lignes 140–145**
- ❌ `economyService.setEconomy({ leaguePoints: stats.totalCochonsInflicted })` supprimé
  → Cette ligne **écrasait** Firebase avec le compteur local AsyncStorage (qui repart à 0 à chaque réinstallation)
- ✅ `leaguePoints` géré **exclusivement** par `RewardEngine` via `processServerReward()` dans `GameScreen`
  → Firebase est désormais la seule source de vérité, sans race condition possible

**Flux corrigé :**
```
ScoringEngine → cochonCount dans mancheHistory ✅
GameOverScreen → manches intermédiaires uniquement ✅
GameScreen (MATCH_END) → recordMatchResult(totalCochonsInfliges) + processServerReward() ✅
                       → RewardEngine → leaguePoints incrémenté correctement dans Firebase ✅
```

---

## [2.1] — Mars 2026

### Ajouté
- **HelpOverlay interactif** — Règles accessibles via le bouton "?" en jeu
- **Feedback sensoriel** — Shake avatar en cas de "Boudé"
- **Animations générales** — FlyingDomino, RewardOverlay, UnifiedResultOverlay, FadeInUp Leaderboard
- **Refonte UI Statistiques** — Layout paysage
- **Refonte UI Écran de Victoire** — Animation "Pluie de richesses"
- **Boutique & Cosmétiques** — Skins de table/dominos, inventaire hybride
- **Chat emoji** — Émoticônes prédéfinies en cours de partie
- **Volume BGM par défaut** — Réduit à 0.25/0.3 pour meilleur confort

### Modifié
- **GameScreen.tsx** — Refactor complet en Custom Hooks (`useGameEngine`, `useActionDispatcher`, `useTurnManager`, `useBotDecision`)
- **IA des Bots** — Refonte 3 niveaux : TI_MANMAY / MAPIPI / GRAN_MOUN + `BotService` Firestore

### Corrigé
- Désynchronisation multijoueur (host freeze en transition de round)
- Bug cascade timer/bots corrigé
- Boudé reste affiché longtemps chez les adversaires → résolu
- Double-attribution de score → résolu

---

## [2.0] — Février–Mars 2026

### Ajouté
- **Mode Manche** — Limite manche + Tie-breaker + Chiré fonctionnels
- **Mode Cochon** — Partie se termine sur quota de cochons atteint
- **Badges Cochon** — Comptage et affichage en jeu
- **Stats profil** — Enregistrement en fin de match (+1 victoire, points, cochons)
- **Fiabilisation Timer** — `turnMountedAtRef` centralisé, immunité 5s début de tour
- **Plein écran web mobile** — `unlockAudio()` au premier touch
- **Affichage numéro round/manche** — Avant le début de chaque partie

### Modifié
- **Architecture modulaire** — Séparation LogicEngine / useTurnManager / useActionDispatcher / useBotDecision
- **structuredClone** remplace `JSON.parse(JSON.stringify())` partout
- **Migration console.* → LogService** — 43 appels migrés

### Corrigé
- Bug domino initial en R1 (doit être le plus grand double)
- Bug raccord si domino double
- Garde-fou anti-boucle (Boudé TIE) — compteur max de re-deals
- Reset des étoiles centralisé dans ScoringEngine
- Rendu serpent déterministe (bug domino vertical corrigé)

---

## [1.0] — Janvier–Février 2026

### Ajouté
- **Projet initialisé** — React Native + Expo + Firebase
- **Authentification** — Firebase Auth (email)
- **Mode Solo** — 2 niveaux IA (débutant / intermédiaire)
- **Mode Multijoueur** — Tables publiques + tables privées (code/invitation)
- **Moteur de jeu complet** — Distribution Fisher-Yates, validation coups, sens anti-horaire
- **Système de score** — Étoiles, manches, cochons, chiré, Le Camion
- **127 tests unitaires** — 0% failure
- **Sécurité Firestore** — Rules pour rooms, bots, store, users
- **Cloud Function processMatchReward** — Validation économique côté serveur
- **Rotation des clés Firebase** — `.env` jamais versionné
- **Validation Zod** — Inputs utilisateur
- **Debounce updateGameState** — 300ms par roomId
- **Dashboard Admin** — Next.js (analytics, bans, bots, config, leaderboard, logs, notifications, players, store, tables, tournaments)

---

## Convention de versioning

- **Majeure (X.0)** : Refonte architecture ou fonctionnalité majeure
- **Mineure (X.Y)** : Nouveau bloc fonctionnel complet
- **Patch (X.Y.Z)** : Corrections de bugs et ajustements
