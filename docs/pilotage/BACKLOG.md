# 📋 TASKS_TODO — Backlog & Blocs à planifier

> **Rôle** : backlog de toutes les tâches connues mais **non encore planifiées** pour un sprint.
> Dès qu'une tâche est décidée pour exécution → **la déplacer vers `TASKS.md`**.
>
> **Flux** : **`TASKS_TODO.md`** → `TASKS.md` → `TASKS_DONE.md`
>
> Contient : blocs roadmap (10, 11, 12, 13), Bot MÈTKAYALI, backlog client (feedback Manuel déprioritisé), bugs à investiguer.

---

## 🎨 Avatars — Diversité des joueurs ✅ (02/05/2026)

- [x] **[AVATAR-DIVERSITY]** Ajouter avatars gratuits — diversité ethnique
  - **Livré** : 10 nouveaux avatars (`avatar_09` à `avatar_18`) + 8 existants = 18 avatars gratuits
  - **Diversité apportée** : Peau blanche, asiatique, métissée, féminins + styles variés
  - **Emplacement** : `mobile/src/assets/images/avatars/player/avatar_09.jpg` → `avatar_18.jpg`
  - **Config mise à jour** : `mobile/src/core/avatars.ts` 
    - ✅ Imports ajoutés pour `avatar_09` à `avatar_18`
    - ✅ `AVAILABLE_AVATARS[]` complété avec 10 IDs
  - **Format** : JPG 192×192px (comme les existants)
  - **Résultat** : +125% d'avatars gratuits, diversité ethnique respectée
  - **User visible** : Écran de sélection d'avatar dans `/profile`

---

## 🎯 Priorités Sprint Post-Lancement (02/05/2026)

### Priorité 0 — Correctifs critiques web / ligue / multi (retour client 04/05)
- [ ] **[R4-B3-SESSION]** Multijoueur — reconnexion impossible après purge complète de session navigateur malgré reconnexion avec le même compte
  - **Constat actuel** :
    - si le joueur quitte une partie multi puis revient sans purge de session, le retour forcé vers la room fonctionne
    - si les cookies / la session navigateur sont supprimés, puis que le joueur se reconnecte avec le même compte, l'app ne le renvoie pas encore vers la room active
  - **Impact** :
    - le joueur peut retomber sur l'accueil et relancer un autre flux de jeu
    - la reprise de match n'est pas fiable dans le cas d'une vraie purge navigateur
  - **Pistes à reprendre plus tard** :
    - consolider la source de vérité serveur de l'appartenance à une room active
    - fiabiliser la reprise depuis `users/{uid}.activeRoomId` même après reset complet des données locales
    - auditer les règles Firestore / permissions si la lecture du profil ou l'écriture de `activeRoomId` échouent dans certains cas
  - **Note** : les correctifs déjà validés sur ce chantier restent utiles (retour auto sans purge de session, suppression de table vide)
  - **Estimation** : ~0,75 à 1,5 jour

- [ ] **[R4-B2]** Ligue des Cochons — popup de passage de palier non affiché
  - **Symptôme** : l'overlay de réussite/promotion n'apparaît pas malgré un franchissement de palier
  - **Pistes** : vérifier le déclenchement de `RewardOverlay` et la propagation de `gradeUp` / `newlyUnlockedFrames` depuis le flux de fin de match
  - **Estimation** : ~0,5 jour

- [ ] **[R4-B4]** Web — unifier et repositionner le bouton plein écran
  - **Symptôme** : doublons du bouton plein écran, overlap avec l'avatar sur la version web
  - **À faire** : garder un seul point d'entrée, le déplacer hors des zones denses (`avatar`, actions hautes), vérifier desktop + Android browser
  - **Estimation** : ~0,25 jour

- [ ] **[R4-B5]** Web — domino gagnant parfois réutilisé depuis la partie précédente
  - **Symptôme** : en solo et en multi web, le domino gagnant affiché en fin de partie peut correspondre au match précédent
  - **Hypothèse** : état de résultat / overlay non réinitialisé entre deux parties
  - **À auditer** : `GameScreen`, `UnifiedResultOverlay`, `RoundResultCard`
  - **Estimation** : ~0,5 à 0,75 jour

### Priorité 1 — Décisions produit / économie (retour client 04/05)
- [ ] **[R4-M1]** Ligue des Cochons — reset mensuel du niveau
  - **Demande client** : le niveau de ligue doit repartir à zéro au début de chaque mois
  - **Point d'attention** : c'est un changement de règle produit, pas un simple fix UI ; aujourd'hui la progression est pensée comme cumulative/permanente
  - **Décision à prendre** :
    - option A : classement mensuel seulement, progression ligue permanente
    - option B : vraie ligue saisonnière avec remise à zéro mensuelle du niveau
  - **Dépendance** : clarifier aussi les récompenses, cadres et messages de promotion
  - **Estimation** : A ~1 jour / B ~2 à 3 jours

- [ ] **[R4-M2]** Monétisation — ajouter des placements pub dans boutique, vestiaire, etc.
  - **Objectif** : étendre les emplacements d'affichage pub hors de l'accueil
  - **À cadrer** : emplacements exacts, fréquence, distinction popup vs bannière vs récompense
  - **Lien backlog** : complète `ADS-REWARD` sans le remplacer
  - **Estimation** : ~0,75 jour

- [ ] **[R4-M3]** Boutique tchat — rendre phrases et emojis consommables à l'unité
  - **Demande client** : ne plus vendre ces items à vie, mais à l'usage/unité
  - **Impact technique** : passer d'un modèle d'`unlock` permanent à un inventaire consommable avec décrément à chaque envoi
  - **À prévoir** : compteur restant, prix unitaire, UX d'achat, rétrocompatibilité des items déjà achetés
  - **Estimation** : ~1,5 à 2 jours

