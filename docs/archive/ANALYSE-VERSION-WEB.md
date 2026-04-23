# 🎯 Analyse comparative : Version Web vs Version Mobile

**Date :** 10 février 2026  
**Objectif :** Évaluer la faisabilité de migration de la logique web vers le projet mobile

---

## 📊 Vue d'ensemble

### Version Web (Fonctionnelle)
- **Framework :** React 19 + Vite
- **Multijoueur :** Socket.io (serveur Node.js inclus)
- **Architecture :** Monolithique (1 fichier de 2522 lignes)
- **Auth :** Mock DB local (pas de vraie authentification)
- **État :** ✅ **Fonctionnel** (logique validée par les utilisateurs)

### Version Mobile (En développement)
- **Framework :** React Native + Expo
- **Multijoueur :** Firebase Realtime Database
- **Architecture :** Modulaire (composants séparés)
- **Auth :** Firebase Authentication
- **État :** ⚠️ **Bugs récurrents** (logique de jeu instable)

---

## 🎮 Comparaison de la Logique de Jeu

### 1️⃣ **Moteur de Validation des Coups**

#### Version Web (`App.jsx`, lignes 201-215)
```javascript
const getValidMoves = (hand, ends) => {
  // SÉCURITÉ : Si ends est null, on autorise tout (premier coup)
  if (!ends || (ends.left === undefined && ends.right === undefined)) {
      return hand.map(d => ({ tile: d, side: 'start' }));
  }
  
  const moves = [];
  hand.forEach(d => {
    // Vérification simple et claire
    if (d.v1 === ends.left || d.v2 === ends.left) 
      moves.push({ tile: d, side: 'left' });
    if (d.v1 === ends.right || d.v2 === ends.right) 
      moves.push({ tile: d, side: 'right' });
  });
  return moves;
};
```

**✅ Points forts :**
- Logique simple et claire
- Gestion robuste du premier coup
- Pas de vérification de `forcedSide` (source de bugs dans le mobile)

#### Version Mobile (`LogicEngine.ts`, lignes 128-145)
```typescript
export const checkValidMove = (
    domino: Domino,
    leftValue: DominoSide | null,
    rightValue: DominoSide | null
): { canPlay: boolean; side?: 'left' | 'right'; isReversed?: boolean } => {
    // Premier coup de la partie
    if (leftValue === null && rightValue === null) {
        return { canPlay: true, side: 'left', isReversed: false };
    }

    // Vérification à gauche (uniquement si leftValue est défini)
    if (leftValue !== null) {
        if (domino.left === leftValue) return { canPlay: true, side: 'left', isReversed: true };
        if (domino.right === leftValue) return { canPlay: true, side: 'left', isReversed: false };
    }

    // Vérification à droite (uniquement si rightValue est défini)
    if (rightValue !== null) {
        if (domino.left === rightValue) return { canPlay: true, side: 'right', isReversed: false };
        if (domino.right === rightValue) return { canPlay: true, side: 'right', isReversed: true };
    }

    return { canPlay: false };
};
```

**⚠️ Problèmes identifiés :**
- Complexité accrue (gestion du `isReversed`)
- Bugs liés au `forcedSide` dans `handleTurn`
- Confusion entre validation et exécution

---

### 2️⃣ **Intelligence Artificielle (Bots)**

#### Version Web : **4 niveaux d'IA**

**A. Easy (ligne 347)**
```javascript
if (difficulty === 'easy') 
  return validMoves[Math.floor(Math.random() * validMoves.length)];
```
- Joue aléatoirement

**B. Medium (ligne 348)**
```javascript
if (difficulty === 'medium') 
  return validMoves.sort((a, b) => (b.tile.v1 + b.tile.v2) - (a.tile.v1 + a.tile.v2))[0];
```
- Joue les dominos les plus lourds en premier

**C. Expert (lignes 350-380)**
```javascript
const scoredMoves = validMoves.map(move => {
    let score = 0;
    const tile = move.tile;
    const isDouble = tile.v1 === tile.v2;
    const points = tile.v1 + tile.v2;

    // 1. Se débarrasser des points
    score += points * 0.5;

    // 2. Priorité aux doubles
    if (isDouble) score += 25;

    // 3. Stratégie "Garder la main"
    const newValue = move.side === 'left' ? ... : ...;
    const matchingRemaining = remainingHand.filter(t => t.v1 === newValue || t.v2 === newValue).length;
    if (matchingRemaining > 0) score += 15 * matchingRemaining;
    else score -= 10;

    return { move, score };
});
```
- Analyse stratégique multi-critères

