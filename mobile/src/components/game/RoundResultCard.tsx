import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, useReducedMotion } from 'react-native-reanimated';
import { GameState, Domino } from '../../core/types';
import { DominoTile } from '../DominoTile';

// ─── Props ───────────────────────────────────────────────────────────────────

interface RoundResultCardProps {
    gameState: GameState;
    visible: boolean;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const RoundResultCard: React.FC<RoundResultCardProps> = ({ gameState, visible }) => {
    const reducedMotion = useReducedMotion();

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
                    <ScrollView style={{ maxHeight: '100%' }} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                        <View style={styles.leftCol}>
                            <Text style={[styles.winnerName, { color: accentColor }]}>Scores identiques</Text>
                        </View>
                        <View style={[styles.verticalDivider, { backgroundColor: accentColor + '35' }]} />
                        <View style={styles.rightCol}>
                            {gameState.players.map(p => (
                                <View key={p.id} style={styles.loserRowCompact}>
                                    <Text style={styles.loserName} numberOfLines={1}>
                                        {p.name} <Text style={[styles.scoreInline, { color: accentColor }]}>({handScore(p.hand)})</Text>
                                    </Text>
                                    <View style={styles.handRowCompact}>
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

    return (
        <Animated.View
            entering={reducedMotion ? undefined : FadeIn.duration(300)}
            exiting={reducedMotion ? undefined : FadeOut.duration(400)}
            style={styles.overlay}
            pointerEvents="none"
        >
            <Animated.View
                entering={reducedMotion ? undefined : ZoomIn.duration(450).springify()}
                style={[styles.card, { borderColor: accentColor + '80' }]}
            >
                {/* ── Header tag ── */}
                <View style={[styles.headerTag, {
                    backgroundColor: accentColor + '18',
                    borderColor: accentColor + '45',
                }]}>
                    <Text style={[styles.headerTagText, { color: accentColor }]}>
                        {headerLabel.toUpperCase()}
                    </Text>
                </View>

                <ScrollView style={{ maxHeight: '100%' }} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                    {/* ── Left column: Winner ── */}
                    <View style={styles.leftCol}>
                        <Text style={styles.winnerName} numberOfLines={1}>
                            👑 {winner.name}
                            {isBoudedWin && (
                                <Text style={[styles.winnerScoreInline, { color: accentColor }]}>
                                    {' '}({handScore2(winner.hand)})
                                </Text>
                            )}
                        </Text>

                        {isNormalWin && lastDomino && (
                            <View style={styles.lastDominoSection}>
                                <Text style={styles.subLabel}>DERNIER COUP</Text>
                                <DominoTile
                                    left={lastDomino.left as any}
                                    right={lastDomino.right as any}
                                    size={52}
                                    orientation="vertical"
                                    disabled
                                    noMargin
                                />
                            </View>
                        )}

                        {isBoudedWin && (
                            <View style={styles.boudedWinner}>
                                <View style={styles.handRowCompact}>
                                    {winner.hand.map((d, i) => (
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
                        )}
                    </View>

                    {/* ── Divider ── */}
                    <View style={[styles.verticalDivider, { backgroundColor: accentColor + '35' }]} />

                    {/* ── Right column: Losers ── */}
                    <View style={styles.rightCol}>
                        {losers.map(loser => (
                            <View key={loser.id} style={styles.loserRowCompact}>
                                <Text style={styles.loserName} numberOfLines={1}>
                                    {loser.name}
                                    {isBoudedWin && (
                                        <Text style={[styles.scoreInline, { color: accentColor }]}>
                                            {' '}({handScore2(loser.hand)})
                                        </Text>
                                    )}
                                </Text>

                                <View style={styles.handRowCompact}>
                                    {loser.hand.map((d, i) => (
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
});
