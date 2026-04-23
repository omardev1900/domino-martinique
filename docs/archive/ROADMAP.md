# 🗺️ ROADMAP — Domino Martiniquais

> Feuille de route globale du projet. Mise à jour à chaque jalon important.  
> Pour les tâches détaillées du sprint en cours → voir `TASKS.md`

**Dernière mise à jour :** 14 avril 2026

---

## 📊 Vue d'ensemble des blocs

| Bloc | Description | Statut |
|------|-------------|--------|
| 🔒 Bloc 1 | **Urgence Sécurité** — Firestore rules, validation serveur, rotation clés | ✅ Complet |
| 🧠 Bloc 2 | **Stabilité logique** — Tests, timer, anti-boucle, scoring | ✅ Complet |
| 🛡️ Bloc 3 | **Qualité & Sécurité** — LogService, Zod, debounce, 127 tests | ✅ Complet |
| 🏗️ Bloc 4 | **Architecture** — React Native Expo, Firebase, modélisation données | ✅ Complet |
| 🎮 Bloc 5 | **Moteur de jeu** — Logique martiniquaise complète, Boudé, Chiré, Cochon | ✅ Complet |
| 🎨 Bloc 6 | **UX/UI & Design System** — Table 3 joueurs, dominos, animations | ✅ Complet |
| 🤖 Bloc 7 | **Moteur de jeu final** — Modes Cochon/Manche, IA 3 niveaux, timer | ✅ Complet |
| ✨ Bloc 8 | **Immersion & Métagame UI** — Audio, chat, boutique, overlay, animations | ✅ Complet (partiel) |
| 🐷 Bloc 9 | **Ligue des Cochons** — 4 paliers, cadres avatar, backend + mobile | ✅ Complet |
| 👤 Bloc 10 | **Gestion des comptes** — OTP email, reset MDP, suppression compte | 🔜 Avant-dernière étape |
| 🏆 Bloc 11 | **Tournois** — Création admin, lobby mobile, brackets, automation | ❌ **Priorité actuelle** |
| 🖥️ Bloc 12 | **Pilotage Admin** — Dashboard Next.js + Sentry monitoring | ⚠️ Partiel |
| 💳 Bloc 13 | **Paiement** — Checkout Coins/Diamonds, gateway | 🔜 Dernière étape |

---

## 🎯 Priorités actives (Avril 2026)

| Priorité | Bloc | Description | Statut |
|----------|------|-------------|--------|
| 🟠 **1** | Bloc 11 | **Tournois** — Création admin + logique mobile + brackets | ❌ En cours |
| 🔵 **2** | Bloc 12 | **Sentry** — Monitoring crash en production | ❌ À faire |
| 🟡 **3** | Bloc 8 | **Animations domino** — Glissé + distribution | 🔜 Reporté à la fin |
| 🔴 **4** | Bloc 10 | **Gestion compte** — OTP email, reset MDP, suppression | 🔜 Avant-dernière étape |
| ⚫ **5** | Bloc 13 | **Paiements** — Système de checkout / Coins | 🔜 Dernière étape |

---

## ✅ Bloc 11 — Tournois (Détail)

### À faire
- [ ] **Création de tournoi depuis Admin** : Interface (format, nb joueurs, buy-in, dates)
- [ ] **Système d'inscription & Lobby** : Vue mobile pour s'inscrire à un tournoi ouvert
- [ ] **Génération des Brackets** : Algorithme élimination directe, 3 joueurs/match
- [ ] **Automation des enchaînements** : Fin de partie → mise à jour arbre → lancement match suivant

### Formats de tournoi (V1)
- **Format Manches** : Le tournoi se termine après N manches jouées
- **Format Points** : Le tournoi se termine quand un joueur atteint un score cible
- **Vainqueur** : Plus grand nombre de points → départage par delta cochons donnés/reçus

---

## ✅ Historique des blocs terminés

### Bloc 9 — Ligue des Cochons ✅ (Avril 2026)
- 4 paliers (30 / 150 / 250 / 500 cochons infligés)
- Cadres d'avatar animés (Argent / Or / Diamant / Feu)
- Cloud Function `processMatchReward` mise à jour
- Leaderboard tab COCHONS + écran Ligue dans profil

### Bloc 8 — Immersion & Métagame ✅ (partiel)
- Audio complet (BGM + SFX événements)
- Chat emoji en cours de partie
- Refactor GameScreen en Custom Hooks
- Boutique & cosmétiques (skins table/dominos, inventaire hybride)
- Aide interactive (HelpOverlay)
- Refonte UX Mobile Solo & Lobby (flow 2 étapes)
- Code table court (6 chars) + WhatsApp Deep-Link
- ⚠️ *Animations domino (glissé + distribution) : REPORTÉ*

### Blocs 1–7 ✅ (Janvier–Mars 2026)
Voir `docs/archive/` pour les plans et résumés de ces blocs.

---

## 🚫 Hors scope définitif

- ~~Système d'amis~~ — Retiré définitivement
- Graphismes 3D
- IA experte probabiliste
- Chat texte libre
- Cash-prize dans les tournois
