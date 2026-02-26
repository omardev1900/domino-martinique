
import { dealGame, checkValidMove, determineFirstPlayer, determineWinnerOnBoudé, calculateHandPoints, passTurn, handleTurn, getForcedOpeningDominoId } from '../LogicEngine';
import { Domino, Player, DominoSide, GameState } from '../types';

describe('LogicEngine', () => {
    describe('dealGame', () => {
        it('should deal 7 dominos to 3 players', () => {
            const game = dealGame(['Alice', 'Bob', 'Charlie']);
            expect(game.players).toHaveLength(3);
            game.players!.forEach(player => {
                expect(player.hand).toHaveLength(7);
            });
            expect(game.talonMort).toHaveLength(7);
        });
    });

    describe('checkValidMove', () => {
        const domino66: Domino = { id: 'd1', left: 6, right: 6, isDouble: true, sum: 12 };
        const domino61: Domino = { id: 'd2', left: 6, right: 1, isDouble: false, sum: 7 };
        const domino00: Domino = { id: 'd3', left: 0, right: 0, isDouble: true, sum: 0 };

        it('should allow any move on empty table', () => {
            const result = checkValidMove(domino66, null, null);
            expect(result.canPlay).toBe(true);
        });

        it('should allow matching left', () => {
            // Table: 6 ... 4
            const result = checkValidMove(domino61, 6, 4);
            // 6 matches 6
            expect(result.canPlay).toBe(true);
            expect(result.side).toBe('left');
        });

        it('should allow matching right', () => {
            // Table: 4 ... 1
            const result = checkValidMove(domino61, 4, 1);
            // 1 matches 1
            expect(result.canPlay).toBe(true);
            expect(result.side).toBe('right');
        });

        it('should reject non-matching domino', () => {
            // Table: 5 ... 2
            const result = checkValidMove(domino61, 5, 2);
            expect(result.canPlay).toBe(false);
        });
    });

    describe('determineFirstPlayer', () => {
        it('should pick player with highest double', () => {
            const p1 = { id: 'p1', hand: [{ left: 6, right: 6, isDouble: true, sum: 12 }] } as Player;
            const p2 = { id: 'p2', hand: [{ left: 5, right: 5, isDouble: true, sum: 10 }] } as Player;
            const p3 = { id: 'p3', hand: [{ left: 1, right: 2, isDouble: false, sum: 3 }] } as Player;

            const winner = determineFirstPlayer([p1, p2, p3]);
            expect(winner).toBe('p1');
        });

        it('should pick player with highest sum if no doubles', () => {
            const p1 = { id: 'p1', hand: [{ left: 0, right: 1, isDouble: false, sum: 1 }] } as Player;
            const p2 = { id: 'p2', hand: [{ left: 3, right: 4, isDouble: false, sum: 7 }] } as Player; // Highest sum
            const p3 = { id: 'p3', hand: [{ left: 1, right: 2, isDouble: false, sum: 3 }] } as Player;

            const winner = determineFirstPlayer([p1, p2, p3]);
            expect(winner).toBe('p2');
        });
    });

    describe('determineWinnerOnBoudé', () => {
        it('should pick player with lowest points', () => {
            const p1 = { id: 'p1', hand: [{ left: 6, right: 6, sum: 12 }] } as any;
            const p2 = { id: 'p2', hand: [{ left: 0, right: 0, sum: 0 }] } as any; // Winner
            const p3 = { id: 'p3', hand: [{ left: 1, right: 1, sum: 2 }] } as any;

            const result = determineWinnerOnBoudé([p1, p2, p3]);
            expect(result).toBe('p2');
        });

        it('should return TIE if equal lowest', () => {
            const p1 = { id: 'p1', hand: [{ left: 1, right: 0, sum: 1 }] } as any;
            const p2 = { id: 'p2', hand: [{ left: 0, right: 1, sum: 1 }] } as any; // Tie
            const p3 = { id: 'p3', hand: [{ left: 6, right: 6, sum: 12 }] } as any;

            const result = determineWinnerOnBoudé([p1, p2, p3]);
            expect(result).toBe('TIE');
        });
    });
});

