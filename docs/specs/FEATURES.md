# 📋 FEATURES — Vue d'ensemble des fonctionnalités

> Inventaire complet de toutes les fonctionnalités du projet : ce qui existe, ce qui est prévu, ce qui est hors scope.

**Dernière mise à jour :** 14 avril 2026

---

## 🎮 1. Modes de jeu

| Fonctionnalité | Description | Statut |
|---|---|---|
| **Solo — IA Débutant** (TI_MANMAY) | Joue aléatoirement | ✅ Implémenté |
| **Solo — IA Intermédiaire** (MAPIPI) | Stratégie basique (doubles + points lourds) | ✅ Implémenté |
| **Solo — IA Expert** (GRAN_MOUN) | Stratégie multi-critères, analyse main | ✅ Implémenté |
| **Multijoueur — Table publique** | Matchmaking automatique, 3 joueurs | ✅ Implémenté |
| **Multijoueur — Table privée** | Invitation par code (6 chars) ou lien WhatsApp | ✅ Implémenté |
| **Mode Manche** | Fin après X manches, gagnant = plus de points | ✅ Implémenté |
| **Mode Score** | Fin quand un joueur atteint un score cible | ✅ Implémenté |
| **Mode Cochon** | Fin quand X cochons au total ont été infligés | ✅ Implémenté |

---

## 🏆 2. Compétition & Classements

| Fonctionnalité | Description | Statut |
|---|---|---|
| **Leaderboard XP** | Top 50 — trié par XP accumulé | ✅ Implémenté |
| **Leaderboard Coins** | Top 50 — trié par Coins actuels | ✅ Implémenté |
| **Leaderboard Cochons** | Top 50 — trié par `cochonsGiven` (lifetime) | ✅ Implémenté |
| **Ligue des Cochons** | Progression lifetime en 4 paliers (30/150/250/500) | ✅ Implémenté |
| **Tournois** | Création admin, inscription mobile, brackets, automation | ❌ En cours |

---

## 👤 3. Comptes & Profil

| Fonctionnalité | Description | Statut |
|---|---|---|
| **Inscription email** | Création de compte avec email/mot de passe | ✅ Implémenté |
| **Profil joueur** | Pseudo, avatar, statistiques, grade Ligue | ✅ Implémenté |
| **Statistiques** | Parties jouées, victoires, défaites, cochons, points | ✅ Implémenté |
| **Mode invité** | ~~Accès rapide sans compte~~ | ❌ Supprimé définitivement |
| **OTP Email** | Vérification du compte à l'inscription | 🔜 Avant-dernière étape |
| **Reset mot de passe** | Flow "Mot de passe oublié" | 🔜 Avant-dernière étape |
| **Suppression de compte** | Soft delete avec confirmation | 🔜 Avant-dernière étape |

---

## 🎨 4. Cosmétiques & Boutique

| Fonctionnalité | Description | Statut |
|---|---|---|
| **Skins de dominos** | Styles visuels différents pour les pièces | ✅ Implémenté |
| **Skins de table** | Tapis de jeu personnalisables | ✅ Implémenté |
| **Cadres d'avatar** | Argent, Or, Diamant, Feu (déblocage Ligue des Cochons) | ✅ Implémenté |
| **Boutique** | Interface d'achat avec Coins | ✅ Implémenté |
| **Inventaire hybride** | Items achetés + items gagnés en jeu | ✅ Implémenté |

---

## 💰 5. Économie & Progression

| Fonctionnalité | Description | Statut |
|---|---|---|
| **Coins (🪙)** | Monnaie de flux (buy-ins, boutique) | ✅ Implémenté |
| **XP (⭐)** | Expérience → leveling (courbe exponentielle) | ✅ Implémenté |
| **Diamonds (💎)** | Monnaie premium (exploits, levels avancés) | ✅ Implémenté |
| **Points de Ligue (🐷)** | Cochons infligés → grade Ligue | ✅ Implémenté |
| **Coffres de niveau** | Récompenses automatiques à chaque level-up | ✅ Implémenté |
| **Multiplicateur de gains** | Bonus Coins selon le niveau du joueur | ✅ Implémenté |
| **Achat de Coins/Diamonds** | Paiement réel via gateway | 🔜 Dernière étape |
| **Publicités interstitielles** | Fin de partie | 🔜 À planifier |
| **Vidéos récompensées** | Bonus cosmétiques | 🔜 À planifier |

---

## ✨ 6. Expérience en jeu

| Fonctionnalité | Description | Statut |
|---|---|---|
| **Timer par tour** | Temps limité, auto-play si expiré | ✅ Implémenté |
| **Chat emoji** | Émoticônes prédéfinies + messages créoles | ✅ Implémenté |
| **Audio BGM** | 3 musiques de fond, volume réglable | ✅ Implémenté |
| **Audio SFX** | SFX pose, boudé, cochon, chiré, victoire... | ✅ Implémenté |
| **Animations** | FlyingDomino, RewardOverlay, victoire, leaderboard | ✅ Implémenté |
| **Feedback sensoriel** | Shake avatar sur boudé | ✅ Implémenté |
| **Aide interactive** | Règles accessibles via "?" pendant la partie | ✅ Implémenté |
| **Modalés de fin** | Round, manche, match, partie bloquée, chiré | ✅ Implémenté |
| **Animation glissé domino** | Domino animé lors de la pose | 🔜 Reporté à la fin |
| **Animation distribution** | Animation des dominos distribués | 🔜 Reporté à la fin |

---

## 🖥️ 7. Administration & Monitoring

| Fonctionnalité | Description | Statut |
|---|---|---|
| **Dashboard Admin** | Next.js — analytics, bans, bots, config, leaderboard, logs, notifs, players, store, tables, tournaments | ✅ Implémenté |
| **Sentry Monitoring** | Crash monitoring mobile + web en production | ❌ À faire |

---

## 🚫 8. Hors scope définitif

- ~~**Système d'amis**~~ — Retiré définitivement
- **Graphismes 3D** — Pas prévu
- **IA experte probabiliste** — Pas prévu
- **Chat texte libre** — Zéro modération, donc non
- **Saisons complexes** — Pas prévu
- **Tournois avec cash-prize** — Pas prévu
