import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../core/services/firebase';
import { authService } from '../core/services/auth.service';
import Constants from 'expo-constants';

interface MdcFeedbackModalProps {
    visible: boolean;
    onClose: () => void;
}

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.3';

export const MdcFeedbackModal: React.FC<MdcFeedbackModalProps> = ({ visible, onClose }) => {
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState(false);

    const handleSend = async () => {
        if (!text.trim() || sending) return;
        setSending(true);
        try {
            const user = await authService.getCurrentUser();
            await addDoc(collection(db, 'feedbacks'), {
                uid: user?.uid ?? 'anonymous',
                displayName: user?.displayName ?? 'Anonyme',
                text: text.trim(),
                createdAt: serverTimestamp(),
                appVersion: APP_VERSION,
                readAt: null,
            });
            setSent(true);
            setText('');
            setTimeout(() => {
                setSent(false);
                onClose();
            }, 2000);
        } catch (_) {
            setError(true);
        } finally {
            setSending(false);
        }
    };

    const handleClose = () => {
        setText('');
        setSent(false);
        setError(false);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1} />

                <View style={styles.card}>
                    {/* Bouton fermer */}
                    <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                        <Ionicons name="close" size={20} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
                        {/* ── Haut — Identité app ── */}
                        <View style={styles.header}>
                            <View style={styles.mdcBadge}>
                                <Text style={styles.mdcText}>🐷</Text>
                            </View>
                            <Text style={styles.appName}>Domino Martiniquais</Text>
                            <Text style={styles.version}>Version {APP_VERSION}</Text>
                            <View style={styles.divider} />
                            <Text style={styles.credits}>Design & Code par</Text>
                            <Text style={styles.agency}>Omar@happyagency.ma</Text>
                        </View>

                        {/* ── Bas — Formulaire feedback ── */}
                        <View style={styles.feedbackSection}>
                            <Text style={styles.feedbackTitle}>Un bug ? Une suggestion ?</Text>


                            {sent ? (
                                <View style={styles.sentBox}>
                                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                    <Text style={styles.sentText}>Merci ! Retour envoyé ✅</Text>
                                </View>
                            ) : error ? (
                                <View style={styles.sentBox}>
                                    <Ionicons name="alert-circle" size={20} color="#F44336" />
                                    <Text style={[styles.sentText, { color: '#F44336' }]}>
                                        Échec de l&apos;envoi. Vérifiez votre connexion et réessayez.
                                    </Text>
                                    <TouchableOpacity onPress={() => setError(false)} style={{ marginTop: 8 }}>
                                        <Text style={{ color: '#FFD700', fontSize: 13, fontWeight: 'bold' }}>Réessayer</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Un bug ou une idée ? Votre retour nous aide à améliorer l'app...."
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        multiline
                                        numberOfLines={4}
                                        value={text}
                                        onChangeText={setText}
                                        maxLength={500}
                                    />
                                    <Text style={styles.charCount}>{text.length}/500</Text>
                                    <TouchableOpacity
                                        style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
                                        onPress={handleSend}
                                        activeOpacity={0.8}
                                        disabled={!text.trim() || sending}
                                    >
                                        {sending ? (
                                            <ActivityIndicator color="#000" size="small" />
                                        ) : (
                                            <>
                                                <Ionicons name="send" size={16} color="#000" />
                                                <Text style={styles.sendBtnText}>Envoyer</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#0D1B3E',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.2)',
        padding: 24,
    },
    closeBtn: {
        position: 'absolute',
        top: 14,
        right: 14,
        zIndex: 10,
        padding: 4,
    },
    // ── Header ──
    header: {
        alignItems: 'center',
        paddingBottom: 20,
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,215,0,0.12)',
    },
    mdcBadge: {
        width: 52,
        height: 52,
        borderRadius: 10,
        backgroundColor: 'rgba(255,215,0,0.1)',
        borderWidth: 2,
        borderColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    mdcText: {
        fontSize: 28,
        lineHeight: 34,
    },
    appName: {
        color: '#FFD700',
        fontSize: 17,
        fontWeight: '900',
        marginBottom: 4,
    },
    version: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginBottom: 14,
    },
    divider: {
        width: 40,
        height: 1,
        backgroundColor: 'rgba(255,215,0,0.2)',
        marginBottom: 14,
    },
    credits: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        marginBottom: 2,
    },
    agency: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    // ── Feedback ──
    feedbackSection: {
        gap: 10,
    },
    feedbackTitle: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '800',
    },
    feedbackSub: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginBottom: 4,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        color: '#FFF',
        fontSize: 13,
        padding: 12,
        minHeight: 90,
        textAlignVertical: 'top',
    },
    charCount: {
        color: 'rgba(255,255,255,0.25)',
        fontSize: 10,
        textAlign: 'right',
    },
    sendBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FFD700',
        borderRadius: 12,
        paddingVertical: 12,
        marginTop: 4,
    },
    sendBtnDisabled: {
        opacity: 0.4,
    },
    sendBtnText: {
        color: '#000',
        fontWeight: '900',
        fontSize: 14,
    },
    sentBox: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 20,
    },
    sentText: {
        color: '#4CAF50',
        fontSize: 15,
        fontWeight: 'bold',
    },
});
