import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Modal,
    Pressable, Switch, Clipboard, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { GameState } from '../../core/types';

export interface GameOptionsMenuProps {
    visible: boolean;
    onClose: () => void;
    isSoloMode: boolean;
    gameState: GameState | null;
    localPlayerId?: string;
    gameId?: string;
    roomData?: any;
    isBgmEnabled: boolean;
    onToggleBgm: () => void;
    isSfxEnabled: boolean;
    onToggleSfx: () => void;
    isVibrationEnabled: boolean;
    onToggleVibration: () => void;
    onQuitGame: () => void;
}

type Tab = 'JEU' | 'INFOS' | 'HISTORIQUE';

function gameModeLabel(mode?: string): string {
    switch (mode) {
        case 'VICTOIRE': return 'Victoire';
        case 'MANCHE':   return 'Manche';
        case 'SCORE':    return 'Score';
        case 'COCHON':   return 'Cochon';
        default:         return mode ?? '—';
    }
}

function objectifLabel(state: GameState): string {
    const n = state.winningCondition;
    switch (state.gameMode) {
        case 'VICTOIRE': return `${n} victoire${n > 1 ? 's' : ''}`;
        case 'MANCHE':   return `${n} manche${n > 1 ? 's' : ''}`;
        case 'SCORE':    return `${n} points`;
        case 'COCHON':   return `${n} cochon${n > 1 ? 's' : ''}`;
        default:         return `${n}`;
    }
}

function botDifficultyLabel(difficulty?: string): string {
    switch (difficulty) {
        case 'TI_MANMAY': return 'Debutant';
        case 'MAPIPI': return 'Intermediaire';
        case 'GRAN_MOUN': return 'Difficile';
        case 'METKAYALI': return 'Met Kayali';
        default: return 'Inconnue';
    }
}

