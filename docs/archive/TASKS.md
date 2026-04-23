# ✅ TASKS — Sprint & Tâches en cours

> Tâches actives et backlog immédiat.  
> Roadmap globale → `ROADMAP.md` | Contexte projet → `CONTEXT.md`

**Dernière mise à jour :** 15 avril 2026  
**Sprint actuel :** Sprint 3 — Manques fonctionnels

---

## 🟠 En cours — Bloc 11 : Tournois

### Admin Dashboard (Next.js)
- [ ] Interface de création de tournoi
  - [ ] Champ : format (Manches / Points)
  - [ ] Champ : nombre de joueurs cible
  - [ ] Champ : buy-in (Coins)
  - [ ] Champ : dates début/fin
- [ ] Liste des tournois actifs avec statut

### Logique Mobile
- [ ] **Écran inscription tournoi** — Vue mobile pour s'inscrire à un tournoi ouvert
- [ ] **Lobby tournoi** — Salle d'attente avant le début
- [ ] **Génération des brackets** — Algorithme élimination directe (3 joueurs/match)
- [ ] **Automation** — Fin de partie → mise à jour de l'arbre → lancement du match suivant

### Backend / Cloud Functions
- [ ] Structure Firestore pour les tournois (`tournaments/{id}`)
- [ ] Mise à jour de `processMatchReward` pour gérer le contexte tournoi
- [ ] Règles Firestore pour les tournois

---

## 🔵 Backlog — Bloc 12 : Sentry

- [ ] Créer un projet Sentry (mobile + web)
- [ ] Intégrer SDK Sentry dans l'app Expo
- [ ] Intégrer SDK Sentry dans le Dashboard Admin (Next.js)
- [ ] Configurer les alertes (crash rate, nouvelles erreurs)
- [ ] Tester en staging avant prod

---

## 🟡 Reporté — Animations domino (Bloc 8)

> ⚠️ Reporté à la toute fin du projet pour ne pas bloquer les autres fonctionnalités.

- [ ] Animation "glissé" — domino qui glisse vers le plateau
- [ ] Animation "distribution" — distribution des dominos en début de manche

---

## 🔴 À planifier — Bloc 10 : Gestion des comptes

> À traiter en avant-dernière étape, avant les paiements.

- [ ] **OTP Email** — Envoyer un code OTP par email à l'inscription
- [ ] **Reset mot de passe** — Flow "Mot de passe oublié"
- [ ] **Soft delete de compte** — Option "Supprimer mon compte"

---

## ⚫ À planifier — Bloc 13 : Paiements

> Dernière étape du projet.

- [ ] Choix du gateway (Stripe / Google Pay / autre)
- [ ] Système d'achat de Coins et de Diamonds
- [ ] Intégrer le checkout (workflow achat + paiement en 1 clic)

---

## ✅ Récemment terminé

- [x] **[A1] UI "Boudé" flottant** — Badge visuel de statut pour contourner le masquage de l'avatar.
- [x] **[A2] Vibration de Tour & Paramètre** — Retour haptique implémenté pour signaler le début du tour, manipulable via l'en-tête in-game.
- [x] **[B1] Dominos jouables non mis en avant au 1er tour** — `PlayerHand.tsx` : séparation `entering` (FadeInDown) et `translateY` sur deux View distincts. FadeInDown écrasait le transform.
- [x] **[B2] Dominos qui se bousculent lors du tour du joueur** — `PlayerHand.tsx` : suppression du `scale(0.92)` sur les tuiles non-jouables (opacity seule). Augmentation paddingTop 30→35, gap 8→10.
- [x] **[B3] (Mode Cochon) Inversion de la logique d'attribution** — Correction complète du `ScoringEngine` avec tests validant l'attribution des points (cochons infligés/subis) persistants.
- [x] **[B4] Mode Score : valeur par défaut 100 → 10** — `solo.tsx` modifié par Manuel directement.
- [x] Ligue des Cochons — 4 phases (backend + UI + leaderboard + tests)
- [x] Code table court (6 caractères)
- [x] Lien d'invitation WhatsApp Deep-Link
- [x] Suppression définitive du mode invité (code + comptes existants)
- [x] Refonte UX Mobile Solo & Lobby (flow 2 étapes)

---

## 🔴 Bugs restants — Feedback Client (Sprint 1)

> Source : `docs/FEEDBACK_CLIENT.md`

## ✅ Sprint 2 — Quick wins UX (terminé le 15 avril 2026)

- [x] **[A1]** Badge "Boudé" flottant
- [x] **[A2]** Vibration de tour + toggle en-tête in-game
- [x] **[A3]** Dominos non jouables : suppression du grisage
- [x] **[A4]** Objectif de partie visible en multijoueur (badge dans le header)
- [x] **[A9]** Renommage bot "Béké" → "Chabine"
- [x] **[A15]** Taille des dominos réduite (42px → 38px)
- [x] **[M4]** Onglet DONATION dans l'overlay d'aide (Revolut + RIB)
