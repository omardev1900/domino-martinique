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
    Platform,
    Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '../src/core/services/auth.service';
import { PlayerProfile } from '../src/core/types';
import SettingsManager from '../src/core/SettingsManager';
import { TableTheme, TABLE_THEMES } from '../src/core/themes/tableThemes';
import { AVAILABLE_AVATARS, getAvatarImage, AvatarId } from '../src/core/avatars';

const THEME_OPTIONS: { theme: TableTheme; label: string; icon: string }[] = [
    { theme: 'classic', label: 'Classique', icon: '🟢' },
    { theme: 'modern', label: 'Moderne', icon: '🔵' },
    { theme: 'luxury', label: 'Luxe', icon: '🔴' },
];

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    const [user, setUser] = useState<PlayerProfile | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState<string | undefined>(undefined);
    const [selectedTheme, setSelectedTheme] = useState<TableTheme>('classic');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
            setDisplayName(currentUser.displayName || '');
            // Force avatar to image avatar if current is emoji or invalid
            const currentAvatar = currentUser.avatarUrl;
            if (currentAvatar && AVAILABLE_AVATARS.includes(currentAvatar as AvatarId)) {
                setSelectedAvatar(currentAvatar);
            } else {
                // Default to first avatar if emoji or invalid
                setSelectedAvatar('avatar_01');
            }
        } else {
            // Default for new users
            setSelectedAvatar('avatar_01');
        }

        // Load current theme
        const settings = SettingsManager.getSettings();
        setSelectedTheme(settings.tableTheme);
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

            // Save theme
            await SettingsManager.setTableTheme(selectedTheme);

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
            <Text style={styles.sectionTitle}>Choisir un avatar</Text>

            {/* Image Avatars - Square display */}
            <View style={styles.avatarGrid}>
                {AVAILABLE_AVATARS.map((avatarId) => (
                    <TouchableOpacity
                        key={avatarId}
                        style={[
                            styles.avatarOption,
                            styles.avatarImageOption,
                            selectedAvatar === avatarId && styles.selectedAvatarOption
                        ]}
                        onPress={() => setSelectedAvatar(avatarId)}
                    >
                        <Image
                            source={getAvatarImage(avatarId)}
                            style={styles.avatarImage}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderThemeSelector = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thème de la table</Text>
            <View style={styles.themeGrid}>
                {THEME_OPTIONS.map(({ theme, label, icon }) => {
                    const themeColors = TABLE_THEMES[theme];
                    return (
                        <TouchableOpacity
                            key={theme}
                            style={[
                                styles.themeOption,
                                selectedTheme === theme && styles.selectedThemeOption
                            ]}
                            onPress={() => setSelectedTheme(theme)}
                        >
                            <View style={[styles.themePreview, { backgroundColor: themeColors.felt, borderColor: themeColors.border }]}>
                                <Text style={styles.themeIcon}>{icon}</Text>
                            </View>
                            <Text style={styles.themeLabel}>{label}</Text>
                        </TouchableOpacity>
                    );
                })}
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
                            <Image
                                source={getAvatarImage(selectedAvatar || 'avatar_01')}
                                style={styles.avatarCircleImage}
                                resizeMode="cover"
                            />
                        </View>
                        {renderAvatarGrid()}
                        {renderThemeSelector()}
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
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#FFD700',
    },
    avatarCircleImage: {
        width: 90 * 1.6,
        height: 90 * 1.6,
        position: 'absolute',
        top: -(90 * 1.6 - 90) * 0.25,
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
    avatarImageOption: {
        padding: 0,
        overflow: 'hidden',
    },
    avatarImage: {
        width: 56,
        height: 56,
        borderRadius: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    themeGrid: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
    },
    themeOption: {
        alignItems: 'center',
        gap: 8,
    },
    selectedThemeOption: {
        opacity: 1,
    },
    themePreview: {
        width: 70,
        height: 70,
        borderRadius: 12,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    themeIcon: {
        fontSize: 28,
    },
    themeLabel: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '500',
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
