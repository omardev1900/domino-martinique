# 📋 TASKS_TODO — Backlog & Blocs à planifier

> **Rôle** : backlog de toutes les tâches connues mais **non encore planifiées** pour un sprint.
> Dès qu'une tâche est décidée pour exécution → **la déplacer vers `TASKS.md`**.
>
> **Flux** : **`TASKS_TODO.md`** → `TASKS.md` → `TASKS_DONE.md`
>
> Contient : blocs roadmap (10, 11, 12, 13), Bot MÈTKAYALI, backlog client (feedback Manuel déprioritisé), bugs à investiguer.

---

## 🚨 Retour client #3 — 25 avril 2026 (Sprint correctif post-lancement)

> Source : `docs/feedback/feedback-250426.md` + archivé dans `docs/feedback/CLIENT.md`
> Classé par priorité. Les bugs P0 doivent être traités avant ou immédiatement après le lancement.

### 🔴 P0 — Bugs bloquants (à corriger en urgence)

- [ ] **[R3-B1]** Mode Score : la partie ne se termine pas quand l'objectif est atteint — une nouvelle manche se lance
  - Vérifier la condition de fin de match dans `LogicEngine.ts` pour le mode Score
  - Fichiers suspects : `mobile/src/core/LogicEngine.ts`, `mobile/src/hooks/game/useActionDispatcher.ts`
  - **Estimation** : ~0,5 jour

- [ ] **[R3-B4]** Décompte cochons désynchronisé + passage de grade silencieux + récompense non reçue
  - Stats affichent 93 mais ligue bloquée à 89 → race condition ou source de vérité incorrecte (voir bug similaire [2.2.1])
  - Pas de message de félicitation → `RewardEngine.ts` ne déclenche pas la notification de grade
  - Pas de récompense → vérifier `processMatchReward` Cloud Function
  - Fichiers : `mobile/src/core/RewardEngine.ts`, `functions/src/processMatchReward.ts`
  - **Estimation** : ~0,5 jour

- [ ] **[R3-B5]** Ligue : texte "89 / 90" superposé sur la jauge de progression
  - Bug d'affichage dans `LeagueProgressWidget.tsx`
  - **Estimation** : ~1 heure

- [ ] **[R3-B6]** Boutique : affichage dominos incorrect + superposition coins/diamants dans les prix
  - Vérifier le layout des cards dans la page boutique mobile
  - **Estimation** : ~0,5 jour

### 🟠 P1 — Bugs importants (1ère semaine post-lancement)

- [ ] **[R3-B2]** Onglet DETAILS non fonctionnel après une partie
  - Identifier le composant Détails dans `UnifiedResultOverlay.tsx` ou `GameOverScreen`
  - **Estimation** : ~0,5 jour

- [ ] **[R3-B3]** Égalité : les points des joueurs à égalité ne s'affichent pas
  - Vérifier `RoundResultCard.tsx` pour le cas d'égalité
  - **Estimation** : ~0,5 jour

- [ ] **[R3-B7]** Mode paysage multijoueur : impossible de changer de sens (déjà backlog R2-B6 partiel)
  - **Estimation** : ~0,5 jour

- [ ] **[R3-B8]** Fond d'écran violet : lignes noires du quadrillage visibles
  - Remplacer ou masquer le fond via CSS/style dans l'écran d'accueil
  - **Estimation** : ~1 heure

- [ ] **[R3-M4]** Aide Mode Cochon incorrecte : le texte dit "le mode s'arrête quand l'objectif est atteint" → faux
  - Corriger le texte dans le `HelpOverlay` pour le mode Cochon : expliquer qu'il faut gagner 3 parties avec un joueur à 0 étoile
  - **Estimation** : ~30 min

### 🟡 P2 — Améliorations fonctionnelles (2–4 semaines post-lancement)

- [ ] **[R3-M1]** Classement mensuel — 3 catégories avec niveaux colorés
  - 3 classements : **Scoreurs** (totalMatchPoints), **Bouchers** (cochons donnés), **Défenseurs** (cochons reçus les moins nombreux)
  - Couleurs par niveau dans le classement : Apprenti (vert), Maître (or), Élite (rouge/feu)
  - Tracking mensuel Firestore : `monthlyStats/{YYYY-MM}/players/{uid}`
  - Visible dès le lancement du jeu (priorité client : "des amis doivent pouvoir voir dès le lancement")
  - Remplace/complète [R2-M4] déjà au backlog
  - **Estimation** : ~2 jours

- [ ] **[R3-M2]** Indicateur de niveau (grade Ligue des Cochons) des adversaires visible en jeu
  - Afficher le cadre de grade ou une icône de niveau sous/sur l'avatar des adversaires dans `GameScreen`
  - Fichiers : `GameScreen.tsx`, `PlayerAvatar.tsx`
  - **Estimation** : ~0,5 jour

- [ ] **[R3-M3]** Boutique — onglet "PUB" / contenu déblocable via pub
  - Principe : contenu débloqué 24h en regardant une pub OU 5€/mois
  - Contenu initial : 2 phrases créoles ("I Fèw Mal Doudou", "Tu n'as pas plus dur") + 100 coins (illimité)
  - Mobile : nouvel onglet dans la boutique + logique "regarder une pub → déblocage 24h"
  - Dépend de AdMob Phase 2 pour les vraies pubs — en attendant, placeholder ou pub admin-managed
  - **Estimation** : ~1,5 jour

- [ ] **[R3-A5]** Musique — accueil + playlist en jeu
  - Ajouter une musique de fond sur l'écran d'accueil
  - En jeu : rotation d'une playlist à chaque nouvelle manche (au lieu de la même musique en boucle)
  - Fichiers : `home.tsx`, `SoundManager.ts`
  - **Estimation** : ~1 jour (selon le nombre de musiques disponibles)

### 🔵 P3 — UX & Design (post-lancement, à planifier)

- [ ] **[R3-A1]** Remplacer le logo MDC bleu par le logo cochon dans la sidebar/header
  - **Estimation** : ~1 heure

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

## 🔍 Bugs à investiguer (signalements douteux)

- [ ] **[B-TEST-COCHON]** Test `Bug B2` en échec dans `ScoringScenarios.test.ts` — faux positif
  - Le test vérifie `playerB?.totalCochons` sur un **perdant**, mais ce champ (`totalCochons`) ne track que les cochons **donnés** (côté gagnant). Le bon champ pour un perdant est `totalCochonsSubis`.
  - La logique moteur est correcte (MATCH_END se déclenche bien). Seule l'assertion du test est fausse.
  - **Action** : corriger l'assertion → `expect(playerB?.totalCochonsSubis).toBe(1)` ou supprimer la ligne
  - **Priorité** : basse (cosmétique test) — **Estimation** : 5 min

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
