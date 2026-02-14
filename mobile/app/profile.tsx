import React, { useState, useEffect, useRef } from 'react';
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
import { statsService, PlayerStats } from '../src/core/services/stats.service';
import { PlayerProfile } from '../src/core/types';
import { AVAILABLE_AVATARS, getAvatarImage, AvatarId } from '../src/core/avatars';
import { MatchHistory } from '../src/components/MatchHistory';

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
    const [playerStats, setPlayerStats] = useState<PlayerStats>({
        gamesPlayed: 0,
        gamesWon: 0,
        totalCochonsInflicted: 0,
        totalPointsAccumulated: 0,
        matchHistory: [],
    });
    const [activeTab, setActiveTab] = useState<'stats' | 'history'>('stats');

    const nameInputRef = useRef<TextInput>(null);

    const handleEditPress = () => {
        nameInputRef.current?.focus();
    };

    useEffect(() => {
        loadUserProfile();
        loadPlayerStats();
    }, []);

    const loadPlayerStats = async () => {
        const stats = await statsService.getStats();
        setPlayerStats(stats);
    };

    const loadUserProfile = async () => {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
            setDisplayName(currentUser.displayName || '');

            // Try to get email from current user profile
            // We'll use a safer check for email if it's available in the profile or auth
            if (currentUser.email) {
                setUserEmail(currentUser.email);
            }

            // Force avatar to image avatar if current is emoji or invalid
            const currentAvatar = currentUser.avatarUrl;
            if (currentAvatar && AVAILABLE_AVATARS.includes(currentAvatar as AvatarId)) {
                setSelectedAvatar(currentAvatar);
            } else {
                // Default to default avatar if emoji or invalid
                setSelectedAvatar('avatar_default');
            }
        } else {
            // Default for new users
            setSelectedAvatar('avatar_default');
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

            Alert.alert('Succès', 'Profil mis à jour !');
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

            {/* Image Avatars - Compact grid for left side */}
            <View style={styles.avatarGridCompact}>
                {AVAILABLE_AVATARS.map((avatarId) => (
                    <TouchableOpacity
                        key={avatarId}
                        style={[
                            styles.avatarOptionSmall,
                            selectedAvatar === avatarId && styles.selectedAvatarOptionSmall
                        ]}
                        onPress={() => setSelectedAvatar(avatarId)}
                    >
                        <Image
                            source={getAvatarImage(avatarId)}
                            style={styles.avatarImageSmall}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderStatsGrid = () => {
        const winRate = playerStats.gamesPlayed > 0
            ? Math.round((playerStats.gamesWon / playerStats.gamesPlayed) * 100)
            : 0;

        const statCards = [
            { icon: '🎮', value: playerStats.gamesPlayed, label: 'Parties' },
            { icon: '🏆', value: playerStats.gamesWon, label: `Victoires (${winRate}%)` },
            { icon: '🐷', value: playerStats.totalCochonsInflicted, label: 'Cochons' },
            { icon: '⚡', value: playerStats.totalPointsAccumulated, label: 'Points' },
        ];

        return (
            <View style={styles.section}>
                <View style={styles.statsGrid}>
                    {statCards.map((card, index) => (
                        <View key={index} style={styles.statCard}>
                            <Text style={styles.statIcon}>{card.icon}</Text>
                            <Text style={styles.statValue}>{card.value}</Text>
                            <Text style={styles.statLabel}>{card.label}</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const renderFormControls = () => (
        <View style={styles.formSection}>
            <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#0d1f0d" />
                ) : (
                    <View style={styles.saveButtonContent}>
                        <Ionicons name="checkmark-circle" size={20} color="#0d1f0d" style={{ marginRight: 8 }} />
                        <Text style={styles.saveButtonText}>ENREGISTRER</Text>
                    </View>
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
                    {/* Main Split Layout Container */}
                    <View style={styles.splitRow}>
                        {/* LEFT COLUMN: Avatar + Info + Selection */}
                        <View style={styles.leftColumn}>
                            <View style={styles.avatarCircle}>
                                <Image
                                    source={getAvatarImage(selectedAvatar || 'avatar_default')}
                                    style={styles.avatarCircleImage}
                                    resizeMode="cover"
                                />
                            </View>
                            <View style={styles.headerInfo}>
                                <TextInput
                                    ref={nameInputRef}
                                    style={styles.headerDisplayNameInput}
                                    value={displayName}
                                    onChangeText={setDisplayName}
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

                        {/* VERTICAL SEPARATOR */}
                        <View style={styles.verticalSeparator} />

                        {/* RIGHT COLUMN: Statistics / History */}
                        <View style={styles.rightColumn}>
                            {/* Tab Switcher */}
                            <View style={styles.tabBar}>
                                <TouchableOpacity
                                    style={[styles.tabItem, activeTab === 'stats' && styles.activeTabItem]}
                                    onPress={() => setActiveTab('stats')}
                                >
                                    <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>STATS</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.tabItem, activeTab === 'history' && styles.activeTabItem]}
                                    onPress={() => setActiveTab('history')}
                                >
                                    <View style={styles.tabWithBadge}>
                                        <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>MATCHS</Text>
                                        {playerStats.matchHistory.length > 0 && (
                                            <View style={styles.tabBadge}>
                                                <Text style={styles.tabBadgeText}>{playerStats.matchHistory.length}</Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {activeTab === 'stats' ? renderStatsGrid() : <MatchHistory history={playerStats.matchHistory} />}
                        </View>
                    </View>

                    {/* BOTTOM SECTION: Form Controls */}
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
    splitRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 15,
        marginBottom: 5,
    },
    leftColumn: {
        flex: 1.2,
        alignItems: 'center',
    },
    rightColumn: {
        flex: 1.8,
    },
    verticalSeparator: {
        width: 1,
        height: '70%',
        backgroundColor: 'rgba(255,215,0,0.25)',
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
        gap: 6,
        justifyContent: 'center',
    },
    avatarOptionSmall: {
        width: 38,
        height: 38,
        borderRadius: 19,
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
        width: 38,
        height: 38,
        borderRadius: 19,
    },
    // ─── Statistics ───
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
    },
    statCard: {
        width: '47%',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 5,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,215,0,0.15)',
    },
    statIcon: {
        fontSize: 32,
        marginBottom: 2,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    statLabel: {
        fontSize: 9,
        color: '#FFD700',
        fontWeight: 'bold',
        marginTop: 2,
        textAlign: 'center',
        textTransform: 'uppercase',
        opacity: 0.8,
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
        color: '#0d1f0d',
        letterSpacing: 2,
    },
    // ─── Tabs ───
    tabBar: {
        flexDirection: 'row',
        marginBottom: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.1)',
    },
    tabItem: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTabItem: {
        backgroundColor: 'rgba(255,215,0,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    tabText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 1,
    },
    activeTabText: {
        color: '#FFD700',
    },
    tabWithBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tabBadge: {
        backgroundColor: '#FFD700',
        borderRadius: 8,
        paddingHorizontal: 5,
        paddingVertical: 1,
        marginLeft: 6,
    },
    tabBadgeText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#0d1f0d',
    },
});
