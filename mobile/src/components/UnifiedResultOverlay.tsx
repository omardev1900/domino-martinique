import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Image, Platform, ScrollView } from 'react-native';
import Animated, { FadeIn, SlideInDown, ZoomIn, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring, Easing, runOnJS, interpolate, Extrapolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { GameState, Player, PlayerId, GameMode, MancheResult } from '@/core/types';
import { getAvatarImage, AvatarId, AVAILABLE_AVATARS } from '@/core/avatars';
import SoundManager from '@/core/audio/SoundManager';
import HapticManager from '@/core/audio/HapticManager';
import { DominoTile } from './DominoTile';
import { calculateHandPoints } from '@/core/ScoringEngine';
// import { ConfettiSystem } from './ConfettiSystem'; // Skpped for now

const ConfettiPiece = ({ index, animValue }: { index: number, animValue: any }) => {
    const emojis = ['🎈', '🎊', '✨', '🏆', '🌟', '🎉'];
    // Randomization stable via la création initiale (ne pas recalculer à chaque rendu)
    const [startX] = useState(() => Math.random() * 100 - 50);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            top: interpolate(animValue.value, [0, 1], [-200, 800]),
            left: `${Math.max(0, Math.min(100, 50 + startX + Math.sin(animValue.value * Math.PI * 2 + index) * 20))}%`,
            opacity: interpolate(animValue.value, [0, 0.8, 1], [1, 1, 0]),
            transform: [
                { rotate: `${interpolate(animValue.value, [0, 1], [0, 360])}deg` },
                { scale: 1.5 }
            ]
        };
    });

    return <Animated.Text style={animatedStyle}>{emojis[index % emojis.length]}</Animated.Text>;
};

interface UnifiedResultOverlayProps {
    gameState: GameState;
    visible: boolean;
    currentUserId: string;
    onContinue: () => void;
    onLeave?: () => void; // For match end
    allReady?: boolean; // Signal from outside if needed, but we'll handle internally too
    onAnimationFinished?: () => void;
}

type OverlayMode = 'SIMPLE_WIN' | 'MANCHE_END' | 'MATCH_END' | 'BOUDE';

