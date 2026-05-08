# 📋 BACKLOG — Tâches à planifier

> **Rôle** : backlog de toutes les tâches connues mais non encore planifiées.
> Dès qu'une tâche est décidée → **la déplacer vers `TASKS.md`**.
>
> **Dernière mise à jour :** 08 mai 2026 — restructuré pour lancement officiel

---

## 🚀 Avant lancement officiel

| Ticket | Description | Estimation |
|---|---|---|
| **ANIM-DOMINO** | Animation glissé des dominos pendant le jeu (distribution déjà présente) | ~2 jours |
| **ADS-REWARD** | Doubler les gains après pub — modal post-match "Voir pub → ×2 coins/XP" | ~1,5 jour |
| **R4-TECH-LEADERBOARD** | Agrégats mensuels persistants — décrocher les stats mensuelles de `matchHistory` (limité à 500) | ~2-3 jours |
| **ECO-REBALANCE** | Économie révisée — revoir coins offerts, coins pour jouer et récompenses de fin de match | ~1 jour |
| **OTP-INSCRIPTION** | OTP email à l'inscription — code 6 chiffres à la création de compte | ~1 jour |

---

## 📦 Après lancement officiel

| Ticket | Description | Estimation |
|---|---|---|
| **ADMOB-PHASE2** | AdMob automatique (impressions/clics) — SDK `react-native-google-mobile-ads` | ~1-1,5 jour |
| **TOURNAMENTS** | Bloc 11 — Tournois complets (admin + mobile + brackets + Cloud Functions) | ~4 jours |
| **GOOGLE-PAY** | Paiements in-app Android via Google Play Billing | ~2 jours |
| **AUDIO-IOS-FALLBACK** | Fallback WebAudio API Safari iOS — SFX procéduraux sans `expo-audio` | ~0,5 jour |
| **R4-B3-SESSION** | Multijoueur — reconnexion après purge complète de session navigateur | ~1 jour |
| **NOTIF-WEB** | Notifications push Web PWA (Safari iOS 16.4+ + Chrome Android) | ~1 jour |

---

## ❌ Annulés (décisions client 08/05/2026)

| Ticket | Raison |
|---|---|
| **APPLE-PAYMENT** | Annulé |
| **A12** | Photo de profil — annulé |
| **Shop3** | Phrases créoles tchat — déjà livré via R4-M3 ✅ |
| **Shop6** | Pass VIP 5€/mois — annulé |
| **R4-ECO1** | Récompenses différenciées solo/multi — annulé |
| **ACCOUNT-GOOGLE** | Google Sign-In — annulé |

---

## 🔵 Moyen / Long terme

| Ticket | Description |
|---|---|
| **ANIM-DOMINO-DISTRIB** | Animation distribution dominos en cascade (si non couverte par ANIM-DOMINO) |

---

## 📚 Specs de référence

- Spec bots adaptatifs → `docs/specs/features/BOT_ADAPTIVE.md`
- Spec IA MÈTKAYALI → `docs/specs/BOT_METKAYALI.md`
- Spec tournois → `docs/specs/ARCHITECTURE.md`
