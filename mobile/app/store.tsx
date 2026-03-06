import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, useWindowDimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

import { EconomyHeader } from '../src/components/EconomyHeader';
import { storeService } from '../src/core/services/store.service';
import { economyService } from '../src/core/services/economy.service';
import { StoreItem, StoreItemType, PlayerInventory } from '../src/core/store.types';
import { useFocusEffect } from '@react-navigation/native';

type TabType = 'ALL' | StoreItemType;

export default function StoreScreen() {
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('ALL');
    const [inventory, setInventory] = useState<PlayerInventory | null>(null);
    const [catalog, setCatalog] = useState<StoreItem[]>([]);
    const [economy, setEconomy] = useState<any>(null); // Type formel ou any pour stocker economy
    const [loading, setLoading] = useState(true);
    const [processingPurchase, setProcessingPurchase] = useState<string | null>(null);
    const [economyRefresh, setEconomyRefresh] = useState(0);

    const loadData = async () => {
        try {
            const [inv, cat, eco] = await Promise.all([
                storeService.getInventory(),
                storeService.getCatalog(),
                economyService.getEconomy()
            ]);
            setInventory(inv);
            setCatalog(cat);
            setEconomy(eco);
        } catch (error) {
            console.error('Failed to load store data', error);
        } finally {
            setLoading(false);
        }
    };

    // Génération dynamique des onglets basée sur les données reçues
    const dynamicTabs = useMemo(() => {
        const types = Array.from(new Set(catalog.map(item => item.type)));
        const tabs: { id: TabType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
            { id: 'ALL', label: 'À la une', icon: 'star' }
        ];

        if (types.includes('AVATAR')) tabs.push({ id: 'AVATAR', label: 'Avatars', icon: 'person' });
        if (types.includes('SKIN')) tabs.push({ id: 'SKIN', label: 'Skins', icon: 'color-palette' });
        if (types.includes('CURRENCY_PACK')) tabs.push({ id: 'CURRENCY_PACK', label: 'Devises', icon: 'diamond' });
        if (types.includes('EMOTE')) tabs.push({ id: 'EMOTE', label: 'Emotions', icon: 'happy' });

        return tabs;
    }, [catalog]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const handlePurchase = async (item: StoreItem) => {
        Alert.alert(
            "Confirmer l'achat",
            `Voulez-vous acheter ${item.name} ?`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Acheter",
                    style: "default",
                    onPress: async () => {
                        setProcessingPurchase(item.id);
                        const result = await storeService.purchaseItem(item.id);
                        if (result.success) {
                            Alert.alert("Succès", "Achat effectué avec succès !");
                            setEconomyRefresh(prev => prev + 1); // Trigger header refresh
                            await loadData(); // Refresh inventory
                        } else {
                            Alert.alert("Erreur", result.message || "Une erreur est survenue.");
                        }
                        setProcessingPurchase(null);
                    }
                }
            ]
        );
    };

    const handleEquip = async (item: StoreItem) => {
        setProcessingPurchase(item.id);
        const result = await storeService.equipItem(item.id);
        if (result.success) {
            await loadData(); // Refresh inventory to show equipped status
        } else {
            Alert.alert("Erreur", result.message || "Impossible d'équiper cet objet.");
        }
        setProcessingPurchase(null);
    };

    const renderItemCard = (item: StoreItem) => {
        if (!inventory) return null;

        const isOwned = item.type !== 'CURRENCY_PACK' && inventory.ownedItems.includes(item.id);
        const isEquipped = item.type === 'AVATAR' ? inventory.equipped.avatar === item.id :
            item.type === 'SKIN' ? inventory.equipped.skin === item.id : false;

        const isProcessing = processingPurchase === item.id;

        // Validation des fonds
        const canAffordCoins = item.priceCoins ? (economy?.coins ?? 0) >= item.priceCoins : true;
        const canAffordDiamonds = item.priceDiamonds ? (economy?.diamonds ?? 0) >= item.priceDiamonds : true;
        const canAfford = canAffordCoins && canAffordDiamonds;

        return (
            <Animated.View entering={FadeIn} key={item.id} style={[styles.card, isLandscape && styles.cardLandscape]}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardRarity}>{item.rarity}</Text>
                </View>

                {/* Graphic or Firestore Remote Image */}
                <View style={[styles.cardImagePlaceholder, isLandscape && { height: 100 }]}>
                    {item.type === 'CURRENCY_PACK' && item.imageUrl ? (
                        <>
                            <Image source={{ uri: item.imageUrl }} style={styles.remoteImage} resizeMode="cover" />
                            <Text style={styles.currencyOverlayText}>
                                {item.rewards?.coins?.toLocaleString('fr-FR') || ''}
                            </Text>
                        </>
                    ) : item.type === 'SKIN' ? (
                        <View style={[styles.skinPreviewContainer, { backgroundColor: item.skinConfig ? item.skinConfig.tableBackgroundColor : '#555555' }]}>
                            {item.skinConfig && (
                                <View style={[styles.skinPreviewDomino, { backgroundColor: item.skinConfig.dominoBackgroundColor }]}>
                                    {/* Top Half */}
                                    <View style={styles.skinPreviewHalf}>
                                        <View style={[styles.skinPreviewDot, { backgroundColor: item.skinConfig.dominoDotColor }]} />
                                        <View style={[styles.skinPreviewDot, { backgroundColor: item.skinConfig.dominoDotColor, opacity: 0 }]} />
                                        <View style={[styles.skinPreviewDot, { backgroundColor: item.skinConfig.dominoDotColor }]} />
                                    </View>
                                    {/* Divider */}
                                    <View style={[styles.skinPreviewDivider, { backgroundColor: item.skinConfig.dominoLineColor }]} />
                                    {/* Bottom Half */}
                                    <View style={styles.skinPreviewHalf}>
                                        <View style={[styles.skinPreviewDot, { backgroundColor: item.skinConfig.dominoDotColor, opacity: 0 }]} />
                                        <View style={[styles.skinPreviewDot, { backgroundColor: item.skinConfig.dominoDotColor }]} />
                                        <View style={[styles.skinPreviewDot, { backgroundColor: item.skinConfig.dominoDotColor, opacity: 0 }]} />
                                    </View>
                                </View>
                            )}
                        </View>
                    ) : item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.remoteImage} resizeMode="cover" />
                    ) : (
                        <Ionicons
                            name={item.type === 'AVATAR' ? 'person' : 'diamond'}
                            size={48}
                            color="rgba(255,255,255,0.5)"
                        />
                    )}
                </View>

                <Text style={styles.cardDescription}>{item.description}</Text>

                <View style={styles.cardFooter}>
                    {!isOwned && (
                        <View style={styles.priceContainer}>
                            {item.priceCoins !== undefined && item.priceCoins > 0 && (
                                <Text style={styles.priceText}>
                                    🪙 {item.priceCoins}
                                </Text>
                            )}
                            {item.priceDiamonds !== undefined && item.priceDiamonds > 0 && (
                                <Text style={[styles.priceText, { color: '#60DCFF' }]}>
                                    💎 {item.priceDiamonds}
                                </Text>
                            )}
                            {item.priceCoins === 0 && item.priceDiamonds === undefined && (
                                <Text style={[styles.priceText, { color: '#4CAF50' }]}>GRATUIT</Text>
                            )}
                        </View>
                    )}

                    {isProcessing ? (
                        <ActivityIndicator color="#FFD700" />
                    ) : isEquipped ? (
                        <View style={styles.equippedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                            <Text style={styles.equippedText}>Équipé</Text>
                        </View>
                    ) : isOwned ? (
                        <TouchableOpacity style={styles.equipButton} onPress={() => handleEquip(item)}>
                            <Text style={styles.equipButtonText}>Équiper</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.buyButton, !canAfford && { opacity: 0.5 }]}
                            onPress={() => handlePurchase(item)}
                            disabled={!canAfford}
                        >
                            <Text style={styles.buyButtonText}>Acheter</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>
        );
    };

    const filteredCatalog = activeTab === 'ALL'
        ? catalog
        : catalog.filter(item => item.type === activeTab);

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#1A0E2E', '#0A0514']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/home')}>
                    <Ionicons name="home" size={24} color="#FFF" />
                </TouchableOpacity>
                <EconomyHeader refreshTrigger={economyRefresh} />
            </View>

            <Text style={styles.pageTitle}>LA BOUTIQUE</Text>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                    {dynamicTabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <TouchableOpacity
                                key={tab.id}
                                style={[styles.tab, isActive && styles.activeTab]}
                                onPress={() => setActiveTab(tab.id)}
                            >
                                <Ionicons name={tab.icon} size={16} color={isActive ? '#1A0E2E' : '#FFF'} />
                                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#FFD700" />
                </View>
            ) : (
                <ScrollView
                    horizontal={isLandscape}
                    contentContainerStyle={[styles.catalogGrid, isLandscape && styles.catalogGridLandscape]}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={isLandscape ? 280 + 20 : undefined}
                    decelerationRate="fast"
                >
                    {filteredCatalog.length > 0 ? (
                        filteredCatalog.map(item => renderItemCard(item))
                    ) : (
                        <Text style={styles.emptyText}>Aucun article dans cette catégorie pour le moment.</Text>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A0E2E',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10, // Give some space before economy header
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFD700',
        letterSpacing: 2,
        textAlign: 'center',
        marginBottom: 20,
    },
    tabsContainer: {
        marginBottom: 20,
    },
    tabsScroll: {
        paddingHorizontal: 20,
        gap: 12,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
    },
    activeTab: {
        backgroundColor: '#FFD700',
    },
    tabText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    activeTabText: {
        color: '#1A0E2E',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    catalogGrid: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 20,
    },
    catalogGridLandscape: {
        paddingHorizontal: 40,
        gap: 20,
        alignItems: 'center',
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardLandscape: {
        width: 280,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cardRarity: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    cardImagePlaceholder: {
        height: 120,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        overflow: 'hidden',
    },
    remoteImage: {
        width: '100%',
        height: '100%',
    },
    currencyOverlayText: {
        position: 'absolute',
        color: '#FFD700', // Yellow/Orange
        fontSize: 32,
        fontWeight: '900',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
        letterSpacing: 1,
    },
    skinPreviewContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    skinPreviewDomino: {
        width: 30,
        height: 60,
        borderRadius: 4,
        flexDirection: 'column',
        justifyContent: 'space-between',
        paddingVertical: 4,
        paddingHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 5,
    },
    skinPreviewHalf: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignContent: 'center',
        gap: 2,
        padding: 2,
    },
    skinPreviewDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    skinPreviewDivider: {
        height: 2,
        width: '100%',
        marginVertical: 2,
    },
    cardDescription: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 16,
    },
    priceContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    priceText: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 16,
    },
    buyButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    buyButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    equipButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    equipButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    equippedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    equippedText: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    emptyText: {
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        marginTop: 40,
    }
});
