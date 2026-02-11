
import { calculateCochonPoints } from './LogicEngine';
import { Player } from './types';

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

describe('Phase 2.1: In-game Feedback Logic', () => {
    test('Chiré detection (2-1-1)', () => {
        const players = [
            createMockPlayer('p1', 2),
            createMockPlayer('p2', 1),
            createMockPlayer('p3', 1)
        ];
        const res = calculateCochonPoints(players);
        expect(res.result).toBe('CHIRE');
    });

    test('Single Cochon detection (3-1-0)', () => {
        const players = [
            createMockPlayer('p1', 3),
            createMockPlayer('p2', 1),
            createMockPlayer('p3', 0)
        ];
        const res = calculateCochonPoints(players);
        expect(res.result).toBe('COCHON');
        expect(res.pointsMap.get('p1')).toBe(4); // Winner gets 4
        expect(res.pointsMap.get('p3')).toBe(-1); // Cochon gets -1
    });

    test('Double Cochon detection (3-0-0)', () => {
        const players = [
            createMockPlayer('p1', 3),
            createMockPlayer('p2', 0),
            createMockPlayer('p3', 0)
        ];
        const res = calculateCochonPoints(players);
        expect(res.result).toBe('COCHON');
        expect(res.pointsMap.get('p1')).toBe(5); // Winner gets 5
        expect(res.pointsMap.get('p2')).toBe(-1);
        expect(res.pointsMap.get('p3')).toBe(-1);
    });
});
