# BACKLOG - Taches a planifier

> Ce fichier contient les sujets connus mais non encore planifies.
> Des qu'une tache devient prioritaire et decidee, elle sort du backlog pour aller dans `TASKS.md`.

**Derniere mise a jour :** 2026-06-03

---

## Avant lancement officiel - Phase de test ferme

### Bugs & améliorations — retour #14 du 05 juin 2026

| Ticket | Description | Priorité | Estimation |
|---|---|---|---|

| **IAP-PAYMENTS** | [FEATURE] Intégrer les achats in-app (In-App Purchases via Google Play / Apple) pour : 1) Option "Sans Publicité", 2) Achat de packs de Coins ou de Cosmétiques dans la boutique. | 🔴 Haute | ~3 j |


| Ticket | Description | Priorité | Estimation |
| **UX-OPPONENT-DOMINOS** | [UI/UX] Inventaire adverse : Afficher des petits rectangles visuels pour représenter les dominos restants des adversaires sur le plateau. | 🟡 Moyenne | ~0,5 j |

### Bugs & améliorations — retour #11 du 03 juin 2026

| Ticket | Description | Priorité | Estimation |
|---|---|---|---|
| **ECO-DIAMOND-REDUCE** | Modifier la récompense en diamants : donner un seul et unique diamant pour chaque victoire d'un match complet (peu importe le mode). | 🟡 Moyenne | ~0,25 j |
| **REFACTOR-GAMESCREEN** | Dette technique : Découper l'immense fichier `GameScreen.tsx` (> 2000 lignes) en de multiples petits fichiers maintenables (hooks dédiés, composants UI éclatés). | 🔴 Haute | ~2 j |
| **REFERRAL-SYSTEM** | Système de parrainage simple : code unique par joueur (ex: basé sur l'UID tronqué), saisi à l'inscription par le filleul. À l'inscription : créditer le parrain en coins (ex: +200) et le filleul en coins (ex: +100). Pas de tracking d'installation externe — vérification côté Cloud Function à la création du compte. | 🔵 Long terme | ~1,5 j |


| Ticket | Description | Estimation |
|---|---|---|
| **ECO-REWARD-TUNING** | Recalibrer les gains de fin de match et le rythme global de progression |
| **ECO-ADS-COINS-TUNING** | Definir la recompense coins du visionnage pub volontaire post-match |

| **GOD-MODE** | Nouveau mode solo separe "GOD MODE" : 2 bots METKAYALI allies contre le joueur, format `VICTOIRE` v1, acces verrouille par progression joueur |
| **ECO-STAKE-PAYOUT-RULES** | Arbitrer la redistribution des mises en multi et l'eventuelle commission |
| **MULTI-PENALITE-ABANDON** | Differencier abandon volontaire et deconnexion (statut SURRENDERED). A la fin, le joueur en abandon volontaire perd tout et finit dernier, meme si son bot gagne. |





---

## Apres lancement officiel

| Ticket | Description | Estimation |
|---|---|---|
| **TOURNAMENTS** | Bloc 11 - Tournois complets : admin, mobile, brackets, Cloud Functions | ~4 jours |
| **GOOGLE-PAY** | Paiements in-app Android via Google Play Billing | ~2 jours |
| **NOTIF-WEB** | Notifications push Web PWA | ~1 jour |
| **R4-B3-SESSION** | Multijoueur - reconnexion apres purge complete de session navigateur | ~1 jour |
| **UX-LEAGUE-BANNER** | Banniere interactive et auto-scroll (Sticky Banner) dans la vue Ligue des Cochons | ~1 jour |
| **AUDIO-IOS-FALLBACK** | Fallback WebAudio API Safari iOS pour les SFX | ~0,5 jour |

---

## Moyen / long terme

| Ticket | Description |
|---|---|
| **ECO-COIN-SINK-PRICING** | Revoir les prix des cosmetiques et autres puits a jetons |
| **ECO-RETENTION-LOOP** | Verifier l'equilibre de la boucle quotidienne de retention et monetisation |
| **PREMIUM-NO-ADS-SUBSCRIPTION** | Ajouter un abonnement mensuel 5 EUR sans publicite |
| **ANIM-DOMINO-DISTRIB** | Animation de distribution en cascade si `ANIM-DOMINO` ne couvre pas ce besoin |
| **FIRESTORE-CLIENT-BLOCK** | Documenter et reproduire les `ERR_BLOCKED_BY_CLIENT` sur les channels Firestore Web. Probable cause locale: antivirus / extension navigateur / privacy blocker. Verifier l'impact reel sur les tests multi web avant toute correction produit |
| **ECO-CHAT-MIGRATED-AT** | Corriger l'ecriture Firestore invalide `economy.chatInventoryMigratedAt = undefined` dans `EconomyService` / fallback Firebase. Firestore refuse `setDoc()` avec valeur `undefined` |
| **AUDIO-PREMIUM-TRANSITIONS** | Premiumiser les transitions audio : fade-out/fade-in de la BGM entre ecrans, ducking lors des modals evenements, puis remontée progressive du volume apres fermeture ou retour au gameplay |
| **CONFIG-DYNAMIQUE** | Rendre les constantes du jeu (mise de départ, récompenses, pot) dynamiques via Firestore `config/game` depuis le panel admin. Spec : `docs/specs/features/DYNAMIC_CONFIG.md` |

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
- `ANIM-DOMINO` est livre ; `ANIM-DOMINO-POLISH` et `ANIM-DOMINO-DISTRIB` restent des extensions optionnelles suivies ici.
- Les contenus boutique et chat pilotables via l'admin (`cosmetiques`, `Merci`, phrases MDC) sortent du backlog dev et se gerent en configuration.

---

## Specs de reference

- Bots adaptatifs : `docs/specs/features/BOT_ADAPTIVE.md`
- God Mode : `docs/specs/features/GOD_MODE.md`
- IA METKAYALI : `docs/specs/BOT_METKAYALI.md`
- Architecture / tournois : `docs/specs/ARCHITECTURE.md`
