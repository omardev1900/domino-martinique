# BACKLOG - Taches a planifier

> Ce fichier contient les sujets connus mais non encore planifies.
> Des qu'une tache devient prioritaire et decidee, elle sort du backlog pour aller dans `TASKS.md`.

**Derniere mise a jour :** 2026-05-24

---

## Avant lancement officiel - Phase de test ferme

| Ticket | Description | Estimation |
|---|---|---|
| **ADS-POST-MATCH-REWARD-UPSSELL** | Apres la pub obligatoire de fin de match pour les non premium, proposer aux joueurs premium inclus une pub volontaire pour gagner des coins |
| **ECO-REWARD-TUNING** | Recalibrer les gains de fin de match et le rythme global de progression |
| **ECO-ADS-COINS-TUNING** | Definir la recompense coins du visionnage pub volontaire post-match |
| **SOLO-REJOUER-REVANCHE** | Priorite moyenne - En solo, revoir le modal de fin de match : apres une victoire afficher `Rejouer`, `Retour aux modes`, `Quitter` ; apres une defaite afficher `Revanche - X coins`, `Retour aux modes`, `Quitter`. `Rejouer` relance les memes parametres avec de nouveaux bots et le cout solo normal. `Revanche` relance exactement les memes parametres contre les memes bots, avec cout progressif `500`, `1000`, `2000`, etc. La serie s'arrete des que le joueur quitte l'ecran de match. Si le joueur gagne une revanche, il recupere sa mise et gagne `+300` coins. |
| **UX-MODAL-ANIM-SFX** | Harmoniser les modals/popups du jeu : apparition/fermeture animees, transitions coherentes, sons associes quand l'evenement le justifie. |
| **UX-BUTTON-FEEDBACK-SFX** | Ajouter un feedback sonore et/ou haptique coherent aux boutons principaux de l'accueil, des ecrans et du gameplay, sans surcharger l'experience. |
| **UX-SCREEN-PREMIUM-MOTION** | Ameliorer les ecrans trop statiques : rendre certains blocs et sections plus vivants avec micro-animations, profondeur visuelle et effets 3D sobres. |

| **GOD-MODE** | Nouveau mode solo separe "GOD MODE" : 2 bots METKAYALI allies contre le joueur, format `VICTOIRE` v1, acces verrouille par progression joueur |
| **ECO-STAKE-PAYOUT-RULES** | Arbitrer la redistribution des mises en multi et l'eventuelle commission |
| **MULTI-PENALITE-ABANDON** | Differencier abandon volontaire et deconnexion (statut SURRENDERED). A la fin, le joueur en abandon volontaire perd tout et finit dernier, meme si son bot gagne. |
| **R6-B1-STATS-RESET** | Bug majeur: statistiques et economie (coins, diamants, ligue) remises a zero lors de la connexion. |





---

## Apres lancement officiel

| Ticket | Description | Estimation |
|---|---|---|
| **ADMOB-PHASE2** | AdMob automatique impressions/clics via `react-native-google-mobile-ads` | ~1-1,5 jour |
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
