import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

import { View, StyleSheet, Text, StatusBar, TouchableOpacity, Alert, SafeAreaView, useWindowDimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, FadeInLeft, FadeInRight, FadeIn } from 'react-native-reanimated';
import { useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { GameTable } from '../components/GameTable';
import { PlayerHand } from '../components/PlayerHand';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { LobbyScreen } from './LobbyScreen';
import { GameOverScreen } from './GameOverScreen';
import { SettingsScreen } from './SettingsScreen';
import { dealGame, dealGameSolo, handleTurn, passTurn, determineFirstPlayer, resolveBoude, checkValidMove } from '../core/LogicEngine';
import { getValidMoves } from '../core/DominoEngine';
import { getBotMove } from '../core/BotEngine';
import { GameAnnouncer } from '../components/GameAnnouncer';
import { BoudeCounting } from '../components/BoudeCounting';

import { GameState, GamePhase, Domino, Player, PlayerId, GameRoom, RoomStatus, GameMode } from '../core/types';
import { subscribeToRoom, updateGameState, leaveRoom, startGame, resetRoomToLobby, voteForRematch, clearRematchVotes } from '../core/services/firebase';
import { Ionicons } from '@expo/vector-icons';
import SoundManager from '../core/audio/SoundManager';
import HapticManager from '../core/audio/HapticManager';
import { TURN_DURATION_SECONDS } from '../core/constants';
import * as Clipboard from 'expo-clipboard';
import SettingsManager from '../core/SettingsManager';
import { TableTheme, TABLE_THEMES } from '../core/themes/tableThemes';
import { authService } from '../core/services/auth.service';
import { AVAILABLE_AVATARS, AvatarId, getAvatarImage } from '../core/avatars';
import { GameTableRef } from '../components/GameTable';
import { FlyingDomino } from '../components/FlyingDomino';
import { FlyingDominoData } from '../core/animations/AnimationTypes';


interface GameScreenProps {
    gameId?: string;
    userId?: string;
    mode?: 'solo' | 'multiplayer';
    difficulty?: 'easy' | 'medium' | 'expert' | 'legend';
    gameMode?: GameMode;
    winningCondition?: number;
    turnDuration?: number;
}

export default function GameScreen({ gameId, userId, mode, difficulty, gameMode, winningCondition, turnDuration }: GameScreenProps) {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const isLandscape = width > height;

    const [roomData, setRoomData] = useState<GameRoom | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [localPlayerId] = useState<PlayerId>(userId || 'p1');
    const [showSettings, setShowSettings] = useState(false);
    const [showRoomInfo, setShowRoomInfo] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isSoloMode] = useState(mode === 'solo');
    const [isStarting, setIsStarting] = useState(false); // Loading state during game start
    const [tableTheme, setTableTheme] = useState<TableTheme>('classic');
    const [announcement, setAnnouncement] = useState<{ message: string; subMessage?: string; type: 'COCHON' | 'CHIRE' | 'PARTIE_END' | 'BOUDE' } | null>(null);
    const [showScoreboard, setShowScoreboard] = useState(false);
    const [isCountingPoints, setIsCountingPoints] = useState(false);

    const [hiddenDominoId, setHiddenDominoId] = useState<string | null>(null);
    const [flyingDomino, setFlyingDomino] = useState<FlyingDominoData | null>(null);

    const tableRef = useRef<GameTableRef>(null);
    const lastPlayStartPos = useRef<{ x: number, y: number } | null>(null);
    const avatarRefs = useRef<{ [key: string]: View | null }>({});
    const prevHistoryLength = useRef(0);
    const isProcessing = useRef(false);
    const gameStateRef = useRef<GameState | null>(null);
    const navigation = useNavigation();
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [pendingDomino, setPendingDomino] = useState<Domino | null>(null);
    const pulseOpacity = useSharedValue(1);

    useEffect(() => {
        pulseOpacity.value = withRepeat(
            withSequence(
                withTiming(0.3, { duration: 800 }),
                withTiming(1, { duration: 800 })
            ),
            -1,
            true
        );
    }, []);

    // -------------------------------------------------------------------------
    // SMART LISTENER: Detect Opponent Moves & Trigger Effects
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (!gameState) {
            prevHistoryLength.current = 0;
            return;
        }

        const history = gameState.history;
        // Check if history grew (new move)
        if (history.length > prevHistoryLength.current) {
            // Get the last action
            const lastAction = history[history.length - 1];

            // If it's NOT me, trigger effects
            // (My own effects are triggered immediately in executeMove for zero latency)
            if (lastAction.playerId !== localPlayerId) {
                console.log(`📡 Opponent Action Detected: ${lastAction.action} by ${lastAction.playerId}`);

                if (lastAction.action === 'PLAY') {
                    SoundManager.playClack();
                    // TODO: Trigger FlyingDomino animation from opponent avatar to table
                    // We need to know who played to find their avatar position
                    // const playerIndex = gameState.players.findIndex(p => p.id === lastAction.playerId);
                    // ...
                } else if (lastAction.action === 'PASS') {
                    // Optional: Pass sound
                }
            }
            // Update ref
            prevHistoryLength.current = history.length;
        } else if (history.length < prevHistoryLength.current) {
            // Game reset
            prevHistoryLength.current = history.length;
        }
    }, [gameState?.history, localPlayerId]);

    // -------------------------------------------------------------------------
    // TIMER EFFECT (Moved to top to prevent hook violation)
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (timeLeft !== 0 || isPaused) return;

        // Use ref to get fresh state
        const freshState = gameStateRef.current;
        if (!freshState) {
            console.log('⏰ Timer expired but no gameState available');
            return;
        }

        if (freshState.currentPlayerId !== localPlayerId) {
            console.log('⏰ Timer expired but not my turn anymore');
            return;
        }

        if (freshState.phase !== 'PLAYING') {
            console.log('⏰ Timer expired but game phase is', freshState.phase);
            return;
        }

        console.log('⏰ Timer expired - checking for valid moves...');

        // CRITICAL: Force release processing lock - timer has absolute priority
        isProcessing.current = false;

        // Find the local player in fresh state
        const freshPlayer = freshState.players.find(p => p.id === localPlayerId);
        if (!freshPlayer) {
            console.error('⏰ Timer expired but player not found in state');
            return;
        }

        // STEP A: Check for valid moves
        const validMoves = getValidMoves(freshPlayer.hand, {
            left: freshState.table.leftValue,
            right: freshState.table.rightValue
        });


        if (validMoves.length > 0) {
            // STEP B: Auto-play the first valid domino
            const move = validMoves[0];
            const dominoToPlay = move.tile;
            console.log(`⏰ AUTO-PLAY: Playing ${dominoToPlay.left}|${dominoToPlay.right} automatically`);

            // Call handlePlayDomino as if user clicked
            handlePlayDomino(dominoToPlay);
        } else {
            // STEP C: No valid moves - auto-pass
            console.log('⏰ AUTO-PASS: No valid moves, passing turn automatically');
            handlePassTurn();
        }
    }, [timeLeft]);

    // DERIVED STATE - Must be after state hooks but before handlers
    const localPlayer = gameState?.players.find(p => p.id === localPlayerId);
    const isMyTurn = gameState?.currentPlayerId === localPlayerId;
    const isGameOver = gameState?.phase === 'MATCH_END' || gameState?.phase === 'MANCHE_END' || gameState?.phase === 'PARTIE_END' || gameState?.phase === 'BOUDE';
    const showScoreOverlay = isGameOver && showScoreboard;

    // Player profile data for solo mode
    const [playerDisplayName, setPlayerDisplayName] = useState<string>('Moi');
    const [playerAvatarId, setPlayerAvatarId] = useState<string | undefined>('avatar_01');



    // Load saved table theme and player profile
    // This must complete BEFORE starting the game
    const [profileLoaded, setProfileLoaded] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const loadSettings = async () => {
                const settings = SettingsManager.getSettings();
                setTableTheme(settings.tableTheme);

                // Load player profile for solo mode
                if (isSoloMode) {
                    try {
                        // Always refresh from storage to get latest profile data
                        const profile = await authService.refreshUserFromStorage();
                        if (profile) {
                            console.log('[GameScreen] Loaded profile:', profile.displayName, profile.avatarId);
                            setPlayerDisplayName(profile.displayName || 'Moi');
                            // Validate avatar is a valid image avatar
                            const avatar = profile.avatarId || profile.avatarUrl;
                            if (avatar && (AVAILABLE_AVATARS.includes(avatar as AvatarId) || avatar === 'avatar_default')) {
                                setPlayerAvatarId(avatar);
                            } else {
                                setPlayerAvatarId('avatar_default');
                            }
                        }
                    } catch (error) {
                        console.error('Error loading profile:', error);
                    }
                }
                setProfileLoaded(true);
            };
            loadSettings();
        }, [isSoloMode])
    );

    const animatedBorderStyle = useAnimatedStyle(() => ({
        borderColor: `rgba(255, 215, 0, ${pulseOpacity.value})`,
    }));

    // Timer reset on turn change
    useEffect(() => {
        if (gameState?.phase === 'PLAYING' && gameState?.currentPlayerId === localPlayerId) {
            if (gameState.turnDuration > 0) {
                setTimeLeft(gameState.turnDuration);
            } else {
                setTimeLeft(null);
            }
        } else {
            setTimeLeft(null);
        }

        // Phase Transition Logic for Announcer - SKIP IF COMING FROM BOUDE OR ALREADY SHOWING SCORE
        if (gameState?.phase && ['MANCHE_END', 'MATCH_END', 'PARTIE_END', 'BOUDE'].includes(gameState.phase)) {
            // If we are already showing scoreboard or counting points, don't re-announce
            if (showScoreboard || isCountingPoints) return;

            let message = "";
            let type: any = "PARTIE_END";
            let subMessage = "";

            if (gameState.phase === 'BOUDE') {
                message = "BOUDÉ !";
                type = "BOUDE";
            } else if (gameState.mancheResult === 'CHIRE') {
                message = "CHIRÉ !";
                type = "CHIRE";
                subMessage = "Match Nul - Pas de cochon";
            } else if (gameState.mancheResult === 'COCHON') {
                const winner = gameState.players.find(p => p.wins === Math.max(...gameState.players.map(pl => pl.wins)));
                message = "COCHON !";
                type = "COCHON";
                subMessage = winner ? `${winner.name} l'emporte` : "";
            } else if (gameState.phase === 'PARTIE_END') {
                const winner = gameState.players.find(p => p.id === gameState.firstPlayerOfRound);
                message = "PARTIE TERMINÉE !";
                subMessage = winner ? `${winner.name} gagne` : "";
            } else if (gameState.phase === 'MANCHE_END') {
                message = "MANCHE TERMINÉE !";
            } else if (gameState.phase === 'MATCH_END') {
                message = "MATCH TERMINÉ !";
            }
            if (message) {
                setAnnouncement({ message, subMessage, type });
                setShowScoreboard(false);
            } else {
                setShowScoreboard(true);
            }
        } else {
            setAnnouncement(null);
            setShowScoreboard(false);
        }
    }, [gameState?.currentPlayerId, gameState?.phase, localPlayerId, gameState?.mancheResult, showScoreboard, isCountingPoints]);

    // Timer countdown logic
    useEffect(() => {
        if (!gameState || gameState.phase !== 'PLAYING' || isPaused || timeLeft === null) {
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [gameState?.phase, isPaused, timeLeft === null]);

    // Audio & Firebase Subscription
    useEffect(() => {
        // Preload sounds
        SoundManager.preloadSounds();

        // Solo mode - wait for profile to load first
        if (isSoloMode) {
            if (!profileLoaded) {
                return; // Wait for profile to load
            }
            setIsStarting(false); // Ensure loading is off
            startSoloGame();
            return;
        }

        if (!gameId) {
            setIsStarting(false);
            startNewLocalGame();
            return;
        }

        // Multiplayer loading...
        const unsubscribe = subscribeToRoom(gameId, (data) => {
            setRoomData(data);
            // Sync game state - status null means we return to lobby
            setGameState(data.gameState || null);
            if (data.gameState) {
                setIsStarting(false); // Game loaded successfully
            }
        });

        return () => {
            unsubscribe();
        };
    }, [gameId, isSoloMode, profileLoaded]);

    // Check if player has ANY playable domino (NEW: Before early return for hooks safety)
    const canPlayAny = useMemo(() => {
        if (!gameState) return false;
        const localPlayer = gameState.players.find(p => p.id === localPlayerId);
        if (!localPlayer) return false;
        const moves = getValidMoves(localPlayer.hand, {
            left: gameState.table.leftValue,
            right: gameState.table.rightValue
        });
        return moves.length > 0;
    }, [gameState?.players, gameState?.table.leftValue, gameState?.table.rightValue, localPlayerId]);


    // IN-GAME PROTECTION: Prevent accidental exit
    useEffect(() => {

        if (!gameState && !isStarting) return; // Only protect if in game or starting

        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
            // Prevent default behavior of leaving the screen
            e.preventDefault();

            // Prompt the user before leaving
            Alert.alert(
                'Quit Game?',
                'Are you sure you want to leave the game? You will be removed from the room.',
                [
                    { text: "Don't leave", style: 'cancel', onPress: () => { } },
                    {
                        text: 'Leave',
                        style: 'destructive',
                        // If the user confirmed, then we dispatch the action we blocked earlier
                        // This will continue the action that had triggered the removal of the screen
                        onPress: async () => {
                            if (gameId && userId) {
                                try {
                                    await leaveRoom(gameId, userId);
                                } catch (err) {
                                    console.error("Error leaving room on exit", err);
                                }
                            }
                            navigation.dispatch(e.data.action);
                        },
                    },
                ]
            );
        });

        return unsubscribe;
    }, [gameState, isStarting, gameId, userId, navigation]);

    const startSoloGame = () => {
        const partialState = dealGameSolo(localPlayerId, playerDisplayName, playerAvatarId, difficulty || 'easy');
        const players = partialState.players as Player[];
        const firstPlayerId = determineFirstPlayer(players);

        const fullState: GameState = {
            gameId: gameId || 'solo-' + Date.now(),
            players: players,
            talonMort: partialState.talonMort as Domino[],
            table: partialState.table!,
            currentPlayerId: firstPlayerId,
            phase: 'PLAYING',
            firstPlayerOfRound: null,
            history: [],
            winningCondition: winningCondition !== undefined ? Number(winningCondition) : 3,
            gameMode: gameMode || 'MANCHE',
            turnDuration: turnDuration !== undefined ? Number(turnDuration) : TURN_DURATION_SECONDS,
            lastActionTimestamp: Date.now()
        };
        SoundManager.playSound('shuffle');
        setGameState(fullState);
    };

    // --- BOT TIER LOGIC ---
    // Helper to get bot configuration based on room difficulty
    const getBotsForDifficulty = (roomDiff: string = 'medium'): { name: string, avatarId: string, difficulty: string }[] => {
        // Default medium
        const diff = roomDiff as 'easy' | 'medium' | 'expert' | 'legend' | 'valou_legend';

        // Tiered mapping requested by User
        switch (diff) {
            case 'easy':
                // Débutant: 1 Easy (bot_01) + 1 Medium (bot_02)
                return [
                    { name: 'Bot Débutant', avatarId: 'bot_01', difficulty: 'easy' },
                    { name: 'Bot Moyen', avatarId: 'bot_02', difficulty: 'medium' }
                ];
            case 'medium':
                // Moyen: 1 Medium (bot_02) + 1 Expert (bot_03)
                return [
                    { name: 'Bot Moyen', avatarId: 'bot_02', difficulty: 'medium' },
                    { name: 'Bot Expert', avatarId: 'bot_03', difficulty: 'expert' }
                ];
            case 'expert':
                // Expert: 1 Expert (bot_03) + 1 Legend (bot_04)
                return [
                    { name: 'Bot Expert', avatarId: 'bot_03', difficulty: 'expert' },
                    { name: 'Bot Légende', avatarId: 'bot_04', difficulty: 'legend' }
                ];
            case 'legend':
            case 'valou_legend':
                // Légende: 1 Legend (bot_04) + 1 Valou (bot_05)
                return [
                    { name: 'Bot Légende', avatarId: 'bot_04', difficulty: 'legend' },
                    { name: 'Bot Valou', avatarId: 'bot_05', difficulty: 'valou_legend' }
                ];
            default:
                // Fallback Medium
                return [
                    { name: 'Bot Moyen', avatarId: 'bot_02', difficulty: 'medium' },
                    { name: 'Bot Expert', avatarId: 'bot_03', difficulty: 'expert' }
                ];
        }
    };

    const startNewLocalGame = () => {
        // Use the difficulty prop passed to screen (from previous menu selection)
        const botConfigs = getBotsForDifficulty(difficulty || 'medium');

        // Create initial state with placeholders
        const fullState = createInitialState(['Moi', botConfigs[0].name, botConfigs[1].name]);

        // Configure Bot 1
        fullState.players[1].isBot = true;
        fullState.players[1].avatarId = botConfigs[0].avatarId;
        fullState.players[1].difficulty = botConfigs[0].difficulty as any;

        // Configure Bot 2
        fullState.players[2].isBot = true;
        fullState.players[2].avatarId = botConfigs[1].avatarId;
        fullState.players[2].difficulty = botConfigs[1].difficulty as any;

        SoundManager.playSound('shuffle');
        setGameState(fullState);
    };

    const createInitialState = (playerNames: string[], gMode: GameMode = 'MANCHE', wCond: number = 3, tDur: number = TURN_DURATION_SECONDS): GameState => {
        const partialState = dealGame(playerNames);
        const players = partialState.players as Player[];
        const firstPlayerId = determineFirstPlayer(players);

        return {
            gameId: 'local-' + Date.now(),
            players: players,
            talonMort: partialState.talonMort as Domino[],
            table: partialState.table!,
            currentPlayerId: firstPlayerId,
            phase: 'PLAYING',
            firstPlayerOfRound: null,
            history: [],
            winningCondition: wCond,
            gameMode: gMode,
            turnDuration: tDur,
            lastActionTimestamp: Date.now()
        };
    };

    // Multiplayer Start Handler
    const handleStartGame = async () => {
        if (!gameId || !roomData) return;
        setIsStarting(true);

        try {
            // Need to fill empty spots with bots if less than 3 players
            const playerNames = roomData.players.map(p => p.displayName);

            // Get Bot configurations based on room difficulty
            const botConfigs = getBotsForDifficulty(roomData.difficulty || 'medium');
            let botIndex = 0;

            // Fill up to 3 players
            while (playerNames.length < 3) {
                if (botIndex < botConfigs.length) {
                    playerNames.push(botConfigs[botIndex].name);
                    botIndex++;
                } else {
                    playerNames.push(`Bot ${playerNames.length}`); // Fallback
                }
            }

            const fullState = createInitialState(
                playerNames,
                roomData.gameMode || 'MANCHE',
                roomData.winningCondition || 3,
                roomData.turnDuration || 15
            );

            // Re-assign IDs to actual UIDs for real players, and configure Bots
            fullState.players = fullState.players.map((p, i) => {
                if (i < roomData.players.length) {
                    return {
                        ...p,
                        id: roomData.players[i].uid,
                        avatarId: roomData.players[i].avatarId || 'avatar_default'
                    };
                } else {
                    // This is a bot
                    // Determine which bot config corresponds to this slot
                    // We added bots at the end of playerNames list
                    // logic: index in playerNames starting from roomData.players.length
                    const relativeBotIdx = i - roomData.players.length;
                    const config = botConfigs[relativeBotIdx] || botConfigs[0]; // fallback

                    return {
                        ...p,
                        id: `bot-${i}`,
                        name: config.name,
                        isBot: true,
                        avatarId: config.avatarId,
                        difficulty: config.difficulty as any
                    };
                }
            });

            // Save to Firestore
            await updateGameState(gameId, fullState);
            // Room status update is handled by Cloud Functions or standard flow? 
            // Ideally we should update status to PLAYING too if not done by updateGameState
            // updateRoomStatus(gameId, 'PLAYING'); // assuming updateGameState triggers or is enough

        } catch (error) {
            console.error("Failed to start game:", error);
            Alert.alert("Error", "Could not start game");
            setIsStarting(false);
        }
    };


    // BOT LOGIC EFFECT
    useEffect(() => {
        if (!gameState || gameState.phase !== 'PLAYING' || isPaused) return;

        const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
        if (!currentPlayer || !currentPlayer.isBot) return;

        // Skip if it's the solo player's turn (in solo mode, 'Moi' is not a bot)
        // But checking isBot is enough.

        if (isProcessing.current) return;
        isProcessing.current = true;

        // Calculate Delay based on game speed/difficulty if needed
        // For now constant delay for "thinking"
        const delay = 1500;

        const timer = setTimeout(() => {
            const tableState = {
                left: gameState.table.leftValue,
                right: gameState.table.rightValue
            };

            // Use specific bot difficulty if available, else fallback to room/game global difficulty
            const botDiff = currentPlayer.difficulty || (gameState as any).difficulty || (roomData?.difficulty) || (difficulty) || 'medium';

            console.log(`[Bot] ${currentPlayer.name} thinking... (Difficulty: ${botDiff})`);

            const decision = getBotMove(currentPlayer.hand, tableState.left, tableState.right, botDiff);

            let newState: GameState;

            if (decision) {
                console.log(`[Bot] Plays ${decision.tile.id} on ${decision.side}`);
                const sideToPlay = decision.side === 'start' ? undefined : decision.side as 'left' | 'right';
                newState = handleTurn(gameState, currentPlayer.id, decision.tile, sideToPlay);
                SoundManager.playClack();
            } else {
                console.log(`[Bot] No move - Passing`);
                newState = passTurn(gameState, currentPlayer.id);
            }

            // Update State
            if (isSoloMode || !gameId) {
                setGameState(newState);
                isProcessing.current = false;
            } else {
                // Update Firestore
                const sanitized = JSON.parse(JSON.stringify(newState, (k, v) => v === undefined ? null : v));
                updateGameState(gameId, sanitized)
                    .then(() => { isProcessing.current = false; })
                    .catch(err => {
                        console.error("Bot update failed", err);
                        isProcessing.current = false;
                    });
            }

        }, delay);

        return () => clearTimeout(timer);
    }, [gameState, isPaused, isProcessing, isSoloMode, gameId]);

    const handlePlayDomino = async (domino: Domino, startPos?: { x: number, y: number }) => {
        // ATOMIC GUARD
        if (isProcessing.current || !gameState || gameState.phase !== 'PLAYING' || isPaused) {
            return;
        }

        if (gameState.currentPlayerId !== localPlayerId) {
            return;
        }

        // Store start position in ref for later use in executeMove
        if (startPos) {
            lastPlayStartPos.current = startPos;
        }

        const validMoves = getValidMoves([domino], {
            left: gameState.table.leftValue,
            right: gameState.table.rightValue
        });

        if (validMoves.length === 0) return;

        if (validMoves.length > 1) {
            SoundManager.playSound('notify');
            setPendingDomino(domino);
            return;
        }

        const move = validMoves[0];
        executeMove(domino, move.side === 'start' ? undefined : move.side);
    };


    const confirmSidePlay = (side: 'left' | 'right') => {
        if (!pendingDomino || !gameState) return;

        // Pass the side constraint to handleTurn logic if we can
        // For now, we manually handle the side in executesMove or just call executeMove
        // Wait, handleTurn doesn't take side. It determines it.
        // I need to update LogicEngine.ts to support forcing a side.

        executeMove(pendingDomino, side);
        setPendingDomino(null);
    };

    const executeMove = async (domino: Domino, forcedSide?: 'left' | 'right') => {
        if (isProcessing.current || !gameState) return;
        isProcessing.current = true;

        try {
            // Animation start: hide the tile on the board when it appears
            setHiddenDominoId(domino.id);

            const newState = handleTurn(gameState, localPlayerId, domino, forcedSide);

            // Audio & Haptics
            SoundManager.playClack();
            HapticManager.triggerImpact();

            if (isSoloMode || !gameId) {
                setGameState(newState);
            } else {
                await updateGameState(gameId, newState);
            }
        } catch (e) {
            console.log("Invalid move", e);
            setHiddenDominoId(null); // Reset if error
        } finally {
            isProcessing.current = false;
        }
    };

    const handlePassTurn = async () => {
        // ATOMIC GUARD
        if (isProcessing.current || !gameState || gameState.phase !== 'PLAYING' || isPaused) {
            console.log("[handlePassTurn] Action blocked by guard");
            return;
        }
        if (!isMyTurn) {
            console.log("[handlePassTurn] Not your turn");
            return;
        }

        isProcessing.current = true;

        // Safety timeout to release processing lock if something hangs
        const lockSafety = setTimeout(() => { isProcessing.current = false; }, 5000);

        // Double check validation client-side to prevent "Cannot Pass" alert loop
        const currentValidMoves = getValidMoves(localPlayer?.hand || [], {
            left: gameState.table.leftValue,
            right: gameState.table.rightValue
        });

        if (currentValidMoves.length > 0) {
            isProcessing.current = false;
            clearTimeout(lockSafety);
            Alert.alert("Action impossible", "Vous avez des dominos jouables. Vous ne pouvez pas passer.");
            return;
        }

        try {
            const newState = passTurn(gameState, localPlayerId);
            if (isSoloMode || !gameId) {
                setGameState(newState);
            } else {
                await updateGameState(gameId, newState);
            }
        } catch (e: any) {
            console.error("Pass Error", e);
            Alert.alert("Cannot Pass", e.message);
        } finally {
            isProcessing.current = false;
            clearTimeout(lockSafety);
        }
    };

    /**
     * Handles turn timeout for ANY player (local or remote).
     * Activates Auto-Play (Bot mode) for that player and plays their turn.
     */
    const handleTimeout = async (playerId?: PlayerId) => {
        // ATOMIC GUARD - Critical for preventing race conditions
        if (isProcessing.current || !gameState || gameState.phase !== 'PLAYING') return;

        const activeId = playerId || gameState.currentPlayerId;

        // CRITICAL FIX: Reset pending domino if player was choosing a side but timed out
        setPendingDomino(null);

        // Verify it's actually the active player's turn
        if (gameState.currentPlayerId !== activeId) {
            console.log(`[Timeout] Ignore: ${activeId} is not current player (${gameState.currentPlayerId})`);
            return;
        }

        isProcessing.current = true;

        console.log(`[Timeout] Turn timeout for ${activeId} - Activating Auto-Play`);

        try {
            // Find the player
            const pIndex = gameState.players.findIndex(player => player.id === activeId);
            if (pIndex === -1) return;
            const p = gameState.players[pIndex];

            // 1. Mark player as Bot (Auto-Play) locally first to modify the state used for the turn
            const stateForTurn = gameState;

            // Find all valid moves
            const validMoves = getValidMoves(p.hand, {
                left: stateForTurn.table.leftValue,
                right: stateForTurn.table.rightValue
            });

            // Find heaviest valid domino (highest sum)
            let validMove = null;
            if (validMoves.length > 0) {
                const sortedMoves = [...validMoves].sort((a, b) => (b.tile.left + b.tile.right) - (a.tile.left + a.tile.right));
                validMove = sortedMoves[0];
            }

            let newState: GameState;
            if (validMove) {
                console.log(`[Auto-Play] Playing heaviest domino for ${activeId}:`, validMove.tile);
                newState = handleTurn(stateForTurn, activeId, validMove.tile, validMove.side === 'start' ? undefined : validMove.side);
                SoundManager.playClack();
            } else {
                console.log(`[Auto-Play] No valid moves for ${activeId} - Passing`);
                newState = passTurn(stateForTurn, activeId);
            }

            // Update State
            if (isSoloMode || !gameId) {
                setGameState(newState);
            } else {
                await updateGameState(gameId, newState);
            }
        } catch (e) {
            console.error("Auto-play processing failed:", e);
        } finally {
            isProcessing.current = false;
        }
    };

    const handleReplay = async () => {
        if (isSoloMode) {
            navigation.navigate('home' as never);
            return;
        }

        if (gameId && roomData) {
            const isHost = roomData.players[0].uid === userId;
            if (isHost) {
                try {
                    await resetRoomToLobby(gameId);
                    await clearRematchVotes(gameId);
                } catch (e: any) {
                    Alert.alert("Erreur", "Impossible de réinitialiser la salle : " + e.message);
                }
            } else {
                Alert.alert("Attente", "Seul l'hôte peut ramener tout le monde au lobby.");
            }
        } else {
            startNewLocalGame();
        }
    };

    const handleRestartMatch = () => {
        if (isSoloMode) {
            startSoloGame();
        }
    };

    const handleVoteRematch = async () => {
        if (!gameId) return;
        try {
            await voteForRematch(gameId, localPlayerId);
        } catch (e: any) {
            Alert.alert("Erreur", "Impossible de voter pour la revanche : " + e.message);
        }
    };

    const handleLeaveRoom = async () => {
        if (!gameId) {
            navigation.navigate('home' as never);
            return;
        }

        try {
            await leaveRoom(gameId, localPlayerId);
            navigation.navigate('home' as never);
        } catch (e: any) {
            console.error("Error leaving room", e);
            navigation.navigate('home' as never); // Fallback exit
        }
    };

    const handleNextRound = () => {
        if (!gameState) return;

        const isMancheEnd = gameState.phase === 'MANCHE_END';

        // Get player names preserving their order
        const playerNames = gameState.players.map(p => p.name);
        const previousData = gameState.players.map(p => ({
            id: p.id,
            totalPoints: p.totalPoints,
            mancheWins: p.mancheWins,
            totalCochons: p.totalCochons,
            isBot: p.isBot
        }));

        // PRD: Double rule for Match start and EVERY new Manche start
        // Otherwise, winner of previous round starts.
        let winnerId = isMancheEnd ? null : gameState.firstPlayerOfRound;

        // Deal new game
        const partialState = dealGame(playerNames);
        const newPlayers = (partialState.players as Player[]).map((p, i) => {
            // CRITICAL FIX: Always correlate by INDEX i. 
            // In a single Match session, the order of players in the array MUST remain stable.
            const originalPlayer = gameState.players[i];

            return {
                ...p,
                id: originalPlayer.id, // Preserve original unique ID (e.g. 'bot-1' or 'user-uid')
                wins: isMancheEnd ? 0 : originalPlayer.wins,
                isCochon: isMancheEnd ? false : originalPlayer.isCochon,
                mancheWins: originalPlayer.mancheWins,
                totalPoints: originalPlayer.totalPoints,
                totalCochons: originalPlayer.totalCochons,
                isBot: originalPlayer.isBot,
                avatarId: originalPlayer.avatarId
            };
        });

        // If no winner (TIE), determine starter based on highest double in NEW hands
        if (!winnerId) {
            winnerId = determineFirstPlayer(newPlayers);
        }

        const newState: GameState = {
            ...gameState,
            players: newPlayers,
            talonMort: partialState.talonMort as Domino[],
            table: partialState.table!,
            currentPlayerId: winnerId,
            phase: 'PLAYING',
            firstPlayerOfRound: null,
            history: [],
            mancheResult: null, // RESET MANCHE RESULT
            lastActionTimestamp: Date.now()
        };

        if (isSoloMode || !gameId) {
            SoundManager.playSound('shuffle');
            setGameState(newState);
        } else {
            // Multiplayer: Only host should trigger next round to avoid double state creation
            const isHost = roomData?.players[0].uid === userId;
            if (!isHost) {
                Alert.alert("Attente", "Seul l'hôte peut lancer la manche suivante.");
                return;
            }

            SoundManager.playSound('shuffle');
            updateGameState(gameId, newState).catch(err => console.error("Failed to update game state", err));
        }
    };

    // Rematch logic - HOST ONLY checks votes and triggers restart
    useEffect(() => {
        if (isSoloMode || !gameId || !roomData) return;

        const isHost = roomData.players[0].uid === localPlayerId;
        if (!isHost) return;

        // If no votes yet, ignore
        if (!roomData.rematchVotes || roomData.rematchVotes.length === 0) return;

        const allVoted = roomData.players.every(p => roomData.rematchVotes?.includes(p.uid));

        if (allVoted && roomData.players.length > 0) {
            console.log("🎲 Everyone voted for rematch! Starting new game...");
            const restartGame = async () => {
                try {
                    await clearRematchVotes(gameId);
                    // handleStartGame already shuffles and starts
                    await handleStartGame();
                } catch (e) {
                    console.error("Rematch start error", e);
                }
            };
            restartGame();
        }
    }, [roomData?.rematchVotes, roomData?.players.length, isSoloMode, gameId, localPlayerId]);

    // Keep ref in sync with state for Bot useEffect
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // Bot Loop - INDUSTRIAL LOGIC VERSION
    useEffect(() => {
        if (!gameState) return;

        // HARD PHASE GUARD - Must be PLAYING to enter
        if (gameState.phase !== 'PLAYING') {
            console.log(`[Bot Loop] Phase is ${gameState.phase}, not executing.`);
            return;
        }

        const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);

        if (!currentPlayer?.isBot) {
            return; // Not a bot turn
        }

        // Only Host executes bot moves in multiplayer
        const isHost = roomData?.players[0].uid === localPlayerId;
        const shouldExecuteBot = (isSoloMode || !gameId || isHost) && !isPaused;
        if (!shouldExecuteBot) return;

        console.log(`[Bot Loop] Scheduling Bot turn for ${currentPlayer.name}`);

        const timer = setTimeout(() => {
            // Use FRESH state from ref
            const freshState = gameStateRef.current;

            // CRITICAL: Re-check phase with fresh state
            if (!freshState || freshState.phase !== 'PLAYING' || isPaused) {
                console.log(`[Bot Timer] Game is paused or phase is ${freshState?.phase}, aborting.`);
                return;
            }

            const freshPlayer = freshState.players.find(p => p.id === freshState.currentPlayerId);
            if (!freshPlayer?.isBot) {
                console.log(`[Bot Timer] Current player is not a bot, aborting.`);
                return;
            }

            // Get bot move
            const decision = getBotMove(
                freshPlayer.hand,
                freshState.table.leftValue,
                freshState.table.rightValue,
                isSoloMode ? 'expert' : 'medium'
            );

            console.log(`[Bot Decision] ${freshPlayer.name} thinking on table [${freshState.table.leftValue}|${freshState.table.rightValue}]`);

            try {
                let newState: GameState;

                if (decision) {
                    const { tile, side } = decision;
                    console.log(`[Bot Move] Playing ${tile.left}|${tile.right} on ${side}`);

                    // Capture bot avatar position for animation
                    const avatarRef = avatarRefs.current[freshPlayer.id];
                    if (avatarRef) {
                        avatarRef.measure((_x: number, _y: number, _width: number, _height: number, pageX: number, pageY: number) => {
                            lastPlayStartPos.current = { x: pageX, y: pageY };
                            setHiddenDominoId(tile.id);
                        });
                    }

                    newState = handleTurn(freshState, freshPlayer.id, tile, side === 'start' ? undefined : side);
                    SoundManager.playClack();
                    HapticManager.triggerImpact();
                } else {
                    console.log(`[Bot Pass] ${freshPlayer.name} has no valid moves - passing`);
                    newState = passTurn(freshState, freshPlayer.id);

                    if (newState.phase === 'BOUDE') {
                        console.log(`[Bot Pass] Game is now BOUDE! Stopping bot loop.`);
                    }
                }

                // Update state
                if (isSoloMode || !gameId) {
                    setGameState(newState);
                } else {
                    updateGameState(gameId, newState);
                }

                isProcessing.current = false;

            } catch (e: any) {
                console.error("[Bot Error]", e.message);
                isProcessing.current = false;
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [gameState?.currentPlayerId, gameState?.phase, isPaused, isSoloMode, gameId, localPlayerId, roomData]);

    // PHASE 2.2: BOUDE (Game Blocked) Auto-Resolution
    useEffect(() => {
        if (!gameState || gameState.phase !== 'BOUDE' || isCountingPoints) return;

        console.log(`[BOUDE] Game is blocked! Ready for counting.`);
        isProcessing.current = false;
    }, [gameState?.phase]);

    // Effect to trigger flying animation when a domino is added to the table
    useEffect(() => {
        if (!hiddenDominoId || !gameState) return;

        // Give a tiny bit of time for GameTable to render the invisible tile in its new position
        const timeout = setTimeout(() => {
            const dominoOnTable = gameState.table.sequence.find(s => s.domino.id === hiddenDominoId);
            if (!dominoOnTable) {
                setHiddenDominoId(null);
                return;
            }

            const startPos = lastPlayStartPos.current;
            if (!startPos) {
                setHiddenDominoId(null);
                return;
            }

            tableRef.current?.measureTile(hiddenDominoId, (x, y, width, height) => {
                setFlyingDomino({
                    domino: dominoOnTable.domino,
                    startPoint: startPos,
                    endPoint: { x, y },
                    orientation: dominoOnTable.domino.isDouble ? 'vertical' : 'horizontal',
                    isReversed: dominoOnTable.isReversed
                });
                lastPlayStartPos.current = null; // Clear after use
            });
        }, 50);

        return () => clearTimeout(timeout);
    }, [hiddenDominoId, gameState?.table.sequence.length]);

    const handleBoudeFinished = async (winnerId: string | 'TIE') => {
        if (!gameState) return;

        // MULTIPLAYER: Only host should write to Firestore to avoid race conditions
        // Non-host players: just dismiss the counting overlay and show scoreboard.
        // Their gameState will update via Firebase subscription when host resolves.
        if (!isSoloMode && gameId) {
            const isHost = roomData?.players[0].uid === userId;
            if (!isHost) {
                console.log('[BOUDE] Non-host: dismissing overlay, waiting for host to resolve via Firebase');
                setShowScoreboard(true);
                setIsCountingPoints(false);
                return;
            }
        }

        const { newState, isTie } = resolveBoude(gameState);

        if (isTie) {
            console.log(`[BOUDE] Tie detected - restarting partie`);
            setIsCountingPoints(false);
            if (isSoloMode) {
                // Restart same round in solo
                const playerNames = gameState.players.map(p => p.name);
                const partial = dealGame(playerNames);
                const resetState = {
                    ...gameState,
                    ...partial,
                    players: (partial.players as Player[]).map((p, i) => ({
                        ...p,
                        id: gameState.players[i].id,
                        mancheWins: gameState.players[i].mancheWins,
                        totalPoints: gameState.players[i].totalPoints,
                        totalCochons: gameState.players[i].totalCochons,
                        isBot: gameState.players[i].isBot,
                        avatarId: gameState.players[i].avatarId
                    })),
                    phase: 'PLAYING' as GamePhase,
                    history: []
                };
                setGameState(resetState as GameState);
            } else if (gameId) {
                // Multiplayer TIE: Deal new cards and restart, same logic as solo
                const playerNames = gameState.players.map(p => p.name);
                const partial = dealGame(playerNames);
                const resetState = {
                    ...gameState,
                    ...partial,
                    players: (partial.players as Player[]).map((p, i) => ({
                        ...p,
                        id: gameState.players[i].id,
                        mancheWins: gameState.players[i].mancheWins,
                        totalPoints: gameState.players[i].totalPoints,
                        totalCochons: gameState.players[i].totalCochons,
                        isBot: gameState.players[i].isBot,
                        avatarId: gameState.players[i].avatarId,
                        wins: gameState.players[i].wins
                    })),
                    phase: 'PLAYING' as GamePhase,
                    history: [],
                    mancheResult: null
                };
                const sanitized = JSON.parse(JSON.stringify(resetState, (k, v) => v === undefined ? null : v));
                await updateGameState(gameId, sanitized);
            }
        } else {
            // Standard winner resolution - Go straight to scoreboard
            // CRITICAL: Set showScoreboard BEFORE clearing isCountingPoints to avoid
            // a render frame where the useEffect re-triggers the announcer
            if (isSoloMode || !gameId) {
                setShowScoreboard(true);
                setIsCountingPoints(false);
                setGameState(newState);
            } else {
                setShowScoreboard(true);
                setIsCountingPoints(false);
                // Sanitize: Replace undefined with null before sending to Firestore
                const sanitized = JSON.parse(JSON.stringify(newState, (k, v) => v === undefined ? null : v));
                await updateGameState(gameId, sanitized);
            }
        }
    };


    // Get opponents in RELATIVE ORDER for Anti-Clockwise visual flow
    // Order: Local (Bottom) -> Next Player (Top-Right) -> Last Player (Top-Left)
    const opponents = useMemo(() => {
        if (!gameState) return [];
        const numPlayers = gameState.players.length;
        const localIdx = gameState.players.findIndex(p => p.id === localPlayerId);
        if (localIdx === -1) return gameState.players.filter(p => p.id !== localPlayerId);

        const ordered = [];
        // First opponent (Next in turn order) -> will be placed Top-Right
        ordered.push(gameState.players[(localIdx + 1) % numPlayers]);
        // Second opponent (Last in turn order) -> will be placed Top-Left
        if (numPlayers > 2) {
            ordered.push(gameState.players[(localIdx + 2) % numPlayers]);
        }
        return ordered;
    }, [gameState?.players, localPlayerId]);

    // RENDER LOGIC

    if (!gameState) {
        if (!roomData) return <View key="loading-no-room" style={styles.loading}><Text style={styles.text}>Loading...</Text></View>;

        // Show loading screen when starting game instead of lobby
        if (isStarting) {
            return (
                <View key="loading-starting" style={styles.loading}>
                    <Text style={styles.text}>Starting game...</Text>
                    <Text style={[styles.text, { fontSize: 14, marginTop: 10, opacity: 0.7 }]}>
                        Dealing tiles and preparing the board
                    </Text>
                </View>
            );
        }

        return <LobbyScreen key="lobby-screen" roomData={roomData} currentUserId={localPlayerId} onStartGame={handleStartGame} />;
    }

    const getPlayerScore = (player: Player) => {
        if (!gameState) return "";
        switch (gameState.gameMode) {
            case 'MANCHE': return `${player.mancheWins} ${player.mancheWins > 1 ? 'Manches' : 'Manche'}`;
            case 'SCORE': return `${player.totalPoints} pts`;
            case 'COCHON': return `${player.totalCochons} 🐷`;
            default: return "";
        }
    };




    return (
        <View style={styles.container}>
            {/* CHOICE BANNER (Overlay) */}
            {pendingDomino && (
                <View style={[
                    styles.choiceBanner,
                    isLandscape ? { top: 15, bottom: undefined } : { bottom: 160 }
                ]} pointerEvents="none">
                    <Animated.View entering={FadeIn.duration(300)}>
                        <Text style={styles.choiceText}>CHOISISSEZ UN CÔTÉ</Text>
                    </Animated.View>
                </View>
            )}
            {/* Dynamic Background based on Theme */}
            <LinearGradient
                colors={[
                    TABLE_THEMES[tableTheme].background,
                    TABLE_THEMES[tableTheme].felt,
                    TABLE_THEMES[tableTheme].background
                ]}
                style={StyleSheet.absoluteFill}
            />

            <StatusBar barStyle="light-content" translucent />


            {/* PAUSE BUTTON - Solo Mode Only */}
            {isSoloMode && gameState && gameState.phase === 'PLAYING' && (
                <TouchableOpacity
                    style={[styles.pauseTopCenterButton, { top: Math.max(insets.top + 10, 20) }]}
                    onPress={() => setIsPaused(!isPaused)}
                    activeOpacity={0.7}
                >
                    <Ionicons name={isPaused ? "play" : "pause"} size={28} color="#FFD700" />
                </TouchableOpacity>
            )}

            {/* INFO BUTTON - Discreet top-center button */}
            {!isSoloMode && gameId && (
                <TouchableOpacity
                    style={[styles.infoButton, { top: Math.max(insets.top + 10, 20) }]}
                    onPress={() => setShowRoomInfo(!showRoomInfo)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="information-circle-outline" size={24} color="#FFD700" />
                </TouchableOpacity>
            )}

            {/* ROOM INFO CARD - Floating card with room code + game objective */}
            {!isSoloMode && gameId && showRoomInfo && (
                <>
                    {/* Backdrop - close on tap outside */}
                    <TouchableOpacity
                        style={styles.infoBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowRoomInfo(false)}
                    >
                        <View style={styles.infoCard}>
                            {/* Room Code Row */}
                            <View style={styles.infoCardHeader}>
                                <Ionicons name="game-controller-outline" size={16} color="#FFD700" />
                                <Text style={styles.infoCardTitle}>Salle</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.infoCardCodeRow}
                                onPress={() => {
                                    Clipboard.setStringAsync(gameId);
                                    Alert.alert("✓ Copié", "Code copié dans le presse-papier !");
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="copy-outline" size={14} color="rgba(255,255,255,0.5)" />
                                <Text style={styles.infoCardCode}>{gameId}</Text>
                            </TouchableOpacity>

                            {/* Divider */}
                            <View style={styles.infoCardDivider} />

                            {/* Game Objective */}
                            <View style={styles.infoCardHeader}>
                                <Ionicons name="trophy-outline" size={16} color="#FFD700" />
                                <Text style={styles.infoCardTitle}>Objectif</Text>
                            </View>

                            <View style={styles.infoCardObjective}>
                                <Text style={styles.infoCardObjectiveText}>
                                    {gameState.gameMode === 'MANCHE'
                                        ? `🏆  ${gameState.winningCondition} manche${gameState.winningCondition > 1 ? 's' : ''}`
                                        : gameState.gameMode === 'SCORE'
                                            ? `⭐  ${gameState.winningCondition} points`
                                            : `🐷  ${gameState.winningCondition} cochon${gameState.winningCondition > 1 ? 's' : ''}`
                                    }
                                </Text>
                                <Text style={styles.infoCardModeLabel}>
                                    {gameState.gameMode === 'MANCHE'
                                        ? 'Mode Manche'
                                        : gameState.gameMode === 'SCORE'
                                            ? 'Mode Score'
                                            : 'Mode Cochon'
                                    }
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </>
            )}


            <GameTable
                ref={tableRef}
                gameState={gameState}
                theme={tableTheme}
                pendingDomino={pendingDomino}
                onSideSelect={pendingDomino ? confirmSidePlay : undefined}
                hiddenDominoId={hiddenDominoId}
            />

            {flyingDomino && (
                <FlyingDomino
                    data={flyingDomino}
                    onFinished={() => {
                        setFlyingDomino(null);
                        setHiddenDominoId(null);
                    }}
                />
            )}

            {/* UI LAYER */}
            <View style={styles.uiLayer} pointerEvents="box-none">

                {/* Opponents Display - Both Solo and Multiplayer now use same layout for 3 players */}
                {/* Opponents Display - ANTI-CLOCKWISE REORGANIZATION */}
                {/* Visual Order: You (Bottom) -> Next Player (Top-Right) -> Last Player (Top-Left) */}
                {opponents[0] && (
                    <Animated.View
                        ref={(el) => (avatarRefs.current[opponents[0].id] = el as any)}
                        entering={FadeInRight.delay(200).duration(600)}
                        style={[styles.topRightCorner, { top: Math.max(insets.top + 5, 15), right: Math.max(insets.right + 10, 10) }]}
                    >
                        <PlayerAvatar
                            key={`${opponents[0]?.id}-${gameState.currentPlayerId}`}
                            player={opponents[0]}
                            isActive={gameState.currentPlayerId === opponents[0]?.id}
                            showTimer={gameState.currentPlayerId === opponents[0]?.id && !isGameOver && gameState.phase === 'PLAYING' && gameState.turnDuration > 0}
                            isPaused={isPaused}
                            timerDuration={gameState.turnDuration}
                            size={52}
                            layout="vertical"
                            namePlacement="below"
                            score={getPlayerScore(opponents[0])}
                            position="top-right"
                            onTimeout={() => handleTimeout(opponents[0]?.id)}
                        />
                    </Animated.View>
                )}

                {opponents[1] && (
                    <Animated.View
                        ref={(el) => (avatarRefs.current[opponents[1].id] = el as any)}
                        entering={FadeInLeft.delay(400).duration(600)}
                        style={[styles.topLeftArea, { top: Math.max(insets.top + 5, 15), left: Math.max(insets.left + 10, 10) }]}
                    >
                        <PlayerAvatar
                            key={`${opponents[1]?.id}-${gameState.currentPlayerId}`}
                            player={opponents[1]}
                            isActive={gameState.currentPlayerId === opponents[1]?.id}
                            showTimer={gameState.currentPlayerId === opponents[1]?.id && !isGameOver && gameState.phase === 'PLAYING' && gameState.turnDuration > 0}
                            isPaused={isPaused}
                            timerDuration={gameState.turnDuration}
                            size={52}
                            layout="vertical"
                            namePlacement="below"
                            score={getPlayerScore(opponents[1])}
                            position="top-left"
                            onTimeout={() => handleTimeout(opponents[1]?.id)}
                        />
                    </Animated.View>
                )}

                {/* Pass Button Area - HIGH Z-INDEX */}
                {isMyTurn && !canPlayAny && gameState.phase === 'PLAYING' && (
                    <View style={[styles.passContainer, { bottom: 120 + insets.bottom, zIndex: 100 }]}>
                        <TouchableOpacity style={styles.passButton} onPress={handlePassTurn}>
                            <Text style={styles.passButtonText}>Passer son tour</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* BOTTOM LEFT: Local Player (Me) */}
                {localPlayer && (
                    <Animated.View
                        ref={(el) => (avatarRefs.current[localPlayer.id] = el as any)}
                        entering={FadeInLeft.delay(600).duration(600)}
                        style={[styles.bottomLeftArea, { bottom: 20 + insets.bottom, left: 20 + insets.left }]}
                    >
                        <PlayerAvatar
                            player={localPlayer}
                            isActive={isMyTurn}
                            showTimer={isMyTurn && !isGameOver && gameState.phase === 'PLAYING' && gameState.turnDuration > 0}
                            isPaused={isPaused}
                            timerDuration={gameState.turnDuration}
                            size={60}
                            layout="horizontal"
                            score={getPlayerScore(localPlayer)}
                            position="bottom"
                            onTimeout={() => handleTimeout(localPlayerId)}
                        />
                    </Animated.View>
                )}
            </View>

            {/* Player Hand - HIGH Z-INDEX */}
            {!isCountingPoints && (
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: insets.bottom, zIndex: 50 }}>
                    {localPlayer && (
                        <PlayerHand
                            hand={localPlayer.hand}
                            onPlayDomino={handlePlayDomino}
                            disabled={gameState.currentPlayerId !== localPlayerId || gameState.phase !== 'PLAYING'}
                            leftValue={gameState.table.leftValue as any}
                            rightValue={gameState.table.rightValue as any}
                        />
                    )}
                </View>
            )}

            {announcement && (
                <GameAnnouncer
                    message={announcement.message}
                    subMessage={announcement.subMessage}
                    type={announcement.type}
                    onFinished={() => {
                        if (announcement.type === 'BOUDE') {
                            setIsCountingPoints(true);
                        } else {
                            setShowScoreboard(true);
                        }
                        setAnnouncement(null);
                    }}
                />
            )}

            {isCountingPoints && gameState && (
                <BoudeCounting
                    players={gameState.players}
                    onFinished={handleBoudeFinished}
                />
            )}

            {showScoreOverlay && (
                <GameOverScreen
                    gameState={gameState}
                    currentUserId={localPlayerId}
                    onReplay={handleReplay}
                    onNextRound={handleNextRound}
                    onRestartMatch={handleRestartMatch}
                    onVoteRematch={handleVoteRematch}
                    onLeaveRoom={handleLeaveRoom}
                    rematchVotes={roomData?.rematchVotes}
                    isSolo={isSoloMode}
                />
            )}

            {/* PAUSE OVERLAY */}
            {isPaused && (
                <View style={styles.pauseOverlay}>
                    <Animated.View entering={FadeInLeft.duration(300)} style={styles.pauseContent}>
                        <Ionicons name="pause-circle" size={80} color="#FFD700" />
                        <Text style={styles.pauseTitle}>PAUSE</Text>
                        <TouchableOpacity
                            style={styles.resumeButton}
                            onPress={() => setIsPaused(false)}
                        >
                            <Text style={styles.resumeButtonText}>REPRENDRE</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quitButton}
                            onPress={() => navigation.navigate('home' as never)}
                        >
                            <Text style={styles.quitButtonText}>QUITTER LA PARTIE</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            )}

            {showSettings && <SettingsScreen onClose={() => setShowSettings(false)} />}
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loading: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: { color: 'white' },
    opponentsContainer: {
        ...StyleSheet.absoluteFillObject,
        pointerEvents: 'box-none',
    },
    uiLayer: {
        ...StyleSheet.absoluteFillObject,
    },
    topCenterArea: {
        position: 'absolute',
        alignSelf: 'center',
        zIndex: 10,
    },
    botAvatarAbsolute: {
        position: 'absolute',
        zIndex: 20, // Above table and other elements
    },
    playerCard: {
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: 12,
        padding: 10,
    },
    avatarCircleTop: {
        width: 55,
        height: 55,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFD700',
        marginBottom: 6,
    },
    avatarEmoji: {
        fontSize: 28,
    },
    playerInfo: {
        alignItems: 'center',
    },
    playerNameTop: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 'bold',
    },
    playerScore: {
        color: '#FFD700',
        fontSize: 11,
        fontWeight: '600',
    },
    activeIndicator: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    playerCardMe: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 30,
        paddingRight: 15,
        paddingVertical: 5,
        gap: 10,
    },
    avatarCircleBottom: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFD700',
    },
    playerInfoMe: {
        alignItems: 'flex-start',
    },
    playerNameMe: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    playerScoreMe: {
        color: '#FFD700',
        fontSize: 11,
        fontWeight: '600',
    },
    activeIndicatorMe: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    timerContainer: {
        position: 'absolute',
        zIndex: 15,
    },
    timerCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFD700',
    },
    timerText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
    topLeftArea: {
        position: 'absolute',
    },
    topRightCorner: {
        position: 'absolute',
    },
    bottomLeftArea: {
        position: 'absolute',
        zIndex: 10,
    },
    settingsButton: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    opponentAvatar: {
        marginTop: 0,
    },
    passContainer: {
        position: 'absolute',
        alignSelf: 'center',
        zIndex: 10,
    },
    passButton: {
        backgroundColor: '#c0392b',
        paddingHorizontal: 25,
        paddingVertical: 10,
        borderRadius: 25,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
    },
    passButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        textTransform: 'uppercase',
    },
    pauseBottomButton: {
        position: 'absolute',
        zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    pauseOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 200,
    },
    pauseContent: {
        alignItems: 'center',
        backgroundColor: '#1a2a1a',
        padding: 40,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#FFD700',
        width: '80%',
    },
    pauseTitle: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 30,
        letterSpacing: 4,
    },
    resumeButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
        marginBottom: 15,
    },
    resumeButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    quitButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 20,
        zIndex: 100,
    },
    quitButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    announcementOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
    },
    announcementText: {
        fontSize: 48,
        fontWeight: '900',
        color: '#FFD700',
        textShadowColor: 'rgba(0,0,0,0.75)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 5,
        textAlign: 'center',
    },
    subAnnouncementText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 10,
        textAlign: 'center',
    },
    choiceBanner: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#FFD700',
        zIndex: 50,
    },
    choiceText: {
        color: '#FFD700',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 2,
        textShadowColor: 'rgba(0,0,0,0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    pauseTopCenterButton: {
        position: 'absolute',
        zIndex: 110,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    infoButton: {
        position: 'absolute',
        zIndex: 110,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 40, // consistent size
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
        marginLeft: 60, // offset from pause button if both present, or just to the right
    },
    infoBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        zIndex: 200, // above everything
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoCard: {
        width: 280,
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    infoCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoCardTitle: {
        color: '#888',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    infoCardCodeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 16,
    },
    infoCardCode: {
        color: '#FFD700',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
        letterSpacing: 2,
        fontFamily: 'monospace', // ensures distinct chars
    },
    infoCardDivider: {
        height: 1,
        backgroundColor: '#333',
        marginBottom: 16,
    },
    infoCardObjective: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoCardObjectiveText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
    },
    infoCardModeLabel: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 2,
        marginLeft: 24, // align with text above
    },
});

