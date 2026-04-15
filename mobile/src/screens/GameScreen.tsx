import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

import { View, StyleSheet, Text, StatusBar, TouchableOpacity, Alert, SafeAreaView, useWindowDimensions, Image, Platform, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, FadeInLeft, FadeInRight, FadeIn, ZoomIn, FadeOut, FadeInUp } from 'react-native-reanimated';
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
import { QuickChat } from '../components/QuickChat';
import { RoundResultCard } from '../components/game/RoundResultCard';

// Core
import { determineFirstPlayer, dealGameSolo, getForcedOpeningDominoId, dealGame } from '../core/LogicEngine';
import { getValidMoves } from '../core/DominoEngine';
import { GameState, Player, PlayerId, GamePhase, Domino, GameRoom, GameMode } from '@/core/types';
import { leaveRoom, startGame, clearRematchVotes, updatePlayerChat, resetRoomToLobby, markPlayerAsDebited, markRoomAsFinished } from '../core/services/firebase';
import SoundManager from '../core/audio/SoundManager';
import HapticManager from '../core/audio/HapticManager';
import { HAND_SIZE } from '../core/constants';
import SettingsManager from '../core/SettingsManager';
import { TableTheme } from '../core/themes/tableThemes';
import { authService } from '../core/services/auth.service';
import { AVAILABLE_AVATARS, AvatarId } from '../core/avatars';
import { GameTableRef } from '../components/GameTable';
import { FlyingDominoData } from '../core/animations/AnimationTypes';
import { FlyingDomino } from '../components/FlyingDomino';
import { useConnectionStatus } from '../hooks/game/useConnectionStatus';
import { useGameSync } from '../hooks/game/useGameSync';
import { useGameTimers } from '../hooks/game/useGameTimers';
import { useGameEngine } from '../hooks/game/useGameEngine';
import { statsService } from '../core/services/stats.service';
import { economyService } from '../core/services/economy.service';
import { storeService } from '../core/services/store.service';
import { botService } from '../core/services/bot.service';
import { RewardEngine } from '../core/RewardEngine';
import { MatchReward, TableTier } from '../core/economy.types';
import { TABLE_CONFIGS } from '../core/economy.constants';
import { SkinConfig } from '../core/store.types';

interface GameScreenProps {
    gameId?: string;
    userId?: string;
    mode?: 'solo' | 'multiplayer';
    difficulty?: 'TI_MANMAY' | 'MAPIPI' | 'GRAN_MOUN';
    gameMode?: GameMode;
    winningCondition?: number;
    turnDuration?: number;
    startingHandSize?: number;
    tableTier?: string; // TableTier passé depuis solo.tsx / lobby.tsx
}

