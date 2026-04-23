# 🧠 Spec Technique — Bot MÈTKAYALI (Niveau 4 : Maître Absolu)

> **Objectif :** Ajouter un 4ᵉ niveau de difficulté IA au jeu de domino martiniquais, nettement supérieur au GRAN_MOUN actuel. Le bot MÈTKAYALI utilise le comptage de tuiles, la simulation Monte-Carlo, la prédiction de blocage et l'adaptation dynamique pour maximiser son taux de victoire.

**Dernière mise à jour :** 23 avril 2026
**Statut :** 🟡 En attente d'implémentation

---

## 📋 Résumé des 4 niveaux IA

| Niveau | Nom créole | Stratégie | Profondeur |
|--------|-----------|-----------|------------|
| 1 | **TI_MANMAY** (l'enfant) | Aléatoire pur | 0 |
| 2 | **MAPIPI** (le malin) | Heuristique simple (poids + doubles + continuité) | 1 |
| 3 | **GRAN_MOUN** (le sage) | Heuristique avancée (7 principes, clé, blocage basique) | 1 |
| 4 | **METKAYALI** (le maître absolu) | Monte-Carlo + comptage parfait + adaptation | N (toute la partie) |

---

## 🏗️ Architecture — 4 couches de raisonnement

### Couche 1 : Comptage Parfait des 28 Tuiles (TileTracker)

Le jeu martiniquais = **28 tuiles** (0|0 à 6|6), 3 joueurs × 7 tuiles + 7 au talon mort.

**Principe :** À chaque instant, le bot maintient une matrice de probabilités pour chaque tuile inconnue.

```
Pour chaque tuile des 28 :
  - JOUÉE sur la table          → statut = PLAYED   (certitude 100%)
  - DANS MA MAIN                → statut = MINE     (certitude 100%)
  - CHEZ adversaire A ou B      → probabilité calculée
  - AU TALON MORT               → probabilité calculée
```

**Mise à jour progressive :**
- **Initialisation :** Chaque tuile inconnue a une chance uniforme d'être chez A, B ou au talon
- **Quand un adversaire PASSE :** Toutes les tuiles contenant les valeurs actuelles de la table sont éliminées de son pool → les probabilités se concentrent
- **Quand un adversaire JOUE :** La tuile jouée est retirée et les probabilités sont recalculées
- **Calcul des contraintes :** Si on connaît le nombre de tuiles restantes d'un adversaire (visible à l'écran), on contraint davantage la distribution

**Structure de données :**
```typescript
interface TileTracker {
  // Pour chaque tuile (clé = id de la tuile)
  tileStates: Map<string, TileState>;
  
  // Pour chaque adversaire : ensemble des valeurs qu'il ne peut PAS jouer
  excludedValues: Map<string, Set<number>>;
  
  // Nombre de tuiles restantes par joueur (visible à l'écran)
  handSizes: Map<string, number>;
}

type TileState = 
  | { status: 'PLAYED' }
  | { status: 'MINE' }
  | { status: 'UNKNOWN'; probabilities: Map<string, number> };
  // probabilities : playerId → probabilité d'être chez ce joueur (incluant 'talon')
```

**Exemple concret :**
> Le bot a [3|5], [5|6], [5|2], [5|0] en main. Il voit 3 autres "5" joués sur la table (7 tuiles contiennent un 5 dans le jeu complet). Il en contrôle 4 et 3 sont jouées. **Il ne reste qu'un seul "5" entre les 2 adversaires et le talon** → il domine totalement cette valeur.

---

### Couche 2 : Simulation Monte-Carlo (MonteCarlo)

Au lieu de scorer un coup avec des heuristiques statiques (comme GRAN_MOUN qui évalue uniquement le coup présent), le bot **simule l'avenir complet de la partie**.

**Algorithme :**
```
Pour chaque coup valide du bot :
  Répéter N fois (N = 500 à 1000) :
    1. Distribuer aléatoirement les tuiles inconnues aux adversaires et au talon
       → En respectant les CONTRAINTES de la Couche 1 :
         - Exclure les valeurs passées par chaque adversaire
         - Respecter le nombre de tuiles restantes de chaque joueur
    2. Simuler la suite complète de la partie :
       → Les adversaires jouent en mode GRAN_MOUN (heuristique existante)
       → Le bot joue en mode GRAN_MOUN pour les coups suivants
    3. Enregistrer le résultat :
       - Victoire (main vidée en premier) → +1
       - Boudé gagné (score le plus bas) → +0.7
       - Boudé perdu → -0.5
       - Défaite → -1
    4. Si Boudé : enregistrer aussi le score de la main restante
       
  Calculer :
    - win_rate = victoires / N
    - avg_boude_score = moyenne des scores en cas de boudé
    
→ score_final = 0.7 × win_rate + 0.3 × (1 - avg_boude_score / max_possible_score)
→ Jouer le coup avec le meilleur score_final
```