**D. Valou / Man'X (Légendaires, lignes 222-340)**
```javascript
// Analyse de la main pour trouver les "clés" (valeurs dominantes)
const counts = {};
hand.forEach(t => {
    counts[t.v1] = (counts[t.v1] || 0) + 1;
    counts[t.v2] = (counts[t.v2] || 0) + 1;
});

// Stratégies avancées : blocage, finition, domination
```
- Stratégies nommées et personnalisées
- Achetables en boutique

#### Version Mobile : **2 niveaux basiques**

```typescript
export const getBotMove = (
  hand: Domino[],
  leftValue: DominoSide | null,
  rightValue: DominoSide | null
): BotMove | null => {
  const validMoves = hand.map(domino => {
    const result = checkValidMove(domino, leftValue, rightValue);
    // ...
  });

  if (validMoves.length === 0) return null;

  // Stratégie simple : joue les doubles en priorité
  const doubles = validMoves.filter(m => m.domino.left === m.domino.right);
  if (doubles.length > 0) {
    return doubles.sort((a, b) => (b.domino.left + b.domino.right) - (a.domino.left + a.domino.right))[0];
  }

  return validMoves.sort((a, b) => (b.domino.left + b.domino.right) - (a.domino.left + a.domino.right))[0];
};
```

**📉 Limites :**
- Pas de niveaux de difficulté
- Pas de stratégie avancée
- Pas de personnalisation

---

### 3️⃣ **Système de Cochons**

#### Version Web : **Complet et fonctionnel**

**Calcul des cochons (lignes 1403-1453)**
```javascript
const resolvePartieEnd = (prevState, currentPlayers, winnerId) => {
    const winnerName = currentPlayers[winnerId].name;
    const withWins = currentPlayers.map(p => ({ 
      ...p, 
      wins: p.id === winnerId ? p.wins + 1 : p.wins 
    }));
    
    const hasKO = withWins.some(p => p.wins >= 3);
    const everyoneWonOnce = withWins.every(p => p.wins >= 1);

    if (hasKO || everyoneWonOnce) {
        const maxW = Math.max(...withWins.map(p => p.wins));
        const mancheWinnerId = withWins.find(p => p.wins === maxW).id;
        const numCochons = withWins.filter(p => p.wins === 0).length;
        
        const finalMdcManche = withWins.map(p => {
            let mdcGain = p.wins;
            let label = "";
            
            if (p.id === mancheWinnerId) {
                if (numCochons === 2) { 
                  mdcGain = 5; 
                  label = "DOUBLE COCHON !!"; 
                }
                else if (numCochons === 1) { 
                  mdcGain = 4; 
                  label = "COCHON !"; 
                }
            } else if (p.wins === 0) { 
              mdcGain = -1; 
              label = "COCHON PRIS (-1)"; 
            }

            // Mode Cochons : on compte les cochons donnés
            let newCochonsTotal = p.cochonsTotal || 0;
            if (config.format === 'cochons' && p.id === mancheWinnerId) {
                if (mdcGain === 5) {
                    newCochonsTotal += 2;
                    label = "2 COCHONS DONNÉS !";
                } else if (mdcGain === 4) {
                    newCochonsTotal += 1;
                    label = "1 COCHON DONNÉ !";
                }
            }

            return { 
              ...p, 
              mdcPoints: p.mdcPoints + mdcGain, 
              cochonsTotal: newCochonsTotal, 
              gain: mdcGain, 
              label 
            };
        });

        // Vérification victoire selon le format
        let isTournoiFini = false;
        if (config.format === 'cochons') 
            isTournoiFini = finalMdcManche.some(p => p.cochonsTotal >= config.target);
        else if (config.format === 'manches') 
            isTournoiFini = prevState.currentManche >= config.target;
        else 
            isTournoiFini = finalMdcManche.some(p => p.mdcPoints >= config.target);

        return { 
          ...prevState, 
          players: finalMdcManche, 
          status: isTournoiFini ? 'tournoi_over' : 'manche_over', 
          winnerId 
        };
    }
    
    return { ...prevState, players: withWins, status: 'partie_over', winnerId };
};
```

**✅ Fonctionnalités :**
- Détection automatique des cochons
- Mode "Cochons" (objectif de cochons à atteindre)
- Labels explicatifs pour l'utilisateur
- Historique des manches

#### Version Mobile : **Incomplet**

```typescript
// Le code existe mais n'est pas utilisé correctement
// Pas de mode "Cochons" dédié
// Calcul des points MDC présent mais instable
```

---

### 4️⃣ **Rendu Visuel**

#### Version Web : **Design Premium**

