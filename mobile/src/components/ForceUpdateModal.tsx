import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Linking,
    Platform,
} from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { ForceUpdateInfo } from '../hooks/useForceUpdate';

interface ForceUpdateModalProps {
    info: ForceUpdateInfo;
}

export function ForceUpdateModal({ info }: ForceUpdateModalProps) {
    const handleUpdate = () => {
        if (info.updateUrl) {
            Linking.openURL(info.updateUrl).catch(err => {
                console.error("Impossible d'ouvrir le lien de mise à jour", err);
            });
        }
    };

    return (
        <Modal
            transparent
            animationType="none"
            visible
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Animated.View
                    entering={FadeIn.duration(300)}
                    style={styles.backdrop}
                />
                <Animated.View
                    entering={ZoomIn.springify().damping(18).stiffness(220)}
                    style={styles.card}
                >
                    {/* Icône */}
                    <View style={styles.iconCircle}>
                        <Text style={styles.iconText}>🚀</Text>
                    </View>

                    {/* Titre */}
                    <Text style={styles.title}>Mise à jour requise</Text>

                    <Text style={styles.subtitle}>
                        {info.message || "Une nouvelle version de l'application est disponible. Veuillez mettre à jour pour continuer."}
                    </Text>

                    {/* Bouton de mise à jour */}
                    <TouchableOpacity
                        id="btn-force-update"
                        style={styles.updateBtn}
                        onPress={handleUpdate}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.updateBtnText}>Mettre à jour</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
        zIndex: 9999, // Au-dessus de TOUT
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(26, 14, 46, 0.95)', // Très opaque pour masquer le jeu derrière
    },
    card: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#1E1140',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD700',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.6,
                shadowRadius: 24,
            },
            android: { elevation: 20 },
        }),
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,215,0,0.15)',
        borderWidth: 2,
        borderColor: 'rgba(255,215,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconText: {
        fontSize: 32,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFD700',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    updateBtn: {
        width: '100%',
        backgroundColor: '#FFD700',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
    },
    updateBtnText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1A0E2E',
    },
});
