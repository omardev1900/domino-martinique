import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const QUICK_MESSAGES = [
    'Bien joué !',
    'Aïe...',
    'Dépêche-toi !',
    'Chiré !',
    'Je passe...',
    'Beau coup !',
    "Tu m'as bloqué !",
    "C'est mon tour !"
];

const QUICK_EMOJIS = ['😂', '😡', '😱', '👏', '🥳', '😭', '🤔', '🤫', '💀', '🔥', '🏆', '👎'];

interface QuickChatProps {
    onSelectMessage: (msg: string) => void;
    onSelectEmoji: (emoji: string) => void;
}

export const QuickChat: React.FC<QuickChatProps> = ({ onSelectMessage, onSelectEmoji }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'messages' | 'emojis' | 'premium'>('messages');
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const isLandscape = width > height;

    const toggleMenu = () => setIsOpen(!isOpen);

    const handleSelectMessage = (msg: string) => {
        onSelectMessage(msg);
        setIsOpen(false);
    };

    const handleSelectEmoji = (emoji: string) => {
        onSelectEmoji(emoji);
        setIsOpen(false);
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
                        {/* Header - No Title, Just Close Button */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#8B6508" />
                            </TouchableOpacity>
                        </View>

                        {/* Tabs Navigation */}
                        <View style={styles.tabsContainer}>
                            <TouchableOpacity
                                style={[styles.tabButton, activeTab === 'messages' && styles.activeTabButton]}
                                onPress={() => setActiveTab('messages')}
                            >
                                <Ionicons
                                    name={activeTab === 'messages' ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
                                    size={20}
                                    color={activeTab === 'messages' ? "#332400" : "#8B6508"}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tabButton, activeTab === 'emojis' && styles.activeTabButton]}
                                onPress={() => setActiveTab('emojis')}
                            >
                                <Ionicons
                                    name={activeTab === 'emojis' ? "happy" : "happy-outline"}
                                    size={20}
                                    color={activeTab === 'emojis' ? "#332400" : "#8B6508"}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tabButton, activeTab === 'premium' && styles.activeTabButton]}
                                onPress={() => setActiveTab('premium')}
                            >
                                <View style={styles.premiumTabIcon}>
                                    <Ionicons
                                        name="star-outline"
                                        size={18}
                                        color={activeTab === 'premium' ? "#332400" : "#8B6508"}
                                    />
                                    <View style={styles.lockBadge}>
                                        <Ionicons name="lock-closed" size={10} color="#8B6508" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Content Area */}
                        <View style={styles.contentArea}>
                            {activeTab === 'messages' && (
                                <View style={styles.messagesGrid}>
                                    {QUICK_MESSAGES.map((msg, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            style={styles.messageItem}
                                            onPress={() => handleSelectMessage(msg)}
                                        >
                                            <Text style={styles.messageText}>{msg}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                            {activeTab === 'emojis' && (
                                <View style={styles.emojisGrid}>
                                    {QUICK_EMOJIS.map((emoji, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            style={styles.emojiItem}
                                            onPress={() => handleSelectEmoji(emoji)}
                                        >
                                            <Text style={styles.emojiText}>{emoji}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                            {activeTab === 'premium' && (
                                <View style={styles.premiumEmptyContainer}>
                                    <Ionicons name="diamond-outline" size={40} color="rgba(139, 101, 8, 0.2)" />
                                    <Text style={styles.premiumText}>Contenu Premium</Text>
                                    <Text style={styles.premiumSubtext}>Bientôt disponible</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </Animated.View>
            )}

            {/* Floating Toggle Button */}
            <TouchableOpacity
                onPress={toggleMenu}
                activeOpacity={0.8}
                style={[
                    styles.floatingButton,
                    { bottom: 20 + insets.bottom, right: 20 + insets.right }
                ]}
            >
                <Ionicons name="chatbubble-ellipses" size={28} color="#FFD700" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        zIndex: 1000,
    },
    floatingButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFD700',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    menuContainer: {
        position: 'absolute',
        right: 20,
        backgroundColor: '#FDF5E6', // Premium Parchment
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#FFD700',
        padding: 5, // Tighter padding for tabs
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    menuPortrait: {
        width: 240,
    },
    menuLandscape: {
        width: 340,
    },
    menuContent: {
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingRight: 5,
        paddingTop: 5,
    },
    closeBtn: {
        padding: 4,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        gap: 8,
        marginBottom: 10,
    },
    tabButton: {
        flex: 1,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        backgroundColor: 'rgba(139, 101, 8, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(139, 101, 8, 0.2)',
    },
    activeTabButton: {
        backgroundColor: '#FFD700',
        borderColor: '#8B6508',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    tabText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#8B6508',
        letterSpacing: 1,
    },
    activeTabText: {
        color: '#332400',
    },
    contentArea: {
        paddingHorizontal: 8,
        paddingBottom: 12,
    },
    messagesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    messageItem: {
        width: '48%', // 2 columns
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        paddingVertical: 8,
        paddingHorizontal: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(139, 101, 8, 0.2)',
        alignItems: 'center',
    },
    messageText: {
        color: '#333',
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center',
    },
    premiumTabIcon: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lockBadge: {
        position: 'absolute',
        bottom: -2,
        right: -6,
        backgroundColor: 'rgba(255, 215, 0, 0.8)',
        borderRadius: 6,
        padding: 1,
    },
    premiumEmptyContainer: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    premiumText: {
        color: '#8B6508',
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    premiumSubtext: {
        color: '#A88B4A',
        fontSize: 11,
        fontStyle: 'italic',
    },
    emojisGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
    emojiItem: {
        width: 45,
        height: 45,
        backgroundColor: 'white',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8CA8B',
        elevation: 2,
    },
    emojiText: {
        fontSize: 22,
    },
});
