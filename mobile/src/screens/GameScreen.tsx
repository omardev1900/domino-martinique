import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

import { View, StyleSheet, Text, StatusBar, TouchableOpacity, Alert, SafeAreaView, useWindowDimensions, Image, Platform, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, FadeInLeft, FadeInRight, FadeIn, ZoomIn, FadeOut } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import { GameTable } from '../components/GameTable';
import { PlayerHand } from '../components/PlayerHand';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { LobbyScreen } from './LobbyScreen';
import { UnifiedResultOverlay } from '../components/UnifiedResultOverlay';
// import { GameOverScreen } from './GameOverScreen'; // Legacy replaced by UnifiedResultOverlay
import { dealGame, dealGameSolo, handleTurn, passTurn, determineFirstPlayer, resolveBoude, checkValidMove } from '../core/LogicEngine';
import { getValidMoves } from '../core/DominoEngine';
import { getBotMove } from '../core/BotEngine';
// import { GameAnnouncer } from '../components/GameAnnouncer'; // Removed as per instruction
// import { BoudeCounting } from '../components/BoudeCounting'; // Removed as per instruction

import { GameState, Player, PlayerId, MancheResult, GamePhase, Domino, GameRoom, RoomStatus, GameMode } from '@/core/types';
import { subscribeToRoom, updateGameState, leaveRoom, startGame, resetRoomToLobby, voteForRematch, clearRematchVotes, updatePlayerChat } from '../core/services/firebase';
import { Ionicons } from '@expo/vector-icons';
import SoundManager from '../core/audio/SoundManager';
import HapticManager from '../core/audio/HapticManager';
import { TURN_DURATION_SECONDS, HAND_SIZE } from '../core/constants';
import * as Clipboard from 'expo-clipboard';
import SettingsManager from '../core/SettingsManager';
import { TableTheme, TABLE_THEMES } from '../core/themes/tableThemes';
import { authService } from '../core/services/auth.service';
import { AVAILABLE_AVATARS, AvatarId, getAvatarImage } from '../core/avatars';
import { GameTableRef } from '../components/GameTable';
import { FlyingDomino } from '../components/FlyingDomino';
import { FlyingDominoData } from '../core/animations/AnimationTypes';
import { QuickChat } from '../components/QuickChat';


interface GameScreenProps {
    gameId?: string;
    userId?: string;
    mode?: 'solo' | 'multiplayer';
    difficulty?: 'easy' | 'medium' | 'expert' | 'legend';
    gameMode?: GameMode;
    winningCondition?: number;
    turnDuration?: number;
    startingHandSize?: number;
}