- [ ] **[R4-M4]** Cadeau quotidien — remplacer les 300 coins gratuits par une récompense conditionnée à une pub
  - **Demande client** : plus de cadeau auto ; les 300 coins journaliers ne sont accordés qu'après clic sur `Voir une pub`
  - **À faire** : refondre le CTA du daily reward et l'adosser au flow pub récompensée
  - **Lien backlog** : peut être mutualisé avec `ADS-REWARD`
  - **Estimation** : ~0,5 jour

- [ ] **[R4-M5]** Notifications — relance quotidienne des joueurs
  - **Objectif** : envoyer une notification push quotidienne pour faire revenir les joueurs
  - **Lien backlog** : extension naturelle de `[NOTIF-1]`
  - **À cadrer** : heure d'envoi, opt-in, segmentation, texte, fréquence réelle
  - **Estimation** : ~0,75 à 1 jour après base FCM

### Priorité 2 — Réorganisation UI ligue / stats (retour client 04/05)
- [ ] **[R4-UX3]** Partage social — partager le jeu, les gains, le niveau de ligue et les récompenses gagnées
  - **Objectif** : permettre aux joueurs de partager facilement leur progression et leurs résultats
  - **Cas d'usage** :
    - partage du jeu
    - partage des gains de fin de partie
    - partage du niveau de ligue / palier atteint
    - partage des récompenses gagnées
  - **Point d'accroche recommandé** : à coupler avec les écrans de progression de palier et/ou de fin de match
  - **Estimation** : ~0,75 à 1 jour

- [x] **[R4-UX6]** Accueil — unifier la hauteur des 3 blocs principaux sur tous les appareils *(livré le 05/05/2026)*
  - **Symptôme** : les 3 blocs de l’accueil n’ont pas toujours la même hauteur selon le device, le ratio ou le contenu
  - **Objectif** : garantir une hauteur strictement homogène pour les 3 cartes de la rangée d’accueil, quel que soit l’écran
  - **À auditer** : `home.tsx`, contraintes de layout web/mobile, responsive sur desktop, tablette et mobile
  - **Estimation** : ~0,25 à 0,5 jour

- [ ] **[R4-IA1]** Bots — adapter le niveau des IA au niveau réel du joueur
  - **Demande** : un joueur avancé (ex. Maître Saucissier) ne doit plus affronter des bots débutants par défaut
  - **Objectif** : faire varier la difficulté, le pool ou le profil des bots selon le niveau/grade du joueur
  - **À cadrer** :
    - source de vérité du niveau joueur à utiliser
    - table de correspondance niveau joueur → difficulté bot
    - exceptions volontaires si le joueur choisit explicitement un niveau facile
  - **Estimation** : ~0,75 à 1,5 jour selon le degré d’adaptation

- [ ] **[R4-ECO1]** Récompenses — différencier les gains solo et multi selon la difficulté réelle des adversaires
  - **Problème** : les récompenses solo et multi ne devraient pas être identiques si l’opposition n’a pas la même valeur
  - **Objectif** : rendre les gains proportionnels à la qualité des adversaires (bots faibles, bots forts, humains, table, etc.)
  - **À réfléchir** :
    - barème solo vs multi
    - coefficient selon difficulté des bots
    - coefficient selon nombre d’adversaires humains réels
    - impact sur coins, XP et éventuels bonus de ligue
  - **Dépendance** : cohérence avec `RewardEngine`, buy-ins de table et équilibrage économie global
  - **Estimation** : ~1 à 2 jours avec recalibrage

- [ ] **[R4-TECH-LEADERBOARD]** Refonte stats / leaderboard — découpler les agrégats globaux et mensuels de `matchHistory`
  - **Problème actuel** : `matchHistory` est tronqué (désormais à 500) pour limiter la taille des données, mais il alimente encore une partie des stats mensuelles et certaines reconstructions en sync
  - **Risque** :
    - stats mensuelles incomplètes pour les gros joueurs
    - classement mensuel dépendant d'un historique tronqué
    - reconstruction de certains cumuls globaux depuis un historique limité
  - **Objectif cible** :
    - `globalCounters` persistants = source de vérité globale
    - `monthlyCounters` persistants = source de vérité mensuelle
    - `recentHistory` limité = affichage / historique récent uniquement
  - **À faire** :
    - créer des agrégats mensuels persistants (`monthKey`, matchs, points, cochons donnés/subis, breakdown 5/4/2/1/-1)
    - ne plus recalculer `gamesPlayed`, `gamesWon`, `totalPointsAccumulated` depuis `matchHistory`
    - faire lire `Classement du mois` uniquement depuis les agrégats mensuels
    - faire lire `Classement global` uniquement depuis les agrégats globaux
    - préparer le rollover automatique au changement de mois
    - garder `matchHistory` comme historique d'UI uniquement, avec limite raisonnable
  - **Option long terme** : si besoin d'historique complet, déplacer les matchs détaillés dans une sous-collection `users/{uid}/matches`
  - **Estimation** : ~2 à 3 jours

### Priorité 1 — Ads-to-Reward System
- [ ] **[ADS-REWARD]** Doubler les gains après pub — post-match modal avec CTA "Doubler mes gains via pub"
  - **Flow** : Fin match → modal résultats + bouton "Voir pub (x2 coins/XP)" → Google Ad → credited + toast "Gains doublés"
  - **Backend** : Flag `hasClaimedAdReward` par match dans `matches/{id}`
  - **Mobile** : Hook `useAdReward()` + AdRewardModal + doublement gains dans `processServerReward()`
  - **Estimation** : ~1,5 jour (UI + hook + backend)

### Priorité 2 — Animations Domino
- [ ] **[ANIM-DOMINO]** Glissé domino vers plateau + animation distribution
  - **Glissé** : Domino glisse du plateau joueur vers le centre, arrive avec "clack" SFX
  - **Distribution** : Dominos qui tombent en cascade en début de manche
  - **Lib** : React Native Reanimated (déjà utilisée)
  - **Estimation** : ~2 jours (glissé + distribution + tests)

