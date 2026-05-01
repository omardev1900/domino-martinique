import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ActivityIndicator } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../core/services/firebase';
import { economyService } from '../core/services/economy.service';
import { authService } from '../core/services/auth.service';
import { LogService } from '../core/services/LogService';

// ─── Fallback codé en dur (si Firestore hors ligne) ──────────────────────────

const FALLBACK_MESSAGES = [
    'Bien joué !', 'Aïe...', 'Dépêche-toi !', 'Chiré !',
    'Je passe...', 'Beau coup !', "Tu m'as bloqué !", "C'est mon tour !",
];

const FALLBACK_EMOJIS = ['😂', '😡', '😱', '👏', '🥳', '😭', '🤔', '🤫', '💀', '🔥', '🏆', '👎'];

// ─── Types ────────────────────────────────────────────────────────────────────

type CostType = 'free' | 'coins';

interface ChatItem {
    firestoreId: string;
    text: string;
    category: 'message' | 'emoji';
    costType: CostType;
    costAmount: number;
    order: number;
    enabled: boolean;
}

interface QuickChatProps {
    onSelectMessage: (msg: string) => void;
    onSelectEmoji: (emoji: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const QuickChat: React.FC<QuickChatProps> = ({ onSelectMessage, onSelectEmoji }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'messages' | 'emojis' | 'premium'>('messages');
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const isLandscape = width > height;

    // Données Firestore
    const [messages, setMessages] = useState<ChatItem[]>([]);
    const [emojis, setEmojis] = useState<ChatItem[]>([]);
    const [premiumItems, setPremiumItems] = useState<ChatItem[]>([]);
    const [chatLoading, setChatLoading] = useState(true);

    // Inventaire & économie
    const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
    const [userCoins, setUserCoins] = useState(0);
    const [purchaseMsg, setPurchaseMsg] = useState<string | null>(null);

    // Charger les items Firestore au montage
    useEffect(() => {
        const load = async () => {
            try {
                const snap = await getDocs(query(collection(db, 'chat_messages'), orderBy('order', 'asc')));
                const all = snap.docs
                    .map(d => ({ firestoreId: d.id, ...d.data() } as ChatItem))
                    .filter(i => i.enabled);

                const free_msgs = all.filter(i => i.category === 'message' && i.costType === 'free');
                const free_emojis = all.filter(i => i.category === 'emoji' && i.costType === 'free');
                const premium = all.filter(i => i.costType === 'coins');

                // Fallback si Firestore vide (admin n'a rien créé encore)
                if (free_msgs.length === 0 && free_emojis.length === 0 && premium.length === 0) {
                    setMessages(FALLBACK_MESSAGES.map((t, i) => ({
                        firestoreId: `fallback_msg_${i}`, text: t, category: 'message',
                        costType: 'free', costAmount: 0, order: i, enabled: true,
                    })));
                    setEmojis(FALLBACK_EMOJIS.map((t, i) => ({
                        firestoreId: `fallback_emoji_${i}`, text: t, category: 'emoji',
                        costType: 'free', costAmount: 0, order: i, enabled: true,
                    })));
                } else {
                    setMessages(free_msgs);
                    setEmojis(free_emojis);
                    setPremiumItems(premium);
                }
            } catch (e) {
                LogService.warn('QuickChat', 'Firestore fetch failed, using fallback', e);
                setMessages(FALLBACK_MESSAGES.map((t, i) => ({
                    firestoreId: `fallback_msg_${i}`, text: t, category: 'message',
                    costType: 'free', costAmount: 0, order: i, enabled: true,
                })));
                setEmojis(FALLBACK_EMOJIS.map((t, i) => ({
                    firestoreId: `fallback_emoji_${i}`, text: t, category: 'emoji',
                    costType: 'free', costAmount: 0, order: i, enabled: true,
                })));
            } finally {
                setChatLoading(false);
            }
        };
        load();
    }, []);

    // Charger l'inventaire et les coins au montage
    useEffect(() => {
        const loadEconomy = async () => {
            try {
                const eco = await economyService.getEconomy();
                setUserCoins(eco.coins ?? 0);
                setUnlockedIds(new Set(eco.unlockedChatItems ?? []));
            } catch (e) {
                LogService.warn('QuickChat', 'Failed to load economy', e);
            }
        };
        loadEconomy();
    }, []);

    const toggleMenu = () => setIsOpen(!isOpen);

    const handleSelectMessage = (msg: string) => {
        onSelectMessage(msg);
        setIsOpen(false);
    };

    const handleSelectEmoji = (emoji: string) => {
        onSelectEmoji(emoji);
        setIsOpen(false);
    };

    const handlePremiumSelect = async (item: ChatItem) => {
        // Déjà débloqué → utiliser directement
        if (unlockedIds.has(item.firestoreId)) {
            if (item.category === 'message') handleSelectMessage(item.text);
            else handleSelectEmoji(item.text);
            return;
        }

        // Pas assez de coins
        if (userCoins < item.costAmount) {
            setPurchaseMsg(`Il te faut ${item.costAmount} 🪙 pour débloquer cet item.`);
            setTimeout(() => setPurchaseMsg(null), 3000);
            return;
        }

        // Achat définitif
        try {
            const user = await authService.getCurrentUser();
            if (!user) return;

            const newCoins = userCoins - item.costAmount;
            const newUnlocked = [...unlockedIds, item.firestoreId];

            await economyService.setEconomy({
                coins: newCoins,
                unlockedChatItems: newUnlocked,
            });

            setUserCoins(newCoins);
            setUnlockedIds(new Set(newUnlocked));
            setPurchaseMsg(`"${item.text}" débloqué !`);
            setTimeout(() => setPurchaseMsg(null), 2500);

            if (item.category === 'message') handleSelectMessage(item.text);
            else handleSelectEmoji(item.text);
        } catch (e) {
            LogService.error('QuickChat', 'Purchase failed', e);
            setPurchaseMsg('Erreur lors de l\'achat.');
            setTimeout(() => setPurchaseMsg(null), 3000);
        }
    };

    return (
        <View style={styles.root}>
            {isOpen && (
                <Animated.View
                    entering={ZoomIn}
                    exiting={FadeOut}
                    style={[
                        styles.menuContainer,
                        isLandscape ? styles.menuLandscape : styles.menuPortrait,
                        { bottom: 70 + insets.bottom }
                    ]}
                >
                    <View style={styles.menuContent}>
                        {/* Header */}
                        <View style={styles.header}>
                            {purchaseMsg ? (
                                <Text style={styles.purchaseMsg}>{purchaseMsg}</Text>
                            ) : (
                                <Text style={styles.coinsLabel}>🪙 {userCoins}</Text>
                            )}
                            <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#8B6508" />
                            </TouchableOpacity>
                        </View>

                        {/* Tabs */}
                        <View style={styles.tabsContainer}>
                            <TouchableOpacity
                                style={[styles.tabButton, activeTab === 'messages' && styles.activeTabButton]}
                                onPress={() => setActiveTab('messages')}
                            >
                                <Ionicons
                                    name={activeTab === 'messages' ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
                                    size={20} color={activeTab === 'messages' ? '#332400' : '#8B6508'}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tabButton, activeTab === 'emojis' && styles.activeTabButton]}
                                onPress={() => setActiveTab('emojis')}
                            >
                                <Ionicons
                                    name={activeTab === 'emojis' ? 'happy' : 'happy-outline'}
                                    size={20} color={activeTab === 'emojis' ? '#332400' : '#8B6508'}
                                />
                            </TouchableOpacity>
                            {premiumItems.length > 0 && (
                                <TouchableOpacity
                                    style={[styles.tabButton, activeTab === 'premium' && styles.activeTabButton]}
                                    onPress={() => setActiveTab('premium')}
                                >
                                    <View style={styles.premiumTabIcon}>
                                        <Ionicons
                                            name="star"
                                            size={18} color={activeTab === 'premium' ? '#332400' : '#8B6508'}
                                        />
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Contenu */}
                        <View style={styles.contentArea}>
                            {chatLoading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator color="#8B6508" />
                                </View>
                            ) : (
                                <>
                                    {activeTab === 'messages' && (
                                        <View style={styles.messagesGrid}>
                                            {messages.map(item => (
                                                <TouchableOpacity
                                                    key={item.firestoreId}
                                                    style={styles.messageItem}
                                                    onPress={() => handleSelectMessage(item.text)}
                                                >
                                                    <Text style={styles.messageText}>{item.text}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                    {activeTab === 'emojis' && (
                                        <View style={styles.emojisGrid}>
                                            {emojis.map(item => (
                                                <TouchableOpacity
                                                    key={item.firestoreId}
                                                    style={styles.emojiItem}
                                                    onPress={() => handleSelectEmoji(item.text)}
                                                >
                                                    <Text style={styles.emojiText}>{item.text}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                    {activeTab === 'premium' && (
                                        <View style={styles.messagesGrid}>
                                            {premiumItems.map(item => {
                                                const owned = unlockedIds.has(item.firestoreId);
                                                return (
                                                    <TouchableOpacity
                                                        key={item.firestoreId}
                                                        style={[styles.messageItem, owned && styles.messageItemOwned]}
                                                        onPress={() => handlePremiumSelect(item)}
                                                    >
                                                        <Text style={styles.messageText}>{item.text}</Text>
                                                        {owned ? (
                                                            <Text style={styles.ownedBadge}>✓</Text>
                                                        ) : (
                                                            <Text style={styles.priceBadge}>🪙 {item.costAmount}</Text>
                                                        )}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    )}
                                </>
                            )}
                        </View>
                    </View>
                </Animated.View>
            )}

            {/* Bouton flottant */}
            <TouchableOpacity
                onPress={toggleMenu}
                activeOpacity={0.8}
                style={[styles.floatingButton, { bottom: 20 + insets.bottom, right: 20 + insets.right }]}
            >
                <Ionicons name="chatbubble-ellipses" size={28} color="#FFD700" />
            </TouchableOpacity>
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        zIndex: 1000,
    },
    floatingButton: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#FFD700',
        elevation: 5,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3, shadowRadius: 3,
    },
    menuContainer: {
        position: 'absolute', right: 20,
        backgroundColor: '#FDF5E6',
        borderRadius: 15, borderWidth: 2, borderColor: '#FFD700',
        padding: 5, elevation: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4, shadowRadius: 10,
    },
    menuPortrait: { width: 240 },
    menuLandscape: { width: 340 },
    menuContent: { width: '100%' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingHorizontal: 8, paddingTop: 5,
    },
    coinsLabel: {
        fontSize: 12, fontWeight: '700', color: '#8B6508',
    },
    purchaseMsg: {
        flex: 1, fontSize: 11, fontWeight: '700',
        color: '#4CAF50', marginRight: 4,
    },
    closeBtn: { padding: 4 },
    tabsContainer: {
        flexDirection: 'row', paddingHorizontal: 8, gap: 8, marginBottom: 10, marginTop: 6,
    },
    tabButton: {
        flex: 1, height: 40, justifyContent: 'center', alignItems: 'center',
        borderRadius: 10, backgroundColor: 'rgba(139, 101, 8, 0.1)',
        borderWidth: 1, borderColor: 'rgba(139, 101, 8, 0.2)',
    },
    activeTabButton: {
        backgroundColor: '#FFD700', borderColor: '#8B6508',
        elevation: 3, shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2,
    },
    premiumTabIcon: { flexDirection: 'row', alignItems: 'center' },
    contentArea: { paddingHorizontal: 8, paddingBottom: 12 },
    loadingContainer: { height: 80, justifyContent: 'center', alignItems: 'center' },
    messagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    messageItem: {
        width: '48%',
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        paddingVertical: 8, paddingHorizontal: 5,
        borderRadius: 8, borderWidth: 1,
        borderColor: 'rgba(139, 101, 8, 0.2)',
        alignItems: 'center',
    },
    messageItemOwned: {
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    messageText: {
        color: '#333', fontSize: 10, fontWeight: '700', textAlign: 'center',
    },
    priceBadge: {
        fontSize: 10, fontWeight: '800', color: '#8B6508', marginTop: 3,
    },
    ownedBadge: {
        fontSize: 11, fontWeight: '900', color: '#4CAF50', marginTop: 3,
    },
    emojisGrid: {
        flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8,
    },
    emojiItem: {
        width: 45, height: 45, backgroundColor: 'white', borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#E8CA8B', elevation: 2,
    },
    emojiText: { fontSize: 22 },
});
