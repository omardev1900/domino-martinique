
import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Switch, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '../src/core/services/auth.service';
import SettingsManager from '../src/core/SettingsManager';

export default function ModalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const settings = SettingsManager.getSettings();
  const [soundEnabled, setSoundEnabled] = useState(settings.isSoundEnabled);
  const [vibrationEnabled, setVibrationEnabled] = useState(settings.isVibrationEnabled);

  const toggleSound = (val: boolean) => {
    setSoundEnabled(val);
    SettingsManager.setSoundEnabled(val);
  };

  const toggleVibration = (val: boolean) => {
    setVibrationEnabled(val);
    SettingsManager.setVibrationEnabled(val);
  };

  const handleLogout = async () => {
    await authService.logout();
    router.dismissAll();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0d1f0d', '#1a3d1a', '#2d5f2e']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonHeader}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Paramètres</Text>
        <View style={{ width: 44 }} />
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
              <Text style={styles.sectionTitle}>Préférences</Text>

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
              <Text style={styles.sectionTitle}>Compte</Text>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Se déconnecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
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
});
