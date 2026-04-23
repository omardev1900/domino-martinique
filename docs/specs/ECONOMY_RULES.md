# 💰 Économie et Progression — Les Règles du Domaine

Ce document explique en détail le fonctionnement du système de récompenses, d'expérience (XP), de leveling et de ligues dans le jeu de Domino Martiniquais. Ces règles sont gérées par le `RewardEngine`.

---

## 1. Monnaies et Ressources

Le jeu utilise plusieurs ressources pour quantifier la progression d'un joueur :

*   **🪙 Coins (Pièces)** : La monnaie de flux. Utilisée pour payer les Buy-ins (droits d'entrée) aux tables. Elle se gagne en jouant et en gagnant des matchs.
*   **⭐ XP (Expérience)** : Représente le temps de jeu et la réussite globale. L'XP ne se dépense pas, elle s'accumule pour faire monter le niveau du joueur.
*   **💎 Diamonds (Diamants)** : Monnaie premium obtenue lors d'exploits spécifiques (gagner un match, infliger un double cochon) ou en récompense de passage de niveau.
*   **🐷 Points de Ligue** : Totalisent les "Cochons" infligés aux adversaires. Ils définissent le Grade de Ligue du joueur.

---

## 2. Le Leveling (Niveaux)

### Fonctionnement de l'XP
*   L'XP est nécessaire pour passer au niveau supérieur.
*   La courbe de progression est **exponentielle** : chaque niveau demande plus d'XP que le précédent.
*   **Formule** : `XP requise pour le niveau N = XP_BASE × (CROISSANCE)^(N-1)`.
*   Le niveau maximum actuel est défini par `MAX_LEVEL` dans la configuration.

### Les Coffres de Niveau (`LevelUpChest`)
Lorsqu'un joueur franchit un niveau, il reçoit, en plus de ses gains de match normaux, un **Coffre de Niveau**.
*   Ce coffre contient un montant défini de Coins.
*   Certains niveaux plus avancés peuvent aussi récompenser avec des Diamonds.
*   *Bonus multiplicateur* : Plus le niveau d'un joueur est élevé, plus il dispose d'un **multiplicateur sur ses gains en Coins** lors d'un match gagnant (`COIN_MULTIPLIER_PER_LEVEL`).

---

## 3. Les Grades de Ligue

Le grade de Ligue n'est pas lié à l'XP ou au nombre de victoires, mais uniquement à la capacité du joueur à dominer ses adversaires, mesurée par les **Points de Ligue (Cochons infligés)**.

### Hiérarchie des Grades
1.  **APPRENTI** (Grade de départ)
2.  **MAITRE**
3.  **ROI**
4.  **LEGENDE** (Grade ultime)

*Le passage au grade supérieur se fait automatiquement lors d'une fin de match si les seuils de points (`LEAGUE_THRESHOLDS`) sont atteints.*

---

## 4. Calcul des Gains par Match (Le `RewardEngine`)

À la fin d'un match complet, le `RewardEngine` calcule l'ensemble des récompenses d'un joueur. 

### A. Gains par Manche
Pour chaque manche jouée, un joueur gagne des récompenses s'il est le vainqueur de cette manche :
*   **Victoire Simple** : Gain en Coins et XP de base.
*   **Bonus "Cochon" (Un seul joueur reste à 0 victoire)** :
    *   Le vainqueur gagne un bonus supplémentaire en Coins, XP, et accumule **des Points de Ligue**.
*   **Bonus "Double Cochon" (Deux joueurs restent à 0 victoire — Score : 3-0-0)** :
    *   Récompense magistrale : Grand bonus de Coins, d'XP, **des Diamants**, et beaucoup de **Points de Ligue**.

### B. Gains par Round
Chaque round remporté individuellement pendant le match octroie une petite somme cumulative de Coins et d'XP.

### C. Le Pot Final (Dépend des classements)
Le classement final (`Rank 1`, `Rank 2`, `Rank 3`) définit la distribution du pot commun.

**Mode Solo :**
*   Le vainqueur remporte un montant fixe (`SOLO_WIN_FLAT_REWARD`).

**Mode Multijoueur :**
*   Le pot est constitué des "Buy-ins" (frais de participation) de chaque joueur, moins une commission (le *Rake*).
*   **1ère Place (Vainqueur)** : Récupère la majorité du Pot en Coins, gagne l'XP de match maximum et remporte des **Diamonds**.
*   **2ème Place** : N'obtient souvent qu'un remboursement partiel en Coins selon la distribution, et gagne de l'XP de "participation".
*   **3ème Place** : Ne remporte aucun Coin du pot, mais reçoit l'XP de "participation".

### D. Cas du joueur "Cochonné"
Si un joueur perd une manche sans avoir obtenu aucune victoire (il finit "Cochon"), ses gains sont sanctionnés/réduits pour cette manche spécifique. Il ne gagne qu'un minimum vital d'XP et ne gagne aucun Coin pour cette manche.

---

*Le détail animé de toutes ces étapes ("Breakdown") est affiché ligne par ligne sur l'écran des résultats final via l'overlay des récompenses ("Rolling Counter").*
