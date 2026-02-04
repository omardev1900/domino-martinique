import { Domino, DominoSide, Player, PlayerId, GameState, GamePhase } from './types';
import { ALL_DOMINOS, HAND_SIZE, TALON_MORT_SIZE, WINS_TO_WIN_MATCH, MAX_PLAYERS } from './constants';

/**
 * Mélange des dominos avec l'algorithme de Fisher-Yates
 */
export const shuffleDeck = (): Domino[] => {
    const deck: Domino[] = ALL_DOMINOS.map((d, index) => ({
        id: `d-${index}`,
        left: d.left,
        right: d.right,
        isDouble: d.left === d.right,
        sum: d.left + d.right,
    }));

    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

/**
 * Distribution initiale : 3 joueurs x 7 dominos + 7 talon mort
 */
export const dealGame = (playerNames: string[]): Partial<GameState> => {
    const deck = shuffleDeck();
    const players: Player[] = playerNames.map((name, i) => ({
        id: `p${i + 1}`,
        name,
        hand: deck.slice(i * HAND_SIZE, (i + 1) * HAND_SIZE),
        handSize: HAND_SIZE,
        wins: 0,
        totalPoints: 0,
        isCochon: false,
        isBot: false,
    }));

    const talonMort = deck.slice(MAX_PLAYERS * HAND_SIZE);

    return {
        players,
        talonMort,
        phase: 'PLAYING',
        table: {
            sequence: [],
            leftValue: null,
            rightValue: null,
        },
    };
};

/**
 * checkValidMove : Vérifie si un domino peut être posé
 */
export const checkValidMove = (
    domino: Domino,
    leftValue: DominoSide | null,
    rightValue: DominoSide | null
): { canPlay: boolean; side?: 'left' | 'right'; isReversed?: boolean } => {
    // Premier coup de la partie
    if (leftValue === null || rightValue === null) {
        return { canPlay: true, side: 'left', isReversed: false };
    }

    // Vérification à gauche
    if (domino.left === leftValue) return { canPlay: true, side: 'left', isReversed: true };
    if (domino.right === leftValue) return { canPlay: true, side: 'left', isReversed: false };

    // Vérification à droite
    if (domino.left === rightValue) return { canPlay: true, side: 'right', isReversed: false };
    if (domino.right === rightValue) return { canPlay: true, side: 'right', isReversed: true };

    return { canPlay: false };
};

/**
 * calculateHandPoints : Somme des points d'une main
 */
export const calculateHandPoints = (hand: Domino[]): number => {
    return hand.reduce((sum, d) => sum + d.left + d.right, 0);
};

/**
 * determineWinnerOnBoudé : Logique en cas de blocage
 * Le gagnant est celui avec le moins de points. 
 * Si égalité parfaite entre les scores les plus bas, la partie est nulle.
 */
export const determineWinnerOnBoudé = (players: Player[]): PlayerId | 'TIE' => {
    const scores = players.map(p => ({ id: p.id, score: calculateHandPoints(p.hand) }));
    const minScore = Math.min(...scores.map(s => s.score));
    const winners = scores.filter(s => s.score === minScore);

    if (winners.length > 1) return 'TIE';
    return winners[0].id;
};

/**
 * determineFirstPlayer : Trouve qui doit commencer la manche
 * Règle : Plus gros double, ou plus grosse somme si aucun double.
 */
export const determineFirstPlayer = (players: Player[]): PlayerId => {
    let bestPlayerId = players[0].id;
    let maxDouble = -1;
    let maxSum = -1;

    players.forEach(p => {
        p.hand.forEach(d => {
            if (d.isDouble) {
                if (d.left > maxDouble) {
                    maxDouble = d.left;
                    bestPlayerId = p.id;
                }
            } else if (maxDouble === -1) {
                if (d.sum > maxSum) {
                    maxSum = d.sum;
                    bestPlayerId = p.id;
                }
            }
        });
    });

    return bestPlayerId;
};

/**
 * calculateCochonPoints : Calcule les points selon le système Cochon
 * - Winner: +4 (1 cochon) or +5 (2 cochons)
 * - Each cochon: -1
 */
export const calculateCochonPoints = (players: Player[]): Map<PlayerId, number> => {
    const pointsMap = new Map<PlayerId, number>();

    // Find winner (player with wins >= WINS_TO_WIN_MATCH)
    const winner = players.find(p => p.wins >= WINS_TO_WIN_MATCH);
    if (!winner) {
        // No winner yet, return empty map
        players.forEach(p => pointsMap.set(p.id, 0));
        return pointsMap;
    }

    // Count cochons (players with 0 wins)
    const cochons = players.filter(p => p.wins === 0);
    const cochonCount = cochons.length;

    // Calculate points
    players.forEach(p => {
        if (p.id === winner.id) {
            // Winner gets +4 or +5
            pointsMap.set(p.id, cochonCount === 1 ? 4 : cochonCount === 2 ? 5 : 4);
        } else if (p.wins === 0) {
            // Cochon gets -1
            pointsMap.set(p.id, -1);
        } else {
            // Other players get 0
            pointsMap.set(p.id, 0);
        }
    });

    return pointsMap;
};

/**
 * handleEndOfRound : Met à jour les scores et vérifie la fin du match
 */
export const handleEndOfRound = (
    gameState: GameState,
    winnerId: PlayerId | 'TIE'
): GameState => {
    const newState = { ...gameState };

    if (winnerId === 'TIE') {
        newState.phase = 'BOUDE';
        // Dans la règle Martiniquaise, une égalité en boudé annule souvent la partie
        return newState;
    }

    // Incrémenter la victoire
    const winnerIndex = newState.players.findIndex(p => p.id === winnerId);
    newState.players[winnerIndex].wins += 1;

    // Vérifier si quelqu'un a atteint 3 victoires
    const matchWinner = newState.players.find(p => p.wins >= WINS_TO_WIN_MATCH);

    if (matchWinner) {
        newState.phase = 'MATCH_END';

        // Calculate Cochon points
        const pointsMap = calculateCochonPoints(newState.players);

        // Apply points and mark cochons
        newState.players = newState.players.map(p => ({
            ...p,
            isCochon: p.wins === 0,
            totalPoints: p.totalPoints + (pointsMap.get(p.id) || 0)
        }));
    } else {
        newState.phase = 'ROUND_END';
        newState.firstPlayerOfRound = winnerId; // Le gagnant commence la suivante
    }

    return newState;
};

/**
 * handleTurn : Gère le coup d'un joueur (humain ou bot)
 * Met à jour le plateau, la main du joueur, et passe au suivant.
 */
export const handleTurn = (
    gameState: GameState,
    playerId: PlayerId,
    domino: Domino
): GameState => {
    // 1. Validation Logic
    const { canPlay, side, isReversed } = checkValidMove(
        domino,
        gameState.table.leftValue,
        gameState.table.rightValue
    );

    if (!canPlay || !side) {
        throw new Error("Invalid move");
    }

    // Clone state deeply (simplified for structural clone)
    const newState: GameState = JSON.parse(JSON.stringify(gameState));
    const playerIndex = newState.players.findIndex(p => p.id === playerId);

    if (playerIndex === -1) throw new Error("Player not found");

    const player = newState.players[playerIndex];

    // Check ownership
    const ownsTile = player.hand.some(d => d.id === domino.id);
    if (!ownsTile) throw new Error("Player does not have this domino");

    // 2. Remove domino from hand
    // Note: We filter by ID.
    player.hand = player.hand.filter(d => d.id !== domino.id);
    player.handSize = player.hand.length;

    // 3. Update Table
    const playedDomino = { ...domino };

    // Add to table sequence
    newState.table.sequence.push({
        domino: playedDomino,
        sideAtTable: side,
        isReversed: !!isReversed
    });

    // Update table extremities
    if (newState.table.sequence.length === 1) {
        // First domino played
        newState.table.leftValue = playedDomino.left;
        newState.table.rightValue = playedDomino.right;
    } else {
        if (side === 'left') {
            // LogicEngine checkValidMove logic recap:
            // if left matches left -> reversed=true, new exposed is right.
            // if right matches left -> reversed=false, new exposed is left.
            newState.table.leftValue = isReversed ? playedDomino.right : playedDomino.left;
        } else {
            // if left matches right -> reversed=false, new exposed is right.
            // if right matches right -> reversed=true, new exposed is left.
            newState.table.rightValue = isReversed ? playedDomino.left : playedDomino.right;
        }
    }

    // 4. Update History & Timestamp
    newState.history.push({
        playerId,
        action: 'PLAY',
        domino: playedDomino,
        timestamp: Date.now()
    });
    newState.lastActionTimestamp = Date.now();

    // 5. Check Win Condition
    if (player.hand.length === 0) {
        return handleEndOfRound(newState, playerId);
    }

    // 6. Pass Turn
    const currentIdx = newState.players.findIndex(p => p.id === newState.currentPlayerId);
    // Anti-Clockwise ? Usually just index + 1 if array is ordered.
    const nextIdx = (currentIdx + 1) % MAX_PLAYERS;
    newState.currentPlayerId = newState.players[nextIdx].id;

    return newState;
};

/**
 * passTurn : Gère le tour d'un joueur qui ne peut pas jouer.
 * Vérifie qu'il n'a vraiment aucun coup valide.
 * Si tous les joueurs passent consécutivement, la partie est bloquée (Boudé).
 */
export const passTurn = (
    gameState: GameState,
    playerId: PlayerId
): GameState => {
    // 1. Validation : Le joueur doit être le joueur courant
    if (gameState.currentPlayerId !== playerId) {
        throw new Error("Not your turn");
    }

    const newState: GameState = JSON.parse(JSON.stringify(gameState));
    const player = newState.players.find(p => p.id === playerId);

    if (!player) throw new Error("Player not found");

    // 2. Validation : Le joueur ne doit avoir AUCUN coup valide
    const canPlaySomething = player.hand.some(d => {
        return checkValidMove(
            d,
            newState.table.leftValue,
            newState.table.rightValue
        ).canPlay;
    });

    if (canPlaySomething) {
        throw new Error("Player has valid moves, cannot pass");
    }

    // 3. Update History
    newState.history.push({
        playerId,
        action: 'PASS',
        timestamp: Date.now()
    });
    newState.lastActionTimestamp = Date.now();

    // 4. Check for Blocked Game (Boudé)
    // Regarder les N dernières actions (N = nombre de joueurs)
    // Si ce sont toutes des 'PASS', alors tout le monde est bloqué.
    const lastActions = newState.history.slice(-MAX_PLAYERS);
    const consecutivePasses = lastActions.filter(h => h.action === 'PASS').length;

    if (consecutivePasses === MAX_PLAYERS) {
        // Jeu bloqué -> On détermine le vainqueur aux points
        const winnerId = determineWinnerOnBoudé(newState.players);
        return handleEndOfRound(newState, winnerId);
    }

    // 5. Pass Turn to next player
    const currentIdx = newState.players.findIndex(p => p.id === newState.currentPlayerId);
    const nextIdx = (currentIdx + 1) % MAX_PLAYERS;
    newState.currentPlayerId = newState.players[nextIdx].id;

    return newState;
};
