# BACKLOG - Taches a planifier

> Ce fichier contient les sujets connus mais non encore planifies.
> Des qu'une tache devient prioritaire et decidee, elle sort du backlog pour aller dans `TASKS.md`.

**Derniere mise a jour :** 2026-05-13

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
| **ADS-POST-MATCH-REWARD-UPSSELL** | Apres la pub obligatoire de fin de match, proposer au joueur non premium une seconde pub volontaire pour gagner des coins |
| **ECO-REWARD-TUNING** | Recalibrer les gains de fin de match et le rythme global de progression |
| **ECO-ADS-COINS-TUNING** | Definir la recompense coins du visionnage pub volontaire post-match |
| **ECO-STAKE-PAYOUT-RULES** | Arbitrer la redistribution des mises en multi et l'eventuelle commission |
| **ECO-COIN-SINK-PRICING** | Revoir les prix des cosmetiques et autres puits a jetons |
| **ECO-RETENTION-LOOP** | Verifier l'equilibre de la boucle quotidienne de retention et monetisation |
| **PREMIUM-NO-ADS-SUBSCRIPTION** | Ajouter un abonnement mensuel 5 EUR sans publicite |
| **BUG-LIGUE-GRADEUP-OVERLAY** | Corriger l'affichage incorrect du popup de passage de Ligue des Cochons |
| **AMELIORATION-MULTI-LOBBY-BOT-FILL** | Permettre a l'hote de completer un lobby incomplet avec un bot, avec priorite a un joueur humain si quelqu'un rejoint au meme moment |
| **GOD-MODE** | Nouveau mode solo separe "GOD MODE" : 2 bots METKAYALI allies contre le joueur, format `VICTOIRE` v1, acces verrouille par progression joueur |
| **ANIM-DOMINO-DISTRIB** | Animation de distribution en cascade si `ANIM-DOMINO` ne couvre pas ce besoin |
| **FIRESTORE-CLIENT-BLOCK** | Documenter et reproduire les `ERR_BLOCKED_BY_CLIENT` sur les channels Firestore Web. Probable cause locale: antivirus / extension navigateur / privacy blocker. Verifier l'impact reel sur les tests multi web avant toute correction produit |
| **ECO-CHAT-MIGRATED-AT** | Corriger l'ecriture Firestore invalide `economy.chatInventoryMigratedAt = undefined` dans `EconomyService` / fallback Firebase. Firestore refuse `setDoc()` avec valeur `undefined` |
| **CF-PROCESSMATCHREWARD-CORS** | Corriger le CORS de la Cloud Function `processMatchReward` pour les appels Web locaux (`http://localhost:8081`) et verifier le fallback actuel cote client |
| **AUDIO-PREMIUM-TRANSITIONS** | Premiumiser les transitions audio : fade-out/fade-in de la BGM entre ecrans, ducking lors des modals evenements, puis remontée progressive du volume apres fermeture ou retour au gameplay |

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
- `ADS-POST-MATCH-MANDATORY` existe deja et reste pilote via l'admin : ne pas le recreer en ticket dev.
- `ANIM-DOMINO` reste suivi dans `TASKS.md` ; seul `ANIM-DOMINO-DISTRIB` vit ici comme extension optionnelle.
- Les contenus boutique et chat pilotables via l'admin (`cosmetiques`, `Merci`, phrases MDC) sortent du backlog dev et se gerent en configuration.

---

## Specs de reference

- Bots adaptatifs : `docs/specs/features/BOT_ADAPTIVE.md`
- God Mode : `docs/specs/features/GOD_MODE.md`
- IA METKAYALI : `docs/specs/BOT_METKAYALI.md`
- Architecture / tournois : `docs/specs/ARCHITECTURE.md`
