import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, useWindowDimensions, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';

import { storeService } from '../src/core/services/store.service';
import { StoreItem, StoreItemType, PlayerInventory } from '../src/core/store.types';
import { useFocusEffect } from '@react-navigation/native';

type TabType = 'ALL' | StoreItemType;

export default function CollectionScreen() {
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('ALL');
    const [inventory, setInventory] = useState<PlayerInventory | null>(null);
    const [ownedItems, setOwnedItems] = useState<StoreItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingEquip, setProcessingEquip] = useState<string | null>(null);

    const loadData = async () => {
        try {
            const [inv, cat] = await Promise.all([
                storeService.getInventory(),
                storeService.getCatalog(),
            ]);
            setInventory(inv);

            // Filter catalog to only show items the player owns
            const filteredItems = cat.filter(item =>
                item.type !== 'CURRENCY_PACK' && inv.ownedItems.includes(item.id)
            );
            setOwnedItems(filteredItems);

        } catch (error) {
            console.error('Failed to load collection data', error);
        } finally {
            setLoading(false);
        }
    };

    // Génération dynamique des onglets basée sur les données possédées reçues
    const dynamicTabs = useMemo(() => {
        const types = Array.from(new Set(ownedItems.map(item => item.type)));
        const tabs: { id: TabType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
            { id: 'ALL', label: 'Tout', icon: 'grid' }
        ];

        if (types.includes('AVATAR')) tabs.push({ id: 'AVATAR', label: 'Avatars', icon: 'person' });
        if (types.includes('SKIN')) tabs.push({ id: 'SKIN', label: 'Skins', icon: 'color-palette' });
        if (types.includes('EMOTE')) tabs.push({ id: 'EMOTE', label: 'Emotions', icon: 'happy' });

        return tabs;
    }, [ownedItems]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const handleEquip = async (itemId: string) => {
        setProcessingEquip(itemId);
        const result = await storeService.equipItem(itemId);
        if (result.success) {
            await loadData(); // Refresh inventory to show equipped status
        } else {
            if (Platform.OS === 'web') {
                window.alert(result.message || "Impossible d'équiper cet objet.");
            } else {
                Alert.alert("Erreur", result.message || "Impossible d'équiper cet objet.");
            }
        }
        setProcessingEquip(null);
    };

    const CollectionItem = ({
        item,
        isEquipped,
        onEquip,
        isProcessing
    }: {
        item: StoreItem;
        isEquipped: boolean;
        onEquip: (id: string) => void;
        isProcessing: boolean;
    }) => {
        const { width, height } = useWindowDimensions();
        const isLandscape = width > height;
        const [isExpanded, setIsExpanded] = useState(false);

        return (
            <Animated.View
                entering={FadeIn}
                key={item.id}
                style={[
                    styles.card,
                    isLandscape ? styles.cardLandscape : null,
                    isEquipped ? styles.cardEquipped : null,
                    isLandscape ? { width: width * 0.24 } : null
                ]}
            >
                <View style={{ flex: 1 }}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.cardRarity}>{item.rarity}</Text>
                    </View>

                    <View style={styles.cardImagePlaceholder}>
                        {item.type === 'SKIN' ? (
                            <View style={[styles.skinPreviewContainer, { backgroundColor: item.skinConfig ? item.skinConfig.tableBackgroundColor : '#555555' }]}>
                                {item.skinConfig ? (
                                    <View style={[styles.skinPreviewDomino, { backgroundColor: item.skinConfig.dominoBackgroundColor }]}>
                                        <View style={styles.skinPreviewHalf}>
                                            <View style={[styles.skinPreviewDot, { backgroundColor: item.skinConfig.dominoDotColor }]} />
                                            <View style={[styles.skinPreviewDot, { backgroundColor: item.skinConfig.dominoDotColor, opacity: 0 }]} />
                                            <View style={[styles.skinPreviewDot, { backgroundColor: item.skinConfig.dominoDotColor }]} />
                                        </View>
                                        <View style={[styles.skinPreviewDivider, { backgroundColor: item.skinConfig.dominoLineColor }]} />
                                        <View style={styles.skinPreviewHalf}>
                                            <View style={[styles.skinPreviewDot, { backgroundColor: item.skinConfig.dominoDotColor, opacity: 0 }]} />
                                            <View style={[styles.skinPreviewDot, { backgroundColor: item.skinConfig.dominoDotColor }]} />
                                            <View style={[styles.skinPreviewDot, { backgroundColor: item.skinConfig.dominoDotColor, opacity: 0 }]} />
                                        </View>
                                    </View>
                                ) : null}
                            </View>
                        ) : item.imageUrl ? (
                            <Image
                                source={{ uri: item.imageUrl }}
                                style={styles.remoteImage}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                            />
                        ) : (
                            <Ionicons
                                name={item.type === 'AVATAR' ? 'person' : 'color-palette'}
                                size={40}
                                color="rgba(255,255,255,0.5)"
                            />
                        )}
                    </View>

                    <View style={styles.descriptionRow}>
                        <Text
                            style={styles.cardDescription}
                            numberOfLines={isExpanded ? undefined : 2}
                        >
                            {item.description}
                        </Text>
                        {(item.description && item.description.length > 40) ? (
                            <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={styles.collapseBtn}>
                                <Text style={styles.collapseBtnText}>{isExpanded ? '<<' : '>>'}</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    {isProcessing ? (
                        <ActivityIndicator color="#FFD700" size="small" />
                    ) : isEquipped ? (
                        <View style={styles.equippedBadge}>
                            <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                            <Text style={styles.equippedText}>Utilisé</Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.equipButton} onPress={() => onEquip(item.id)}>
                            <Text style={styles.equipButtonText}>UTILISER</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>
        );
    };

    const filteredItems = activeTab === 'ALL'
        ? ownedItems
        : ownedItems.filter(item => item.type === activeTab);

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#0F2027', '#203A43', '#2C5364']} // A different elegant gradient for the collection
                style={StyleSheet.absoluteFillObject}
            />

            {/* Header */}
            <View style={styles.header}>
                {/* Tabs moved to Header Right */}
                <View style={styles.headerTabsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.headerTabsScroll}>
                        {dynamicTabs.map(tab => {
                            const isActive = activeTab === tab.id;
                            return (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={[styles.headerTab, isActive ? styles.activeHeaderTab : null]}
                                    onPress={() => setActiveTab(tab.id)}
                                >
                                    <Ionicons name={tab.icon} size={14} color={isActive ? '#1A0E2E' : '#FFF'} />
                                    {isLandscape ? (
                                        <Text style={[styles.headerTabText, isActive ? styles.activeHeaderTabText : null]}>
                                            {tab.label}
                                        </Text>
                                    ) : null}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>


            {/* Content */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#FFD700" />
                </View>
            ) : ownedItems.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="sad-outline" size={64} color="rgba(255,255,255,0.5)" />
                    <Text style={styles.emptyText}>Votre vestiaire est vide.</Text>
                    <Text style={styles.emptySubText}>Visitez la boutique pour acquérir de nouveaux objets !</Text>
                    <TouchableOpacity style={styles.goToStoreButton} onPress={() => router.push('/store')}>
                        <Text style={styles.goToStoreText}>Aller à la Boutique</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.grid, isLandscape && styles.gridLandscape]}
                    snapToInterval={width * 0.24 + 16} // Standardized card dimension + gap
                    decelerationRate="fast"
                >
                    {filteredItems.map(item => {
                        const isEquipped = inventory ? (
                            item.type === 'AVATAR' ? inventory.equipped.avatar === item.id :
                                item.type === 'SKIN' ? inventory.equipped.skin === item.id : false
                        ) : false;
                        return (
                            <CollectionItem
                                key={item.id}
                                item={item}
                                isEquipped={!!isEquipped}
                                onEquip={handleEquip}
                                isProcessing={processingEquip === item.id}
                            />
                        );
                    })}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F2027',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 5,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 16, // Slightly smaller
        fontWeight: 'bold',
        letterSpacing: 1,
        marginHorizontal: 10,
    },
    headerTabsContainer: {
        flex: 1,
        maxWidth: '65%',
    },
    headerTabsScroll: {
        paddingRight: 10,
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
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        gap: 8,
    },
    activeTab: {
        backgroundColor: '#FFD700',
        borderColor: '#FFD700',
    },
    tabText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
    activeTabText: {
        color: '#1A0E2E',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
    },
    emptySubText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    goToStoreButton: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    goToStoreText: {
        color: '#1A0E2E',
        fontWeight: 'bold',
        fontSize: 16,
    },
    grid: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 16,
    },
    gridLandscape: {
        flexDirection: 'row',
        flexWrap: 'nowrap', // Force horizontal row
        alignItems: 'center',
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    cardEquipped: {
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    cardLandscape: {
        height: 250, // Force same height
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        color: '#FFF',
        fontSize: 14, // Reduced from 18
        fontWeight: 'bold',
        flex: 1,
    },
    cardRarity: {
        color: '#A020F0', // Or anything custom
        fontSize: 9, // Reduced from 12
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    cardImagePlaceholder: {
        height: 100, // Reduced from 140
        backgroundColor: 'rgba(0,0,0,0.3)',
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
    cardDescription: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 12,
        minHeight: 48,
    },
    equipButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    equipButtonText: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 14,
    },
    equippedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    equippedText: {
        color: '#4CAF50',
        fontWeight: 'bold',
        fontSize: 14,
    },
    skinPreviewContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    skinPreviewDomino: {
        width: 40,
        height: 80,
        borderRadius: 6,
        padding: 4,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
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
    skinPreviewDivider: {
        height: 2,
        width: '100%',
        marginVertical: 2,
    },
    skinPreviewDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        margin: 1,
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
});
