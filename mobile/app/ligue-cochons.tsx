import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { LeagueHubView } from '../src/components/LeagueHubView';
import { adService } from '../src/core/services/ad.service';
import { Ad } from '../src/core/ad.types';
import { AdBannerModal } from '../src/components/AdBannerModal';

export default function LigueCochonsScreen() {
    const insets = useSafeAreaInsets();
    const [adToShow, setAdToShow] = useState<Ad | null>(null);
    const adTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useFocusEffect(
        useCallback(() => {
            adService.getAdForPlacement('LIGUE').then(ad => {
                if (ad) {
                    adTimeoutRef.current = setTimeout(() => setAdToShow(ad), 2000);
                }
            });
            return () => {
                if (adTimeoutRef.current) clearTimeout(adTimeoutRef.current);
            };
        }, [])
    );

    return (
        <LinearGradient colors={['#1A0535', '#0D0520', '#180830']} style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Text style={styles.headerTitle}>Ligue des Cochons</Text>
                <Text style={styles.headerSubtitle}>Ma Ligue et classements</Text>
            </View>

            <View style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
                <LeagueHubView />
            </View>
            <AdBannerModal ad={adToShow} onClose={() => setAdToShow(null)} />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 18,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,215,0,0.15)',
    },
    headerTitle: {
        color: '#FFD700',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 0.4,
        textAlign: 'center',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
});
