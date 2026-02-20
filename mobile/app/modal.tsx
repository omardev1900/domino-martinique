
import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Switch, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '../src/core/services/auth.service';
import SettingsManager from '../src/core/SettingsManager';
import { TABLE_THEMES, TableTheme } from '../src/core/themes/tableThemes';

const THEME_OPTIONS: { theme: TableTheme; label: string; icon: string }[] = [
  { theme: 'classic', label: 'Classique', icon: '🟢' },
  { theme: 'modern', label: 'Moderne', icon: '🔵' },
  { theme: 'luxury', label: 'Luxe', icon: '🔴' },
];

export default function ModalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const settings = SettingsManager.getSettings();
  const [soundEnabled, setSoundEnabled] = useState(settings.isSoundEnabled);
  const [vibrationEnabled, setVibrationEnabled] = useState(settings.isVibrationEnabled);
  const [selectedTheme, setSelectedTheme] = useState<TableTheme>(settings.tableTheme);

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

  const handleLogout = async () => {
    await authService.logout();
    router.dismissAll();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2c0b0b', '#071a07', '#0b2c1d']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonHeader}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Paramètres</Text>
        <SidebarSpacer />
      </View>

      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isLandscape && styles.scrollContentLandscape
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={[styles.mainBlock, isLandscape && styles.mainBlockLandscape]}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gameplay</Text>

              <View style={styles.row}>
                <View>
                  <Text style={styles.label}>Effets Sonores</Text>
                  <Text style={styles.hint}>Sons et musique de fond</Text>
                </View>
                <Switch
                  value={soundEnabled}
                  onValueChange={toggleSound}
                  trackColor={{ false: "#333", true: "#4CAF50" }}
                  thumbColor={soundEnabled ? "#fff" : "#f4f3f4"}
                />
              </View>

              <View style={styles.row}>
                <View>
                  <Text style={styles.label}>Vibrations</Text>
                  <Text style={styles.hint}>Retours tactiles</Text>
                </View>
                <Switch
                  value={vibrationEnabled}
                  onValueChange={toggleVibration}
                  trackColor={{ false: "#333", true: "#4CAF50" }}
                  thumbColor={vibrationEnabled ? "#fff" : "#f4f3f4"}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Apparence</Text>
              <View style={styles.themeGrid}>
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
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Compte</Text>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
              </TouchableOpacity>
              <Text style={styles.versionText}>Domino Martiniquais · v1.0.0</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const SidebarSpacer = () => <View style={{ width: 44 }} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 70,
  },
  backButtonHeader: {
    padding: 10,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 20,
  },
  scrollContentLandscape: {
    alignItems: 'center',
  },
  mainBlock: {
    width: '100%',
    gap: 20,
  },
  mainBlockLandscape: {
    flexDirection: 'row',
    maxWidth: 800,
  },
  section: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 20,
    opacity: 0.8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  label: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    marginTop: 10,
  },
  logoutText: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // ─── Theme Selector ─────────────────────────────────────
  themeGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
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
    width: 64,
    height: 64,
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
    fontSize: 24,
  },
  themeLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  themeLabelSelected: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  versionText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
    textAlign: 'center',
    marginTop: 15,
  },
});
