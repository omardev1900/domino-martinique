# BACKLOG - Tâches à planifier

> Ce fichier contient les sujets connus mais non encore planifiés.
> Dès qu'une tâche devient prioritaire et décidée, elle sort du backlog pour aller dans `TASKS.md`.

**Dernière mise à jour :** 2026-06-09

---

## Avant communication grand public — Backlog immédiat

> Ces tickets ne bloquent pas la distribution mais doivent être faits pour la 1ère vague de communication.

| Ticket | Description | Priorité | Estimation |
|---|---|---|---|
| **IAP-PAYMENTS** | [FEATURE] Intégrer les achats in-app (Google Play / Apple) : Sans Pub, Coins, Cosmétiques. | 🔴 Haute | ~3 j |
| **ADMOB-REAL-IDS** | Remplacer les IDs de test AdMob par les IDs de production réels pour monétisation. | 🔴 Haute | ~0,25 j |
| **MULTI-PENALITE-ABANDON** | Différencier abandon volontaire et déconnexion (`SURRENDERED` vs `DISCONNECTED`). À la fin, le joueur en abandon volontaire perd tout et finit dernier, même si son bot gagne. | 🟡 Moyenne | ~0,5 j |
| **ECO-REWARD-TUNING** | Recalibrer les gains de fin de match et le rythme global de progression. | 🟡 Moyenne | — |
| **ECO-ADS-COINS-TUNING** | Définir la récompense coins du visionnage pub volontaire post-match. | 🟡 Moyenne | — |
| **TIME-PENALTY-COINS** | Prélever des coins si temps épuisé et bot joue à la place du joueur et afficher message "- 10 coins" par exemple. | 🟡 Moyenne | ~0,5 j |

---

## Après communication grand public — Post-lancement

| Ticket | Description | Estimation |
|---|---|---|
| **TOURNAMENTS** | Bloc 11 - Tournois complets : admin, mobile, brackets, Cloud Functions | ~4 jours |
| **OTP-INSCRIPTION** | OTP email à l'inscription (code 6 chiffres) — Web uniquement. Différé car validation Play Store / App Store suffit pour le mobile. | ~1 jour |
| **REFACTOR-GAMESCREEN** | Dette technique : Découper `GameScreen.tsx` (>2000 lignes) en hooks et composants maintenables. | ~2 jours |
| **REFERRAL-SYSTEM** | Système de parrainage : code unique par joueur, coins parrain +200 / filleul +100 via Cloud Function. | ~1,5 jour |
| **GOD-MODE** | Mode solo séparé "GOD MODE" : 2 bots METKAYALI alliés contre le joueur, accès verrouillé par progression. | — |
| **GOOGLE-PAY** | Paiements in-app Android via Google Play Billing | ~2 jours |
| **NOTIF-WEB** | Notifications push Web PWA | ~1 jour |
| **R4-B3-SESSION** | Multijoueur - reconnexion après purge complète de session navigateur | ~1 jour |
| **UX-LEAGUE-BANNER** | Bannière interactive et auto-scroll (Sticky Banner) dans la vue Ligue des Cochons | ~1 jour |
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

## Notes d'hygiène

- `OTP-INSCRIPTION`, `REFACTOR-GAMESCREEN`, `REFERRAL-SYSTEM` et `GOD-MODE` sont différés volontairement après communication grand public.
- `ECO-DIAMOND-REDUCE` est livré (1 diamant par victoire de match, 0 pour les perdants) — archivé dans `DONE.md` 2026-06-05.
- `UX-OPPONENT-DOMINOS` est livré — archivé dans `DONE.md` 2026-06-07.
- `ECO-REBALANCE` et `ADS-REWARD` sont livrés.
- `ANIM-DOMINO` est livré ; `ANIM-DOMINO-DISTRIB` reste une extension optionnelle.
- Les contenus boutique et chat pilotables via l'admin (`cosmetiques`, phrases MDC) se gèrent en configuration, pas en ticket dev.

---

## Specs de reference

- Bots adaptatifs : `docs/specs/features/BOT_ADAPTIVE.md`
- God Mode : `docs/specs/features/GOD_MODE.md`
- IA METKAYALI : `docs/specs/BOT_METKAYALI.md`
- Architecture / tournois : `docs/specs/ARCHITECTURE.md`
