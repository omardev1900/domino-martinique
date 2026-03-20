
import { finalizeRound } from '../ScoringEngine';
import { GameState, Player, GameMode } from '../types';
import { createBaseGameState } from '../../hooks/game/__tests__/testUtils';

// Mock Constants if needed, but we rely on imported ones. 
// Assuming MANCHE_WIN_THRESHOLD is 3.

const createMockState = (playersData: { id: string, stars: number, totalPoints: number }[], gameMode: GameMode = 'SCORE', winningCondition: number = 30): GameState => createBaseGameState({
    players: playersData.map(p => ({
        id: p.id,
        name: p.id,
        currentMancheStars: p.stars,
        totalPoints: p.totalPoints,
        mancheWins: 0,
        totalRoundWins: 0,
        totalCochons: 0,
        isCochon: false,
        status: 'HUMAN',
        hand: [],
        handSize: 0,
    } as unknown as Player)),
    currentPlayerId: playersData[0].id,
    gameMode,
    winningCondition,
});

describe('Scoring Verification', () => {
    // Helper to log clear results
    const logResult = (title: string, result: GameState, expected: any) => {
        console.error(`\n--- ${title} ---`);
        result.players.forEach(p => {
            console.error(`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`);
        });
        console.error(`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`);
    };

    test('1. Test Chirée', () => {
        // A=2, B=1, C=0. C wins round.
        // Expect: All stars reset to 0.
        const state = createMockState([
            { id: 'A', stars: 2, totalPoints: 2 },
            { id: 'B', stars: 1, totalPoints: 1 },
            { id: 'C', stars: 0, totalPoints: 0 }
        ]);

        const newState = finalizeRound(state, 'C');
        logResult('Test 1: Chirée (C wins)', newState, {});

        // Les étoiles ne sont plus remises à 0 à ce stade ! C'est UI (GameScreen) qui fera le reset.
        // A avait 2, B avait 1, C vient de gagner donc il passe de 0 à 1.
        expect(newState.players.find(p => p.id === 'A')?.currentMancheStars).toBe(2);
        expect(newState.players.find(p => p.id === 'B')?.currentMancheStars).toBe(1);
        expect(newState.players.find(p => p.id === 'C')?.currentMancheStars).toBe(1);

        expect(newState.mancheResult).toBe('CHIRE');

        // Vérifier l'historique
        expect(newState.mancheHistory.length).toBe(1);
        expect(newState.mancheHistory[0].points['A']).toBe(2);
        expect(newState.mancheHistory[0].points['C']).toBe(1);
    });

    test('2. Test Double Cochon', () => {
        // A=2, B=0, C=0. A wins round.
        // Expect: A finishes with +5 points (3 stars + 2 cochons). Losers -1.
        const state = createMockState([
            { id: 'A', stars: 2, totalPoints: 2 },
            { id: 'B', stars: 0, totalPoints: 0 },
            { id: 'C', stars: 0, totalPoints: 0 }
        ]);

        const newState = finalizeRound(state, 'A');
        logResult('Test 2: Double Cochon (A wins)', newState, {});

        const playerA = newState.players.find(p => p.id === 'A');
        const playerB = newState.players.find(p => p.id === 'B');
        const playerC = newState.players.find(p => p.id === 'C');

        expect(playerA?.currentMancheStars).toBe(3); 
        expect(newState.phase).toBe('MANCHE_END');
        
        // Bug C1 REPAIRED: Player A gets exactly 5 points (3 stars + 2 cochons) at the end of the Manche
        expect(playerA?.totalPoints).toBe(5);
        expect(playerB?.totalPoints).toBe(-1); // Les cochons perdent 1 point
        expect(playerC?.totalPoints).toBe(-1); 
    });

    test('3. Test Simple Cochon', () => {
        // A=2, B=1, C=0. A wins round.
        // Expect: A finishes with +4 points. C -1.
        const state = createMockState([
            { id: 'A', stars: 2, totalPoints: 2 },
            { id: 'B', stars: 1, totalPoints: 1 },
            { id: 'C', stars: 0, totalPoints: 0 }
        ]);

        const newState = finalizeRound(state, 'A');
        logResult('Test 3: Simple Cochon (A wins)', newState, {});

        const playerA = newState.players.find(p => p.id === 'A');
        expect(playerA?.currentMancheStars).toBe(3);
        // A Points: 3 (stars) + 1 (Cochon) = 4.
        expect(playerA?.totalPoints).toBe(4);
    });

    test('9. Bug C1: Double Attribution (Round win gives NO match points)', () => {
        // A=0, B=0, C=0.
        // A wins the first round.
        // Expect: A gets 1 star, but 0 totalPoints.
        const state = createMockState([
            { id: 'A', stars: 0, totalPoints: 0 },
            { id: 'B', stars: 0, totalPoints: 0 },
            { id: 'C', stars: 0, totalPoints: 0 }
        ]);

        const newState = finalizeRound(state, 'A');
        const playerA = newState.players.find(p => p.id === 'A');
        
        expect(playerA?.currentMancheStars).toBe(1);
        expect(playerA?.totalRoundWins).toBe(1);
        expect(playerA?.totalPoints).toBe(1); // 1 point pour le round gagné !
    });

    test('4. Test Match NOT Over after round win (must wait for manche end)', () => {
        // A=29, Goal=30. A wins round.
        // Expect: A gets 1 point (total 30) but phase remains PARTIE_END because manche is not over.
        const state = createMockState([
            { id: 'A', stars: 0, totalPoints: 29 },
            { id: 'B', stars: 0, totalPoints: 10 },
            { id: 'C', stars: 0, totalPoints: 10 }
        ], 'SCORE', 30);

        const newState = finalizeRound(state, 'A');
        logResult('Test 4: Match NOT Over after round', newState, {});

        const playerA = newState.players.find(p => p.id === 'A');
        expect(playerA?.totalPoints).toBe(30);
        expect(newState.phase).toBe('MATCH_END');
    });

    test('5. Test Match Over at Manche End', () => {
        // A=2 Stars, 29 Points. Goal=30. A wins round.
        // Result: A gets +1 Star (3 Stars => Manche Win) AND +1 Point (30 Pts => Match Win).
        // Since it's end of Manche, Match Win is triggered.
        const state = createMockState([
            { id: 'A', stars: 2, totalPoints: 29 },
            { id: 'B', stars: 0, totalPoints: 10 },
            { id: 'C', stars: 0, totalPoints: 10 }
        ], 'SCORE', 30);

        const newState = finalizeRound(state, 'A');
        logResult('Test 5: Match Over at Manche End', newState, {});

        const playerA = newState.players.find(p => p.id === 'A');
        expect(playerA?.totalPoints).toBe(32); // 29 + 1 (round) + 2 (cochon bonus) = 32. (Les 2 stars d'avant étaient déjà à 29)
        expect(newState.phase).toBe('MATCH_END');
    });

    test('6. Test Manche History Recording', () => {
        const state = createMockState([
            { id: 'A', stars: 2, totalPoints: 10 },
            { id: 'B', stars: 0, totalPoints: 5 },
            { id: 'C', stars: 0, totalPoints: 5 }
        ], 'SCORE', 100);

        const newState = finalizeRound(state, 'A');

        expect(newState.mancheHistory).toBeDefined();
        expect(newState.mancheHistory.length).toBe(1);
        expect(newState.mancheHistory[0].winnerId).toBe('A');
        expect(newState.mancheHistory[0].points['A']).toBe(5); // 3 (stars) + 2 (cochons)
    });

    test('7. Test Tie-Breaker at Threshold (End of Manche)', () => {
        // A and B both hit threshold at the end of a manche.
        // A wins the round and the manche.
        // A: 27 pts + 3 bonus = 30 pts.
        // B: 30 pts.
        // Both >= 30, but it's a tie for the lead.
        const state = createMockState([
            { id: 'A', stars: 2, totalPoints: 28 }, 
            { id: 'B', stars: 1, totalPoints: 30 }, 
            { id: 'C', stars: 0, totalPoints: 10 }
        ], 'SCORE', 30);

        const newState = finalizeRound(state, 'A');
        logResult('Test 7: Tie-Breaker (A and B at 30)', newState, {});

        const playerA = newState.players.find(p => p.id === 'A');
        const playerB = newState.players.find(p => p.id === 'B');

        expect(playerA?.totalPoints).toBe(30);
        expect(playerB?.totalPoints).toBe(30);

        // Match should NOT be over because of the tie
        expect(newState.phase).toBe('MANCHE_END');
    });

    test('8. Test resolveBoude with Cochon scoring', () => {
        // A=2 Stars, B=0, C=0.
        // It's a Boudé. We must resolve it.
        // A's hand = 5 points. B's hand = 20 points. C's hand = 30 points.
        // A has the lowest score, so A wins.
        // Because B and C have 0 stars, it's a Double Cochon.
        let state = createMockState([
            { id: 'A', stars: 2, totalPoints: 0 },
            { id: 'B', stars: 0, totalPoints: 0 },
            { id: 'C', stars: 0, totalPoints: 0 }
        ]);

        state.phase = 'BOUDE';
        state.players[0].hand = [{ id: '1', left: 2, right: 3 } as any]; // 5 pts
        state.players[1].hand = [{ id: '2', left: 10, right: 10 } as any]; // 20 pts
        state.players[2].hand = [{ id: '3', left: 15, right: 15 } as any]; // 30 pts

        const { resolveBoude } = require('../LogicEngine');
        const { newState, isTie } = resolveBoude(state);

        logResult('Test 8: Boudé resolved (A wins, Double Cochon)', newState, {});

        expect(isTie).toBe(false);
        // A should get 1 (win) + 2 (cochons) = 3 total points.
        const playerA = newState.players.find((p: Player) => p.id === 'A');
        expect(playerA?.totalPoints).toBe(3);
        // Phase should be MATCH_END if winningCondition is 3 ? Wait, default winningCondition is 30.
        // It should be MANCHE_END because A reaches 3 stars.
        expect(newState.phase).toBe('MANCHE_END');
        expect(newState.mancheResult).toBe('COCHON');
    });
});
