/**
 * EconomyHeader.tsx
 *
 * Barre de statut économique globale — Coins 🪙 + Diamonds 💎
 * Se rafraîchit automatiquement au focus de l'écran parent.
 *
 * Usage :
 *   <EconomyHeader refreshTrigger={focusTrigger} />
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';
import { economyService } from '../core/services/economy.service';
import { PlayerEconomy } from '../core/economy.types';

interface EconomyHeaderProps {
    /** Changer cette valeur pour forcer un refresh (ex: date au focus) */
    refreshTrigger?: any;
    /** Callback optionnel à appeler quand l'utilisateur tape sur les coins */
    onCoinsPress?: () => void;
    /** Callback optionnel à appeler quand l'utilisateur tape sur les diamonds */
    onDiamondsPress?: () => void;
}

export function EconomyHeader({ refreshTrigger, onCoinsPress, onDiamondsPress }: EconomyHeaderProps) {
    const [economy, setEconomy] = useState<PlayerEconomy>({
        coins: 0, xp: 0, level: 1, diamonds: 0, leaguePoints: 0, leagueGrade: 'APPRENTI',
    });

    const coinsScale = useSharedValue(1);
    const prevCoins = React.useRef(0);

    useEffect(() => {
        economyService.getEconomy().then(eco => {
            if (eco.coins !== prevCoins.current && prevCoins.current !== 0) {
                // Pulse animation when coins change
                coinsScale.value = withSequence(
                    withTiming(1.3, { duration: 150 }),
                    withTiming(1, { duration: 200 }),
                );
            }
            prevCoins.current = eco.coins;
            setEconomy(eco);
        });
    }, [refreshTrigger]);

    const coinsAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: coinsScale.value }],
    }));

    const formatAmount = (n: number) => {
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
        return String(n);
    };

    return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
            {/* Coins */}
            <TouchableOpacity
                style={styles.pill}
                onPress={onCoinsPress}
                activeOpacity={onCoinsPress ? 0.7 : 1}
            >
                <Text style={styles.pillIcon}>🪙</Text>
                <Animated.Text style={[styles.pillValue, coinsAnimStyle]}>
                    {formatAmount(economy.coins)}
                </Animated.Text>
            </TouchableOpacity>

            {/* Separator */}
            <View style={styles.sep} />

            {/* Diamonds */}
            <TouchableOpacity
                style={styles.pill}
                onPress={onDiamondsPress}
                activeOpacity={onDiamondsPress ? 0.7 : 1}
            >
                <Text style={styles.pillIcon}>💎</Text>
                <Text style={[styles.pillValue, styles.diamondValue]}>
                    {formatAmount(economy.diamonds)}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.25)',
        gap: 4,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 4,
    },
    pillIcon: {
        fontSize: 14,
        lineHeight: 18,
    },
    pillValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFD700',
        letterSpacing: 0.3,
        minWidth: 28,
        textAlign: 'right',
    },
    diamondValue: {
        color: '#60DCFF',
    },
    sep: {
        width: 1,
        height: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: 2,
    },
});
