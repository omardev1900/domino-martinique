import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

// Maintain the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export function AnimatedSplashScreen({
    onAnimationFinish,
}: {
    onAnimationFinish: () => void;
}) {
    const animation = useMemo(() => new Animated.Value(1), []);
    const [isAppReady, setAppReady] = useState(false);
    const [isSplashAnimationComplete, setAnimationComplete] = useState(false);

    useEffect(() => {
        if (isAppReady) {
            Animated.timing(animation, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
            }).start(() => {
                setAnimationComplete(true);
                onAnimationFinish();
            });
        }
    }, [isAppReady, animation, onAnimationFinish]);

    useEffect(() => {
        async function prepare() {
            try {
                // You can load resources here if needed, or rely on parent
                await Promise.all([]);
            } catch (e) {
                console.warn(e);
            } finally {
                setAppReady(true);
            }
        }
        prepare();
    }, []);

    if (isSplashAnimationComplete) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: Constants.expoConfig?.splash?.backgroundColor || '#0d1f0d',
                        opacity: animation,
                        alignItems: 'center',
                        justifyContent: 'center',
                    },
                ]}
            >
                <Animated.Image
                    style={{
                        width: '100%',
                        height: '100%',
                        resizeMode: Constants.expoConfig?.splash?.resizeMode || 'contain',
                        transform: [
                            {
                                scale: animation,
                            },
                        ],
                    }}
                    source={require('@/assets/images/splash-icon.png')}
                    onLoadEnd={async () => {
                        // Image loaded, waiting for app ready
                        await SplashScreen.hideAsync();
                    }}
                    fadeDuration={0}
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999, // Ensure it's on top of EVERYTHING
        elevation: 100, // Android
    },
});