export const GameOptionsMenu: React.FC<GameOptionsMenuProps> = ({
    visible,
    onClose,
    isSoloMode,
    gameState,
    localPlayerId,
    gameId,
    roomData,
    isBgmEnabled,
    onToggleBgm,
    isSfxEnabled,
    onToggleSfx,
    isVibrationEnabled,
    onToggleVibration,
    onQuitGame,
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('JEU');
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);

    const handleCopyCode = () => {
        if (!gameId) return;
        if (Platform.OS === 'web') {
            navigator.clipboard?.writeText(gameId);
        } else {
            Clipboard.setString(gameId);
        }
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
    };

    const handleClose = () => {
        setShowQuitConfirm(false);
        setActiveTab('JEU');
        onClose();
    };

    const handleConfirmQuit = () => {
        setShowQuitConfirm(false);
        handleClose();
        onQuitGame();
    };

    const connectedPlayers: { displayName: string; uid: string }[] = roomData?.players ?? [];
    const soloBotDifficulty = isSoloMode
        ? gameState?.players.find((player) => player.status === 'BOT')?.difficulty
        : undefined;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            {/* Backdrop — centré */}
            <Animated.View entering={FadeIn.duration(160)} style={styles.backdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

                {/* Card centrée */}
                <Animated.View entering={ZoomIn.duration(220).springify()} style={styles.card}>
                    <LinearGradient colors={['#2D1B4E', '#1A0E2E']} style={styles.cardInner}>

                        {/* ── Ligne unique : onglets + X ── */}
                        <View style={styles.topRow}>
                            <View style={styles.tabBar}>
                                {(['JEU', 'INFOS', 'HISTORIQUE'] as Tab[]).map(tab => (
                                    <TouchableOpacity
                                        key={tab}
                                        style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                                        onPress={() => setActiveTab(tab)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                                            {tab === 'JEU' ? '🎮 Jeu' : tab === 'INFOS' ? 'ℹ️ Infos' : '📜 Historique'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
                                <Ionicons name="close" size={18} color="#FFD700" />
                            </TouchableOpacity>
                        </View>

                        {/* ── Contenu ── */}
                        <View style={styles.content}>

                            {/* Onglet JEU */}
                            {activeTab === 'JEU' && (
                                <View>
                                    {isSoloMode && (
                                        <View style={styles.pauseNotice}>
                                            <Ionicons name="pause-circle-outline" size={13} color="#aaa" />
                                            <Text style={styles.pauseNoticeText}>Partie en pause</Text>
                                        </View>
                                    )}
                                    <ToggleRow
                                        icon={isBgmEnabled ? 'musical-notes' : 'musical-notes-outline'}
                                        label="Musique"
                                        value={isBgmEnabled}
                                        onToggle={onToggleBgm}
                                    />
                                    <ToggleRow
                                        icon={isSfxEnabled ? 'volume-high' : 'volume-mute'}
                                        label="Effets"
                                        value={isSfxEnabled}
                                        onToggle={onToggleSfx}
                                    />
                                    <ToggleRow
                                        icon={isVibrationEnabled ? 'phone-portrait-outline' : 'phone-portrait-sharp'}
                                        label="Vibration"
                                        value={isVibrationEnabled}
                                        onToggle={onToggleVibration}
                                    />
                                </View>
                            )}

                            {/* Onglet INFOS */}
                            {activeTab === 'INFOS' && gameState && (
                                <View>
                                    {isSoloMode && (
                                        <InfoRow
                                            icon="school-outline"
                                            label="Difficulte"
                                            value={botDifficultyLabel(soloBotDifficulty)}
                                        />
                                    )}
                                    <InfoRow icon="game-controller-outline" label="Mode"    value={gameModeLabel(gameState.gameMode)} />
                                    <InfoRow icon="star-outline"            label="Objectif" value={objectifLabel(gameState)} />
                                    <InfoRow icon="layers-outline"          label="Manche"   value={`M${Math.max(1, gameState.mancheNumber ?? 1)} · R${Math.max(1, gameState.roundNumber ?? 1)}`} />

                                    {!isSoloMode && gameId && (
                                        <>
                                            <View style={styles.divider} />
                                            <TouchableOpacity style={styles.codeRow} onPress={handleCopyCode} activeOpacity={0.7}>
                                                <Ionicons name="key-outline" size={15} color="#FFD700" />
                                                <Text style={styles.codeLabel}>Code salle</Text>
                                                <Text style={styles.codeValue}>{gameId}</Text>
                                                <Ionicons
                                                    name={codeCopied ? 'checkmark-circle' : 'copy-outline'}
                                                    size={15}
                                                    color={codeCopied ? '#4CAF50' : '#aaa'}
                                                />
                                            </TouchableOpacity>
                                            {connectedPlayers.length > 0 && (
                                                <View style={styles.playersBlock}>
                                                    <Text style={styles.playersTitle}>Joueurs</Text>
                                                    {connectedPlayers.map(p => (
                                                        <View key={p.uid} style={styles.playerRow}>
                                                            <Ionicons name="person-outline" size={12} color="#aaa" />
                                                            <Text style={styles.playerName}>{p.displayName}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                        </>
                                    )}
                                </View>
                            )}

                            {activeTab === 'HISTORIQUE' && gameState && (
                                <View>
                                    <View style={styles.historyCurrentBlock}>
                                        <Text style={styles.historyCurrentTitle}>En cours</Text>
                                        <Text style={styles.historyCurrentText}>
                                            Manche {Math.max(1, gameState.mancheNumber ?? 1)} · Round {Math.max(1, gameState.roundNumber ?? 1)}
                                        </Text>
                                    </View>

                                    <View style={styles.historyTableHeader}>
                                        <Text style={[styles.historyCell, styles.historyCellLabel]}>Manche</Text>
                                        {gameState.players.map((player) => (
                                            <Text
                                                key={player.id}
                                                style={[
                                                    styles.historyCell,
                                                    player.id === localPlayerId && styles.historyCellMe,
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {player.id === localPlayerId ? 'Moi' : player.name}
                                            </Text>
                                        ))}
                                    </View>

                                    <ScrollView style={styles.historyScroll} showsVerticalScrollIndicator={false}>
                                        {gameState.mancheHistory?.length ? (
                                            gameState.mancheHistory.map((manche, index) => (
                                                <View key={`${manche.mancheNumber}-${index}`} style={styles.historyRowTable}>
                                                    <View style={styles.historyLabelCol}>
                                                        <Text style={[styles.historyCell, styles.historyCellLabel]}>
                                                            M{manche.mancheNumber}
                                                        </Text>
                                                        <Text style={styles.historyResultBadge}>
                                                            {manche.resultType === 'COCHON'
                                                                ? manche.cochonCount && manche.cochonCount > 1 ? 'Double cochon' : 'Cochon'
                                                                : manche.resultType === 'CHIRE'
                                                                    ? 'Chiré'
                                                                    : 'Victoire'}
                                                        </Text>
                                                    </View>
                                                    {gameState.players.map((player) => (
                                                        <Text key={player.id} style={styles.historyCell}>
                                                            {manche.points[player.id] ?? 0}
                                                        </Text>
                                                    ))}
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={styles.emptyHistoryText}>
                                                Aucune manche terminée pour le moment.
                                            </Text>
                                        )}
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        {/* ── Footer Quitter ── */}
                        <View style={styles.footer}>
                            {!showQuitConfirm ? (
                                <TouchableOpacity style={styles.quitBtn} onPress={() => setShowQuitConfirm(true)} activeOpacity={0.8}>
                                    <Ionicons name="exit-outline" size={16} color="#fff" />
                                    <Text style={styles.quitBtnText}>{isSoloMode ? 'Quitter la partie' : 'Abandonner la table'}</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.confirmRow}>
                                    <Text style={styles.confirmText}>{isSoloMode ? 'Vraiment quitter ?' : 'Quitter et abandonner ?'}</Text>
                                    <View style={styles.confirmBtns}>
                                        <TouchableOpacity style={styles.confirmBtnNo} onPress={() => setShowQuitConfirm(false)} activeOpacity={0.8}>
                                            <Text style={styles.confirmBtnNoText}>Rester</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.confirmBtnYes} onPress={handleConfirmQuit} activeOpacity={0.8}>
                                            <Text style={styles.confirmBtnYesText}>{isSoloMode ? 'Quitter' : 'Abandonner'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>

                    </LinearGradient>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ToggleRow: React.FC<{ icon: string; label: string; value: boolean; onToggle: () => void }> = ({ icon, label, value, onToggle }) => (
    <View style={styles.toggleRow}>
        <Ionicons name={icon as any} size={17} color="#FFD700" />
        <Text style={styles.toggleLabel}>{label}</Text>
        <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(255,215,0,0.5)' }}
            thumbColor={value ? '#FFD700' : '#888'}
            ios_backgroundColor="rgba(255,255,255,0.15)"
        />
    </View>
);

const InfoRow: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
        <Ionicons name={icon as any} size={14} color="#FFD700" />
        <Text style={styles.infoRowLabel}>{label}</Text>
        <Text style={styles.infoRowValue}>{value}</Text>
    </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',   // centré verticalement
        alignItems: 'center',       // centré horizontalement
    },
    card: {
        width: '70%',
        maxWidth: 320,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.25)',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
    },
    cardInner: {
        paddingBottom: 14,
    },
    // ── Ligne tabs + X ──
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingTop: 10,
        paddingBottom: 6,
        gap: 8,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,215,0,0.1)',
    },
    tabBar: {
        flex: 1,
        flexDirection: 'row',
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.06)',
        padding: 2,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 6,
        borderRadius: 6,
        alignItems: 'center',
    },
    tabBtnActive: {
        backgroundColor: 'rgba(255,215,0,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.35)',
    },
    tabLabel: {
        color: 'rgba(255,255,255,0.45)',
        fontWeight: '600',
        fontSize: 12,
    },
    tabLabelActive: {
        color: '#FFD700',
    },
    closeBtn: {
        padding: 5,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    // ── Contenu ──
    content: {
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 4,
    },
    pauseNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 8,
        paddingHorizontal: 8,
        paddingVertical: 5,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 6,
    },
    pauseNoticeText: {
        color: '#aaa',
        fontSize: 11,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 9,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        gap: 10,
    },
    toggleLabel: {
        flex: 1,
        color: '#fff',
        fontSize: 13,
        fontWeight: '500',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        gap: 8,
    },
    infoRowLabel: {
        flex: 1,
        color: 'rgba(255,255,255,0.55)',
        fontSize: 12,
    },
    infoRowValue: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    historyCurrentBlock: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: 'rgba(255,215,0,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.15)',
        marginBottom: 10,
    },
    historyCurrentTitle: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 3,
    },
    historyCurrentText: {
        color: '#FFD700',
        fontSize: 13,
        fontWeight: '700',
    },
    historyTableHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 8,
        marginBottom: 6,
        gap: 6,
    },
    historyScroll: {
        maxHeight: 220,
    },
    historyRowTable: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        gap: 6,
    },
    historyLabelCol: {
        width: 62,
        alignItems: 'center',
        gap: 2,
    },
    historyCell: {
        flex: 1,
        color: '#fff',
        fontSize: 11,
        textAlign: 'center',
    },
    historyCellLabel: {
        flex: 0,
        width: 52,
        fontWeight: '700',
        color: '#FFD700',
    },
    historyCellMe: {
        color: '#FFD700',
        fontWeight: '700',
    },
    historyResultBadge: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 9,
        textAlign: 'center',
    },
    emptyHistoryText: {
        color: 'rgba(255,255,255,0.45)',
        textAlign: 'center',
        paddingVertical: 16,
        fontStyle: 'italic',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,215,0,0.15)',
        marginVertical: 8,
    },
    codeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 7,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
    },
    codeLabel: {
        flex: 1,
        color: 'rgba(255,255,255,0.55)',
        fontSize: 12,
    },
    codeValue: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
    playersBlock: {
        marginTop: 8,
    },
    playersTitle: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.5,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 3,
    },
    playerName: {
        color: '#fff',
        fontSize: 12,
    },
    // ── Footer Quitter ──
    footer: {
        marginTop: 6,
        paddingHorizontal: 14,
    },
    quitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#C0392B',
        borderRadius: 10,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    quitBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
    confirmRow: {
        alignItems: 'center',
        gap: 8,
    },
    confirmText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
    },
    confirmBtns: {
        flexDirection: 'row',
        gap: 8,
        width: '100%',
    },
    confirmBtnNo: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    confirmBtnNoText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
    confirmBtnYes: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 8,
        backgroundColor: '#C0392B',
        alignItems: 'center',
    },
    confirmBtnYesText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
});
