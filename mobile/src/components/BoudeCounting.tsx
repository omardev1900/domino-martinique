import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity, Image, Platform } from 'react-native';
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
import { DominoTile } from './DominoTile';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface BoudeCountingProps {
    players: Player[];
    onFinished: (winnerId: string | 'TIE') => void;
}

const PlayerScoreCard = ({ player, delay, isWinner, onReady }: { player: Player, delay: number, isWinner: boolean, onReady: (pts: number) => void }) => {
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
            entering={ZoomIn.delay(delay).duration(600)}
            style={[styles.podiumCard, isWinner && styles.podiumCardWinner, styles.boudeCard]}
        >
            {isWinner && (
                <View style={styles.winnerBadge}>
                    <Text style={styles.winnerBadgeText}>VAINQUEUR</Text>
                </View>
            )}

            <Image
                source={getAvatarImage((player.avatarId as AvatarId) || 'avatar_default')}
                style={[styles.podiumAvatar, isWinner && styles.podiumAvatarWinner]}
            />

            <Text style={styles.podiumName} numberOfLines={1}>{player.name}</Text>

            <View style={styles.scoreContainer}>
                <Text style={[styles.boudePoints, isWinner ? styles.pointsWinner : styles.pointsLoser]}>
                    {displayCount}
                </Text>
                <Text style={[styles.ptsLabel, isWinner ? styles.pointsWinner : styles.pointsLoser]}>pts</Text>
            </View>

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

export const BoudeCounting: React.FC<BoudeCountingProps> = ({ players, onFinished }) => {
    const { height, width } = useWindowDimensions();
    const isLandscape = width > height;
    const [readyPlayers, setReadyPlayers] = useState<Record<string, number>>({});
    const [status, setStatus] = useState<'COUNTING' | 'RESULT'>('COUNTING');

    // Determine winner
    const winnerId = determineWinnerOnBoudé(players);
    const isTie = winnerId === 'TIE';

    const handlePlayerReady = (id: string, pts: number) => {
        setReadyPlayers(prev => {
            const next = { ...prev, [id]: pts };
            if (Object.keys(next).length === players.length) {
                setStatus('RESULT');
            }
            return next;
        });
    };

    // Sort players for podium [P2, P1, P3]
    let sortedPlayers = [...players];
    if (players.length === 3) {
        const p1 = players.find(p => p.id === winnerId) || players[0];
        const others = players.filter(p => p.id !== p1.id);
        sortedPlayers = [others[0], p1, others[1]];
    }

    return (
        <View style={StyleSheet.absoluteFill}>
            <BlurView intensity={Platform.OS === 'ios' ? 30 : 100} tint="dark" style={StyleSheet.absoluteFill} />

            <View style={styles.podiumContainer}>
                <Animated.Text entering={FadeIn.duration(800)} style={styles.podiumHeader}>
                    {isTie ? "ÉGALITÉ PARFAITE !" : "PARTIE BLOQUÉE !"}
                </Animated.Text>

                <View style={styles.podiumRow}>
                    {sortedPlayers.map((p, i) => (
                        <PlayerScoreCard
                            key={p.id}
                            player={p}
                            isWinner={p.id === winnerId}
                            delay={400 + (i * 300)}
                            onReady={(pts) => handlePlayerReady(p.id, pts)}
                        />
                    ))}
                </View>

                {status === 'RESULT' && (
                    <Animated.View entering={FadeIn.delay(200)} style={styles.buttonRow}>
                        <TouchableOpacity
                            style={styles.newGameButton}
                            onPress={() => onFinished(winnerId as any)}
                        >
                            <Text style={styles.buttonTextDark}>CONTINUER</Text>
                            <Ionicons name="arrow-forward" size={20} color="#064e3b" />
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    podiumContainer: {
        flex: 1,
        width: '100%',
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    podiumHeader: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 30,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
        textTransform: 'uppercase',
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
        width: 180,
        backgroundColor: 'rgba(230, 230, 230, 0.9)', // Premium Light Gray
        borderRadius: 16,
        padding: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        height: 220,
    },
    podiumCardWinner: {
        width: 200,
        height: 260,
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
    boudeCard: {
        height: 480, // Taller for tripled dominoes
        justifyContent: 'flex-start',
        paddingTop: 20,
    },
    winnerBadge: {
        position: 'absolute',
        top: -15,
        backgroundColor: '#DC2626',
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
    podiumAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        marginBottom: 10,
    },
    podiumAvatarWinner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderColor: '#FFD700',
    },
    podiumName: {
        color: '#064e3b', // Dark green
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    boudePoints: {
        fontSize: 28,
        fontWeight: '900',
    },
    pointsWinner: {
        color: '#059669', // Darker green
    },
    pointsLoser: {
        color: '#374151', // Dark UI Gray
    },
    ptsLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#374151',
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
    buttonRow: {
        flexDirection: 'row',
        gap: 20,
        marginTop: 10,
    },
    newGameButton: {
        backgroundColor: '#4ADE80',
        paddingHorizontal: 40,
        paddingVertical: 14,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        shadowColor: '#4ADE80',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonTextDark: {
        color: '#064e3b',
        fontWeight: '800',
        fontSize: 18,
    },
});
