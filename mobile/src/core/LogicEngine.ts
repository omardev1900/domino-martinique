import { Domino, DominoSide, Player, PlayerId, GameState, GamePhase, GameMode, MancheResult } from './types';
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
        mancheWins: 0,
        totalPoints: 0,
        isCochon: false,
        totalCochons: 0,
        isBot: false,
    }));

    const talonMort = deck.slice(players.length * HAND_SIZE);

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
export const dealGameSolo = (playerId: string, playerName: string, avatarId: string | undefined, botDifficulty: 'easy' | 'medium' | 'expert' | 'legend' = 'medium'): Partial<GameState> => {
    const HAND_SIZE = 7;
    const deck = shuffleDeck();

    const players: Player[] = [
        {
            id: playerId,
            name: playerName,
            avatarId: avatarId,
            hand: deck.slice(0, HAND_SIZE),
            handSize: HAND_SIZE,
            wins: 0,
            mancheWins: 0,
            totalPoints: 0,
            isCochon: false,
            totalCochons: 0,
            isBot: false,
        },
        {
            id: 'bot-1',
            name: `Bot ${botDifficulty === 'easy' ? 'Débutant' : botDifficulty === 'medium' ? 'Moyen' : botDifficulty === 'expert' ? 'Expert' : 'Légende'}`,
            hand: deck.slice(HAND_SIZE, HAND_SIZE * 2),
            handSize: HAND_SIZE,
            wins: 0,
            mancheWins: 0,
            totalPoints: 0,
            isCochon: false,
            totalCochons: 0,
            isBot: true,
        },
        {
            id: 'bot-2',
            name: `Bot ${botDifficulty === 'easy' ? 'Novice' : botDifficulty === 'medium' ? 'Initié' : botDifficulty === 'expert' ? 'Pro' : 'Maître'}`,
            hand: deck.slice(HAND_SIZE * 2, HAND_SIZE * 3),
            handSize: HAND_SIZE,
            wins: 0,
            mancheWins: 0,
            totalPoints: 0,
            isCochon: false,
            totalCochons: 0,
            isBot: true,
        },
    ];

    const talonMort = deck.slice(HAND_SIZE * 3);

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

/**
 * calculateHandPoints : Somme des points d'une main
 */
export const calculateHandPoints = (hand: Domino[]): number => {
    return hand.reduce((sum, d) => sum + d.left + d.right, 0);
};

export const determineWinnerOnBoudé = (players: Player[]): PlayerId | 'TIE' => {
    const scores = players.map(p => ({ id: p.id, score: calculateHandPoints(p.hand), hand: p.hand }));
    const minScore = Math.min(...scores.map(s => s.score));
    const candidates = scores.filter(s => s.score === minScore);

    if (candidates.length === 1) return candidates[0].id;

    // RULE: If more than one player has the same minimum score, it's a TIE. 
    // No tie-breaker. The round is ignored and restarted.
    return 'TIE';
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

export const calculateCochonPoints = (players: Player[]): { pointsMap: Map<PlayerId, number>; result: MancheResult } => {
    const pointsMap = new Map<PlayerId, number>();

    // Check for Chiré (everyone has at least one win)
    const isChiré = players.every(p => p.wins >= 1);
    if (isChiré) {
        players.forEach(p => pointsMap.set(p.id, 0));
        return { pointsMap, result: 'CHIRE' };
    }

    // Find winner (player with highest wins)
    const sortedByWins = [...players].sort((a, b) => b.wins - a.wins);
    const winnerId = sortedByWins[0].id;
    const totalWinsOnTable = players.reduce((sum, p) => sum + p.wins, 0);

    // Count cochons (players with 0 wins)
    const cochons = players.filter(p => p.wins === 0);
    const cochonCount = cochons.length;

    console.log(`[Score] Calculation: Winner=${winnerId}, TotalWins=${totalWinsOnTable}, Cochons=${cochonCount}`);

    // Phase 2.2: Enforcement of "3 Rounds Minimum" for Cochon declaration
    // As per user request: "Cochon s'affiche au min de 3 parties jouées"
    if (cochonCount > 0 && totalWinsOnTable < 3) {
        console.log(`[Score] Not enough rounds for Cochon (${totalWinsOnTable} < 3). Normal end.`);
        return { pointsMap: new Map(), result: 'NORMAL' };
    }

    // Calculate points
    players.forEach(p => {
        if (p.id === winnerId) {
            // Winner gets exactly 4 or 5 points for the manche
            const pts = cochonCount === 1 ? 4 : cochonCount === 2 ? 5 : 0;
            pointsMap.set(p.id, pts);
        } else if (p.wins === 0) {
            // Cochon gets -1
            pointsMap.set(p.id, -1);
        } else {
            pointsMap.set(p.id, 0);
        }
    });

    return { pointsMap, result: 'COCHON' };
};

const MANCHE_WIN_THRESHOLD = 3;

/**
 * handleEndOfRound : Met à jour les scores et vérifie la fin de la MANCHE ou du MATCH
 */
export const handleEndOfRound = (
    gameState: GameState,
    winnerId: PlayerId | 'TIE'
): GameState => {
    // 1. Create a deep copy (or at least map players to new objects to avoid mutations)
    const newState = JSON.parse(JSON.stringify(gameState)) as GameState;

    if (winnerId === 'TIE') {
        newState.phase = 'BOUDE';
        return newState;
    }

    // 2. Increment round win for the winner
    newState.players = newState.players.map(p => {
        if (p.id === winnerId) {
            return { ...p, wins: p.wins + 1 };
        }
        return p;
    });

    // 3. Set starter for the next partie
    newState.firstPlayerOfRound = winnerId;

    // 4. Check if Manche is over
    const isChiré = newState.players.every(p => p.wins >= 1);
    const reachesThreshold = newState.players.some(p => p.wins >= MANCHE_WIN_THRESHOLD);
    const endOfManche = isChiré || reachesThreshold;

    if (endOfManche) {
        const { pointsMap, result } = calculateCochonPoints(newState.players);
        newState.mancheResult = result;

        // Apply manche results to total stats
        newState.players = newState.players.map(p => {
            const manchePts = pointsMap.get(p.id) || 0;

            // A player wins the manche if they have the most wins
            const maxWins = Math.max(...newState.players.map(pl => pl.wins));
            const isWinnerOfManche = result === 'COCHON' && p.wins === maxWins;
            const isCochonNow = result === 'COCHON' && p.wins === 0;

            return {
                ...p,
                isCochon: isCochonNow,
                totalCochons: p.totalCochons + (isCochonNow ? 1 : 0),
                mancheWins: p.mancheWins + (isWinnerOfManche ? 1 : 0),
                totalPoints: p.totalPoints + manchePts
            };
        });

        // 5. Check if Match is over
        let isMatchOver = false;
        if (newState.gameMode === 'MANCHE') {
            isMatchOver = newState.players.some(p => p.mancheWins >= newState.winningCondition);
        } else if (newState.gameMode === 'SCORE') {
            isMatchOver = newState.players.some(p => p.totalPoints >= newState.winningCondition);
        } else if (newState.gameMode === 'COCHON') {
            // Phase 2.2: Match ends when a SINGLE player reaches the cochon limit
            isMatchOver = newState.players.some(p => p.totalCochons >= newState.winningCondition);
        }

        newState.phase = isMatchOver ? 'MATCH_END' : 'MANCHE_END';
    } else {
        newState.phase = 'PARTIE_END';
        newState.mancheResult = undefined; // IMPORTANT: Clear previous results if manche is ongoing
    }

    return newState;
};

/**
 * handleTurn : Gère le coup d'un joueur (humain ou bot)
 * Met à jour le plateau, la main du joueur, et passe au suivant.
 */
import { getValidMoves } from './DominoEngine';

/**
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
        return handleEndOfRound(newState, playerId);
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
export const resolveBoude = (gameState: GameState): { newState: GameState; isTie: boolean } => {
    const winnerId = determineWinnerOnBoudé(gameState.players);

    if (winnerId === 'TIE') {
        return { newState: gameState, isTie: true };
    }

    const newState = handleEndOfRound(gameState, winnerId);
    return { newState, isTie: false };
};
