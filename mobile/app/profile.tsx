
import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    useWindowDimensions,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '../src/core/services/auth.service';
import { PlayerProfile } from '../src/core/types';

const AVATAR_OPTIONS = ['😎', '🤠', '🤖', '👻', '🦊', '🦁', '🐯', '🐼'];

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

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
            setDisplayName(currentUser.displayName || '');
            setSelectedAvatar(currentUser.avatarUrl);
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

    const renderAvatarGrid = () => (
        <View style={styles.section}>
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
    );

    const renderFormControls = () => (
        <View style={[styles.formSection, isLandscape && styles.formSectionLandscape]}>
            <View style={styles.section}>
                <TextInput
                    style={styles.input}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Votre pseudo"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    maxLength={15}
                />
            </View>

            <TouchableOpacity
                style={[styles.saveButton, isLandscape && styles.saveButtonLandscape]}
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
    );

    return (
        <LinearGradient
            colors={['#0d1f0d', '#1a3d1a', '#2d5f2e']}
            style={styles.container}
        >
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mon Profil</Text>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        isLandscape && styles.scrollContentLandscape,
                        { paddingBottom: insets.bottom + 20 }
                    ]}
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Left/Top Part: Avatar Selection */}
                    <View style={[styles.avatarSelectionContainer, isLandscape && styles.avatarSelectionContainerLandscape]}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>
                                {selectedAvatar || displayName?.[0] || 'I'}
                            </Text>
                        </View>
                        {renderAvatarGrid()}
                    </View>

                    {/* Right/Bottom Part: Nickname & Action */}
                    {renderFormControls()}
                </ScrollView>
            </KeyboardAvoidingView>
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
        paddingHorizontal: 16,
        height: 60,
    },
    backButton: {
        padding: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 10,
    },
    scrollContentLandscape: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        gap: 30,
        flexGrow: 1,
    },
    avatarSelectionContainer: {
        alignItems: 'center',
        width: '100%',
    },
    avatarSelectionContainerLandscape: {
        flex: 1,
        maxWidth: 350,
    },
    formSection: {
        width: '100%',
        marginTop: 10,
    },
    formSectionLandscape: {
        flex: 1,
        maxWidth: 300,
        justifyContent: 'center',
    },
    avatarCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    avatarText: {
        fontSize: 44,
        fontWeight: 'bold',
        color: '#0d1f0d',
    },
    section: {
        width: '100%',
        marginBottom: 20,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 14,
        color: '#FFFFFF',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        textAlign: 'center',
        marginTop: 10,
    },
    avatarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
    },
    avatarOption: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedAvatarOption: {
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
    },
    avatarOptionText: {
        fontSize: 24,
    },
    saveButton: {
        backgroundColor: '#FFD700',
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 30, // Button doesn't take full width
        alignSelf: 'center',
    },
    saveButtonLandscape: {
        marginTop: 20,
        width: 180, // Fixed width in landscape
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0d1f0d',
    },
});