export default function GameScreen({ gameId, userId, mode, difficulty, gameMode, winningCondition, turnDuration, startingHandSize: propStartingHandSize, tableTier: propTableTier }: GameScreenProps) {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const isLandscape = width > height;
    const router = useRouter();
    const navigation = useNavigation();

    // -- 1. Basal State & Identity --
    const [localPlayerId] = useState<PlayerId>(userId || 'p1');
    const [isSoloMode] = useState(mode === 'solo');
    const [startingHandSize] = useState(propStartingHandSize || HAND_SIZE);
    const [activeTableTier] = useState<TableTier>((propTableTier as TableTier) || 'DEBUTANT');

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

    const hasBeenDebited = useRef(false);
    const [debitFeedback, setDebitFeedback] = useState<string | null>(null);
    const isIntentionalLeave = useRef(false);

    const isLocalHost = isSoloMode || (roomData?.createdBy === localPlayerId);

    const [isPaused, setIsPaused] = useState(false);

    let handleTimeoutCb = (pId: string, turnId?: number) => {
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
        isPaused,
        localPlayerId,
        onTimeout: (pId, turnId) => handleTimeoutCb(pId, turnId)
    });

    // -- 5. The Façade Game Engine --
    const onTilePlayedEffect = (tile: Domino) => {
        // RADICAL: Animation de vol supprimée
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
                // Non-hôte : quitter directement sans bloquer
                handleLeaveRoom();
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
        isProcessingMove,
        visualBoudePlayerId
    } = useGameEngine({
        gameState,
        localPlayerId,
        isSoloMode,
        gameId,
        isPaused,
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
    const [tableTheme, setTableTheme] = useState<TableTheme>('classic');
    const [showScoreboard, setShowScoreboard] = useState(false);
    const [showRoundResult, setShowRoundResult] = useState(false);
    const [isSoundEnabled, setIsSoundEnabled] = useState(() => SettingsManager.getSettings().isSfxEnabled);
    const [isVibrationEnabled, setIsVibrationEnabled] = useState(() => SettingsManager.getSettings().isVibrationEnabled);
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

    // Synchronise les messages chat des adversaires depuis Firebase
    useEffect(() => {
        if (!roomData?.quickChats || isSoloMode) return;

        if (isFirstChatLoad.current) {
            // Premier chargement: on marque tous les messages actuels comme "vus" silencieusement
            Object.entries(roomData.quickChats).forEach(([pId, chatData]) => {
                if (chatData) {
                    lastSeenChatNonces.current[pId] = chatData.nonce || String(chatData.timestamp);
                }
            });
            isFirstChatLoad.current = false;
            return;
        }

        Object.entries(roomData.quickChats).forEach(([pId, chatData]) => {
            if (pId === localPlayerId) return;
            if (!chatData?.content) return;

            const currentNonce = chatData.nonce || String(chatData.timestamp);
            const lastSeen = lastSeenChatNonces.current[pId];

            if (currentNonce !== lastSeen) {
                lastSeenChatNonces.current[pId] = currentNonce;
                triggerOpponentChat(pId, chatData.content);
            }
        });
    }, [roomData?.quickChats]);
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
    const lastSeenChatNonces = useRef<{ [playerId: string]: string }>({});
    const isFirstChatLoad = useRef<boolean>(true);
    const prevMancheRef = useRef<number>(1);
    // Tracks whether current PARTIE_END came from a BOUDE (to skip re-showing the card)
    const boudeHandledRef = useRef(false);

    // -- 6. Derived State & Layout --
    const localPlayer = gameState?.players.find(p => p.id === localPlayerId);
    const isMyTurn = gameState?.currentPlayerId === localPlayerId;
    // isGameOver : logique UI générale (header, PlayerArea, QuickChat...)
    const isGameOver = gameState?.phase === 'MATCH_END' || gameState?.phase === 'MANCHE_END'
        || gameState?.phase === 'PARTIE_END' || gameState?.phase === 'BOUDE';
    // showScoreOverlay : uniquement MANCHE_END / MATCH_END — PARTIE_END est géré par RoundResultCard + auto-continue
    const showScoreOverlay = (gameState?.phase === 'MANCHE_END' || gameState?.phase === 'MATCH_END') && (showScoreboard || gameState?.phase === 'MATCH_END');

    const [playerDisplayName, setPlayerDisplayName] = useState<string>('Moi');
    const [playerAvatarId, setPlayerAvatarId] = useState<string | undefined>('avatar_01');
    const [playerSkinId, setPlayerSkinId] = useState<string | undefined>(undefined);
    const [playerSkinConfig, setPlayerSkinConfig] = useState<SkinConfig | undefined>(undefined);
    const [profileLoaded, setProfileLoaded] = useState(false);
    const statsRecordedRef = useRef(false);
    const [matchReward, setMatchReward] = useState<MatchReward | null>(null);
    const [showRewardOverlay, setShowRewardOverlay] = useState(false);
    const playerEconomyRef = useRef<{ level: number; xp: number; leaguePoints: number; cochonsGiven?: number; unlockedFrames?: any[] }>({ level: 1, xp: 0, leaguePoints: 0 });

    // Load economy on mount
    useEffect(() => {
        economyService.getEconomy().then(eco => {
            playerEconomyRef.current = {
                level: eco.level,
                xp: eco.xp,
                leaguePoints: eco.leaguePoints,
                cochonsGiven: eco.cochonsGiven,
                unlockedFrames: eco.unlockedFrames,
            };
        }).catch(console.error);
    }, []);

    // -- stats & economy recording effect --
    // Mark room as FINISHED when match ends (Multiplayer only)
    useEffect(() => {
        if (!isSoloMode && gameId && isLocalHost && gameState?.phase === 'MATCH_END') {
            console.log(`[GameScreen] Match ended, marking room ${gameId} as FINISHED`);
            markRoomAsFinished(gameId).catch(err => {
                console.error("Error marking room as finished", err);
            });
        }
    }, [gameState?.phase, isSoloMode, gameId, isLocalHost]);

    useEffect(() => {
        if (gameState?.phase === 'MATCH_END' && !statsRecordedRef.current) {
            const localPlayer = gameState.players.find(p => p.id === localPlayerId);
            if (localPlayer) {
                // Determine Match Winner
                const sorted = [...gameState.players].sort((a, b) => {
                    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
                    if (b.totalCochons !== a.totalCochons) return b.totalCochons - a.totalCochons;
                    return b.mancheWins - a.mancheWins;
                });

                const winner = sorted[0];
                const result = winner.id === localPlayerId ? 'WIN' : 'LOSS';

                const opponentsData = gameState.players
                    .filter(p => p.id !== localPlayerId)
                    .map(p => ({ name: p.name, avatarId: p.avatarId || 'avatar_default' }));

                const processMatchEnd = async () => {
                    try {
                        // 1. Calculate & apply economy rewards (new system) FIRST
                        const rewardInput = RewardEngine.buildInputFromGameState({
                            gameState,
                            localPlayerId,
                            currentLevel: playerEconomyRef.current.level,
                            currentXP: playerEconomyRef.current.xp,
                            currentLeaguePoints: playerEconomyRef.current.leaguePoints,
                            currentCochonsGiven: playerEconomyRef.current.cochonsGiven || 0,
                            unlockedFrames: playerEconomyRef.current.unlockedFrames || [],
                            tableTier: activeTableTier,
                            isSoloMode,
                        });

                        // ✅ Exécution sécurisée côté serveur (Backend Banker)
                        const reward = await economyService.processServerReward(rewardInput, userId);
                        setMatchReward(reward);
                        console.log('💰 [GameScreen] Server Economy rewards applied:', {
                            coins: reward.coinsEarned,
                            xp: reward.xpEarned,
                            leveledUp: reward.leveledUp,
                            gradeUp: reward.gradeUp,
                        });

                        // 2. Record basic match stats ONLY IF economy succeeds
                        // ✅ FIX [2026-04-15]: Use totalCochonsInfliges (cochons GIVEN to opponents, permanent counter)
                        // instead of totalCochons which was ambiguous and mapped to cochons RECEIVED (malus).
                        await statsService.recordMatchResult({
                            result,
                            cochons: localPlayer.totalCochonsInfliges || 0,
                            points: localPlayer.totalPoints || 0,
                            opponents: opponentsData,
                            mode: isSoloMode ? 'SOLO' : 'MULTIPLAYER',
                            userId: userId
                        });
                    } catch (err) {
                        console.error('❌ [GameScreen] Match end processing failed:', err);
                    }
                };

                processMatchEnd();
                statsRecordedRef.current = true;
            }
        } else if (gameState?.phase !== 'MATCH_END' && gameState?.phase !== 'MANCHE_END') {
            statsRecordedRef.current = false;
            setMatchReward(null); // Reset pour la prochaine partie
        }
    }, [gameState?.phase, localPlayerId, isSoloMode, userId]);

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
                            const avatar = profile.avatarUrl || profile.avatarId;
                            if (avatar) {
                                setPlayerAvatarId(avatar);
                            } else {
                                setPlayerAvatarId('avatar_default');
                            }
                        }
                    } catch (error) {
                        console.error('Error loading profile:', error);
                    }
                }

                // Load cosmetics like skin for both solo and multiplayer
                try {
                    const inventory = await storeService.getInventory();
                    if (inventory?.equipped?.skin) {
                        const skinIdToLoad = inventory.equipped.skin;
                        setPlayerSkinId(skinIdToLoad);

                        // Fetch catalog to get the config for the equipped skin
                        const catalog = await storeService.getCatalog();
                        const equippedSkinItem = catalog.find(item => item.id === skinIdToLoad);
                        if (equippedSkinItem && equippedSkinItem.skinConfig) {
                            setPlayerSkinConfig(equippedSkinItem.skinConfig);
                        }
                    }
                } catch (e) {
                    console.error('Error loading inventory cosmetics', e);
                }

                setProfileLoaded(true);
            };
            loadSettings();
        }, [isSoloMode])
    );

    // Gestion des fins de round / manche / match
    // Ref stable vers handleOverlayContinue (disponible dès useGameEngine, avant ce point)
    // Pour PARTIE_END : l'intercept ne fait qu'appeler handleOverlayContinue (la branche récompenses est MATCH_END only)
    const partieEndContinueRef = useRef(handleOverlayContinue);
    useEffect(() => { partieEndContinueRef.current = handleOverlayContinue; }, [handleOverlayContinue]);

    useEffect(() => {
        if (!gameState) return;

        // ── Garde catch-all : si BOUDE a été affiché mais PARTIE_END a été skippé
        // (Firestore peut livrer BOUDE → PLAYING directement en multiplayer)
        // IMPORTANT : ne pas retourner early pour MANCHE_END/MATCH_END — laisser
        // leurs handlers ci-dessous s'exécuter (BOUDE peut résoudre directement en MANCHE_END).
        if (boudeHandledRef.current && gameState.phase !== 'BOUDE' && gameState.phase !== 'PARTIE_END') {
            boudeHandledRef.current = false;
            setShowRoundResult(false);
            if (gameState.phase !== 'MANCHE_END' && gameState.phase !== 'MATCH_END') {
                return;
            }
        }

        if (gameState.phase === 'BOUDE' && !showRoundResult) {
            // Partie bloquée : card immédiate 3.5s, host résout BOUDE au bout
            boudeHandledRef.current = true;
            setShowRoundResult(true);
            if (isLocalHost) {
                // Host : on résout soi-même après 5s (annule le timer 6s séparé)
                const timer = setTimeout(() => {
                    setShowRoundResult(false);
                    partieEndContinueRef.current(); // resolveBoude → PARTIE_END
                }, 5000);
                return () => clearTimeout(timer);
            }
            // Non-host : attend PARTIE_END via Firestore (timer 5s du host)
            return;
        }

        if (gameState.phase === 'PARTIE_END') {
            if (boudeHandledRef.current) {
                // Vient de BOUDE : card déjà montrée, avancer directement sans re-afficher
                boudeHandledRef.current = false;
                setShowRoundResult(false);
                partieEndContinueRef.current(); // computeNextRoundState → PLAYING/MANCHE_END
                return;
            }
            // PARTIE_END classique (victoire normale)
            setShowRoundResult(true);
            const timer = setTimeout(() => {
                setShowRoundResult(false);
                partieEndContinueRef.current();
            }, 5000);
            return () => clearTimeout(timer);
        }

        if (gameState.phase === 'MANCHE_END' || gameState.phase === 'MATCH_END') {
            // Fin de manche/match : RoundResultCard 5s, PUIS UnifiedResultOverlay
            setShowRoundResult(true);
            const timer = setTimeout(() => {
                setShowRoundResult(false);
                setShowScoreboard(true);
            }, 5000);
            return () => {
                clearTimeout(timer);
                if (gameState.phase === 'MATCH_END') {
                     // Ensure scoreboard shows if component unmounts or phase changes abruptly
                     setShowScoreboard(true); 
                }
            };
        }
    }, [gameState?.phase, isLocalHost]);

    // Handle BOUDE phase: fallback automatique 5s si le timer 3.5s n'a pas résolu (Host only)
    // Utilise partieEndContinueRef (stable) plutôt que handleOverlayContinue directement
    // pour éviter de recréer ce useEffect à chaque render.
    useEffect(() => {
        if (gameState?.phase === 'BOUDE' && isLocalHost) {
            const timer = setTimeout(() => {
                partieEndContinueRef.current();
            }, 6000);
            return () => clearTimeout(timer);
        }
    }, [gameState?.phase, isLocalHost]);

    // Auto-redirect non-hôtes quand l'hôte reset la room après le match
    useEffect(() => {
        if (isSoloMode || isLocalHost) return;
        if (!roomData) return;
        const hostReset = roomData.status === 'WAITING' && !roomData.gameState;
        if (hostReset && gameState?.phase === 'MATCH_END') {
            handleLeaveRoom();
        }
    }, [roomData?.status, roomData?.gameState]);

    // Show Round/Manche Banner when a new round starts
    // 🔧 FIX: On utilise prevMancheRef pour détecter un VRAI changement de manche
    // et éviter les faux positifs causés par les re-renders intermédiaires Firebase
    // (ex: mancheNumber=1 stale + roundNumber=1 du nouvel état → M1/R1 affiché à tort).
    useEffect(() => {
        if (!gameState || gameState.phase !== 'PLAYING') return;

        const rn = gameState.roundNumber ?? 1;
        const mn = gameState.mancheNumber ?? 1;

        const isFirstRoundOfNewManche = rn === 1 && mn > prevMancheRef.current;
        const isNewRound = rn > 1;

        // Met à jour la ref AVANT de programmer quoi que ce soit
        prevMancheRef.current = mn;

        if (isFirstRoundOfNewManche) {
            // Nouvelle manche : affiche "Manche X" 1s puis "Round 1" 1s
            setBannerState('MANCHE');
            let timer2: ReturnType<typeof setTimeout>;
            const timer1 = setTimeout(() => {
                setBannerState('ROUND');
                timer2 = setTimeout(() => {
                    setBannerState('NONE');
                }, 1000);
            }, 1000);
            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
            };
        } else if (isNewRound) {
            // Round 2+ dans la même manche : affiche juste "Round Y" 1s
            setBannerState('ROUND');
            const timer = setTimeout(() => {
                setBannerState('NONE');
            }, 1000);
            return () => clearTimeout(timer);
        }
        // rn === 1 ET mn === prevManche → premier round du tout premier match OU re-render parasite : rien
    }, [gameState?.roundNumber, gameState?.mancheNumber, gameState?.phase]);

    // Audio & Firebase Subscription
    // Buy-in Deduction (Delayed)
    useEffect(() => {
        if (isSoloMode || !gameId || !gameState || gameState.phase !== 'PLAYING') return;
        if (hasBeenDebited.current) return;

        const deductBuyInAction = async () => {
            const tableConfig = TABLE_CONFIGS[activeTableTier];
            if (!tableConfig || tableConfig.buyIn <= 0) return;

            // PERSISTENCE CHECK: Check if Firestore already knows we were debited
            const meInRoom = roomData?.players.find(p => p.uid === localPlayerId);
            if (meInRoom?.hasBeenDebited) {
                console.log("[ECONOMY] Player already debited (found in Firestore), skipping.");
                hasBeenDebited.current = true;
                return;
            }

            console.log(`[ECONOMY] Deducting buy-in of ${tableConfig.buyIn} for room ${gameId}`);
            const success = await economyService.deductBuyIn(tableConfig.buyIn, localPlayerId);

            if (success) {
                hasBeenDebited.current = true;
                await markPlayerAsDebited(gameId, localPlayerId);
                setDebitFeedback(`-${tableConfig.buyIn} 🪙`);
                setTimeout(() => setDebitFeedback(null), 2500);
            } else {
                console.error("[ECONOMY] Failed to deduct buy-in at game start!");
            }
        };

        // Only guests deduct here. Host deducts in handleStartGame for atomic transition.
        if (!isLocalHost) {
            deductBuyInAction();
        }
    }, [gameState?.phase, isLocalHost, isSoloMode, gameId, activeTableTier, localPlayerId]);
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
            // If the match is over, or we intentionally leave, allow navigation
            if (gameStateRef.current?.phase === 'MATCH_END' || isIntentionalLeave.current) {
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

    const startSoloGame = useCallback(async () => {
        if (isStarting) return;
        setIsStarting(true);
        try {
            const botDifficulty = difficulty || 'MAPIPI';

            // Fetch bot profiles from Firestore (or fallback)
            const botProfiles = await botService.getBotsForLevel(botDifficulty, 2);
            const playerNames = [playerDisplayName, ...botProfiles.map(b => b.name)];

            const fullState = dealGameSolo(
                localPlayerId,
                playerDisplayName,
                playerAvatarId as string,
                botDifficulty,
                startingHandSize || 7
            ) as GameState;

            // Configure local player and bots avatars
            fullState.players[0].avatarId = playerAvatarId as AvatarId;

            fullState.players[1].name = botProfiles[0].name;
            fullState.players[1].avatarId = botProfiles[0].avatarId as AvatarId;
            fullState.players[1].difficulty = botDifficulty;

            if (fullState.players.length > 2) {
                fullState.players[2].name = botProfiles[1].name;
                fullState.players[2].avatarId = botProfiles[1].avatarId as AvatarId;
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

        // 1. Débit immédiat pour l'hôte
        const tableConfig = TABLE_CONFIGS[activeTableTier];
        const meInRoom = roomData.players.find(p => p.uid === localPlayerId);

        if (tableConfig && tableConfig.buyIn > 0 && !hasBeenDebited.current && !meInRoom?.hasBeenDebited) {
            const success = await economyService.deductBuyIn(tableConfig.buyIn, localPlayerId);
            if (!success) {
                Alert.alert("Solde insuffisant", "Vous n'avez plus assez de coins pour lancer cette table.");
                return;
            }
            hasBeenDebited.current = true;
            await markPlayerAsDebited(gameId, localPlayerId);
            setDebitFeedback(`-${tableConfig.buyIn} 🪙`);
            setTimeout(() => setDebitFeedback(null), 2500);
        }

        setIsStarting(true);

        try {
            const playerNames = roomData.players.map(p => p.displayName);
            const botDifficulty = (roomData.difficulty || 'MAPIPI') as any;
            const botConfigs = await botService.getBotsForLevel(botDifficulty, 3);
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

            // ✅ FIX: Champs manquants que dealGame() ne définit pas (contrairement à dealGameSolo)
            // Sans eux, computeNextRoundState lit roundNumber=undefined → calcule toujours round 2 = R1
            fullState.roundNumber = 1;
            fullState.mancheNumber = 1;
            fullState.mancheHistory = [];
            fullState.history = [];
            fullState.firstPlayerOfRound = null;
            fullState.mancheResult = null;
            fullState.startingHandSize = roomData.startingHandSize || 7;

            // Re-assign IDs to actual UIDs for real players, and configure Bots
            fullState.players = fullState.players.map((p, i) => {
                if (i < roomData.players.length) {
                    const uid = roomData.players[i].uid;
                    return {
                        ...p,
                        id: uid,
                        avatarId: roomData.players[i].avatarId || 'avatar_default',
                        status: 'HUMAN'
                    };
                } else {
                    const relativeBotIdx = i - roomData.players.length;
                    const config = botConfigs[relativeBotIdx] || botConfigs[0];
                    return {
                        ...p,
                        id: `bot-${i}`,
                        name: config.name,
                        status: 'BOT',
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

    const handleLeaveRoom = useCallback(() => {
        console.log("[QUIT] handleLeaveRoom called. isSoloMode:", isSoloMode, "gameId:", gameId);

        // 0. Arrêter la musique de jeu immédiatement pour éviter la fuite audio
        SoundManager.stopMusic();

        // Allow beforeRemove to pass through
        isIntentionalLeave.current = true;

        // 1. Navigate FIRST — Force redirect to /home for all players
        router.replace('/home');

        // 2. Cleanup AFTER navigation is triggered (fire-and-forget)
        AsyncStorage.removeItem('active_roomId').catch(console.error);
        if (!isSoloMode && gameId) {
            leaveRoom(gameId, localPlayerId).catch(e => console.error("Error leaving room", e));
        }
    }, [isSoloMode, gameId, localPlayerId, router]);

    // -- 7. Action Handlers (Delegated) --
    // These are already extracted into useGameEngine and useGameSync

    const wrappedHandlePlayDomino = useCallback(
        (domino: Domino) => {
            handlePlayDomino(domino);
        },
        [handlePlayDomino]
    );

    const interceptOverlayContinue = useCallback(() => {
        // La navigation définitive quand l'overlay (qui gère déjà Scores / Historique / Gains) est fermé.
        setShowScoreboard(false); 
        if (gameState?.phase === 'MATCH_END') {
             handleLeaveRoom(); // Quitte la salle définitivement après la fin du match complet
        } else {
             handleOverlayContinue(); // Continue vers la prochaine manche
        }
    }, [gameState?.phase, handleLeaveRoom, handleOverlayContinue]);




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
            case 'VICTOIRE': return `${player.totalRoundWins} 🏆`;
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

                {debitFeedback && (
                    <Animated.View
                        entering={FadeInUp}
                        exiting={FadeOut}
                        style={{
                            position: 'absolute',
                            top: insets.top + 60,
                            alignSelf: 'center',
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                            borderRadius: 20,
                            zIndex: 9999,
                            borderWidth: 1,
                            borderColor: '#FFD700',
                        }}
                    >
                        <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 18 }}>{debitFeedback}</Text>
                    </Animated.View>
                )}

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
                    isVibrationEnabled={isVibrationEnabled}
                    onToggleVibration={async () => {
                        const newState = !isVibrationEnabled;
                        await SettingsManager.setVibrationEnabled(newState);
                        setIsVibrationEnabled(newState);
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
                    skinConfig={playerSkinConfig}
                />
                <PlayerArea
                    opponents={opponents}
                    localPlayer={localPlayer as any}
                    gameState={gameState}
                    localPlayerId={localPlayerId}
                    boudedPlayerId={visualBoudePlayerId}
                    playersChat={playersChat as any}
                    overtime={overtime}
                    isBotPlaying={isProcessingMove}
                    isPaused={isPaused}
                    insets={insets}
                    avatarRefs={avatarRefs}
                    getPlayerScore={getPlayerScore as any}
                    skinConfig={playerSkinConfig}
                />

                {/* QUICK CHAT UI */}
                {!isGameOver && !isSoloMode && (
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
                onPlayDomino={wrappedHandlePlayDomino}
                isPaused={isPaused}
                skinConfig={playerSkinConfig}
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
                onOverlayContinue={interceptOverlayContinue}
                onLeaveRoom={handleLeaveRoom}
                roomData={roomData}
                bannerState={bannerState}
                isPaused={isPaused}
                onResume={() => setIsPaused(false)}
                matchReward={matchReward}
            />



            {/* ✅ FIX ANTI-ZOMBIE: Overlay temporaire pendant la reprise */}
            {isRejoining && (
                <View style={[StyleSheet.absoluteFillObject, { zIndex: 999 }]}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: '#FFD700', fontSize: 24, fontWeight: 'bold' }}>Reprise de la connexion...</Text>
                    </View>
                </View>
            )}

            {/* ✨ RoundResultCard — résumé visuel avant l'écran de score */}
            {gameState && (
                <RoundResultCard
                    gameState={gameState}
                    visible={showRoundResult}
                />
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

