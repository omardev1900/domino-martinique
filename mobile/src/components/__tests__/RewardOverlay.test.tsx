import React from 'react';
import { render, act } from '@testing-library/react-native';
import { RewardOverlay } from '../RewardOverlay';
import { MatchReward } from '../../core/economy.types';

jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');
    Reanimated.default.call = () => {};
    return Reanimated;
});

jest.mock('../RollingNumber', () => {
    return function MockRollingNumber(props: any) {
        return null;
    };
});

jest.mock('../AvatarFrame', () => ({
    AvatarFrame: () => null,
}));

jest.mock('../../core/audio/SoundManager', () => ({
    __esModule: true,
    default: {
        playSound: jest.fn(),
    },
}));

describe('RewardOverlay', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    it('affiche la modale de passage de palier quand gradeUp est vrai', async () => {
        const reward: MatchReward = {
            coinsEarned: 200,
            xpEarned: 50,
            diamondsEarned: 0,
            leaguePointsEarned: 1,
            isWinner: true,
            previousLevel: 1,
            newLevel: 1,
            leveledUp: false,
            previousXP: 100,
            newXP: 150,
            xpToNextLevel: 50,
            previousGrade: null,
            newGrade: 'APPRENTI_1',
            gradeUp: true,
            previousLeaguePoints: 9,
            newLeaguePoints: 10,
            nextGradeThreshold: 20,
            newCochonsGiven: 10,
            newlyUnlockedFrames: [],
            frameCoinsBonus: 0,
            breakdown: [],
        };

        const screen = render(
            <RewardOverlay
                visible={true}
                reward={reward}
                isWinner={true}
                onContinue={jest.fn()}
            />
        );

        await act(async () => {
            jest.advanceTimersByTime(1300);
        });

        expect(screen.getByText('PALIER MENSUEL')).toBeTruthy();
        expect(screen.getByText('TU ES PASSÉ AU GRADE')).toBeTruthy();
        expect(screen.getAllByText(/APPRENTI/i).length).toBeGreaterThan(0);
    });
});