describe('passTurn', () => {
    const p1: Player = { id: 'p1', name: 'P1', hand: [{ id: 'd1', left: 6, right: 6, isDouble: true, sum: 12 } as Domino], handSize: 1, wins: 0, mancheWins: 0, currentMancheStars: 0, totalRoundWins: 0, totalPoints: 0, totalCochons: 0, isCochon: false, isBot: false };
    const p2: Player = { id: 'p2', name: 'P2', hand: [{ id: 'd2', left: 0, right: 0, isDouble: true, sum: 0 } as Domino], handSize: 1, wins: 0, mancheWins: 0, currentMancheStars: 0, totalRoundWins: 0, totalPoints: 0, totalCochons: 0, isCochon: false, isBot: false };
    const p3: Player = { id: 'p3', name: 'P3', hand: [{ id: 'd3', left: 2, right: 2, isDouble: true, sum: 4 } as Domino], handSize: 1, wins: 0, mancheWins: 0, currentMancheStars: 0, totalRoundWins: 0, totalPoints: 0, totalCochons: 0, isCochon: false, isBot: false };

    let state: GameState = {
        gameId: 'g1',
        gameMode: 'MANCHE',
        players: [p1, p2, p3],
        talonMort: [],
        table: { sequence: [], leftValue: 6, rightValue: 6 }, // Table matches 6
        history: [],
        currentPlayerId: 'p2', // P2 has 0-0, cannot play on 6-6
        phase: 'PLAYING',
        firstPlayerOfRound: 'p1',
        winningCondition: 3,
        lastActionTimestamp: 0,
        roundNumber: 1,
        mancheNumber: 1,
        turnDuration: 15,
        mancheHistory: [],
        startingHandSize: 7
    };

    it('should throw if player has a valid move', () => {
        // P1 has 6-6 and table is 6-6, so P1 can play.
        const stateCanPlay = { ...state, currentPlayerId: 'p1' };
        expect(() => passTurn(stateCanPlay, 'p1')).toThrow("Player has valid moves");
    });

    it('should allow pass if no valid move', () => {
        // P2 has 0-0, table is 6-6. P2 cannot play.
        const newState = passTurn(state, 'p2');
        expect(newState.history).toHaveLength(1);
        expect(newState.history[0].action).toBe('PASS');
        expect(newState.currentPlayerId).toBe('p3'); // Rotated
    });

    it('should detect blocked game (Boudé) after 3 passes', () => {
        // Simulate 2 previous passes
        state.history = [
            { playerId: 'p3', action: 'PASS', timestamp: 0 },
            { playerId: 'p1', action: 'PASS', timestamp: 0 }
        ];
        state.currentPlayerId = 'p2'; // P2 is about to pass (3rd pass)

        const newState = passTurn(state, 'p2');

        // Should enter BOUDE phase for UI to show popup
        expect(newState.phase).toBe('BOUDE');
    });
});

describe('handleTurn', () => {
    const p1: Player = { id: 'p1', name: 'P1', hand: [], handSize: 0, wins: 0, mancheWins: 0, currentMancheStars: 0, totalRoundWins: 0, totalPoints: 0, totalCochons: 0, isCochon: false, isBot: false };

    let state: GameState = {
        gameId: 'g1',
        gameMode: 'MANCHE',
        players: [p1],
        talonMort: [],
        table: { sequence: [], leftValue: 6, rightValue: 6 },
        history: [],
        currentPlayerId: 'p1',
        phase: 'PLAYING',
        firstPlayerOfRound: 'p1',
        winningCondition: 3,
        lastActionTimestamp: 0,
        roundNumber: 1,
        mancheNumber: 1,
        turnDuration: 15,
        mancheHistory: [],
        startingHandSize: 7
    };

    // Re-initialize p1's hand for each test
    beforeEach(() => {
        const d1: Domino = { id: 'd1', left: 6, right: 6, isDouble: true, sum: 12 };
        p1.hand = [d1];
    });

    it('should throw if player tries to play a tile not in their hand', () => {
        const foreignTile: Domino = { id: 'foreign', left: 6, right: 0, isDouble: false, sum: 6 };
        // We expect LogicEngine to throw "Player does not have this domino"
        expect(() => handleTurn(state, 'p1', foreignTile)).toThrow("Player does not have this domino");
    });
});

describe('Opening rule (round 1 / manche 1)', () => {
    const d66: Domino = { id: 'd66', left: 6, right: 6, isDouble: true, sum: 12 };
    const d65: Domino = { id: 'd65', left: 6, right: 5, isDouble: false, sum: 11 };
    const d55: Domino = { id: 'd55', left: 5, right: 5, isDouble: true, sum: 10 };

    const createState = (roundNumber: number = 1, mancheNumber: number = 1): GameState => ({
        gameId: 'g-open',
        gameMode: 'MANCHE',
        players: [
            {
                id: 'p1',
                name: 'P1',
                hand: [d66, d65],
                handSize: 2,
                wins: 0,
                mancheWins: 0,
                currentMancheStars: 0,
                totalRoundWins: 0,
                totalPoints: 0,
                totalCochons: 0,
                isCochon: false,
                isBot: false
            },
            {
                id: 'p2',
                name: 'P2',
                hand: [d55],
                handSize: 1,
                wins: 0,
                mancheWins: 0,
                currentMancheStars: 0,
                totalRoundWins: 0,
                totalPoints: 0,
                totalCochons: 0,
                isCochon: false,
                isBot: false
            }
        ],
        talonMort: [],
        table: { sequence: [], leftValue: null, rightValue: null },
        history: [],
        currentPlayerId: 'p1',
        phase: 'PLAYING',
        firstPlayerOfRound: null,
        winningCondition: 3,
        lastActionTimestamp: 0,
        roundNumber,
        mancheNumber,
        turnDuration: 15,
        mancheHistory: [],
        startingHandSize: 7
    });

    it('should expose forced opening domino only for the starter with highest double', () => {
        const state = createState();
        expect(getForcedOpeningDominoId(state, 'p1')).toBe('d66');
        expect(getForcedOpeningDominoId(state, 'p2')).toBeNull();
    });

    it('should reject non-double opening move for the starter on first round/manche', () => {
        const state = createState();
        expect(() => handleTurn(state, 'p1', d65)).toThrow("Opening rule: highest double must be played on round 1 / manche 1.");
    });

    it('should allow highest double opening move on first round/manche', () => {
        const state = createState();
        const newState = handleTurn(state, 'p1', d66);
        expect(newState.table.sequence).toHaveLength(1);
        expect(newState.table.sequence[0].domino.id).toBe('d66');
    });

    it('should allow any opening domino from round 2 onward', () => {
        const state = createState(2, 1);
        const newState = handleTurn(state, 'p1', d65);
        expect(newState.table.sequence).toHaveLength(1);
        expect(newState.table.sequence[0].domino.id).toBe('d65');
    });
});