export const UnifiedResultOverlay: React.FC<UnifiedResultOverlayProps> = ({
    gameState,
    visible,
    currentUserId,
    onContinue,
    onLeave
}) => {
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    // Derived State
    const [showDetails, setShowDetails] = useState(false);
    const isMatchOver = gameState.phase === 'MATCH_END';
    const isMancheOver = gameState.phase === 'MANCHE_END';
    const isBoude = gameState.phase === 'BOUDE';

    // Determine actual mode
    let mode: OverlayMode = 'SIMPLE_WIN';
    if (isMatchOver) mode = 'MATCH_END';
    else if (isMancheOver) mode = 'MANCHE_END';
    else if (isBoude) mode = 'BOUDE';

    const mancheResult = gameState.mancheResult;

    // Find Winner (Round or Match)
    // For Match/Manche end, we usually have a clear winner in logic
    // For Round end, winner is firstPlayerOfRound (usually set to winner) or one with 0 dominoes
    const getWinner = (): Player | undefined => {
        if (isBoude) return undefined; // Handled separately or no winner yet
        if (mancheResult === 'CHIRE') return undefined; // No winner

        // Match Logic
        if (isMatchOver) {
            if (gameState.gameMode === 'MANCHE') {
                // Manche mode winner determination: Le Camion (totalPoints) > Manche Wins
                return [...gameState.players].sort((a, b) => {
                    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
                    return b.mancheWins - a.mancheWins;
                })[0];
            }
            if (gameState.gameMode === 'SCORE') return gameState.players.find(p => p.totalPoints >= gameState.winningCondition);
            if (gameState.gameMode === 'COCHON') return gameState.players.find(p => p.totalCochons >= gameState.winningCondition);

            return [...gameState.players].sort((a, b) => b.mancheWins - a.mancheWins)[0];
        }

        // Manche Logic
        if (isMancheOver) {
            const winner = gameState.players.find(p => p.currentMancheStars >= 3); // Or threshold
            if (winner) return winner;
        }

        // Round Logic (Simple Win)
        // Usually the one with empty hand OR determined by logic
        return gameState.players.find(p => p.id === gameState.firstPlayerOfRound) || gameState.players.find(p => p.hand.length === 0);
    };

    const winner = getWinner();
    const isMeWinner = winner?.id === currentUserId;
    const isChire = mancheResult === 'CHIRE';
    const isCochon = mancheResult === 'COCHON';

    // Animation Values
    const scaleValue = useSharedValue(0.5);
    const opacityValue = useSharedValue(0);
    const [animationReady, setAnimationReady] = useState(true);
    const [readyPlayers, setReadyPlayers] = useState<Record<string, number>>({});
    const [countdown, setCountdown] = useState(5);
    const countdownRef = useRef<any>(null);
    const shouldContinueRef = useRef(false);

    useEffect(() => {
        if (visible) {
            scaleValue.value = withSpring(1);
            opacityValue.value = withTiming(1, { duration: 500 });

            // Trigger animation finished for all modes including Boude
            setAnimationReady(true);
            setReadyPlayers({}); // Reset counting

            // Sounds
            if (isChire) {
                SoundManager.playSound('boude');
            } else if (isCochon) {
                SoundManager.playSound('win');
            } else if (isMeWinner) {
                SoundManager.playSound('win');
                HapticManager.triggerSuccess();
            } else if (winner) {
                SoundManager.playSound('lose');
            }

            // Countdown is managed by the auto-continue timer useEffect below
        } else {
            scaleValue.value = 0.5;
            opacityValue.value = 0;
            setAnimationReady(false);
            if (countdownRef.current) clearInterval(countdownRef.current);
        }
    }, [visible, mode, isChire, isCochon, isMeWinner]);

    // AUTO-CONTINUE TIMER
    useEffect(() => {
        if (visible && animationReady && !isMatchOver) {
            shouldContinueRef.current = false;
            setCountdown(5);
            if (countdownRef.current) clearInterval(countdownRef.current);

            countdownRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        if (countdownRef.current) clearInterval(countdownRef.current);
                        // Don't call onContinue here (inside setState = during render)
                        // Mark flag instead, useEffect below will fire it safely
                        shouldContinueRef.current = true;
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [visible, animationReady, isMatchOver, mode]);

    // Safe trigger: fires onContinue AFTER render, when countdown hits 0
    useEffect(() => {
        if (countdown === 0 && shouldContinueRef.current) {
            shouldContinueRef.current = false;
            onContinue();
        }
    }, [countdown]);

    const handlePlayerReady = (id: string, pts: number) => {
        setReadyPlayers(prev => {
            const next = { ...prev, [id]: pts };
            if (Object.keys(next).length === gameState.players.length) {
                setAnimationReady(true);
            }
            return next;
        });
    };

    // --- ANIMATIONS CONFETTIS ---
    const confettiAnim = useSharedValue(0);
    useEffect(() => {
        if (isMatchOver && visible) {
            confettiAnim.value = withRepeat(
                withTiming(1, { duration: 3000, easing: Easing.linear }),
                -1,
                false
            );
        } else {
            confettiAnim.value = 0;
        }
    }, [isMatchOver, visible]);

    if (!visible) return null;

    // --- RENDER CONTENT BASED ON MODE ---

    const renderHeader = () => {
        if (isMatchOver) return { title: "MÈT PIÈS !", subtitle: "Ou ganyé fwa-tala !" };
        if (isChire) return { title: "CHIRÉ !!", subtitle: "Tout moun a zéro !" };
        if (isCochon) return { title: "COCHON !", subtitle: `Ou pran an koshon ! 🐷` };
        if (isMancheOver) return { title: "MANCHE TERMINÉE", subtitle: `An lòt zetwal !` };
        if (isBoude) return { title: "BOUDÉ !", subtitle: "Pèsonn pa ganyé." };
        return { title: "VICTOIRE !", subtitle: `An lòt zetwal !` };
    };

    const headerInfo = renderHeader();

    // -------------------------------------------------------------
    // RENDER: BOUDE (BLOCKED GAME) - DISCREET BANNER
    // -------------------------------------------------------------
    if (isBoude) {
        // Find winner (min hand points)
        const boudeWinnerId = (() => {
            const scores = gameState.players.map(p => ({ id: p.id, score: calculateHandPoints(p.hand) }));
            const minScore = Math.min(...scores.map(s => s.score));
            const winners = scores.filter(s => s.score === minScore);
            return winners.length === 1 ? winners[0].id : null;
        })();
        const boudeWinner = gameState.players.find(p => p.id === boudeWinnerId);

        return (
            <View style={styles.container} pointerEvents="box-none" aria-modal={true}>
                {/* No full backdrop for Boude to keep board completely visible, just a slight dim */}
                <Animated.View style={[{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' }, { opacity: opacityValue }]} />

                <Animated.View style={[
                    styles.boudeBanner,
                    { transform: [{ scale: scaleValue }], opacity: opacityValue }
                ]}>
                    <View style={styles.boudeBannerContent}>
                        {/* HEADER: Icon, Title, Action */}
                        <View style={styles.boudeBannerHeader}>
                            <View style={styles.boudeIconContainer}>
                                <Text style={{ fontSize: 24 }}>🛑</Text>
                            </View>
                            <View style={styles.boudeTextContainer}>
                                <Text style={styles.boudeBannerTitle}>PARTIE BLOQUÉE !</Text>
                                {boudeWinner ? (
                                    <Text style={styles.boudeBannerSubtitle}>{boudeWinner.name} gagne aux points.</Text>
                                ) : (
                                    <Text style={styles.boudeBannerSubtitle}>Égalité parfaite !</Text>
                                )}
                            </View>
                            {animationReady && (
                                <TouchableOpacity style={styles.boudeBannerButton} onPress={onContinue}>
                                    <Text style={styles.boudeBannerButtonText}>CONTINUER ({countdown}s)</Text>
                                    <Ionicons name="arrow-forward" size={16} color="white" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* PLAYERS HANDS */}
                        <View style={styles.boudePlayersList}>
                            {gameState.players.map(p => {
                                const isMin = p.id === boudeWinnerId;
                                const pts = calculateHandPoints(p.hand);
                                const totalPts = gameState.gameMode === 'SCORE' ? p.totalPoints : gameState.gameMode === 'COCHON' ? p.totalCochons : p.totalPoints;

                                return (
                                    <View key={p.id} style={[styles.boudePlayerItem, isMin && styles.boudePlayerItemWinner]}>
                                        <View style={styles.boudePlayerInfoRow}>
                                            <View style={styles.boudeAvatarBlock}>
                                                <Image source={getAvatarImage(p.avatarId as AvatarId || 'avatar_default')} style={[styles.boudeMiniAvatar, isMin && styles.boudeAvatarWinner]} />
                                                {isMin && <Text style={styles.boudeCrown}>👑</Text>}
                                            </View>
                                            <View style={styles.boudePlayerTextCol}>
                                                <Text style={[styles.boudePlayerName, isMin && styles.boudePlayerNameWinner]} numberOfLines={1}>{p.name}</Text>
                                                <View style={styles.boudePlayerScoresRow}>
                                                    <Text style={[styles.boudePlayerScore, isMin && styles.boudePlayerScoreWinner]}>{pts} pts</Text>
                                                    <Text style={styles.boudePlayerTotalScore}>(Total: {totalPts})</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View style={styles.boudeMiniHand}>
                                            {p.hand.length === 0 ? (
                                                <Text style={styles.boudeEmptyHand}>0 domino</Text>
                                            ) : (
                                                p.hand.map(d => (
                                                    <View key={d.id} style={{ transform: [{ scale: 0.65 }], marginHorizontal: -5, marginVertical: -15, ...styles.shadowStrong }}>
                                                        <DominoTile left={d.left} right={d.right} size={30} noMargin />
                                                    </View>
                                                ))
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </Animated.View>
            </View>
        );
    }

    // -------------------------------------------------------------
    // RENDER: FULL MATCH END
    // -------------------------------------------------------------
    if (isMatchOver) {
        const finalWinner = winner || gameState.players[0];

        // Ensure 3 players max for podium logic
        let sortedPlayers = [...gameState.players];
        const currentWinnerId = finalWinner?.id;

        if (gameState.players.length === 3) {
            const p1 = gameState.players.find(p => p.id === currentWinnerId) || gameState.players[0];
            const others = gameState.players.filter(p => p.id !== p1.id);
            sortedPlayers = [others[0], p1, others[1]]; // [Loser1, Winner, Loser2]
        } else if (gameState.players.length === 2) {
            const p1 = gameState.players.find(p => p.id === currentWinnerId) || gameState.players[0];
            const p2 = gameState.players.find(p => p.id !== p1.id) || gameState.players[1];
            sortedPlayers = [p1, p2]; // [Winner, Loser]
        }

        // Animated Confetti Component
        const renderConfetti = () => {
            return Array.from({ length: 20 }).map((_, i) => (
                <ConfettiPiece key={i} index={i} animValue={confettiAnim} />
            ));
        };

        if (showDetails) {
            return (
                <View style={styles.container} pointerEvents="box-none" aria-modal={true}>
                    <Animated.View style={[{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)' }, { opacity: opacityValue }]} />

                    <Animated.View style={[
                        styles.boudeBanner,
                        styles.matchBannerXL,
                        { transform: [{ scale: scaleValue }], opacity: opacityValue, padding: isLandscape ? 10 : 20 }
                    ]}>
                        <View style={[styles.boudeBannerContent, { flex: 1, width: '100%' }]}>
                            {/* Dashboard Header */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#E8CA8B', paddingBottom: 10, marginBottom: 15 }}>
                                <Text style={[styles.boudeBannerTitle, { color: '#8B6508', fontSize: isLandscape ? 18 : 22 }]}>HISTORIQUE DU MATCH</Text>
                                <TouchableOpacity onPress={() => setShowDetails(false)} style={{ padding: 4, backgroundColor: '#f0f0f0', borderRadius: 20 }}>
                                    <Ionicons name="close" size={24} color="#555" />
                                </TouchableOpacity>
                            </View>

                            {/* Table Header (Players) */}
                            <View style={{ flexDirection: 'row', paddingBottom: 5, borderBottomWidth: 2, borderColor: '#ddd' }}>
                                <Text style={{ width: isLandscape ? 60 : 80, fontWeight: 'bold', color: '#666', fontSize: 12 }}>Manches</Text>
                                {sortedPlayers.map(p => (
                                    <Text key={p.id} style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', color: '#333', fontSize: 13 }} numberOfLines={1}>{p.name}</Text>
                                ))}
                            </View>

                            {/* History Rows */}
                            <ScrollView style={{ flex: 1, width: '100%' }} showsVerticalScrollIndicator={false}>
                                {gameState.mancheHistory && gameState.mancheHistory.map((history, idx) => (
                                    <View key={idx} style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 10, alignItems: 'center' }}>
                                        <Text style={{ width: isLandscape ? 60 : 80, fontWeight: 'bold', color: '#555', fontSize: 13 }}>M{history.mancheNumber}</Text>
                                        {sortedPlayers.map(p => {
                                            const pts = history.points[p.id] || 0;
                                            const isBest = Math.max(...Object.values(history.points)) === pts;
                                            return (
                                                <Text key={p.id} style={{ flex: 1, textAlign: 'center', color: isBest ? '#2e7d32' : '#555', fontWeight: isBest ? 'bold' : 'normal', fontSize: 14 }}>
                                                    {pts > 0 && '+'}{pts}
                                                </Text>
                                            );
                                        })}
                                    </View>
                                ))}

                                {(!gameState.mancheHistory || gameState.mancheHistory.length === 0) && (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Text style={{ color: '#999', fontStyle: 'italic' }}>Aucun historique disponible.</Text>
                                    </View>
                                )}
                            </ScrollView>

                            {/* Totals Row */}
                            <View style={{ flexDirection: 'row', borderTopWidth: 2, borderColor: '#8B6508', paddingTop: 12, marginTop: 5 }}>
                                <Text style={{ width: isLandscape ? 60 : 80, fontWeight: '900', color: '#333', fontSize: 14 }}>TOTAL</Text>
                                {sortedPlayers.map(p => {
                                    const totalPts = gameState.gameMode === 'SCORE' ? p.totalPoints : gameState.gameMode === 'COCHON' ? p.totalCochons : p.totalPoints;
                                    return (
                                        <Text key={p.id} style={{ flex: 1, textAlign: 'center', fontWeight: '900', color: '#8B6508', fontSize: 15 }}>
                                            {totalPts}
                                        </Text>
                                    );
                                })}
                            </View>
                        </View>
                    </Animated.View>
                </View>
            );
        }

        return (
            <View style={styles.container} pointerEvents="box-none" aria-modal={true}>
                {/* Backdrop plus foncé pour la fin du match */}
                <Animated.View style={[{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' }, { opacity: opacityValue }]} />

                {/* Overlay Confetti (behind modal) */}
                <View style={[StyleSheet.absoluteFillObject, { overflow: 'hidden' }]} pointerEvents="none">
                    {renderConfetti()}
                </View>

                <Animated.View style={[
                    styles.boudeBanner,
                    styles.matchBannerXL,
                    { transform: [{ scale: scaleValue }], opacity: opacityValue }
                ]}>
                    <View style={[styles.boudeBannerContent, { flex: 1, justifyContent: 'space-between', alignItems: 'center' }]}>

                        {/* HEADER FIN DE MATCH: Titre Prestige */}
                        <View style={{ alignItems: 'center', marginBottom: 2, flexDirection: 'row', justifyContent: 'center', width: '100%' }}>
                            <Text style={[styles.boudeBannerTitle, styles.matchTitlePrestige, { flex: 1, textAlign: 'center' }]}>
                                VAINQUEUR DU MATCH
                            </Text>
                            <TouchableOpacity style={{ position: 'absolute', right: 5, top: -5, padding: 8, backgroundColor: 'rgba(232, 202, 139, 0.2)', borderRadius: 20 }} onPress={() => setShowDetails(true)}>
                                <Ionicons name="stats-chart" size={24} color="#8B6508" />
                            </TouchableOpacity>
                        </View>

                        {/* LE PODIUM DES HÉROS (Zéro Scroll) */}
                        <View style={styles.podiumRoyalContainer}>
                            {sortedPlayers.map((p, idx) => {
                                const isWin = p.id === finalWinner?.id;
                                const totalPts = gameState.gameMode === 'SCORE' ? p.totalPoints : gameState.gameMode === 'COCHON' ? p.totalCochons : p.totalPoints;

                                return (
                                    <View key={p.id} style={[styles.podiumRoyalCard, isWin ? styles.podiumRoyalWinner : styles.podiumRoyalLoser]}>

                                        {/* Avatar & Identité */}
                                        <View style={[styles.boudeAvatarBlock, { alignItems: 'center', marginBottom: 6 }]}>
                                            <Image source={getAvatarImage(p.avatarId as AvatarId || 'avatar_default')} style={[styles.boudeMiniAvatar, isWin ? styles.podiumRoyalAvatarWinner : styles.podiumRoyalAvatarLoser]} />
                                            {isWin && <Text style={styles.podiumCrownWinner}>👑</Text>}
                                        </View>

                                        <Text style={[styles.boudePlayerName, isWin ? styles.podiumNameWinner : styles.podiumNameLoser]} numberOfLines={1}>{p.name}</Text>

                                        {/* Statistiques de Gloire */}
                                        <View style={{ alignItems: 'center', marginTop: 5 }}>
                                            <Text style={[styles.boudePlayerScore, isWin ? styles.podiumScoreWinner : styles.podiumScoreLoser]}>
                                                {totalPts} <Text style={{ fontSize: 14 }}>pts</Text>
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        {/* CALL TO ACTIONS */}
                        <View style={styles.podiumActionRow}>
                            {animationReady && (
                                <>
                                    <TouchableOpacity
                                        style={styles.podiumButtonMenu}
                                        onPress={() => {
                                            if (onLeave) onLeave();
                                            else onContinue(); // Fallback if no onLeave
                                        }}
                                    >
                                        <Ionicons name="home" size={20} color="#555" />
                                        <Text style={styles.podiumButtonMenuText}>MENU</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.podiumButtonRejouer}
                                        onPress={onContinue}
                                    >
                                        <Text style={styles.podiumButtonRejouerText}>REJOUER ({countdown}s)</Text>
                                        <Ionicons name="refresh" size={20} color="white" />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>

                    </View>
                </Animated.View>
            </View>
        );
    }


    return (
        <View style={styles.container} pointerEvents="box-none" aria-modal={true}>
            <Animated.View style={[{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' }, { opacity: opacityValue }]} />

            <Animated.View style={[
                styles.boudeBanner,
                { transform: [{ scale: scaleValue }], opacity: opacityValue }
            ]}>
                <View style={styles.boudeBannerContent}>
                    {/* HEADER */}
                    <View style={styles.boudeBannerHeader}>
                        <View style={[styles.boudeIconContainer, { borderColor: '#4CAF50' }]}>
                            <Text style={{ fontSize: 24 }}>🏆</Text>
                        </View>
                        <View style={styles.boudeTextContainer}>
                            <Text style={[styles.boudeBannerTitle, { color: '#2E7D32' }]}>
                                {isChire ? "CHIRÉ !" : "VICTOIRE !"}
                            </Text>
                            <Text style={styles.boudeBannerSubtitle}>{headerInfo.subtitle}</Text>
                        </View>
                        {animationReady && (
                            <TouchableOpacity style={styles.boudeBannerButton} onPress={onContinue}>
                                <Text style={styles.boudeBannerButtonText}>
                                    {isMancheOver ? "MANCHE SUIVANTE" : "CONTINUER"} ({countdown}s)
                                </Text>
                                <Ionicons name="arrow-forward" size={16} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* PLAYERS LIST (Scores & Dominos) */}
                    <View style={styles.boudePlayersList}>
                        {gameState.players.map(p => {
                            const isWin = p.id === winner?.id;
                            const latestManche = gameState.mancheHistory?.[gameState.mancheHistory.length - 1];
                            let roundPts = 0;

                            if (latestManche && latestManche.points[p.id] !== undefined) {
                                roundPts = latestManche.points[p.id];
                            } else {
                                // Fallback
                                if (isWin) {
                                    roundPts = gameState.players.reduce((acc, curr) => curr.id !== p.id ? acc + calculateHandPoints(curr.hand) : acc, 0);
                                    if (isChire) roundPts += 50;
                                } else {
                                    roundPts = -calculateHandPoints(p.hand);
                                    if (isChire) roundPts -= 50;
                                }
                            }

                            const totalPts = gameState.gameMode === 'SCORE' ? p.totalPoints : gameState.gameMode === 'COCHON' ? p.totalCochons : p.totalPoints;

                            return (
                                <View key={p.id} style={[styles.boudePlayerItem, isWin && styles.boudePlayerItemWinner]}>
                                    <View style={styles.boudePlayerInfoRow}>
                                        <View style={styles.boudeAvatarBlock}>
                                            <Image source={getAvatarImage(p.avatarId as AvatarId || 'avatar_default')} style={[styles.boudeMiniAvatar, isWin && styles.boudeAvatarWinner]} />
                                            {isWin && <Text style={styles.boudeCrown}>👑</Text>}
                                        </View>
                                        <View style={styles.boudePlayerTextCol}>
                                            <Text style={[styles.boudePlayerName, isWin && styles.boudePlayerNameWinner]} numberOfLines={1}>{p.name}</Text>
                                            <View style={styles.boudePlayerScoresRow}>
                                                <Text style={[styles.boudePlayerScore, isWin && styles.boudePlayerScoreWinner]}>
                                                    {roundPts > 0 ? `+${roundPts}` : roundPts} pts
                                                </Text>
                                                <Text style={styles.boudePlayerTotalScore}>
                                                    (Total: {totalPts}{gameState.winningCondition ? `/${gameState.winningCondition}` : ''})
                                                </Text>
                                            </View>
                                        </View>
                                        {/* MANCHE WINS STAR */}
                                        <View style={{ alignItems: 'center', marginLeft: 4 }}>
                                            <Text style={{ fontSize: 13, fontWeight: '900', color: '#B8860B' }}>
                                                {p.currentMancheStars}⭐
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.boudeMiniHand}>
                                        {p.hand.length === 0 ? (
                                            <Text style={styles.boudeEmptyHand}>A terminé !</Text>
                                        ) : (
                                            p.hand.map(d => (
                                                <View key={d.id} style={{ transform: [{ scale: 0.65 }], marginHorizontal: -5, marginVertical: -15, ...styles.shadowStrong }}>
                                                    <DominoTile left={d.left} right={d.right} size={30} noMargin />
                                                </View>
                                            ))
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </Animated.View>
        </View>
    );
};

// --- HELPER COMPONENT FOR BOUDE CARDS ---
const BoudeCard = ({ player, isWinner, handPoints, delay, onReady }: { player: Player, isWinner: boolean, handPoints: number, delay: number, onReady: (pts: number) => void }) => {
    const points = handPoints;
    const count = useSharedValue(0);
    const [displayCount, setDisplayCount] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            count.value = withTiming(points, {
                duration: 1500,
                easing: Easing.out(Easing.quad)
            }, (finished) => {
                if (finished) {
                    runOnJS(onReady)(points);
                }
            });

            const interval = setInterval(() => {
                setDisplayCount(Math.round(count.value));
                if (count.value >= points) clearInterval(interval);
            }, 50);

            return () => clearInterval(interval);
        }, delay);

        return () => clearTimeout(timer);
    }, []);

    return (
        <Animated.View
            entering={ZoomIn.delay(delay).duration(600)}
            style={[styles.podiumCardBoude, isWinner && styles.podiumCardWinnerBoude, styles.boudeCard]}
        >
            {isWinner && (
                <View style={styles.winnerBadge}>
                    <Text style={styles.winnerBadgeText}>VAINQUEUR</Text>
                </View>
            )}

            <Image
                source={getAvatarImage(player.avatarId as AvatarId || 'avatar_default')}
                style={[styles.podiumAvatar, isWinner && styles.podiumAvatarWinner, { marginBottom: 5 }]}
            />

            <Text style={styles.podiumNameBoude} numberOfLines={1}>{player.name}</Text>

            <Text style={[styles.boudePoints, isWinner ? styles.pointsWinner : styles.pointsLoser]}>
                {displayCount} pts
            </Text>

            <View style={styles.boudeHand}>
                {player.hand.map((domino, idx) => (
                    <View key={domino.id || idx} style={styles.miniDominoWrapper}>
                        <DominoTile
                            left={domino.left}
                            right={domino.right}
                            size={45}
                            noMargin
                            entering={FadeIn.delay(delay + 1600 + idx * 100)}
                        />
                    </View>
                ))}
            </View>
        </Animated.View>
    );
};

// --- HELPER COMPONENT FOR PODIUM CARDS ---
const PodiumCard = ({ player, isWinner, totalPoints }: { player: Player, isWinner: boolean, totalPoints: number }) => {
    return (
        <Animated.View
            entering={ZoomIn.delay(isWinner ? 200 : 400).duration(600)}
            style={[styles.podiumCard, isWinner && styles.podiumCardWinner]}
        >
            {isWinner && (
                <View style={styles.winnerBadge}>
                    <Text style={styles.winnerBadgeText}>VAINQUEUR</Text>
                </View>
            )}

            <View style={styles.cardGlowContainer}>
                <Image
                    source={getAvatarImage(player.avatarId as AvatarId || 'avatar_default')}
                    style={[styles.podiumAvatar, isWinner && styles.podiumAvatarWinner]}
                />
                {isWinner && <Text style={styles.podiumCrown}>👑</Text>}
            </View>

            <Text style={styles.podiumName} numberOfLines={1}>{player.name}</Text>
            <Text style={styles.podiumScore}>{totalPoints}</Text>

            {/* Added for visual flair like in the screenshot */}
            <TouchableOpacity style={styles.podiumAction}>
                <Ionicons name="person-add" size={16} color="white" />
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999, // Ensure it's on top of everything
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)', // Less dark to let board show through
    },
    card: {
        width: '90%',
        maxWidth: 420,
        minHeight: 350, // Ensure height consistency
        maxHeight: '80%', // Ne pas étouffer l'écran
        backgroundColor: '#FDF5E6', // OPAQUE Premium Light (Old Lace)
        borderRadius: 24,
        overflow: 'hidden',
        // Modern shadow for Web & Native (if supported)
        ...Platform.select({
            web: {
                boxShadow: '0px 10px 30px rgba(0,0,0,0.3)',
            },
            default: {
                elevation: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
            }
        }),
        // Ensure flex layout for inner content
        display: 'flex',
        flexDirection: 'column',
    },
    cardLandscape: {
        flexDirection: 'row',
        width: '90%',
        maxWidth: 640,
        height: 320,
        minHeight: 320,
        maxHeight: '80%', // Ne pas étouffer l'écran
    },
    visualSection: {
        width: '35%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    visualSectionCochon: {
        // Orange handled by gradient
    },
    visualSectionChire: {
        // Red handled by gradient
    },
    visualSectionLandscape: {
        padding: 10, // Réduire les marges en paysage
    },
    cardLandscapeVisual: {
        width: '60%',
        height: '100%',
    },
    avatarContainer: {
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: 'white',
    },
    crown: {
        fontSize: 30,
        position: 'absolute',
        top: -20,
    },
    winnerAvatarName: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
        marginTop: 8,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    bigEmoji: {
        fontSize: 60,
        marginBottom: 10,
    },
    title: {
        fontSize: 28, // Slightly larger
        fontWeight: '900',
        color: '#FFFFFF', // Keep White on colored gradient background
        textAlign: 'center',
        textTransform: 'uppercase',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.95)',
        textAlign: 'center',
        fontWeight: '700',
        fontStyle: 'italic',
    },
    rightPanel: {
        flex: 1,
        backgroundColor: '#FDF5E6', // Match Card BG
        flexDirection: 'column',
    },
    infoSection: {
        padding: 24,
        flex: 1, // Fill remaining space in its container
        width: '100%',
    },
    dynamicContent: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        width: '100%',
        flex: 1, // Take available space
    },
    explanation: {
        fontSize: 20,
        color: '#1a1a1a', // Dark text for easy reading
        textAlign: 'center',
        fontWeight: '600',
        lineHeight: 26,
    },
    miniScoreboard: {
        width: '100%',
        marginTop: 5,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    miniScoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    miniScoreName: {
        fontSize: 15,
        color: '#333',
    },
    miniScoreValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#000',
    },
    bold: {
        fontWeight: 'bold',
        color: '#000',
    },
    resultsTable: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 16,
        padding: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        marginBottom: 4,
    },
    columnHeader: {
        fontSize: 12,
        fontWeight: '900',
        color: '#888',
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
    },
    cell: {
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
        fontWeight: '600',
    },
    actionButton: {
        flexDirection: 'row',
        backgroundColor: '#000000', // Pitch black for contrast
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 40,
        alignItems: 'center',
        gap: 10,
        minWidth: 200,
        alignSelf: 'center',
        justifyContent: 'center',
        ...Platform.select({
            web: {
                boxShadow: '0px 4px 8px rgba(0,0,0,0.2)',
            },
            default: {
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
            }
        }),
    },
    actionButtonGold: {
        backgroundColor: '#FFD700',
        ...Platform.select({
            web: {
                boxShadow: '0px 4px 10px rgba(255, 215, 0, 0.5)',
            },
            default: {
                shadowColor: '#FFD700',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 10,
            }
        }),
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16, // Smaller text
        fontWeight: '800', // Bolder
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    actionButtonTextGold: {
        color: '#8F6900',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        marginTop: 12,
        borderWidth: 1.5,
        borderColor: '#aaa',
        paddingVertical: 12,
        elevation: 0,
        shadowOpacity: 0,
    },
    secondaryButtonText: {
        color: '#444',
        fontSize: 15, // Visible
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    // --- NEW PODIUM STYLES ---
    podiumContainer: {
        flex: 1,
        width: '100%',
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    podiumHeader: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 30,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    podiumRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 15,
        width: '100%',
        marginBottom: 30,
    },
    podiumCard: {
        width: 140, // Back to original green style size
        backgroundColor: 'rgba(15, 80, 60, 0.9)', // Translucent Deep Green
        borderRadius: 16,
        padding: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        height: 180,
    },
    podiumCardWinner: {
        width: 160,
        height: 220,
        borderColor: '#FFD700', // Gold for match winner
        borderWidth: 2,
        backgroundColor: 'rgba(20, 100, 80, 0.98)',
        zIndex: 10,
        elevation: 10,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },
    // --- BOUDE SPECIFIC CARDS ---
    podiumCardBoude: {
        width: 180,
        backgroundColor: 'rgba(230, 230, 230, 0.9)', // Premium Light Gray
        borderRadius: 16,
        padding: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        height: 200,
    },
    podiumCardWinnerBoude: {
        width: 200,
        height: 240,
        borderColor: '#4ADE80', // Glowing green border
        borderWidth: 2,
        backgroundColor: 'rgba(245, 245, 245, 0.98)',
        zIndex: 10,
        elevation: 10,
        shadowColor: '#4ADE80',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },
    winnerBadge: {
        position: 'absolute',
        top: -15,
        backgroundColor: '#DC2626', // Vibrant red
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
        zIndex: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    winnerBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '900',
    },
    cardGlowContainer: {
        marginBottom: 10,
        position: 'relative',
    },
    podiumAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    podiumAvatarWinner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderColor: '#FFD700', // Gold border for winner
    },
    podiumCrown: {
        position: 'absolute',
        top: -20,
        alignSelf: 'center',
        fontSize: 24,
    },
    podiumName: {
        color: '#4ADE80', // Emerald for match end
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
    },
    podiumNameBoude: {
        color: '#064e3b', // Dark green for gray card
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
    },
    podiumScore: {
        color: 'white',
        fontSize: 24,
        fontWeight: '900',
    },
    podiumAction: {
        position: 'absolute',
        bottom: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 6,
        borderRadius: 6,
    },
    gainsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    gainsText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    gainsValue: {
        color: '#FFD700',
        fontSize: 20,
        fontWeight: '900',
        marginLeft: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 20,
        marginTop: 10,
    },
    menuButton: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    newGameButton: {
        backgroundColor: '#4ADE80', // Vibrant emerald green
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        // Elevation for premium feel
        shadowColor: '#4ADE80',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonTextLight: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    buttonTextDark: {
        color: '#064e3b', // Dark green for contrast on light green button
        fontWeight: '800',
        fontSize: 16,
    },
    // --- NEW BOUDE STYLES ---
    boudeCard: {
        height: 380, // Taller to fit hand and tripled dominoes
        justifyContent: 'flex-start',
        paddingTop: 20,
    },
    boudePoints: {
        fontSize: 22,
        fontWeight: '900',
        marginVertical: 5,
    },
    pointsWinner: {
        color: '#059669', // Stronger Green for contrast
    },
    pointsLoser: {
        color: '#374151', // Dark UI Gray
    },
    boudeHand: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 4,
        marginTop: 10,
        width: '100%',
    },
    miniDominoWrapper: {
        transform: [{ scale: 0.8 }],
    },
    // --- BOUDE BANNER (TOAST) STYLES ---
    boudeBanner: {
        alignSelf: 'center',
        backgroundColor: '#Fdf4e3', // Texture bois clair/parchemin premium
        borderRadius: 24,
        padding: 18,
        width: '95%',
        maxWidth: 600,
        borderWidth: 2,
        borderColor: '#E8CA8B', // Or doux
        // Modern Premium shadow
        ...Platform.select({
            web: {
                boxShadow: '0px 15px 40px rgba(0,0,0,0.4)',
            },
            default: {
                elevation: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.4,
                shadowRadius: 15,
            }
        }),
    },
    matchBannerXL: {
        maxHeight: '95%',
        maxWidth: 700, // Widened for central stage
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    // --- PODIUM ROYAL STYLES ---
    matchTitlePrestige: {
        color: '#DAA520', // Or/Ambré
        fontSize: 24,
        fontWeight: '900',
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        letterSpacing: 2,
        textAlign: 'center',
    },
    podiumRoyalContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end', // Align bottom so winner pops up
        justifyContent: 'center',
        width: '100%',
        gap: 5,
        marginVertical: 5,
    },
    podiumRoyalCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 8, // Réduction du padding pour agrandir l'espace intérieur
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8CA8B',
        // default small card for losers
        width: '32%', // Plus large
        maxWidth: 200,
    },
    podiumRoyalWinner: {
        // Style Royal Winner
        backgroundColor: 'rgba(255,253,240, 0.95)',
        borderColor: '#DAA520',
        borderWidth: 3,
        transform: [{ scale: 1.15 }], // Conserver un bon pop out
        zIndex: 10, // Bring to front
        paddingTop: 10,
        ...Platform.select({
            web: { boxShadow: '0px 0px 30px rgba(218, 165, 32, 0.5)' },
            default: { elevation: 15, shadowColor: '#DAA520', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.8, shadowRadius: 20 }
        })
    },
    podiumRoyalLoser: {
        // Losers slightly grayed out to create depth
        backgroundColor: '#F5F5F5',
        borderColor: '#CCC',
        opacity: 0.85,
    },
    podiumRoyalAvatarWinner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: '#DAA520',
    },
    podiumRoyalAvatarLoser: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#999',
    },
    podiumCrownWinner: {
        position: 'absolute',
        top: -15,
        left: -10, // Adjusted for big avatar
        fontSize: 30,
        transform: [{ rotate: '-15deg' }],
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    podiumNameWinner: {
        fontSize: 16,
        fontWeight: '900',
        color: '#8B6508',
        marginTop: 0, // Remonter pour toucher l'avatar
        textAlign: 'center',
    },
    podiumNameLoser: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#777',
        marginTop: 0, // Remonter pour toucher l'avatar
        textAlign: 'center',
    },
    podiumScoreWinner: {
        fontSize: 32, // "en très gros"
        fontWeight: '900',
        color: '#DAA520',
        lineHeight: 36,
    },
    podiumScoreLoser: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#555',
        lineHeight: 24,
    },
    podiumStars: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 2,
    },
    podiumActionRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 15,
        marginTop: 10,
        width: '100%',
    },
    podiumButtonRejouer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2E7D32', // Vert festif
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        borderBottomWidth: 5, // Effet relief 3D
        borderColor: '#1B5E20',
        gap: 8,
        flex: 2,
        justifyContent: 'center',
    },
    podiumButtonRejouerText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    podiumButtonMenu: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0E0E0', // Discret
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        borderBottomWidth: 4, // Effet relief 3D
        borderColor: '#BDBDBD',
        gap: 6,
        flex: 1,
        justifyContent: 'center',
    },
    podiumButtonMenuText: {
        color: '#555',
        fontSize: 13,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    boudeBannerContent: {
        flexDirection: 'column',
        gap: 15,
    },
    boudeBannerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        backgroundColor: 'rgba(255,255,255,0.4)', // Légère démarcation
        padding: 10,
        borderRadius: 15,
    },
    boudeIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E8CA8B',
    },
    boudeTextContainer: {
        flex: 1,
    },
    boudeBannerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#8B0000', // Deep "Premium" Red
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    boudeBannerSubtitle: {
        fontSize: 14,
        color: '#555',
        fontWeight: '700',
    },
    boudeBannerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2E7D32', // Un vert pro (validation) ou noir '#1A1A1A'
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 24,
        borderBottomWidth: 4, // Effet 3D physique
        borderColor: '#1B5E20',
        gap: 6,
    },
    boudeBannerButtonText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    boudePlayersList: {
        flexDirection: 'row',
        flexWrap: 'nowrap', // Force side-by-side
        gap: 8,
        justifyContent: 'center',
        width: '100%',
    },
    boudePlayerItem: {
        backgroundColor: '#FFF8EB', // Off-white/creamy
        borderRadius: 14,
        padding: 8,
        flex: 1, // Distribute space evenly (33% each for 3 players)
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8CA8B',
        // Slight elevation for relief
        ...Platform.select({
            web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.1)' },
            default: { elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }
        })
    },
    boudePlayerItemWinner: {
        backgroundColor: 'rgba(218, 165, 32, 0.25)', // Fond or léger plus marqué
        borderColor: '#DAA520', // Bordure Goldenrod
        borderWidth: 2,
        // Stronger glow for winner
        ...Platform.select({
            web: { boxShadow: '0px 0px 15px rgba(218, 165, 32, 0.4)' },
            default: { elevation: 6, shadowColor: '#DAA520', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8 }
        })
    },
    boudePlayerInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 4, // Reduced to give more space to bigger dominos
        gap: 8,
    },
    boudeAvatarBlock: {
        position: 'relative',
    },
    boudeMiniAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#CCC',
    },
    boudeAvatarWinner: {
        borderColor: '#DAA520',
        borderWidth: 2,
    },
    boudeCrown: {
        position: 'absolute', // Make crown festive and big
        top: -16,
        left: -8,
        fontSize: 24,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        ...Platform.select({
            web: { filter: 'drop-shadow(2px 4px 6px rgba(218,165,32,0.6))' } as any
        }) // Glow effect on web
    },
    boudePlayerTextCol: {
        flex: 1,
        flexDirection: 'column',
    },
    boudePlayerName: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#444',
    },
    boudePlayerNameWinner: {
        color: '#8B6508', // Dark Goldenrod
    },
    boudePlayerScoresRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    boudePlayerScore: {
        fontSize: 14,
        fontWeight: '900',
        color: '#555',
    },
    boudePlayerScoreWinner: {
        color: '#DAA520', // Goldenrod
    },
    boudePlayerTotalScore: {
        fontSize: 11,
        fontWeight: '800',
        color: '#1565C0', // Strong contrast color (Dark Blue)
    },
    boudeMiniHand: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        minHeight: 45, // give space for scaled dominos
    },
    boudeEmptyHand: {
        fontSize: 11,
        color: '#888',
        fontStyle: 'italic',
        fontWeight: '600',
    },
    shadowStrong: {
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
        elevation: 5,
    },
    // --- LANDSCAPE ADJUSTMENTS ---
    bigEmojiLandscape: {
        fontSize: 40,
        marginBottom: 5,
    },
    titleLandscape: {
        fontSize: 22,
    },
    subtitleLandscape: {
        fontSize: 14,
    },
    actionButtonLandscape: {
        paddingVertical: 8,
        minWidth: 160,
    }
});

