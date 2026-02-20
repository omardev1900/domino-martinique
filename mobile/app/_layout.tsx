import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useState, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { AnimatedSplashScreen } from '@/components/AnimatedSplashScreen';
import { View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SoundManager from '@/core/audio/SoundManager';

// Keep the splash screen visible while we fetch resources
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
      background-color: #0d1f0d; /* Prevent white flash */
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
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await SoundManager.preloadSounds();
        // Start Menu Music immediately
        SoundManager.playMusic('bgm3', 0.5);

        await new Promise(resolve => setTimeout(resolve, 100)); // Simulating load
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppReady(true);
      }
    }

    prepare();
  }, []);

  // Global Music Manager
  useEffect(() => {
    if (!appReady) return;

    if (pathname.startsWith('/game')) {
      // In Game -> BGM 1
      SoundManager.playMusic('bgm1', 0.3);
    } else {
      // Menu / Lobby / Home -> BGM 3
      SoundManager.playMusic('bgm3', 0.5);
    }
  }, [pathname, appReady]);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      // This tells the native splash screen to hide immediately!
      // We do this as soon as the app is ready, to show our AnimatedSplashScreen
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, minHeight: Platform.OS === 'web' ? ('100vh' as any) : '100%', backgroundColor: '#0d1f0d' }} onLayout={onLayoutRootView}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.95)', 'rgba(26, 10, 46, 0.98)']}
          style={{ flex: 1 }}
        >
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="home" />
            <Stack.Screen name="solo" />
            <Stack.Screen name="lobby" />
            <Stack.Screen name="game/[id]" />
            <Stack.Screen name="profile" />
            <Stack.Screen
              name="modal"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom'
              }}
            />
          </Stack>

          {/* Animated Splash Screen Overlay */}
          {!splashAnimationFinished && (
            <AnimatedSplashScreen
              onAnimationFinish={() => setSplashAnimationFinished(true)}
            />
          )}

          <StatusBar style="light" />
        </LinearGradient>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
