# Domino Martiniquais

> Application mobile React Native (Expo) de Domino martiniquais (règles créoles, 3 joueurs). Disponible sur Android + iOS.

**Dernière mise à jour :** 24 avril 2026
**Version app :** 2.2
**Lead Dev :** Omatrice
**github :** omardev1900
---

## 1. Objectif produit

- Jouer en **solo** contre une IA (3 niveaux : TI_MANMAY, MAPIPI, GRAN_MOUN ; un 4ᵉ MÈTKAYALI planifié)
- Jouer en **multijoueur temps réel** (tables publiques ou privées, 3 joueurs)
- Système de **comptes, classement, Ligue des Cochons (8 paliers), boutique**
- Générer des **revenus** via publicités + premium

---

## 2. Stack technique

| Couche | Technologie |
|---|---|
| Mobile | React Native + Expo |
| Backend temps réel | Firebase Firestore |
| Auth | Firebase Authentication |
| Cloud Functions | Node.js (TypeScript) — `processMatchReward` |
| Admin Dashboard | Next.js (séparé) |
| Tests | Jest (127 tests unitaires) |

---

## 3. État actuel

### ✅ Livré (blocs 1-9)
- Sécurité Firestore + rotation des clés
- Moteur de jeu complet (127 tests, 0% failure)
- UI/UX complète (paysage, animations, audio)
- Mode Solo + Mode Multijoueur
- Modes de jeu : Manche, Score, Cochon
- Ligue des Cochons (8 paliers)
- Système économique (Coins, XP, Diamonds, niveaux)
- Boutique & cosmétiques
- Dashboard Admin (Next.js)
- Sidebar navigation (R2-A3)
- Publicité Phase 1 (admin-managed, R2-M7)

### 🔄 En cours (sprint lancement)
3 tâches restantes → voir `docs/pilotage/TASKS.md`

### 📋 À venir (post-lancement, priorité décroissante)
1. Bloc 11 — Tournois
2. Bot MÈTKAYALI (Niveau 4 IA)
3. Bloc 12 — Sentry monitoring
4. Bloc 10 — Gestion des comptes (OTP, reset MDP)
5. Bloc 13 — Paiements

---

## 4. Démarrer en dev

```bash
# Mobile
cd mobile
npm install
npx expo start

# Admin dashboard
cd admin
npm install
npm run dev

# Cloud Functions
cd functions
npm install
npm run serve
```

---

## 5. Où chercher quoi ?

- **Tâches en cours** → `docs/pilotage/TASKS.md`
- **Backlog** → `docs/pilotage/BACKLOG.md`
- **Archive tâches** → `docs/pilotage/DONE.md`
- **Règles du jeu** → `docs/specs/GAME_RULES.md`
- **Architecture technique** → `docs/specs/ARCHITECTURE.md`
- **Autres specs** (ads, économie, ligue, bot) → `docs/specs/`
- **Retours client** → `docs/feedback/CLIENT.md`
- **Changelog** → `docs/feedback/CHANGELOG.md`
- **Roadmap** → `docs/ROADMAP.md`
- **Organisation de la doc** → `docs/STRUCTURE.md`

---

## 6. Hors scope (ne pas implémenter)

- Système d'amis — retiré définitivement
- Graphismes 3D
- IA experte probabiliste (à ne pas confondre avec MÈTKAYALI, qui est planifié)
- Chat texte libre
- Saisons / classements périodiques complexes
- Cash-prize dans les tournois
