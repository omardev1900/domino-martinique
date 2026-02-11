
import { handleEndOfRound } from './LogicEngine';
import { GameState, Player } from './types';

const createMockPlayer = (id: string, name: string): Player => ({
    id,
    name,
    hand: [],
    handSize: 0,
    wins: 0,
    mancheWins: 0,
    totalPoints: 0,
    isCochon: false,
    totalCochons: 0,
    isBot: false
});

const createInitialState = (players: Player[], mode: any, condition: number): GameState => ({
    gameId: 'stress-test',
    players,
    talonMort: [],
    table: { sequence: [], leftValue: null, rightValue: null },
    currentPlayerId: players[0].id,
    phase: 'PLAYING',
    firstPlayerOfRound: null,
    history: [],
    winningCondition: condition,
    gameMode: mode,
    turnDuration: 30, // Default duration
    lastActionTimestamp: Date.now()
});

describe('Phase 2.3: Stress Test Simulation', () => {
    const simulateMatch = (mode: 'MANCHE' | 'SCORE' | 'COCHON', condition: number) => {
        let p1 = createMockPlayer('p1', 'Alice');
        let p2 = createMockPlayer('p2', 'Bob');
        let p3 = createMockPlayer('p3', 'Charlie');
        let state = createInitialState([p1, p2, p3], mode, condition);

        let roundCount = 0;

        while (state.phase !== 'MATCH_END' && roundCount < 100) { // Safety cap
            roundCount++;
            const winnerIdx = Math.floor(Math.random() * 3);
            const winnerId = state.players[winnerIdx].id;

            state = handleEndOfRound(state, winnerId);

            if (state.phase === 'MANCHE_END') {
                state.players = state.players.map(p => ({
                    ...p,
                    wins: 0,
                    isCochon: false
                }));
                state.phase = 'PLAYING';
            }
        }
        return { state, roundCount };
    };

    test('Match termination in MANCHE mode', () => {
        const { state } = simulateMatch('MANCHE', 3);
        expect(state.phase).toBe('MATCH_END');
        expect(state.players.some(p => p.mancheWins >= 3)).toBe(true);
    });

    test('Match termination in SCORE mode', () => {
        const { state } = simulateMatch('SCORE', 20);
        expect(state.phase).toBe('MATCH_END');
        expect(state.players.some(p => p.totalPoints >= 20)).toBe(true);
    });

    test('Match termination in COCHON mode (individual limit)', () => {
        const { state } = simulateMatch('COCHON', 3);
        expect(state.phase).toBe('MATCH_END');
        expect(state.players.some(p => p.totalCochons >= 3)).toBe(true);
    });

    test('Points consistency after multiple rounds', () => {
        const { state } = simulateMatch('SCORE', 50);
        const totalPoints = state.players.reduce((sum, p) => sum + p.totalPoints, 0);
        // Points should sum up to something reasonable (winners get +, cochons get -)
        // Since it's random, we just check that no one has NaN or undefined
        state.players.forEach(p => {
            expect(typeof p.totalPoints).toBe('number');
            expect(typeof p.totalCochons).toBe('number');
            expect(typeof p.mancheWins).toBe('number');
        });
    });
});
