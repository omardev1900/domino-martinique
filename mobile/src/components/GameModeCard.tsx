import React from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface GameModeCardProps {
    id: string;
    title: string;
    description: string;
    icon: string;
    colors: [string, string, ...string[]];
    onPress: () => void;
    delay?: number;
    compact?: boolean;
}

export const GameModeCard: React.FC<GameModeCardProps> = ({
    title,
    description,
    icon,
    colors,
    onPress,
    delay = 0,
    compact = false
}) => {
    return (
        <Animated.View 
            entering={FadeInUp.delay(delay).duration(400)}
            style={styles.wrapper}
        >
            <TouchableOpacity
                style={[styles.card, compact && styles.cardCompact]}
                onPress={onPress}
                activeOpacity={0.8}
            >
                <View style={styles.cardInner}>
                    {/* Shadow/Glow effect behind the icon */}
                    <View style={[styles.glow, { backgroundColor: colors[0] }]} />
                    
                    <View style={styles.iconContainer}>
                        <LinearGradient 
                            colors={colors} 
                            style={styles.iconGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.iconEmoji}>{icon}</Text>
                        </LinearGradient>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.description} numberOfLines={2}>
                            {description}
                        </Text>
                    </View>

                    <View style={styles.actionContainer}>
                        <Ionicons 
                            name="chevron-forward" 
                            size={20} 
                            color="rgba(255,255,255,0.2)" 
                        />
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        marginBottom: 8,
    },
    card: {
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
    },
    cardCompact: {
        borderRadius: 18,
    },
    cardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    glow: {
        position: 'absolute',
        top: '10%',
        left: 10,
        width: 60,
        height: 60,
        borderRadius: 30,
        opacity: 0.15,
        filter: 'blur(20px)', // Note: This might need specific handling or just remain symbolic for some platforms
    },
    iconContainer: {
        marginRight: 16,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    iconGradient: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    iconEmoji: {
        fontSize: 28,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    description: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 2,
        lineHeight: 16,
        fontWeight: '500',
    },
    actionContainer: {
        marginLeft: 8,
    },
});

