# BACKLOG - Taches a planifier

> Ce fichier contient les sujets connus mais non encore planifies.
> Des qu'une tache devient prioritaire et decidee, elle sort du backlog pour aller dans `TASKS.md`.

**Derniere mise a jour :** 2026-05-12

---

## Apres lancement officiel

| Ticket | Description | Estimation |
|---|---|---|
| **ADMOB-PHASE2** | AdMob automatique impressions/clics via `react-native-google-mobile-ads` | ~1-1,5 jour |
| **TOURNAMENTS** | Bloc 11 - Tournois complets : admin, mobile, brackets, Cloud Functions | ~4 jours |
| **GOOGLE-PAY** | Paiements in-app Android via Google Play Billing | ~2 jours |
| **NOTIF-WEB** | Notifications push Web PWA | ~1 jour |
| **R4-B3-SESSION** | Multijoueur - reconnexion apres purge complete de session navigateur | ~1 jour |
| **AUDIO-IOS-FALLBACK** | Fallback WebAudio API Safari iOS pour les SFX | ~0,5 jour |

---

## Moyen / long terme

| Ticket | Description |
|---|---|
| **ANIM-DOMINO-DISTRIB** | Animation de distribution en cascade si `ANIM-DOMINO` ne couvre pas ce besoin |
| **FIRESTORE-CLIENT-BLOCK** | Documenter et reproduire les `ERR_BLOCKED_BY_CLIENT` sur les channels Firestore Web. Probable cause locale: antivirus / extension navigateur / privacy blocker. Verifier l'impact reel sur les tests multi web avant toute correction produit |
| **ECO-CHAT-MIGRATED-AT** | Corriger l'ecriture Firestore invalide `economy.chatInventoryMigratedAt = undefined` dans `EconomyService` / fallback Firebase. Firestore refuse `setDoc()` avec valeur `undefined` |
| **CF-PROCESSMATCHREWARD-CORS** | Corriger le CORS de la Cloud Function `processMatchReward` pour les appels Web locaux (`http://localhost:8081`) et verifier le fallback actuel cote client |

---

## Annules

| Ticket | Raison |
|---|---|
| **APPLE-PAYMENT** | Annule |
| **A12** | Photo de profil annulee |
| **Shop6** | Pass VIP 5 EUR/mois annule |
| **R4-ECO1** | Recompenses differenciees solo/multi annulees |
| **ACCOUNT-GOOGLE** | Google Sign-In annule |

---

## Notes de hygiene

- Les tickets du sprint `Pre-Lancement Officiel` ne doivent plus vivre ici : ils sont maintenant dans `docs/pilotage/TASKS.md`.
- `Shop3` sort de cette liste : la demande a deja ete livree via `R4-M3`.
- `ECO-REBALANCE`, `OTP-INSCRIPTION` et `ADS-REWARD` restent suivis dans `TASKS.md` avec statut differe selon le calendrier des tests Google Play.

---

## Specs de reference

- Bots adaptatifs : `docs/specs/features/BOT_ADAPTIVE.md`
- IA METKAYALI : `docs/specs/BOT_METKAYALI.md`
- Architecture / tournois : `docs/specs/ARCHITECTURE.md`
