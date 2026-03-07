
import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Switch, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '../src/core/services/auth.service';
import SettingsManager, { BgmTheme } from '../src/core/SettingsManager';
import SoundManager from '../src/core/audio/SoundManager';
import { TABLE_THEMES, TableTheme } from '../src/core/themes/tableThemes';
import { botService } from '../src/core/services/bot.service';
import { Alert } from 'react-native';

const THEME_OPTIONS: { theme: TableTheme; label: string; icon: string }[] = [
  { theme: 'classic', label: 'Classique', icon: '🟢' },
  { theme: 'modern', label: 'Moderne', icon: '🔵' },
  { theme: 'luxury', label: 'Luxe', icon: '🔴' },
];

const BGM_OPTIONS: { theme: BgmTheme; label: string; icon: string }[] = [
  { theme: 'bgm1', label: 'Piste 1', icon: '🎵' },
  { theme: 'bgm2', label: 'Piste 2', icon: '🎷' },
  { theme: 'bgm3', label: 'Piste 3', icon: '🎸' },
  { theme: 'none', label: 'Silence', icon: '🔇' },
];

const VOLUMES = [
  { val: 0, label: '0%' },
  { val: 0.25, label: '25%' },
  { val: 0.5, label: '50%' },
  { val: 0.75, label: '75%' },
  { val: 1.0, label: '100%' },
];

