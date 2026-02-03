# Roadmap Projet : Domino Martiniquais (V1)
**Version :** 1.0
**Lead Dev :** Omatrice
**Objectif :** Application mobile native de Domino (règles martiniquaises, 3 joueurs) stable, plaisante et monétisable.

---

## 📅 Phase 1 : Architecture & Choix Techniques
**Objectif :** Définir les fondations pour éviter la dette technique.
**Focus :** Stabilité et compatibilité Cross-Platform (iOS/Android).

* **1.1 Sélection de la Stack :**
    * Validation du Framework Frontend : **React Native** (pour la perf native).
    * Choix du Backend Temps Réel : Firebase (Firestore/Realtime DB).
* **1.2 Modélisation des Données (Schema Design) :**
    * Structure de l'objet `GameRoom` (ID, état, joueurs, dominos posés).
    * Structure de l'objet `Player` (Main, Score, Statut "Cochon").
* **1.3 Configuration de l'environnement :**
    * Setup du repo Git.
    * Configuration CI/CD basique (GitHub Actions) pour builds auto (Android/iOS).

> **Prompt associé :** "Architecture et Stack Technique"

---

## 🧩 Phase 2 : Moteur de Jeu (Logique Pure)
**Objectif :** Coder les règles du jeu sans interface graphique (Test-Driven Development recommandé).
**Focus :** Respect strict des règles martiniquaises.

* **2.1 Algorithme de Distribution :**
    * Mélange aléatoire.
    * Distribution : 7 par joueur, 7 au talon (morts).
* **2.2 Validation des Coups :**
    * Détection du premier joueur (Plus gros double ou plus grosse somme).
    * Vérification de la compatibilité des extrémités (matching numbers).
* **2.3 Gestion du "Boudé" (Blocage) :**
    * Détection automatique de l'impossibilité de jouer.
    * Algorithme de victoire sur blocage : Calcul des points en main (le plus petit total gagne).
    * Gestion de l'égalité sur blocage (Partie nulle/relancée).
* **2.4 Système de Score & Manches :**
    * Comptage des victoires (0 à 3).
    * Attribution des statuts (Vainqueur, Cochon).
    * Calcul des points de classement (+4/+5 points selon le nombre de cochons).

> **Prompt associé :** "Algorithme et Logique Métier"

---

## 🎨 Phase 3 : UX/UI & Design System (Omatrice Style)
**Objectif :** Une interface lisible, "Premium 2D", avec une touche antillaise.
**Focus :** Ergonomie sur petit écran à 3 joueurs.

* **3.1 Wireframing (Vue du dessus) :**
    * Disposition de la table pour 3 joueurs (Sud = Joueur, Nord-Est & Nord-Ouest = Adversaires).
    * Gestion du "Serpent" de dominos (courbes automatiques pour rester à l'écran).
* **3.2 Identité Visuelle :**
    * Palette de couleurs : Ambiances tropicales mais sobres (lisibilité avant tout).
    * Intégration branding **Omatrice** (ex: Logo discret sur le tapis ou dos des dominos).
* **3.3 Feedback Utilisateur :**
    * Animations : Pose de domino, Pioche (si applicable/visuelle), "Passe son tour".
    * Indicateurs visuels : "À qui le tour ?", "Temps restant".

> **Prompt associé :** "Design de l'interface et Wireframes"

---

## 🌐 Phase 4 : Backend & Multijoueur
**Objectif :** Rendre le jeu jouable en ligne sans latence perceptible.
**Focus :** Synchronisation et gestion des déconnexions.

* **4.1 Gestion des Salles (Rooms) :**
    * Création de table (Publique / Privée avec code).
    * Rejoindre une table.
* **4.2 Synchronisation Temps Réel :**
    * Envoi des coups (Move) au serveur.
    * Broadcast de la mise à jour du plateau aux 3 clients.
* **4.3 Gestion des Cas Limites :**
    * Timeout (Joueur trop lent) -> Auto-play ou "Passe".
    * Déconnexion sauvage -> Remplacement par un BOT (IA niveau 1) pour finir la partie.

> **Prompt associé :** "Logique Serveur et Matchmaking"

---

## 💰 Phase 5 : Monétisation & Polish (V1.0)
**Objectif :** Préparer la sortie commerciale.
**Focus :** Rétention et Revenus.

* **5.1 Intégration Publicitaire :**
    * Configuration AdMob / Unity Ads.
    * Placement : Interstitiel (Fin de manche uniquement), Bannière (Menu principal, pas en jeu).
* **5.2 Achats In-App (IAP) :**
    * Produit "Premium" : No-Ads.
* **5.3 Sound Design :**
    * Bruitage "Clac" du domino réaliste.
    * Jingle victoire/défaite.
    * Voix ou son spécifique pour le "Cochon".
* **5.4 Polissage :**
    * Haptic Feedback (Vibrations) lors de la pose.
    * Écran de fin de partie récapitulatif (Score, qui est Cochon, etc.).

> **Prompt associé :** "Intégration Monétisation et Finition"

---

## 🚀 Phase 6 : Lancement (Go-to-Market)
**Objectif :** Publication sur les Stores.

* **6.1 Assets Store :**
    * Icône de l'app.
    * Screenshots (Mise en avant du mode 3 joueurs et règles antillaises).
    * Description SEO (Mots clés : Domino, Martinique, Guadeloupe, Double-Six).
* **6.2 Tests Beta :**
    * TestFlight (iOS) et Google Play Console (Test interne).
* **6.3 Publication.**

---

## 🔮 Phase Future (V1.1+) - Hors Périmètre Actuel
* Tournois automatisés.
* Mode "Saison" avec classement mensuel.
* Chat avec phrases pré-enregistrées (Créole/Français).
* Personnalisation avancée (Skins de dominos).