# 📝 CHANGELOG — Domino Martiniquais

> Journal des changements notables, classés par date (plus récent en premier).

---

## [2.5.13] - 2026-06-03

### Corrigé
- **Animation des dominos (polish)** — trajectoire plus naturelle, timing plus fluide, positionnement fiable depuis la main ou l'avatar. L'animation reste complètement découplée du moteur de jeu.
- **Ligue des Cochons — récompense de palier** — les coins de passage de palier sont maintenant correctement crédités et affichés dans l'animation `RewardOverlay`, même lorsque `LEAGUE_FRAMES_ENABLED = false`.
- **Ligue des Cochons — grade en partie multi** — le grade/cadre Ligue ne disparaît plus en cours de partie. Le snapshot Firestore transporte désormais correctement le `leagueGrade` à chaque mise à jour de la room.
- **Ligue des Cochons — grade en fin de match** — le badge "Sans grade" n'apparaît plus à tort. Le grade survit à la mise à jour locale post-match.
- **Dominos qui rétrécissaient au retour en jeu** — le layout recalcule maintenant correctement les dimensions de la main et du plateau après un `AppState` change vers `active` (appel téléphonique, notification, changement d'app).
- **Bug critique : cadeau de bienvenue** — les 300 coins offerts à l'inscription sont désormais correctement crédités et sauvegardés. Le problème qui réinitialisait parfois le solde à zéro juste après la création du compte a été résolu (correction de l'enregistrement dans la base de données).
- **Reprise de partie après un appel téléphonique** — reconnexion Firestore et focus audio/game correctement restaurés au retour d'interruption.
- **Bug critique : réinitialisation des stats à la connexion** — les statistiques, coins, diamants et progression de Ligue ne sont plus remis à zéro lors de la connexion. Architecture Pull-Only stricte implémentée (voir R6-B1-STATS-RESET).
- **Gameplay / Bots** — les bots respectent maintenant le temps d'animation visuelle avant de jouer.
- **Son "boudé" en double** — le son (toktok) ne se joue plus en double lors du passage de tour automatique.

### Ajouté
- **Feedback UI "Boudé"** — ajout d'une bannière de texte dynamique au centre du plateau indiquant quand un joueur passe son tour ("VOUS ÊTES BOUDÉ" ou "NomDuJoueur EST BOUDÉ").

### Modifié
- **Objectifs par défaut** — les valeurs par défaut pour créer une partie (Solo et Multijoueur) ont été augmentées (10 victoires, 25 points, 5 manches, 5 cochons).
- **Pubs Boutique** — le délai entre deux publicités pour gagner des coins gratuits est passé d'1 heure à 3 minutes.

### Modifié
- **Économie** — rééquilibrage du coût d'un jeu multi et des gains de victoire (constantes `economy.constants.ts` et Cloud Function).

---

## [Admin] - 2026-06-01

### Modifié (Admin)
- **Panel Admin — Actualités accessibles aux managers** — la page `/dashboard/news` est désormais accessible aux comptes de type Manager. Ils peuvent créer, modifier, activer/désactiver et supprimer des actualités depuis l'interface admin, sans avoir besoin d'un accès Superadmin.

---

## [2.5.12] - 2026-05-29

### Ajouté
- **Mise à jour obligatoire (Force Update)** — implémentation d'un système de blocage distant via Firestore. Si la version de l'application est trop ancienne, un écran incontournable s'affiche pour inviter le joueur à télécharger la nouvelle version sur le Google Play Store.
- **Filtre de Satisfaction (In-App Review)** — apparition intelligente d'une demande d'avis (paliers: 1, 5, 10, 20 victoires...). Redirige vers le Play Store si l'avis est positif, ou vers notre formulaire de feedback interne si le joueur souhaite faire remonter des problèmes. Fin des relances dès qu'un choix est exprimé.

### Corrigé
- **Mode Solo — Reprise de partie** — une partie solo interrompue (appel téléphonique, mise en arrière-plan, fermeture de l'app par l'OS) est maintenant retrouvée automatiquement au retour dans le jeu. Un bandeau ⏸️ « Partie en cours » s'affiche sur l'écran Solo avec les actions **Reprendre** et **Nouvelle partie** (confirmation requise pour ne pas perdre la progression). La partie ne redémarre plus depuis zéro à chaque ouverture.