**Optimisation performance mobile :**
- 500 simulations × ~10 coups par partie × 3 joueurs = ~15 000 opérations
- Chaque opération = accès tableau + comparaison simple → **~30-80ms sur smartphone moderne**
- Si le temps dépasse 100ms, réduire N dynamiquement
- Mode rapide pour fin de partie (< 3 tuiles en main) : N réduit à 200

**Pourquoi c'est dévastateur :**
- GRAN_MOUN évalue **uniquement le coup actuel** (profondeur 1)
- MÈTKAYALI évalue **toute la suite de la partie** (profondeur totale)
- Il détecte les pièges à 3-4 coups d'avance que GRAN_MOUN ne voit pas
- Il choisit le coup qui maximise ses chances sur l'ensemble des distributions possibles

---

### Couche 3 : Stratégie de Blocage Prédictif (EndgameAnalyzer)

Le bot évalue en permanence **la probabilité que la partie finisse en Boudé** et adapte sa stratégie.

**Détection du risque de Boudé :**
```typescript
// Heuristique de risque de blocage
const boudeRisk = calculateBoudeRisk(gameState, tileTracker);

function calculateBoudeRisk(state, tracker): number {
  let risk = 0;
  
  // 1. Nombre de valeurs "mortes" (7+ tuiles connues pour cette valeur)
  for (let v = 0; v <= 6; v++) {
    const known = countKnownTilesWithValue(v, state, tracker);
    if (known >= 7) risk += 0.15;       // Valeur morte
    else if (known >= 6) risk += 0.08;  // Valeur quasi-morte
  }
  
  // 2. Historique récent de passes
  const recentPasses = state.history.slice(-6).filter(h => h.action === 'PASS').length;
  risk += recentPasses * 0.08;
  
  // 3. Peu de tuiles restantes en main pour tous les joueurs
  const avgHandSize = state.players.reduce((s, p) => s + p.hand.length, 0) / state.players.length;
  if (avgHandSize <= 3) risk += 0.10;
  
  return Math.min(risk, 1.0);
}
```

**Adaptation de stratégie :**
```
Si boudeRisk > 0.5 :
  → Mode "SCORE MINIMUM"
  → Monte-Carlo pondère davantage avg_boude_score (0.4 × win_rate + 0.6 × boude_safety)
  → Priorité : vider les tuiles lourdes (doubles 6, 5, 4)
  
Si boudeRisk < 0.2 :
  → Mode "CONTRÔLE DE TABLE"
  → Monte-Carlo pondère davantage win_rate (0.8 × win_rate + 0.2 × boude_safety)
  → Garder les tuiles qui dominent les extrémités
  → Forcer les passes adverses
```

**Timing optimal des doubles :**
```
Double lourd + début de partie + boudeRisk faible → GARDER (potentiel de blocage offensif)
Double lourd + début de partie + boudeRisk élevé → JOUER (se débarrasser des points)
Double lourd + fin de partie + adversaire sans cette valeur → JOUER (blocage immédiat)
```

---

### Couche 4 : Adaptation Dynamique (OpponentModeler)

Le bot profile chaque adversaire en temps réel pendant la partie.

**Structure du profil :**
```typescript
interface OpponentProfile {
  playerId: string;
  
  // Valeurs que l'adversaire ne peut PAS jouer (déduit des passes)
  excludedValues: Set<number>;
  
  // Tuiles probablement en main (reconstruction par élimination)
  likelyTiles: Domino[];
  
  // Nombre de tuiles restantes (visible à l'écran)
  handSize: number;
  
  // Pattern de jeu observé
  playsDoubleFirst: boolean;    // Tend à poser ses doubles tôt
  playsHeavyFirst: boolean;     // Tend à jouer les tuiles lourdes en prio
  
  // Danger level
  dangerLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  // CRITICAL = 1 tuile restante → NE PAS lui donner un coup gagnant
}
```

**Mise à jour du profil :**
```
À chaque tour de l'adversaire :
  SI PASSE :
    → Ajouter les valeurs actuelles de la table à excludedValues
    → Recalculer likelyTiles
  SI JOUE :
    → Analyser la tuile jouée
    → Si toujours joue les lourds → playsHeavyFirst = true
    → handSize -= 1
    → Mettre à jour dangerLevel selon handSize
```

**Mode alerte (CRITICAL) :**
Quand un adversaire a **1-2 tuiles restantes**, le bot passe en mode défensif :
- Examine toutes les tuiles possibles de l'adversaire (via Couche 1)
- Si un coup donnerait une extrémité de table jouable par l'adversaire → malus massif
- Préfère un coup suboptimal plutôt que de donner la victoire à l'adversaire

---

## 🔁 Flux de Décision Complet (1 tour)

