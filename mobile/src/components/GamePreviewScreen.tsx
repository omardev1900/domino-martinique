import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Button } from 'react-native';
import { Domino, Player, GameState, DominoSide } from '@/core/types';
import { DominoTile as DominoComponent } from './DominoTile';
import { PlayerHand } from './PlayerHand';
import { GameTable } from './GameTable';

// Mock Data
const mockDominoes: Domino[] = [
    { id: '1', left: 1, right: 6, isDouble: false, sum: 7 },
    { id: '2', left: 6, right: 6, isDouble: true, sum: 12 },
    { id: '3', left: 2, right: 2, isDouble: true, sum: 4 },
    { id: '4', left: 0, right: 3, isDouble: false, sum: 3 },
    { id: '5', left: 4, right: 5, isDouble: false, sum: 9 },
    { id: '6', left: 5, right: 5, isDouble: true, sum: 10 },
    { id: '7', left: 3, right: 3, isDouble: true, sum: 6 },
];

const mockGameState: GameState = {
    gameId: 'test-game',
    players: [],
    talonMort: [],
    table: {
        sequence: [
            { domino: { id: 't1', left: 6, right: 6, isDouble: true, sum: 12 }, sideAtTable: 'left', isReversed: false },
            { domino: { id: 't2', left: 6, right: 0, isDouble: false, sum: 6 }, sideAtTable: 'right', isReversed: false },
            { domino: { id: 't3', left: 0, right: 2, isDouble: false, sum: 2 }, sideAtTable: 'right', isReversed: false },
        ],
        leftValue: 6,
        rightValue: 2,
    },
    currentPlayerId: 'p1',
    phase: 'PLAYING',
    firstPlayerOfRound: 'p1',
    history: [],
    winningCondition: 100,
    lastActionTimestamp: Date.now(),
};

export const GamePreviewScreen = () => {
    const [layout, setLayout] = useState<'straight' | 'curved'>('curved');
    const [hand, setHand] = useState<Domino[]>([]);

    useEffect(() => {
        // Simulate loading hand to trigger animation
        setTimeout(() => {
            setHand(mockDominoes);
        }, 500);
    }, []);

    const toggleLayout = () => {
        setLayout(prev => prev === 'straight' ? 'curved' : 'straight');
    };

    const refreshHand = () => {
        setHand([]);
        setTimeout(() => {
            setHand(mockDominoes);
        }, 100);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.header}>Game UI Components</Text>

                <Text style={styles.sectionTitle}>1. Single Dominoes (Premium Style)</Text>
                <View style={styles.row}>
                    <DominoComponent left={1} right={4} />
                    <View style={{ width: 10 }} />
                    <DominoComponent left={6} right={6} />
                    <View style={{ width: 10 }} />
                    <DominoComponent left={0} right={2} orientation="horizontal" />
                </View>

                <Text style={styles.sectionTitle}>2. Game Table</Text>
                <View style={styles.tableContainer}>
                    <GameTable gameState={mockGameState} />
                </View>

                <Text style={styles.sectionTitle}>3. Player Hand ({layout})</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                    <Button title="Toggle Layout" onPress={toggleLayout} />
                    <Button title="Re-animate" onPress={refreshHand} />
                </View>
                <View style={styles.handContainer}>
                    <PlayerHand
                        hand={hand}
                        onPlayDomino={() => { }}
                        disabled={false}
                    />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    scroll: {
        padding: 20,
        paddingBottom: 100,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    tableContainer: {
        height: 150,
        width: '100%',
        borderRadius: 8,
        overflow: 'hidden',
    },
    handContainer: {
        height: 250,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#e6e6e6',
        justifyContent: 'center', // Align for straight
        // check PlayerHand implementation for curved alignment
    }
});
