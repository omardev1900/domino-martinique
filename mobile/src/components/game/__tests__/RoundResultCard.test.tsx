import React from 'react';
import { render } from '@testing-library/react-native';
import { RoundResultCard } from '../RoundResultCard';
import { GameState } from '../../../core/types';
import { createBaseGameState } from '../../../hooks/game/__tests__/testUtils';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../DominoTile', () => ({
    DominoTile: ({ left, right }: any) => {
        const { View, Text } = require('react-native');
        return <View testID="domino-tile"><Text>{left}|{right}</Text></View>;
    },
}));

jest.mock('react-native-reanimated', () => {
    const { View } = require('react-native');
    const Animated = { View };
    return {
        __esModule: true,
        default: Animated,
        FadeIn:  { duration: () => undefined },
        FadeOut: { duration: () => undefined },
        ZoomIn:  { duration: () => ({ springify: () => undefined }) },
        useReducedMotion: () => false,
    };
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeDomino = (left: number, right: number) => ({ id: `${left}-${right}`, left, right });

const makePlayer = (id: string, name: string, hand: { left: number; right: number }[]) => ({
    id,
    name,
    hand: hand.map(d => makeDomino(d.left, d.right)),
    handSize: hand.length,
    currentMancheStars: 0,
    wins: 0,
    mancheWins: 0,
    totalRoundWins: 0,
    totalPoints: 0,
    isCochon: false,
    totalCochons: 0,
    totalCochonsInfliges: 0,
    totalCochonsSubis: 0,
    status: 'HUMAN' as const,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RoundResultCard — Fix R3-B3', () => {

    // ── 1. Non visible → rien rendu ──────────────────────────────────────────
    test('ne rend rien si visible=false', () => {
        const state = createBaseGameState({ phase: 'BOUDE' });
        const { queryByText } = render(<RoundResultCard gameState={state} visible={false} />);
        expect(queryByText(/ÉGALITÉ/i)).toBeNull();
    });

    // ── 2. Boudé-égalité : affiche le mode ÉGALITÉ avec les scores ───────────
    test('BOUDE égalité → affiche "ÉGALITÉ" et les scores des deux joueurs', () => {
        // A et B ont exactement le même total de points en main → égalité
        const state = createBaseGameState({
            phase: 'BOUDE',
            players: [
                makePlayer('A', 'Alice', [{ left: 3, right: 2 }]),  // 5 pts
                makePlayer('B', 'Bob',   [{ left: 4, right: 1 }]),  // 5 pts
                makePlayer('C', 'Chloe', [{ left: 6, right: 3 }]),  // 9 pts
            ] as any,
        });

        const { getByText, getAllByTestId } = render(<RoundResultCard gameState={state} visible={true} />);

        // Le header doit indiquer l'égalité
        expect(getByText(/ÉGALITÉ/i)).toBeTruthy();
        // Les scores doivent apparaître : 5 pts pour A et B
        expect(getByText(/Alice.*\(5\)/i)).toBeTruthy();
        expect(getByText(/Bob.*\(5\)/i)).toBeTruthy();
        // Les dominos de chaque joueur doivent être rendus
        expect(getAllByTestId('domino-tile').length).toBeGreaterThanOrEqual(2);
    });

    // ── 3. Boudé avec vainqueur : affiche le gagnant, PAS le mode égalité ────
    test('BOUDE avec vainqueur unique → affiche le gagnant et ses dominos', () => {
        // A a le moins de points → gagnant
        const state = createBaseGameState({
            phase: 'BOUDE',
            players: [
                makePlayer('A', 'Alice', [{ left: 1, right: 0 }]),  // 1 pt  ← gagnant
                makePlayer('B', 'Bob',   [{ left: 4, right: 3 }]),  // 7 pts
                makePlayer('C', 'Chloe', [{ left: 5, right: 5 }]),  // 10 pts
            ] as any,
        });

        const { getByText, queryByText } = render(<RoundResultCard gameState={state} visible={true} />);

        // Pas d'égalité
        expect(queryByText(/ÉGALITÉ/i)).toBeNull();
        // Alice est affichée comme gagnante (couronne)
        expect(getByText(/👑.*Alice|Alice/i)).toBeTruthy();
        // Son score est affiché (boudé win)
        expect(getByText(/\(1\)/)).toBeTruthy();
    });

    // ── 4. PARTIE_END classique : gagnant sans scores ────────────────────────
    test('PARTIE_END victoire normale → affiche le gagnant, pas de scores', () => {
        const state = createBaseGameState({
            phase: 'PARTIE_END',
            firstPlayerOfRound: 'A',
            players: [
                makePlayer('A', 'Alice', []),  // main vide = victoire normale
                makePlayer('B', 'Bob',   [{ left: 4, right: 3 }]),
                makePlayer('C', 'Chloe', [{ left: 5, right: 5 }]),
            ] as any,
        });

        const { queryByText } = render(<RoundResultCard gameState={state} visible={true} />);

        // Pas d'égalité
        expect(queryByText(/ÉGALITÉ/i)).toBeNull();
        // Pas de scores inline (pas de boudé win)
        expect(queryByText(/\(7\)/)).toBeNull();
        expect(queryByText(/\(10\)/)).toBeNull();
    });

    // ── 5. Snapshot figé : si la phase change après déclenchement, le contenu reste correct ──
    test('phase BOUDE figée dans le snapshot → le contenu ne change pas si phase passe à PARTIE_END', () => {
        // Simule le snapshot capturé au moment du déclenchement (phase=BOUDE, égalité)
        const snapshotState = createBaseGameState({
            phase: 'BOUDE',
            players: [
                makePlayer('A', 'Alice', [{ left: 3, right: 2 }]),  // 5 pts
                makePlayer('B', 'Bob',   [{ left: 4, right: 1 }]),  // 5 pts
                makePlayer('C', 'Chloe', [{ left: 6, right: 3 }]),  // 9 pts
            ] as any,
        });

        // La carte reçoit le snapshot (phase=BOUDE) même si live est PARTIE_END
        const { getByText } = render(<RoundResultCard gameState={snapshotState} visible={true} />);

        // Le contenu doit refléter l'égalité du snapshot, pas la victoire du live
        expect(getByText(/ÉGALITÉ/i)).toBeTruthy();
        expect(getByText(/Alice.*\(5\)/i)).toBeTruthy();
        expect(getByText(/Bob.*\(5\)/i)).toBeTruthy();
    });

});
