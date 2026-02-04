import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInLeft, FadeIn } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
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
    const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCreateRoom = async () => {
        try {
            setLoading(true);
            const newRoomId = await createRoom(MOCK_PROFILE, false);
            setCreatedRoomId(newRoomId);
        } catch (error) {
            Alert.alert("Error", "Failed to create room: " + error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = async () => {
        if (!createdRoomId) return;
        await Clipboard.setStringAsync(createdRoomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (!createdRoomId) return;
        try {
            await Share.share({
                message: `Join my Domino Martinique game! Room code: ${createdRoomId}`,
            });
        } catch (error) {
            console.log('Share error', error);
        }
    };

    const handleEnterRoom = () => {
        if (!createdRoomId) return;
        router.push({ pathname: '/game/[id]', params: { id: createdRoomId, userId: MOCK_PROFILE.uid } });
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

    const handleBack = () => {
        if (createdRoomId) {
            setCreatedRoomId(null);
        } else {
            router.back();
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
                    onPress={handleBack}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Cards - Center */}
            <View style={styles.cardsContainer}>
                {/* Room Created - Show Code */}
                {createdRoomId ? (
                    <Animated.View entering={FadeIn.duration(400)} style={styles.codeCardWrapper}>
                        <View style={styles.codeCard}>
                            <Text style={styles.codeLabel}>Room Created!</Text>
                            <Text style={styles.codeText}>{createdRoomId}</Text>

                            <View style={styles.codeActions}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.copyButton]}
                                    onPress={handleCopyCode}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.actionButtonText}>
                                        {copied ? '✓ Copied!' : '📋 Copy'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButton, styles.shareButton]}
                                    onPress={handleShare}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.actionButtonText}>📤 Share</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.enterButton}
                                onPress={handleEnterRoom}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.enterButtonText}>Enter Room →</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                ) : (
                    <>
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
                    </>
                )}
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
        maxWidth: 280,
    },
    card: {
        backgroundColor: 'rgba(30,30,30,0.85)',
        padding: 24,
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
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
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
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonTextSecondary: {
        color: '#000000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Room Code Card
    codeCardWrapper: {
        width: '100%',
        maxWidth: 400,
    },
    codeCard: {
        backgroundColor: 'rgba(30,30,30,0.9)',
        padding: 32,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#4CAF50',
        alignItems: 'center',
    },
    codeLabel: {
        color: '#4CAF50',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    codeText: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 20,
        fontFamily: 'monospace',
        flexWrap: 'wrap',
        textAlign: 'center',
    },
    codeActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    actionButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    copyButton: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    shareButton: {
        backgroundColor: '#2196F3',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    enterButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 12,
        width: '100%',
    },
    enterButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
