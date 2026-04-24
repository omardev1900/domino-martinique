import 'react-native-url-polyfill/auto';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useState, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Platform, AppState, AppStateStatus, View } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { LinearGradient } from 'expo-linear-gradient';
import SoundManager from '@/core/audio/SoundManager';
import SettingsManager from '@/core/SettingsManager';
import { adService } from '@/core/services/ad.service';
import { Sidebar } from '@/components/Sidebar';
import {
  USE_NEW_SIDEBAR,
  SIDEBAR_HIDDEN_ROUTES,
  SIDEBAR_HIDDEN_PREFIXES,
} from '@/core/config/navigation.config';

// Keep the native splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// WEB FIX: Inject global styles to ensure full height
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      background-color: #1A0E2E;
    }
  `;
  document.head.appendChild(style);
}

export const unstable_settings = {
  initialRouteName: 'index',
};

async function applyImmersiveMode() {
  if (Platform.OS !== 'android') return;
  try {
    await NavigationBar.setVisibilityAsync('hidden');
    // overlay-swipe : la barre apparaît en overlay sur swipe puis se cache automatiquement
    await NavigationBar.setBehaviorAsync('overlay-swipe');
  } catch (_) {
    // Certains Android 15+ avec edge-to-edge forcé peuvent rejeter ces appels
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appReady, setAppReady] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    async function prepare() {
      try {
        await SettingsManager.loadSettings();

        // Réinitialise les cooldowns de session pub + charge les pubs actives (fire-and-forget)
        await adService.resetSessionCooldowns();
        adService.preload();

        // Preload audio assets
        await SoundManager.preloadSounds();

        // Android Immersive Mode — appel initial
        if (Platform.OS === 'android') {
          await applyImmersiveMode();
        }

        // Start menu music immediately
        SoundManager.playMusic('bgm3', 0.5);
      } catch (e) {
        // Non-critical init error — app continues
      } finally {
        setAppReady(true);
        // FORCE HIDE: If the app is ready, don't wait for onLayout
        // which might never fire if the first render has issues.
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          // Splash hide failure is non-critical
        }
      }
    }
    prepare();
  }, []);

  // Re-applique l'immersive mode chaque fois que l'app repasse en foreground.
  // Android réinitialise la nav bar après un passage en arrière-plan.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') applyImmersiveMode();
    });
    return () => subscription.remove();
  }, []);

  // Global Music Manager — switch BGM based on route
  useEffect(() => {
    if (!appReady) return;

    if (pathname.startsWith('/game')) {
      const settings = SettingsManager.getSettings();
      if (settings.gameBgmTheme === 'none') {
        SoundManager.stopMusic();
      } else {
        SoundManager.playMusic(settings.gameBgmTheme, 0.5);
      }
    } else {
      SoundManager.playMusic('bgm3', 0.5);
    }
  }, [pathname, appReady]);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      // Hide native splash so our premium index.tsx screen takes over
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) {
    return null;
  }

  // Calcule si la sidebar doit être visible sur la route courante
  const showSidebar = USE_NEW_SIDEBAR &&
    !SIDEBAR_HIDDEN_ROUTES.includes(pathname) &&
    !SIDEBAR_HIDDEN_PREFIXES.some(p => pathname.startsWith(p));

  return (
    <GestureHandlerRootView
      style={{ flex: 1, minHeight: Platform.OS === 'web' ? ('100vh' as any) : '100%', backgroundColor: '#1A0E2E' }}
      onLayout={onLayoutRootView}
      onTouchStart={() => SoundManager.unlockAudio()}
    >
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <LinearGradient
          colors={['#2D1B4E', '#1A0E2E']}
          style={{ flex: 1 }}
        >
          {/* ── Sidebar + Contenu ─────────────────────────────────────── */}
          <View style={{ flex: 1, flexDirection: 'row' }}>

            {/* Sidebar gauche (feature flag + masquage dynamique par route) */}
            {showSidebar && <Sidebar />}

            {/* Stack principal — prend toute la largeur restante */}
            <View style={{ flex: 1 }}>
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="home" />
                <Stack.Screen name="solo" />
                <Stack.Screen name="lobby" />
                <Stack.Screen name="game/[id]" />
                <Stack.Screen name="join/[id]" />
                <Stack.Screen name="profile" />
                <Stack.Screen
                  name="modal"
                  options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen
                  name="game-modes"
                  options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen
                  name="news/history"
                  options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                  }}
                />
              </Stack>
            </View>

          </View>
          {/* ──────────────────────────────────────────────────────────── */}

          <StatusBar hidden={true} />
        </LinearGradient>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
