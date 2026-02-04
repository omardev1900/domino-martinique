import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, StatusBar, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { GameTable } from '../components/GameTable';
import { PlayerHand } from '../components/PlayerHand';
import { LobbyScreen } from './LobbyScreen';
import { GameOverScreen } from './GameOverScreen';
import { SettingsScreen } from './SettingsScreen';
import { dealGame, handleTurn, passTurn, checkValidMove, determineFirstPlayer } from '../core/LogicEngine';
import { getBotMove } from '../core/BotEngine';
import { GameState, Domino, Player, PlayerId, GameRoom, RoomStatus } from '../core/types';
import { subscribeToRoom, updateGameState, leaveRoom, startGame } from '../core/services/firebase';
import { Ionicons } from '@expo/vector-icons'; // Ensure you have this installed

export default function GameScreen({ gameId, userId }: { gameId?: string; userId?: string }) {
    const [roomData, setRoomData] = useState<GameRoom | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [localPlayerId] = useState<PlayerId>(userId || 'p1');
    const [showSettings, setShowSettings] = useState(false);

    // Firebase Subscription
    useEffect(() => {
        if (!gameId) {
            startNewLocalGame();
            return;
        }

        const unsubscribe = subscribeToRoom(gameId, (data) => {
            setRoomData(data);
            if (data.gameState) {
                setGameState(data.gameState);
            }
        });

        return () => {
            unsubscribe();
            if (userId) {
                leaveRoom(gameId, userId).catch(err => console.error("Failed to leave room", err));
            }
        };
    }, [gameId]);

    const startNewLocalGame = () => {
        const fullState = createInitialState(['Me', 'Bot 1', 'Bot 2']);
        fullState.players[1].isBot = true;
        fullState.players[2].isBot = true;
        setGameState(fullState);
    };

    const createInitialState = (playerNames: string[]): GameState => {
        const partialState = dealGame(playerNames);
        const players = partialState.players as Player[];

        // Determine who starts based on highest double (not room creator!)
        const firstPlayerId = determineFirstPlayer(players);

        return {
            gameId: gameId || 'local-1',
            players: players,
            talonMort: partialState.talonMort as Domino[],
            table: partialState.table!,
            currentPlayerId: firstPlayerId,
            phase: 'PLAYING',
            firstPlayerOfRound: null,
            history: [],
            winningCondition: 3,
            lastActionTimestamp: Date.now()
        };
    };

    const handleStartGame = async () => {
        if (!roomData || !gameId) return;

        const realPlayers = roomData.players;
        const playerNames = realPlayers.map(p => p.displayName);

        while (playerNames.length < 3) {
            playerNames.push(`Bot ${playerNames.length + 1}`);
        }

        try {
            const initialState = createInitialState(playerNames);
            initialState.players = initialState.players.map((p, i) => {
                if (i < realPlayers.length) {
                    return { ...p, id: realPlayers[i].uid, name: realPlayers[i].displayName, isBot: false };
                } else {
                    return { ...p, id: `bot-${i}`, name: `Bot ${i}`, isBot: true };
                }
            });
            // Re-determine first player after mapping real player IDs
            initialState.currentPlayerId = determineFirstPlayer(initialState.players);
            await startGame(gameId, initialState);
        } catch (e: any) {
            Alert.alert("Error", "Failed to start game: " + e.message);
        }
    };

    const handlePlayDomino = async (domino: Domino) => {
        if (!gameState) return;
        if (gameState.currentPlayerId !== localPlayerId) return;

        try {
            const newState = handleTurn(gameState, localPlayerId, domino);
            if (gameId) {
                await updateGameState(gameId, newState);
            } else {
                setGameState(newState);
            }
        } catch (e) {
            console.log("Invalid move", e);
        }
    };

    const handlePassTurn = async () => {
        if (!gameState) return;
        if (gameState.currentPlayerId !== localPlayerId) return;

        try {
            const newState = passTurn(gameState, localPlayerId);
            if (gameId) {
                await updateGameState(gameId, newState);
            } else {
                setGameState(newState);
            }
        } catch (e: any) {
            Alert.alert("Cannot Pass", e.message);
        }
    };



    const handleReplay = () => {
        if (gameId && roomData?.players[0].uid === userId) {
            // Logic to restart online game would go here (reset state)
            Alert.alert("Notice", "Replay logic for online not fully implemented yet.");
        } else {
            startNewLocalGame();
        }
    };

    // Bot Loop
    useEffect(() => {
        if (!gameState) return;
        if (!gameState.gameId.startsWith('local')) return;

        const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);

        if (currentPlayer?.isBot && (gameState.phase === 'PLAYING')) {
            const timer = setTimeout(() => {
                const move = getBotMove(
                    currentPlayer.hand,
                    gameState.table.leftValue,
                    gameState.table.rightValue
                );

                if (move) {
                    try {
                        const newState = handleTurn(gameState, currentPlayer.id, move);
                        setGameState(newState);
                    } catch (e) { console.error("Bot error"); }
                } else {
                    // Bot Pass logic - ideally call passTurn here
                    console.log(`Bot ${currentPlayer.name} passes`);
                    // Force rotation manually for now as passTurn isn't exported to GameScreen scope yet or handled in hook
                    const newState = { ...gameState };
                    const idx = gameState.players.findIndex(p => p.id === currentPlayer.id);
                    const nextIdx = (idx + 1) % 3;
                    newState.currentPlayerId = newState.players[nextIdx].id;
                    setGameState(newState);
                }
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [gameState?.currentPlayerId, gameState?.history.length]);


    // RENDER LOGIC

    if (!gameState) {
        if (!roomData) return <View style={styles.loading}><Text style={styles.text}>Loading...</Text></View>;
        return <LobbyScreen roomData={roomData} currentUserId={localPlayerId} onStartGame={handleStartGame} />;
    }

    const localPlayer = gameState.players.find(p => p.id === localPlayerId);
    const isGameOver = gameState.phase === 'MATCH_END' || gameState.phase === 'ROUND_END';

    const isMyTurn = gameState.currentPlayerId === localPlayerId;

    // Check if player has any valid move
    const canPlayAny = localPlayer?.hand.some(d =>
        checkValidMove(d, gameState.table.leftValue, gameState.table.rightValue).canPlay
    ) ?? false;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

            <GameTable gameState={gameState} />

            {/* HUD / Controls */}
            <SafeAreaView style={styles.hudContainer} pointerEvents="box-none">
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.iconButton}>
                        <Ionicons name="settings-sharp" size={24} color="white" />
                    </TouchableOpacity>

                    <View style={[styles.turnIndicator, isMyTurn && styles.myTurnIndicator]}>
                        <Text style={styles.turnText}>
                            {isMyTurn ? "Your Turn" : `${gameState.players.find(p => p.id === gameState.currentPlayerId)?.name}'s Turn`}
                        </Text>
                    </View>
                    <View style={{ width: 24 }} />
                </View>

                {/* Pass Button Area (Centered or near hand) */}
                {isMyTurn && !canPlayAny && (
                    <View style={styles.passContainer}>
                        <TouchableOpacity style={styles.passButton} onPress={handlePassTurn}>
                            <Text style={styles.passButtonText}>Pass Turn</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>

            {localPlayer && (
                <PlayerHand
                    player={localPlayer}
                    onPlayDomino={handlePlayDomino}
                    disabled={gameState.currentPlayerId !== localPlayerId}
                />
            )}

            {isGameOver && (
                <GameOverScreen
                    gameState={gameState}
                    currentUserId={localPlayerId}
                    onReplay={handleReplay}
                />
            )}

            {showSettings && <SettingsScreen onClose={() => setShowSettings(false)} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    loading: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: { color: 'white' },
    hudContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-start',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    iconButton: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    },
    turnIndicator: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    turnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    myTurnIndicator: {
        backgroundColor: '#2ecc71', // Green for action
        borderWidth: 1,
        borderColor: '#fff',
    },
    passContainer: {
        position: 'absolute',
        bottom: 140, // Above hand
        alignSelf: 'center',
    },
    passButton: {
        backgroundColor: '#e74c3c', // Red for alert/action
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    passButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        textTransform: 'uppercase',
    },
});
