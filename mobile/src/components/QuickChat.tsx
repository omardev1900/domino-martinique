import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const QUICK_MESSAGES = [
    'Bien joué !',
    'Aïe...',
    'Dépêche-toi !',
    'Chiré !'
];

const QUICK_EMOJIS = ['😂', '😡', '😱', '👏', '🥳', '😭'];

interface QuickChatProps {
    onSelectMessage: (msg: string) => void;
    onSelectEmoji: (emoji: string) => void;
}

export const QuickChat: React.FC<QuickChatProps> = ({ onSelectMessage, onSelectEmoji }) => {
    const [isOpen, setIsOpen] = useState(false);
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
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>QUICK CHAT</Text>
                            <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={20} color="#8B6508" />
                            </TouchableOpacity>
                        </View>

                        <View style={isLandscape ? styles.sectionsRow : styles.sectionsColumn}>
                            {/* Messages Section */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>MESSAGES</Text>
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
                            </View>

                            {/* Emojis Section */}
                            <View style={[styles.section, isLandscape && { marginLeft: 15 }]}>
                                <Text style={styles.sectionTitle}>EMOJIS</Text>
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
                            </View>
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
        backgroundColor: 'rgba(0,0,0,0.6)', // Black semi-transparent
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFD700', // Gold
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
        borderColor: '#FFD700', // Gold border
        padding: 12,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    menuPortrait: {
        width: 180,
    },
    menuLandscape: {
        width: 320,
    },
    menuContent: {
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: 'rgba(139, 101, 8, 0.2)',
        paddingBottom: 5,
        marginBottom: 10,
    },
    headerTitle: {
        color: '#8B6508',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    closeBtn: {
        padding: 2,
    },
    sectionsRow: {
        flexDirection: 'row',
    },
    sectionsColumn: {
        flexDirection: 'column',
    },
    section: {
        flex: 1,
    },
    sectionTitle: {
        color: '#666',
        fontSize: 9,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    messagesGrid: {
        flexDirection: 'column',
        gap: 5,
    },
    messageItem: {
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(139, 101, 8, 0.2)',
        alignItems: 'center',
    },
    messageText: {
        color: '#333',
        fontSize: 11,
        fontWeight: '600',
    },
    emojisGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
    emojiItem: {
        width: 35,
        height: 35,
        backgroundColor: 'white',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8CA8B',
    },
    emojiText: {
        fontSize: 20,
    },
});
