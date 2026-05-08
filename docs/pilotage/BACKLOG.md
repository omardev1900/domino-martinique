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

## 🎯 Priorités avant lancement Play Store (reclassé 06/05/2026)

### 🔴 Priorité 1 — BLOQUANTS LANCEMENT (à livrer avant soumission Play Store)

- [ ] **[R4-B-GRADES]** 🔴 Harmonisation grades Ligue des Cochons (incohérence affichage) — **CRITIQUE**
- [ ] **[R4-UX3]** Partage social — WhatsApp, Instagram, Facebook
- [ ] **[R4-M3]** Tchat — phrases et emojis consommables à l'unité (20-50 coins/envoi)
- [ ] **[R4-B3-SESSION]** Multijoueur — reconnexion après purge complète de session

### 🟠 Priorité 2 — Post-lancement immédiat

- [ ] **[R4-IA1]** Bots adaptés au niveau réel du joueur
- [ ] **[R4-ECO1]** Récompenses différenciées solo vs multi
- [ ] **[R4-M1]** Ligue — reset mensuel du niveau
- [ ] **[R4-TECH-LEADERBOARD]** Agrégats mensuels persistants (refonte stats)
- [ ] **[R4-B4]** Web — bouton plein écran dupliqué

### 🔵 Priorité 3 — Moyen terme

- [ ] **[ADS-REWARD]** Doubler les gains après pub (post-match)
- [ ] **[NOTIF-WEB]** Notifications push Web (PWA — Safari iOS + Chrome Android)
- [ ] **[ANIM-DOMINO]** Animation glissé + distribution dominos
- [ ] **[AUDIO-IOS-FALLBACK]** Fallback WebAudio API pour les SFX sur Safari iOS
  - **Contexte** : `expo-audio` lance `NotSupportedError` au `.play()` sur Safari iOS (mode privé, Low Power Mode, iOS < 14.5). 135+ erreurs Sentry/jour avant fix.
  - **Fix temporaire appliqué (08/05/2026)** : audio désactivé d'office sur Safari iOS dans `SoundManager.isAudioAllowed`. Plus d'erreur, mais plus de SFX non plus.
  - **Décision produit** : on ne bloque PAS Safari iOS (Chrome iOS utilise le même moteur WebKit, donc inutile). On préfère laisser jouer sans son que de perdre 50% des utilisateurs iOS web.
  - **Solution cible** : générer le clack/notify procéduralement via Web Audio API (`AudioContext` + `OscillatorNode`/`BufferSource`) — marche dans tous les navigateurs, y compris Safari iOS.
  - **Périmètre** : a minima `playClack` (le plus utilisé), idéalement aussi `notify`, `win`, `timer`. La BGM peut rester désactivée sur iOS web.
  - **Fichier** : `mobile/src/core/audio/SoundManager.ts` — ajouter une branche `if (isIOSSafari) playWebAudioFallback(name)` + nouveau module `WebAudioFallback.ts`.
  - **Estimation** : ~0,5 jour
  - **Bénéfice secondaire** : les utilisateurs iOS web retrouvent un feedback sonore en attendant l'app native iOS.

**Note** : `[R4-M5-DAILY]` supprimée (fusionnée dans [R4-M5]). `[R4-UX-BOTS]` supprimée (bots premium achetables ne doivent pas exister).

---

## 📋 Détail des tâches Priorité 1

### Priorité 0 — Correctifs critiques web / ligue / multi (retour client 04/05)

