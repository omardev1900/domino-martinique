# ROADMAP - Domino Martiniquais

> Feuille de route produit a moyen terme.
> Pour le sprint actif et les tickets prets a etre traites, voir `docs/pilotage/TASKS.md`.

**Derniere mise a jour :** 2026-05-10

---

## Vue d'ensemble des blocs

| Bloc | Description | Statut |
|---|---|---|
| Bloc 1 | Urgence securite - Firestore rules, validation serveur, rotation des cles | Termine |
| Bloc 2 | Stabilite logique - tests, timer, anti-boucle, scoring | Termine |
| Bloc 3 | Qualite & securite - LogService, Zod, debounce, couverture logique | Termine |
| Bloc 4 | Architecture - React Native Expo, Firebase, modelisation des donnees | Termine |
| Bloc 5 | Moteur de jeu - logique martiniquaise complete | Termine |
| Bloc 6 | UX/UI & design system - table 3 joueurs, ecrans, composants | Termine |
| Bloc 7 | Moteur de jeu final - modes Manche/Score/Cochon, IA 3 niveaux, timer | Termine |
| Bloc 8 | Immersion & metagame - audio, chat, boutique, overlays, partage | Termine partiel |
| Bloc 9 | Ligue des Cochons - progression, leaderboard, grades, rewards | Termine |
| Bloc 10 | Gestion des comptes - OTP, reset MDP, suppression compte | En consolidation |
| Bloc 11 | Tournois - creation admin, lobby mobile, brackets, automation | A venir |
| Bloc 12 | Pilotage admin - dashboard Next.js, logs, moderation, Sentry | En cours continu |
| Bloc 13 | Paiements - achats in-app et monetisation avancee | A venir |
| Bloc 14 | Configuration dynamique - Règles et prix modifiables depuis l'admin | A venir |

---

## Priorites actuelles

L'ordre reel au 10 mai 2026 n'est plus "Tournois d'abord". La priorite immediate est le sas de pre-lancement officiel.

1. Fermer le sprint `Pre-Lancement Officiel` dans `docs/pilotage/TASKS.md`
2. Stabiliser le compte et la retention avec `OTP-INSCRIPTION`
3. Finaliser la monetisation courte boucle avec `ADS-REWARD` et `ECO-REBALANCE`
4. Corriger la dette de stats mensuelles avec `R4-TECH-LEADERBOARD`
5. Laisser `TOURNAMENTS`, `GOOGLE-PAY` et `ADMOB-PHASE2` en post-lancement

---

## Cap avant lancement officiel

Les 5 tickets qui conditionnent la phase suivante sont :

- `ANIM-DOMINO`
- `ECO-REBALANCE`
- `ADS-REWARD`
- `OTP-INSCRIPTION`
- `R4-TECH-LEADERBOARD`

Une fois ce lot ferme, le projet bascule en priorites post-lancement :

- `ADMOB-PHASE2`
- `TOURNAMENTS`
- `GOOGLE-PAY`
- `NOTIF-WEB`
- `AUDIO-IOS-FALLBACK`

---

## Historique recent utile

- Avril-mai 2026 : la Ligue des Cochons a ete refondue, harmonisee et recentree sur une progression mensuelle coherente.
- Mai 2026 : boutique/tchat consommable, pubs admin-managees, cadeau quotidien conditionne a la pub, partage social, push Android, IA METKAYALI et bots adaptatifs sont livres.
- Les animations de domino restent volontairement reportees jusqu'au sprint de finition.

---

## Hors scope definitif

- Systeme d'amis
- Graphismes 3D
- Chat texte libre
- Cash-prize dans les tournois
- Reintroduction du mode invite
