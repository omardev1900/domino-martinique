import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useState, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { LinearGradient } from 'expo-linear-gradient';
import SoundManager from '@/core/audio/SoundManager';
import SettingsManager from '@/core/SettingsManager';

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

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appReady, setAppReady] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    async function prepare() {
      try {
        await SettingsManager.loadSettings();

        // Preload audio assets
        await SoundManager.preloadSounds();

        // Android Immersive Mode
        if (Platform.OS === 'android') {
          try {
            await NavigationBar.setVisibilityAsync('hidden');
            await NavigationBar.setBehaviorAsync('overlay-swipe');
          } catch (e) {
            // Support errors on newer Android versions with edge-to-edge
          }
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

          <StatusBar style="light" />
        </LinearGradient>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
