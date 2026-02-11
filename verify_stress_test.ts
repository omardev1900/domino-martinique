
import { handleEndOfRound } from './mobile/src/core/LogicEngine';
import { GameState, Player, PlayerId } from './mobile/src/core/types';

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
    turnDuration: 15,
    lastActionTimestamp: Date.now()
});

const simulateGame = (mode: 'MANCHE' | 'SCORE' | 'COCHON', condition: number) => {
    let p1 = createMockPlayer('p1', 'Alice');
    let p2 = createMockPlayer('p2', 'Bob');
    let p3 = createMockPlayer('p3', 'Charlie');
    let state = createInitialState([p1, p2, p3], mode, condition);

    let roundCount = 0;
    console.log(`\n--- Starting Match Mode: ${mode} (to ${condition}) ---`);

    while (state.phase !== 'MATCH_END') {
        roundCount++;
        // Randomly pick a winner for the round
        const winnerIdx = Math.floor(Math.random() * 3);
        const winnerId = state.players[winnerIdx].id;

        state = handleEndOfRound(state, winnerId);

        if (state.phase === 'MANCHE_END' || state.phase === 'MATCH_END') {
            console.log(`Manche ended! Results: ${state.players.map(p => `${p.name}: ${p.wins} wins (Total Pts: ${p.totalPoints}, Cochons: ${p.totalCochons})`).join(' | ')}`);

            // Reset wins for next manche (manual simulation of handleNextRound logic)
            state.players = state.players.map(p => ({
                ...p,
                wins: 0,
                isCochon: false
            }));
            state.phase = state.phase === 'MATCH_END' ? 'MATCH_END' : 'PLAYING';
        }
    }

    console.log(`Match Finished in ${roundCount} rounds.`);
    state.players.forEach(p => {
        console.log(`Final Stats - ${p.name}: Points=${p.totalPoints}, MancheWins=${p.mancheWins}, Cochons=${p.totalCochons}`);
    });

    // Verification
    if (mode === 'MANCHE') {
        const winner = state.players.find(p => p.mancheWins >= condition);
        if (!winner) throw new Error("Match should have ended with a winner in MANCHE mode");
    } else if (mode === 'SCORE') {
        const winner = state.players.find(p => p.totalPoints >= condition);
        if (!winner) throw new Error("Match should have ended with a winner in SCORE mode");
    } else if (mode === 'COCHON') {
        const winner = state.players.find(p => p.totalCochons >= condition);
        if (!winner) throw new Error("Match should have ended with a winner in COCHON mode");
    }
};

const runStressTest = () => {
    try {
        simulateGame('MANCHE', 2);
        simulateGame('SCORE', 10);
        simulateGame('COCHON', 2);
        console.log("\n✅ STRESS TEST SUCCESSFUL: All modes reached termination correctly with consistent scores.");
    } catch (e: any) {
        console.error("\n❌ STRESS TEST FAILED:", e.message);
        process.exit(1);
    }
};

runStressTest();
