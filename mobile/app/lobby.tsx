import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { createRoom, joinRoom } from '../src/core/services/firebase';
import { PlayerProfile } from '../src/core/types';

// Mock Profile for MVP (In real app, this comes from Auth)
const MOCK_PROFILE: PlayerProfile = {
    uid: 'user-' + Math.floor(Math.random() * 10000),
    displayName: 'Player ' + Math.floor(Math.random() * 100),
    gamesPlayed: 0,
    gamesWon: 0
};

export default function LobbyScreen() {
    const router = useRouter();
    const [roomIdToJoin, setRoomIdToJoin] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreateRoom = async () => {
        try {
            setLoading(true);
            const newRoomId = await createRoom(MOCK_PROFILE, false);
            router.push({ pathname: '/game/[id]', params: { id: newRoomId, userId: MOCK_PROFILE.uid } });
        } catch (error) {
            Alert.alert("Error", "Failed to create room: " + error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!roomIdToJoin.trim()) return;
        try {
            setLoading(true);
            await joinRoom(roomIdToJoin, MOCK_PROFILE);
            router.push({ pathname: '/game/[id]', params: { id: roomIdToJoin, userId: MOCK_PROFILE.uid } });
        } catch (error) {
            Alert.alert("Error", "Failed to join room: " + error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#0d1f0d', '#1a3d1a', '#2d5f2e']}
            style={styles.container}
        >
            {/* Back Button - Top Left */}
            <Animated.View entering={FadeInLeft.duration(400)} style={styles.backContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Cards - Center */}
            <View style={styles.cardsContainer}>
                {/* Create Room Card */}
                <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.cardWrapper}>
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>Host a Game</Text>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonPrimary]}
                            onPress={handleCreateRoom}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Create New Room</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Join Room Card */}
                <Animated.View entering={FadeInUp.delay(350).duration(500)} style={styles.cardWrapper}>
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>Join a Game</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Room ID"
                            placeholderTextColor="#666"
                            value={roomIdToJoin}
                            onChangeText={setRoomIdToJoin}
                            autoCapitalize="none"
                            editable={!loading}
                        />
                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.buttonSecondary,
                                (!roomIdToJoin || loading) && styles.buttonDisabled
                            ]}
                            onPress={handleJoinRoom}
                            disabled={loading || !roomIdToJoin}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text style={styles.buttonTextSecondary}>Join Room</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backContainer: {
        position: 'absolute',
        top: 40,
        left: 30,
        zIndex: 10,
    },
    backButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 28,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    cardsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 60,
        gap: 30,
    },
    cardWrapper: {
        flex: 1,
        maxWidth: 320,
    },
    card: {
        backgroundColor: 'rgba(30,30,30,0.85)',
        padding: 28,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    cardLabel: {
        color: '#FFD700',
        fontSize: 18,
        marginBottom: 20,
        fontWeight: '600',
        textAlign: 'center',
    },
    input: {
        backgroundColor: 'rgba(44,44,44,0.9)',
        color: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        textAlign: 'center',
    },
    button: {
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
    },
    buttonPrimary: {
        backgroundColor: '#4CAF50',
    },
    buttonSecondary: {
        backgroundColor: '#FFFFFF',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: 'bold',
    },
    buttonTextSecondary: {
        color: '#000000',
        fontSize: 17,
        fontWeight: 'bold',
    },
});
