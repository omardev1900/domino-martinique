/**
 * ad.service.test.ts
 *
 * Tests unitaires pour AdService — système publicitaire Phase 1.
 * Spec : docs/specs/ADS_SYSTEM.md
 */

// ─── Mocks ────────────────────────────────────────────────────────────────

// ─── Imports (après les mocks) ────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import { adService } from './ad.service';
import { Ad } from '../ad.types';

jest.mock('@react-native-async-storage/async-storage', () => {
    const store = new Map<string, string>();
    return {
        __esModule: true,
        default: {
            getItem: jest.fn((k: string) => Promise.resolve(store.get(k) ?? null)),
            setItem: jest.fn((k: string, v: string) => { store.set(k, v); return Promise.resolve(); }),
            removeItem: jest.fn((k: string) => { store.delete(k); return Promise.resolve(); }),
            clear: jest.fn(() => { store.clear(); return Promise.resolve(); }),
        },
    };
});

jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(),
    Timestamp: class Timestamp {},
}));

jest.mock('./firebase', () => ({ db: {} }));

// ─── Fixtures ─────────────────────────────────────────────────────────────

const ONE_DAY = 24 * 60 * 60 * 1000;

function makeAd(overrides: Partial<Ad> = {}): Ad {
    const now = Date.now();
    return {
        id: 'ad1',
        title: 'Test Ad',
        imageUrl: 'https://example.com/img.jpg',
        targetUrl: null,
        active: true,
        startsAt: now - ONE_DAY,
        endsAt: now + ONE_DAY,
        placements: ['HOME'],
        frequency: 'EVERY_TIME',
        createdAt: now,
        ...overrides,
    };
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('AdService', () => {

    beforeEach(async () => {
        await AsyncStorage.clear();
        adService._resetForTest();
        await adService.resetSessionCooldowns();
    });

    // ─── Filtrage : placement, date, active ──────────────────────────────

    describe('getAdForPlacement — filtrage', () => {

        it('retourne null si aucune pub ne cible le placement demandé', async () => {
            adService._setCachedForTest([makeAd({ placements: ['BEFORE_SOLO'] })]);
            expect(await adService.getAdForPlacement('HOME')).toBeNull();
        });

        it('retourne la pub dont le placement correspond', async () => {
            adService._setCachedForTest([makeAd()]);
            const ad = await adService.getAdForPlacement('HOME');
            expect(ad?.id).toBe('ad1');
        });

        it('ignore les pubs dont startsAt est dans le futur', async () => {
            adService._setCachedForTest([makeAd({ startsAt: Date.now() + ONE_DAY })]);
            expect(await adService.getAdForPlacement('HOME')).toBeNull();
        });

        it('ignore les pubs dont endsAt est dans le passé', async () => {
            adService._setCachedForTest([makeAd({ endsAt: Date.now() - ONE_DAY })]);
            expect(await adService.getAdForPlacement('HOME')).toBeNull();
        });

        it('ignore les pubs inactives (active: false)', async () => {
            adService._setCachedForTest([makeAd({ active: false })]);
            expect(await adService.getAdForPlacement('HOME')).toBeNull();
        });

        it('retourne la pub la plus récente (createdAt desc) si plusieurs candidates', async () => {
            const old = makeAd({ id: 'old', createdAt: Date.now() - 10_000 });
            const fresh = makeAd({ id: 'fresh', createdAt: Date.now() });
            adService._setCachedForTest([old, fresh]);
            const ad = await adService.getAdForPlacement('HOME');
            expect(ad?.id).toBe('fresh');
        });
    });

    // ─── Fréquence : EVERY_TIME ──────────────────────────────────────────

    describe('Fréquence — EVERY_TIME', () => {

        it('retourne la pub à chaque appel (pas de cooldown)', async () => {
            adService._setCachedForTest([makeAd({ frequency: 'EVERY_TIME' })]);
            expect((await adService.getAdForPlacement('HOME'))?.id).toBe('ad1');
            expect((await adService.getAdForPlacement('HOME'))?.id).toBe('ad1');
            expect((await adService.getAdForPlacement('HOME'))?.id).toBe('ad1');
        });
    });

    // ─── Fréquence : ONCE_PER_SESSION ────────────────────────────────────

    describe('Fréquence — ONCE_PER_SESSION', () => {

        it('retourne la pub une seule fois, puis null', async () => {
            adService._setCachedForTest([makeAd({ frequency: 'ONCE_PER_SESSION' })]);
            expect((await adService.getAdForPlacement('HOME'))?.id).toBe('ad1');
            expect(await adService.getAdForPlacement('HOME')).toBeNull();
        });

        it('resetSessionCooldowns() permet de ré-afficher la pub', async () => {
            adService._setCachedForTest([makeAd({ frequency: 'ONCE_PER_SESSION' })]);

            await adService.getAdForPlacement('HOME');
            expect(await adService.getAdForPlacement('HOME')).toBeNull();

            await adService.resetSessionCooldowns();
            expect((await adService.getAdForPlacement('HOME'))?.id).toBe('ad1');
        });

        it('persiste la session dans AsyncStorage (survie à la ré-instanciation du cache mémoire)', async () => {
            adService._setCachedForTest([makeAd({ frequency: 'ONCE_PER_SESSION' })]);
            await adService.getAdForPlacement('HOME');

            // Simule un rechargement du service (cache + Set mémoire vidés) SANS reset session.
            adService._resetForTest();
            adService._setCachedForTest([makeAd({ frequency: 'ONCE_PER_SESSION' })]);

            expect(await adService.getAdForPlacement('HOME')).toBeNull();
        });
    });

    // ─── Fréquence : ONCE_PER_DAY ────────────────────────────────────────

    describe('Fréquence — ONCE_PER_DAY', () => {

        it('retourne la pub une seule fois dans la même journée', async () => {
            adService._setCachedForTest([makeAd({ frequency: 'ONCE_PER_DAY' })]);
            expect((await adService.getAdForPlacement('HOME'))?.id).toBe('ad1');
            expect(await adService.getAdForPlacement('HOME')).toBeNull();
        });

        it("retourne la pub si la date stockée n'est pas aujourd'hui", async () => {
            await AsyncStorage.setItem('ad_daily_cooldown_ad1', '2020-01-01');
            adService._setCachedForTest([makeAd({ frequency: 'ONCE_PER_DAY' })]);
            expect((await adService.getAdForPlacement('HOME'))?.id).toBe('ad1');
        });

        it('survit à resetSessionCooldowns() (ne reset QUE la session, pas le daily)', async () => {
            adService._setCachedForTest([makeAd({ frequency: 'ONCE_PER_DAY' })]);
            await adService.getAdForPlacement('HOME');

            await adService.resetSessionCooldowns();
            expect(await adService.getAdForPlacement('HOME')).toBeNull();
        });
    });

    // ─── Intégration : plusieurs pubs avec fréquences mixtes ─────────────

    describe('Cas combinés', () => {

        it('si la pub la plus récente est en cooldown, retourne la suivante éligible', async () => {
            const recentSession = makeAd({
                id: 'recent',
                frequency: 'ONCE_PER_SESSION',
                createdAt: Date.now(),
            });
            const olderEveryTime = makeAd({
                id: 'older',
                frequency: 'EVERY_TIME',
                createdAt: Date.now() - 10_000,
            });
            adService._setCachedForTest([recentSession, olderEveryTime]);

            // 1er appel → la plus récente (session)
            expect((await adService.getAdForPlacement('HOME'))?.id).toBe('recent');
            // 2e appel → la plus récente est en cooldown, fallback sur la suivante
            expect((await adService.getAdForPlacement('HOME'))?.id).toBe('older');
        });
    });
});
