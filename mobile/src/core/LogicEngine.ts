import { Domino, DominoSide, Player, PlayerId, GameState, GamePhase, GameMode, MancheResult } from './types';
import { ALL_DOMINOS, HAND_SIZE, TALON_MORT_SIZE, WINS_TO_WIN_MATCH, MAX_PLAYERS, MANCHE_WIN_THRESHOLD } from './constants';

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
export const dealGame = (playerNames: string[], handSize: number = HAND_SIZE): Partial<GameState> => {
    const deck = shuffleDeck();
    const players: Player[] = playerNames.map((name, i) => ({
        id: `p${i + 1}`,
        name,
        hand: deck.slice(i * handSize, (i + 1) * handSize),
        handSize: handSize,
        currentMancheStars: 0,
        mancheWins: 0,
        totalRoundWins: 0,
        totalPoints: 0,
        isCochon: false,
        totalCochons: 0,
        isBot: false,
        wins: 0,
    }));

    const talonMort = deck.slice(players.length * handSize);

    return {
        players,
        talonMort,
        phase: 'PLAYING',
        table: {
            sequence: [],
            leftValue: null,
            rightValue: null,
        },
        gameMode: 'MANCHE',
        winningCondition: WINS_TO_WIN_MATCH,
        lastActionTimestamp: Date.now(),
    };
};

/**
 * Distribution pour Solo Mode : 3 joueurs (1 humain + 2 bots) x 7 dominos
 */
export const dealGameSolo = (playerId: string, playerName: string, avatarId: string | undefined, botDifficulty: 'easy' | 'medium' | 'expert' | 'legend' = 'medium', handSize: number = HAND_SIZE): Partial<GameState> => {
    const deck = shuffleDeck();

    const getBotAvatar = (diff: string) => {
        switch (diff) {
            case 'easy': return 'bot_01';
            case 'medium': return 'bot_02';
            case 'expert': return 'bot_03';
            case 'legend': return 'bot_03';
            default: return 'bot_01';
        }
    };

    const botAvatar = getBotAvatar(botDifficulty);

    const players: Player[] = [
        {
            id: playerId,
            name: playerName,
            avatarId: avatarId,
            hand: deck.slice(0, handSize),
            handSize: handSize,
            currentMancheStars: 0,
            mancheWins: 0,
            totalRoundWins: 0,
            totalPoints: 0,
            isCochon: false,
            totalCochons: 0,
            isBot: false,
            wins: 0,
        },
        {
            id: 'bot-1',
            name: `Bot ${botDifficulty === 'easy' ? 'Débutant' : botDifficulty === 'medium' ? 'Moyen' : botDifficulty === 'expert' ? 'Expert' : 'Légende'}`,
            avatarId: botAvatar,
            hand: deck.slice(handSize, handSize * 2),
            handSize: handSize,
            currentMancheStars: 0,
            mancheWins: 0,
            totalRoundWins: 0,
            totalPoints: 0,
            isCochon: false,
            totalCochons: 0,
            isBot: true,
            difficulty: botDifficulty,
            wins: 0,
        },
        {
            id: 'bot-2',
            name: `Bot ${botDifficulty === 'easy' ? 'Novice' : botDifficulty === 'medium' ? 'Initié' : botDifficulty === 'expert' ? 'Pro' : 'Maître'}`,
            avatarId: botAvatar,
            hand: deck.slice(handSize * 2, handSize * 3),
            handSize: handSize,
            currentMancheStars: 0,
            mancheWins: 0,
            totalRoundWins: 0,
            totalPoints: 0,
            isCochon: false,
            totalCochons: 0,
            isBot: true,
            difficulty: botDifficulty,
            wins: 0,
        },
    ];

    const talonMort = deck.slice(handSize * 3);

    return {
        players,
        talonMort,
        phase: 'PLAYING',
        table: {
            sequence: [],
            leftValue: null,
            rightValue: null,
        },
        gameMode: 'MANCHE',
        winningCondition: WINS_TO_WIN_MATCH,
        lastActionTimestamp: Date.now(),
    };
};

/**
 * checkValidMove : Vérifie si un domino peut être posé
 */
export const checkValidMove = (
    domino: Domino,
    leftValue: number | null,
    rightValue: number | null
): { canPlay: boolean; side?: 'left' | 'right' | 'start'; isReversed?: boolean } => {
    // 1. First move
    if (leftValue === null || rightValue === null) {
        return { canPlay: true, side: 'start', isReversed: false };
    }

    // 2. Try Left
    if (domino.right === leftValue) return { canPlay: true, side: 'left', isReversed: false };
    if (domino.left === leftValue) return { canPlay: true, side: 'left', isReversed: true };

    // 3. Try Right
    if (domino.left === rightValue) return { canPlay: true, side: 'right', isReversed: false };
    if (domino.right === rightValue) return { canPlay: true, side: 'right', isReversed: true };

    return { canPlay: false };
};

import { getValidMoves } from './DominoEngine';
import { finalizeRound } from './ScoringEngine'; // NEW IMPORTS

