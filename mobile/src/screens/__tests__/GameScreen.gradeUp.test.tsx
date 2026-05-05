import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import GameScreen from '../GameScreen';
import { MatchReward } from '../../core/economy.types';

jest.setTimeout(15000);

const mockRewardOverlay = jest.fn(() => null);
const mockRoundResultCard = jest.fn(() => null);

jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');
    Reanimated.default.call = () => {};
    return Reanimated;
});

jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    }),
}));

jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({
        addListener: jest.fn(() => jest.fn()),
        dispatch: jest.fn(),
    }),
    useFocusEffect: jest.fn(),
}));

jest.mock('expo-screen-orientation', () => ({}));
jest.mock('expo-navigation-bar', () => ({}));
jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaProvider: ({ children }: any) => children,
}));

jest.mock('../../components/GameTable', () => ({
    GameTable: () => null,
}));
jest.mock('../../components/PlayerHand', () => ({
    PlayerHand: () => null,
}));
jest.mock('../../components/PlayerAvatar', () => ({
    PlayerAvatar: () => null,
}));
jest.mock('../../components/game/GameHeader', () => ({
    GameHeader: () => null,
}));
jest.mock('../../components/game/GameOptionsMenu', () => ({
    GameOptionsMenu: () => null,
}));
jest.mock('../../components/game/GameOverlays', () => ({
    GameOverlays: () => null,
}));
jest.mock('../../components/game/PlayerArea', () => ({
    PlayerArea: () => null,
}));
jest.mock('../../components/game/ActionFooter', () => ({
    ActionFooter: () => null,
}));
jest.mock('../../components/UnifiedResultOverlay', () => ({
    UnifiedResultOverlay: () => null,
}));
jest.mock('../../components/QuickChat', () => ({
    QuickChat: () => null,
}));
jest.mock('../../components/game/RoundResultCard', () => ({
    RoundResultCard: (props: any) => mockRoundResultCard(props),
}));
jest.mock('../../components/FlyingDomino', () => ({
    FlyingDomino: () => null,
}));
jest.mock('../../components/AdBannerModal', () => ({
    AdBannerModal: () => null,
}));
jest.mock('../../components/RewardOverlay', () => ({
    RewardOverlay: (props: any) => mockRewardOverlay(props),
}));

jest.mock('../../hooks/game/useConnectionStatus', () => ({
    useConnectionStatus: () => ({
        isRejoining: false,
        signalPlayerOnline: jest.fn().mockResolvedValue(undefined),
        signalPlayerOffline: jest.fn().mockResolvedValue(undefined),
    }),
}));

let mockCurrentGameState = {
    gameId: 'game-123',
    players: [
        {
            id: 'p1',
            name: 'Moi',
            avatarId: 'avatar_default',
            hand: [],
            handSize: 0,
            currentMancheStars: 0,
            wins: 0,
            mancheWins: 2,
            totalRoundWins: 5,
            totalPoints: 20,
            isCochon: false,
            totalCochons: 3,
            totalCochonsInfliges: 10,
            totalCochonsSubis: 1,
            status: 'HUMAN',
        },
        {
            id: 'bot-1',
            name: 'Bot',
            avatarId: 'avatar_default',
            hand: [],
            handSize: 0,
            currentMancheStars: 0,
            wins: 0,
            mancheWins: 1,
            totalRoundWins: 2,
            totalPoints: 8,
            isCochon: false,
            totalCochons: 0,
            totalCochonsInfliges: 0,
            totalCochonsSubis: 3,
            status: 'BOT',
        },
    ],
    talonMort: [],
    table: { sequence: [], leftValue: null, rightValue: null },
    currentPlayerId: 'p1',
    phase: 'MATCH_END',
    firstPlayerOfRound: null,
    history: [],
    winningCondition: 3,
    gameMode: 'MANCHE',
    mancheResult: null,
    turnDuration: 15,
    lastActionTimestamp: 0,
    turnId: 1,
    mancheHistory: [],
    roundNumber: 1,
    mancheNumber: 1,
    startingHandSize: 7,
};

jest.mock('../../hooks/game/useGameSync', () => ({
    useGameSync: () => ({
        gameState: mockCurrentGameState,
        roomData: null,
        isStarting: false,
        setIsStarting: jest.fn(),
        safeUpdateGameState: jest.fn().mockResolvedValue(undefined),
        setGameState: jest.fn(),
        setRoomData: jest.fn(),
    }),
}));

