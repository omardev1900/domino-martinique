import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
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
import { PurchaseSuccessModal } from '../src/components/PurchaseSuccessModal';

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

    const [purchaseSuccessItem, setPurchaseSuccessItem] = useState<{ id: string, name: string } | null>(null);

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
        const processPurchase = async () => {
            setProcessingPurchase(item.id);
            const result = await storeService.purchaseItem(item.id);
            if (result.success) {
                setEconomyRefresh(prev => prev + 1); // Trigger header refresh
                await loadData(); // Refresh inventory
                // Show Celebration modal if not a currency pack
                if (item.type !== 'CURRENCY_PACK') {
                    setPurchaseSuccessItem({ id: item.id, name: item.name });
                } else {
                    if (Platform.OS === 'web') {
                        window.alert("Devises ajoutées avec succès !");
                    } else {
                        Alert.alert("Succès", "Devises ajoutées avec succès !");
                    }
                }
            } else {
                if (Platform.OS === 'web') {
                    window.alert(result.message || "Une erreur est survenue.");
                } else {
                    Alert.alert("Erreur", result.message || "Une erreur est survenue.");
                }
            }
            setProcessingPurchase(null);
        };

        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`Voulez-vous acheter ${item.name} ?`);
            if (confirmed) {
                await processPurchase();
            }
        } else {
            Alert.alert(
                "Confirmer l'achat",
                `Voulez-vous acheter ${item.name} ?`,
                [
                    { text: "Annuler", style: "cancel" },
                    { text: "Acheter", style: "default", onPress: processPurchase }
                ]
            );
        }
    };

    const handleEquip = async (itemId: string) => {
        setProcessingPurchase(itemId);
        const result = await storeService.equipItem(itemId);
        if (result.success) {
            await loadData(); // Refresh inventory to show equipped status
            setPurchaseSuccessItem(null); // Close modal if open
        } else {
            if (Platform.OS === 'web') {
                window.alert(result.message || "Impossible d'équiper cet objet.");
            } else {
                Alert.alert("Erreur", result.message || "Impossible d'équiper cet objet.");
            }
        }
        setProcessingPurchase(null);
    };

    const StoreItemCard = ({
        item,
        inventory,
        economy,
        onPurchase,
        onEquip,
        isProcessing
    }: {
        item: StoreItem;
        inventory: PlayerInventory;
        economy: any;
        onPurchase: (item: StoreItem) => void;
        onEquip: (id: string) => void;
        isProcessing: boolean;
    }) => {
        const { width, height } = useWindowDimensions();
        const isLandscape = width > height;
        const [isExpanded, setIsExpanded] = useState(false);
        const isOwned = item.type !== 'CURRENCY_PACK' && inventory.ownedItems.includes(item.id);
        const isEquipped = item.type === 'AVATAR' ? inventory.equipped.avatar === item.id :
            item.type === 'SKIN' ? inventory.equipped.skin === item.id : false;

        const canAffordCoins = item.priceCoins ? (economy?.coins ?? 0) >= item.priceCoins : true;
        const canAffordDiamonds = item.priceDiamonds ? (economy?.diamonds ?? 0) >= item.priceDiamonds : true;
        const canAfford = canAffordCoins && canAffordDiamonds;

        return (
            <Animated.View entering={FadeIn} key={item.id} style={[styles.card, isLandscape && styles.cardLandscape, isLandscape && { width: width * 0.24 }]}>
                <View style={{ flex: 1 }}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.cardRarity}>{item.rarity}</Text>
                    </View>

                    <View style={styles.cardImagePlaceholder}>
                        {item.type === 'CURRENCY_PACK' && item.imageUrl ? (
                            <>
                                <Image source={{ uri: item.imageUrl }} style={styles.remoteImage} contentFit="cover" cachePolicy="memory-disk" />
                                <Text style={styles.currencyOverlayText}>{item.rewards?.coins?.toLocaleString('fr-FR') || ''}</Text>
                            </>
                        ) : item.type === 'SKIN' ? (
                            <View style={[styles.skinPreviewContainer, { backgroundColor: item.skinConfig ? item.skinConfig.tableBackgroundColor : '#2a1a4a' }]}>
                                {item.skinConfig ? (
                                    // 2 dominos en paysage côte à côte (comme en jeu)
                                    <View style={styles.skinPreviewPair}>
                                        {([{ l: 3, r: 1 }, { l: 2, r: 5 }] as { l: number; r: number }[]).map((vals, di) => (
                                            <View key={di} style={[styles.skinPreviewDomino, { backgroundColor: item.skinConfig!.dominoBackgroundColor }]}>
                                                <View style={styles.skinPreviewHalf}>
                                                    {Array.from({ length: vals.l }).map((_, i) => (
                                                        <View key={i} style={[styles.skinPreviewDot, { backgroundColor: item.skinConfig!.dominoDotColor }]} />
                                                    ))}
                                                </View>
                                                <View style={[styles.skinPreviewDivider, { backgroundColor: item.skinConfig!.dominoLineColor }]} />
                                                <View style={styles.skinPreviewHalf}>
                                                    {Array.from({ length: vals.r }).map((_, i) => (
                                                        <View key={i} style={[styles.skinPreviewDot, { backgroundColor: item.skinConfig!.dominoDotColor }]} />
                                                    ))}
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <Ionicons name="grid" size={36} color="rgba(255,255,255,0.4)" />
                                )}
                            </View>
                        ) : item.imageUrl ? (
                            <Image source={{ uri: item.imageUrl }} style={styles.remoteImage} contentFit="cover" cachePolicy="memory-disk" />
                        ) : (
                            <Ionicons name={item.type === 'AVATAR' ? 'person' : 'diamond'} size={40} color="rgba(255,255,255,0.5)" />
                        )}
                    </View>

                    <View style={styles.descriptionRow}>
                        <Text style={styles.cardDescription} numberOfLines={isExpanded ? undefined : 2}>
                            {item.description}
                        </Text>
                        {item.description && item.description.length > 35 && (
                            <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={styles.collapseBtn}>
                                <Text style={styles.collapseBtnText}>{isExpanded ? '<<' : '>>'}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    {!isOwned && (
                        <View style={styles.priceContainer}>
                            {item.priceCoins !== undefined && item.priceCoins > 0 && (
                                <Text style={styles.priceText}>🪙 {item.priceCoins}</Text>
                            )}
                            {item.priceDiamonds !== undefined && item.priceDiamonds > 0 && (
                                <Text style={[styles.priceText, { color: '#60DCFF' }]}>💎 {item.priceDiamonds}</Text>
                            )}
                            {item.priceCoins === 0 && item.priceDiamonds === undefined && (
                                <Text style={[styles.priceText, { color: '#4CAF50' }]}>GRATUIT</Text>
                            )}
                        </View>
                    )}

                    {isProcessing ? (
                        <ActivityIndicator color="#FFD700" size="small" />
                    ) : isEquipped ? (
                        <View style={styles.equippedBadge}>
                            <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                            <Text style={styles.equippedText}>Équipé</Text>
                        </View>
                    ) : isOwned ? (
                        <TouchableOpacity style={styles.equipButton} onPress={() => onEquip(item.id)}>
                            <Text style={styles.equipButtonText}>UTILISER</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.buyButton, !canAfford && { opacity: 0.5 }]}
                            onPress={() => onPurchase(item)}
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
                <View style={styles.headerTabsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.headerTabsScroll}>
                        {dynamicTabs.map(tab => {
                            const isActive = activeTab === tab.id;
                            return (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={[styles.headerTab, isActive && styles.activeHeaderTab]}
                                    onPress={() => setActiveTab(tab.id)}
                                >
                                    <Ionicons name={tab.icon} size={14} color={isActive ? '#1A0E2E' : '#FFF'} />
                                    {isLandscape && (
                                        <Text style={[styles.headerTabText, isActive && styles.activeHeaderTabText]}>
                                            {tab.label}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
                <EconomyHeader refreshTrigger={economyRefresh} hideXp={true} />
            </View>

            {/* Tabs */}

            <PurchaseSuccessModal
                visible={!!purchaseSuccessItem}
                itemName={purchaseSuccessItem?.name || ''}
                onClose={() => setPurchaseSuccessItem(null)}
                onEquip={() => purchaseSuccessItem && handleEquip(purchaseSuccessItem.id)}
            />

            {/* Content */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#FFD700" />
                </View>
            ) : (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.catalogGrid, isLandscape && styles.catalogGridLandscape]}
                    snapToInterval={width * 0.24 + 16}
                    decelerationRate="fast"
                >
                    {filteredCatalog.length > 0 ? (
                        filteredCatalog.map(item => (
                            inventory && (
                                <StoreItemCard
                                    key={item.id}
                                    item={item}
                                    inventory={inventory}
                                    economy={economy}
                                    onPurchase={handlePurchase}
                                    onEquip={handleEquip}
                                    isProcessing={processingPurchase === item.id}
                                />
                            )
                        ))
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
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginHorizontal: 12,
    },
    headerTabsContainer: {
        flex: 1,
        marginHorizontal: 10,
    },
    headerTabsScroll: {
        gap: 8,
        alignItems: 'center',
    },
    headerTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        gap: 6,
    },
    activeHeaderTab: {
        backgroundColor: '#FFD700',
        borderColor: '#FFD700',
    },
    headerTabText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 12,
    },
    activeHeaderTabText: {
        color: '#1A0E2E',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    catalogGrid: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 16,
    },
    catalogGridLandscape: {
        flexDirection: 'row',
        flexWrap: 'nowrap',
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
        height: 280,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
        flex: 1,
    },
    cardRarity: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 9,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    cardImagePlaceholder: {
        height: 100,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
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
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    skinPreviewPair: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    // Domino en paysage (horizontal, comme en jeu)
    skinPreviewDomino: {
        width: 72,
        height: 36,
        borderRadius: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        paddingHorizontal: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 3,
        elevation: 5,
    },
    skinPreviewHalf: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignContent: 'center',
        gap: 2,
    },
    skinPreviewDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
    },
    skinPreviewDivider: {
        width: 1.5,
        height: '100%',
        marginHorizontal: 2,
    },
    cardDescription: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        marginBottom: 8,
        lineHeight: 18,
    },
    descriptionRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 4,
    },
    collapseBtn: {
        paddingHorizontal: 4,
    },
    collapseBtnText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 12,
        minHeight: 48,
    },
    priceContainer: {
        flexDirection: 'column',
        gap: 2,
    },
    priceText: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 13,
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
        fontSize: 13,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        marginTop: 40,
    }
});
