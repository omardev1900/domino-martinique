## **Application mobile – Domino martiniquais**

**1\. Objectif produit (V1)**  
Créer une **application mobile de domino martiniquais**, fluide et monétisable, permettant :

* de jouer **en solo** contre une IA,  
* de jouer **en multijoueur à 3 joueurs** (tables publiques ou privées),  
* de créer une **communauté** (comptes, classement, tournois simples),  
* de générer des **revenus dès la V1** (pubs / premium).

V1 \= **plaisir de jeu \+ stabilité \+ time-to-market**

**2\. Plateformes & technologie**

* **Mobile :** Android \+ iOS  
* Backend temps réel (parties, scores, classements)

**3\. Design & UX (V1)**  
**Ligne directrice**

* **2D premium** (pas de 3D lourde)  
* Interface claire, rapide, lisible sur mobile  
* Ambiance antillaise subtile (couleurs, motifs, sons)

**Éléments visuels**

* Table de jeu 2D (vue du dessus)  
* Dominos stylisés (plats, lisibles)  
* Animations légères :  
  * pose du domino  
  * fin de manche  
* Sons discrets (pose, victoire)

**4\. Règles du jeu – Domino martiniquais**

* **3 joueurs**  
* 7 dominos par joueur  
* 7 dominos écartés (talon invisible)  
* Départ : Double le plus élevé, sinon somme la plus élevée  
* Partie bouchée : victoire au joueur avec le moins de points  
* Comptage traditionnel

Terminologie intégrée : *Cochon, Fany*

**5\. Modes de jeu**  
**5.1 Mode Solo**

* 2 IA à 2 niveaux : Débutant, Intermédiaire  
* IA basée sur règles simples (pas de calcul probabiliste avancé)

**5.2 Mode Multijoueur (temps réel)**  
**Tables publiques**

* Matchmaking automatique  
* 3 joueurs

**Tables privées**

* Création de table  
* Code ou lien à partager  
* Accès sur invitation

**6\. Comptes joueurs & données**

* Inscription simple (email ou guest évolutif)  
* Profil joueur : pseudo, avatar  
* Statistiques :  
  * parties jouées  
  * victoires  
  * défaites  
  * points cumulés  
  * nombre de cochons

**7\. Classements (Leaderboard)**

* Classement global  
* Classement hebdomadaire  
* Classement tournois

**8\. Chat & interactions (léger)**

* **Pas de texte libre**  
* Système d’émoticônes prédéfinies.  
* Messages courts prédéfinis (FR / créole simple)

Zéro modération nécessaire.

**9\. Tournois – V1 simplifiée**

* Tournois automatiques  
* Format simple : élimination directe  
* Inscription ouverte  
* Classement \+ vainqueur  
* Récompense virtuelle (badge, points)

**10\. Monétisation (V1)**  
**Publicités**

* Interstitielles (fin de partie)  
* Vidéos récompensées (bonus cosmétiques)  
* Sponsoring B2B local

**Premium (achat unique ou abonnement)**

* Suppression des pubs  
* Accès prioritaire aux tournois  
* Avatars / thèmes exclusifs

**11\. Hors scope V1 (clairement exclu)**

* Graphismes 3D  
* IA experte probabiliste  
* Chat texte libre  
* Saisons complexes  
* Tournois avancés avec cash-prize

**12\. Planning estimatif**

* Conception & UX : 1–2 semaines  
* Développement core jeu : 3–4 semaines  
* Multijoueur \+ backend : 2–3 semaines  
* Tests & ajustements : 1 semaine

# **PRD V1 – Règles officielles du jeu**

## **1\. Configuration du jeu**

* Jeu de dominos **double-six** (28 pièces : de 0–0 à 6–6)  
* **3 joueurs**  
* Chaque joueur reçoit **7 dominos**  
* Les **7 dominos restants sont écartés** et ne sont pas utilisés durant la partie  
   *(jeu sans pioche)*

## **2\. Détermination du joueur de départ**

* Le joueur possédant le **double le plus élevé** commence la partie.  
* Ce joueur pose le premier domino.  
* Si aucun joueur ne possède de double, celui ayant la **somme de points la plus élevée** commence.

Cette règle s’applique **à chaque nouvelle partie** incluant une manche ou un tournoi.

Cette règle s’applique que pour la première partie d’une manche. Ensuite c’est la personne qui a gagné qui commence avec n’importe quel domino, le domino de son choix.

## **3\. Déroulement de la partie**

* Les joueurs jouent **chacun leur tour**  
* Le sens de jeu est **anti-horaire**  
* Un joueur peut poser un domino soit à gauche soit à droite du plateau

## **4\. Règles de pose des dominos**

### **4.1 Plateau vide**

* Tout domino peut être joué en premier.   
  La première partie c’est celui qui a le plus gros double ensuite c’est celui qui a gagné la partie précédente.

### **4.2 Plateau en cours**

* Un domino est jouable si **au moins une de ses valeurs correspond** à une extrémité ouverte du plateau.  
* Le domino est automatiquement orienté pour correspondre à l’extrémité choisie.

## **5\. Temps de jeu**

* Chaque joueur dispose d’un **temps limité par tour**.  
* Si le temps est écoulé et un coup est possible, un domino valide est joué automatiquement, sinon, le joueur passe son tour.

## **6\. Joueur “boudé”**

* Lorsqu’un joueur ne peut poser **aucun domino valide**, il passe son tour.  
* Il est alors considéré comme **boudé** pour ce tour.

## **7\. Blocage de la partie (“Boudé”)**

La partie est déclarée **bloquée** lorsque :

* aucun joueur ne peut poser de domino,   
* ou lorsque tous les joueurs sont boudés.

### **7.1 Résolution du blocage**

* Le joueur ayant la **plus petite somme** des points des dominos restants dans sa main remporte la partie.  
* En cas d’égalité parfaite entre plusieurs joueurs, une **nouvelle partie est immédiatement relancée**.

## **8\. Victoire d’une partie**

Une partie est remportée lorsqu’un joueur :

* **vide entièrement sa main**,  
   ou  
* gagne suite à un **blocage**, en ayant le plus faible total de points.

Le vainqueur obtient **1 victoire**.

## **9\. Manche**

Une **manche** est composée de plusieurs parties.

### **Fin de manche**

* Une manche se termine lorsqu’un joueur atteint **3 victoires**.

Le joueur ayant atteint ce seuil est déclaré **vainqueur de la manche**.

## **10\. Système de points et “Cochon”**

* Un joueur ayant **0 victoire** à la fin d’une manche est déclaré **“Cochon”**.  
* **Si 1 cochon** : le vainqueur de la manche gagne **\+4 points**  
* **Si 2 cochons** : le vainqueur de la manche gagne **\+5 points**  
* Chaque joueur “cochon” reçoit **–1 point**

Les points sont ajoutés au **total général** du joueur.

## **11\. Tournois (V1)**

Deux formats sont proposés :

### **Format Manches :** 

* Le tournoi se termine après un **nombre prédéfini de manches jouées**.

### **Format Points :** 

* Le tournoi se termine lorsqu’un joueur atteint un **nombre cible de points**.

### **Vainqueur du tournoi**

* Le vainqueur est le joueur ayant le **plus grand nombre de points** à la fin du tournoi.  
* En cas d’égalité :  
  1. delta entre le nombre de cochons données et de cochons pris  
  2. nombre de cochons infligés