---

## [2.5.11] - 2026-05-24

### Corrige
- **Animation domino / tour joueur** - le compteur, le joueur actif et les dominos jouables du joueur suivant ne s'affichent plus avant que le domino en mouvement soit pose sur le plateau.

---
## [2.5.10] - 2026-05-23

### Corrige
- **Mode Solo - bots METKAYALI** - correction d'un gel de partie ou le tour d'un bot pouvait rester bloque a 15 secondes en manche 2 si le moteur IA rencontrait une exception ou si l'action etait refusee au mauvais instant. Le bot retente maintenant son action, puis utilise un coup de secours legal ou passe son tour au lieu de bloquer la partie.
- **Animation des dominos** - l'animation est maintenant separee du moteur de jeu : si elle echoue ou tarde a se terminer, elle ne peut plus figer le timer, bloquer le tour courant ou laisser l'interface en pause.
- **Multijoueur avec bots - partie bloquee** - correction d'un blocage apres la modal "partie bloquee" : le passage au round suivant n'est plus bloque par un verrou de tour en retard, le timer s'arrete pendant BOUDE, et un simple timeout ne marque plus le joueur humain comme deconnecte.
- **Partie bloquee avec egalite** - la redonne BOUDE est securisee par tests : le joueur qui demarre le round suivant est toujours choisi parmi les joueurs ex aequo, jamais parmi les perdants non concernes.
- **Partie bloquee - affichage unique** - le message/modal de partie bloquee ne se reinitalise plus plusieurs fois sur le meme etat BOUDE, meme si l'ecran rerender ou recoit plusieurs snapshots identiques.

---

## [2.5.9] - 2026-05-22

