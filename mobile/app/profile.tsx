
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../src/core/services/auth.service';
import { PlayerProfile } from '../src/core/types';

const AVATAR_OPTIONS = ['😎', '🤠', '🤖', '👻', '🦊', '🦁', '🐯', '🐼'];

export default function ProfileScreen() {
    const router = useRouter();
    const [user, setUser] = useState<PlayerProfile | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
            setDisplayName(currentUser.displayName);
            setSelectedAvatar(currentUser.avatarUrl); // Using avatarUrl to store emoji for now
        }
    };

    const handleSave = async () => {
        if (!displayName.trim()) {
            Alert.alert('Erreur', 'Le pseudo ne peut pas être vide.');
            return;
        }

        setIsLoading(true);
        try {
            await authService.updateProfile({
                displayName: displayName.trim(),
                photoURL: selectedAvatar
            });
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', 'Impossible de sauvegarder le profil.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#0d1f0d', '#1a3d1a', '#2d5f2e']}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mon Profil</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Current Avatar Display */}
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                            {selectedAvatar || displayName?.[0] || 'I'}
                        </Text>
                    </View>
                    <Text style={styles.uidText}>ID: {user?.uid?.slice(-6) || '---'}</Text>
                </View>

                {/* Nickname Input */}
                <View style={styles.section}>
                    <Text style={styles.label}>PSEUDO</Text>
                    <TextInput
                        style={styles.input}
                        value={displayName}
                        onChangeText={setDisplayName}
                        placeholder="Votre pseudo"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        maxLength={15}
                    />
                </View>

                {/* Avatar Selection */}
                <View style={styles.section}>
                    <Text style={styles.label}>CHOISIR UN AVATAR</Text>
                    <View style={styles.avatarGrid}>
                        {AVATAR_OPTIONS.map((emoji) => (
                            <TouchableOpacity
                                key={emoji}
                                style={[
                                    styles.avatarOption,
                                    selectedAvatar === emoji && styles.selectedAvatarOption
                                ]}
                                onPress={() => setSelectedAvatar(emoji)}
                            >
                                <Text style={styles.avatarOptionText}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

            </ScrollView>

            {/* Save Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#0d1f0d" />
                    ) : (
                        <Text style={styles.saveButtonText}>Enregistrer</Text>
                    )}
                </TouchableOpacity>
            </View>

        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    content: {
        padding: 24,
        alignItems: 'center',
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    avatarText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#0d1f0d',
    },
    uidText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontFamily: 'monospace',
    },
    section: {
        width: '100%',
        marginBottom: 30,
    },
    label: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
        letterSpacing: 1,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 16,
        color: '#FFFFFF',
        fontSize: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    avatarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    avatarOption: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedAvatarOption: {
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
    },
    avatarOptionText: {
        fontSize: 28,
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
    },
    saveButton: {
        backgroundColor: '#FFD700',
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    saveButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0d1f0d',
    },
});
