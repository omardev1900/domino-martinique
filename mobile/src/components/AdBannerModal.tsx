/**
 * AdBannerModal.tsx
 *
 * Popup plein écran pour les publicités admin-managed.
 * - IMAGE : expo-image (comportement initial)
 * - VIDEO : expo-av, autoplay muet en boucle
 * - Bouton ✕ pour fermer
 * - Tap sur le média → ouvre targetUrl (si défini)
 * Spec : docs/specs/ADS_SYSTEM.md
 */

import React, { useRef } from 'react';
import {
    Modal,
    View,
    TouchableOpacity,
    StyleSheet,
    Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Ad } from '../core/ad.types';
import { LogService } from '../core/services/LogService';

interface AdBannerModalProps {
    ad: Ad | null;
    onClose: () => void;
}

export const AdBannerModal: React.FC<AdBannerModalProps> = ({ ad, onClose }) => {
    const videoRef = useRef<Video>(null);

    if (!ad) return null;

    const handleTap = () => {
        if (!ad.targetUrl) return;
        Linking.openURL(ad.targetUrl).catch(e =>
            LogService.error('AdBannerModal', 'openURL failed:', e)
        );
        onClose();
    };

    const isVideo = ad.mediaType === 'VIDEO';

    return (
        <Modal
            transparent
            visible
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
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
                            onError={e =>
                                LogService.error('AdBannerModal', 'video error:', e)
                            }
                        />
                    ) : (
                        <Image
                            source={{ uri: ad.imageUrl }}
                            style={styles.media}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                        />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                    <Ionicons name="close" size={22} color="#FFFFFF" />
                </TouchableOpacity>
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
});