### Ajouté
- **Animation des dominos (ANIM-DOMINO)** — Le jeu s'enrichit visuellement ! Désormais, lorsqu'un joueur (vous ou un adversaire) joue un domino, une animation fluide montre le domino glisser de la main (ou de l'avatar) jusqu'à sa place sur la table. Le jeu se met intelligemment en pause pendant l'animation pour éviter tout chevauchement et offrir un confort visuel optimal.
- **Bannière Classement Interactive (UX-LEADERBOARD)** — Le Top 50 a été étendu au Top 100 pour donner plus de visibilité aux joueurs. Ajout d'une bannière dorée fixe ("Sticky Banner") en bas de l'écran du classement permettant au joueur de voir son rang en permanence. Un clic sur cette bannière déclenche un auto-scroll vers la position exacte du joueur.

### Corrigé
- **Classement Cochons Erroné (UX-LEADERBOARD)** — Correction d'un bug d'affichage et de tri dans l'onglet "Cochons" du Leaderboard. La base de données triait sur `economy.cochonsGiven` alors que l'interface affichait `stats.totalCochonsInflicted`. Le classement est désormais strictement basé sur le bon compteur de statistiques. Le bandeau inférieur affiche également la bonne valeur au lieu des points de ligue.
- **Correction définitive bug réinitialisation statistiques & économie (R6-B1-STATS-RESET)** — Résolution d'un bug critique où les comptes de jeu voyaient leurs données réinitialisées lors de la connexion, particulièrement si le document ou le nœud `stats` n'existait pas sur Firebase, ou si la connexion réseau était instable.
  - Implémentation d'une architecture **Pull-Only** stricte : l'application n'essaie plus d'écrire des valeurs par défaut à la connexion, elle ne fait que lire.
  - Séparation complète du flux `signUp` (seul autorisé à créer les compteurs à 0) et du flux `signIn` / `getCurrentUser` (lecture seule, bloque l'accès si les données ne peuvent pas être lues de manière sécurisée).
  - Gestion asynchrone sécurisée pour les anciens comptes qui n'ont pas encore de nœud `stats` : ils démarrent avec 0 stat en mémoire mais ne forcent plus d'écrasement sur la base de données.

---

## [2.5.8] - 2026-05-21

### Modifié
- **Affichage et homogénéisation de la version (VERSION-DISPLAY)** — La version de l'application (source de vérité `1.0.3` dans `app.json`) est désormais lue dynamiquement via `expo-constants`. Elle s'affiche de manière élégante sur l'écran d'accueil (splashscreen), en bas des réglages/paramètres, et est rattachée de façon dynamique aux soumissions de retours/feedback.

---

## [2.5.7] - 2026-05-21

### Technique (invisible côté joueur, impact sur la performance)
- **Classements mensuels fiabilisés (R4-TECH-LEADERBOARD)** — les onglets `Classement du mois` (+Cochons, -Cochons, +Points) ne lisent plus l'intégralité de `matchHistory` de chaque joueur. Les métriques mensuelles sont maintenant précalculées dans une collection dédiée (`users_monthly_stats`) et mises à jour automatiquement après chaque fin de match, changement de pseudo ou d'équipement de cadre. Résultat : chargements plus rapides, classements plus fiables, et évolutivité pour des milliers de joueurs.

---

## [2.5.6] - 2026-05-21

### Ajouté
- **Persistance locale du mode Solo** — l'état d'une partie solo (le plateau, la main exacte du joueur, les scores de manches précédentes, la configuration des bots) est désormais sauvegardé localement en continu. Si le joueur rafraîchit sa page web ou si l'application subit un redémarrage, il reprend sa partie à la seconde près sans aucune perte de progression ni redistribution de main.
- **Jeu en ligne obligatoire** — l'application requiert désormais une connexion internet active pour jouer ou accéder aux menus (solo compris). Un écran premium "Connexion requise" bloque l'interface lorsque l'appareil est hors ligne.

- **Authentification obligatoire** — accès réservé uniquement aux joueurs connectés. Toute tentative d'accès à l'application sans compte/session active (hors écran d'accueil et écran de connexion) redirige immédiatement vers `/login`.

### Modifié
- **Optimisation AsyncStorage (Sécurité multi-compte)** — pour les joueurs authentifiés, les statistiques et l'historique de jeu ne sont plus conservés localement dans l'AsyncStorage de l'appareil. La clé `@player_stats:{uid}` locale est automatiquement supprimée lors de l'authentification et les données sont lues et écrites directement en temps réel depuis Firestore. Cela garantit une source de vérité unique et évite les conflits ou chevauchements de données lorsque plusieurs comptes se connectent successivement sur le même téléphone.

### Corrigé
- **Écran de chargement infini au démarrage (zombie room)** — correction d'un bug majeur où l'application redirigeait automatiquement le joueur vers sa dernière room stockée localement au démarrage. Si la table n'existait plus ou était terminée sur Firestore, l'utilisateur restait bloqué indéfiniment sur un écran noir ou blanc affichant `Loading...`. La room est désormais validée en temps réel avant toute redirection.

### Corrigé (technique)
- **Récompenses post-match sur Web local** — les tests de récompenses sur `http://localhost:8081` fonctionnent désormais sans blocage CORS. Sur Web local, le service économie appelle directement `processMatchRewardHttp` (qui gère CORS) sans passer par l'onCall qui est bloqué pour les origines non-HTTPS. Aucun impact sur la production ni sur le mobile.
- **Application immédiate des gains (Web local)** — après un appel CF en mode Web local, les coins/XP gagnés s'affichent maintenant immédiatement dans l'UI (correction d'un bug où l'écran restait sur les valeurs précédentes jusqu'au prochain snapshot Firestore).

---

## [2.5.5] - 2026-05-20

### Corrigé
- **Audio (Android)** — correction d'un crash fatal (`TypeError: Cannot read property 'catch' of undefined`) sur certains appareils Android (ex: Samsung Galaxy S24). Le watchdog de musique appelait `.catch()` directement sur le résultat de `play()`, qui peut retourner `undefined` sur expo-audio. Il utilise désormais `safePlayPlayer()` qui vérifie le type avant d'appeler `.catch()`.
- **Audio (Web Chrome iOS)** — l'autoplay audio est maintenant désactivé sur Chrome iOS (`CriOS`) en plus de Safari iOS, éliminant les erreurs `NotAllowedError` qui polluaient Sentry (31 events, 16 users).

---

## [2.5.4] - 2026-05-15

### Ajouté
- **Fin de match** — bouton 📺 `Voir une pub` apparu en bas de l'écran de résultat (solo et multi). Un clic crédite `+100 🪙` instantanément. Disponible une seule fois par match, pour tous les joueurs y compris premium.

### Modifié
- **Création de compte** — cadeau de bienvenue réduit de `1 000` à `300 coins`. Les joueurs existants ne sont pas affectés.
- **Cadeau du jour** — récompense quotidienne réduite de `300` à `200 coins`.
- **Panel Admin** — le menu latéral est désormais rétractable pour offrir plus d'espace sur les petits écrans.
- **Panel Admin (Publicités)** — ajout du défilement horizontal sur le tableau des publicités pour permettre de voir toutes les colonnes sans chevauchement.

---



### Corrige
- **Ligue des Cochons** - fermer le popup de passage de palier renvoie maintenant correctement vers l'ecran principal de recompenses, au lieu de laisser un fond vide.

### Modifie
- **Ligue des Cochons** - un premier grade `Debutant` apparait maintenant des le 1er cochon inflige. Ce palier donne uniquement le grade, sans debloquer de cadre, et tous les seuils suivants restent inchanges.
- **Main en jeu** - un menu `Trier` apparait maintenant au-dessus de l'avatar du joueur local pour reorganiser la main pendant la partie avec 3 modes : `Auto`, `Doubles`, `Somme`.
- **Options solo** - l'onglet `Infos` affiche desormais la difficulte des bots au-dessus du mode de jeu.
- **Bots solo** - les avatars des bots n'affichent plus de grade ni de cadre Ligue en mode solo.

---

## [2.5.2] - 2026-05-12

### Modifie
- **Ligue des Cochons** - la celebration de passage de palier est plus marquee : le jingle est maintenant suivi d'un `applause`, la modale reste ouverte jusqu'a une action explicite, et les boutons `Accueil` / `Continuer` encadrent mieux le moment de progression tout en conservant le partage social.
- **Fin de match** - le modal final du match ajoute maintenant une seconde couche sonore plus chaleureuse : `matchEnd` reste joue en premier, puis `applause` arrive `800 ms` plus tard pour mieux conclure la victoire.
- **Musique de fond** - la BGM a ete simplifiee a 2 contextes metier : une variante hors partie choisie une seule fois par session, une piste dediee en match, et le silence sur plusieurs ecrans utilitaires comme Profil, Parametres, Stats et Boutique.

---

## [2.5.1] - 2026-05-11

### Corrige
- **Mode Cochon** - le compteur `🐷` represente maintenant correctement les cochons infliges par le vainqueur uniquement. Les joueurs qui tombent a `0 etoile` ne gagnent plus de cochon par erreur et recoivent seulement le malus `-1 point`.
- **Partie bloquee / egalite** - en cas de redonne apres egalite, le prochain depart est maintenant reserve aux joueurs ex aequo, avec priorite au plus grand double parmi eux. Correction egalement d'un cas rare de modal de fin de round qui pouvait rester affiche sur un client en multijoueur.
- **Fin de match** - la sequence d'affichage entre resume de round/manche et modal final de match a ete fiabilisee. Le modal final n'apparait plus trop tot avant de disparaitre, et le son `matchEnd` est desormais synchronise avec le vrai modal final.

### Modifie
- **Ligue des Cochons (mobile)** - l'ecran `/ligue-cochons` a ete compacte pour rendre les classements plus lisibles : header reduit, navigation remontee en haut, lignes joueurs plus denses, et filtres de classement deplaces dans une colonne laterale compacte avec `Total / Perf` visible uniquement sur le filtre actif.
- **Audio gameplay** - la musique ne joue plus sur splash/login, les controles `Musique` et `Effets` sont separes en partie, et la lecture des sons de resultat a ete fiabilisee.

---

## [2.5.0] — 2026-05-08

### Ajouté
- **IA MÈTKAYALI (Niveau 4)** — nouveau niveau de difficulté "Maître Absolu" disponible en solo. Le bot utilise un moteur Monte-Carlo (500 simulations par coup) pour anticiper toute la suite de la partie, contre les 3 niveaux précédents qui ne regardaient qu'un coup à l'avance.
- **Bots adaptatifs** — la difficulté des bots s'adapte automatiquement au grade Ligue des Cochons du joueur. Le grade définit un niveau plancher (impossible de jouer en dessous), mais le joueur peut choisir un niveau supérieur comme défi. Les niveaux inférieurs au grade sont grisés dans le sélecteur.
- **Admin** — nouveau niveau 🧠 Mèt Kayali disponible dans le dropdown de création de bots (`/dashboard/bots`).

---

## [2.4.3] — 2026-05-08

### Ajouté
- **Tchat consommable** — les phrases et emojis payants s'achètent désormais en packs d'usages (ex : 50 envois pour 100 coins) plutôt qu'à vie. Le nombre d'envois restants est affiché directement dans la bulle de tchat. Les items gratuits restent illimités. L'admin peut configurer le nombre d'usages par achat depuis `/dashboard/chat`.

---

## [2.4.2] — 2026-05-08

### Corrigé
- **Ligue des Cochons** — harmonisation du grade affiché dans toute l'app. Auparavant le même joueur pouvait voir « Débutant » sur l'avatar de match, « Apprenti Boucher » sur la carte de partage et « Sans grade » dans le classement. Désormais le label est cohérent partout : « Sans grade » pour 0 cochon, puis les 8 paliers officiels (« Apprenti 1 » → « Légende du Grouin »).
- **Audio Safari iOS** — l'app ne lance plus d'erreur quand le navigateur Safari iOS refuse de jouer un son. Les SFX restent désactivés sur Safari iOS (limitation du navigateur, à fixer post-lancement avec un fallback WebAudio).

---

## [2.4.1] — 2026-05-06

### Ajouté
- **Partage social** — bouton « Partager ma victoire » en fin de match : génère une image (carte avec logo, nom du joueur, cochons infligés, rang) et l'ouvre dans la sheet de partage native (WhatsApp, Instagram, etc.). Bouton similaire au passage de palier Ligue des Cochons (carte grade capturée comme image).
- **Page Politique de confidentialité** — nouvelle page sur la landing page (`/politique-de-confidentialite`), accessible depuis le footer. Contient la procédure de suppression de compte (section dédiée), les droits RGPD, et les informations sur les données collectées. Requise par Google Play Console.

---

## [2.3.9] — 2026-05-06

### Ajouté
- **Notifications push** — l'app demande la permission au lancement et enregistre le token FCM dans Firestore. L'admin peut envoyer des notifications à tous les joueurs depuis `/dashboard/notifications` (nécessite un build EAS).

---

## [2.3.8] — 2026-05-06

### Ajouté
- **Sentry monitoring** — les crashs et erreurs JS sont désormais capturés automatiquement et visibles en temps réel sur le dashboard Sentry (`happy-agency.sentry.io`).

---

## [2.3.7] — 2026-05-06

### Ajouté
- **Pubs étendues** — les publicités admin-managed peuvent désormais apparaître dans 5 nouveaux écrans : Boutique, Vestiaire, Mes Stats, Classement et Ligue des Cochons. La pub s'affiche 2 secondes après l'ouverture de chaque écran, sans bloquer la navigation.
- **Admin** — 5 nouveaux placements disponibles dans le formulaire de création/édition d'une pub (`STORE`, `COLLECTION`, `STATS`, `LEADERBOARD`, `LIGUE`). L'admin peut aussi désigner une pub comme "Cadeau du jour" (🎁) depuis la liste.

---

## [2.3.6] — 2026-05-06

### Modifié
- **Cadeau quotidien** — les 300 coins journaliers ne sont plus accordés automatiquement. Un bouton "📺 Voir une pub → +300 🪙" s'affiche à l'accueil une fois par jour. Si une pub admin est programmée, elle passe en premier ; le bouton cadeau apparaît ensuite. Si aucune pub admin n'est disponible, une pub est quand même jouée avant le crédit.

## [2.3.5] — 2026-05-06

### Corrigé
- **Ligue des Cochons** — le popup de passage de palier s'affiche maintenant correctement en fin de match réel (flux de jeu complet).
- **Web** — le domino gagnant affiché en fin de partie correspond toujours à la partie en cours (état réinitialisé entre deux parties).

---

## [2.3.4] — 2026-05-05

### Modifié
- **Ligue des Cochons** — `/ligue-cochons` sépare désormais `Classement du mois` et `Classement global`, avec les mêmes catégories `+ Cochons / - Cochons / + Points`.
- **Aide** — les explications détaillées de la Ligue quittent la page Ligue et apparaissent maintenant dans un onglet `Ligue` du modal `Aide`.
- **Classements de Ligue** — les vues mensuelles utilisent maintenant des métriques réellement calculées sur le mois en cours (`matchs`, `cochons`, `cochons subis`, `points`).
- **Accueil** — les 3 blocs principaux (`Jouer`, `Actus`, `Ligue`) ont désormais une hauteur homogène pour un rendu plus propre selon les écrans.
- **Multijoueur** — une table vide créée par l’hôte peut maintenant être supprimée aussi depuis le lobby d’attente du jeu, pas seulement depuis les écrans de navigation.

---

## [2.7] — 2 Mai 2026

## [2.3.3] — 2026-05-04

### Modifié
- **Mes Stats** — le menu `Stats` devient `Mes Stats` pour marquer clairement qu'il s'agit du tableau de bord personnel.
- **Écran Stats** — ajout de 2 vues distinctes : `Ce mois-ci` par défaut et `Cumulé` en second.
- **Lisibilité produit** — séparation plus nette entre performance personnelle, classement global (`Rank`) et progression de Ligue.

---

## [2.3.2] — 2026-05-04

### Modifié
- **Ligue des Cochons** — l'écran `/ligue-cochons` devient le point d'entrée unique avec 3 tabs : `Ma Ligue`, `Classement`, `Infos`.
- **Accueil** — le bouton `(i)` du widget Ligue ouvre désormais la page Ligue au lieu d'un modal séparé.
- **Navigation** — suppression de `LeagueInfoModal` pour éviter les doublons entre popup et écran dédié.

---

### Dette technique
- **Tests — Firebase ESM** : mock global de `firebase/firestore`, `firebase/auth`, `firebase/storage`, `firebase/app` dans `jest.setup.js` — les 3 suites `useGameTimers`, `useGameEngine`, `IntegrationArchitecture` passent désormais sans erreur ESM.
- **Tests — GameHeader** : fichier de test réécrit pour correspondre à l'interface simplifiée du composant (3 props au lieu de 10 après la refonte R2-A5).
- **Tests — GameOverlays** : assertion `btn-quit` corrigée pour refléter le flow de confirmation en 2 étapes (btn-quit → btn-quit-confirm → onLeaveRoom).
- **Tests — useGameEngine** : mock `LogicEngine` complété avec `getForcedTieBreakDominoId` ajouté après le sprint précédent.
- **Résultat** : 51 tests, 6 suites, 0 échec.

---

## [2.6] — 2 Mai 2026

### Ajouté
- **Tchat dynamique** — Messages et emojis chargés depuis Firestore (admin-managed). Onglet Premium : achats définitifs en coins, badge ✓ après déblocage.
- **Classement Ligue** — 3 catégories : +Cochons (infligés), -Cochons (subis), +Points. Départage par nombre de matchs joués.

### Corrigé
- **Modal PARTIE BLOQUÉE** — Layout 3 colonnes : perdants à gauche/droite, gagnant au centre avec avatar et dominos.
- **Modal COCHON** — Doublon d'avatar du gagnant supprimé entre le titre et les cartes joueurs.

---

## [2.5] — 1er Mai 2026

### Ajouté
- **Suppression de compte** — Bouton dans Paramètres → onglet Compte, processus 2 étapes (avertissement + confirmation par email). Suppression définitive : profil, stats, économie, compte Firebase Auth. Conforme exigence Google Play 2024.

---

## [2.4] — 1er Mai 2026

### Ajouté
- **Onglet Historique en jeu** — Consultable depuis le menu Options pendant le match, sans interrompre la partie.

### Modifié
- **Modal CHIRÉ** — Bouton supprimé, passage automatique au round suivant (plus fluide).
- **Modal partie bloquée / égalité** — Refonte en cartes joueur côte à côte, dominos affichés verticalement pour une meilleure lisibilité.
- **Teaser de fin de round gagnant** — Version plus dramatique, mieux mise en valeur.
- **Teaser fin de round (mobile)** — Ajusté pour rester lisible sur petits écrans.
- **`/ligue-cochons`** — Compteur de progression repositionné pour ne plus chevaucher les paliers.

### Corrigé
- **Synchro economy / leaderboard (solo)** — Les gains et compteurs des parties solo authentifiées remontent désormais correctement dans le leaderboard.
- **STATISTIQUES DU MOIS** — Décompte correct des manches en 5 / 4 / 2 / 1 / -1 points.
- **Comptage des manches** — Toutes les manches sont maintenant comptabilisées (certaines étaient ignorées).
- **Mode Cochon — écran de fin** — Vue rendue scrollable, footer toujours accessible (correction du blocage apparent sur mobile).

---

## [2.3] — 25 Avril 2026

### Ajouté
- **Reset mot de passe** — Flow "Mot de passe oublié ?" sur l'écran de connexion : saisie email → lien Firebase envoyé → message de confirmation
- **Google Sign-In** — Intégration complète (masquée, sera activée au passage en test interne Google Play)
- **Universal Links WhatsApp Android** — Lien d'invitation cliquable (bleu) dans WhatsApp sur Android, ouvre directement la table. iOS prévu post-lancement.
- **Sidebar améliorée** — Avatar cliquable → Profil, icône Réglages → page paramètres complète (onglets Audio / Profil / Compte + bouton déconnexion)

### Corrigé
- **AdBannerModal** — Fallback image automatique si la vidéo publicitaire ne peut pas être lue
- **Sidebar** — Icônes Profil et Réglages pointaient vers la même page

---

## [2.2] — Avril 2026

### Ajouté
- **Ligue des Cochons** — Système de progression lifetime complet (4 paliers : 30/150/250/500 cochons infligés)
- **Cadres d'avatar animés** — Argent, Or, Diamant Néon, Feu (débloqués par palier)
- **Onglet Cochons dans le Leaderboard** — Classement par `cochonsGiven`
- **Code de table court** — 6 caractères (réduit depuis format long)
- **Lien d'invitation WhatsApp** — Deep-link avec code pré-rempli
- **Refonte UX Solo & Lobby** — Flow en 2 étapes (Choix du Mode → Configuration), cards 21% largeur

### Modifié
- **processMatchReward (Cloud Function)** — Incrémentation `cochonsGiven` + déblocage de palier Ligue
- **Leaderboard** — Tri par `cochonsGiven` sur l'onglet COCHONS

### Supprimé
- **Mode invité** — Supprimé définitivement du code client + comptes anonymes existants purgés

---

## [2.2.1] — 15 Avril 2026 — Patch : Bug Ligue des Cochons (leaguePoints = 0)

### Corrigé

#### 🐛 Bug majeur : `leaguePoints` toujours à 0 malgré des parties jouées

**Contexte :** Les comptes de test avaient tous `leaguePoints = 0` en Firebase.
La jauge "Cochons du mois" sur l'écran d'accueil affichait donc toujours 0.
Cause : triple chaîne de bugs dans la **collecte** des données. `ScoringEngine` et `RewardEngine` étaient corrects.

**Correction 1 — `GameScreen.tsx` ligne 366**
- ❌ `cochons: localPlayer.totalCochons` → champ ambigu = cochons **reçus** (malus)
- ✅ `cochons: localPlayer.totalCochonsInfliges` → compteur permanent cumulatif des cochons **infligés**,
  correctement incrémenté par `ScoringEngine` à chaque fin de manche

**Correction 2 — `GameOverScreen.tsx` ligne 78**
- ❌ `if (!isMancheOver && !isBoudé) return;`
  → Double-enregistrement : lors de la dernière manche (`MATCH_END`), `GameOverScreen` ET `GameScreen`
  appelaient tous deux `recordMatchResult()`, dupliquant les cochons comptabilisés
- ✅ `if ((!isMancheOver && !isBoudé) || isMatchOver) return;`
  → `GameOverScreen` = manches intermédiaires uniquement / `GameScreen` = MATCH_END exclusivement

**Correction 3 — `stats.service.ts` lignes 140–145**
- ❌ `economyService.setEconomy({ leaguePoints: stats.totalCochonsInflicted })` supprimé
  → Cette ligne **écrasait** Firebase avec le compteur local AsyncStorage (qui repart à 0 à chaque réinstallation)
- ✅ `leaguePoints` géré **exclusivement** par `RewardEngine` via `processServerReward()` dans `GameScreen`
  → Firebase est désormais la seule source de vérité, sans race condition possible

**Flux corrigé :**
```
ScoringEngine → cochonCount dans mancheHistory ✅
GameOverScreen → manches intermédiaires uniquement ✅
GameScreen (MATCH_END) → recordMatchResult(totalCochonsInfliges) + processServerReward() ✅
                       → RewardEngine → leaguePoints incrémenté correctement dans Firebase ✅
```

---

## [2.1] — Mars 2026

### Ajouté
- **HelpOverlay interactif** — Règles accessibles via le bouton "?" en jeu
- **Feedback sensoriel** — Shake avatar en cas de "Boudé"
- **Animations générales** — FlyingDomino, RewardOverlay, UnifiedResultOverlay, FadeInUp Leaderboard
- **Refonte UI Statistiques** — Layout paysage
- **Refonte UI Écran de Victoire** — Animation "Pluie de richesses"
- **Boutique & Cosmétiques** — Skins de table/dominos, inventaire hybride
- **Chat emoji** — Émoticônes prédéfinies en cours de partie
- **Volume BGM par défaut** — Réduit à 0.25/0.3 pour meilleur confort

### Modifié
- **GameScreen.tsx** — Refactor complet en Custom Hooks (`useGameEngine`, `useActionDispatcher`, `useTurnManager`, `useBotDecision`)
- **IA des Bots** — Refonte 3 niveaux : TI_MANMAY / MAPIPI / GRAN_MOUN + `BotService` Firestore

### Corrigé
- Désynchronisation multijoueur (host freeze en transition de round)
- Bug cascade timer/bots corrigé
- Boudé reste affiché longtemps chez les adversaires → résolu
- Double-attribution de score → résolu

---

## [2.0] — Février–Mars 2026

### Ajouté
- **Mode Manche** — Limite manche + Tie-breaker + Chiré fonctionnels
- **Mode Cochon** — Partie se termine sur quota de cochons atteint
- **Badges Cochon** — Comptage et affichage en jeu
- **Stats profil** — Enregistrement en fin de match (+1 victoire, points, cochons)
- **Fiabilisation Timer** — `turnMountedAtRef` centralisé, immunité 5s début de tour
- **Plein écran web mobile** — `unlockAudio()` au premier touch
- **Affichage numéro round/manche** — Avant le début de chaque partie

### Modifié
- **Architecture modulaire** — Séparation LogicEngine / useTurnManager / useActionDispatcher / useBotDecision
- **structuredClone** remplace `JSON.parse(JSON.stringify())` partout
- **Migration console.* → LogService** — 43 appels migrés

### Corrigé
- Bug domino initial en R1 (doit être le plus grand double)
- Bug raccord si domino double
- Garde-fou anti-boucle (Boudé TIE) — compteur max de re-deals
- Reset des étoiles centralisé dans ScoringEngine
- Rendu serpent déterministe (bug domino vertical corrigé)

---

## [1.0] — Janvier–Février 2026

### Ajouté
- **Projet initialisé** — React Native + Expo + Firebase
- **Authentification** — Firebase Auth (email)
- **Mode Solo** — 2 niveaux IA (débutant / intermédiaire)
- **Mode Multijoueur** — Tables publiques + tables privées (code/invitation)
- **Moteur de jeu complet** — Distribution Fisher-Yates, validation coups, sens anti-horaire
- **Système de score** — Étoiles, manches, cochons, chiré, Le Camion
- **127 tests unitaires** — 0% failure
- **Sécurité Firestore** — Rules pour rooms, bots, store, users
- **Cloud Function processMatchReward** — Validation économique côté serveur
- **Rotation des clés Firebase** — `.env` jamais versionné
- **Validation Zod** — Inputs utilisateur
- **Debounce updateGameState** — 300ms par roomId
- **Dashboard Admin** — Next.js (analytics, bans, bots, config, leaderboard, logs, notifications, players, store, tables, tournaments)

---

## Convention de versioning

- **Majeure (X.0)** : Refonte architecture ou fonctionnalité majeure
- **Mineure (X.Y)** : Nouveau bloc fonctionnel complet
- **Patch (X.Y.Z)** : Corrections de bugs et ajustements
## [2.3.1] — 2026-05-04

### Modifié
- **Ligue des Cochons** — la progression affichée est maintenant mensuelle et synchronisée entre l’accueil, `Ma Ligue` et l’écran Ligue.
- **Écran Ligue** — suppression des repères de jauge trompeurs ; affichage recentré sur les paliers du mois et les bonus en coins.
