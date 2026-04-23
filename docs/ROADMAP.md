# 🗺️ ROADMAP — Domino Martiniquais

> Feuille de route globale du projet. Mise à jour uniquement à chaque fin de bloc.
> Pour les tâches détaillées du sprint en cours → voir `TASKS.md`

**Dernière mise à jour :** 15 avril 2026

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
| 🏆 Bloc 11 | **Tournois** — Création admin, lobby mobile, brackets, automation | ❌ Priorité actuelle |
| 🖥️ Bloc 12 | **Pilotage Admin** — Dashboard Next.js + Sentry monitoring | ⚠️ Partiel |
| 👤 Bloc 10 | **Gestion des comptes** — OTP email, reset MDP, suppression compte | 🔜 Avant-dernière étape |
| 💳 Bloc 13 | **Paiement** — Checkout Coins/Diamonds, gateway | 🔜 Dernière étape |

---

## 🎯 Ordre des priorités actives

1. 🟠 **Bloc 11 — Tournois** *(en cours → détail dans `TASKS.md`)*
2. 🔵 **Bloc 12 — Sentry** monitoring crash
3. 🟡 **Bloc 8 — Animations domino** glissé + distribution *(reporté à la fin)*
4. 🔴 **Bloc 10 — Gestion compte** OTP, reset MDP, suppression
5. ⚫ **Bloc 13 — Paiements** checkout Coins/Diamonds

---

## 📋 Specs techniques des blocs à venir

### Bloc 11 — Tournois
- **Format Manches** : tournoi se termine après N manches jouées
- **Format Points** : tournoi se termine quand un joueur atteint un score cible
- **Vainqueur** : plus grand nombre de points → départage par delta cochons donnés/reçus
- Détail des tâches → `TASKS.md`

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
