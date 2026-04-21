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
                            <Text style={[styles.victoryLabel, { color: accentColor }]}>AUCUN VAINQUEUR</Text>
                            <Text style={[styles.winnerName, { fontSize: 14, opacity: 0.7 }]}>Scores identiques</Text>
                        </View>
                        <View style={[styles.verticalDivider, { backgroundColor: accentColor + '35' }]} />
                        <View style={styles.rightCol}>
                            <Text style={[styles.rightTitle, { color: accentColor }]}>MAINS DES JOUEURS</Text>
                            {gameState.players.map(p => (
                                <View key={p.id} style={styles.loserRowCompact}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={styles.loserName} numberOfLines={1}>{p.name}</Text>
                                        <Text style={[styles.scoreChipText, { color: accentColor, fontSize: 10 }]}>
                                            {handScore(p.hand)} pts
                                        </Text>
                                    </View>
                                    <View style={styles.handRowCompact}>
                                        {p.hand.slice(0, 4).map((d, i) => (
                                            <DominoTile
                                                key={i}
                                                left={d.left as any}
                                                right={d.right as any}
                                                size={22}
                                                orientation="vertical"
                                                disabled
                                                noMargin
                                            />
                                        ))}
                                        {p.hand.length > 4 && (
                                            <Text style={styles.moreLabel}>+{p.hand.length - 4}</Text>
                                        )}
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
    const victoryLabel = isNormalWin ? 'VICTOIRE DE' : 'VICTOIRE PAR DÉFAUT';
    const rightTitle = isNormalWin ? 'MAINS RESTANTES' : 'SCORES DES MAINS';

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
                        <Text style={[styles.victoryLabel, { color: accentColor }]}>
                            {victoryLabel}
                        </Text>
                        <Text style={styles.winnerName} numberOfLines={1}>
                            {winner.name}
                        </Text>

                        {isNormalWin && lastDomino && (
                            <View style={styles.lastDominoSection}>
                                <Text style={styles.subLabel}>DERNIER COUP</Text>
                                {/* Réutilisation exacte du composant plateau — vertical, grande taille */}
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
                                <Text style={[styles.boudedScore, { color: accentColor }]}>
                                    {handScore2(winner.hand)} pts
                                </Text>
                                <Text style={styles.subLabel}>dans la main</Text>
                                <View style={styles.handRowCompact}>
                                    {winner.hand.slice(0, 4).map((d, i) => (
                                        <DominoTile
                                            key={i}
                                            left={d.left as any}
                                            right={d.right as any}
                                            size={22}
                                            orientation="vertical"
                                            disabled
                                            noMargin
                                        />
                                    ))}
                                    {winner.hand.length > 4 && (
                                        <Text style={styles.moreLabel}>+{winner.hand.length - 4}</Text>
                                    )}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* ── Divider ── */}
                    <View style={[styles.verticalDivider, { backgroundColor: accentColor + '35' }]} />

                    {/* ── Right column: Losers ── */}
                    <View style={styles.rightCol}>
                        <Text style={[styles.rightTitle, { color: accentColor }]}>
                            {rightTitle}
                        </Text>

                        {losers.map(loser => (
                            <View key={loser.id} style={styles.loserRowCompact}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={styles.loserName} numberOfLines={1}>
                                        {loser.name}
                                    </Text>
                                    {isBoudedWin && (
                                        <Text style={[styles.scoreChipText, { color: accentColor, fontSize: 10 }]}>
                                            {handScore2(loser.hand)} pts
                                        </Text>
                                    )}
                                </View>

                                <View style={styles.handRowCompact}>
                                    {loser.hand.slice(0, 4).map((d, i) => (
                                        <DominoTile
                                            key={i}
                                            left={d.left as any}
                                            right={d.right as any}
                                            size={22}
                                            orientation="vertical"
                                            disabled
                                            noMargin
                                        />
                                    ))}
                                    {loser.hand.length > 4 && (
                                        <Text style={styles.moreLabel}>+{loser.hand.length - 4}</Text>
                                    )}
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
        width: '90%',
        maxWidth: 500,
        maxHeight: '95%',
        backgroundColor: 'rgba(6, 10, 6, 0.92)',
        borderRadius: 22,
        borderWidth: 1.5,
        overflow: 'hidden',
    },
    headerTag: {
        alignSelf: 'center',
        marginTop: 6,
        paddingHorizontal: 12,
        paddingVertical: 3,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 4,
    },
    headerTagText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 3,
    },
    body: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingBottom: 8,
        alignItems: 'flex-start',
    },
    // Left
    leftCol: {
        flex: 1,
        alignItems: 'center',
        paddingRight: 10,
        gap: 6,
    },
    victoryLabel: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 2,
        textTransform: 'uppercase',
        opacity: 0.9,
    },
    winnerName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    lastDominoSection: {
        alignItems: 'center',
        marginTop: 8,
        gap: 6,
    },
    subLabel: {
        fontSize: 9,
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 1,
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    boudedWinner: {
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    boudedScore: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    handRowCompact: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 2,
        marginTop: 0,
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
        flex: 1.25,
        paddingLeft: 10,
        gap: 6,
    },
    rightTitle: {
        fontSize: 8.5,
        fontWeight: '700',
        letterSpacing: 2,
        textTransform: 'uppercase',
        opacity: 0.9,
        marginBottom: 2,
    },
    loserRowCompact: {
        gap: 1,
        marginBottom: 4,
    },
    loserName: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
    },
    scoreChip: {
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignSelf: 'flex-start',
    },
    scoreChipText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    moreLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        alignSelf: 'center',
        marginLeft: 2,
    },
});
