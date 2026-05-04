/**
 * LeaderboardClassement.test.ts
 *
 * Tests unitaires pour :
 *   1. leaderboard.service — lecture de totalCochonsSubis, gamesPlayed, totalPointsAccumulated
 *   2. Logique de tri des 3 catégories (+Cochons, -Cochons, +Points)
 *   3. Départage par gamesPlayed en cas d'égalité
 *   4. Cas legacy (anciens records sans mancheLeaguePointsEarned)
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    query: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    where: jest.fn(),
    onSnapshot: jest.fn(),
    getCountFromServer: jest.fn(),
}));

jest.mock('../services/firebase', () => ({ db: {} }));
jest.mock('../services/leaderboard.time', () => ({
    getStartOfCurrentMonthUtc: () => 0,
}));

import { onSnapshot } from 'firebase/firestore';
import { leaderboardService, LeaderboardEntry } from '../services/leaderboard.service';

// ─── Helper : construire un doc Firestore simulé ──────────────────────────────

interface FakeStatsOverrides {
    totalCochonsInflicted?: number;
    totalCochonsSubis?: number;
    totalPointsAccumulated?: number;
    gamesPlayed?: number;
    matchHistory?: any[];
}

const makeDoc = (uid: string, stats: FakeStatsOverrides = {}) => ({
    id: uid,
    data: () => ({
        displayName: uid,
        avatarId: 'avatar_default',
        economy: { xp: 100, coins: 200, level: 1, cochonsGiven: 0 },
        stats: {
            totalCochonsInflicted: stats.totalCochonsInflicted ?? 0,
            totalCochonsSubis: stats.totalCochonsSubis,   // undefined simulera un champ absent
            totalPointsAccumulated: stats.totalPointsAccumulated ?? 0,
            gamesPlayed: stats.gamesPlayed ?? 0,
            matchHistory: stats.matchHistory ?? [],
        },
    }),
});

// Déclenche le callback onSnapshot avec les docs fournis
const triggerSnapshot = (docs: ReturnType<typeof makeDoc>[]) => {
    const cb = (onSnapshot as jest.Mock).mock.calls[0][1];
    cb({ forEach: (fn: (d: any) => void) => docs.forEach(fn) });
};

// ─── Suite 1 : lecture des champs dans leaderboard.service ───────────────────

describe('LeaderboardService — lecture des champs enrichis', () => {

    let entries: LeaderboardEntry[] = [];

    beforeEach(() => {
        entries = [];
        (onSnapshot as jest.Mock).mockImplementation((_q, cb) => {
            // stocke cb pour triggerSnapshot
            return jest.fn();
        });
        leaderboardService.subscribeLeaderboard('COCHONS', 50, (e) => { entries = e; });
    });

    it('lit totalCochonsSubis depuis stats Firestore', () => {
        triggerSnapshot([makeDoc('uid1', { totalCochonsSubis: 8 })]);
        expect(entries[0].totalCochonsSubis).toBe(8);
    });

    it('totalCochonsSubis absent dans Firestore → 0 (ancien compte)', () => {
        triggerSnapshot([makeDoc('uid1', {})]);
        // totalCochonsSubis non défini dans makeDoc
        expect(entries[0].totalCochonsSubis).toBe(0);
    });

    it('lit gamesPlayed depuis stats Firestore', () => {
        triggerSnapshot([makeDoc('uid1', { gamesPlayed: 42 })]);
        expect(entries[0].gamesPlayed).toBe(42);
    });

    it('lit totalPointsAccumulated depuis stats Firestore', () => {
        triggerSnapshot([makeDoc('uid1', { totalPointsAccumulated: 350 })]);
        expect(entries[0].totalPointsAccumulated).toBe(350);
    });

    it('plusieurs joueurs sont tous enrichis', () => {
        triggerSnapshot([
            makeDoc('uid1', { totalCochonsSubis: 3, gamesPlayed: 10, totalPointsAccumulated: 50 }),
            makeDoc('uid2', { totalCochonsSubis: 7, gamesPlayed: 20, totalPointsAccumulated: 90 }),
        ]);
        expect(entries).toHaveLength(2);
        expect(entries[0].totalCochonsSubis).toBe(3);
        expect(entries[1].totalCochonsSubis).toBe(7);
    });
});

// ─── Helper de tri (reproduit la logique de LeagueHubView) ─

type Category = 'PLUS_COCHONS' | 'MOINS_COCHONS' | 'PLUS_POINTS';

const sortEntries = (list: LeaderboardEntry[], cat: Category): LeaderboardEntry[] =>
    [...list].sort((a, b) => {
        if (cat === 'PLUS_COCHONS') {
            const diff = b.cochonsGiven - a.cochonsGiven;
            return diff !== 0 ? diff : b.gamesPlayed - a.gamesPlayed;
        }
        if (cat === 'MOINS_COCHONS') {
            const diff = a.totalCochonsSubis - b.totalCochonsSubis;
            return diff !== 0 ? diff : b.gamesPlayed - a.gamesPlayed;
        }
        const diff = b.totalPointsAccumulated - a.totalPointsAccumulated;
        return diff !== 0 ? diff : b.gamesPlayed - a.gamesPlayed;
    });

const makeEntry = (uid: string, overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry => ({
    uid,
    displayName: uid,
    avatarId: 'avatar_default',
    xp: 0,
    coins: 0,
    level: 1,
    leagueGrade: 'APPRENTI_1',
    leaguePoints: 0,
    cochonsGiven: 0,
    cochonsGivenThisMonth: 0,
    totalCochonsSubis: 0,
    totalPointsAccumulated: 0,
    gamesPlayed: 0,
    rank: 1,
    ...overrides,
});

// ─── Suite 2 : tri +Cochons ───────────────────────────────────────────────────

describe('Tri +Cochons (cochonsGiven décroissant)', () => {

    it('le joueur avec le plus de cochons donnés est en tête', () => {
        const list = [
            makeEntry('A', { cochonsGiven: 5 }),
            makeEntry('B', { cochonsGiven: 20 }),
            makeEntry('C', { cochonsGiven: 12 }),
        ];
        const sorted = sortEntries(list, 'PLUS_COCHONS');
        expect(sorted.map(e => e.uid)).toEqual(['B', 'C', 'A']);
    });

    it('en cas d\'égalité, celui avec plus de matchs joués passe devant', () => {
        const list = [
            makeEntry('A', { cochonsGiven: 10, gamesPlayed: 5 }),
            makeEntry('B', { cochonsGiven: 10, gamesPlayed: 15 }),
        ];
        const sorted = sortEntries(list, 'PLUS_COCHONS');
        expect(sorted[0].uid).toBe('B');
    });

    it('zéro cochon → ordre stable par gamesPlayed', () => {
        const list = [
            makeEntry('A', { cochonsGiven: 0, gamesPlayed: 3 }),
            makeEntry('B', { cochonsGiven: 0, gamesPlayed: 8 }),
        ];
        const sorted = sortEntries(list, 'PLUS_COCHONS');
        expect(sorted[0].uid).toBe('B');
    });
});

// ─── Suite 3 : tri -Cochons ───────────────────────────────────────────────────

describe('Tri -Cochons (totalCochonsSubis croissant)', () => {

    it('le joueur avec le moins de cochons subis est en tête', () => {
        const list = [
            makeEntry('A', { totalCochonsSubis: 10 }),
            makeEntry('B', { totalCochonsSubis: 2 }),
            makeEntry('C', { totalCochonsSubis: 7 }),
        ];
        const sorted = sortEntries(list, 'MOINS_COCHONS');
        expect(sorted.map(e => e.uid)).toEqual(['B', 'C', 'A']);
    });

    it('en cas d\'égalité, celui avec plus de matchs joués passe devant', () => {
        const list = [
            makeEntry('A', { totalCochonsSubis: 3, gamesPlayed: 10 }),
            makeEntry('B', { totalCochonsSubis: 3, gamesPlayed: 25 }),
        ];
        const sorted = sortEntries(list, 'MOINS_COCHONS');
        expect(sorted[0].uid).toBe('B');
    });

    it('0 cochon subi (nouveau joueur) → en tête', () => {
        const list = [
            makeEntry('A', { totalCochonsSubis: 5 }),
            makeEntry('B', { totalCochonsSubis: 0 }),
        ];
        const sorted = sortEntries(list, 'MOINS_COCHONS');
        expect(sorted[0].uid).toBe('B');
    });
});

// ─── Suite 4 : tri +Points ────────────────────────────────────────────────────

describe('Tri +Points (totalPointsAccumulated décroissant)', () => {

    it('le joueur avec le plus de points est en tête', () => {
        const list = [
            makeEntry('A', { totalPointsAccumulated: 100 }),
            makeEntry('B', { totalPointsAccumulated: 500 }),
            makeEntry('C', { totalPointsAccumulated: 250 }),
        ];
        const sorted = sortEntries(list, 'PLUS_POINTS');
        expect(sorted.map(e => e.uid)).toEqual(['B', 'C', 'A']);
    });

    it('en cas d\'égalité, celui avec plus de matchs joués passe devant', () => {
        const list = [
            makeEntry('A', { totalPointsAccumulated: 200, gamesPlayed: 5 }),
            makeEntry('B', { totalPointsAccumulated: 200, gamesPlayed: 20 }),
        ];
        const sorted = sortEntries(list, 'PLUS_POINTS');
        expect(sorted[0].uid).toBe('B');
    });
});

// ─── Suite 5 : cas legacy (anciens enregistrements) ──────────────────────────

describe('Cas legacy — totalCochonsSubis absent ou 0', () => {

    it('joueur legacy (totalCochonsSubis=0) inclus dans le tri -Cochons', () => {
        const list = [
            makeEntry('new',    { totalCochonsSubis: 3, gamesPlayed: 10 }),
            makeEntry('legacy', { totalCochonsSubis: 0, gamesPlayed: 5 }),
        ];
        const sorted = sortEntries(list, 'MOINS_COCHONS');
        // legacy à 0 cochons subis passe devant
        expect(sorted[0].uid).toBe('legacy');
    });

    it('deux joueurs legacy à 0 : départage par gamesPlayed', () => {
        const list = [
            makeEntry('legacyA', { totalCochonsSubis: 0, gamesPlayed: 3 }),
            makeEntry('legacyB', { totalCochonsSubis: 0, gamesPlayed: 8 }),
        ];
        const sorted = sortEntries(list, 'MOINS_COCHONS');
        expect(sorted[0].uid).toBe('legacyB');
    });

    it('joueur legacy n\'affecte pas le tri +Cochons', () => {
        const list = [
            makeEntry('A', { cochonsGiven: 15, totalCochonsSubis: 0 }),
            makeEntry('B', { cochonsGiven: 8,  totalCochonsSubis: 0 }),
        ];
        const sorted = sortEntries(list, 'PLUS_COCHONS');
        expect(sorted[0].uid).toBe('A');
    });
});

// ─── Suite 6 : départage multi-critères ──────────────────────────────────────

describe('Départage gamesPlayed — cas limites', () => {

    it('gamesPlayed identique → ordre stable (pas de crash)', () => {
        const list = [
            makeEntry('A', { cochonsGiven: 10, gamesPlayed: 10 }),
            makeEntry('B', { cochonsGiven: 10, gamesPlayed: 10 }),
        ];
        expect(() => sortEntries(list, 'PLUS_COCHONS')).not.toThrow();
    });

    it('gamesPlayed = 0 pour tous → pas de crash', () => {
        const list = [
            makeEntry('A', { totalCochonsSubis: 0, gamesPlayed: 0 }),
            makeEntry('B', { totalCochonsSubis: 0, gamesPlayed: 0 }),
        ];
        expect(() => sortEntries(list, 'MOINS_COCHONS')).not.toThrow();
    });
});
