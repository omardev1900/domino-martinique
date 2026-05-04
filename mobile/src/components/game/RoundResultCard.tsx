import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, useReducedMotion } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { GameState, Domino } from '../../core/types';
import { getAvatarImage, AvatarId } from '../../core/avatars';
import { DominoTile } from '../DominoTile';
import SoundManager from '../../core/audio/SoundManager';

// ─── Props ───────────────────────────────────────────────────────────────────

interface RoundResultCardProps {
    gameState: GameState;
    visible: boolean;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const RoundResultCard: React.FC<RoundResultCardProps> = ({ gameState, visible }) => {
    const reducedMotion = useReducedMotion();
    const { width, height } = useWindowDimensions();
    const isCompactMobile = width < 430 || height < 760;
    const lastPlayedPhase = useRef<string | null>(null);

    useEffect(() => {
        if (!visible) return;
        if (lastPlayedPhase.current === gameState.phase) return;

        lastPlayedPhase.current = gameState.phase;

        if (gameState.phase === 'PARTIE_END') {
            SoundManager.playSound('roundEnd');
        } else if (gameState.phase === 'MANCHE_END' || gameState.phase === 'BOUDE') {
            SoundManager.playSound('mancheEnd');
        } else if (gameState.phase === 'MATCH_END') {
            SoundManager.playSound('matchEnd');
        }
    }, [visible, gameState.phase]);

    if (!visible) return null;

    const handScore = (hand: Domino[]) => hand.reduce((s, d) => s + d.left + d.right, 0);

    // Pendant BOUDE : firstPlayerOfRound pas encore mis à jour → calculer depuis les mains
    const winner = (() => {
        if (gameState.phase === 'BOUDE') {
            const minScore = Math.min(...gameState.players.map(p => handScore(p.hand)));
            const winners = gameState.players.filter(p => handScore(p.hand) === minScore);
            return winners.length === 1 ? winners[0] : null; // null = égalité
        }
        return gameState.players.find(p => p.id === gameState.firstPlayerOfRound) ?? null;
    })();

    // Si égalité BOUDE → render spécial sans gagnant
    const isTie = winner === null;
    if (isTie) {
        const accentColor = '#4A90E2'; // bleu = égalité
        return (
            <Animated.View entering={reducedMotion ? undefined : FadeIn.duration(300)} exiting={reducedMotion ? undefined : FadeOut.duration(400)} style={styles.overlay} pointerEvents="none">
                <Animated.View entering={reducedMotion ? undefined : ZoomIn.duration(450).springify()} style={[styles.card, { borderColor: accentColor + '80' }]}>
                    <View style={[styles.headerTag, { backgroundColor: accentColor + '18', borderColor: accentColor + '45' }]}>
                        <Text style={[styles.headerTagText, { color: accentColor }]}>⚖️ PARTIE BLOQUÉE — ÉGALITÉ</Text>
                    </View>
                    <ScrollView style={{ maxHeight: '100%' }} contentContainerStyle={styles.tieBody} showsVerticalScrollIndicator={false}>
                        <Text style={[styles.tieTitle, { color: accentColor }]}>Les joueurs restent à égalité sur cette partie bloquée.</Text>
                        <View style={styles.tieRows}>
                            {gameState.players.map(p => (
                                <View key={p.id} style={styles.tiePlayerRow}>
                                    <Text style={styles.tiePlayerName} numberOfLines={1}>
                                        {p.name} <Text style={[styles.scoreInline, { color: accentColor }]}>({handScore(p.hand)})</Text>
                                    </Text>
                                    <View style={styles.tieHandRow}>
                                        {p.hand.map((d, i) => (
                                            <DominoTile
                                                key={i}
                                                left={d.left as any}
                                                right={d.right as any}
                                                size={40}
                                                orientation="vertical"
                                                disabled
                                                noMargin
                                            />
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </Animated.View>
            </Animated.View>
        );
    }


    // À ce point, TypeScript sait que winner est non-null
    // Determine scenario: normal win (hand empty) vs bouded win (all players have tiles)
    const isNormalWin = winner.hand.length === 0;
    const isBoudedWin = !isNormalWin;

    // Last domino played (last PLAY action in history)
    const lastDomino = [...(gameState.history ?? [])]
        .reverse()
        .find(h => h.action === 'PLAY' && h.domino)?.domino ?? null;

    // Losers + score helper
    const losers = gameState.players.filter(p => p.id !== winner.id);
    const handScore2 = (hand: Domino[]) => hand.reduce((s, d) => s + d.left + d.right, 0);
    // Scenario-based styling
    const accentColor = isNormalWin ? '#FFD700' : '#FF8C00';
    const headerLabel = isNormalWin ? '✦ Résultat ✦' : '🔒 Partie bloquée';

    if (isNormalWin) {
        const heroAvatarSize = isCompactMobile ? 56 : 68;
        const lastDominoSize = isCompactMobile ? 42 : 54;
        const loserDominoSize = isCompactMobile ? 28 : 32;

        return (
            <Animated.View
                entering={reducedMotion ? undefined : FadeIn.duration(300)}
                exiting={reducedMotion ? undefined : FadeOut.duration(400)}
                style={styles.overlay}
                pointerEvents="none"
            >
                <Animated.View
                    entering={reducedMotion ? undefined : ZoomIn.duration(450).springify()}
                    style={[
                        styles.card,
                        styles.heroCard,
                        isCompactMobile && styles.heroCardCompact,
                        { borderColor: accentColor + '80' },
                    ]}
                >
                    <View style={[styles.headerTag, {
                        backgroundColor: accentColor + '18',
                        borderColor: accentColor + '45',
                    }]}>
                        <Text style={[styles.headerTagText, { color: accentColor }]}>
                            FIN DU ROUND
                        </Text>
                    </View>

                    {isCompactMobile ? (
                        <View style={styles.heroCompactStage}>
                            <View style={styles.heroCompactSide}>
                                {losers[0] && (
                                    <View style={[styles.heroLoserChip, styles.heroLoserChipCompact]}>
                                        <Text style={[styles.heroLoserName, styles.heroLoserNameCompact]} numberOfLines={1}>
                                            {losers[0].name}
                                        </Text>
                                        <View style={styles.heroLoserHand}>
                                            {losers[0].hand.map((d, i) => (
                                                <DominoTile
                                                    key={i}
                                                    left={d.left as any}
                                                    right={d.right as any}
                                                    size={loserDominoSize}
                                                    orientation="vertical"
                                                    disabled
                                                    noMargin
                                                />
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </View>

                            <View style={[styles.heroBody, styles.heroBodyCompact, styles.heroCenterColumn]}>
                                <View style={styles.heroAvatarWrap}>
                                    <Image
                                        source={getAvatarImage((winner.avatarId as AvatarId) || 'avatar_default')}
                                        style={[
                                            styles.heroAvatar,
                                            {
                                                width: heroAvatarSize,
                                                height: heroAvatarSize,
                                                borderRadius: heroAvatarSize / 2,
                                            },
                                        ]}
                                        contentFit="cover"
                                    />
                                    <Text style={[styles.heroCrown, styles.heroCrownCompact]}>👑</Text>
                                </View>

                                <Text style={[styles.heroWinnerName, styles.heroWinnerNameCompact]}>{winner.name}</Text>
                                <Text style={[styles.heroWinText, styles.heroWinTextCompact]}>A POSÉ TOUS SES DOMINOS</Text>

                                {lastDomino && (
                                    <View style={[styles.heroLastDominoBlock, styles.heroLastDominoBlockCompact]}>
                                        <Text style={[styles.heroLastDominoLabel, styles.heroLastDominoLabelCompact]}>Dernier domino posé</Text>
                                        <DominoTile
                                            left={lastDomino.left as any}
                                            right={lastDomino.right as any}
                                            size={lastDominoSize}
                                            orientation="vertical"
                                            disabled
                                            noMargin
                                        />
                                    </View>
                                )}
                            </View>

                            <View style={styles.heroCompactSide}>
                                {losers[1] && (
                                    <View style={[styles.heroLoserChip, styles.heroLoserChipCompact]}>
                                        <Text style={[styles.heroLoserName, styles.heroLoserNameCompact]} numberOfLines={1}>
                                            {losers[1].name}
                                        </Text>
                                        <View style={styles.heroLoserHand}>
                                            {losers[1].hand.map((d, i) => (
                                                <DominoTile
                                                    key={i}
                                                    left={d.left as any}
                                                    right={d.right as any}
                                                    size={loserDominoSize}
                                                    orientation="vertical"
                                                    disabled
                                                    noMargin
                                                />
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.heroBody}>
                            <View style={styles.heroAvatarWrap}>
                                <Image
                                    source={getAvatarImage((winner.avatarId as AvatarId) || 'avatar_default')}
                                    style={[
                                        styles.heroAvatar,
                                        {
                                            width: heroAvatarSize,
                                            height: heroAvatarSize,
                                            borderRadius: heroAvatarSize / 2,
                                        },
                                    ]}
                                    contentFit="cover"
                                />
                                <Text style={styles.heroCrown}>👑</Text>
                            </View>

                            <Text style={styles.heroWinnerName}>{winner.name}</Text>
                            <Text style={styles.heroWinText}>A POSÉ TOUS SES DOMINOS</Text>

                            {lastDomino && (
                                <View style={styles.heroLastDominoBlock}>
                                    <Text style={styles.heroLastDominoLabel}>Dernier domino posé</Text>
                                    <DominoTile
                                        left={lastDomino.left as any}
                                        right={lastDomino.right as any}
                                        size={lastDominoSize}
                                        orientation="vertical"
                                        disabled
                                        noMargin
                                    />
                                </View>
                            )}

                            {losers.length > 0 && (
                                <View style={styles.heroLosersRow}>
                                    {losers.map((loser) => (
                                        <View key={loser.id} style={styles.heroLoserChip}>
                                            <Text style={styles.heroLoserName} numberOfLines={1}>
                                                {loser.name}
                                            </Text>
                                            <View style={styles.heroLoserHand}>
                                                {loser.hand.map((d, i) => (
                                                    <DominoTile
                                                        key={i}
                                                        left={d.left as any}
                                                        right={d.right as any}
                                                        size={loserDominoSize}
                                                        orientation="vertical"
                                                        disabled
                                                        noMargin
                                                    />
                                                ))}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </Animated.View>
            </Animated.View>
        );
    }

    // isBoudedWin: layout 3 colonnes — perdant | gagnant (centre, grand) | perdant
    const heroAvatarSizeB = isCompactMobile ? 52 : 64;
    const loserDominoSizeB = isCompactMobile ? 26 : 30;
    const winnerDominoSizeB = isCompactMobile ? 34 : 40;

    return (
        <Animated.View
            entering={reducedMotion ? undefined : FadeIn.duration(300)}
            exiting={reducedMotion ? undefined : FadeOut.duration(400)}
            style={styles.overlay}
            pointerEvents="none"
        >
            <Animated.View
                entering={reducedMotion ? undefined : ZoomIn.duration(450).springify()}
                style={[styles.card, styles.heroCard, isCompactMobile && styles.heroCardCompact, { borderColor: accentColor + '80' }]}
            >
                <View style={[styles.headerTag, { backgroundColor: accentColor + '18', borderColor: accentColor + '45' }]}>
                    <Text style={[styles.headerTagText, { color: accentColor }]}>
                        🔒 PARTIE BLOQUÉE
                    </Text>
                </View>

                <View style={styles.heroCompactStage}>
                    {/* ── Perdant gauche ── */}
                    <View style={styles.heroCompactSide}>
                        {losers[0] && (
                            <View style={[styles.heroLoserChip, isCompactMobile && styles.heroLoserChipCompact]}>
                                <Text style={[styles.heroLoserName, isCompactMobile && styles.heroLoserNameCompact]} numberOfLines={1}>
                                    {losers[0].name}
                                </Text>
                                <Text style={[styles.boudedScore, { color: accentColor }]}>
                                    {handScore2(losers[0].hand)} pts
                                </Text>
                                <View style={styles.heroLoserHand}>
                                    {losers[0].hand.map((d, i) => (
                                        <DominoTile
                                            key={i}
                                            left={d.left as any}
                                            right={d.right as any}
                                            size={loserDominoSizeB}
                                            orientation="vertical"
                                            disabled
                                            noMargin
                                        />
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* ── Gagnant centre ── */}
                    <View style={[styles.heroBody, isCompactMobile && styles.heroBodyCompact, styles.heroCenterColumn]}>
                        <View style={styles.heroAvatarWrap}>
                            <Image
                                source={getAvatarImage((winner.avatarId as AvatarId) || 'avatar_default')}
                                style={[
                                    styles.heroAvatar,
                                    {
                                        width: heroAvatarSizeB,
                                        height: heroAvatarSizeB,
                                        borderRadius: heroAvatarSizeB / 2,
                                        borderColor: accentColor,
                                    },
                                ]}
                                contentFit="cover"
                            />
                            <Text style={[styles.heroCrown, isCompactMobile && styles.heroCrownCompact]}>👑</Text>
                        </View>

                        <Text style={[styles.heroWinnerName, isCompactMobile && styles.heroWinnerNameCompact]}>
                            {winner.name}
                        </Text>
                        <Text style={[styles.heroWinText, { color: accentColor }, isCompactMobile && styles.heroWinTextCompact]}>
                            {handScore2(winner.hand)} PTS — LE MOINS
                        </Text>

                        <View style={[styles.heroLoserHand, { marginTop: 6 }]}>
                            {winner.hand.map((d, i) => (
                                <DominoTile
                                    key={i}
                                    left={d.left as any}
                                    right={d.right as any}
                                    size={winnerDominoSizeB}
                                    orientation="vertical"
                                    disabled
                                    noMargin
                                />
                            ))}
                        </View>
                    </View>

                    {/* ── Perdant droite ── */}
                    <View style={styles.heroCompactSide}>
                        {losers[1] && (
                            <View style={[styles.heroLoserChip, isCompactMobile && styles.heroLoserChipCompact]}>
                                <Text style={[styles.heroLoserName, isCompactMobile && styles.heroLoserNameCompact]} numberOfLines={1}>
                                    {losers[1].name}
                                </Text>
                                <Text style={[styles.boudedScore, { color: accentColor }]}>
                                    {handScore2(losers[1].hand)} pts
                                </Text>
                                <View style={styles.heroLoserHand}>
                                    {losers[1].hand.map((d, i) => (
                                        <DominoTile
                                            key={i}
                                            left={d.left as any}
                                            right={d.right as any}
                                            size={loserDominoSizeB}
                                            orientation="vertical"
                                            disabled
                                            noMargin
                                        />
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Animated.View>
        </Animated.View>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1500,
    },
    card: {
        width: '92%',
        height: '82%',
        maxWidth: 780,
        backgroundColor: 'rgba(6, 10, 6, 0.95)',
        borderRadius: 22,
        borderWidth: 1.5,
        overflow: 'hidden',
    },
    heroCard: {
        height: 'auto',
        maxHeight: '88%',
        maxWidth: 720,
        paddingBottom: 14,
    },
    heroCardCompact: {
        maxHeight: '82%',
        width: '94%',
    },
    headerTag: {
        alignSelf: 'center',
        marginTop: 10,
        paddingHorizontal: 16,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 10,
    },
    headerTagText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 3,
    },
    body: {
        flexDirection: 'row',
        paddingHorizontal: 18,
        paddingBottom: 14,
        alignItems: 'flex-start',
    },
    heroBody: {
        paddingHorizontal: 18,
        alignItems: 'center',
        gap: 8,
    },
    heroBodyCompact: {
        paddingHorizontal: 12,
        gap: 6,
    },
    heroCompactStage: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        gap: 6,
    },
    heroCompactSide: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroCenterColumn: {
        flex: 1.2,
        paddingHorizontal: 4,
    },
    heroAvatarWrap: {
        position: 'relative',
        marginTop: 2,
    },
    heroAvatar: {
        width: 68,
        height: 68,
        borderRadius: 34,
        borderWidth: 2.5,
        borderColor: '#FFD700',
    },
    heroCrown: {
        position: 'absolute',
        top: -14,
        right: -7,
        fontSize: 22,
        textShadowColor: 'rgba(255,215,0,0.45)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    heroCrownCompact: {
        top: -12,
        right: -6,
        fontSize: 18,
    },
    heroWinnerName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    heroWinnerNameCompact: {
        fontSize: 20,
    },
    heroWinText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#FFD700',
        textAlign: 'center',
        letterSpacing: 0.8,
        lineHeight: 18,
        paddingHorizontal: 8,
    },
    heroWinTextCompact: {
        fontSize: 13,
        lineHeight: 16,
        letterSpacing: 0.5,
    },
    heroLastDominoBlock: {
        alignItems: 'center',
        gap: 6,
        marginTop: 0,
    },
    heroLastDominoBlockCompact: {
        gap: 4,
    },
    heroLastDominoLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.55)',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    heroLastDominoLabelCompact: {
        fontSize: 9,
    },
    heroLosersRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 2,
    },
    heroLosersRowCompact: {
        gap: 6,
        marginTop: 0,
    },
    heroLoserChip: {
        minWidth: 126,
        maxWidth: 170,
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.09)',
        alignItems: 'center',
        gap: 4,
    },
    heroLoserChipCompact: {
        minWidth: 86,
        maxWidth: 104,
        paddingHorizontal: 6,
        paddingVertical: 6,
    },
    heroLoserName: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.85)',
    },
    heroLoserNameCompact: {
        fontSize: 11,
    },
    heroLoserHand: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 4,
    },
    tieBody: {
        paddingHorizontal: 18,
        paddingBottom: 18,
        gap: 12,
    },
    tieTitle: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    tieRows: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    tiePlayerRow: {
        width: 220,
        minHeight: 150,
        padding: 12,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(74,144,226,0.18)',
        gap: 8,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    tiePlayerName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    tieHandRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    // Left
    leftCol: {
        flex: 1,
        alignItems: 'center',
        paddingRight: 12,
        gap: 10,
    },
    winnerName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    lastDominoSection: {
        alignItems: 'center',
        marginTop: 10,
        gap: 8,
    },
    subLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    boudedWinner: {
        alignItems: 'center',
        marginTop: 8,
        gap: 8,
    },
    winnerScoreInline: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    handRowCompact: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 4,
        justifyContent: 'flex-start',
    },
    // Divider
    verticalDivider: {
        width: 1,
        alignSelf: 'stretch',
        marginVertical: 4,
    },
    // Right
    rightCol: {
        flex: 1.35,
        paddingLeft: 14,
        gap: 12,
    },
    loserRowCompact: {
        gap: 4,
        marginBottom: 8,
    },
    loserName: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.85)',
    },
    scoreInline: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    boudedScore: {
        fontSize: 13,
        fontWeight: '700',
        marginTop: 2,
    },
});