**Composant DominoTile (ligne 414)**
```javascript
const DominoTile = ({ v1, v2, size = 'md', orientation = 'vertical', flipped = false, 
                       onClick, highlight = false, isMandatory = false, className = '', 
                       skinId = 'skin_classic' }) => {
  const renderDots = (val) => {
    const positions = {
      0: [], 
      1: [[50, 50]], 
      2: isHorizontal ? [[25, 75], [75, 25]] : [[25, 25], [75, 75]],
      3: isHorizontal ? [[25, 75], [50, 50], [75, 25]] : [[25, 25], [50, 50], [75, 75]],
      4: [[25, 25], [25, 75], [75, 25], [75, 75]],
      5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]],
      6: isHorizontal ? [[25, 30], [50, 30], [75, 30], [25, 70], [50, 70], [75, 70]]
                      : [[30, 25], [30, 50], [30, 75], [70, 25], [70, 50], [70, 75]]
    };
    return positions[val].map((pos, i) => <circle key={i} cx={pos[0]} cy={pos[1]} r="9" fill="currentColor" />);
  };
  
  const skin = MOCK_DB.items.find(s => s.id === skinId) || MOCK_DB.items[0];
  // ... reste du rendu avec SVG
};
```

**✨ Caractéristiques :**
- Rendu SVG (scalable, net)
- Système de skins (classique, gold, néon, etc.)
- Animations fluides (CSS + transition)
- Highlight pour les coups valides
- Effet "mandatory" pour le premier coup obligatoire

**Animations de pose (lignes 1680-1722)**
```javascript
@keyframes slideFromBottom {
    0% { transform: translateY(300px) scale(1.5); opacity: 0; }
    100% { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes slideFromTopLeft {
    0% { transform: translate(-300px, -300px) scale(0.5); opacity: 0; }
    100% { transform: translate(0, 0) scale(1); opacity: 1; }
}
@keyframes slideFromTopRight {
    0% { transform: translate(300px, -300px) scale(0.5); opacity: 0; }
    100% { transform: translate(0, 0) scale(1); opacity: 1; }
}
```
- Chaque joueur a son animation (bas, haut-gauche, haut-droite)
- Effet de profondeur et d'arrivée

#### Version Mobile : **Design basique**

**Composant DominoTile**
```typescript
// Rendu Text-based avec Flexbox
// Pas d'animations de pose
// Pas de système de skins
// Styling minimal
```

---

## 🎨 Système de Thèmes et Personnalisation

### Version Web : **Boutique complète**

**Items disponibles :**
1. **Skins Dominos** (ligne 112-114)
   - Classique (gratuit)
   - MDC Gold (500 gems)
   - Néon Cyber (250 gems)

2. **Tapis de jeu** (ligne 116-119)
   - Feutre Vert (gratuit)
   - Nuit Bleue (100 gems)
   - Noël 972 (300 gems, avec flocons animés)
   - Sponsor Rhum (1000 gems, avec logo)

3. **Avatars** (ligne 121-126)
   - Anonyme, Roi, Cyborg, Pirate, Fantôme, Joyeux

4. **Phrases de chat** (ligne 128-135)
   - "Ti Manikou", "I salé", "Tébé", "La Mizè", etc.

5. **Bots Légendaires** (ligne 138-139)
   - Man'X le Président (2000 gems)
   - Valou le Redoutable (3000 gems)

