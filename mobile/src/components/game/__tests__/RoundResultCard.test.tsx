import React from 'react';
import { render } from '@testing-library/react-native';
import { RoundResultCard } from '../RoundResultCard';
import { createBaseGameState } from '../../../hooks/game/__tests__/testUtils';
import SoundManager from '../../../core/audio/SoundManager';

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
        FadeIn: { duration: () => undefined },
        FadeOut: { duration: () => undefined },
        ZoomIn: { duration: () => ({ springify: () => undefined }) },
        useReducedMotion: () => false,
    };
});

jest.mock('../../../core/audio/SoundManager', () => ({
    __esModule: true,
    default: {
        playSound: jest.fn(),
        dispose: jest.fn(),
    },
}));

const makeDomino = (left: number, right: number) => ({ id: `${left}-${right}`, left, right, isDouble: left === right });

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

describe('RoundResultCard', () => {
    test('renders nothing when visible is false', () => {
        const state = createBaseGameState({ phase: 'BOUDE' });
        const { queryByText } = render(<RoundResultCard gameState={state} visible={false} />);
        expect(queryByText(/GALIT/i)).toBeNull();
    });

    test('BOUDE tie shows tie state and player scores', () => {
        const state = createBaseGameState({
            phase: 'BOUDE',
            players: [
                makePlayer('A', 'Alice', [{ left: 3, right: 2 }]),
                makePlayer('B', 'Bob', [{ left: 4, right: 1 }]),
                makePlayer('C', 'Chloe', [{ left: 6, right: 3 }]),
            ] as any,
        });

        const { getAllByText, getByText, getAllByTestId } = render(<RoundResultCard gameState={state} visible />);
        expect(getAllByText(/GALIT/i).length).toBeGreaterThan(0);
        expect(getByText(/Alice.*\(5\)/i)).toBeTruthy();
        expect(getByText(/Bob.*\(5\)/i)).toBeTruthy();
        expect(getAllByTestId('domino-tile').length).toBeGreaterThanOrEqual(2);
    });

    test('BOUDE unique winner shows winner and lowest score label', () => {
        const state = createBaseGameState({
            phase: 'BOUDE',
            players: [
                makePlayer('A', 'Alice', [{ left: 1, right: 0 }]),
                makePlayer('B', 'Bob', [{ left: 4, right: 3 }]),
                makePlayer('C', 'Chloe', [{ left: 5, right: 5 }]),
            ] as any,
        });

        const { getByText, queryByText } = render(<RoundResultCard gameState={state} visible />);
        expect(queryByText(/GALIT/i)).toBeNull();
        expect(getByText(/Alice/i)).toBeTruthy();
        expect(getByText(/1\s*PTS\s*—\s*LE MOINS/i)).toBeTruthy();
    });

    test('PARTIE_END normal win does not show blocked-game inline scores', () => {
        const state = createBaseGameState({
            phase: 'PARTIE_END',
            firstPlayerOfRound: 'A',
            players: [
                makePlayer('A', 'Alice', []),
                makePlayer('B', 'Bob', [{ left: 4, right: 3 }]),
                makePlayer('C', 'Chloe', [{ left: 5, right: 5 }]),
            ] as any,
        });

        const { queryByText } = render(<RoundResultCard gameState={state} visible />);
        expect(queryByText(/GALIT/i)).toBeNull();
        expect(queryByText(/\(7\)/)).toBeNull();
        expect(queryByText(/\(10\)/)).toBeNull();
    });

    test('BOUDE snapshot remains tie-focused', () => {
        const snapshotState = createBaseGameState({
            phase: 'BOUDE',
            players: [
                makePlayer('A', 'Alice', [{ left: 3, right: 2 }]),
                makePlayer('B', 'Bob', [{ left: 4, right: 1 }]),
                makePlayer('C', 'Chloe', [{ left: 6, right: 3 }]),
            ] as any,
        });

        const { getAllByText, getByText } = render(<RoundResultCard gameState={snapshotState} visible />);
        expect(getAllByText(/GALIT/i).length).toBeGreaterThan(0);
        expect(getByText(/Alice.*\(5\)/i)).toBeTruthy();
        expect(getByText(/Bob.*\(5\)/i)).toBeTruthy();
    });

    test('rejoue le stinger quand la meme phase terminale se reouvre plus tard', () => {
        const state = createBaseGameState({
            phase: 'PARTIE_END',
            firstPlayerOfRound: 'A',
            players: [
                makePlayer('A', 'Alice', []),
                makePlayer('B', 'Bob', [{ left: 4, right: 3 }]),
                makePlayer('C', 'Chloe', [{ left: 5, right: 5 }]),
            ] as any,
        });

        const { rerender } = render(<RoundResultCard gameState={state} visible />);
        const initialCalls = (SoundManager.playSound as jest.Mock).mock.calls.filter(([name]) => name === 'roundEnd').length;
        rerender(<RoundResultCard gameState={state} visible={false} />);
        rerender(<RoundResultCard gameState={state} visible />);
        const finalCalls = (SoundManager.playSound as jest.Mock).mock.calls.filter(([name]) => name === 'roundEnd').length;

        expect(finalCalls).toBe(initialCalls + 1);
    });
});