### Priorité 3 — Gestion Comptes (Google login + profil avatar)
- [ ] **[ACCOUNT-GOOGLE]** Google Sign-In complet + affichage profil avatar
  - **Réactiver** : `GOOGLE_SIGNIN_ENABLED = true` dans `login.tsx` après build EAS Android
  - **Import Google** : Utiliser avatar Google Photo si `signInWithGoogle` (whitelist déjà OK dans `avatars.ts`)
  - **Tests** : Flow complet sign-in → profil visible → avatar affiché
  - **Estimation** : ~1 jour (tests + validation)

### Priorité 4 — Système Tournois (Bloc 11)
- [ ] **[TOURNAMENTS]** Création admin + lobby mobile + brackets auto
  - **Admin** : Interface création (format Manches/Points, buy-in Coins, dates)
  - **Mobile** : Écran inscription + lobby attente + brackets élimination 3j/match
  - **Backend** : Collection `tournaments/{id}` + Firestore rules + Cloud Function automation
  - **Estimation** : ~4 jours (admin + mobile + backend)

### Priorité 5 — Google Pay Integration
- [ ] **[GOOGLE-PAY]** Paiements Coins/Diamonds via Google Play Billing
  - **Android uniquement** (iOS = App Store In-App Purchase, post-v3.0)
  - **Lib** : `expo-in-app-purchases` ou `react-native-iap`
  - **SKUs** : Pré-configurés dans Google Play Console (100/500/2500 coins + diamant packs)
  - **Flow** : Boutique → "Acheter 500 coins (4,99€)" → Google Play popup → credited
  - **Estimation** : ~2 jours (intégration + validation + tests)

### Priorité 6 — Monitoring (Sentry)
- [ ] **[SENTRY]** Crashlytics + erreurs front + alertes
  - **Créer projet Sentry** mobile + admin
  - **Intégrer SDK** Expo (mobile) + Next.js (admin)
  - **Configurer alertes** : Crash rate, nouvelles exceptions, performance
  - **Dashboard** : Sentry board en readonly pour le PM
  - **Estimation** : ~1 jour (setup + config + tests)

---

## 🔍 Audit Admin Dashboard (à faire en dernier, post-roadmap)

- [ ] **[ADMIN-AUDIT]** Audit complet de l'espace admin — vérifier toutes les pages et fonctionnalités
  - **Périmètre** : tester chaque page du dashboard (`/analytics`, `/overview`, `/players`, `/tables`, `/bans`, `/config`, `/leaderboard`, `/bots`, `/store`, `/chat`, `/tournaments`, `/feedbacks`, `/logs`, `/notifications`, `/news`, `/ads`, `/audio`)
  - **Vérifier pour chaque page** : les données s'affichent correctement, les actions CRUD fonctionnent, les réglages impactent bien le jeu mobile
  - **Focus particulier** : `/dashboard/config` (quels paramètres sont lus côté mobile ?), `/dashboard/notifications` (branché FCM ou placeholder ?), `/dashboard/tournaments` (fonctionnel ou stub ?)
  - **Livrable** : liste des fonctionnalités cassées ou non branchées, avec plan de correction
  - **Estimation** : ~1 jour d'audit + corrections variables
  - **Priorité** : après la roadmap principale (Tournois, Comptes, Paiements)

---

## 🚨 Retour client #3 — 25 avril 2026 (Sprint correctif post-lancement)

> Source : `docs/feedback/feedback-250426.md` + archivé dans `docs/feedback/CLIENT.md`
> Classé par priorité. Les bugs P0 doivent être traités avant ou immédiatement après le lancement.

### 🔴 P0 — Bugs bloquants (à corriger en urgence)

- [ ] **[R3-B11]** 🔴 **BLOQUANT LANCEMENT** — Fuite d'authentification : reset mémoire → reconnexion avec un user ghost inconnu
  - **Symptôme** : Après un reset complet du browser (vider AsyncStorage/IndexedDB) et rechargement, l'utilisateur se retrouve connecté avec un user "inconnu" sans email/compte, déjà loggé au jeu
  - **Cause identifiée** : 
    - `getCurrentUser()` dans `auth.service.ts` L.149–153 appelle `auth.onAuthStateChanged()` et retourne le premier user trouvé dans Firebase Auth, même s'il s'agit d'une session "fantôme" ou anonyme
    - Firebase Auth persiste les sessions indépendamment d'AsyncStorage — le marqueur `STORAGE_KEY_SESSION` peut être supprimé mais Firebase retourne quand même un user
    - Aucune vérification que l'user retourné est **légitime** (a un email, n'est pas anonyme, etc.)
  - **Flux du bug** :
    1. Utilisateur se logout ou session AsyncStorage est vidée
    2. Firebase Auth session persiste toujours en mémoire/secure storage natif
    3. Au rechargement, `onAuthStateChanged` retourne cet user "fantôme"
    4. `mapFirebaseUserToProfile()` crée un ProfilePlayer valide même pour un user sans email
    5. `index.tsx` redirige vers `/home` au lieu de `/login`
  - **Fix requis** :
    1. Dans `logout()` : ajouter `await auth.signOut()` **ET** vider tous les storages (AsyncStorage, Firestore cache local si existe)
    2. Dans `getCurrentUser()` L.156–159 : ajouter une vérification `if (firebaseUser?.email)` avant de retourner le user — rejeter les users anonymes
    3. Bonus : sur la splash screen `index.tsx`, ajouter un timeout 5s pour éviter que `onAuthStateChanged` se bloque indéfiniment
  - **Fichiers** : `mobile/src/core/services/auth.service.ts` (logout + getCurrentUser), `mobile/app/index.tsx` (timeout)
  - **Estimation** : ~1h (fix simple, tests critiques)
  - **Test** : 
    - Lancer l'app → login avec email valide
    - Vider AsyncStorage manuellement (DevTools) + rechargement
    - **Résultat attendu** : Redirection vers `/login`, pas de user ghost
    - Puis logout propre → rechargement → vérifier qu'on arrive bien à `/login`

