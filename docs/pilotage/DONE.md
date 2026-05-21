# DONE - Archive des taches terminees

> Archive historique des taches livrees.
> Ce fichier ne contient aucune tache active.
>
> **Flux obligatoire :** `BACKLOG.md` -> `TASKS.md` -> `DONE.md`
>
> Convention : classement par date descendante (plus recent en haut), date au format AAAA-MM-JJ.

## Mai 2026

### 2026-05-21 - Fix CORS processMatchReward + fallback client

- [x] **[CF-PROCESSMATCHREWARD-CORS]** Correction du CORS Web local sur `processMatchReward`
  - **Cause** : Les CF `onCall` v1 Firebase bloquent les origines `http://localhost` (non-HTTPS), rendant les tests de récompenses post-match impossible sur `localhost:8081`. Firebase ne permet pas la migration directe d'une CF v1 vers v2 pour une fonction existante.
  - **Solution** : Côté client uniquement — la CF `processMatchRewardHttp` (onRequest) qui gère CORS correctement sert maintenant de **chemin principal sur Web local** (au lieu d'être un fallback). La logique de détection `shouldUseWebLocalRewardHttpFallback()` court-circuite maintenant avant tout appel `httpsCallable`, évitant le blocage CORS sans modifier la CF en production.
  - **Bonus** : Extraction de la logique d'application du reward HTTP dans `callAndApplyHttpReward()` (méthode privée réutilisable). Fin de la duplication de code entre le court-circuit direct et le fallback dans le `catch`.
  - **Aucun déploiement CF** requis — `processMatchReward` en production reste inchangé.
  - Fichier modifié : `mobile/src/core/services/economy.service.ts`


- [x] **[SENTRY-AUDIO-WATCHDOG]** Fix crash fatal TypeError watchdog SoundManager (Android)
  - Le watchdog appelait `this.currentMusic.play().catch()` directement
  - Sur certains appareils expo-audio, `play()` retourne `undefined` → `.catch()` explose (FATAL, 5 users, SM-S928B Android 16)
  - Remplacé par `this.safePlayPlayer()` qui vérifie le type retour avant d'appeler `.catch()`
  - Fichier : `mobile/src/core/audio/SoundManager.ts`

- [x] **[SENTRY-AUDIO-CHROME-IOS]** Suppression des NotAllowedError autoplay Web Chrome iOS
  - Guard `isAudioAllowed` ne couvrait que Safari iOS, pas Chrome iOS (`CriOS`)
  - 31 events / 16 users en cours depuis 2 semaines sur `play.domino-martinique.online`
  - Chrome iOS ajouté au guard — même comportement que Safari iOS (audio désactivé)
  - Fichier : `mobile/src/core/audio/SoundManager.ts`



- [x] **[UX-ADMIN-SIDEBAR]** Menu latéral rétractable + Défilement horizontal des tableaux (Ads)
  - Sidebar rétractable via un toggle (chevron) pour maximiser l'espace de travail
  - Transition fluide et état persisté par session (React state)
  - Ajout du défilement horizontal (`overflow-x-auto`) sur le tableau des publicités
  - `min-width` garanti pour éviter l'écrasement des colonnes sur petits écrans

- [x] **[ECO-WELCOME-DAILY]** Reéquilibrage des constantes économie bienvenue
  - `NEW_PLAYER_COINS` : `1000` → `300` coins à la création de compte
  - `DAILY_REWARD_COINS` : `300` → `200` coins pour le cadeau du jour
  - Constante `AD_REWARD_COINS = 100` ajoutée pour la récompense pub
  - Fichier `economy.constants.ts` — aucun autre fichier à modifier
  - Joueurs existants non affectés (cadeau bienvenue = création compte uniquement)

- [x] **[ADS-REWARD]** Bouton "Voir une pub → +100 coins" en fin de match
  - Composant `AdRewardButton.tsx` créé — **réutilisable partout dans l'app**
  - Props : `coinsAmount`, `onClaim` (async), `label`, `variant` (`default`/`prominent`), `enterDelay`, `disabled`
  - Guard interne : un seul clic par montage, état `claimed` local
  - Variante `prominent` disponible pour les contextes à fort appel à l'action
  - Branché dans `UnifiedResultOverlay` (fin de match uniquement, solo et multi)
  - Chaîne de données : `GameScreen.onAdRewardClaim` → `economyService.creditAdReward()` → Firestore
  - Méthode `creditAdReward()` ajoutée à `EconomyService`
  - `GameOverlays` et `UnifiedResultOverlay` mis à jour avec la prop `onAdRewardClaim`



- [x] **[BUG-LIGUE-GRADEUP-OVERLAY]** Retour correct au `RewardOverlay` principal apres fermeture du popup de palier
  - Le `X` de la sous-modale Ligue referme uniquement le popup de grade-up
  - Le `RewardOverlay` principal redevient visible au lieu de laisser un fond vide
  - Le comportement a ete valide sur le flow Ligue cible

- [x] **[LIGUE-DEBUTANT-FIRST-COCHON]** Ajout du grade `Debutant` des le 1er cochon
  - `0 cochon` reste `Sans grade`
  - `1 cochon` donne maintenant le grade `Debutant`
  - Aucun cadre n'est debloque a ce premier palier, les seuils suivants restent inchanges
  - Les ecrans Ligue, badges, overlays et regles derivees ont ete realignes

- [x] **[AMELIORATION-HAND-AUTO-SORT]** Tri local de la main en partie
  - Ajout d'un menu `Trier` au-dessus de l'avatar du joueur local
  - V1 livree avec 3 modes : `Auto`, `Doubles`, `Somme`
  - Le tri reste purement local a l'affichage et n'impacte ni les regles ni les autres joueurs
  - En solo, l'onglet `Infos` du menu d'options affiche maintenant la difficulte des bots
  - En solo, les bots n'affichent plus de grade ni de cadre Ligue sur leurs avatars
  - Validation ciblee executee sur `PlayerHand.test.tsx`, `PlayerArea.test.tsx` et `ActionFooter.test.tsx`

### 2026-05-12 - Celebrations Ligue et finitions pre-lancement

- [x] **[LEAGUE-GRADEUP-CELEBRATION]** Passage de palier Ligue rendu plus premium
  - `applause.mp3` integre au pipeline audio et joue `800 ms` apres `leagueJingle`
  - La modale de grade-up ne se ferme plus sur simple tap hors CTA
  - Ajout de CTA explicites `Accueil` et `Continuer`
  - Le partage social du palier reste disponible dans la modale
  - Validation ciblee ajoutee sur `RewardOverlay.test.tsx` et `SoundManager.test.ts`

- [x] **[MATCH-END-APPLAUSE]** Celebration de fin de match enrichie avec un second tail audio
  - `matchEnd` reste le stinger principal du modal final
  - `applause.mp3` est maintenant joue `800 ms` apres `matchEnd`
  - Le declenchement est centralise dans `UnifiedResultOverlay` pour eviter les doublons
  - Validation ciblee ajoutee sur `UnifiedResultOverlay.test.tsx`

- [x] **[AUDIO-BGM-SIMPLIFY]** Simplification finale du modele BGM pre-lancement
  - Le runtime n'utilise plus que `appActive` et `inGame`
  - `appActive` choisit une variante locale `A/B` une seule fois par session
  - `inGame` utilise une piste locale dediee unique
  - Les ecrans utilitaires (`profil`, `parametres`, `stats`, `boutique`, `collection`) restent silencieux
  - L'interface admin audio ne peut plus modifier les affectations runtime des BGM
  - Validation executee sur les tests audio cibles et sur le build `admin`

### 2026-05-12 - Stabilisation du flow de fin de match

- [x] **[MATCH-END-OVERLAY-FLOW]** Correction de la sequence visuelle et sonore de fin de match
  - Le modal final de `MATCH_END` est maintenant arme explicitement apres le `RoundResultCard`, au lieu de dependre d'un etat d'overlay residuel
  - La transition `MANCHE_END -> MATCH_END` ne peut plus faire apparaitre brievement le modal final avant le bon timing
  - `RoundResultCard` et `UnifiedResultOverlay` reinitialisent correctement leur garde-fou audio a la fermeture
  - Le stinger `matchEnd` est joue par l'overlay final du match, sans conflit avec le resume de round
  - Validation ciblee ajoutee sur `GameScreen.gradeUp.test.tsx` et `RoundResultCard.test.tsx`

- [x] **[AUDIO-ASSET-CLEANUP]** Menage et reorganisation du dossier `assets/sounds`
  - Suppression des fichiers legacy non utilises et retrait complet de `start-game.mp3`
  - Renommage des fichiers metier pour des noms plus explicites (`stinger-*`, `sfx-shuffle`, `bgm-shared`)
  - Reorganisation en sous-dossiers `bgm/`, `sfx/`, `stingers/`
  - `SoundManager.ts` realigne sur les nouveaux chemins
  - Tests audio cibles relances avec succes

### 2026-05-11 - Stabilisation audio gameplay avant lancement

- [x] **[AUDIO-GAMEPLAY-HARDENING]** Audit, stabilisation et validation du pipeline audio en jeu
  - Separation propre entre `Musique` et `Effets` dans le runtime et dans le menu de jeu
  - Suppression des doublons majeurs sur les sons terminaux round / manche / match
  - Politique de priorite audio runtime ajoutee : BGM, SFX gameplay, UI, stingers majeurs
  - Stabilisation des transitions BGM, du watchdog, du preload et du teardown de tests
  - Tuning centralise des gains SFX (`clack`, `timer`, `end_time`, `notify`, `toktok`, stingers de fin)
  - Refactor BGM simplifie : aucune musique sur splash / login, une musique hors partie, une musique en partie
  - Fallback sonore ajoute sur l'overlay final pour mieux securiser le son de fin de match
  - Validation manuelle confirmee : BGM sur `/home`, BGM et SFX en jeu, mute fonctionnel, modals sonores OK

### 2026-05-11 - Fix gameplay Cochon + tie-break Boudé en multijoueur

- [x] **[COCHON-SCORE-FIX]** Correction de l'imputation des cochons
  - Le compteur `🐷` visible en mode Cochon correspond maintenant uniquement aux cochons infliges par le vainqueur
  - Les joueurs a `0 etoile` ne gagnent plus de `🐷` par erreur : ils recoivent seulement le malus `-1 point`
  - La condition de fin de match en mode Cochon s'appuie desormais sur `totalCochonsInfliges`
  - Les ecrans de jeu, modals de fin, resultats et recompenses lisent tous la meme source de verite
  - Tests solo, multi local et tests automatises valides

- [x] **[BOUDE-TIEBREAK-FIX]** Correction de la redonne apres egalite sur partie bloquee
  - Apres une egalite a 2 joueurs, seul un joueur ex aequo peut demarrer la redonne
  - Le starter est choisi via le plus grand double parmi les joueurs a egalite uniquement
  - Le 3e joueur non ex aequo est exclu du tie-break de redemarrage
  - Ajout d'un garde-fou UI pour fermer le modal de fin de round si le client a deja recu la phase suivante
  - Tests moteur et test d'integration ajoutes sur la sequence `BOUDE -> redonne -> premier coup force`

- [x] **[LIGUE-MOBILE-UX]** Refonte mobile de `/ligue-cochons`
  - Header compacte : titre reduit, aligne a gauche, sous-titre supprime
  - Navigation principale `Ma Ligue / Mois / Global` integree dans la barre du haut
  - Classements compactes : lignes joueurs moins hautes pour afficher plus d'entrees
  - Filtres de classement deplaces dans une colonne laterale compacte a gauche
  - Le switch `Total / Perf` n'apparait plus que sur le filtre actif
  - Scroll vertical du classement retabli apres la refonte en 2 colonnes

### 2026-05-08 - Bots adaptatifs + IA METKAYALI niveau 4

- [x] **[BOT-ADAPTIVE]** Bots adaptatifs + IA METKAYALI
  - Moteur IA 4 couches : suivi des tuiles, Monte Carlo, analyse endgame, modelisation adverse
  - Performance cible tenue : decision < 100 ms
  - Niveau 4 branche dans le jeu, le solo et l'admin
  - Tests unitaires verts

### 2026-05-08 - Harmonisation grades Ligue + logs admin + fix audio iOS + tchat consommable

- [x] **[R4-M3]** Tchat consommable a l'unite
- [x] **[R4-B-GRADES]** Harmonisation des grades de la Ligue
- [x] **[ADMIN-LOGS]** Refonte page logs admin + lien Sentry
- [x] **[AUDIO-IOS-SAFARI]** Silence des erreurs Safari iOS autour du son

### 2026-05-06 - Partage social + politique de confidentialite

- [x] **[R4-UX3]** Partage social victoire + passage de palier
- [x] **[LP-POLICY]** Page Politique de confidentialite pour la landing page

### 2026-05-06 - Sprint Post-Lancement P1

- [x] **[R4-B2]** Popup de passage de palier dans le vrai flux de jeu
- [x] **[R4-B5]** Fix web sur le domino gagnant reutilise
- [x] **[R4-M4]** Cadeau quotidien conditionne a une pub
- [x] **[R4-M2]** Pubs dans boutique, vestiaire, stats, classement et ligue
- [x] **[R4-M5]** Notifications push quotidiennes Android

### 2026-05-04

- [x] **[R4-B1]** Source de verite mensuelle unifiee pour la Ligue des Cochons
- [x] **[R4-UX1]** `/ligue-cochons` devient l'ecran maitre de la ligue
- [x] **[R4-UX2]** Separation nette entre stats mensuelles et cumulees

## Avril 2026

L'historique detaille d'avril reste archive dans `history.md` et dans les versions precedentes de ce fichier.
