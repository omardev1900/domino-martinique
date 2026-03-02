import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

import { View, StyleSheet, Text, StatusBar, TouchableOpacity, Alert, SafeAreaView, useWindowDimensions, Image, Platform, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, FadeInLeft, FadeInRight, FadeIn, ZoomIn, FadeOut } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import { GameTable } from '../components/GameTable';
import { PlayerHand } from '../components/PlayerHand';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { GameHeader } from '../components/game/GameHeader';
import { GameOverlays } from '../components/game/GameOverlays';
import { PlayerArea } from '../components/game/PlayerArea';
import { ActionFooter } from '../components/game/ActionFooter';
import { LobbyScreen } from './LobbyScreen';
import { UnifiedResultOverlay } from '../components/UnifiedResultOverlay';

// Core
import { determineFirstPlayer, dealGameSolo, getForcedOpeningDominoId, dealGame } from '../core/LogicEngine';
import { getValidMoves } from '../core/DominoEngine';
import { GameState, Player, PlayerId, GamePhase, Domino, GameRoom, GameMode } from '@/core/types';
import { leaveRoom, startGame, clearRematchVotes, updatePlayerChat, resetRoomToLobby } from '../core/services/firebase';
import SoundManager from '../core/audio/SoundManager';
import HapticManager from '../core/audio/HapticManager';
import { HAND_SIZE } from '../core/constants';
import SettingsManager from '../core/SettingsManager';
import { TableTheme } from '../core/themes/tableThemes';
import { authService } from '../core/services/auth.service';
import { AVAILABLE_AVATARS, AvatarId } from '../core/avatars';
import { GameTableRef } from '../components/GameTable';
import { FlyingDomino } from '../components/FlyingDomino';
import { useConnectionStatus } from '../hooks/game/useConnectionStatus';
import { useGameSync } from '../hooks/game/useGameSync';
import { useGameTimers } from '../hooks/game/useGameTimers';
import { useGameEngine } from '../hooks/game/useGameEngine';

interface GameScreenProps {
    gameId?: string;
    userId?: string;
    mode?: 'solo' | 'multiplayer';
    difficulty?: 'easy' | 'medium' | 'expert' | 'legend' | 'valou_legend';
    gameMode?: GameMode;
    winningCondition?: number;
    turnDuration?: number;
    startingHandSize?: number;
}

