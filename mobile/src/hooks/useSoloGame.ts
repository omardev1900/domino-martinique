import { useState, useCallback, useRef } from 'react';
import { GameState, Domino, Player, PlayerId } from '../core/types';
import {
    dealGameSolo,
    determineFirstPlayer,
    handleTurn,
    passTurn,
    checkValidMove,
    resolveBoude,
    getForcedOpeningDominoId
} from '../core/LogicEngine';
import { getBotMove } from '../core/BotEngine';
import SoundManager from '../core/audio/SoundManager';
import HapticManager from '../core/audio/HapticManager';

export const useSoloGame = (userId: string, difficulty: 'beginner' | 'intermediate' = 'beginner') => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [localPlayerId] = useState<PlayerId>(userId);

    // Ref to prevent stale closures
    const gameStateRef = useRef<GameState | null>(null);
    const botTimerRef = useRef<any>(null);

    // Update ref whenever state changes
    const updateGameState = useCallback((newState: GameState) => {
        gameStateRef.current = newState;
        setGameState(newState);
    }, []);

    // Action-Driven Boudé Trigger
    const triggerBoude = useCallback((finalState: GameState) => {
        setTimeout(() => {
            const currentState = gameStateRef.current;
            if (!currentState || currentState.phase !== 'BOUDE') return;

            const { newState, isTie } = resolveBoude(finalState);

            if (isTie) {
                // Restart game on tie
                const partialState = dealGameSolo(localPlayerId, 'Me', difficulty);
                const players = partialState.players as Player[];
                const firstPlayerId = determineFirstPlayer(players);

                const restartState: GameState = {
                    gameId: 'solo-' + Date.now(),
                    players: players,
                    talonMort: partialState.talonMort as Domino[],
                    table: partialState.table!,
                    currentPlayerId: firstPlayerId,
                    phase: 'PLAYING',
                    firstPlayerOfRound: null,
                    history: [],
                    winningCondition: 3,
                    gameMode: 'MANCHE',
                    turnDuration: 15,
                    lastActionTimestamp: Date.now(),
                    turnId: 0,
                    mancheHistory: [],
                    roundNumber: 1,
                    mancheNumber: 1,
                    startingHandSize: 7
                };
                updateGameState(restartState);

                // Check if bot starts
                const firstPlayer = restartState.players.find(p => p.id === firstPlayerId);
                if (firstPlayer?.isBot) {
                    triggerBotTurn();
                }
            } else {
                updateGameState(newState);
            }
        }, 4000); // Reverted from 500
    }, [localPlayerId, difficulty, updateGameState]);

    // Imperative Bot Turn Trigger
    const triggerBotTurn = useCallback(() => {
        // Clear any existing timer
        if (botTimerRef.current) {
            clearTimeout(botTimerRef.current);
            botTimerRef.current = null;
        }

        botTimerRef.current = setTimeout(() => {
            const currentState = gameStateRef.current;

            // Safety guard
            if (!currentState || currentState.phase !== 'PLAYING') return;

            const currentPlayer = currentState.players.find(p => p.id === currentState.currentPlayerId);

            // Verify it's still a bot turn
            if (!currentPlayer?.isBot) return;

            const forcedOpeningId = getForcedOpeningDominoId(currentState, currentPlayer.id);
            const forcedOpeningTile = forcedOpeningId
                ? currentPlayer.hand.find(tile => tile.id === forcedOpeningId) || null
                : null;

            const move = forcedOpeningTile
                ? { tile: forcedOpeningTile, side: 'start' as const }
                : getBotMove(
                    currentPlayer.hand,
                    currentState.table.leftValue,
                    currentState.table.rightValue
                );

            try {
                let newState: GameState;

                if (move) {
                    newState = handleTurn(currentState, currentPlayer.id, move.tile);
                    SoundManager.playClack();
                } else {
                    newState = passTurn(currentState, currentPlayer.id);
                    SoundManager.playSound('notify');
                }

                updateGameState(newState);

                // Check for Boudé
                if (newState.phase === 'BOUDE') {
                    triggerBoude(newState);
                    return;
                }

                // Check if next player is also a bot
                const nextPlayer = newState.players.find(p => p.id === newState.currentPlayerId);
                if (nextPlayer?.isBot && newState.phase === 'PLAYING') {
                    triggerBotTurn();
                }

            } catch (error) {
                console.error("Bot Error", error);
            }
        }, 1500); // Reverted from 500
    }, [updateGameState, triggerBoude]);

    // Initialize Solo Game
    const startSoloGame = useCallback(() => {
        const partialState = dealGameSolo(localPlayerId, 'Me', difficulty);
        const players = partialState.players as Player[];
        const firstPlayerId = determineFirstPlayer(players);

        const fullState: GameState = {
            gameId: 'solo-' + Date.now(),
            players: players,
            talonMort: partialState.talonMort as Domino[],
            table: partialState.table!,
            currentPlayerId: firstPlayerId,
            phase: 'PLAYING',
            firstPlayerOfRound: null,
            history: [],
            winningCondition: 3,
            gameMode: 'MANCHE',
            turnDuration: 15,
            lastActionTimestamp: Date.now(),
            turnId: 0,
            mancheHistory: [],
            roundNumber: 1,
            mancheNumber: 1,
            startingHandSize: 7
        };

        SoundManager.playSound('shuffle');
        updateGameState(fullState);

        // Check if bot starts
        const firstPlayer = players.find(p => p.id === firstPlayerId);
        if (firstPlayer?.isBot) {
            triggerBotTurn();
        }
    }, [localPlayerId, difficulty, updateGameState, triggerBotTurn]);

    // Handle Human Move
    const handleHumanMove = useCallback((domino: Domino) => {
        const currentState = gameStateRef.current;
        if (!currentState) return;
        if (currentState.currentPlayerId !== localPlayerId) return;

        try {
            const newState = handleTurn(currentState, localPlayerId, domino);
            SoundManager.playClack();
            HapticManager.triggerImpact();
            updateGameState(newState);

            // Check if next player is bot
            const nextPlayer = newState.players.find(p => p.id === newState.currentPlayerId);
            if (nextPlayer?.isBot && newState.phase === 'PLAYING') {
                triggerBotTurn();
            }
        } catch (e) {
            console.log("Invalid move", e);
        }
    }, [localPlayerId, updateGameState, triggerBotTurn]);

    // Handle Human Pass
    const handleHumanPass = useCallback(() => {
        const currentState = gameStateRef.current;
        if (!currentState) return;

        // Validation check
        const player = currentState.players.find(p => p.id === localPlayerId);
        const canPlay = player?.hand.some(d =>
            checkValidMove(d, currentState.table.leftValue, currentState.table.rightValue).canPlay
        );

        if (canPlay) {
            throw new Error("Vous avez des dominos jouables.");
        }

        const newState = passTurn(currentState, localPlayerId);
        updateGameState(newState);

        // Check for Boudé
        if (newState.phase === 'BOUDE') {
            triggerBoude(newState);
            return;
        }

        // Check if next player is bot
        const nextPlayer = newState.players.find(p => p.id === newState.currentPlayerId);
        if (nextPlayer?.isBot && newState.phase === 'PLAYING') {
            triggerBotTurn();
        }
    }, [localPlayerId, updateGameState, triggerBoude, triggerBotTurn]);

    // Handle Timeout (AFK)
    const handleTimeout = useCallback((playerId: PlayerId) => {
        const currentState = gameStateRef.current;
        if (!currentState) return;
        if (currentState.currentPlayerId !== playerId) return;

        const player = currentState.players.find(p => p.id === playerId);
        const forcedOpeningId = getForcedOpeningDominoId(currentState, playerId);
        if (forcedOpeningId) {
            const forcedOpeningTile = player?.hand.find(tile => tile.id === forcedOpeningId);
            if (forcedOpeningTile) {
                handleHumanMove(forcedOpeningTile);
                return;
            }
        }

        const validMove = player?.hand.find(d =>
            checkValidMove(d, currentState.table.leftValue, currentState.table.rightValue).canPlay
        );

        if (validMove) {
            handleHumanMove(validMove);
        } else {
            handleHumanPass();
        }
    }, [handleHumanMove, handleHumanPass]);

    // Handle Next Round (Keep scores)
    const handleNextRound = useCallback(() => {
        const currentState = gameStateRef.current;
        if (!currentState) return;

        const partialState = dealGameSolo(localPlayerId, 'Me', difficulty);
        const nextPlayers = currentState.players.map((p, i) => {
            const newP = partialState.players![i];
            return {
                ...p,
                hand: newP.hand,
                handSize: newP.handSize
            };
        });

        const firstPlayerId = determineFirstPlayer(nextPlayers);

        const nextState: GameState = {
            ...currentState,
            players: nextPlayers,
            talonMort: partialState.talonMort as Domino[],
            table: partialState.table!,
            currentPlayerId: firstPlayerId,
            phase: 'PLAYING',
            turnDuration: 15,
            firstPlayerOfRound: null,
            history: [],
            lastActionTimestamp: Date.now()
        };

        updateGameState(nextState);

        // Check if bot starts new round
        const firstPlayer = nextPlayers.find(p => p.id === firstPlayerId);
        if (firstPlayer?.isBot) {
            triggerBotTurn();
        }
    }, [localPlayerId, difficulty, updateGameState, triggerBotTurn]);

    return {
        gameState,
        startSoloGame,
        handleHumanMove,
        handleHumanPass,
        handleTimeout,
        handleNextRound,
        setGameState: updateGameState
    };
};