- [x] **[R3-B1]** ~~Mode Score : la partie ne se termine pas quand l'objectif est atteint~~ — **Livré 29/04/2026** : la partie s'arrête dès que l'objectif est atteint ; en cas d'égalité parfaite, le jeu continue jusqu'à ce qu'un joueur prenne l'avantage.
  - Vérifier la condition de fin de match dans `LogicEngine.ts` pour le mode Score
  - Fichiers suspects : `mobile/src/core/LogicEngine.ts`, `mobile/src/hooks/game/useActionDispatcher.ts`
  - **Estimation** : ~0,5 jour

- [x] **[R3-B4]** ~~Décompte cochons désynchronisé + passage de grade silencieux + récompense non reçue~~ — **Livré 29/04/2026** : compteur mis à jour en temps réel après chaque match, fenêtre de félicitations affichée au passage de grade.
  - Stats affichent 93 mais ligue bloquée à 89 → race condition ou source de vérité incorrecte (voir bug similaire [2.2.1])
  - Pas de message de félicitation → `RewardEngine.ts` ne déclenche pas la notification de grade
  - Pas de récompense → vérifier `processMatchReward` Cloud Function
  - Fichiers : `mobile/src/core/RewardEngine.ts`, `functions/src/processMatchReward.ts`
  - **Estimation** : ~0,5 jour

- [x] **[R3-B5]** ~~Ligue : texte "89 / 90" superposé sur la jauge de progression~~ — **Livré 29/04/2026** : espacement corrigé, grade/compteur/barre disposent chacun de leur espace dédié.
  - Bug d'affichage dans `LeagueProgressWidget.tsx`
  - **Estimation** : ~1 heure

- [x] **[R3-B6]** ~~Boutique : affichage dominos incorrect + superposition coins/diamants dans les prix~~ — **Livré 29/04/2026** : dominos affichés en grand (mode paysage), prix coins/diamants listés séparément.
  - Vérifier le layout des cards dans la page boutique mobile
  - **Estimation** : ~0,5 jour

### 🟠 P1 — Bugs importants (1ère semaine post-lancement)

- [x] **[R3-B2]** ~~Onglet DETAILS non fonctionnel après une partie~~ — **Livré 29/04/2026** : historique et scores s'affichent correctement quel que soit l'objectif ou la durée du match.
  - Identifier le composant Détails dans `UnifiedResultOverlay.tsx` ou `GameOverScreen`
  - **Estimation** : ~0,5 jour

- [x] **[R3-B3]** ~~Égalité : les points des joueurs à égalité ne s'affichent pas~~ — **Livré 29/04/2026** : en cas d'égalité parfaite en main (Boudé), les scores de chaque joueur s'affichent correctement dans la fenêtre de résultat.
  - Vérifier `RoundResultCard.tsx` pour le cas d'égalité
  - **Estimation** : ~0,5 jour

- [x] **[R3-B7]** ~~Mode paysage multijoueur : impossible de changer de sens~~ — **N/A** : le jeu est verrouillé en paysage par conception, comportement voulu.

- [x] **[R3-B8]** ~~Fond d'écran violet : lignes noires du quadrillage visibles~~ — **Livré 29/04/2026** : fond uni et propre sur tous les écrans clés (Accueil, Menu Solo, Lobby).
  - Remplacer ou masquer le fond via CSS/style dans l'écran d'accueil
  - **Estimation** : ~1 heure

- [x] **[R3-M4]** ~~Aide Mode Cochon incorrecte~~ — **Livré 29/04/2026** : texte corrigé (arrêt au quota défini), barème clarifié (Donner 1 cochon = +1 pt, Double Cochon = +2 pts, Recevoir = -1 pt).
  - Corriger le texte dans le `HelpOverlay` pour le mode Cochon : expliquer qu'il faut gagner 3 parties avec un joueur à 0 étoile
  - **Estimation** : ~30 min

- [ ] **[R3-B9]** 🐛 Cadeau quotidien — coins non crédités + animation manquante
  - **Bug 1** : Le modal de cadeau quotidien s'affiche souvent au lancement mais les coins ne sont pas crédités au compte du joueur
  - **Bug 2** : Ajouter une animation d'incrémentation du compteur de coins lors du clic sur "Réclamer" (le chiffre monte progressivement)
  - Fichiers suspects : logique daily reward dans `economy.service.ts`, `DailyRewardModal.tsx` (ou équivalent)
  - **✅ Livré 30/04/2026** : race condition corrigée (`claimDailyRewardNow` + `mergeEconomies` dans listener), animation compteur ajoutée

- [x] **[R3-B10]** ✅ Livré 30/04/2026 — 🐛 Ligue des Cochons — désynchronisation `cochonsGiven` entre les écrans
  - **Symptôme** : Un joueur Apprenti 2 avec 20 cochons dans `/profile` et `/stats` affiche 0 cochons dans `/ligue-cochons` et `/leaderboard`
  - **Cause identifiée** : Deux sources de vérité différentes
    - `/profile` et `/stats` lisent `stats.totalCochonsInflicted` (Firestore `stats`) ✅ correct
    - `/ligue-cochons` et `/leaderboard` lisent `economy.cochonsGiven` (Firestore `economy`) ❌ jamais mis à jour
  - **Mécanisme du bug** : `syncFromFirebase()` dans `economy.service.ts` L.104-106 contient une migration qui copie `stats.totalCochonsInflicted` → cache local (AsyncStorage) mais **ne pousse JAMAIS cette correction vers Firestore `economy.cochonsGiven`**
  - **Fix appliqué** : `syncFromFirebase()` détecte maintenant l'écart et repousse la correction vers Firestore via `pushToFirebase()` — la prochaine synchronisation du joueur corrigera automatiquement le désalignement.
  - Fichiers : `economy.service.ts` (méthode `syncFromFirebase` L.86-126)