jest.mock('../../hooks/game/useGameTimers', () => ({
    useGameTimers: () => ({
        timeLeft: null,
        setTimeLeft: jest.fn(),
        overtime: null,
        setOvertime: jest.fn(),
        clearAllTurnTimers: jest.fn(),
    }),
}));

jest.mock('../../hooks/game/useGameEngine', () => ({
    useGameEngine: () => ({
        dispatch: jest.fn(),
        handlePlayDomino: jest.fn(),
        confirmSidePlay: jest.fn(),
        handlePassTurn: jest.fn(),
        handleTimeout: jest.fn(),
        handleOverlayContinue: jest.fn(),
        pendingDomino: null,
        isProcessingMove: false,
    }),
}));

jest.mock('../../core/LogicEngine', () => ({
    determineFirstPlayer: jest.fn(),
    dealGameSolo: jest.fn(),
    getForcedOpeningDominoId: jest.fn(() => null),
    getForcedTieBreakDominoId: jest.fn(() => null),
    dealGame: jest.fn(),
}));

jest.mock('../../core/DominoEngine', () => ({
    getValidMoves: jest.fn(() => []),
}));

jest.mock('../../core/services/stats.service', () => ({
    statsService: {
        getStats: jest.fn().mockResolvedValue({ matchHistory: [] }),
        recordMatchResult: jest.fn().mockResolvedValue(undefined),
    },
}));

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

jest.mock('../../core/services/economy.service', () => ({
    economyService: {
        getEconomy: jest.fn().mockResolvedValue({
            level: 1,
            xp: 100,
            leaguePoints: 9,
            cochonsGiven: 9,
            unlockedFrames: [],
        }),
        processServerReward: jest.fn().mockResolvedValue(reward),
        deductBuyIn: jest.fn().mockResolvedValue(true),
    },
}));

jest.mock('../../core/services/store.service', () => ({
    storeService: {
        getInventory: jest.fn().mockResolvedValue(null),
        getCatalog: jest.fn().mockResolvedValue([]),
    },
}));

jest.mock('../../core/services/bot.service', () => ({
    botService: {
        getBotsForLevel: jest.fn().mockResolvedValue([]),
    },
}));

jest.mock('../../core/audio/SoundManager', () => ({
    __esModule: true,
    default: {
        preloadSounds: jest.fn(),
        stopMusic: jest.fn(),
        unlockAudio: jest.fn(),
        playMusic: jest.fn(),
        playSound: jest.fn(),
        toggleMute: jest.fn().mockResolvedValue(true),
    },
}));

jest.mock('../../core/audio/HapticManager', () => ({
    __esModule: true,
    default: {},
}));

jest.mock('../../core/SettingsManager', () => ({
    __esModule: true,
    default: {
        getSettings: jest.fn(() => ({
            tableTheme: 'classic',
            isSfxEnabled: true,
            isVibrationEnabled: true,
            gameBgmTheme: 'mainMenu',
        })),
        setVibrationEnabled: jest.fn().mockResolvedValue(undefined),
    },
}));

jest.mock('../../core/services/auth.service', () => ({
    authService: {
        refreshUserFromStorage: jest.fn().mockResolvedValue({
            uid: 'p1',
            displayName: 'Moi',
            avatarId: 'avatar_default',
        }),
    },
}));

jest.mock('../../core/services/firebase', () => ({
    leaveRoom: jest.fn().mockResolvedValue(undefined),
    startGame: jest.fn().mockResolvedValue(undefined),
    clearRematchVotes: jest.fn().mockResolvedValue(undefined),
    updatePlayerChat: jest.fn().mockResolvedValue(undefined),
    resetRoomToLobby: jest.fn().mockResolvedValue(undefined),
    markPlayerAsDebited: jest.fn().mockResolvedValue(undefined),
    markRoomAsFinished: jest.fn().mockResolvedValue(undefined),
    setUserActiveRoom: jest.fn().mockResolvedValue(undefined),
    deleteWaitingRoomIfOwner: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../core/RewardEngine', () => ({
    RewardEngine: {
        buildInputFromGameState: jest.fn(() => ({
            mancheHistory: [],
        })),
    },
}));