- [ ] **[R4-B-GRADES]** 🔴 **HARMONISATION CRITIQUE** — Incohérence affichage des grades de la Ligue des Cochons
  - **Problème** : Les grades s'affichent différemment selon les écrans, créant une confusion utilisateur
  - **Symptômes observés** :
    1. **Avatar joueur en match** : affiche "Débutant" (terme qui n'existe PAS dans la Ligue des Cochons)
    2. **Modal fin de victoire** : affiche "Débutant"
    3. **Partage victoire (réseaux sociaux)** : affiche "Apprenti Boucher" (ancien format)
    4. **Classement Ligue des Cochons** : affiche "Sans Grade"
    5. **Spec officielle** : Ligue définit 8 paliers → Apprenti (1/2/3), Maître (1/2/3), Roi, Légende
  - **Impact** : Rupture de cohérence brand, confusion joueurs sur leur véritable grade, réduction du partage social (image incorrecte)
  - **Source de vérité requise** : Ligue des Cochons uniquement (8 paliers officiels + "Sans Grade" pour aucun cochon)
  - **Fichiers concernés** (à auditer) :
    - Badge avatar en jeu (`mobile/src/components/PlayerAvatar.tsx` ou équivalent)
    - Modal fin victoire (`UnifiedResultOverlay.tsx`, `RoundResultCard.tsx`)
    - Partage victoire (`ShareCard.tsx`, `WinShareCard.tsx`)
    - Écran Classement Ligue (`mobile/app/ligue-cochons.tsx`)
    - Service grade (`league.service.ts` → `getLeagueGrade()`)
    - Constants grades (`mobile/src/core/constants.ts` → `LEAGUE_GRADES` ou `LEAGUE_THRESHOLDS`)
  - **Audit à effectuer** :
    1. Vérifier tous les appels à `getLeagueGrade()` retournent le bon palier (1-8)
    2. Chercher tous les "Débutant" hardcodés dans le code (doivent être remplacés par le grade correct)
    3. Vérifier le format des labels affichés : "Apprenti 1", "Maître Saucissier 2", "Roi du Boudin", "Légende du Grouin"
    4. S'assurer que le fallback pour 0 cochon = "Sans Grade" est systématiquement appliqué
    5. Tester les images de partage pour vérifier que le grade affiché est correct
  - **Règle métier** :
    - Cochons = 0 → "Sans Grade"
    - Cochons 1–19 → "Apprenti 1"
    - Cochons 20–49 → "Apprenti 2"
    - Cochons 50–99 → "Apprenti 3"
    - Cochons 100–199 → "Maître Saucissier 1"
    - Cochons 200–299 → "Maître Saucissier 2"
    - Cochons 300–499 → "Maître Saucissier 3"
    - Cochons 500–∞ → "Roi du Boudin" / "Légende du Grouin" (selon décision)
  - **Définition de "Fait"** :
    - ✅ Tous les écrans affichent le même grade pour un joueur donné
    - ✅ Aucun "Débutant" n'apparaît dans l'app
    - ✅ Images de partage social affichent le vrai grade
    - ✅ Fallback "Sans Grade" en place pour 0 cochon
    - ✅ Tests manuels sur tous les écrans (avatar, fin match, partage, classement)
  - **Estimation** : ~2-3 heures (audit + corrections cohérentes)

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

- [ ] **[R4-M3]** Boutique tchat — rendre phrases et emojis consommables à l'unité + onglet PUB admin
  - **Feature 1** : Phrases et emojis consommables à l'usage (pas à vie)
    - Demande client : ne plus vendre ces items à vie, mais à l'usage/unité
    - Impact technique : passer d'un modèle d'`unlock` permanent à un inventaire consommable avec décrément à chaque envoi
    - À prévoir : compteur restant, prix unitaire, UX d'achat, rétrocompatibilité des items déjà achetés
  - **Feature 2** : Onglet PUB dans la Boutique (admin-managed)
    - L'admin peut sélectionner une de ses pubs existantes à afficher dans l'onglet Boutique
    - Contenu initial : "I Fèw Mal Doudou", "Tu n'as pas plus dur" + 100 coins (exemples)
  - **Estimation** : ~2 jours (fusion [R3-M3] + [R4-M3])

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
  - **Note** : `[R4-M5-DAILY]` fusionné dans cette tâche (doublon supprimé)

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
  - **Objectif** : faire varier la difficulté, le pool ou le profil des bots selon le niveau/grade du joueur (sans paiement)
  - **À cadrer** :
    - source de vérité du niveau joueur à utiliser
    - table de correspondance niveau joueur → difficulté bot
    - exceptions volontaires si le joueur choisit explicitement un niveau facile
  - **Note** : Bots premium achetables (Shop5 / R4-UX-BOTS) ne doivent PAS exister. Les bots adaptés au niveau doivent être gratuits.
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
  - **⚠️ Dépendance** : [R3-M1] (Classement mensuel) dépend techniquement de cette tâche pour disposer des agrégats mensuels persistants

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
  - **Note** : `[R2-A1]` fusionné dans cette tâche (doublon supprimé)

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

### Priorité 5 — Bloc 13 — Paiements (Hiérarchisé)

**Étape 1 — [GOOGLE-PAY]** Paiements Coins/Diamonds via Google Play Billing (Android)
- **Stack** : `expo-in-app-purchases` ou `react-native-iap`
- **SKUs** : 100/500/2500 coins + packs diamant (pré-configurés Google Play Console)
- **Flow** : Boutique → "Acheter 500 coins" → popup Google Play → credited
- **Estimation** : ~2 jours (intégration + tests)
- **Note** : Première implémentation concrète du Bloc 13 (Android)

**Étape 2 — [APPLE-PAYMENT]** Apple In-App Purchase (iOS, post-v3.0)
- À planifier après GOOGLE-PAY
- **Estimation** : ~2 jours (iOS spécific)

**Bloc 13 complet** : Choix gateway global (Stripe optionnel) + système d'achat Coins/Diamonds + checkout

### Priorité 6 — Monitoring (Sentry)
- [x] **[SENTRY]** ~~Crashlytics + erreurs front + alertes~~ — **Livré 06/05/2026** : Sentry React Native intégré, projet `happy-agency / react-native` configuré, captures de crashs automatiques actives.
  - Projet Sentry créé (mobile + admin en cours)
  - SDK Expo + Next.js intégrés
  - Alertes configurées (crash rate, nouvelles exceptions)
  - Dashboard disponible

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

- [x] **[R3-M1]** ~~Classement mensuel restructuré~~ — **Marqée comme terminée (04/05/2026)** : onglets TOTAL + MENSUEL par catégories de ligue implémentés. Voir `[R4-TECH-LEADERBOARD]` pour agrégats mensuels persistants.

- [ ] **[R3-A5]** Musique — contrôle avancé par écran (admin)
  - L'admin garde son interface existante de gestion des musiques
  - Ajouter **plus de slots** avec des labels clairs : Splash/Accueil, Menus hors-match, Lobby d'attente, En match, Fin de match
  - L'admin assigne une musique à chaque slot depuis son interface
  - Le code lit chaque slot et joue la bonne musique selon l'écran actif
  - **Estimation** : ~1,5 jour

### 🔵 P3 — UX & Design (post-lancement, à planifier)

- [x] **[R3-A1]** ~~Remplacer le logo MDC bleu par le logo cochon dans la sidebar/header~~ — **Livré 29/04/2026**. Étape 2 : remplacer par le **PNG officiel du logo** (sans texte) fourni par le client — à faire dès réception du fichier.
  - **Estimation** : ~30 min

- [x] **[R3-A2]** ~~Stats 5/4/2/1/-1 dans la section Ligue~~ — **Livré 01/05/2026** : détail des points par type de victoire affiché dans `LeagueInfoModal`.

- [ ] **[R3-A3]** Taux de victoire dans Statistiques : clarifier le calcul affiché
  - Ajouter une info-bulle ou reformuler le label pour expliquer le calcul
  - **Estimation** : ~30 min

- [x] **[R3-A6]** ~~Diversité des avatars~~ — **Livré 02/05/2026** : 10 nouveaux avatars (`avatar_09` à `avatar_18`) + 8 existants = 18 gratuits. Diversité ethnique couverte (blanc, asiatique, métissé, féminins).

- [x] **[R3-A4]** ~~Vestiaire : refonte affichage~~ — **Marquée comme terminée (04/05/2026)** : section cosmétiques dédiée (avatars, skins, frames, emotes) implémentée. Fusionne [R3-A4] + [D4].

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

## 🛍️ Admin — Améliorations Dashboard (regroupées)

### Admin Store — 3 tâches

**[ADMIN-STORE-1]** Preview live des skins
- **Contexte** : le modal de création/modification d'un skin (`type: SKIN`) dispose déjà de color pickers pour les 5 couleurs. Pas de rendu réel actuellement.
- **À faire** : Ajouter mini-composant preview (React/HTML pur) avec 2 dominos SVG reflétant `skinConfig` en temps réel
- **Fichiers** : `admin/app/dashboard/store/page.tsx`
- **Estimation** : ~0,5 jour

**[ADMIN-STORE-2]** Upload avatar + preview
- **Contexte** : avatars sont des assets locaux. Mobile supporte déjà Firebase Storage (whitelist dans `getAvatarImage()`).
- **À faire** :
  - Input file (jpg/png/webp, max 2 Mo) → conversion WebP 200×200 px
  - Upload Firebase Storage `avatars/{itemId}.webp`
  - Preview de l'avatar dans le modal dès la sélection
  - Miniature (32×32) dans le tableau pour les avatars
- **Fichiers** : `admin/app/dashboard/store/page.tsx`, `admin/app/api/store/route.ts`
- **Estimation** : ~0,5 jour

**[ADMIN-STORE-CHAT]** Gestion phrases de tchat + emojis
- **Contexte** : phrases et emojis hardcodés dans `mobile/src/components/QuickChat.tsx`
- **À faire** :
  - Admin : nouvel onglet "Tchat 💬" dans `/dashboard/store` avec CRUD messages + emojis
  - Champs : `text`, `emoji`, `costType`, `costAmount`, `enabled`, `order`
  - Aperçu bulle tchat en temps réel
  - Mobile : fetch Firestore au démarrage + fallback hardcodé
  - Firestore rules : lecture authentifiée, écriture admin
- **Fichiers** : `admin/app/dashboard/store/page.tsx`, `mobile/src/components/QuickChat.tsx`, `firestore.rules`
- **Estimation** : ~1,5 jours (admin CRUD + mobile fetch)

---

## 🔔 Notifications Push (FCM)

- [ ] **[NOTIF-1]** Intégration notifications push Android natif pilotables depuis l'admin
  - Mobile : intégrer `expo-notifications` + enregistrement token FCM dans `users/{uid}.fcmToken`
  - Cloud Function : endpoint d'envoi FCM (ciblé par uid, ou broadcast)
  - Admin : brancher la page `/dashboard/notifications` existante sur la Cloud Function
  - Types prévus : invitation table, début tournoi, message système admin, relance quotidienne
  - **Estimation** : ~1 jour

- [ ] **[NOTIF-WEB]** Notifications push Web (PWA) — Android browser + iPhone Safari 16.4+
  - Stack séparée de NOTIF-1 : Firebase Web SDK (`messaging()`) + service worker
  - Demande permission au premier lancement web
  - Token FCM web enregistré dans `users/{uid}.fcmTokenWeb`
  - Admin : même page `/dashboard/notifications`, envoie aux deux types de tokens
  - **Pré-requis** : NOTIF-1 terminé
  - **Estimation** : ~1 jour

---

## 📊 Post-lancement — À faire quand la base joueurs est suffisante

- [x] **[R2-M4]** ~~Classement mensuel par catégorie~~ — **Fusionné dans [R3-M1]** et marqué comme terminé. Voir [R3-M1] pour implémentation classement mensuel.

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

## 📺 Bloc 13 — Monétisation AdMob Phase 2

> Monétisation automatique via Google AdMob (impressions/clics). Complément à R2-M7 Phase 1 déjà livrée.

- [ ] **[ADMOB-PHASE2]** Intégration AdMob complète (ticket unique)
  - [ ] Créer compte AdMob + obtenir App IDs Android/iOS
  - [ ] Intégrer SDK `react-native-google-mobile-ads` (ou `expo-ads-admob`)
  - [ ] Interstitiel au lancement (configurable, 1 fois toutes les N sessions)
  - [ ] Bannière en bas accueil (optionnel)
  - [ ] Désactiver pour joueurs VIP Pass (lien Bloc 13 Paiements)
  - [ ] Tester en mode test AdMob avant soumission store
  - **Estimation** : ~1-1,5 jour (intégration + config + tests)

---

## 📬 Backlog Feedback Client (source → `FEEDBACK_CLIENT.md`)

> Retours Manuel volontairement déprioritisés pour ne pas retarder le lancement.
> **Tâches supprimées (réalisées ou remplacées)** : M1, M2, M3, A5, A6, A7, A8, A10, A15, Shop1, Shop2, Shop4, Shop7, D1, D2, D3, D5, D6, D7.

### Améliorations UX — Restantes

- [ ] **A12** — Photo de profil (upload ou import Google)
  - Permettre aux joueurs d'uploader une photo personnalisée ou d'importer depuis Google
  - **Note** : Utiliser uniquement si Google Sign-In ([ACCOUNT-GOOGLE]) est adopté ; sinon, priorité basse
  - **Estimation** : ~1-2 j (dépend de ACCOUNT-GOOGLE)


- [ ] **A14** — Économie révisée (100 coins buy-in, 250 vainqueur, pub = récupération)
  - Rebalancer les gains pour aligner avec le feedback client
  - **Estimation** : ~0,5-1 j (décision produit + implémentation)

### Boutique — Restantes

- [ ] **Shop3** — Phrases créoles en tchat (10–20 coins/utilisation)
  - **Note** : couvert partiellement par [R4-M3] (tchat dynamique consommable à l'unité)
  - Intégrer avec le système admin de gestion du tchat
  - **Estimation** : ~0,5-1 j (après R4-M3)

- [ ] **Shop6** — Pass VIP (pas de pub, 5€/mois)
  - Abonnement mensuel reconductible : suppression des pubs, bonus économie
  - **Estimation** : ~2-3 j (paiement + logique)

### Design — Restantes

*(Aucune tâche restante — D4 fusionnée dans [R3-A4] et marquée comme terminée)*