- [ ] **[TECH-DEBT-COCHONS]** 🔴 **BLOQUANT LANCEMENT** — Architecture : clarifier la source de vérité de `cochonsGiven`
  - **Problème** : Actuellement, le comptage des cochons est éclaté entre deux domaines :
    - `stats.totalCochonsInflicted` (Firestore `stats`) → source de vérité "vraie"
    - `economy.cochonsGiven` (Firestore `economy`) → cache local (AsyncStorage) resynchronisé au login
  - **Risque** : Cette dualité a causé [R3-B10]. À chaque fois qu'on ajoute une nouvelle stat (leaderboard mensuel, catégories, etc.), on duplique le problème.
  - **À décider avant la production** :
    1. **Option A (rapide)** : Garder AsyncStorage mais garantir une synchro bidirectionnelle stricte (`economy.cochonsGiven` ↔ Firestore) — documenter le pattern dans `ARCHITECTURE.md`
    2. **Option B (propre)** : Supprimer AsyncStorage pour `cochonsGiven`, lire directement via listener Firestore (une seule source de vérité) — refactor `economy.service.ts`
  - **Estimation** : A = ~2h doc + tests / B = ~4h refactor + tests
  - **Débloquant** : Décision du product owner avant lancement
  - Fichiers : `mobile/src/core/services/economy.service.ts`, `mobile/src/core/services/stats.service.ts`, `mobile/app/home.tsx` (listener)

### 🟡 P2 — Améliorations fonctionnelles (2–4 semaines post-lancement)

- [x] **[R3-M2]** ~~Indicateur de niveau (grade Ligue des Cochons) des adversaires visible en jeu~~ — **Livré 30/04/2026** : badge grade + bordure colorée en lobby, plateau de jeu et modal résultat. Fallback "Débutant" pour les joueurs sans cochons.

- [ ] **[R3-M1]** Classement mensuel restructuré (onglets TOTAL + MENSUEL par ligue)
  - Écran Rank actuel → devient onglet **"TOTAL"** (classement global inchangé)
  - Nouvel onglet **"MENSUEL"** → sous-onglets par catégorie de ligue : Débutant / Apprenti 1-2-3 / Maître 1-2-3 / Roi / Légende
  - Chaque sous-onglet = classement des joueurs de ce niveau sur le mois en cours
  - Tracking mensuel Firestore : `monthlyStats/{YYYY-MM}/players/{uid}`
  - **Estimation** : ~2 jours