jest.mock('../../core/services/ad.service', () => ({
    adService: {
        getAdForPlacement: jest.fn().mockResolvedValue(null),
    },
}));

describe('GameScreen grade-up flow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCurrentGameState = {
            gameId: 'game-123',
            players: [
                {
                    id: 'p1',
                    name: 'Moi',
                    avatarId: 'avatar_default',
                    hand: [],
                    handSize: 0,
                    currentMancheStars: 0,
                    wins: 0,
                    mancheWins: 2,
                    totalRoundWins: 5,
                    totalPoints: 20,
                    isCochon: false,
                    totalCochons: 3,
                    totalCochonsInfliges: 10,
                    totalCochonsSubis: 1,
                    status: 'HUMAN',
                },
                {
                    id: 'bot-1',
                    name: 'Bot',
                    avatarId: 'avatar_default',
                    hand: [],
                    handSize: 0,
                    currentMancheStars: 0,
                    wins: 0,
                    mancheWins: 1,
                    totalRoundWins: 2,
                    totalPoints: 8,
                    isCochon: false,
                    totalCochons: 0,
                    totalCochonsInfliges: 0,
                    totalCochonsSubis: 3,
                    status: 'BOT',
                },
            ],
            talonMort: [],
            table: { sequence: [], leftValue: null, rightValue: null },
            currentPlayerId: 'p1',
            phase: 'MATCH_END',
            firstPlayerOfRound: null,
            history: [],
            winningCondition: 3,
            gameMode: 'MANCHE',
            mancheResult: null,
            turnDuration: 15,
            lastActionTimestamp: 0,
            turnId: 1,
            mancheHistory: [],
            roundNumber: 1,
            mancheNumber: 1,
            startingHandSize: 7,
        };
    });

    it('affiche RewardOverlay quand la récompense de fin de match contient un gradeUp', async () => {
        render(
            <GameScreen
                gameId="game-123"
                userId="p1"
                mode="solo"
                gameMode="MANCHE"
                winningCondition={3}
                turnDuration={15}
                startingHandSize={7}
            />
        );

        await waitFor(() => {
            expect(mockRewardOverlay).toHaveBeenCalled();
            const lastCall = mockRewardOverlay.mock.calls[mockRewardOverlay.mock.calls.length - 1][0];
            expect(lastCall.visible).toBe(true);
            expect(lastCall.reward.gradeUp).toBe(true);
            expect(lastCall.reward.newGrade).toBe('APPRENTI_1');
        });
    });

    it('rafraîchit le snapshot de RoundResultCard en MANCHE_END au lieu de réutiliser le round précédent', async () => {
        mockCurrentGameState = {
            ...mockCurrentGameState,
            phase: 'PARTIE_END',
            history: [
                { action: 'PLAY', playerId: 'p1', domino: { left: 6, right: 6 } },
            ],
        } as any;

        const view = render(
            <GameScreen
                gameId="game-123"
                userId="p1"
                mode="solo"
                gameMode="MANCHE"
                winningCondition={3}
                turnDuration={15}
                startingHandSize={7}
            />
        );

        await waitFor(() => {
            const lastCall = mockRoundResultCard.mock.calls[mockRoundResultCard.mock.calls.length - 1][0];
            expect(lastCall.gameState.phase).toBe('PARTIE_END');
            expect(lastCall.gameState.history[0].domino.left).toBe(6);
            expect(lastCall.gameState.history[0].domino.right).toBe(6);
        });

        mockCurrentGameState = {
            ...mockCurrentGameState,
            phase: 'MANCHE_END',
            mancheResult: 'COCHON',
            history: [
                { action: 'PLAY', playerId: 'p1', domino: { left: 1, right: 4 } },
            ],
        } as any;

        view.rerender(
            <GameScreen
                gameId="game-123"
                userId="p1"
                mode="solo"
                gameMode="MANCHE"
                winningCondition={3}
                turnDuration={15}
                startingHandSize={7}
            />
        );

        await waitFor(() => {
            const lastCall = mockRoundResultCard.mock.calls[mockRoundResultCard.mock.calls.length - 1][0];
            expect(lastCall.gameState.phase).toBe('MANCHE_END');
            expect(lastCall.gameState.history[0].domino.left).toBe(1);
            expect(lastCall.gameState.history[0].domino.right).toBe(4);
        });
    });
});