export default function GameScreen({ gameId, userId, mode, difficulty, gameMode, winningCondition, turnDuration, startingHandSize: propStartingHandSize }: GameScreenProps) {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const isLandscape = width > height;

    const [roomData, setRoomData] = useState<GameRoom | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [localPlayerId] = useState<PlayerId>(userId || 'p1');
    const [showRoomInfo, setShowRoomInfo] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isSoloMode] = useState(mode === 'solo');
    const [startingHandSize] = useState(propStartingHandSize || HAND_SIZE);
    const [isStarting, setIsStarting] = useState(false); // Loading state during game start
    const [tableTheme, setTableTheme] = useState<TableTheme>('classic');
    const [showScoreboard, setShowScoreboard] = useState(false);
    const [boudedPlayerId, setBoudedPlayerId] = useState<PlayerId | null>(null);
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [bannerState, setBannerState] = useState<'NONE' | 'MANCHE' | 'ROUND'>('NONE');
    const [playersChat, setPlayersChat] = useState<{ [playerId: string]: string | null }>({});
    const chatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastChatTimeRef = useRef<number>(0);
    const [isHardLocked, setIsHardLocked] = useState(false);
    const [overtime, setOvertime] = useState<number | null>(null);
    const [isBotPlaying, setIsBotPlaying] = useState(false);

    // Fullscreen API (web only)
    useEffect(() => {
        if (Platform.OS !== 'web') return;
        const handleChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleChange);
        return () => document.removeEventListener('fullscreenchange', handleChange);
    }, []);

    // GLOBAL CLEANUP: Stop all audio when the game screen is unmounted
    // This prevents music/sounds from leaking after navigating away
    // -------------------------------------------------------------------------
    useEffect(() => {
        return () => {
            console.log('[GameScreen] Unmounting — stopping all audio.');
            SoundManager.stopMusic();
        };
    }, []);

    // -------------------------------------------------------------------------
    // MOBILE LANDSCAPE LOCK: Force landscape + fullscreen on mobile devices
    // -------------------------------------------------------------------------
    useFocusEffect(
        useCallback(() => {
            const checkAuthGuard = async () => {
                const user = await authService.getCurrentUser();
                if (mode === 'multiplayer' && user?.uid?.startsWith('guest_')) {
                    console.log('[GameScreen] Guard: Anonymous user attempted multiplayer.');
                    router.replace('/login');
                    return;
                }
            };
            checkAuthGuard();

            if (Platform.OS !== 'web') {
                ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
                if (Platform.OS === 'android') {
                    NavigationBar.setVisibilityAsync('hidden');
                    NavigationBar.setBehaviorAsync('overlay-swipe');
                }
            }
            return () => {
                // Restore portrait when leaving game screen
                if (Platform.OS !== 'web') {
                    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                    if (Platform.OS === 'android') {
                        NavigationBar.setVisibilityAsync('visible');
                    }
                }
            };
        }, [mode])
    );

    const toggleFullscreen = useCallback(() => {
        if (Platform.OS !== 'web') return;
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('Fullscreen request failed:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }, []);

    const [hiddenDominoId, setHiddenDominoId] = useState<string | null>(null);
    const [flyingDomino, setFlyingDomino] = useState<FlyingDominoData | null>(null);

    const tableRef = useRef<GameTableRef>(null);
    const rootRef = useRef<View>(null);
    const lastPlayStartPos = useRef<{ x: number, y: number } | null>(null);
    const avatarRefs = useRef<{ [key: string]: View | null }>({});
    const prevHistoryLength = useRef(0);
    const isProcessingMove = useRef(false);
    const lastSeenChatTimestamps = useRef<{ [playerId: string]: number }>({});

    const triggerLocalChat = useCallback((content: string, skipFirebase: boolean = false) => {
        const now = Date.now();
        // 3s Cooldown (Anti-Spam)
        if (now - lastChatTimeRef.current < 3000) return;

        lastChatTimeRef.current = now;

        // Clear existing timeout
        if (chatTimeoutRef.current) {
            clearTimeout(chatTimeoutRef.current);
        }

        // Update state
        setPlayersChat(prev => ({ ...prev, [localPlayerId]: content }));

        // Pass to Firebase if needed (Step 4 - Fixed)
        if (gameId && !skipFirebase) {
            updatePlayerChat(gameId, localPlayerId, content);
        }

        // Set new auto-hide timeout
        chatTimeoutRef.current = setTimeout(() => {
            setPlayersChat(prev => ({ ...prev, [localPlayerId]: null }));
            chatTimeoutRef.current = null;
        }, 3000);
    }, [localPlayerId, gameId, gameState]);

    const triggerOpponentChat = useCallback((playerId: string, content: string) => {
        setPlayersChat(prev => ({ ...prev, [playerId]: content }));

        // Auto-hide for opponent
        setTimeout(() => {
            setPlayersChat(prev => ({ ...prev, [playerId]: null }));
        }, 3000);
    }, []);
    const gameStateRef = useRef<GameState | null>(null);
    const mainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const overtimeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const overtimeTriggeredRef = useRef(false);
    const overtimeResolvedRef = useRef(false);
    const lastTimerSoundRef = useRef<number | null>(null);
    const handleTimeoutRef = useRef<(playerId?: PlayerId, alreadyLocked?: boolean) => Promise<void>>(async () => { });
    const navigation = useNavigation();
    const router = useRouter();
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [pendingDomino, setPendingDomino] = useState<Domino | null>(null);
    const pulseOpacity = useSharedValue(1);
    const hostUid = roomData?.players?.[0]?.uid;
    const isLocalHost = hostUid === localPlayerId;

    const clearMainTurnTimer = useCallback(() => {
        if (mainTimerRef.current) {
            clearTimeout(mainTimerRef.current);
            mainTimerRef.current = null;
        }
    }, []);

    const clearOvertimeTimer = useCallback(() => {
        if (overtimeTimerRef.current) {
            clearTimeout(overtimeTimerRef.current);
            overtimeTimerRef.current = null;
        }
    }, []);

    const clearAllTurnTimers = useCallback(() => {
        clearMainTurnTimer();
        clearOvertimeTimer();
    }, [clearMainTurnTimer, clearOvertimeTimer]);

    // Sync ref for listeners
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

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

    // RESET LOCK ON TURN CHANGE
    useEffect(() => {
        isProcessingMove.current = false;
        clearAllTurnTimers();
        overtimeTriggeredRef.current = false;
        overtimeResolvedRef.current = false;
        lastTimerSoundRef.current = null;
        setIsHardLocked(false);
        setOvertime(null);
        setIsBotPlaying(false);
    }, [gameState?.currentPlayerId, clearAllTurnTimers]);

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
                    // ... (I will wait for view_file to finish)
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
    // TIMER & OVERTIME EFFECTS - AUTHORITY SAFE + RACE SAFE
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (!gameState || gameState.phase !== 'PLAYING') {
            clearAllTurnTimers();
            overtimeTriggeredRef.current = false;
            overtimeResolvedRef.current = false;
            lastTimerSoundRef.current = null;
            setTimeLeft(null);
            setOvertime(null);
            setIsHardLocked(false);
            setIsBotPlaying(false);
            return;
        }

        const currentPlayer = gameState.players.find(player => player.id === gameState.currentPlayerId);
        const canManageCurrentTurn = !!currentPlayer && (
            currentPlayer.id === localPlayerId ||
            (currentPlayer.isBot && (isSoloMode || !gameId || isLocalHost))
        );

        if (!canManageCurrentTurn) {
            clearAllTurnTimers();
            overtimeTriggeredRef.current = false;
            overtimeResolvedRef.current = false;
            lastTimerSoundRef.current = null;
            setTimeLeft(null);
            setOvertime(null);
            setIsHardLocked(false);
            setIsBotPlaying(false);
            return;
        }

        clearAllTurnTimers();
        overtimeTriggeredRef.current = false;
        overtimeResolvedRef.current = false;
        lastTimerSoundRef.current = null;
        setIsHardLocked(false);
        setIsBotPlaying(false);
        setOvertime(null);
        setTimeLeft(gameState.turnDuration);
    }, [gameState?.currentPlayerId, gameState?.phase, gameState?.turnDuration, localPlayerId, isSoloMode, gameId, isLocalHost, clearAllTurnTimers]);

    useEffect(() => {
        if (!gameState || gameState.phase !== 'PLAYING' || isPaused || bannerState !== 'NONE') {
            clearMainTurnTimer();
            return;
        }

        const currentPlayer = gameState.players.find(player => player.id === gameState.currentPlayerId);
        const canManageCurrentTurn = !!currentPlayer && (
            currentPlayer.id === localPlayerId ||
            (currentPlayer.isBot && (isSoloMode || !gameId || isLocalHost))
        );

        if (!canManageCurrentTurn || overtime !== null || timeLeft === null || timeLeft <= 0) {
            clearMainTurnTimer();
            return;
        }

        clearMainTurnTimer();
        mainTimerRef.current = setTimeout(() => {
            setTimeLeft(prev => {
                if (prev === null) return null;
                return Math.max(prev - 1, 0);
            });
        }, 1000);

        return clearMainTurnTimer;
    }, [gameState?.phase, gameState?.currentPlayerId, timeLeft, overtime, isPaused, bannerState, localPlayerId, isSoloMode, gameId, isLocalHost, clearMainTurnTimer]);

    useEffect(() => {
        if (!gameState || gameState.phase !== 'PLAYING' || timeLeft === null) return;

        const currentPlayer = gameState.players.find(player => player.id === gameState.currentPlayerId);
        const canManageCurrentTurn = !!currentPlayer && (
            currentPlayer.id === localPlayerId ||
            (currentPlayer.isBot && (isSoloMode || !gameId || isLocalHost))
        );
        if (!canManageCurrentTurn) return;

        if (timeLeft > 0 && timeLeft <= 3 && lastTimerSoundRef.current !== timeLeft) {
            lastTimerSoundRef.current = timeLeft;
            SoundManager.playSound('timer');
        }

        if (timeLeft === 0 && !overtimeTriggeredRef.current) {
            overtimeTriggeredRef.current = true;
            SoundManager.playSound('end_time');
            setOvertime(5);
        }
    }, [timeLeft, gameState?.phase, gameState?.currentPlayerId, localPlayerId, isSoloMode, gameId, isLocalHost]);

    useEffect(() => {
        if (overtime === null) {
            clearOvertimeTimer();
            overtimeResolvedRef.current = false;
            return;
        }

        if (!gameState || gameState.phase !== 'PLAYING' || isPaused) {
            clearOvertimeTimer();
            return;
        }

        const currentPlayer = gameState.players.find(player => player.id === gameState.currentPlayerId);
        const canManageCurrentTurn = !!currentPlayer && (
            currentPlayer.id === localPlayerId ||
            (currentPlayer.isBot && (isSoloMode || !gameId || isLocalHost))
        );
        if (!canManageCurrentTurn) {
            clearOvertimeTimer();
            setOvertime(null);
            return;
        }

        if (overtime > 0) {
            clearOvertimeTimer();
            overtimeTimerRef.current = setTimeout(() => {
                setOvertime(prev => (prev === null ? null : Math.max(prev - 1, 0)));
            }, 1000);
            return clearOvertimeTimer;
        }

        if (overtime === 0 && !overtimeResolvedRef.current) {
            clearOvertimeTimer();
            overtimeResolvedRef.current = true;
            setIsHardLocked(true);
            setIsBotPlaying(true);
            void handleTimeoutRef.current(undefined, true);
        }
    }, [overtime, gameState?.phase, gameState?.currentPlayerId, isPaused, localPlayerId, isSoloMode, gameId, isLocalHost, clearOvertimeTimer]);

    useEffect(() => {
        return () => {
            clearAllTurnTimers();
        };
    }, [clearAllTurnTimers]);

    // DERIVED STATE - Must be after state hooks but before handlers
    const localPlayer = gameState?.players.find(p => p.id === localPlayerId);
    const isMyTurn = gameState?.currentPlayerId === localPlayerId;
    const isGameOver = gameState?.phase === 'MATCH_END' || gameState?.phase === 'MANCHE_END' || gameState?.phase === 'PARTIE_END' || gameState?.phase === 'BOUDE';
    const showScoreOverlay = isGameOver && showScoreboard;

    // Player profile data for solo mode
    const [playerDisplayName, setPlayerDisplayName] = useState<string>('Moi');

    useEffect(() => {
        if (Platform.OS === 'web' && !showScoreOverlay && !showRoomInfo && !isPaused) {
            // Restore focus to root element when overlays are closed
            (rootRef.current as any)?.focus?.();
        }
    }, [showScoreOverlay, showRoomInfo, isPaused]);
    const [playerAvatarId, setPlayerAvatarId] = useState<string | undefined>('avatar_01');



    // Load saved table theme and player profile
    // This must complete BEFORE starting the game
    const [profileLoaded, setProfileLoaded] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const loadSettings = async () => {
                const settings = SettingsManager.getSettings();
                setTableTheme(settings.tableTheme);
                setIsSoundEnabled(settings.isSfxEnabled);

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

    // Automatically show scoreboard when a round/manche/match ends or game is blocked
    useEffect(() => {
        if (!gameState) return;

        const endPhases: GamePhase[] = ['PARTIE_END', 'MANCHE_END', 'MATCH_END', 'BOUDE'];
        if (endPhases.includes(gameState.phase)) {
            // Show scoreboard immediately to prevent freezes on blocked games
            setShowScoreboard(true);
        } else {
            setShowScoreboard(false);
        }
    }, [gameState?.phase]);

    // Show Round/Manche Banner when a new round starts
    useEffect(() => {
        if (!gameState || gameState.phase !== 'PLAYING') return;

        // Si c'est le round 1 de la manche, on affiche "Manche X" pendant 1s, puis "Round 1" pendant 1s
        if (gameState.roundNumber === 1) {
            setBannerState('MANCHE');
            const timer1 = setTimeout(() => {
                setBannerState('ROUND');
                const timer2 = setTimeout(() => {
                    setBannerState('NONE');
                }, 1000);
                // On garde la référence du timer2 potentiellement pour clean up,
                // mais c'est encapsulé ici.
            }, 1000);

            return () => {
                clearTimeout(timer1);
                // Pas trivial d'annuler timer2 ici sans state ref complexe,
                // mais acceptable pour 1s.
            };
        } else {
            // Sinon (Round 2+), on affiche juste "Round Y" pendant 1s
            setBannerState('ROUND');
            const timer = setTimeout(() => {
                setBannerState('NONE');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [gameState?.roundNumber, gameState?.mancheNumber]);

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

            // Detection des chats (Step 4 - Fixed decoupled version)
            if (data.quickChats) {
                const now = Date.now();
                Object.keys(data.quickChats).forEach(pId => {
                    const chat = data.quickChats![pId];
                    if (chat && chat.timestamp > (lastSeenChatTimestamps.current[pId] || 0)) {
                        lastSeenChatTimestamps.current[pId] = chat.timestamp;

                        if (now - chat.timestamp < 5000) {
                            if (pId !== localPlayerId) {
                                triggerOpponentChat(pId, chat.content);
                            }
                        }
                    }
                });
            }

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
            // If the match is over, we don't need to protect the screen
            if (gameStateRef.current?.phase === 'MATCH_END') {
                return;
            }
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

    // -------------------------------------------------------------------------
    // SAFE FIREBASE UPDATE: Silently swallow offline errors in Solo mode.
    // In solo mode, the game state is local-first; Firebase sync is best-effort.
    // In multiplayer, errors are re-thrown so they can be handled normally.
    // -------------------------------------------------------------------------
    const safeUpdateGameState = async (id: string, state: GameState) => {
        try {
            await updateGameState(id, state);
        } catch (err: any) {
            if (isSoloMode) {
                // Offline / unavailable — game stays alive locally, no redirect
                console.warn('[Solo] Firestore sync failed (offline?), continuing locally:', err?.message || err);
                return;
            }
            throw err; // Re-throw for multiplayer so callers handle it
        }
    };

    const startSoloGame = () => {
        const hSize = startingHandSize !== undefined ? Number(startingHandSize) : HAND_SIZE;
        const partialState = dealGameSolo(localPlayerId, playerDisplayName, playerAvatarId, difficulty || 'easy', hSize);
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
            lastActionTimestamp: Date.now(),
            mancheHistory: [],
            roundNumber: 1,
            mancheNumber: 1,
            startingHandSize: hSize
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
                    { name: 'Chip_1', avatarId: 'Chip_1', difficulty: 'easy' },
                    { name: 'Spark_2', avatarId: 'Spark_2', difficulty: 'medium' }
                ];
            case 'medium':
                // Moyen: 1 Medium (bot_02) + 1 Expert (bot_03)
                return [
                    { name: 'Spark_2', avatarId: 'Spark_2', difficulty: 'medium' },
                    { name: 'Atlas_3', avatarId: 'Atlas_3', difficulty: 'expert' }
                ];
            case 'expert':
                // Expert: 1 Expert (bot_03) + 1 Legend (bot_04)
                return [
                    { name: 'Atlas_3', avatarId: 'Atlas_3', difficulty: 'expert' },
                    { name: 'Zenith_4', avatarId: 'Zenith_4', difficulty: 'legend' }
                ];
            case 'legend':
            case 'valou_legend':
                // Légende: 1 Legend (bot_04) + 1 Valou (bot_05)
                return [
                    { name: 'Zenith_4', avatarId: 'Zenith_4', difficulty: 'legend' },
                    { name: 'Zenith_4', avatarId: 'Zenith_4', difficulty: 'valou_legend' }
                ];
            default:
                // Fallback Medium
                return [
                    { name: 'Spark_2', avatarId: 'Spark_2', difficulty: 'medium' },
                    { name: 'Atlas_3', avatarId: 'Atlas_3', difficulty: 'expert' }
                ];
        }
    };

    const startNewLocalGame = () => {
        // Use the difficulty prop passed to screen (from previous menu selection)
        const botConfigs = getBotsForDifficulty(difficulty || 'medium');

        // Create initial state with placeholders
        const fullState = createInitialState(['Moi', botConfigs[0].name, botConfigs[1].name], 'SCORE', 6, 15, startingHandSize);

        // Configure Bot 1
        fullState.players[1].isBot = true;
        fullState.players[1].avatarId = botConfigs[0].avatarId;
        fullState.players[1].difficulty = botConfigs[0].difficulty as any;
        // Bot wins initialized to 0
        fullState.players[1].currentMancheStars = 0;

        // Configure Bot 2
        fullState.players[2].isBot = true;
        fullState.players[2].avatarId = botConfigs[1].avatarId;
        fullState.players[2].difficulty = botConfigs[1].difficulty as any;
        fullState.players[2].currentMancheStars = 0;

        SoundManager.playSound('shuffle');
        setGameState(fullState);
    };

    const createInitialState = (playerNames: string[], gMode: GameMode = 'MANCHE', wCond: number = 3, tDur: number = TURN_DURATION_SECONDS, hSize: number = HAND_SIZE): GameState => {
        const partialState = dealGame(playerNames, hSize);
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
            lastActionTimestamp: Date.now(),
            mancheHistory: [],
            roundNumber: 1,
            mancheNumber: 1,
            startingHandSize: hSize
        };
    };

    // Multiplayer Start Handler
    const handleStartGame = async () => {
        SoundManager.unlockAudio();
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
                roomData.turnDuration || 15,
                roomData.startingHandSize || 7
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

            // CRITICAL FIX: Re-determine first player now that we have real IDs
            fullState.currentPlayerId = determineFirstPlayer(fullState.players);

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


    // --- BOT LOGIC HANDLING ---
    // The "Industrial" bot loop (lines 1200+) handles all bot moves consistently.

    const handlePlayDomino = async (domino: Domino, startPos?: { x: number, y: number }) => {
        isProcessingMove.current = true; // Turn-based Lock: Absolute priority to human

        SoundManager.unlockAudio();
        // ATOMIC GUARD - We only check OTHER conditions now, since we already set the lock
        if (!gameState || gameState.phase !== 'PLAYING' || isPaused || bannerState !== 'NONE') {
            isProcessingMove.current = false; // Release if guard fails
            return;
        }

        if (isHardLocked) {
            console.log("[handlePlayDomino] Action blocked: Hard Lock active");
            isProcessingMove.current = false;
            return;
        }

        if (gameState.currentPlayerId !== localPlayerId) {
            isProcessingMove.current = false;
            return;
        }

        try {
            // Store start position in ref for later use in executeMove
            if (startPos) {
                lastPlayStartPos.current = startPos;
            }

            const validMoves = getValidMoves([domino], {
                left: gameState.table.leftValue,
                right: gameState.table.rightValue
            });

            if (validMoves.length === 0) {
                console.log("[handlePlayDomino] Invalid move attempt");
                return;
            }

            // KILL SWITCH: valid manual move intent takes priority over overtime/bot
            clearAllTurnTimers();
            setOvertime(null);
            setIsBotPlaying(false);
            setIsHardLocked(false);
            setTimeLeft(null);

            if (validMoves.length > 1) {
                SoundManager.playSound('notify');
                setPendingDomino(domino);
                // RELEASE LOCK: Wait for user to choose a side
                isProcessingMove.current = false;
                return;
            }

            const move = validMoves[0];
            // executeMove will handle its own locking if needed, 
            // but here we already have the lock, so we use a flag or ensure it doesn't return
            await executeMove(domino, move.side === 'start' ? undefined : move.side, true);
        } catch (e) {
            console.error("[handlePlayDomino] Error:", e);
        } finally {
            // Only release if we're not waiting for pending side selection
            if (!pendingDomino) {
                isProcessingMove.current = false;
            }
        }
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

    const executeMove = async (domino: Domino, forcedSide?: 'left' | 'right', alreadyLocked = false) => {
        if (!alreadyLocked && isProcessingMove.current) return;
        if (!gameState) return;

        isProcessingMove.current = true;

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
                await safeUpdateGameState(gameId, newState);
            }
        } catch (e) {
            console.log("Invalid move", e);
            setHiddenDominoId(null); // Reset if error
        } finally {
            isProcessingMove.current = false;
        }
    };

    const handlePassTurn = async (forcedPlayerId?: PlayerId) => {
        isProcessingMove.current = true; // Turn-based Lock: Absolute priority to human

        SoundManager.unlockAudio();
        // ATOMIC GUARD
        if (!gameState || gameState.phase !== 'PLAYING' || isPaused) {
            console.log("[handlePassTurn] Action blocked by guard");
            isProcessingMove.current = false;
            return;
        }

        if (isHardLocked) {
            console.log("[handlePassTurn] Action blocked: Hard Lock active");
            isProcessingMove.current = false;
            return;
        }
        const targetId = forcedPlayerId || localPlayerId;
        const isHost = isLocalHost;
        const isTargetMe = targetId === localPlayerId;

        // Validation: Local mode always authorized, OR target player themselves, OR host in multiplayer
        const isAuthorized = isSoloMode || isTargetMe || isHost;
        if (!isAuthorized) {
            console.log("[handlePassTurn] Not authorized to pass for this player");
            isProcessingMove.current = false;
            return;
        }

        // Must be the target's turn
        if (gameState.currentPlayerId !== targetId) {
            console.log("[handlePassTurn] Not the target player's turn:", targetId);
            isProcessingMove.current = false;
            return;
        }

        try {
            // Safety timeout to release processing lock if something hangs
            const lockSafety = setTimeout(() => { isProcessingMove.current = false; }, 5000);

            // Double check validation client-side to prevent "Cannot Pass" alert loop
            const targetPlayer = gameState.players.find(p => p.id === targetId);
            const currentValidMoves = getValidMoves(targetPlayer?.hand || [], {
                left: gameState.table.leftValue,
                right: gameState.table.rightValue
            });

            if (currentValidMoves.length > 0) {
                isProcessingMove.current = false;
                clearTimeout(lockSafety);
                Alert.alert("Action impossible", "Vous avez des dominos jouables. Vous ne pouvez pas passer.");
                return;
            }

            // KILL SWITCH: confirmed manual pass cancels overtime/timers immediately
            clearAllTurnTimers();
            setOvertime(null);
            setIsBotPlaying(false);
            setIsHardLocked(false);
            setTimeLeft(null);

            const newState = passTurn(gameState, targetId);
            if (isSoloMode || !gameId) {
                setGameState(newState);
            } else {
                await safeUpdateGameState(gameId, newState);
            }
            clearTimeout(lockSafety);
        } catch (e: any) {
            console.error("Pass Error", e);
            Alert.alert("Cannot Pass", e.message);
        } finally {
            isProcessingMove.current = false;
        }
    };

    // AUTO-BOUDE LOGIC: When a player (you or bot) is blocked
    useEffect(() => {
        if (!gameState || gameState.phase !== 'PLAYING' || isPaused) return;

        const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
        if (!currentPlayer) return;

        // Check if player has valid moves
        const validMoves = getValidMoves(currentPlayer.hand, {
            left: gameState.table.leftValue,
            right: gameState.table.rightValue
        });

        const isPlayerBlocked = validMoves.length === 0;

        if (isPlayerBlocked && boudedPlayerId !== currentPlayer.id) {
            console.log(`[Auto-Boude] Player ${currentPlayer.name} (${currentPlayer.id}) is blocked!`);

            // Show overlay and play sound
            setBoudedPlayerId(currentPlayer.id);
            SoundManager.playSound('toktok');

            // Wait 2-3 seconds then pass automatically
            const isTargetMe = currentPlayer.id === localPlayerId;
            const timer = setTimeout(() => {
                // Only execute pass if we are still on the same player
                const freshState = gameStateRef.current;
                const isHost = isLocalHost;

                if (freshState && freshState.currentPlayerId === currentPlayer.id && freshState.phase === 'PLAYING') {
                    // Solo mode: simple
                    // Multiplayer: I can pass for myself, OR if I'm Host I can pass for anyone (Fallback)
                    if (isSoloMode || !gameId || isTargetMe || isHost) {
                        console.log(`[Auto-Boude] Executing pass for ${currentPlayer.name} (By ${isTargetMe ? 'Self' : 'Host'})`);
                        handlePassTurn(currentPlayer.id);
                    }
                }
                setBoudedPlayerId(null);
            }, isSoloMode ? 1000 : (isTargetMe ? 1500 : 3000)); // Solo mode is snappy (1s), Host waits longer (3s)

            return () => clearTimeout(timer);
        } else if (!isPlayerBlocked && boudedPlayerId === currentPlayer.id) {
            // Player is no longer blocked (shouldn't happen mid-turn normally but just in case)
            setBoudedPlayerId(null);
        }
    }, [gameState?.currentPlayerId, gameState?.phase, isPaused]);

    /**
     * Handles turn timeout for ANY player (local or remote).
     * Activates Auto-Play (Bot mode) for that player and plays their turn.
     */
    const handleTimeout = async (playerId?: PlayerId, alreadyLocked = false) => {
        // ABSOLUTE GUARD: Human action always has priority over bot takeover.
        if (isProcessingMove.current) {
            console.log("[Timeout] Cancelled: human action in progress");
            if (alreadyLocked) {
                const retryPlayerId = playerId ?? gameStateRef.current?.currentPlayerId;
                setTimeout(() => {
                    const freshState = gameStateRef.current;
                    if (!isProcessingMove.current && freshState?.phase === 'PLAYING' && retryPlayerId) {
                        void handleTimeoutRef.current(retryPlayerId, true);
                    }
                }, 150);
            }
            return;
        }

        const stateAtStart = gameStateRef.current ?? gameState;
        if (!stateAtStart || stateAtStart.phase !== 'PLAYING') return;

        const activeId = playerId || stateAtStart.currentPlayerId;
        if (!activeId) return;

        // CRITICAL FIX: Reset pending domino if player was choosing a side but timed out.
        setPendingDomino(null);

        if (alreadyLocked) {
            clearAllTurnTimers();
            setOvertime(null);
        }

        // Verify it's actually the active player's turn
        if (stateAtStart.currentPlayerId !== activeId) {
            console.log(`[Timeout] Ignore: ${activeId} is not current player (${stateAtStart.currentPlayerId})`);
            return;
        }

        const playerAtStart = stateAtStart.players.find(player => player.id === activeId);
        if (!playerAtStart) return;

        const isBot = playerAtStart.isBot;
        const isMe = activeId === localPlayerId;

        // AUTHORITY GUARD: Only handle if it's the local player OR a bot managed locally.
        if (!isMe && !isBot) {
            console.log(`[Timeout] Authority Guard: client will not auto-play for remote opponent ${activeId}`);
            return;
        }
        if (isBot && !isLocalHost && !isSoloMode && gameId) {
            // Bots are handled by host.
            return;
        }

        // COYOTE TIME: Delay bot action to allow last-second human clicks to complete.
        if (!alreadyLocked) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const freshState = gameStateRef.current;
        if (isProcessingMove.current || !freshState || freshState.phase !== 'PLAYING' || freshState.currentPlayerId !== activeId) {
            console.log("[Timeout] Cancelled after grace period (human move or turn change)");
            return;
        }

        const freshPlayer = freshState.players.find(player => player.id === activeId);
        if (!freshPlayer) return;

        isProcessingMove.current = true;
        clearAllTurnTimers();
        setTimeLeft(null);
        setOvertime(null);
        setIsHardLocked(true);
        setIsBotPlaying(true);

        try {
            console.log(`[Timeout] Turn timeout for ${activeId} - activating Auto-Play`);

            const validMoves = getValidMoves(freshPlayer.hand, {
                left: freshState.table.leftValue,
                right: freshState.table.rightValue
            });

            let validMove = null;
            if (validMoves.length > 0) {
                const sortedMoves = [...validMoves].sort((a, b) => (b.tile.left + b.tile.right) - (a.tile.left + a.tile.right));
                validMove = sortedMoves[0];
            }

            let newState: GameState;
            if (validMove) {
                console.log(`[Auto-Play] Playing heaviest domino for ${activeId}:`, validMove.tile);
                newState = handleTurn(freshState, activeId, validMove.tile, validMove.side === 'start' ? undefined : validMove.side);
                SoundManager.playClack();
            } else {
                console.log(`[Auto-Play] No valid moves for ${activeId} - passing`);
                newState = passTurn(freshState, activeId);
            }

            if (isSoloMode || !gameId) {
                setGameState(newState);
            } else {
                await safeUpdateGameState(gameId, newState);
            }
        } catch (e) {
            console.error("Auto-play processing failed:", e);
        } finally {
            isProcessingMove.current = false;
        }
    };
    handleTimeoutRef.current = handleTimeout;

    const handleReplay = async () => {
        console.log('[GameScreen] handleReplay called, isSoloMode:', isSoloMode);
        if (isSoloMode) {
            console.log('[GameScreen] Solo: Navigating to home');
            router.replace('/home');
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
        SoundManager.unlockAudio();
        if (!gameId) return;
        try {
            await voteForRematch(gameId, localPlayerId);
        } catch (e: any) {
            Alert.alert("Erreur", "Impossible de voter pour la revanche : " + e.message);
        }
    };

    const handleLeaveRoom = async () => {
        console.log('[GameScreen] handleLeaveRoom called, gameId:', gameId, 'isSolo:', isSoloMode);

        // Immediate exit for solo or no gameId
        if (isSoloMode || !gameId) {
            console.log('[GameScreen] Leaving immediate (Solo/NoID)');
            router.replace('/home');
            return;
        }

        try {
            console.log('[GameScreen] Leaving multiplayer room...');
            await leaveRoom(gameId, localPlayerId);
            router.replace('/home');
        } catch (e: any) {
            console.error("Error leaving room", e);
            router.replace('/home'); // Fallback exit
        }
    };

    const handleOverlayContinue = () => {
        if (!gameState) return;

        if (gameState.phase === 'MATCH_END') {
            if (isSoloMode) {
                // "Nouvelle partie" in solo: actually restart the game
                handleRestartMatch();
            } else {
                // Multiplayer: return to lobby or handle vote
                handleReplay();
            }
        } else if (gameState?.phase === 'BOUDE') {
            const { newState: resolvedState, isTie } = resolveBoude(gameState);

            if (isTie) {
                console.log('[Boude] TIE detected — restarting round without scoring');
                handleNextRound(resolvedState);
            } else {
                console.log(`[Boude] Winner resolved, new phase: ${resolvedState.phase}`);

                // If it's a manche end or match end, we MUST allow the overlay to show the new phase
                if (resolvedState.phase !== 'MATCH_END' && resolvedState.phase !== 'MANCHE_END') {
                    // Bypass storing PARTIE_END into the state to avoid the "victory screen" glitch
                    handleNextRound(resolvedState);
                } else {
                    if (isSoloMode || !gameId) {
                        setGameState(resolvedState);
                    } else {
                        safeUpdateGameState(gameId, resolvedState);
                    }
                }
            }
        } else {
            // Round / Manche End -> Go to next round/manche
            handleNextRound();
        }
    };

    const handleNextRound = (stateOverride?: GameState) => {
        const activeState = stateOverride || gameState;
        if (!activeState) return;

        const isMancheEnd = activeState.phase === 'MANCHE_END';

        // Get player names preserving their order
        const playerNames = activeState.players.map(p => p.name);
        const previousData = activeState.players.map(p => ({
            id: p.id,
            totalPoints: p.totalPoints,
            mancheWins: p.mancheWins,
            totalCochons: p.totalCochons,
            isBot: p.isBot
        }));

        // PRD: Double rule for Match start and EVERY new Manche start
        // Otherwise, winner of previous round starts.
        let winnerId = isMancheEnd ? null : activeState.firstPlayerOfRound;

        // Deal new game
        const partialState = dealGame(playerNames, activeState.startingHandSize || startingHandSize);
        const newPlayers = (partialState.players as Player[]).map((p, i) => {
            const originalPlayer = activeState.players[i];
            return {
                ...p,
                id: originalPlayer.id,
                currentMancheStars: isMancheEnd ? 0 : originalPlayer.currentMancheStars,
                isCochon: isMancheEnd ? false : originalPlayer.isCochon,
                mancheWins: originalPlayer.mancheWins,
                totalPoints: originalPlayer.totalPoints,
                totalCochons: originalPlayer.totalCochons,
                isBot: originalPlayer.isBot,
                avatarId: originalPlayer.avatarId
            };
        });

        // If no winner was determined (e.g. TIE or game start), use Double Rule
        if (!winnerId) {
            winnerId = determineFirstPlayer(newPlayers);
        }

        if (!winnerId) {
            console.error("Could not determine winner ID");
            return;
        }

        const newState: GameState = {
            ...activeState,
            gameId: activeState.gameId || gameId || 'local-' + Date.now(),
            players: newPlayers,
            talonMort: partialState.talonMort as Domino[],
            table: partialState.table!,
            currentPlayerId: winnerId,
            phase: 'PLAYING',
            firstPlayerOfRound: null,
            history: [],
            mancheResult: null, // RESET MANCHE RESULT
            lastActionTimestamp: Date.now(),
            roundNumber: isMancheEnd ? 1 : (activeState.roundNumber || 0) + 1,
            mancheNumber: isMancheEnd ? (activeState.mancheNumber || 1) + 1 : (activeState.mancheNumber || 1)
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
            safeUpdateGameState(gameId, newState).catch(err => console.error("Failed to update game state", err));
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
            // Reset processing lock on phase change to avoid hangs
            isProcessingMove.current = false;
            return;
        }

        const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);

        if (!currentPlayer?.isBot) {
            return; // Not a bot turn
        }

        // Only Host executes bot moves in multiplayer
        const isHost = isLocalHost;
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
                    // This case is now handled by Auto-Boude useEffect above for consistency
                    console.log(`[Bot Loop] ${freshPlayer.name} has no valid moves - useEffect will handle pass`);
                    isProcessingMove.current = false;
                    return;
                }

                // Update state
                if (isSoloMode || !gameId) {
                    setGameState(newState);
                } else {
                    updateGameState(gameId, newState);
                }

                isProcessingMove.current = false;

            } catch (e: any) {
                console.error("[Bot Error]", e.message);
                isProcessingMove.current = false;
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [gameState?.currentPlayerId, gameState?.phase, isPaused, isSoloMode, gameId, localPlayerId, roomData]);

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
            case 'SCORE': {
                // Points from previous manches only:
                // totalPoints = all cumulative points since game start
                // currentMancheStars = rounds won in current manche (each = +1 to totalPoints)
                // So: totalPoints - currentMancheStars = points from completed manches only
                const prevPoints = (player.totalPoints || 0) - (player.currentMancheStars || 0);
                return `${prevPoints} pts`;
            }
            case 'COCHON': return `${player.totalCochons} 🐷`;
            default: return "";
        }
    };




    return (
        <View style={styles.container} ref={rootRef as any} tabIndex={-1}>
            {/* Wrapper for inert when overlays are open */}
            <View
                style={{ flex: 1 }}
                {...({ inert: (Platform.OS === 'web' && (showScoreOverlay || isPaused || showRoomInfo)) ? true : undefined } as any)}
            >
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
                {/* Dynamic Background based on Theme - OVERRIDE for Traditional Premium as requested */}
                <LinearGradient
                    colors={['#0a2e0a', '#4a0e0e', '#000000']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                <StatusBar barStyle="light-content" translucent />


                {/* UNIFIED HEADER BAR - Regrouped and centered */}
                {gameState && gameState.phase === 'PLAYING' && (
                    <View style={[styles.unifiedHeader, { top: Math.max(insets.top, 10) }]}>
                        {/* Block 1: Game Mode + Objective */}
                        <View style={styles.headerBadge}>
                            <Text style={styles.headerText}>
                                {gameState.gameMode === 'MANCHE' ? '🏆 Manche' : gameState.gameMode === 'SCORE' ? '🎯 Score' : '🐷 Cochon'}
                                {' · Obj: '}
                                {gameState.gameMode === 'MANCHE'
                                    ? `${gameState.winningCondition} manche${gameState.winningCondition > 1 ? 's' : ''}`
                                    : gameState.gameMode === 'SCORE'
                                        ? `${gameState.winningCondition} pts`
                                        : `${gameState.winningCondition} cochon${gameState.winningCondition > 1 ? 's' : ''}`
                                }
                            </Text>
                        </View>

                        {/* Block 2: Manche + Round */}
                        <View style={styles.headerBadge}>
                            <Text style={styles.headerText}>
                                M{gameState.mancheNumber || 1} / R{gameState.roundNumber || 1}
                            </Text>
                        </View>

                        {/* Block 3: Controls Icons */}
                        <View style={styles.headerControls}>
                            {isSoloMode ? (
                                <TouchableOpacity
                                    onPress={() => setIsPaused(!isPaused)}
                                    activeOpacity={0.7}
                                    style={styles.controlBtn}
                                >
                                    <Ionicons name={isPaused ? "play" : "pause"} size={24} color="#FFD700" />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setShowRoomInfo(!showRoomInfo)}
                                    activeOpacity={0.7}
                                    style={styles.controlBtn}
                                >
                                    <Ionicons name="information-circle-outline" size={24} color="#FFD700" />
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                onPress={async () => {
                                    const newState = await SoundManager.toggleMute();
                                    setIsSoundEnabled(newState);
                                }}
                                activeOpacity={0.7}
                                style={styles.controlBtn}
                            >
                                <Ionicons name={isSoundEnabled ? "volume-high" : "volume-mute"} size={20} color="#FFD700" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push('/modal')}
                                activeOpacity={0.7}
                                style={styles.controlBtn}
                            >
                                <Ionicons name="settings-outline" size={20} color="#FFD700" />
                            </TouchableOpacity>

                            {Platform.OS === 'web' && (
                                <TouchableOpacity
                                    onPress={toggleFullscreen}
                                    activeOpacity={0.7}
                                    style={styles.controlBtn}
                                >
                                    <Ionicons name={isFullscreen ? "contract-outline" : "expand-outline"} size={20} color="#FFD700" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
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
                                isActive={gameState.currentPlayerId === opponents[0]?.id && gameState.phase === 'PLAYING'}
                                showTimer={gameState.currentPlayerId === opponents[0]?.id && !isGameOver && gameState.phase === 'PLAYING' && gameState.turnDuration > 0}
                                isPaused={isPaused}
                                timerDuration={gameState.turnDuration}
                                size={52}
                                layout="horizontal"
                                score={getPlayerScore(opponents[0])}
                                position="top-right"
                                isBoude={boudedPlayerId === opponents[0]?.id}
                                chatContent={playersChat[opponents[0]?.id]}
                                overtime={gameState.currentPlayerId === opponents[0]?.id ? overtime : null}
                                isBotPlaying={gameState.currentPlayerId === opponents[0]?.id ? isBotPlaying : false}
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
                                isActive={gameState.currentPlayerId === opponents[1]?.id && gameState.phase === 'PLAYING'}
                                showTimer={gameState.currentPlayerId === opponents[1]?.id && !isGameOver && gameState.phase === 'PLAYING' && gameState.turnDuration > 0}
                                isPaused={isPaused}
                                timerDuration={gameState.turnDuration}
                                size={52}
                                layout="horizontal"
                                score={getPlayerScore(opponents[1])}
                                position="top-left"
                                isBoude={boudedPlayerId === opponents[1]?.id}
                                chatContent={playersChat[opponents[1]?.id]}
                                overtime={gameState.currentPlayerId === opponents[1]?.id ? overtime : null}
                                isBotPlaying={gameState.currentPlayerId === opponents[1]?.id ? isBotPlaying : false}
                            />
                        </Animated.View>
                    )}

                    {/* Pass Button Area is now REMOVED for Auto-Boude logic */}

                    {/* BOTTOM LEFT: Local Player (Me) */}
                    {localPlayer && (
                        <Animated.View
                            ref={(el) => (avatarRefs.current[localPlayer.id] = el as any)}
                            entering={FadeInLeft.delay(600).duration(600)}
                            style={[styles.bottomLeftArea, { bottom: 20 + insets.bottom, left: 20 + insets.left }]}
                        >
                            <PlayerAvatar
                                player={localPlayer}
                                isActive={isMyTurn && gameState.phase === 'PLAYING'}
                                showTimer={isMyTurn && !isGameOver && gameState.phase === 'PLAYING' && gameState.turnDuration > 0}
                                isPaused={isPaused}
                                timerDuration={gameState.turnDuration}
                                size={60}
                                layout="horizontal"
                                score={getPlayerScore(localPlayer)}
                                position="bottom"
                                isBoude={boudedPlayerId === localPlayerId}
                                chatContent={playersChat[localPlayerId]}
                                overtime={isMyTurn ? overtime : null}
                                isBotPlaying={isMyTurn ? isBotPlaying : false}
                            />
                        </Animated.View>
                    )}
                </View>

                {/* Player Hand - HIGH Z-INDEX */}
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: insets.bottom, zIndex: 50 }}>
                    {localPlayer && (
                        <PlayerHand
                            hand={localPlayer.hand}
                            onPlayDomino={handlePlayDomino}
                            disabled={gameState.currentPlayerId !== localPlayerId || gameState.phase !== 'PLAYING' || bannerState !== 'NONE' || isHardLocked}
                            isLocked={isHardLocked}
                            leftValue={gameState.table.leftValue as any}
                            rightValue={gameState.table.rightValue as any}
                        />
                    )}
                </View>

                {/* QUICK CHAT UI */}
                {!isGameOver && (
                    <QuickChat
                        onSelectMessage={triggerLocalChat}
                        onSelectEmoji={triggerLocalChat}
                    />
                )}
            </View>

            {/* ROOM INFO CARD - Moved OUTSIDE the inert wrapper to maintain interactivity */}
            {!isSoloMode && gameId && showRoomInfo && (
                <Pressable
                    style={styles.infoBackdrop}
                    onPress={() => setShowRoomInfo(false)}
                >
                    <Pressable style={styles.infoCard} onPress={(e) => e.stopPropagation()}>
                        {/* Explicit Close Button (X) */}
                        <TouchableOpacity
                            onPress={() => setShowRoomInfo(false)}
                            style={styles.infoCardCloseBtn}
                        >
                            <Ionicons name="close" size={24} color="#FFD700" />
                        </TouchableOpacity>

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

                        {/* Game Objective & Mode Section */}
                        <View style={styles.infoCardDivider} />

                        {/* Line 1: Objective */}
                        <View style={styles.infoRow}>
                            <Ionicons name="star-outline" size={16} color="#FFD700" />
                            <Text style={styles.infoLabel}>Objectif : </Text>
                            <Text style={styles.infoValue}>
                                {gameState.gameMode === 'MANCHE'
                                    ? `${gameState.winningCondition} manche${gameState.winningCondition > 1 ? 's' : ''}`
                                    : gameState.gameMode === 'SCORE'
                                        ? `${gameState.winningCondition} points`
                                        : `${gameState.winningCondition} cochon${gameState.winningCondition > 1 ? 's' : ''}`
                                }
                            </Text>
                        </View>

                        {/* Line 2: Mode */}
                        <View style={[styles.infoRow, { marginTop: 10 }]}>
                            <Ionicons name="trophy-outline" size={16} color="#FFD700" />
                            <Text style={styles.infoLabel}>Mode de jeu : </Text>
                            <Text style={styles.infoValue}>
                                {gameState.gameMode === 'MANCHE' ? 'Manche' : gameState.gameMode === 'SCORE' ? 'Score' : 'Cochon'}
                            </Text>
                        </View>
                    </Pressable>
                </Pressable>
            )}

            {showScoreOverlay && gameState && (
                <UnifiedResultOverlay
                    gameState={gameState}
                    visible={showScoreOverlay}
                    currentUserId={localPlayerId}
                    onContinue={handleOverlayContinue}
                    onLeave={handleLeaveRoom}
                    isHost={isSoloMode || roomData?.createdBy === localPlayerId}
                />
            )}

            {/* ROUND BANNER */}
            {bannerState !== 'NONE' && gameState && (
                <Animated.View
                    key={bannerState}
                    entering={ZoomIn.duration(300)}
                    exiting={FadeOut.duration(300)}
                    style={styles.roundBannerContainer}
                    pointerEvents="none"
                >
                    <View style={styles.roundBanner}>
                        <Text style={styles.roundBannerText}>
                            {bannerState === 'MANCHE' ? `Manche N° ${gameState.mancheNumber || 1}` : `Round ${gameState.roundNumber || 1}`}
                        </Text>
                    </View>
                </Animated.View>
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
    unifiedHeader: {
        position: 'absolute',
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        zIndex: 100,
    },
    headerBadge: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.4)',
    },
    headerControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.4)',
        gap: 10,
    },
    headerText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    controlBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        zIndex: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoCard: {
        width: 300,
        backgroundColor: '#1E1E1E',
        borderRadius: 20,
        padding: 24,
        borderWidth: 2,
        borderColor: '#FFD700',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.6,
        shadowRadius: 25,
        elevation: 15,
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
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
        letterSpacing: 1.5,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoLabel: {
        color: '#AAA',
        fontSize: 13,
        marginLeft: 8,
    },
    infoValue: {
        color: '#FFD700',
        fontSize: 13,
        fontWeight: 'bold',
    },
    infoCardCloseBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        padding: 4,
    },
    roundBannerContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    roundBanner: {
        backgroundColor: '#2e7d32',
        paddingHorizontal: 40,
        paddingVertical: 14,
        borderRadius: 16,
        ...Platform.select({
            web: {
                boxShadow: '0px 6px 20px rgba(0,0,0,0.5)',
            },
            default: {
                elevation: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
            }
        }),
    },
    roundBannerText: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 2,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
});

