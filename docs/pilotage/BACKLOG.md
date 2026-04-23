# 📋 TASKS_TODO — Backlog & Blocs à planifier

> **Rôle** : backlog de toutes les tâches connues mais **non encore planifiées** pour un sprint.
> Dès qu'une tâche est décidée pour exécution → **la déplacer vers `TASKS.md`**.
>
> **Flux** : **`TASKS_TODO.md`** → `TASKS.md` → `TASKS_DONE.md`
>
> Contient : blocs roadmap (10, 11, 12, 13), Bot MÈTKAYALI, backlog client (feedback Manuel déprioritisé), bugs à investiguer.

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
- [ ] Reset mot de passe — flow "Mot de passe oublié"
- [ ] Soft delete de compte — option "Supprimer mon compte"

---

## 🟡 Bloc 8 — Animations domino (reporté)

- [ ] Animation "distribution" — distribution en début de manche

> Note : l'animation "glissé" (R2-A1) reste dans `TASKS.md` — sprint lancement.

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
