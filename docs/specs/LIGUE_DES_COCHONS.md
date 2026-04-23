# 🐷 Ligue des Cochons — Spécifications Complètes

**Version :** 1.0  
**Statut :** ✅ Implémenté  
**Dernière mise à jour :** 14 avril 2026

---

## 1. Concept

La **Ligue des Cochons** est un **système de progression permanente** (non périodique) basé sur le **nombre total de cochons infligés** par un joueur au cours de toute sa carrière dans l'application.

> Un cochon = finir une manche avec 0 victoire. "Donner un cochon" = être le vainqueur de la manche qui a infligé ce statut à un ou deux adversaires.

**Ce n'est pas un classement hebdomadaire** — c'est une progression à vie, un **badge de prestige permanent**.

### Différences avec les autres classements

| Feature | Leaderboard XP | Leaderboard Coins | Ligue des Cochons |
|---|---|---|---|
| Type | Classement top 50 | Classement top 50 | **Progression personnelle** |
| Reset | Non | Non | **Non (lifetime)** |
| Récompense | Prestige | Prestige | **Cadres avatar + Coins** |
| Métrique | XP accumulé | Coins actuels | **Cochons donnés (lifetime)** |

---

## 2. Les Paliers (Niveau Boucher 🏆)

```
◇──────────🥈──────────────🥇──────────────┬──────────────🔥
0          30             150             250             500
       APPRENTI        MAÎTRE           ROI           LÉGENDE
```

### 🥈 Palier 1 — APPRENTI BOUCHER (30 cochons)
- **Cadeau :** Cadre Avatar Argent
- **Bonus :** +500 Pièces
- **Symbole :** Saucisse argentée 🌭

### 🥇 Palier 2 — MAÎTRE SAUCISSIER (150 cochons)
- **Cadeau :** Cadre Avatar Or
- **Bonus :** +2 000 Pièces
- **Symbole :** Saucisse en or ✨

### 💎 Palier 3 — ROI DU BOUDIN (250 cochons)
- **Cadeau :** Cadre Avatar Diamant Néon
- **Bonus :** +5 000 Pièces
- **Symbole :** Couronne diamant 👑

### 🔥 Palier 4 — LÉGENDE DU GROIN (500 cochons)
- **Cadeau :** Cadre Avatar "Ultimate Fire"
- **Bonus :** +10 000 Pièces
- **Symbole :** Cochon diamant 🐖

---

## 3. Mécanique de jeu

### 3.1 Comment compter les cochons donnés

Un joueur gagne +1 `cochonsGiven` quand **il est vainqueur d'une manche** et qu'il y a **au moins 1 cochon** (joueur avec 0 victoire). Si 2 cochons dans la manche, le vainqueur gagne **+2 `cochonsGiven`**.

> ⚠️ On compte les cochons **infligés** (donnés), pas les cochons **reçus**.

### 3.2 Règles de déclenchement

- Calcul fait en **fin de manche**, côté serveur (Cloud Function `processMatchReward`)
- La progression est **cumulée à vie** dans le document Firestore du joueur
- Chaque palier n'est **débloqué qu'une seule fois** (pas de réinitialisation)
- Si un joueur passe directement de 0 à 160 cochons, il reçoit **les deux premiers paliers** en cascade

### 3.3 Structure Firestore (joueur)

```typescript
// Dans la collection `users/{uid}`
{
  cochonsGiven: number,        // Compteur lifetime (ex: 42)
  leagueGrade: LeagueGrade,    // Grade actuel ('APPRENTI' | 'MAITRE' | 'ROI' | 'LEGENDE' | null)
  unlockedFrames: string[],    // Cadres débloqués ['frame_argent', 'frame_or', ...]
  activeFrame: string | null,  // Cadre actif affiché sur l'avatar
}
```

---

## 4. Cadres d'Avatar

Les cadres sont des **bordures animées** superposées à l'avatar du joueur. Ils s'affichent :
- Dans le **profil** du joueur
- Sur la **table de jeu** (autour de l'avatar de la zone joueur)
- Dans le **leaderboard** (à côté du rang)
- Dans le **lobby** de la salle d'attente

| ID | Grade | Style visuel | Animation |
|---|---|---|---|
| `frame_argent` | APPRENTI | Bordure argentée classique | Reflet léger |
| `frame_or` | MAÎTRE | Bordure or avec arabesques | Scintillement |
| `frame_diamant` | ROI | Bordure diamant / cristal néon | Pulsation bleue |
| `frame_feu` | LÉGENDE | Flammes animées orange/rouge | Boucle feu |

---

## 5. Notes de conception

### ✅ Points forts
- Les paliers sont **bien espacés** (croissance exponentielle : 30 → 150 → 250 → 500)
- Les récompenses (cadres + coins) donnent envie de progresser
- Le concept de cadre avatar est **viral** : visible par les autres joueurs en partie

### ⚠️ Points à surveiller

1. **Seuil du palier 3 à 250** : Le gap ROI (250) est proche de MAÎTRE (150). Envisager de le passer à **300** pour la V2.

2. **`cochonsGiven` vs `leaguePoints`** : La base de code utilise `leaguePoints` comme alias. Ces deux champs doivent rester synchronisés ou être unifiés.

3. **Classement vs Progression** : Le leaderboard "Cochons" classe les joueurs par score, mais la Ligue est une progression individuelle. L'UI doit bien distinguer les deux concepts.
