
import { calculateCochonPoints } from './mobile/src/core/LogicEngine';
import { Player } from './mobile/src/core/types';

const createMockPlayer = (id: string, wins: number): Player => ({
    id,
    name: `Player ${id}`,
    hand: [],
    handSize: 0,
    wins,
    mancheWins: 0,
    totalPoints: 0,
    isCochon: false,
    totalCochons: 0,
    isBot: false
});

const runTest = () => {
    console.log("🧪 VERIFICATION PHASE 2.1: Logic Engine Scores & Results");

    // Case 1: Chiré (all have at least 1 win)
    const playersChire = [
        createMockPlayer('p1', 2),
        createMockPlayer('p2', 1),
        createMockPlayer('p3', 1)
    ];
    const resChire = calculateCochonPoints(playersChire);
    console.log(`- Chiré (2-1-1): Result=${resChire.result} (Expected: CHIRE)`);

    // Case 2: Cochon (one player with 0 wins)
    const playersCochon1 = [
        createMockPlayer('p1', 3),
        createMockPlayer('p2', 1),
        createMockPlayer('p3', 0)
    ];
    const resCochon1 = calculateCochonPoints(playersCochon1);
    console.log(`- One Cochon (3-1-0): Result=${resCochon1.result}, WinnerP1 Points=${resCochon1.pointsMap.get('p1')} (Expected: COCHON, +4)`);

    // Case 3: Double Cochon (two players with 0 wins)
    const playersCochon2 = [
        createMockPlayer('p1', 3),
        createMockPlayer('p2', 0),
        createMockPlayer('p3', 0)
    ];
    const resCochon2 = calculateCochonPoints(playersCochon2);
    console.log(`- Two Cochons (3-0-0): Result=${resCochon2.result}, WinnerP1 Points=${resCochon2.pointsMap.get('p1')} (Expected: COCHON, +5)`);

    if (resChire.result === 'CHIRE' && resCochon1.pointsMap.get('p1') === 4 && resCochon2.pointsMap.get('p1') === 5) {
        console.log("\n✅ LOGIC VALIDATED for Phase 2.1 transition.");
    } else {
        console.log("\n❌ LOGIC ERROR detected.");
        process.exit(1);
    }
};

runTest();