- [ ] **[R3-M3]** Boutique — onglet PUB + mots de tchat achetables
  - **Feature 1** : L'admin peut sélectionner une de ses pubs existantes à afficher dans l'onglet Boutique (choix dans l'interface admin)
  - **Feature 2** : Des **mots / phrases de tchat achetables** par les joueurs avec leurs coins
    - Contenu initial : "I Fèw Mal Doudou", "Tu n'as pas plus dur" + 100 coins (illimité)
    - Logique : achat définitif → mot déverrouillé dans le tchat en jeu
  - **Estimation** : ~2 jours

- [ ] **[R3-A5]** Musique — contrôle avancé par écran (admin)
  - L'admin garde son interface existante de gestion des musiques
  - Ajouter **plus de slots** avec des labels clairs : Splash/Accueil, Menus hors-match, Lobby d'attente, En match, Fin de match
  - L'admin assigne une musique à chaque slot depuis son interface
  - Le code lit chaque slot et joue la bonne musique selon l'écran actif
  - **Estimation** : ~1,5 jour

### 🔵 P3 — UX & Design (post-lancement, à planifier)

- [x] **[R3-A1]** ~~Remplacer le logo MDC bleu par le logo cochon dans la sidebar/header~~ — **Livré 29/04/2026**. Étape 2 : remplacer par le **PNG officiel du logo** (sans texte) fourni par le client — à faire dès réception du fichier.
  - **Estimation** : ~30 min

- [ ] **[R3-A2]** Stats 5/4/2/1/-1 dans la section Ligue (onglet Infos du modal LeagueInfoModal)
  - Ajouter un tableau récapitulatif des points par type de victoire dans `LeagueInfoModal.tsx`
  - Déjà demandé en [D6] — consolider
  - **Estimation** : ~1 heure

- [ ] **[R3-A3]** Taux de victoire dans Statistiques : clarifier le calcul affiché
  - Ajouter une info-bulle ou reformuler le label pour expliquer le calcul
  - **Estimation** : ~30 min

- [ ] **[R3-A6]** Diversité des avatars (déjà backlog [A11])
  - Ajouter au moins 1 avatar blanc et 1 avatar asiatique
  - **Estimation** : selon création des assets

- [ ] **[R3-A4]** Vestiaire : refonte affichage (déjà backlog [D4])
  - **Estimation** : ~1 jour

---

## 🍎 Post-lancement iOS

- [ ] **[R2-T1-IOS]** Finaliser Universal Links iOS avant soumission App Store
  - Mettre à jour `apple-app-site-association` avec le Team ID du compte de prod (remplacer `5LKJF84FN2`)
- [ ] **[AUTH-GOOGLE-ENABLE]** Réactiver Google Sign-In au passage en test interne Google Play
  - **Déclencheur** : premier EAS build Android soumis en test interne Google Play
  - **Étape 1** — `mobile/app/login.tsx` ligne ~24 : passer `GOOGLE_SIGNIN_ENABLED = true`
  - **Étape 2** — Vérifier que le SHA1 du keystore EAS de production est bien enregistré dans Google Cloud Console → Credentials → Android Client ID (`916243245615-m3biip70ga7nlgm1mf8kqaa4tggl7g3g`) — le SHA1 debug utilisé actuellement (`C2:5A:C8:55:...`) sera différent du SHA1 de prod EAS
  - **Étape 3** — Si SHA1 EAS différent : ajouter le nouveau SHA1 dans le même Android Client ID (Google autorise plusieurs empreintes)
  - **Étape 4** — Tester le flow complet : bouton Google → popup → retour sur `/home` + profil visible dans Firebase Auth
  - **Récupérer le SHA1 EAS prod** : `eas credentials --platform android` après le premier build
  - **Estimation** : ~30 min

- [ ] **[AUTH-GOOGLE-NATIVE]** Google Sign-In natif pour build EAS production
  - Créer un **Android Client ID** dans Google Cloud Console (type "Application Android")
  - Renseigner le package `com.dominomartinique.mobile` + SHA1 fingerprint du keystore EAS
  - Créer un **iOS Client ID** (type "Application iOS") avec le bundle identifier
  - Passer `androidClientId` et `iosClientId` dans `Google.useAuthRequest()` dans `login.tsx`
  - **Débloquant** : keystore EAS signé (disponible après premier `eas build`)
- [ ] **[AUTH-APPLE]** Sign In with Apple (iOS uniquement)
  - Requis par Apple si l'app propose d'autres connexions sociales (règle App Store)
  - Activer dans Firebase Auth + configurer dans `app.json` + implémenter le flow `expo-apple-authentication`
  - **Débloquant** : build TestFlight + compte Apple Developer de prod
  - Rebuilder l'app Expo (`eas build --platform ios`) pour que `associatedDomains` soit pris en compte
  - Tester sur TestFlight : lien WhatsApp cliquable → ouvre directement la table
  - **Débloquant** : avoir le compte Apple Developer de production

---

## 🛍️ Admin — Améliorations Dashboard /store (ajoutées le 25/04/2026)

### [ADMIN-STORE-1] Preview live des skins dans le modal admin
- **Contexte** : le modal de création/modification d'un skin (`type: SKIN`) dispose déjà de color pickers pour les 5 couleurs (`tableBackgroundColor`, `boardColor`, `dominoBackgroundColor`, `dominoDotColor`, `dominoLineColor`). Il n'y a actuellement qu'une bande de couleurs statiques — pas de rendu réel.
- **Ce qu'il faut faire :**
  - Ajouter un mini-composant de preview dans le modal (React/HTML pur, pas React Native)
  - Renderer : 2 dominos SVG ou div stylisés reflétant en temps réel `skinConfig` dès que l'admin modifie une couleur
  - Afficher aussi la couleur de fond de table autour des dominos
  - La preview se met à jour à chaque changement de couleur sans validation
- **Fichiers concernés :** `admin/app/dashboard/store/page.tsx`
- **Estimation :** ~0,5 jour

---

### [ADMIN-CHAT-1] Gestion des phrases de tchat + emojis depuis l'admin
- **Contexte** : phrases et emojis sont hardcodés dans `mobile/src/components/QuickChat.tsx` (`QUICK_MESSAGES` + `QUICK_EMOJIS`). Le mobile supporte déjà un onglet "Premium" (placeholder).
- **Ce qu'il faut faire :**

  **Admin — onglet "Tchat" dans `/dashboard/store` :**
  - Nouvel onglet "Tchat 💬" à côté des onglets existants (AVATAR / SKIN / etc.)
  - Deux sous-sections : **Messages** et **Emojis**
  - **Messages** : CRUD complet
    - Champs : `text` (texte créole), `category` (`phrase` | `emoji`), `costType` (`free` | `coins` | `diamonds`), `costAmount` (number, 0 si gratuit), `enabled` (toggle on/off)
    - Aperçu de la bulle de tchat telle qu'elle apparaîtra en jeu
  - **Emojis** : CRUD complet
    - Champs : `emoji` (caractère unicode ou URL image), `costType`, `costAmount`, `enabled`
    - Picker emoji intégré (ou saisie manuelle du caractère unicode)
  - Ordre d'affichage : champ `order` (drag & drop ou numérique)

  **Firestore :**
  - Collection `chat_messages/{id}` — champs : `text`, `icon`, `category`, `costType`, `costAmount`, `order`, `enabled`
  - Règles : lecture publique (authentifiée), écriture admin uniquement

  **Mobile (`QuickChat.tsx`) :**
  - Remplacer `QUICK_MESSAGES` et `QUICK_EMOJIS` hardcodés par un fetch Firestore au démarrage (avec fallback sur les valeurs actuelles si hors ligne)
  - Les messages/emojis `costType: 'free'` sont affichés librement
  - Les payants apparaissent avec un badge prix + vérification du solde avant envoi
  - Les items `enabled: false` sont masqués

- **Fichiers concernés :**
  - `admin/app/dashboard/store/page.tsx` (nouvel onglet)
  - `admin/app/api/store/route.ts` (ou nouvelle route `/api/chat-messages`)
  - `mobile/src/components/QuickChat.tsx`
  - `firestore.rules`
- **Estimation :** ~1 jour (admin CRUD + onglet) + ~0,5 jour (mobile dynamic fetch)

---

### [ADMIN-STORE-2] Gestion des avatars — upload image + preview
- **Contexte** : les avatars sont des assets locaux définis dans `mobile/src/core/avatars.ts`. Le mobile supporte déjà les URLs Firebase Storage (whitelist dans `getAvatarImage()`). Le pattern d'upload Firebase Storage (resize + WebP) existe dans `admin/app/dashboard/bots/page.tsx`.
- **Ce qu'il faut faire :**

  **Admin — dans le modal de création/modification d'un item `type: AVATAR` :**
  - Remplacer le champ `assetId` (string) par un **input file** (jpg/png/webp, max 2 Mo)
  - Conversion automatique en WebP + resize à 200×200 px (pattern déjà implémenté dans bots)
  - Upload vers Firebase Storage : chemin `avatars/{itemId}.webp`
  - Stockage de l'URL publique dans `store_catalog/{id}.imageUrl`
  - Afficher une **preview de l'avatar** dans le modal dès la sélection du fichier (avant upload)
  - Afficher l'avatar actuel si modification d'un item existant

  **Affichage dans la liste :**
  - Colonne miniature (32×32) dans le tableau pour les items de type AVATAR

  **Mobile :**
  - `getAvatarImage()` lit déjà `imageUrl` en priorité sur `assetId` — aucun changement nécessaire

- **Fichiers concernés :**
  - `admin/app/dashboard/store/page.tsx`
  - `admin/app/api/store/route.ts`
  - Firebase Storage (bucket existant)
- **Estimation :** ~0,5 jour

---

## 🔔 Notifications Push (FCM)

- [ ] **[NOTIF-1]** Intégration notifications push pilotables depuis l'admin
  - Mobile : intégrer `expo-notifications` + enregistrement token FCM dans `users/{uid}.fcmToken`
  - Cloud Function : endpoint d'envoi FCM (ciblé par uid, ou broadcast)
  - Admin : brancher la page `/dashboard/notifications` existante sur la Cloud Function
  - Types prévus : invitation table, début tournoi, message système admin
  - **Estimation** : ~1 jour

---

## 📊 Post-lancement — À faire quand la base joueurs est suffisante

- [ ] **[R2-M4]** Classement mensuel par catégorie (Bouchers, Défenseurs, Scoreurs)
  - Nécessite un tracking mensuel côté Firestore (`monthlyStats/{YYYY-MM}/players/{uid}`)
  - Nouveaux onglets dans le Leaderboard pour chaque catégorie
  - **Estimation** : ~1 jour — reporter après lancement pour avoir assez de données

---

## 🧪 Dette technique — Tests (TECH-TESTS)

> 8 suites en échec préexistantes, aucun impact sur le jeu en prod. Identifiées le 25/04/2026.

- [ ] **[TECH-TEST-1]** Corriger les assertions `totalCochons` sur les perdants (3 tests)
  - Suites : `ScoringScenarios`, `MultiplayerCochonSync`, `MultiplayerLogic`
  - Cause : tests vérifient `totalCochons` (cochons donnés) sur un perdant → doit être `totalCochonsSubis`
  - **Estimation** : ~30 min

- [ ] **[TECH-TEST-2]** Corriger la config Jest pour les modules ESM Firebase (3 suites)
  - Suites : `useGameTimers`, `useGameEngine`, `IntegrationArchitecture`
  - Cause : `firebase.ts` utilise `import` ESM incompatible avec Jest CommonJS
  - Fix : ajouter `firebase` dans `transformIgnorePatterns` dans `jest.config.js`
  - **Estimation** : ~1h

- [ ] **[TECH-TEST-3]** Restaurer les `testID` manquants dans les composants UI refactorisés (2 suites)
  - Suites : `GameHeader`, `GameOverlays`
  - Cause : refonte `GameHeader` + `GameOptionsMenu` (sprint lancement) a supprimé les testIDs
  - Fix : rajouter `testID="btn-pause"`, `testID="btn-quit"`, etc. sur les éléments concernés
  - **Estimation** : ~1h

---

## 🔍 Bugs à investiguer (signalements douteux)

- [ ] **[B-TEST-COCHON]** *(inclus dans TECH-TEST-1 ci-dessus)*

- [ ] **[B-BOUDE-1]** Partie bloquée solo : gagnant potentiellement incorrect — signalement du 22/04/2026 où le joueur avait `[3|0]`=3 pts, un bot `[2|3]`=5 pts, et le bot aurait gagné. Investigation préliminaire : logique `determineWinnerOnBoudé` correcte (minimum), troisième joueur non mentionné (probable cause : le 3e bot avait < 3 pts). À confirmer en notant les 3 mains + scores affichés sur la carte résultat lors de la prochaine occurrence.

---

## 🧠 Bot MÈTKAYALI (Niveau 4 IA)

> **Spec complète → `docs/specs/BOT_METKAYALI.md`**
> 4ᵉ niveau de difficulté IA : comptage parfait, Monte-Carlo, blocage prédictif, adaptation dynamique.
> **Estimation** : 4-6 jours de dev. **Priorité** : post-lancement.

### Couche 1 — TileTracker (comptage des 28 tuiles)
- [ ] `mobile/src/core/ai/TileTracker.ts` — matrice de probabilités + exclusion par passes
- [ ] `mobile/src/core/ai/__tests__/TileTracker.test.ts` — tests unitaires

### Couche 2 — Monte-Carlo (simulation de parties)
- [ ] `mobile/src/core/ai/MonteCarlo.ts` — simulation 500-1000 parties par coup, contraintes TileTracker
- [ ] `mobile/src/core/ai/__tests__/MonteCarlo.test.ts` — tests unitaires + benchmark perf (< 100ms)

### Couche 3 — EndgameAnalyzer (prédiction de Boudé)
- [ ] `mobile/src/core/ai/EndgameAnalyzer.ts` — calcul risque de Boudé + bascule stratégie Score/Contrôle

### Couche 4 — OpponentModeler (profiling adversaire)
- [ ] `mobile/src/core/ai/OpponentModeler.ts` — profil temps réel, mode alerte CRITICAL (1-2 tuiles)

### Moteur principal + intégration
- [ ] `mobile/src/core/MeytKayaliEngine.ts` — orchestration des 4 couches + `getMeytKayaliMove()`
- [ ] `mobile/src/core/__tests__/MeytKayaliEngine.test.ts` — tests complets + benchmark vs GRAN_MOUN (> 60% victoires sur 100 parties)
- [ ] `mobile/src/core/types.ts` — ajouter `'METKAYALI'` au type `BotDifficulty`
- [ ] `mobile/src/core/DominoEngine.ts` — ajouter le cas `'METKAYALI'` dans `getBotMove()`
- [ ] `mobile/src/core/BotEngine.ts` — passer le `gameState` complet pour MÈTKAYALI
- [ ] `mobile/src/core/LogicEngine.ts` — ajouter bots MÈTKAYALI dans `dealGameSolo()`
- [ ] `mobile/src/core/services/bot.service.ts` — pool METKAYALI dans `LOCAL_BOTS_FALLBACK`

### UI + accès
- [ ] `mobile/app/solo.tsx` — ajouter le 4ᵉ choix de difficulté
- [ ] Verrouillage : débloqué au grade "Roi du Boudin" ou achat boutique (à décider)

---

## 🟠 Bloc 11 — Tournois

### Admin Dashboard (Next.js)
- [ ] Interface de création de tournoi
  - [ ] Champ : format (Manches / Points)
  - [ ] Champ : nombre de joueurs cible
  - [ ] Champ : buy-in (Coins)
  - [ ] Champ : dates début/fin
- [ ] Liste des tournois actifs avec statut

### Mobile
- [ ] Écran inscription tournoi
- [ ] Lobby tournoi — salle d'attente avant le début
- [ ] Génération des brackets — élimination directe (3 joueurs/match)
- [ ] Automation — fin de partie → mise à jour arbre → lancement match suivant

### Backend / Cloud Functions
- [ ] Structure Firestore `tournaments/{id}`
- [ ] Règles Firestore pour les tournois
- [ ] Mise à jour `processMatchReward` pour le contexte tournoi

---

## 🔵 Bloc 12 — Sentry monitoring

- [ ] Créer projet Sentry (mobile + web)
- [ ] Intégrer SDK Sentry dans l'app Expo
- [ ] Intégrer SDK Sentry dans le Dashboard Admin (Next.js)
- [ ] Configurer les alertes (crash rate, nouvelles erreurs)
- [ ] Tester en staging avant prod

---

## 🔴 Bloc 10 — Gestion des comptes

- [ ] OTP Email — code à l'inscription
- [ ] Reset mot de passe via OTP — remplacer le lien Firebase par un code 6 chiffres + saisie nouveau MDP (Cloud Function + SendGrid/nodemailer + Firestore expiry)
- [ ] **[ACCOUNT-DELETE]** Suppression de compte (exigence Google Play depuis 2024)
  - **Mobile** : bouton "Supprimer mon compte" dans Réglages → onglet Compte, avec modal de confirmation 2 étapes (saisir le pseudo pour valider)
  - **Cloud Function** `deleteUserAccount` : supprime le doc `users/{uid}`, purge `stats/{uid}`, `economy/{uid}`, désabonne des tournois actifs, puis `auth.deleteUser()`
  - **Firestore rules** : autoriser la demande de suppression uniquement pour `request.auth.uid == uid`
  - **Délai de grâce** : marquage `deletedAt` avec purge définitive à +30 j (option réversible via support), ou suppression immédiate — à trancher
  - **Admin** : page Players → filtre "pending deletion" pour audit
  - **Doc Google Play** : renseigner l'URL de la page "Supprimer mon compte" dans la fiche Play Console (bloquant sinon rejet lors de la MAJ)
  - **Estimation** : ~1,5 jour (mobile UI + CF + tests)

---

## 🟡 Bloc 8 — Animations domino (reporté post-lancement)

- [ ] **[R2-A1]** Animation "glissé" — domino qui glisse vers le plateau lorsqu'il est joué *(reporté depuis sprint lancement le 25/04/2026)*
- [ ] Animation "distribution" — distribution en début de manche

---

## ⚫ Bloc 13 — Paiements

- [ ] Choix du gateway (Stripe / Google Pay / autre)
- [ ] Système d'achat de Coins et de Diamonds
- [ ] Checkout workflow achat + paiement en 1 clic

---

## 📺 AdMob Phase 2 (post-lancement)

> Monétisation automatique via Google AdMob (impressions/clics). Complément à R2-M7 Phase 1 déjà livrée.

- [ ] Créer compte AdMob + obtenir les App IDs Android/iOS
- [ ] Intégrer SDK `react-native-google-mobile-ads` (ou `expo-ads-admob` si compatible SDK 51+)
- [ ] Interstitiel au lancement (fréquence : 1 fois toutes les N sessions, configurable)
- [ ] Bannière en bas de l'écran d'accueil (optionnel)
- [ ] Désactivé pour les joueurs VIP Pass (prévu Bloc 13)
- [ ] Tester en mode test AdMob avant soumission store

---

## 📬 Backlog Feedback Client (source → `FEEDBACK_CLIENT.md`)

> Retours Manuel volontairement déprioritisés pour ne pas retarder le lancement.

### Manques fonctionnels
- [ ] **M1** — Jauge cochons du mois (popup ouverture + objectif)
- [ ] **M2** — Explication paliers Ligue des Cochons
- [ ] **M3** — Onglet Actualités admin + app (flyers/pubs en popup)

### Améliorations UX
- [ ] **A5** — Dominos qui se superposent avec les avatars (table pleine)
- [ ] **A6** — Récompenses en popup style "cadeau du jour"
- [ ] **A7** — Navigation : onglets sur le côté *(partiellement couvert par R2-A3 Sidebar, à revoir)*
- [ ] **A8** — Mode multijoueur paysage : interface à revoir
- [ ] **A10** — Indicateur joueur actif pendant animation (inspiration Zimad)
- [ ] **A11** — Diversité avatars : ajouter blanc + asiatique
- [ ] **A12** — Photo de profil (upload ou import Google)
- [ ] **A13** — Musique : corriger superposition + 3 musiques en jeu
- [ ] **A14** — Économie révisée (100 coins buy-in, 250 vainqueur, pub = récupération)
- [ ] **A15** — Système de feedback users dans l'appli *(partiellement couvert par MdcFeedbackModal, à étendre si besoin)*

### Boutique
- [ ] **Shop1** — Dominos blancs
- [ ] **Shop2** — Dominos avec points colorés
- [ ] **Shop3** — Phrases créoles en tchat (10–20 coins/utilisation)
- [ ] **Shop4** — Fonds de table supplémentaires
- [ ] **Shop5** — Mode Légende : bots achetables
- [ ] **Shop6** — Pass VIP (pas de pub, 5€/mois)
- [ ] **Shop7** — Alimentation boutique par l'admin sans code

### Design
- [ ] **D1** — Accueil : 3 modes de jeu en cards visuelles
- [ ] **D2** — Ligue : révision seuils → 500 / 1 000 / 2 000 / 5 000 cochons
- [ ] **D3** — Boutique : nouvelle UI
- [ ] **D4** — Vestiaire : section cosmétiques dédiée
- [ ] **D5** — Classement mensuel : 3 classements (Boucher / Défenseur / Scoreur) *(couvert partiellement par R2-M4 dans TASKS.md)*
- [ ] **D6** — Stats : détail des manches (5pts / 4pts / 2pts / 1pt / -1pt)
- [ ] **D7** — Paramètres : revoir le design
