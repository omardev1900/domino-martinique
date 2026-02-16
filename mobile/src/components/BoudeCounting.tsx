import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity, Image } from 'react-native';
import Animated, {
    FadeIn,
    ZoomIn,
    useSharedValue,
    withTiming,
    Easing,
    runOnJS
} from 'react-native-reanimated';
import { Player, Domino } from '../core/types';
import { calculateHandPoints, determineWinnerOnBoudé } from '../core/LogicEngine';
import { LinearGradient } from 'expo-linear-gradient';
import { getAvatarImage, AvatarId } from '../core/avatars';

interface BoudeCountingProps {
    players: Player[];
    onFinished: (winnerId: string | 'TIE') => void;
}

const PlayerScoreRow = ({ player, delay, onReady }: { player: Player, delay: number, onReady: (pts: number) => void }) => {
    const points = calculateHandPoints(player.hand);
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
            entering={FadeIn.delay(delay).duration(600)}
            style={styles.playerRow}
        >
            <View style={styles.avatarMini}>
                <Image
                    source={getAvatarImage((player.avatarId as AvatarId) || 'avatar_default')}
                    style={styles.avatarImage}
                    resizeMode="cover"
                />
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.playerName}>{player.name}</Text>
            </View>
            <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{displayCount}</Text>
                <Text style={styles.ptsLabel}>pts</Text>
            </View>
        </Animated.View>
    );
};

export const BoudeCounting: React.FC<BoudeCountingProps> = ({ players, onFinished }) => {
    const { height, width } = useWindowDimensions();
    const isLandscape = width > height;
    const [readyPlayers, setReadyPlayers] = useState<Record<string, number>>({});
    const [status, setStatus] = useState<'COUNTING' | 'RESULT'>('COUNTING');
    const winnerId = determineWinnerOnBoudé(players);
    const winner = players.find(p => p.id === winnerId);

    const handlePlayerReady = (id: string, pts: number) => {
        setReadyPlayers(prev => {
            const next = { ...prev, [id]: pts };
            if (Object.keys(next).length === players.length) {
                setStatus('RESULT');
            }
            return next;
        });
    };

    return (
        <View style={StyleSheet.absoluteFill}>
            <LinearGradient
                colors={['rgba(0,0,0,0.95)', 'rgba(26, 10, 46, 0.98)']}
                style={[styles.container, isLandscape && styles.containerLandscape]}
            >
                {/* HEADER */}
                <View style={isLandscape ? styles.headerLandscape : styles.headerPortrait}>
                    <Animated.Text entering={FadeIn.duration(800)} style={[styles.title, isLandscape && styles.titleLandscape]}>Partie bloquée</Animated.Text>
                    <Text style={[styles.subtitle, isLandscape && styles.subtitleLandscape]}>Comptage des points...</Text>
                </View>

                {/* MAIN LAYOUT */}
                <View style={[styles.mainLayout, isLandscape && styles.mainLayoutLandscape]}>
                    {/* LEFT COLUMN/TOP AREA: LIST OF SCORES */}
                    <View style={[styles.list, isLandscape && styles.listLandscape]}>
                        {players.map((p, i) => (
                            <PlayerScoreRow
                                key={p.id}
                                player={p}
                                delay={1000 + (i * 400)}
                                onReady={(pts) => handlePlayerReady(p.id, pts)}
                            />
                        ))}
                    </View>

                    {/* RIGHT COLUMN/BOTTOM AREA: RESULT BOX */}
                    <View style={[styles.resultSide, isLandscape && styles.resultSideLandscape]}>
                        {status === 'RESULT' && (
                            <Animated.View entering={ZoomIn.springify()} style={[styles.resultBox, isLandscape && styles.resultBoxLandscape]}>
                                {winnerId === 'TIE' ? (
                                    <>
                                        <Text style={[styles.tieText, isLandscape && styles.tieTextLandscape]}>ÉGALITÉ !</Text>
                                        <Text style={styles.matchNulText}>La partie est nulle et doit être refaite.</Text>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.winnerLabel}>VAINQUEUR AU POINTS</Text>
                                        <Text style={[styles.winnerName, isLandscape && styles.winnerNameLandscape]}>{winner?.name} 🏆</Text>
                                    </>
                                )}

                                <Animated.View entering={FadeIn.delay(600)}>
                                    <TouchableOpacity
                                        style={[styles.footerButton, isLandscape && styles.footerButtonLandscape]}
                                        onPress={() => onFinished(winnerId)}
                                    >
                                        <Text style={styles.buttonText}>CONTINUER</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            </Animated.View>
                        )}
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        zIndex: 10000,
    },
    containerLandscape: {
        paddingVertical: 5,
        paddingHorizontal: 20,
        justifyContent: 'flex-start',
    },
    headerPortrait: {
        alignItems: 'center',
        marginBottom: 20,
    },
    headerLandscape: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 10,
        gap: 20,
    },
    mainLayout: {
        width: '100%',
        alignItems: 'center',
    },
    mainLayoutLandscape: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1,
        paddingBottom: 20,
    },
    title: {
        fontSize: 48,
        fontWeight: '900',
        color: '#FFD700',
        letterSpacing: 4,
        textAlign: 'center',
        textShadowColor: 'rgba(255, 215, 0, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    titleLandscape: {
        fontSize: 32,
        letterSpacing: 2,
    },
    subtitle: {
        color: '#AAA',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 2,
        textAlign: 'center',
    },
    subtitleLandscape: {
        fontSize: 12,
    },
    list: {
        width: '100%',
        maxWidth: 400,
        gap: 10,
    },
    listLandscape: {
        flex: 1,
        maxWidth: '48%',
        justifyContent: 'center',
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 10,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    avatarMini: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    infoContainer: {
        flex: 1,
        marginLeft: 10,
    },
    playerName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    handPreview: {
        flexDirection: 'row',
        marginTop: 4,
        gap: 3,
        flexWrap: 'wrap',
    },
    miniDomino: {
        backgroundColor: '#EEE',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 3,
    },
    miniText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#333',
    },
    scoreBadge: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 50,
    },
    scoreText: {
        color: '#FFD700',
        fontSize: 24,
        fontWeight: '900',
    },
    ptsLabel: {
        color: '#FFD700',
        fontSize: 9,
        fontWeight: 'bold',
        marginTop: -4,
    },
    resultSide: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        minHeight: 120,
    },
    resultSideLandscape: {
        flex: 1,
        maxWidth: '48%',
        marginLeft: 20,
        marginTop: 0,
        minHeight: 'auto',
    },
    resultBox: {
        width: '100%',
        backgroundColor: 'rgba(255, 215, 0, 0.08)',
        padding: 25,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#FFD700',
        alignItems: 'center',
    },
    resultBoxLandscape: {
        padding: 20,
    },
    winnerLabel: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    winnerName: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: '900',
        marginTop: 2,
        textAlign: 'center',
    },
    winnerNameLandscape: {
        fontSize: 24,
    },
    tieText: {
        color: '#FF4500',
        fontSize: 28,
        fontWeight: '900',
    },
    tieTextLandscape: {
        fontSize: 24,
    },
    matchNulText: {
        color: '#FFF',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 5,
        opacity: 0.8,
    },
    footerButton: {
        marginTop: 20,
        backgroundColor: '#FFD700',
        paddingHorizontal: 35,
        paddingVertical: 12,
        borderRadius: 25,
    },
    footerButtonLandscape: {
        marginTop: 15,
        paddingVertical: 10,
    },
    buttonText: {
        color: '#1a0a2e',
        fontWeight: '900',
        fontSize: 14,
    }
});
