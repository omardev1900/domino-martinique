# 🎲 GAME_RULES — Règles officielles du Domino Martiniquais

> **Source de vérité unique** pour toutes les règles du jeu.  
> Toute implémentation dans `LogicEngine`, `ScoringEngine`, ou `GameScreen` doit s'y conformer.

**Dernière mise à jour :** 14 avril 2026

---

## 1. Lexique Technique

| Terme | Variable Technique | Définition |
|:---|:---|:---|
| **Round / Partie** | `Round` | Unité de base. Commence avec 7 dominos/joueur. Finit par un gagnant ou un bloqué. |
| **Point de Round** | `totalRoundWins` | Compteur permanent. Chaque victoire de partie donne +1 point au score général. |
| **Étoile** | `currentMancheStars` | Compteur temporaire (0 à 3). Représente l'avancement dans la manche en cours. |
| **CD / DP / CP** | `playerCD` | Cumul Domino / Points Dominos. Somme des points restants en main à la fin d'un round. |
| **Chirée** | `isChire` | État de reset de la manche (score 1-1-1, 2-1-1, 2-2-1). |
| **Manche** | `Manche` | Une suite de rounds. Se termine par une Victoire (3 étoiles) ou une Chirée. |
| **Couronne** | `mancheWins` | Victoire globale d'une manche. |
| **Cochon** | `cochonTrophy` | Trophée/malus attribué lors d'une victoire de manche sur un joueur à score zéro. |
| **Le Camion** | `totalMatchPoints` | Le score total final (RoundWins + Bonus Cochon - Malus). C'est le juge de paix. |
| **Boudé** | — | Joueur sans coup valide, qui passe son tour pour ce round. |

---

## 2. Configuration du jeu

- Jeu de dominos **double-six** (28 pièces : de 0–0 à 6–6)
- **3 joueurs**
- Chaque joueur reçoit **7 dominos**
- Les **7 dominos restants sont écartés** (talon invisible — jeu sans pioche)
- Sens de jeu : **anti-horaire**

---

## 3. Détermination du joueur de départ

- **Première partie d'une manche :** Le joueur possédant le **double le plus élevé** commence.
- Si aucun double n'est détenu, celui avec la **somme de points la plus élevée** commence.
- **Parties suivantes dans la manche :** Le vainqueur du round précédent commence avec **n'importe quel domino** de son choix.

---

## 4. Règles de pose

### 4.1 Plateau vide
- Tout domino peut être joué en premier.

### 4.2 Plateau en cours
- Un domino est jouable si **au moins une de ses valeurs correspond** à une extrémité ouverte du plateau.
- Le domino est **automatiquement orienté** pour correspondre à l'extrémité choisie.
- Le joueur peut choisir de poser à **gauche ou à droite** du plateau.

---

## 5. Timer et tour automatique

- Chaque joueur dispose d'un **temps limité par tour**.
- Si le temps est écoulé et qu'un coup est possible → un domino valide est **joué automatiquement**.
- Si aucun coup n'est possible → le joueur **passe son tour** automatiquement.
- Immunité de **5 secondes** au début de chaque tour (anti-double-action).

---

## 6. Joueur "Boudé"

- Lorsqu'un joueur ne peut poser **aucun domino valide**, il **passe son tour**.
- Il est considéré comme **boudé** pour ce tour uniquement.

---

## 7. Blocage de la partie

La partie est déclarée **bloquée** lorsque tous les joueurs sont boudés consécutivement.

- Le joueur avec la **plus petite somme** (`playerCD`) des dominos en main remporte la partie.
- **Cas d'égalité parfaite** : La partie est déclarée **nulle**. Elle n'est pas comptabilisée et une nouvelle partie démarre (nouvelle donne).
- Un garde-fou limite le nombre de re-deals pour éviter les boucles infinies.

---

## 8. Fin de round — Priorités d'évaluation

À la fin de chaque round, le `ScoringEngine` exécute les vérifications dans cet ordre :