export default function GameScreen({ gameId, userId, mode, difficulty, gameMode, winningCondition, turnDuration, startingHandSize: propStartingHandSize }: GameScreenProps) {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const isLandscape = width > height;
    const router = useRouter();
    const navigation = useNavigation();

    // -- 1. Basal State & Identity --
    const [localPlayerId] = useState<PlayerId>(userId || 'p1');
    const [isSoloMode] = useState(mode === 'solo');
    const [startingHandSize] = useState(propStartingHandSize || HAND_SIZE);

    // -- 2. Connection Status --
    const { isRejoining, signalPlayerOnline, signalPlayerOffline } = useConnectionStatus({ gameId, localPlayerId, isSoloMode });

    // Rage Quit / Tab Close Web Security (Déplacé ici car GameScreen est le point de montage principal)
    useEffect(() => {
        if (Platform.OS !== 'web' || isSoloMode || !gameId) return;
        const handleBeforeUnload = () => { signalPlayerOffline(); };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [gameId, isSoloMode, signalPlayerOffline]);

    // -- 3. Sync Hook (Network & Reconnection) --
    const {
        gameState,
        roomData,
        isStarting,
        setIsStarting,
        safeUpdateGameState,
        setGameState,
        setRoomData
    } = useGameSync({ gameId, localPlayerId, isSoloMode, signalPlayerOnline });

    const [timeLeftState, setTimeLeftState] = useState<number | null>(null);
    const [overtimeState, setOvertimeState] = useState<number | null>(null);

    const isLocalHost = isSoloMode || (roomData?.players[0]?.uid === localPlayerId);

    let handleTimeoutCb = (pId: string) => {
        // Will be wired to the engine
    };

    // -- 4. Timer Hook --
    const {
        timeLeft,
        setTimeLeft,
        overtime,
        setOvertime,
        clearAllTurnTimers
    } = useGameTimers({
        gameState,
        isPaused: false,
        localPlayerId,
        onTimeout: (pId, turnId) => handleTimeoutCb(pId)
    });

    // -- 5. The Façade Game Engine --
    const onTilePlayedEffect = (tile: Domino) => {
        if (!gameState?.currentPlayerId) return;
        const pId = gameState.currentPlayerId;
        const avatarRef = avatarRefs.current[pId];
        if (avatarRef) {
            avatarRef.measure((_x, _y, _width, _height, pageX, pageY) => {
                lastPlayStartPos.current = { x: pageX, y: pageY };
                setHiddenDominoId(tile.id);
            });
        }
    };

    const handleReplay = async () => {
        if (isSoloMode) {
            router.replace('/home');
            return;
        }

        if (gameId && roomData) {
            const isHost = roomData.players[0].uid === localPlayerId;
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
        }
    };

    const {
        dispatch,
        handlePlayDomino,
        confirmSidePlay,
        handlePassTurn,
        handleTimeout,
        handleOverlayContinue,
        pendingDomino,
        isProcessingMove
    } = useGameEngine({
        gameState,
        localPlayerId,
        isSoloMode,
        gameId,
        isPaused: false,
        isLocalHost,
        roomData,
        userId,
        startingHandSize,
        safeUpdateGameState,
        setGameState,
        clearAllTurnTimers,
        setOvertime,
        setTimeLeft,
        onTilePlayed: onTilePlayedEffect,
        onReplay: handleReplay
    });

    // Wire the timer timeout cb directly to the returned handleTimeout function
    useEffect(() => {
        handleTimeoutRef.current = handleTimeout;
    }, [handleTimeout]);
    const handleTimeoutRef = useRef(handleTimeout);
    handleTimeoutCb = (pId: string) => handleTimeoutRef.current(pId);


    // -- 5. UI State remaining --
    const [showRoomInfo, setShowRoomInfo] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [tableTheme, setTableTheme] = useState<TableTheme>('classic');
    const [showScoreboard, setShowScoreboard] = useState(false);
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [bannerState, setBannerState] = useState<'NONE' | 'MANCHE' | 'ROUND'>('NONE');
    const [playersChat, setPlayersChat] = useState<{ [playerId: string]: string | null }>({});
    const chatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastChatTimeRef = useRef<number>(0);
    const gameStateRef = useRef<GameState | null>(null);

    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // --- CHAT LOGIC ---
    const triggerLocalChat = useCallback(async (content: string) => {
        if (!gameId || isSoloMode) {
            // Local echo for solo
            setPlayersChat(prev => ({ ...prev, [localPlayerId]: content }));
            setTimeout(() => setPlayersChat(prev => ({ ...prev, [localPlayerId]: null })), 5000);
            return;
        }
        const now = Date.now();
        if (now - lastChatTimeRef.current < 2000) return; // Rate limit
        lastChatTimeRef.current = now;

        try {
            await updatePlayerChat(gameId, localPlayerId, content);
            setPlayersChat(prev => ({ ...prev, [localPlayerId]: content }));
            setTimeout(() => {
                setPlayersChat(prev => ({ ...prev, [localPlayerId]: null }));
            }, 5000);
        } catch (e) {
            console.error("Chat error", e);
        }
    }, [gameId, isSoloMode, localPlayerId]);

    const triggerOpponentChat = useCallback((pId: string, content: string) => {
        setPlayersChat(prev => ({ ...prev, [pId]: content }));
        setTimeout(() => {
            setPlayersChat(prev => ({ ...prev, [pId]: null }));
        }, 5000);
    }, []);

    // Fullscreen API (web only)
    useEffect(() => {
        if (Platform.OS !== 'web') return;
        const handleChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleChange);
        return () => document.removeEventListener('fullscreenchange', handleChange);
    }, []);

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
    const processedBotTurnRef = useRef<string | null>(null);
    const lastSeenChatTimestamps = useRef<{ [playerId: string]: number }>({});

    // -- 6. Derived State & Layout --
    const localPlayer = gameState?.players.find(p => p.id === localPlayerId);
    const isMyTurn = gameState?.currentPlayerId === localPlayerId;
    const isGameOver = gameState?.phase === 'MATCH_END' || gameState?.phase === 'MANCHE_END' || gameState?.phase === 'PARTIE_END' || gameState?.phase === 'BOUDE';
    const showScoreOverlay = isGameOver && showScoreboard;

    const [playerDisplayName, setPlayerDisplayName] = useState<string>('Moi');
    const [playerAvatarId, setPlayerAvatarId] = useState<string | undefined>('avatar_01');
    const [profileLoaded, setProfileLoaded] = useState(false);

    useEffect(() => {
        if (Platform.OS === 'web' && !showScoreOverlay && !showRoomInfo && !isPaused) {
            (rootRef.current as any)?.focus?.();
        }
    }, [showScoreOverlay, showRoomInfo, isPaused]);

    // Load saved table theme and player profile
    useFocusEffect(
        useCallback(() => {
            const loadSettings = async () => {
                const settings = SettingsManager.getSettings();
                setTableTheme(settings.tableTheme);
                setIsSoundEnabled(settings.isSfxEnabled);

                if (isSoloMode) {
                    try {
                        const profile = await authService.refreshUserFromStorage();
                        if (profile) {
                            setPlayerDisplayName(profile.displayName || 'Moi');
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

    // Automatically show scoreboard when a round/manche/match ends or game is blocked
    useEffect(() => {
        if (!gameState) return;
        const endPhases: GamePhase[] = ['PARTIE_END', 'MANCHE_END', 'MATCH_END', 'BOUDE'];
        setShowScoreboard(endPhases.includes(gameState.phase));
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
            // Handle offline/local fallback
            return;
        }

        // Multiplayer loading...
        // useGameSync handles the subscription internally now, but if we need a custom one for chat:
        // Actually, triggerOpponentChat logic can be moved into useGameSync or a dedicated effect here
    }, [gameId, isSoloMode, profileLoaded]);

    const forcedOpeningDominoId = useMemo(() => {
        if (!gameState) return null;
        return getForcedOpeningDominoId(gameState, localPlayerId);
    }, [gameState, localPlayerId]);

    // Check if player has ANY playable domino (NEW: Before early return for hooks safety)
    const canPlayAny = useMemo(() => {
        if (!gameState) return false;
        const localPlayer = gameState.players.find(p => p.id === localPlayerId);
        if (!localPlayer) return false;
        let moves = getValidMoves(localPlayer.hand, {
            left: gameState.table.leftValue,
            right: gameState.table.rightValue
        });
        if (forcedOpeningDominoId) {
            moves = moves.filter(move => move.tile.id === forcedOpeningDominoId);
        }
        return moves.length > 0;
    }, [gameState?.players, gameState?.table.leftValue, gameState?.table.rightValue, localPlayerId, forcedOpeningDominoId]);


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
    const getBotsForDifficulty = (diff: 'easy' | 'medium' | 'expert' | 'legend' | 'valou_legend') => {
        const configs = [
            { name: 'Bot 1', avatarId: 'avatar_02', difficulty: diff },
            { name: 'Bot 2', avatarId: 'avatar_03', difficulty: diff },
            { name: 'Bot 3', avatarId: 'avatar_04', difficulty: diff }
        ];
        return configs;
    };

    const startSoloGame = useCallback(async () => {
        if (isStarting) return;
        setIsStarting(true);
        try {
            const botDifficulty = (difficulty || 'medium') as any;
            const botConfigs = getBotsForDifficulty(botDifficulty);
            const playerNames = [playerDisplayName, ...botConfigs.map(b => b.name)];

            const fullState = dealGameSolo(
                localPlayerId,
                playerDisplayName,
                playerAvatarId as string,
                botDifficulty,
                startingHandSize || 7
            ) as GameState;

            // Configure local player and bots avatars
            fullState.players[0].avatarId = playerAvatarId as AvatarId;
            fullState.players[1].avatarId = botConfigs[0].avatarId as AvatarId;
            fullState.players[1].difficulty = botDifficulty;
            if (fullState.players.length > 2) {
                fullState.players[2].avatarId = botConfigs[1].avatarId as AvatarId;
                fullState.players[2].difficulty = botDifficulty;
            }

            // Mettre en place le moteur de la partie
            fullState.currentPlayerId = determineFirstPlayer(fullState.players);
            fullState.gameMode = gameMode || 'MANCHE';
            fullState.winningCondition = winningCondition || 3;
            fullState.turnDuration = turnDuration || 15;
            fullState.gameId = gameId || `solo-${Date.now()}`;
            fullState.roundNumber = 1;
            fullState.mancheNumber = 1;

            // ✅ FIX CRITIQUE: dealGameSolo retourne un Partial<GameState>.
            // Ces champs sont absents du retour de la fonction mais REQUIS par handleTurn.
            // Sans eux, newState.history.push() crash au premier coup joué.
            if (!fullState.history) fullState.history = [];
            if (!fullState.firstPlayerOfRound) fullState.firstPlayerOfRound = null;
            if (!fullState.mancheResult) fullState.mancheResult = null;
            if (!fullState.startingHandSize) fullState.startingHandSize = startingHandSize || 7;
            if (!fullState.talonMort) fullState.talonMort = [];

            setGameState(fullState);
        } catch (error) {
            console.error('Error starting solo game:', error);
            Alert.alert('Error', 'Failed to start local game');
        } finally {
            setIsStarting(false);
        }
    }, [isStarting, difficulty, playerDisplayName, gameMode, winningCondition, turnDuration, startingHandSize, playerAvatarId, setGameState, setIsStarting]);

    // Multiplayer Start Handler
    const handleStartGame = async () => {
        SoundManager.unlockAudio();
        if (!gameId || !roomData) return;
        setIsStarting(true);

        try {
            const playerNames = roomData.players.map(p => p.displayName);
            const botConfigs = getBotsForDifficulty(roomData.difficulty || 'medium');
            let botIndex = 0;

            while (playerNames.length < 3) {
                if (botIndex < botConfigs.length) {
                    playerNames.push(botConfigs[botIndex].name);
                    botIndex++;
                } else {
                    playerNames.push(`Bot ${playerNames.length}`);
                }
            }

            const fullState = dealGame(
                playerNames,
                roomData.startingHandSize || 7
            ) as GameState;

            // Apply room settings manually to the partial state if needed
            fullState.gameMode = roomData.gameMode || 'MANCHE';
            fullState.winningCondition = roomData.winningCondition || 3;
            fullState.turnDuration = roomData.turnDuration || 15;
            fullState.gameId = gameId; // Ensure gameId is present

            // Re-assign IDs to actual UIDs for real players, and configure Bots
            fullState.players = fullState.players.map((p, i) => {
                if (i < roomData.players.length) {
                    const uid = roomData.players[i].uid;
                    return {
                        ...p,
                        id: uid,
                        avatarId: roomData.players[i].avatarId || 'avatar_default',
                        isDisconnected: false,
                        isBot: false
                    };
                } else {
                    const relativeBotIdx = i - roomData.players.length;
                    const config = botConfigs[relativeBotIdx] || botConfigs[0];
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

            fullState.currentPlayerId = determineFirstPlayer(fullState.players);
            await safeUpdateGameState(gameId, fullState);

        } catch (error) {
            console.error("Failed to start game:", error);
            Alert.alert("Error", "Could not start game");
            setIsStarting(false);
        }
    };


    // --- BOT LOGIC HANDLING ---
    // The "Industrial" bot loop (lines 1200+) handles all bot moves consistently.

    // -------------------------------------------------------------------------
    // HELPERS & ACTIONS (UI-ONLY)
    // -------------------------------------------------------------------------

    const handleLeaveRoom = async () => {
        AsyncStorage.removeItem('active_roomId').catch(console.error);
        if (isSoloMode || !gameId) {
            router.replace('/home');
            return;
        }
        try {
            await leaveRoom(gameId, localPlayerId);
            router.replace('/home');
        } catch (e: any) {
            console.error("Error leaving room", e);
            router.replace('/home');
        }
    };

    // -- 7. Action Handlers (Delegated) --
    // These are already extracted into useGameEngine and useGameSync

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
            <View
                style={{ flex: 1 }}
                {...({ inert: (Platform.OS === 'web' && (showScoreOverlay || isPaused || showRoomInfo)) ? true : undefined } as any)}
            >
                <LinearGradient
                    colors={['#0a2e0a', '#4a0e0e', '#000000']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                <StatusBar barStyle="light-content" translucent />

                <GameHeader
                    gameState={gameState}
                    insets={insets}
                    isSoloMode={isSoloMode}
                    isPaused={isPaused}
                    onTogglePause={() => setIsPaused(!isPaused)}
                    showRoomInfo={showRoomInfo}
                    onToggleRoomInfo={() => setShowRoomInfo(!showRoomInfo)}
                    isSoundEnabled={isSoundEnabled}
                    onToggleSound={async () => {
                        const newState = await SoundManager.toggleMute();
                        setIsSoundEnabled(newState);
                    }}
                    onOpenSettings={() => router.push('/modal')}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={toggleFullscreen}
                />

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

                <PlayerArea
                    opponents={opponents}
                    localPlayer={localPlayer as any}
                    gameState={gameState}
                    localPlayerId={localPlayerId}
                    boudedPlayerId={null}
                    playersChat={playersChat as any}
                    overtime={overtime}
                    isBotPlaying={isProcessingMove}
                    isPaused={isPaused}
                    insets={insets}
                    avatarRefs={avatarRefs}
                    getPlayerScore={getPlayerScore as any}
                />

                {/* QUICK CHAT UI */}
                {!isGameOver && (
                    <QuickChat
                        onSelectMessage={triggerLocalChat}
                        onSelectEmoji={triggerLocalChat}
                    />
                )}
            </View>

            <ActionFooter
                localPlayer={localPlayer as any}
                gameState={gameState}
                localPlayerId={localPlayerId}
                bannerState={bannerState}
                forcedOpeningDominoId={forcedOpeningDominoId}
                insets={insets}
                onPlayDomino={handlePlayDomino}
            />

            <GameOverlays
                gameState={gameState}
                pendingDomino={pendingDomino}
                isLandscape={isLandscape}
                insets={insets}
                isSoloMode={isSoloMode}
                gameId={gameId}
                showRoomInfo={showRoomInfo}
                onCloseRoomInfo={() => setShowRoomInfo(false)}
                showScoreOverlay={showScoreOverlay}
                localPlayerId={localPlayerId}
                onOverlayContinue={handleOverlayContinue}
                onLeaveRoom={handleLeaveRoom}
                roomData={roomData}
                bannerState={bannerState}
                isPaused={isPaused}
                onResume={() => setIsPaused(false)}
            />

            {/* ✅ FIX ANTI-ZOMBIE: Overlay temporaire pendant la reprise */}
            {isRejoining && (
                <View style={[StyleSheet.absoluteFillObject, { zIndex: 999 }]}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: '#FFD700', fontSize: 24, fontWeight: 'bold' }}>Reprise de la connexion...</Text>
                    </View>
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
    text: { color: 'white' }
});

