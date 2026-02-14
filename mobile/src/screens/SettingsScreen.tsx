
import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, useWindowDimensions, ScrollView, Alert } from 'react-native';
import { FadeInUp } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import SettingsManager from '../core/SettingsManager';
import { TableTheme, TABLE_THEMES } from '../core/themes/tableThemes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '../core/services/auth.service';

interface SettingsScreenProps {
    onClose: () => void;
}

const THEME_OPTIONS: { theme: TableTheme; label: string; icon: string }[] = [
    { theme: 'classic', label: 'Classique', icon: '🟢' },
    { theme: 'modern', label: 'Moderne', icon: '🔵' },
    { theme: 'luxury', label: 'Luxe', icon: '🔴' },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const isLandscape = width > height;

    const settings = SettingsManager.getSettings();
    const [soundEnabled, setSoundEnabled] = React.useState(settings.isSoundEnabled);
    const [vibrationEnabled, setVibrationEnabled] = React.useState(settings.isVibrationEnabled);
    const [selectedTheme, setSelectedTheme] = React.useState<TableTheme>(settings.tableTheme);

    const toggleSound = (val: boolean) => {
        setSoundEnabled(val);
        SettingsManager.setSoundEnabled(val);
    };

    const toggleVibration = (val: boolean) => {
        setVibrationEnabled(val);
        SettingsManager.setVibrationEnabled(val);
    };

    const selectTheme = (theme: TableTheme) => {
        setSelectedTheme(theme);
        SettingsManager.setTableTheme(theme);
    };

    const handleLogout = () => {
        Alert.alert(
            'Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Se déconnecter',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await authService.logout();
                            onClose();
                            // Navigate to splash/login after closing modal
                        } catch (error) {
                            console.error('Logout failed:', error);
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={[styles.container, isLandscape && styles.containerLandscape]}>
            <TouchableOpacity
                activeOpacity={1}
                style={styles.backdrop}
                onPress={onClose}
            />

            <Animated.View
                entering={FadeInUp.springify()}
                style={[
                    styles.modal,
                    isLandscape ? styles.modalLandscape : styles.modalPortrait,
                    { paddingBottom: isLandscape ? 20 : insets.bottom + 20 }
                ]}
            >
                <Text style={styles.title}>Paramètres</Text>

                <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                    {/* ─── GAMEPLAY ─── */}
                    <Text style={styles.sectionLabel}>GAMEPLAY</Text>

                    <View style={styles.row}>
                        <View>
                            <Text style={styles.label}>Effets Sonores</Text>
                            <Text style={styles.hint}>Bruitages et musique</Text>
                        </View>
                        <Switch
                            value={soundEnabled}
                            onValueChange={toggleSound}
                            trackColor={{ false: "#767577", true: "#81c784" }}
                            thumbColor={soundEnabled ? "#2e7d32" : "#f4f3f4"}
                        />
                    </View>

                    <View style={styles.row}>
                        <View>
                            <Text style={styles.label}>Vibrations</Text>
                            <Text style={styles.hint}>Retours haptiques</Text>
                        </View>
                        <Switch
                            value={vibrationEnabled}
                            onValueChange={toggleVibration}
                            trackColor={{ false: "#767577", true: "#81c784" }}
                            thumbColor={vibrationEnabled ? "#2e7d32" : "#f4f3f4"}
                        />
                    </View>

                    {/* ─── APPARENCE ─── */}
                    <Text style={styles.sectionLabel}>APPARENCE</Text>

                    <View style={styles.themeRow}>
                        {THEME_OPTIONS.map(({ theme, label, icon }) => {
                            const themeColors = TABLE_THEMES[theme];
                            const isSelected = selectedTheme === theme;
                            return (
                                <TouchableOpacity
                                    key={theme}
                                    style={[styles.themeOption, isSelected && styles.themeOptionSelected]}
                                    onPress={() => selectTheme(theme)}
                                >
                                    <View style={[
                                        styles.themePreview,
                                        { backgroundColor: themeColors.felt, borderColor: themeColors.border }
                                    ]}>
                                        <Text style={styles.themeIcon}>{icon}</Text>
                                    </View>
                                    <Text style={[styles.themeLabel, isSelected && styles.themeLabelSelected]}>
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View style={styles.divider} />

                    {/* ─── COMPTE ─── */}
                    <Text style={styles.sectionLabel}>COMPTE</Text>

                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    {/* ─── FOOTER ─── */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeText}>Fermer</Text>
                    </TouchableOpacity>

                    <Text style={styles.versionText}>Domino Martiniquais · v1.0.0</Text>
                </ScrollView>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 200,
    },
    containerLandscape: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modal: {
        backgroundColor: '#fff',
        padding: 24,
    },
    modalPortrait: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        maxHeight: '80%',
    },
    modalLandscape: {
        width: 420,
        borderRadius: 20,
        maxHeight: '90%',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1b5e20',
        marginBottom: 20,
        textAlign: 'center',
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#999',
        letterSpacing: 2,
        marginBottom: 10,
        marginTop: 4,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    hint: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    // ─── Theme Selector ─────────────────────────────────────
    themeRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 16,
        backgroundColor: '#f9f9f9',
        padding: 14,
        borderRadius: 12,
    },
    themeOption: {
        alignItems: 'center',
        gap: 6,
        opacity: 0.5,
    },
    themeOptionSelected: {
        opacity: 1,
    },
    themePreview: {
        width: 56,
        height: 56,
        borderRadius: 12,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    themeIcon: {
        fontSize: 22,
    },
    themeLabel: {
        fontSize: 11,
        color: '#888',
        fontWeight: '500',
    },
    themeLabelSelected: {
        color: '#1b5e20',
        fontWeight: 'bold',
    },
    // ─── Account ─────────────────────────────────────────────
    logoutButton: {
        backgroundColor: '#fff5f5',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ffcdd2',
        marginBottom: 8,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#d32f2f',
    },
    // ─── Footer ──────────────────────────────────────────────
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 12,
    },
    closeButton: {
        backgroundColor: '#1b5e20',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    versionText: {
        fontSize: 11,
        color: '#bbb',
        textAlign: 'center',
        marginTop: 12,
    },
});