export default function ModalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const settings = SettingsManager.getSettings();
  const [sfxEnabled, setSfxEnabled] = useState(settings.isSfxEnabled);
  const [vibrationEnabled, setVibrationEnabled] = useState(settings.isVibrationEnabled);
  const [selectedTheme, setSelectedTheme] = useState<TableTheme>(settings.tableTheme);
  const [bgmTheme, setBgmTheme] = React.useState<BgmTheme>(settings.gameBgmTheme);
  const [bgmVolume, setBgmVolume] = React.useState(settings.bgmVolume);
  const [sfxVolume, setSfxVolume] = React.useState(settings.sfxVolume);
  const [activeTab, setActiveTab] = useState<'audio' | 'haptic' | 'theme' | 'account'>('audio');
  const pathname = usePathname();

  const toggleSfx = (val: boolean) => {
    setSfxEnabled(val);
    SettingsManager.setSfxEnabled(val);
    if (val) SoundManager.playSound('clack1');
  };

  const toggleVibration = (val: boolean) => {
    setVibrationEnabled(val);
    SettingsManager.setVibrationEnabled(val);
  };

  const selectTheme = (theme: TableTheme) => {
    setSelectedTheme(theme);
    SettingsManager.setTableTheme(theme);
  };

  const selectBgmTheme = (theme: BgmTheme) => {
    setBgmTheme(theme);
    SettingsManager.setGameBgmTheme(theme);

    // Si on est en partie, on applique le changement immédiatement
    if (pathname.startsWith('/game')) {
      if (theme === 'none') {
        SoundManager.stopMusic();
      } else {
        SoundManager.playMusic(theme, 0.5);
      }
    }
  };

  const changeBgmVolume = (val: number) => {
    setBgmVolume(val);
    SettingsManager.setBgmVolume(val);
    SoundManager.updateVolumes();
  };

  const changeSfxVolume = (val: number) => {
    setSfxVolume(val);
    SettingsManager.setSfxVolume(val);
    if (sfxEnabled) SoundManager.playSound('clack1');
  };

  const handleLogout = async () => {
    await authService.logout();
    router.dismissAll();
    router.replace('/login');
  };

  const handleSeedDatabase = async () => {
    Alert.alert(
      "Peupler Firebase",
      "Voulez-vous vraiment synchroniser les bots par défaut vers Firestore ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Oui, injecter",
          onPress: async () => {
            const count = await botService.seedDatabase();
            Alert.alert("Succès", `${count} bots ajoutés à Firebase !`);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container} aria-modal={true}>
      <LinearGradient
        colors={['#2D1B4E', '#1A0E2E']}
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

            {/* TABS */}
            <View style={styles.tabBar}>
              <TouchableOpacity style={[styles.tabItem, activeTab === 'audio' && styles.activeTabItem]} onPress={() => setActiveTab('audio')}>
                <Text style={[styles.tabText, activeTab === 'audio' && styles.activeTabText]}>AUDIO</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabItem, activeTab === 'haptic' && styles.activeTabItem]} onPress={() => setActiveTab('haptic')}>
                <Text style={[styles.tabText, activeTab === 'haptic' && styles.activeTabText]}>HAPTIQUE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabItem, activeTab === 'theme' && styles.activeTabItem]} onPress={() => setActiveTab('theme')}>
                <Text style={[styles.tabText, activeTab === 'theme' && styles.activeTabText]}>THÈME</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabItem, activeTab === 'account' && styles.activeTabItem]} onPress={() => setActiveTab('account')}>
                <Text style={[styles.tabText, activeTab === 'account' && styles.activeTabText]}>COMPTE</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'audio' && (
              <View style={styles.audioTabContainer}>
                {/* COLUMN LEFT: SFX */}
                <View style={styles.audioColumn}>
                  <View style={styles.columnHeader}>
                    <Text style={styles.columnTitle}>BRUITAGES</Text>
                    <Switch
                      value={sfxEnabled}
                      onValueChange={toggleSfx}
                      trackColor={{ false: "#333", true: "#4CAF50" }}
                      thumbColor={sfxEnabled ? "#fff" : "#f4f3f4"}
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                  </View>

                  <View style={styles.columnContent}>
                    <Text style={styles.miniLabel}>Volume</Text>
                    <View style={styles.compactVolumeRow}>
                      {VOLUMES.map(v => (
                        <TouchableOpacity
                          key={`sfx-${v.val}`}
                          style={[styles.miniVolBtn, sfxVolume === v.val && styles.volBtnActive]}
                          onPress={() => changeSfxVolume(v.val)}
                          disabled={!sfxEnabled}
                        >
                          <Text style={[styles.miniVolText, sfxVolume === v.val && styles.volBtnTextActive]}>{v.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {/* VERTICAL DIVIDER */}
                <View style={styles.verticalDivider} />

                {/* COLUMN RIGHT: BGM */}
                <View style={[styles.audioColumn, { flex: 1.2 }]}>
                  <View style={styles.columnHeader}>
                    <Text style={styles.columnTitle}>MUSIQUE</Text>
                  </View>

                  <View style={styles.columnContent}>
                    <View style={styles.compactBgmRow}>
                      {BGM_OPTIONS.map(({ theme, icon }) => (
                        <TouchableOpacity
                          key={theme}
                          style={[styles.miniBgmOption, bgmTheme === theme && styles.bgmOptionSelected]}
                          onPress={() => selectBgmTheme(theme)}
                        >
                          <Text style={[styles.miniBgmIcon, bgmTheme === theme && styles.bgmIconSelected]}>{icon}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={[styles.miniLabel, { marginTop: 8 }]}>Volume</Text>
                    <View style={styles.compactVolumeRow}>
                      {VOLUMES.map(v => (
                        <TouchableOpacity
                          key={`bgm-${v.val}`}
                          style={[styles.miniVolBtn, bgmVolume === v.val && styles.volBtnActive]}
                          onPress={() => changeBgmVolume(v.val)}
                          disabled={bgmTheme === 'none'}
                        >
                          <Text style={[styles.miniVolText, bgmVolume === v.val && styles.volBtnTextActive]}>{v.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'haptic' && (
              <View style={styles.section}>
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
            )}

            {activeTab === 'theme' && (
              <View style={styles.section}>
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
            )}

            {activeTab === 'account' && (
              <View style={styles.section}>
                <TouchableOpacity style={[styles.logoutButton, { backgroundColor: 'rgba(76, 175, 80, 0.15)', borderColor: 'rgba(76, 175, 80, 0.3)', marginBottom: 20 }]} onPress={handleSeedDatabase}>
                  <Text style={[styles.logoutText, { color: '#4CAF50' }]}>🤖 Peupler les Bots (Admin)</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
                </TouchableOpacity>
                <Text style={styles.versionText}>Domino Martiniquais · v1.0.0</Text>
              </View>
            )}
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
    alignItems: 'center', // Center tabs and sections in landscape
    gap: 10,
  },
  mainBlockLandscape: {
    maxWidth: 600,
    width: '100%',
  },
  section: {
    width: '100%',
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
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 12,
  },
  // ─── Audio ───────────────────────────────────────────────
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    marginBottom: 10,
  },
  volumeLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.6)',
    marginRight: 10,
    width: 30,
  },
  volumeControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  volBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  volBtnActive: {
    backgroundColor: '#4CAF50',
  },
  volBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.5)',
  },
  volBtnTextActive: {
    color: '#fff',
  },
  bgmSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  bgmOption: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    opacity: 0.4,
  },
  bgmOptionSelected: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    opacity: 1,
  },
  bgmIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  bgmIconSelected: {
    transform: [{ scale: 1.1 }],
  },
  bgmLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: 'bold',
  },
  bgmLabelSelected: {
    color: '#4CAF50',
  },
  // ─── Audio Tab Refactor (2 Columns) ─────────────────────
  audioTabContainer: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 16,
    minHeight: 140,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  audioColumn: {
    flex: 1,
    paddingHorizontal: 4,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    height: 30,
  },
  columnTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 1,
  },
  columnContent: {
    gap: 6,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: 'rgba(255,215,0,0.1)',
    marginHorizontal: 8,
  },
  miniLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  compactVolumeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  miniVolBtn: {
    flex: 1,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  miniVolText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.4)',
  },
  compactBgmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  miniBgmOption: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  miniBgmIcon: {
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
  // ─── Tabs ───────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
    width: '100%',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabItem: {
    backgroundColor: 'rgba(255,215,0,0.15)',
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
});