1. **Attribution :** Le gagnant reçoit **+1 Étoile** et **+1 Point de Round**.
2. **Priorité 1 — Détection de la Chirée :**
   - Si **TOUS** les joueurs ont désormais ≥1 Étoile (ex: 1-1-1, 2-1-1, 2-2-1).
   - **Action :** Reset immédiat de TOUTES les Étoiles à 0. La manche repart à zéro. Aucun bonus attribué.
3. **Priorité 2 — Détection de Victoire de Manche :**
   - Si un joueur atteint **3 Étoiles** (et que la priorité 1 n'est pas remplie).
   - **Action :** Fin de la manche → calcul des bonus Cochon.

> **Note :** Les Points de Round (`totalRoundWins`) sont acquis définitivement dès la fin d'un round, même si la manche finit en Chirée.

---

## 9. Système de score et Cochon

Une manche se termine TOUJOURS avec au moins un adversaire à 0 étoile (sinon il y aurait eu Chirée).

### Calcul des points de manche

| Score Final | Points de Round | Bonus Cochon | Points Match | Trophées |
|:---|:---|:---|:---|:---|
| **3 - 0 - 0** | 3 | +2 | **5 Points** | 2 Cochons |
| **3 - 1 - 0** | 3 | +1 | **4 Points** | 1 Cochon |
| **3 - 2 - 0** | 3 | +1 | **4 Points** | 1 Cochon |

### Malus Cochon
- Tout joueur terminant une manche avec **0 étoile** subit un malus de **-1 point** sur son `totalMatchPoints` global.

### Chiré (pas de cochon)
- Si la manche se termine par Chirée (score 1-1-1) : **aucun point de manche** (+4/+5) n'est attribué. C'est un match nul technique pour la manche.

---

## 10. Modes de match

| Mode | Condition de fin | Gagnant |
|---|---|---|
| **Mode Manche** | Après N manches jouées (défini par l'hôte) | Joueur avec le `totalMatchPoints` le plus élevé |
| **Mode Score** | Quand un joueur atteint le score cible | Premier à dépasser le seuil |
| **Mode Cochon** | Quand le quota total de cochons est atteint | Joueur avec le plus de cochons infligés |

### Égalité au score final (Le Camion)
En cas d'égalité parfaite du `totalMatchPoints` entre deux joueurs à la fin d'un match, une **manche supplémentaire complète** est disputée pour les départager.

---

## 11. Tournois

### Format Manches
- Le tournoi se termine après un **nombre prédéfini de manches jouées**.

### Format Points
- Le tournoi se termine lorsqu'un joueur atteint un **nombre cible de points**.

### Vainqueur du tournoi
- Le vainqueur est le joueur avec le **plus grand nombre de points** à la fin du tournoi.
- En cas d'égalité :
  1. Delta entre le nombre de cochons **donnés** et de cochons **pris**
  2. Nombre de cochons **infligés** (donnés)

---

## 12. Feedback audio (SFX)

| Événement | Son | Description |
|:---|:---|:---|
| **Cochon infligé 🐷** | `toktok.mp3` | Cri ou jingle distinctif |
| **Chiré 🔄** | `pops.mp3` | Son de "balayage" ou reset |
| **Victoire Round** | `win.mp3` | Son court et gratifiant |
| **Boudé / Égalité** | `notify.mp3` | Son de blocage |
| **Pose de Domino** | `clack1/2/3.mp3` | Bruit sec de bois/résine |
| **Démarrage de partie** | `start-game.mp3` | Signal sonore d'ouverture |
| **Alerte timer (<5s)** | `timer.mp3` | Son d'urgence |
| **Fin de timer** | `end_time.mp3` | Son d'expiration |
| **Nouvelle manche** | `distribute.mp3` | Son de mélange/distribution |

---

## 13. Cas particuliers

- **Égalité de CD** : En cas d'égalité parfaite du Cumul Domino entre les deux plus petits scores → partie nulle. Personne ne gagne de point ni d'étoile. La partie est rejouée.
- **Persistance Round** : Les Points de Round sont acquis définitivement dès la fin du round, même si la manche finit en Chirée.
- **Anti-boucle** : Un compteur maximum de re-deals est implémenté pour éviter les boucles infinies sur boudé + égalité.
