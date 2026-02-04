import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
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
        <View style={styles.container}>
            <Text style={styles.title}>Domino Martinique</Text>
            <Text style={styles.subtitle}>Multiplayer Lobby</Text>

            <View style={styles.card}>
                <Text style={styles.label}>Host a Game</Text>
                <TouchableOpacity
                    style={styles.buttonPrimary}
                    onPress={handleCreateRoom}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create New Room</Text>}
                </TouchableOpacity>
            </View>

            <View style={styles.divider}>
                <Text style={styles.dividerText}>OR</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Join a Game</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter Room ID"
                    placeholderTextColor="#666"
                    value={roomIdToJoin}
                    onChangeText={setRoomIdToJoin}
                    autoCapitalize="none"
                />
                <TouchableOpacity
                    style={styles.buttonSecondary}
                    onPress={handleJoinRoom}
                    disabled={loading || !roomIdToJoin}
                >
                    {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonTextSecondary}>Join Room</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212', // Dark theme
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#E0E0E0',
        marginBottom: 10
    },
    subtitle: {
        fontSize: 18,
        color: '#AAAAAA',
        marginBottom: 40
    },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#1E1E1E',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    label: {
        color: '#FFFFFF',
        fontSize: 16,
        marginBottom: 15,
        fontWeight: '600'
    },
    input: {
        backgroundColor: '#2C2C2C',
        color: '#FFFFFF',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#333'
    },
    buttonPrimary: {
        backgroundColor: '#4CAF50', // Green
        padding: 15,
        borderRadius: 8,
        alignItems: 'center'
    },
    buttonSecondary: {
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center'
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold'
    },
    buttonTextSecondary: {
        color: '#000000',
        fontSize: 16,
        fontWeight: 'bold'
    },
    divider: {
        marginVertical: 10,
        marginBottom: 30
    },
    dividerText: {
        color: '#666',
        fontWeight: 'bold'
    }
});
