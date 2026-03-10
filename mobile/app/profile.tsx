import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { authService } from '../src/core/services/auth.service';
import { PlayerProfile } from '../src/core/types';
import { AVAILABLE_AVATARS, getAvatarImage, AvatarId } from '../src/core/avatars';
export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    const [user, setUser] = useState<PlayerProfile | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
    const [selectedAvatar, setSelectedAvatar] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const nameInputRef = useRef<TextInput>(null);

    const handleEditPress = () => {
        nameInputRef.current?.focus();
    };

    // Reload profile when screen comes into focus (ensures fresh data)
    useFocusEffect(
        useCallback(() => {
            loadUserProfile();
        }, [])
    );

    const loadUserProfile = async () => {
        console.log('[Profile] Loading user profile...');
        // Always refresh from storage to get latest data
        const currentUser = await authService.refreshUserFromStorage();
        if (currentUser) {
            console.log('[Profile] User loaded:', {
                uid: currentUser.uid,
                displayName: currentUser.displayName,
                avatarId: currentUser.avatarId,
                avatarUrl: currentUser.avatarUrl
            });
            setUser(currentUser);
            setDisplayName(currentUser.displayName || '');

            // Try to get email from current user profile
            if (currentUser.email) {
                setUserEmail(currentUser.email);
            }

            // Set avatar from avatarUrl (which is the source of truth for remote) or avatarId (local)
            const currentAvatar = currentUser.avatarUrl || currentUser.avatarId;
            if (currentAvatar) {
                console.log('[Profile] Setting avatar:', currentAvatar);
                setSelectedAvatar(currentAvatar);
            } else {
                // Default to default avatar if none exist
                console.log('[Profile] Using default avatar, none found');
                setSelectedAvatar('avatar_default');
            }
        } else {
            console.log('[Profile] No user found, using defaults');
            // Default for new users
            setSelectedAvatar('avatar_default');
            setDisplayName('Invité');
        }
    };

    const handleSave = async () => {
        if (!displayName.trim()) {
            Alert.alert('Erreur', 'Le pseudo ne peut pas être vide.');
            return;
        }

        setIsLoading(true);
        try {
            console.log('[Profile] Saving profile with:', displayName.trim(), selectedAvatar);

            await authService.updateProfile({
                displayName: displayName.trim(),
                photoURL: selectedAvatar
            });

            // Force refresh from storage to confirm changes were persisted
            await loadUserProfile();

            console.log('[Profile] Profile saved and refreshed successfully');
            setLastSaved(new Date());

            Alert.alert('Succès', 'Profil mis à jour !');
        } catch (error) {
            console.error('[Profile] Error saving profile:', error);
            Alert.alert('Erreur', 'Impossible de sauvegarder le profil.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarSelect = async (avatarId: string) => {
        setSelectedAvatar(avatarId);
        // Auto-save avatar selection immediately
        try {
            console.log('[Profile] Auto-saving avatar:', avatarId);
            await authService.updateProfile({
                displayName: displayName.trim() || 'Invité',
                photoURL: avatarId
            });
            console.log('[Profile] Avatar auto-saved successfully');
            setLastSaved(new Date());
        } catch (error) {
            console.error('[Profile] Error auto-saving avatar:', error);
        }
    };

    const renderAvatarGrid = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Votre avatar</Text>

            {/* Image Avatars - Compact grid for left side */}
            <View style={styles.avatarGridCompact}>
                {AVAILABLE_AVATARS.slice(0, 4).map((avatarId) => (
                    <TouchableOpacity
                        key={avatarId}
                        style={[
                            styles.avatarOptionSmall,
                            selectedAvatar === avatarId && styles.selectedAvatarOptionSmall
                        ]}
                        onPress={() => handleAvatarSelect(avatarId)}
                    >
                        <Image
                            source={getAvatarImage(avatarId)}
                            style={styles.avatarImageSmall}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                        />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );



    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const renderFormControls = () => (
        <View style={styles.formSection}>
            <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#1A0E2E" />
                ) : (
                    <View style={styles.saveButtonContent}>
                        <Ionicons name="save" size={20} color="#1A0E2E" style={{ marginRight: 8 }} />
                        <Text style={styles.saveButtonText}>ENREGISTRER</Text>
                    </View>
                )}
            </TouchableOpacity>
            {lastSaved && (
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
                    Dernière sauvegarde: {lastSaved.toLocaleTimeString()}
                </Text>
            )}
        </View>
    );
    return (
        <LinearGradient
            colors={['#2D1B4E', '#1A0E2E']}
            style={styles.container}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                {/* Simple Home Button at top */}
                <View style={[styles.homeHeader, { paddingTop: insets.top || 10 }]}>
                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={() => router.replace('/home')}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="home" size={28} color="#FFD700" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        isLandscape && styles.scrollContentLandscape,
                        { paddingBottom: insets.bottom + 100 } // Extra space for button
                    ]}
                    bounces={true}
                    showsVerticalScrollIndicator={true}
                >
                    {/* Main Container - Centered */}
                    <View style={styles.centerColumn}>
                        <View style={styles.avatarCircle}>
                            <Image
                                source={getAvatarImage(selectedAvatar || 'avatar_default')}
                                style={styles.avatarCircleImage}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                            />
                        </View>
                        <View style={styles.headerInfo}>
                            <TextInput
                                ref={nameInputRef}
                                style={styles.headerDisplayNameInput}
                                value={displayName}
                                onChangeText={setDisplayName}
                                onBlur={async () => {
                                    // Auto-save name when leaving the field
                                    if (displayName.trim()) {
                                        try {
                                            console.log('[Profile] Auto-saving name:', displayName.trim());
                                            await authService.updateProfile({
                                                displayName: displayName.trim(),
                                                photoURL: selectedAvatar
                                            });
                                            console.log('[Profile] Name auto-saved successfully');
                                            setLastSaved(new Date());
                                        } catch (error) {
                                            console.error('[Profile] Error auto-saving name:', error);
                                        }
                                    }
                                }}
                                placeholder="Pseudo"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                maxLength={15}
                                returnKeyType="done"
                            />
                            <TouchableOpacity onPress={handleEditPress}>
                                <Ionicons name="pencil" size={14} color="#FFD700" style={styles.editIcon} />
                            </TouchableOpacity>
                        </View>
                        {userEmail && <Text style={styles.emailTextCompact}>{userEmail}</Text>}

                        <View style={styles.avatarSelectionSmall}>
                            {renderAvatarGrid()}
                        </View>
                    </View>

                    {/* BOTTOM SECTION: Form Controls - ALWAYS VISIBLE */}
                    <View style={{ marginTop: 20, marginBottom: 40 }}>
                        {renderFormControls()}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    homeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 60,
    },
    homeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 5,
        flexGrow: 1,
    },
    scrollContentLandscape: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        gap: 20,
    },
    // ─── Main Content Layout ───
    centerColumn: {
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
        marginBottom: 10,
    },
    // ─── Profile Info ───
    avatarCircle: {
        width: 86,
        height: 86,
        borderRadius: 43,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#FFD700',
    },
    avatarCircleImage: {
        width: 86 * 1.6,
        height: 86 * 1.6,
        position: 'absolute',
        top: -(86 * 1.6 - 86) * 0.25,
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 20,
    },
    headerDisplayNameInput: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 1,
        minWidth: 100,
        paddingVertical: 4,
    },
    editIcon: {
        opacity: 0.7,
        marginLeft: -4, // Pull closer to input
    },
    emailTextCompact: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 5,
    },
    // ─── Avatar Selection ───
    avatarSelectionSmall: {
        width: '100%',
        marginTop: 5,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 8,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    avatarGridCompact: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center', // Center the grid
        width: '100%',
        paddingHorizontal: 10,
    },
    avatarOptionSmall: {
        width: '22%', // Force 4 items per row (approx 22% * 4 + margins < 100%)
        aspectRatio: 1, // Keep it square
        margin: '1.5%', // Gap
        borderRadius: 40, // Fully round
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    selectedAvatarOptionSmall: {
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
    },
    avatarImageSmall: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
    },

    // ─── Actions ───
    formSection: {
        width: '100%',
        paddingHorizontal: 10,
        marginTop: 5,
    },
    section: {
        width: '100%',
        marginBottom: 10,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 12,
        color: '#FFFFFF',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.2)',
        textAlign: 'center',
    },
    saveButton: {
        backgroundColor: '#FFD700',
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        maxWidth: 320,
        alignSelf: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    saveButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1a0505',
        letterSpacing: 2,
    },


});
