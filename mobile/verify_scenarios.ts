
import { handleEndOfRound, calculateCochonPoints } from './src/core/LogicEngine';
import { GameState, Player, Domino } from './src/core/types';

const mockDomino: Domino = { id: 'd', left: 0, right: 0, isDouble: true, sum: 0 };

const createMockPlayer = (id: string, name: string, wins: number, totalPoints: number = 0): Player => ({
    id,
    name,
    hand: [],
    handSize: 0,
    wins,
    mancheWins: 0,
    totalPoints,
    isCochon: false,
    totalCochons: 0,
    isBot: false
});

const createMockState = (players: Player[], winningCondition: number = 3): GameState => ({
    gameId: 'test-game',
    players,
    talonMort: [],
    table: { sequence: [], leftValue: null, rightValue: null },
    currentPlayerId: players[0].id,
    phase: 'PLAYING',
    firstPlayerOfRound: null,
    history: [],
    winningCondition,
    gameMode: 'MANCHE',
    turnDuration: 15,
    lastActionTimestamp: Date.now()
});

const runTests = () => {
    console.log("-----------------------------------------");
    console.log("🧪 TEST SCENARIOS - Domino Martiniquais");
    console.log("-----------------------------------------");

    // SCENARIO 1: Chiré (2-1-1)
    console.log("\nScenario 1: Input Score 2-1-0 + Winner P3 (Final 2-1-1)");
    const players1 = [
        createMockPlayer('p1', 'P1', 2),
        createMockPlayer('p2', 'P2', 1),
        createMockPlayer('p3', 'P3', 0) // P3 is the "last cochon"
    ];
    const state1 = createMockState(players1);
    const result1 = handleEndOfRound(state1, 'p3');

    console.log("Final Wins:", result1.players.map(p => `${p.name}: ${p.wins}`).join(', '));
    console.log("Phase:", result1.phase);
    console.log("Result Type:", result1.mancheResult);
    console.log("Global Scores (TotalPoints):", result1.players.map(p => `${p.name}: ${p.totalPoints}`).join(', '));

    if (result1.phase === 'MATCH_END' && result1.mancheResult === 'CHIRE') {
        console.log("✅ SUCCESS: 2-1-1 triggered CHIRE and ended the manche.");
    } else {
        console.error("❌ FAILURE: Manche should have ended in CHIRE.");
    }

    // SCENARIO 2: Classic Victory with Cochons (3-0-0)
    console.log("\nScenario 2: Input Score 2-0-0 + Winner P1 (Final 3-0-0)");
    const players2 = [
        createMockPlayer('p1', 'P1', 2),
        createMockPlayer('p2', 'P2', 0),
        createMockPlayer('p3', 'P3', 0)
    ];
    const state2 = createMockState(players2);
    const result2 = handleEndOfRound(state2, 'p1');

    console.log("Final Wins:", result2.players.map(p => `${p.name}: ${p.wins}`).join(', '));
    console.log("Result Type:", result2.mancheResult);
    console.log("Points Awarded (TotalPoints):", result2.players.map(p => `${p.name}: ${p.totalPoints}`).join(', '));

    const p1Score = result2.players.find(p => p.id === 'p1')?.totalPoints;
    const p2Score = result2.players.find(p => p.id === 'p2')?.totalPoints;

    // Expected: P1 wins with 2 cochons. Points = +5 (cochon bonus) + 3 (wins) = 8
    // P2/P3 are cochons. Points = -1 (penalty) + 0 (wins) = -1
    if (p1Score === 8 && p2Score === -1 && result2.mancheResult === 'COCHON') {
        console.log("✅ SUCCESS: 3-0-0 rewarded winner with +8 and cochons with -1.");
    } else {
        console.error(`❌ FAILURE: Scores incorrect. Got P1=${p1Score}, P2=${p2Score}. Expected P1=8, P2=-1`);
    }

    // SCENARIO 3: Continue Manche (2-1-0)
    console.log("\nScenario 3: Input Score 1-1-0 + Winner P1 (Final 2-1-0)");
    const players3 = [
        createMockPlayer('p1', 'P1', 1),
        createMockPlayer('p2', 'P2', 1),
        createMockPlayer('p3', 'P3', 0)
    ];
    const state3 = createMockState(players3);
    const result3 = handleEndOfRound(state3, 'p1');

    console.log("Final Wins:", result3.players.map(p => `${p.name}: ${p.wins}`).join(', '));
    console.log("Phase:", result3.phase);

    if (result3.phase === 'ROUND_END') {
        console.log("✅ SUCCESS: Manche continues because a cochon (P3) still exists.");
    } else {
        console.error("❌ FAILURE: Manche should not have ended.");
    }

    console.log("\n-----------------------------------------");
    console.log("Verification finished.");
};

runTests();