**Système de monétisation :**
- Pièces d'or (monnaie de jeu gratuite)
- Gemmes (monnaie premium, achat réel)
- Publicités (500 pièces d'or)
- Pass VIP (4,99€/mois : pas de pub, bonus instantanés)

### Version Mobile : **Thèmes basiques**

```typescript
export const TABLE_THEMES = {
  classic: { background: '#0a3620', felt: '#064e3b' },
  modern: { background: '#1a1a2e', felt: '#16213e' },
  luxury: { background: '#2d1b00', felt: '#3d2701' }
};
```

**Manque :**
- Boutique d'items
- Système de skins
- Personnalisation des avatars
- Monétisation

---

## 🎯 Recommandation : Plan de Migration

### ✅ **Ma recommandation : Migration Progressive**

**Conserver du projet mobile :**
- ✅ Architecture modulaire (meilleure maintenabilité)
- ✅ Firebase (authentification + base de données)
- ✅ Navigation React Navigation
- ✅ Audio & Haptics
- ✅ Profils utilisateurs

**Migrer depuis la version web :**
- ✅ Logique de jeu complète (`getValidMoves`, `playTile`, `passTurn`)
- ✅ Système de cochons fonctionnel
- ✅ IA multi-niveaux (4 difficultés)
- ✅ Rendu SVG des dominos
- ✅ Animations de pose
- ✅ Système de thèmes et skins

---

## 📋 Plan d'Implémentation (5 étapes)

### **Phase 1 : Extraction de la Logique Métier** (2-3h)
**Fichiers à créer :**

1. **`core/DominoLogic.ts`**
   ```typescript
   export const generateDominoes = () => { /* ligne 190-199 du web */ };
   export const getValidMoves = (hand, ends) => { /* ligne 201-215 du web */ };
   export const calculateHandPoints = (hand) => { /* ligne 217-219 du web */ };
   ```

2. **`core/BotEngine.ts`** (remplacement complet)
   ```typescript
   export const getBotMove = (hand, ends, difficulty) => { /* lignes 343-394 du web */ };
   export const getManXMove = (hand, ends) => { /* lignes 291-340 du web */ };
   export const getValouMove = (hand, ends) => { /* lignes 222-289 du web */ };
   ```

3. **`core/CochonLogic.ts`**
   ```typescript
   export const resolvePartieEnd = (state, players, winnerId, config) => { /* lignes 1403-1453 du web */ };
   ```

### **Phase 2 : Composants Visuels** (3-4h)

1. **`components/DominoTileSVG.tsx`**
   - Portage du composant web (ligne 414-440)
   - Utilisation de `react-native-svg`
   - Support des skins

2. **`components/GameTablePremium.tsx`**
   - Intégration des animations de pose
   - Support des thèmes
   - Zoom dynamique (lignes 1257-1279 du web)

### **Phase 3 : Adaptation de GameScreen** (4-5h)

**Remplacer dans `GameScreen.tsx` :**
- ❌ `checkValidMove` → ✅ `getValidMoves`
- ❌ `handleTurn` (bugué) → ✅ `playTile` (testé)
- ❌ Logique de cochons incomplète → ✅ `resolvePartieEnd`

**Ajouter :**
- Mode "Cochons" (objectif de cochons)
- Animations de pose par joueur
- Labels explicatifs ("DOUBLE COCHON !!")

### **Phase 4 : Boutique et Personnalisation** (5-6h)

1. **`screens/ShopScreen.tsx`**
   - Adaptation de la boutique web (ligne 781-827)
   - Intégration Firebase pour la persistance
   - Gemmes et pièces d'or

2. **`core/themes/`**
   - Skins dominos
   - Tapis de jeu
   - Avatars

### **Phase 5 : Tests et Polish** (3-4h)

1. Tests d'intégration
2. Vérification mode solo (bots)
3. Vérification mode multijoueur (Firebase)
4. Animations et UX

---

## ⏱️ Estimation Totale

**Temps total : 17-22 heures** (environ 3-4 jours de travail)

**Répartition :**
- Logique métier : 6-7h
- UI/UX : 8-10h
- Tests : 3-5h

---

## 🚀 Prochaine Étape ?

**Options :**

### Option A : Migration Complète (Recommandée)
Je migre toute la logique web vers le projet mobile en suivant le plan ci-dessus.

**Avantages :**
- ✅ Logique testée et validée
- ✅ Toutes les fonctionnalités (cochons, IA, thèmes)
- ✅ Design premium
- ✅ Infrastructure Firebase conservée

**Inconvénients :**
- ⏱️ Temps de développement (3-4 jours)

### Option B : Migration Progressive
On commence par la logique critique (Phase 1-2), puis on ajoute les features progressivement.

**Avantages :**
- ✅ Résultats rapides (bugs fixes en 1-2 jours)
- ✅ Validation incrémentale

**Inconvénients :**
- ⚠️ Fonctionnalités limitées au début

### Option C : Hybrid (Déconseillé)
On essaie de corriger les bugs du projet mobile sans migration.

**Inconvénients :**
- ❌ Risque de nouveaux bugs
- ❌ Pas d'accès aux features web (cochons, IA avancée)
- ❌ Temps perdu à débugger

---

## 💬 Qu'en penses-tu ?

**Je te recommande l'Option A (Migration Complète).**

C'est le moment idéal pour :
1. ✅ Partir sur une base saine et testée
2. ✅ Récupérer toutes les features que les utilisateurs aiment
3. ✅ Garder l'infrastructure Firebase (auth, sync temps réel)
4. ✅ Avoir un jeu stable et évolutif

**Veux-tu que je commence la migration ?**

Si oui, je propose de démarrer par la **Phase 1** (logique métier) pour avoir des résultats rapides et corriger les bugs critiques en priorité.
