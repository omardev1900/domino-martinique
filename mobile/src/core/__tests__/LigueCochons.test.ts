/**
 * LigueCochons.test.ts
 *
 * Tests unitaires pour la logique de déblocage des paliers
 * de la Ligue des Cochons (LeagueService.computeNewUnlocks).
 *
 * Cas testés :
 *  - Aucun déblocage (en dessous des seuils)
 *  - Mono-palier (franchissement d'un seul seuil)
 *  - Multi-paliers en cascade (franchissement de plusieurs seuils en un match)
 *  - Idempotence (palier déjà débloqué ne se rejoue pas)
 *  - Grade max (500 cochons)
 */

import { leagueService } from '../services/league.service';

const NO_FRAMES: string[] = [];

describe('LeagueService — computeNewUnlocks', () => {

    // ─── Cas 1 : Aucun déblocage ─────────────────────────────────────────────

    it('retourne un tableau vide si on reste en dessous de 30 cochons', () => {
        const events = leagueService.computeNewUnlocks(0, 10, NO_FRAMES);
        expect(events).toHaveLength(0);
    });

    it('retourne un tableau vide si on était déjà à 25 et on ajoute 4 (total=29)', () => {
        const events = leagueService.computeNewUnlocks(25, 4, NO_FRAMES);
        expect(events).toHaveLength(0);
    });

    // ─── Cas 2 : Mono-palier — APPRENTI (30) ─────────────────────────────────

    it('débloque APPRENTI (frame_argent) en franchissant 30', () => {
        const events = leagueService.computeNewUnlocks(28, 3, NO_FRAMES);
        expect(events).toHaveLength(1);
        expect(events[0].grade).toBe('APPRENTI');
        expect(events[0].frameId).toBe('frame_argent');
        expect(events[0].coinsBonus).toBe(500);
    });

    it('débloque APPRENTI exactement sur 30', () => {
        const events = leagueService.computeNewUnlocks(29, 1, NO_FRAMES);
        expect(events).toHaveLength(1);
        expect(events[0].grade).toBe('APPRENTI');
    });

    // ─── Cas 3 : Mono-palier — MAITRE (150) ──────────────────────────────────

    it('débloque MAITRE (frame_or) en franchissant 150 (déjà APPRENTI débloqué)', () => {
        const already = ['frame_argent'];
        const events = leagueService.computeNewUnlocks(148, 5, already);
        expect(events).toHaveLength(1);
        expect(events[0].grade).toBe('MAITRE');
        expect(events[0].frameId).toBe('frame_or');
        expect(events[0].coinsBonus).toBe(2000);
    });

    // ─── Cas 4 : Mono-palier — ROI (250) ─────────────────────────────────────

    it('débloque ROI (frame_diamant) en franchissant 250', () => {
        const already = ['frame_argent', 'frame_or'];
        const events = leagueService.computeNewUnlocks(240, 15, already);
        expect(events).toHaveLength(1);
        expect(events[0].grade).toBe('ROI');
        expect(events[0].frameId).toBe('frame_diamant');
        expect(events[0].coinsBonus).toBe(5000);
    });

    // ─── Cas 5 : Mono-palier — LEGENDE (500) ─────────────────────────────────

    it('débloque LEGENDE (frame_feu) en franchissant 500', () => {
        const already = ['frame_argent', 'frame_or', 'frame_diamant'];
        const events = leagueService.computeNewUnlocks(490, 15, already);
        expect(events).toHaveLength(1);
        expect(events[0].grade).toBe('LEGENDE');
        expect(events[0].frameId).toBe('frame_feu');
        expect(events[0].coinsBonus).toBe(10000);
    });

    // ─── Cas 6 : Multi-paliers en cascade ────────────────────────────────────

    it('débloque APPRENTI + MAITRE en cascade si on passe de 0 à 160 cochons en un match', () => {
        const events = leagueService.computeNewUnlocks(0, 160, NO_FRAMES);
        expect(events).toHaveLength(2);
        const grades = events.map(e => e.grade);
        expect(grades).toContain('APPRENTI');
        expect(grades).toContain('MAITRE');
    });

    it('débloque les 3 premiers paliers si on passe de 0 à 260 cochons en un match (cas cheat)', () => {
        const events = leagueService.computeNewUnlocks(0, 260, NO_FRAMES);
        expect(events).toHaveLength(3);
        const grades = events.map(e => e.grade);
        expect(grades).toContain('APPRENTI');
        expect(grades).toContain('MAITRE');
        expect(grades).toContain('ROI');
    });

    it('débloque les 4 paliers si on passe de 0 à 600 cochons en un match (cascade complète)', () => {
        const events = leagueService.computeNewUnlocks(0, 600, NO_FRAMES);
        expect(events).toHaveLength(4);
        expect(events.map(e => e.grade)).toEqual(['APPRENTI', 'MAITRE', 'ROI', 'LEGENDE']);
    });

    // ─── Cas 7 : Idempotence — palier déjà débloqué ──────────────────────────

    it("ne redonne pas APPRENTI si frame_argent est déjà dans unlockedFrames", () => {
        const already = ['frame_argent'];
        const events = leagueService.computeNewUnlocks(28, 5, already); // franchit 30
        expect(events.find(e => e.grade === 'APPRENTI')).toBeUndefined();
    });

    it("ne redonne aucun palier si tous sont déjà débloqués et on ajoute des cochons", () => {
        const already = ['frame_argent', 'frame_or', 'frame_diamant', 'frame_feu'];
        const events = leagueService.computeNewUnlocks(600, 100, already);
        expect(events).toHaveLength(0);
    });

    // ─── Cas 8 : getGradeFromCochons ─────────────────────────────────────────

    describe('getGradeFromCochons', () => {
        it('retourne APPRENTI pour 0 cochons', () => {
            expect(leagueService.getGradeFromCochons(0)).toBe('APPRENTI');
        });

        it('retourne APPRENTI pour 15 cochons', () => {
            expect(leagueService.getGradeFromCochons(15)).toBe('APPRENTI');
        });

        it('retourne MAITRE pour 30 cochons', () => {
            expect(leagueService.getGradeFromCochons(30)).toBe('MAITRE');
        });

        it('retourne MAITRE pour 149 cochons', () => {
            expect(leagueService.getGradeFromCochons(149)).toBe('MAITRE');
        });

        it('retourne ROI pour 150 cochons', () => {
            expect(leagueService.getGradeFromCochons(150)).toBe('ROI');
        });

        it('retourne ROI pour 249 cochons', () => {
            expect(leagueService.getGradeFromCochons(249)).toBe('ROI');
        });

        it('retourne LEGENDE pour 250 cochons', () => {
            expect(leagueService.getGradeFromCochons(250)).toBe('LEGENDE');
        });

        it('retourne LEGENDE pour 1000 cochons', () => {
            expect(leagueService.getGradeFromCochons(1000)).toBe('LEGENDE');
        });
    });

    // ─── Cas 9 : getNextFrameThreshold ────────────────────────────────────────

    describe('getNextFrameThreshold', () => {
        it('retourne 30 pour 0 cochons', () => {
            expect(leagueService.getNextFrameThreshold(0)).toBe(30);
        });

        it('retourne 150 pour 30 cochons', () => {
            expect(leagueService.getNextFrameThreshold(30)).toBe(150);
        });

        it('retourne 250 pour 150 cochons', () => {
            expect(leagueService.getNextFrameThreshold(150)).toBe(250);
        });

        it('retourne 500 pour 250 cochons', () => {
            expect(leagueService.getNextFrameThreshold(250)).toBe(500);
        });

        it('retourne null au grade maximum (500+)', () => {
            expect(leagueService.getNextFrameThreshold(500)).toBeNull();
            expect(leagueService.getNextFrameThreshold(999)).toBeNull();
        });
    });

});