```
┌───────────────────────────────────────────────────────┐
│              C'est au tour du bot MÈTKAYALI           │
├───────────────────────────────────────────────────────┤
│                                                       │
│ 1. MISE À JOUR DU CONTEXTE                           │
│    ├─ TileTracker : mettre à jour avec le dernier     │
│    │  coup joué / passe observée                      │
│    ├─ OpponentModeler : profiler chaque adversaire    │
│    └─ EndgameAnalyzer : calculer boudeRisk            │
│                                                       │
│ 2. COUPS VALIDES                                     │
│    └─ Lister les 2-4 coups possibles                 │
│                                                       │
│ 3. SIMULATION MONTE-CARLO                            │
│    └─ Pour chaque coup :                             │
│       ├─ Générer 500-1000 distributions aléatoires   │
│       │  (respectant les contraintes TileTracker)     │
│       ├─ Simuler la fin de partie pour chacune       │
│       └─ Calculer win_rate + boude_safety            │
│                                                       │
│ 4. PONDÉRATION FINALE                                │
│    ├─ Si boudeRisk > 0.5 :                           │
│    │   score = 0.4 × win_rate + 0.6 × boude_safety  │
│    ├─ Sinon :                                        │
│    │   score = 0.7 × win_rate + 0.3 × boude_safety  │
│    └─ Bonus/Malus OpponentModeler :                  │
│       ├─ Adversaire CRITICAL + coup lui donne une    │
│       │  sortie → malus -0.3                         │
│       └─ Coup bloque un adversaire CRITICAL → +0.1  │
│                                                       │
│ 5. JOUER LE MEILLEUR COUP                            │
│                                                       │
└───────────────────────────────────────────────────────┘
```

---

## 📊 Puissance Estimée

| Match (100 parties, 3 joueurs) | Victoires estimées MÈTKAYALI |
|-------------------------------|------------------------------|
| vs 2× TI_MANMAY               | ~95% |
| vs 2× MAPIPI                  | ~85% |
| vs 2× GRAN_MOUN               | ~70% |
| vs 1 HUMAIN moyen + 1 GRAN_MOUN | ~65-75% |

> **Note :** Le domino a une part irréductible de hasard (distribution initiale + 7 tuiles au talon mort). Aucun bot ne peut atteindre 100%.

---

## 📁 Plan d'Implémentation — Fichiers

### Nouveaux fichiers

| Fichier | Rôle |
|---------|------|
| `mobile/src/core/MeytKayaliEngine.ts` | Moteur principal : orchestration des 4 couches + `getMeytKayaliMove()` |
| `mobile/src/core/ai/TileTracker.ts` | Couche 1 : comptage et probabilités des 28 tuiles |
| `mobile/src/core/ai/MonteCarlo.ts` | Couche 2 : simulation Monte-Carlo |
| `mobile/src/core/ai/EndgameAnalyzer.ts` | Couche 3 : détection risque de Boudé + stratégie adaptative |
| `mobile/src/core/ai/OpponentModeler.ts` | Couche 4 : profiling adversaire temps réel |
| `mobile/src/core/__tests__/MeytKayaliEngine.test.ts` | Tests unitaires du moteur complet |
| `mobile/src/core/ai/__tests__/TileTracker.test.ts` | Tests comptage de tuiles |
| `mobile/src/core/ai/__tests__/MonteCarlo.test.ts` | Tests simulations |

### Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `mobile/src/core/types.ts` | Ajouter `'METKAYALI'` au type `BotDifficulty` |
| `mobile/src/core/DominoEngine.ts` | Ajouter le cas `'METKAYALI'` dans `getBotMove()` → délègue à `MeytKayaliEngine` |
| `mobile/src/core/BotEngine.ts` | Passer le `gameState` complet à `getMeytKayaliMove()` (nécessaire pour les 4 couches) |
| `mobile/src/core/LogicEngine.ts` | Ajouter `'METKAYALI'` dans `dealGameSolo()` (noms de bots + avatars) |
| `mobile/src/core/services/bot.service.ts` | Ajouter le pool METKAYALI au `LOCAL_BOTS_FALLBACK` |
| `mobile/app/solo.tsx` | Ajouter le 4ᵉ choix de difficulté dans l'UI |

---

## ⚠️ Contraintes Techniques

1. **Performance mobile :** Cibler < 100ms par décision. Si dépassement, réduire le nombre de simulations Monte-Carlo dynamiquement.
2. **Fonctions pures :** Toute la logique IA doit être dans des fonctions pures (pas de side effects). Compatible avec `LogicEngine.ts`.
3. **Tests obligatoires :** Chaque couche doit avoir ses tests unitaires. Tester que MÈTKAYALI bat GRAN_MOUN sur 100 parties simulées avec un taux > 60%.
4. **Pas de dépendance externe :** Tout doit être implémenté en TypeScript pur (pas de lib ML/IA).
5. **Rétrocompatibilité :** Les 3 niveaux existants ne doivent pas être modifiés.

---

## 🎨 UX — Présentation du Niveau

| Élément | Valeur |
|---------|--------|
| Nom affiché | **Mèt Kayali** |
| Sous-titre | *Le Maître Absolu* |
| Icône | 👑 ou 🧠 |
| Couleur thème | Violet / Or (#9B59B6 / #F1C40F) |
| Bots par défaut | **Man-Diab** + **Papa-Zombi** |
| Avatars | `avatar_bot_07` + `avatar_bot_08` |
| Verrouillage | Débloqué au grade "Roi du Boudin" ou achat boutique (à décider) |