// Re-export specific helpers if needed by UI, or prefer direct import from ScoringEngine
export { calculateHandPoints, finalizeRound, determineWinnerOnBoudé } from './ScoringEngine';
export const handleEndOfRound = finalizeRound; // Alias for backward compatibility

/**
 * handleTurn : Gère le tour d'un joueur (humain ou bot)
 * Met à jour le plateau, la main du joueur, et passe au suivant.
 */
export const handleTurn = (
    gameState: GameState,
    playerId: PlayerId,
    domino: Domino,
    forcedSide?: 'left' | 'right'
): GameState => {
    // 1. Validation Logic with the new engine
    const allValidMoves = getValidMoves([domino], {
        left: gameState.table.leftValue,
        right: gameState.table.rightValue
    });

    // Filter by forcedSide if provided
    const possibleMoves = forcedSide
        ? allValidMoves.filter(m => m.side === forcedSide)
        : allValidMoves;

    if (possibleMoves.length === 0) {
        throw new Error(`Invalid move: Domino cannot be played ${forcedSide ? 'on the ' + forcedSide + ' side' : 'anywhere'}.`);
    }

    // On prend le premier coup valide (en cas d'ambiguïté sans forcedSide, ce qui ne devrait pas arriver pour un humain car GameScreen gère le choix)
    const move = possibleMoves[0];
    const side = move.side === 'start' ? 'left' : move.side;
    const isReversed = move.isReversed;


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

    // CRITICAL FIX: Maintain logical order in sequence
    // sequence[0] is always the far left, sequence[last] is always the far right
    if (newState.table.sequence.length === 0) {
        // First domino
        newState.table.sequence.push({
            domino: playedDomino,
            sideAtTable: 'left',
            isReversed: false
        });
        newState.table.leftValue = playedDomino.left;
        newState.table.rightValue = playedDomino.right;
    } else {
        if (side === 'left') {
            // Add to BEGINNING of array
            newState.table.sequence.unshift({
                domino: playedDomino,
                sideAtTable: 'left',
                isReversed: !!isReversed
            });
            // The NEW left value is the side of the domino that is NOT touching the table
            newState.table.leftValue = isReversed ? playedDomino.right : playedDomino.left;
        } else {
            // Add to END of array
            newState.table.sequence.push({
                domino: playedDomino,
                sideAtTable: 'right',
                isReversed: !!isReversed
            });
            // The NEW right value is the side of the domino that is NOT touching the table
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
        return finalizeRound(newState, playerId); // USE FINALIZE ROUND
    }

    // 6. Pass Turn
    const currentIdx = newState.players.findIndex(p => p.id === newState.currentPlayerId);
    const nextIdx = (currentIdx + 1) % newState.players.length;
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
    const numPlayers = newState.players.length;
    const lastActions = newState.history.slice(-numPlayers);
    const consecutivePasses = lastActions.filter(h => h.action === 'PASS').length;

    if (consecutivePasses === numPlayers) {
        // Jeu bloqué -> On passe en phase BOUDE
        // L'UI se chargera d'afficher l'overlay et d'appeler resolveBoude après 4s
        newState.phase = 'BOUDE';
        return newState;
    }

    // 5. Pass Turn to next player
    const currentIdx = newState.players.findIndex(p => p.id === newState.currentPlayerId);
    const nextIdx = (currentIdx + 1) % newState.players.length;
    newState.currentPlayerId = newState.players[nextIdx].id;

    return newState;
};

/**
 * resolveBoude : Résout la partie bloquée après l'animation
 */
import { determineWinnerOnBoudé } from './ScoringEngine';

export const resolveBoude = (gameState: GameState): { newState: GameState; isTie: boolean } => {
    const winnerId = determineWinnerOnBoudé(gameState.players);

    if (winnerId === 'TIE') {
        return { newState: gameState, isTie: true };
    }

    const newState = finalizeRound(gameState, winnerId); // USE FINALIZE ROUND
    return { newState, isTie: false };
};

/**
 * determineFirstPlayer : Détermine qui commence (Plus gros double ou plus gros domino)
 */
export const determineFirstPlayer = (players: Player[]): string => {
    // Explicit type to avoid 'never' inference relative to null initialization
    type BestDomino = { sum: number; isDouble: boolean; playerId: string };
    let bestDomino: BestDomino | null = null;

    players.forEach(p => {
        p.hand.forEach(d => {
            const isDouble = d.left === d.right;
            const sum = d.left + d.right;

            if (!bestDomino) {
                bestDomino = { sum, isDouble, playerId: p.id };
            } else {
                const best = bestDomino as BestDomino;
                if (isDouble && (!best || !best.isDouble)) {
                    bestDomino = { sum, isDouble, playerId: p.id };
                } else if (best && isDouble === best.isDouble) {
                    if (sum > best.sum) {
                        bestDomino = { sum, isDouble, playerId: p.id };
                    }
                }
            }
        });
    });

    return bestDomino ? bestDomino.playerId : players[0].id;
};
