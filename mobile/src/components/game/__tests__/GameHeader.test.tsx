import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { GameHeader } from '../GameHeader';
import { GameState } from '../../../core/types';

describe('GameHeader Component', () => {
    const mockInsets = { top: 20, bottom: 0, left: 0, right: 0 };
    const mockGameState = {
        phase: 'PLAYING',
        gameMode: 'MANCHE',
        winningCondition: 3,
        mancheNumber: 1,
        roundNumber: 2,
    } as GameState;

    const defaultProps = {
        gameState: mockGameState,
        insets: mockInsets,
        isSoloMode: true,
        isPaused: false,
        onTogglePause: jest.fn(),
        showRoomInfo: false,
        onToggleRoomInfo: jest.fn(),
        isSoundEnabled: true,
        onToggleSound: jest.fn(),
        onOpenSettings: jest.fn(),
        isFullscreen: false,
        onToggleFullscreen: jest.fn(),
    };

    it('renders correctly when phase is PLAYING', () => {
        const { getByText } = render(<GameHeader {...defaultProps} />);

        expect(getByText('3 Victoires')).toBeTruthy();
        expect(getByText('M1 / R2')).toBeTruthy();
    });

    it('returns null when phase is not PLAYING', () => {
        const { queryByTestId } = render(
            <GameHeader {...defaultProps} gameState={{ ...mockGameState, phase: 'LOBBY' }} />
        );

        expect(queryByTestId('game-header')).toBeNull();
    });

    it('returns null when gameState is null', () => {
        const { queryByTestId } = render(
            <GameHeader {...defaultProps} gameState={null} />
        );

        expect(queryByTestId('game-header')).toBeNull();
    });

    it('calls onTogglePause when pause button is pressed in solo mode', () => {
        const { getByTestId } = render(<GameHeader {...defaultProps} />);

        fireEvent.press(getByTestId('btn-pause'));
        expect(defaultProps.onTogglePause).toHaveBeenCalledTimes(1);
    });

    it('calls onToggleRoomInfo when room info button is pressed in multiplayer mode', () => {
        const props = { ...defaultProps, isSoloMode: false };
        const { getByTestId } = render(<GameHeader {...props} />);

        fireEvent.press(getByTestId('btn-room-info'));
        expect(props.onToggleRoomInfo).toHaveBeenCalledTimes(1);
    });

    it('calls onToggleSound when sound button is pressed', async () => {
        const { getByTestId } = render(<GameHeader {...defaultProps} />);

        await act(async () => {
            fireEvent.press(getByTestId('btn-sound'));
        });
        expect(defaultProps.onToggleSound).toHaveBeenCalledTimes(1);
    });

    it('calls onOpenSettings when settings button is pressed', async () => {
        const { getByTestId } = render(<GameHeader {...defaultProps} />);

        await act(async () => {
            fireEvent.press(getByTestId('btn-settings'));
        });
        expect(defaultProps.onOpenSettings).toHaveBeenCalledTimes(1);
    });
});
