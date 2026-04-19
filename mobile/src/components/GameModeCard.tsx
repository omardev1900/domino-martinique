import React from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Animated as RNAnimated 
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
                activeOpacity={0.75}
            >
                <LinearGradient 
                    colors={colors} 
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={[styles.gradient, compact && styles.gradientCompact]}
                >
                    <View style={[styles.iconBg, compact && styles.iconBgCompact]}>
                        <Text style={[styles.emoji, compact && styles.emojiCompact]}>{icon}</Text>
                    </View>
                    
                    <View style={styles.content}>
                        <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
                        <Text style={[styles.description, compact && styles.descriptionCompact]} numberOfLines={1}>
                            {description}
                        </Text>
                    </View>
                    
                    <Ionicons 
                        name="chevron-forward-outline" 
                        size={compact ? 16 : 20} 
                        color="rgba(255,255,255,0.3)" 
                    />
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
    },
    card: {
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    cardCompact: {
        borderRadius: 16,
        elevation: 4,
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        minHeight: 85,
    },
    gradientCompact: {
        padding: 12,
        minHeight: 70,
    },
    iconBg: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    iconBgCompact: {
        width: 44,
        height: 44,
        borderRadius: 12,
        marginRight: 12,
    },
    emoji: {
        fontSize: 30,
    },
    emojiCompact: {
        fontSize: 24,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 19,
        fontWeight: '900',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    titleCompact: {
        fontSize: 16,
    },
    description: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.55)',
        marginTop: 2,
        fontWeight: '500',
    },
    descriptionCompact: {
        fontSize: 11,
        marginTop: 0,
    },
});
