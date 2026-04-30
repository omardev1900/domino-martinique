/**
 * AdBannerModal.tsx
 *
 * Popup plein écran pour les publicités admin-managed.
 * - IMAGE : expo-image (comportement initial)
 * - VIDEO : expo-av, autoplay muet en boucle
 * - Badge "Ads" visible en haut à gauche (disclosure)
 * - Bouton ✕ visible uniquement après un countdown de AD_SKIP_DELAY_SEC secondes
 * - Tap sur le média → ouvre targetUrl (si défini)
 * Spec : docs/specs/ADS_SYSTEM.md
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Ad } from '../core/ad.types';
import { adService } from '../core/services/ad.service';
import { LogService } from '../core/services/LogService';

const AD_SKIP_DELAY_SEC = 10;

interface AdBannerModalProps {
    ad: Ad | null;
    onClose: () => void;
}

export const AdBannerModal: React.FC<AdBannerModalProps> = ({ ad, onClose }) => {
    const videoRef = useRef<Video>(null);
    const markedAdIdRef = useRef<string | null>(null);
    const [videoFailed, setVideoFailed] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(AD_SKIP_DELAY_SEC);

    // Consomme le cooldown uniquement quand le modal est effectivement monté avec une pub.
    useEffect(() => {
        if (!ad) {
            markedAdIdRef.current = null;
            return;
        }
        if (markedAdIdRef.current === ad.id) return;

        markedAdIdRef.current = ad.id;
        adService.markAdAsShown(ad).catch(error => {
            LogService.error('AdBannerModal', 'markAdAsShown failed:', error);
            markedAdIdRef.current = null;
        });
    }, [ad]);

    // Countdown : reset à chaque nouvelle pub, puis tick chaque seconde jusqu'à 0.
    useEffect(() => {
        if (!ad) return;
        setSecondsLeft(AD_SKIP_DELAY_SEC);
        const interval = setInterval(() => {
            setSecondsLeft(s => {
                if (s <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [ad?.id]);

    if (!ad) return null;

    const canClose = secondsLeft === 0;

    const handleTap = () => {
        if (!ad.targetUrl) return;
        Linking.openURL(ad.targetUrl).catch(e =>
            LogService.error('AdBannerModal', 'openURL failed:', e)
        );
        onClose();
    };

    const isVideo = ad.mediaType === 'VIDEO' && !videoFailed;

    return (
        <Modal
            transparent
            visible
            animationType="fade"
            statusBarTranslucent
            // Bloquer la fermeture via le bouton back Android tant que le countdown n'est pas fini
            onRequestClose={() => { if (canClose) onClose(); }}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.mediaWrapper}
                    onPress={ad.targetUrl ? handleTap : undefined}
                    activeOpacity={ad.targetUrl ? 0.88 : 1}
                >
                    {isVideo ? (
                        <Video
                            ref={videoRef}
                            source={{ uri: ad.imageUrl }}
                            style={styles.media}
                            resizeMode={ResizeMode.CONTAIN}
                            shouldPlay
                            isMuted
                            isLooping
                            useNativeControls={false}
                            onError={e => {
                                LogService.error('AdBannerModal', 'video error:', e);
                                setVideoFailed(true);
                            }}
                        />
                    ) : (
                        <Image
                            source={{ uri: ad.imageUrl }}
                            style={styles.media}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                        />
                    )}

                    {/* Badge "Ads" — disclosure permanente en haut à gauche du média */}
                    <View style={styles.adsBadge} pointerEvents="none">
                        <Text style={styles.adsBadgeText}>Ads</Text>
                    </View>
                </TouchableOpacity>

                {/* Countdown ou bouton de fermeture */}
                {canClose ? (
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    >
                        <Ionicons name="close" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.countdownBubble} pointerEvents="none">
                        <Text style={styles.countdownText}>{secondsLeft}</Text>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mediaWrapper: {
        width: '90%',
        height: '76%',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.6,
        shadowRadius: 14,
    },
    media: {
        width: '100%',
        height: '100%',
    },
    adsBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.55)',
    },
    adsBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    closeButton: {
        position: 'absolute',
        top: 44,
        right: 18,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    countdownBubble: {
        position: 'absolute',
        top: 44,
        right: 18,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    countdownText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
});
