import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInLeft, FadeInRight, FadeInUp } from 'react-native-reanimated';
import {
    LEAGUE_FRAME_THRESHOLDS, LEAGUE_ICONS, LEAGUE_LABELS,
    LEAGUE_GRADE_COLORS, LEAGUE_FRAME_REWARDS, LEAGUE_GRADE_ORDER,
    LEAGUE_THRESHOLDS,
} from '../core/economy.constants';
import { getLeagueGrade } from '../core/RewardEngine';
import { LeagueGrade } from '../core/economy.types';
import { economyService } from '../core/services/economy.service';
import { leaderboardService, LeaderboardEntry } from '../core/services/leaderboard.service';
import { authService } from '../core/services/auth.service';
import { getAvatarImage } from '../core/avatars';

interface LeagueInfoModalProps {
    visible: boolean;
    onClose: () => void;
}

type TabType = 'INFOS' | 'MA_LIGUE' | 'CLASSEMENT';
type ClassementFamily = 'APPRENTIS' | 'MAITRES' | 'ELITE';

const { width } = Dimensions.get('window');

const FAMILY_CONFIG: Record<ClassementFamily, { label: string; icon: string; color: string; grades: LeagueGrade[] }> = {
    APPRENTIS: { label: 'Apprentis',    icon: '🥈', color: '#9E9E9E', grades: ['APPRENTI_1', 'APPRENTI_2', 'APPRENTI_3'] },
    MAITRES:   { label: 'Maîtres',      icon: '🥇', color: '#FFD700', grades: ['MAITRE_1', 'MAITRE_2', 'MAITRE_3'] },
    ELITE:     { label: 'Élite',        icon: '👑', color: '#4FC3F7', grades: ['ROI', 'LEGENDE'] },
};

// Sous-niveaux par famille avec leur couleur individuelle
const APPRENTI_SUBS = [
    { grade: 'APPRENTI_1' as const, num: 1, color: '#BDBDBD', seuil: LEAGUE_FRAME_THRESHOLDS.APPRENTI_1 },
    { grade: 'APPRENTI_2' as const, num: 2, color: '#8A8A8A', seuil: LEAGUE_FRAME_THRESHOLDS.APPRENTI_2 },
    { grade: 'APPRENTI_3' as const, num: 3, color: '#616161', seuil: LEAGUE_FRAME_THRESHOLDS.APPRENTI_3 },
];
const MAITRE_SUBS = [
    { grade: 'MAITRE_1' as const, num: 1, color: '#FFE57A', seuil: LEAGUE_FRAME_THRESHOLDS.MAITRE_1 },
    { grade: 'MAITRE_2' as const, num: 2, color: '#FFD700', seuil: LEAGUE_FRAME_THRESHOLDS.MAITRE_2 },
    { grade: 'MAITRE_3' as const, num: 3, color: '#FFA000', seuil: LEAGUE_FRAME_THRESHOLDS.MAITRE_3 },
];

const gradeColor = (g: LeagueGrade): string => {
    if (g.startsWith('APPRENTI')) return '#9E9E9E';
    if (g.startsWith('MAITRE')) return '#FFD700';
    if (g === 'ROI') return '#4FC3F7';
    return '#FF5252';
};

export const LeagueInfoModal: React.FC<LeagueInfoModalProps> = ({ visible, onClose }) => {
    const [activeTab, setActiveTab] = useState<TabType>('INFOS');
    const [leaguePoints, setLeaguePoints] = useState(0);
    const [leagueGrade, setLeagueGrade] = useState<LeagueGrade>('APPRENTI_1');

    // Classement
    const [classementFamily, setClassementFamily] = useState<ClassementFamily>('APPRENTIS');
    const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
    const [classementLoading, setClassementLoading] = useState(false);
    const [currentUid, setCurrentUid] = useState<string | null>(null);
    const classementUnsubRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (visible) {
            economyService.getEconomy().then(eco => {
                // cochonsGiven est la source de vérité (synchro Firestore via totalCochonsInflicted)
                // leaguePoints peut diverger sur d'anciens comptes → on prend le max
                const cochons = Math.max(eco.cochonsGiven ?? 0, eco.leaguePoints ?? 0);
                setLeaguePoints(cochons);
                // Toujours recalculer le grade depuis les cochons — jamais lire la valeur
                // stockée qui peut être périmée (anciens comptes, migration 8 paliers)
                setLeagueGrade(getLeagueGrade(cochons) ?? 'APPRENTI_1');
            });
            authService.getCurrentUser().then(u => setCurrentUid(u?.uid ?? null));
        } else {
            // Nettoyer le listener quand le modal se ferme
            classementUnsubRef.current?.();
            classementUnsubRef.current = null;
        }
    }, [visible]);

    // Charger le classement au premier affichage de l'onglet (une seule souscription)
    useEffect(() => {
        if (activeTab !== 'CLASSEMENT' || !visible) return;
        if (classementUnsubRef.current) return; // déjà abonné
        setClassementLoading(true);
        classementUnsubRef.current = leaderboardService.subscribeLeaderboard('COCHONS', 150, (entries) => {
            setAllEntries(entries);
            setClassementLoading(false);
        });
        return () => {
            classementUnsubRef.current?.();
            classementUnsubRef.current = null;
        };
    }, [activeTab, visible]);

    // ── Onglet INFOS (contenu original) ────────────────────────────────────────
    const renderInfos = () => {
        return (
            <View style={styles.dashContainer}>

                {/* Header compact */}
                <View style={styles.dashHeader}>
                    <Ionicons name="trophy" size={18} color="#FFD700" />
                    <Text style={styles.dashTitle}>LIGUE DES COCHONS</Text>
                    <Text style={styles.dashSub}>Infligez des cochons pour grimper les rangs</Text>
                </View>

                {/* Colonnes asymétriques */}
                <View style={styles.dashMain}>

                    {/* ── Colonne gauche (flex:3) ── */}
                    <View style={styles.dashLeft}>

                        {/* Bloc APPRENTI */}
                        <Animated.View entering={FadeInLeft.duration(450)} style={[styles.groupCard, styles.groupCardApprentit]}>
                            <View style={styles.groupHeader}>
                                <Text style={styles.groupIcon}>🥈</Text>
                                <Text style={[styles.groupTitle, { color: '#9E9E9E' }]}>APPRENTI</Text>
                            </View>
                            <View style={styles.subgradesRow}>
                                {APPRENTI_SUBS.map(s => (
                                    <View key={s.grade} style={[styles.subBadge, { borderColor: s.color }]}>
                                        <Text style={[styles.subNum, { color: s.color }]}>{s.num}</Text>
                                        <Text style={styles.subSeuil}>{s.seuil}🐷</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.groupRewardRow}>
                                <Ionicons name="cash-outline" size={11} color="#9E9E9E" />
                                <Text style={[styles.groupRewardText, { color: '#9E9E9E' }]}>
                                    {LEAGUE_FRAME_REWARDS.APPRENTI_1.coinsBonus}–{LEAGUE_FRAME_REWARDS.APPRENTI_3.coinsBonus} coins
                                </Text>
                            </View>
                        </Animated.View>

                        {/* Bloc MAÎTRE SAUCISSIER */}
                        <Animated.View entering={FadeInLeft.duration(450).delay(120)} style={[styles.groupCard, styles.groupCardMaitre]}>
                            <View style={styles.groupHeader}>
                                <Text style={styles.groupIcon}>🥇</Text>
                                <Text style={[styles.groupTitle, { color: '#FFD700' }]}>MAÎTRE SAUCISSIER</Text>
                            </View>
                            <View style={styles.subgradesRow}>
                                {MAITRE_SUBS.map(s => (
                                    <View key={s.grade} style={[styles.subBadge, { borderColor: s.color }]}>
                                        <Text style={[styles.subNum, { color: s.color }]}>{s.num}</Text>
                                        <Text style={styles.subSeuil}>{s.seuil}🐷</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.groupRewardRow}>
                                <Ionicons name="cash-outline" size={11} color="#FFD700" />
                                <Text style={[styles.groupRewardText, { color: '#FFD700' }]}>
                                    {LEAGUE_FRAME_REWARDS.MAITRE_1.coinsBonus}–{LEAGUE_FRAME_REWARDS.MAITRE_3.coinsBonus} coins
                                </Text>
                            </View>
                        </Animated.View>

                    </View>

                    {/* ── Colonne droite (flex:2) ── */}
                    <View style={styles.dashRight}>

                        {/* ROI DU BOUDIN */}
                        <Animated.View entering={FadeInRight.duration(450).delay(60)} style={[styles.eliteCard, styles.eliteCardRoi]}>
                            <Text style={styles.eliteIcon}>👑</Text>
                            <Text style={[styles.eliteName, { color: '#4FC3F7' }]}>ROI DU BOUDIN</Text>
                            <Text style={[styles.eliteSeuil, { color: '#4FC3F7' }]}>250 🐷</Text>
                            <View style={[styles.eliteRewardRow, { borderColor: 'rgba(79,195,247,0.2)' }]}>
                                <Ionicons name="cash-outline" size={11} color="#4FC3F7" />
                                <Text style={[styles.eliteRewardText, { color: '#4FC3F7' }]}>
                                    {LEAGUE_FRAME_REWARDS.ROI.coinsBonus} coins
                                </Text>
                            </View>
                        </Animated.View>

                        {/* LÉGENDE DU GROUIN */}
                        <Animated.View entering={FadeInRight.duration(450).delay(180)} style={[styles.eliteCard, styles.eliteCardLegende]}>
                            <Text style={styles.eliteIcon}>🔥</Text>
                            <Text style={[styles.eliteName, { color: '#FF5252' }]}>LÉGENDE DU GROUIN</Text>
                            <Text style={[styles.eliteSeuil, { color: '#FF5252' }]}>500 🐷</Text>
                            <View style={[styles.eliteRewardRow, { borderColor: 'rgba(255,82,82,0.2)' }]}>
                                <Ionicons name="cash-outline" size={11} color="#FF5252" />
                                <Text style={[styles.eliteRewardText, { color: '#FF5252' }]}>
                                    {LEAGUE_FRAME_REWARDS.LEGENDE.coinsBonus} coins
                                </Text>
                            </View>
                        </Animated.View>

                    </View>
                </View>
            </View>
        );
    };

    // ── Onglet MA LIGUE ─────────────────────────────────────────────────────────
    const renderMaLigue = () => {
        const currentIdx = LEAGUE_GRADE_ORDER.indexOf(leagueGrade);
        const nextGrade = currentIdx < LEAGUE_GRADE_ORDER.length - 1
            ? LEAGUE_GRADE_ORDER[currentIdx + 1] : null;
        const prevGrade = currentIdx > 0 ? LEAGUE_GRADE_ORDER[currentIdx - 1] : null;

        const prevThreshold = prevGrade ? LEAGUE_FRAME_THRESHOLDS[prevGrade] : 0;
        const nextThreshold = nextGrade ? LEAGUE_FRAME_THRESHOLDS[nextGrade] : null;
        const range = nextThreshold != null
            ? nextThreshold - prevThreshold
            : LEAGUE_FRAME_THRESHOLDS[leagueGrade] - prevThreshold;
        const progress = nextThreshold != null
            ? Math.min((leaguePoints - prevThreshold) / Math.max(range, 1), 1)
            : 1;

        const color = gradeColor(leagueGrade);

        return (
            <ScrollView style={styles.maLigueScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Carte grade actuel */}
                <View style={[styles.heroCard, { borderColor: color }]}>
                    <Text style={styles.heroIcon}>{LEAGUE_ICONS[leagueGrade]}</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.heroLabel}>MON GRADE</Text>
                        <Text style={[styles.heroName, { color }]}>{LEAGUE_LABELS[leagueGrade]}</Text>
                        <Text style={styles.heroCochons}>🐷 {leaguePoints.toLocaleString()} cochons infligés</Text>
                    </View>
                </View>

                {/* Barre de progression */}
                <View style={styles.progressBlock}>
                    <View style={styles.progressLabels}>
                        <Text style={styles.progressBound}>{prevThreshold}</Text>
                        {nextThreshold != null ? (
                            <Text style={styles.progressCenter}>
                                → {LEAGUE_LABELS[nextGrade!]} ({nextThreshold} 🐷)
                            </Text>
                        ) : (
                            <Text style={styles.progressCenter}>Grade maximum 🔥</Text>
                        )}
                        <Text style={styles.progressBound}>{nextThreshold ?? '∞'}</Text>
                    </View>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, {
                            width: `${Math.round(progress * 100)}%`,
                            backgroundColor: color,
                        }]} />
                    </View>
                    {nextThreshold != null && (
                        <Text style={styles.progressHint}>
                            Encore {Math.max(0, nextThreshold - leaguePoints)} cochon{nextThreshold - leaguePoints > 1 ? 's' : ''} pour le prochain palier
                        </Text>
                    )}
                </View>

                {/* Liste des 8 paliers */}
                <Text style={styles.paliersTitle}>LES 8 PALIERS</Text>
                {LEAGUE_GRADE_ORDER.map((g, idx) => {
                    const isUnlocked = idx <= currentIdx;
                    const isCurrent = g === leagueGrade;
                    const gc = gradeColor(g);
                    return (
                        <View key={g} style={[
                            styles.palierRow,
                            isCurrent && { borderColor: gc, backgroundColor: `${gc}14` },
                        ]}>
                            <Text style={[styles.palierIcon, !isUnlocked && { opacity: 0.25 }]}>
                                {isUnlocked ? LEAGUE_ICONS[g] : '🔒'}
                            </Text>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.palierName, { color: isUnlocked ? gc : 'rgba(255,255,255,0.25)' }]}>
                                    {LEAGUE_LABELS[g]}
                                </Text>
                                <Text style={styles.palierSeuil}>{LEAGUE_FRAME_THRESHOLDS[g]} cochons</Text>
                            </View>
                            {isCurrent && (
                                <View style={[styles.palierBadge, { backgroundColor: gc }]}>
                                    <Text style={styles.palierBadgeText}>VOUS</Text>
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        );
    };

    // ── Onglet CLASSEMENT ───────────────────────────────────────────────────────
    const renderClassement = () => {
        const fam = FAMILY_CONFIG[classementFamily];

        // Filtrer par famille de grade (grade calculé depuis cochonsGiven — source de vérité)
        const filtered = allEntries.filter(e => {
            const g = getLeagueGrade(e.cochonsGiven);
            return g && fam.grades.includes(g);
        }).slice(0, 30);

        const rankColor = (r: number) => {
            if (r === 1) return '#FFD700';
            if (r === 2) return '#C0C0C0';
            if (r === 3) return '#CD7F32';
            return 'rgba(255,255,255,0.25)';
        };

        return (
            <View style={{ flex: 1 }}>
                {/* Sélecteur famille */}
                <View style={styles.famRow}>
                    {(Object.keys(FAMILY_CONFIG) as ClassementFamily[]).map(f => {
                        const cfg = FAMILY_CONFIG[f];
                        const active = f === classementFamily;
                        return (
                            <TouchableOpacity
                                key={f}
                                style={[styles.famBtn, active && { borderColor: cfg.color, backgroundColor: `${cfg.color}18` }]}
                                onPress={() => setClassementFamily(f)}
                            >
                                <Text style={styles.famBtnText}>{cfg.icon}</Text>
                                <Text style={[styles.famBtnLabel, { color: active ? cfg.color : 'rgba(255,255,255,0.45)' }]}>
                                    {cfg.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {classementLoading ? (
                    <View style={styles.clsCenter}>
                        <ActivityIndicator color="#FFD700" size="large" />
                        <Text style={styles.clsLoadText}>Chargement...</Text>
                    </View>
                ) : filtered.length === 0 ? (
                    <View style={styles.clsCenter}>
                        <Text style={styles.clsEmpty}>Aucun joueur dans cette catégorie pour l'instant.</Text>
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                        {filtered.map((entry, idx) => {
                            const isMe = entry.uid === currentUid;
                            const localRank = idx + 1;
                            const rc = rankColor(localRank);
                            const grade = getLeagueGrade(entry.cochonsGiven) ?? 'APPRENTI_1';
                            const avatarSrc = getAvatarImage(entry.avatarId || 'avatar_default');
                            return (
                                <Animated.View
                                    key={entry.uid}
                                    entering={FadeInUp.delay(idx * 35).duration(300)}
                                    style={[styles.clsRow, isMe && { borderColor: fam.color, backgroundColor: `${fam.color}10` }]}
                                >
                                    {/* Rang */}
                                    <View style={[styles.clsRankCircle, { borderColor: rc }]}>
                                        <Text style={[styles.clsRankText, { color: rc }]}>{localRank}</Text>
                                    </View>

                                    {/* Avatar */}
                                    <View style={styles.clsAvatarWrap}>
                                        <Image source={avatarSrc} style={styles.clsAvatar} contentFit="cover" cachePolicy="memory-disk" />
                                    </View>

                                    {/* Nom + grade */}
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.clsName, isMe && { color: fam.color }]} numberOfLines={1}>
                                            {isMe ? `${entry.displayName} (Vous)` : entry.displayName}
                                        </Text>
                                        <Text style={styles.clsGrade}>
                                            {LEAGUE_ICONS[grade]} {LEAGUE_LABELS[grade]}
                                        </Text>
                                    </View>

                                    {/* Score */}
                                    <View style={styles.clsScore}>
                                        <Text style={[styles.clsScoreNum, { color: fam.color }]}>
                                            {entry.cochonsGiven.toLocaleString()}
                                        </Text>
                                        <Text style={styles.clsScoreLabel}>🐷 donnés</Text>
                                    </View>
                                </Animated.View>
                            );
                        })}
                    </ScrollView>
                )}
            </View>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.overlay}>
                <LinearGradient colors={['#0A1938', '#010619']} style={styles.background}>

                    {/* Bouton fermer */}
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>

                    {/* Onglets */}
                    <View style={styles.tabs}>
                        {([
                            { id: 'INFOS',      label: '🏆 Infos' },
                            { id: 'MA_LIGUE',   label: '🐷 Ma Ligue' },
                            { id: 'CLASSEMENT', label: '🏅 Classement' },
                        ] as { id: TabType; label: string }[]).map(t => (
                            <TouchableOpacity
                                key={t.id}
                                style={[styles.tabBtn, activeTab === t.id && styles.tabBtnActive]}
                                onPress={() => setActiveTab(t.id)}
                            >
                                <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>
                                    {t.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Contenu */}
                    <View style={styles.body}>
                        {activeTab === 'INFOS' && renderInfos()}
                        {activeTab === 'MA_LIGUE' && renderMaLigue()}
                        {activeTab === 'CLASSEMENT' && renderClassement()}
                    </View>

                </LinearGradient>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: '#010619',
    },
    background: {
        flex: 1,
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 15,
    },
    closeBtn: {
        position: 'absolute',
        top: 10,
        right: 15,
        zIndex: 10,
    },

    // ── Onglets ──
    tabs: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 14,
        marginTop: 4,
        paddingRight: 44, // espace bouton fermer
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    tabBtnActive: {
        backgroundColor: 'rgba(255,215,0,0.14)',
        borderColor: '#FFD700',
    },
    tabText: {
        color: 'rgba(255,255,255,0.55)',
        fontWeight: 'bold',
        fontSize: 12,
    },
    tabTextActive: {
        color: '#FFD700',
    },
    body: {
        flex: 1,
    },

    // ── INFOS — Dashboard asymétrique ──
    dashContainer: {
        flex: 1,
    },
    dashHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,215,0,0.15)',
    },
    dashTitle: {
        color: '#FFD700',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
    dashSub: {
        flex: 1,
        textAlign: 'right',
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10,
    },
    dashMain: {
        flex: 1,
        flexDirection: 'row',
        gap: 10,
    },
    dashLeft: {
        flex: 3,
        flexDirection: 'column',
        gap: 10,
    },
    dashRight: {
        flex: 2,
        flexDirection: 'column',
        gap: 10,
    },
    // Cartes groupées (Apprenti / Maître)
    groupCard: {
        flex: 1,
        borderRadius: 16,
        padding: 12,
        borderWidth: 1.5,
        justifyContent: 'space-between',
    },
    groupCardApprentit: {
        backgroundColor: 'rgba(158,158,158,0.05)',
        borderColor: 'rgba(158,158,158,0.22)',
        shadowColor: '#9E9E9E',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 3,
    },
    groupCardMaitre: {
        backgroundColor: 'rgba(255,215,0,0.05)',
        borderColor: 'rgba(255,215,0,0.22)',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 3,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    groupIcon: {
        fontSize: 22,
    },
    groupTitle: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 0.8,
    },
    subgradesRow: {
        flexDirection: 'row',
        gap: 6,
        flex: 1,
        alignItems: 'center',
    },
    subBadge: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 8,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    subNum: {
        fontSize: 18,
        fontWeight: '900',
    },
    subSeuil: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.45)',
        marginTop: 3,
    },
    groupRewardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.07)',
    },
    groupRewardText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    // Cartes élites (ROI / LÉGENDE)
    eliteCard: {
        flex: 1,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    eliteCardRoi: {
        backgroundColor: 'rgba(79,195,247,0.05)',
        borderColor: 'rgba(79,195,247,0.28)',
        shadowColor: '#4FC3F7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
        elevation: 4,
    },
    eliteCardLegende: {
        backgroundColor: 'rgba(255,82,82,0.05)',
        borderColor: 'rgba(255,82,82,0.28)',
        shadowColor: '#FF5252',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
        elevation: 4,
    },
    eliteIcon: {
        fontSize: 38,
    },
    eliteName: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    eliteSeuil: {
        fontSize: 20,
        fontWeight: '900',
    },
    eliteRewardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 20,
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        marginTop: 2,
    },
    eliteRewardText: {
        fontSize: 12,
        fontWeight: '900',
    },

    // ── MA LIGUE ──
    maLigueScroll: {
        flex: 1,
    },
    heroCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        borderWidth: 2,
        padding: 16,
        marginBottom: 18,
    },
    heroIcon: {
        fontSize: 40,
    },
    heroLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    heroName: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.3,
    },
    heroCochons: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.55)',
        marginTop: 4,
    },
    progressBlock: {
        marginBottom: 22,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 7,
    },
    progressBound: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.3)',
        width: 32,
    },
    progressCenter: {
        flex: 1,
        textAlign: 'center',
        fontSize: 11,
        color: 'rgba(255,255,255,0.55)',
        fontWeight: 'bold',
    },
    progressTrack: {
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.07)',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 6,
    },
    progressHint: {
        textAlign: 'center',
        fontSize: 11,
        color: 'rgba(255,255,255,0.35)',
        marginTop: 7,
        fontStyle: 'italic',
    },
    paliersTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: 'rgba(255,215,0,0.5)',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 10,
        textAlign: 'center',
    },
    palierRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        marginBottom: 7,
    },
    palierIcon: {
        fontSize: 22,
        width: 30,
        textAlign: 'center',
    },
    palierName: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    palierSeuil: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.3)',
        marginTop: 2,
    },
    palierBadge: {
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    palierBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#000',
        letterSpacing: 1,
    },

    // ── CLASSEMENT ──
    famRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 14,
    },
    famBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 9,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    famBtnText: {
        fontSize: 14,
    },
    famBtnLabel: {
        fontSize: 11,
        fontWeight: '800',
    },
    clsCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    clsLoadText: {
        color: 'rgba(255,255,255,0.4)',
        marginTop: 12,
        fontSize: 13,
    },
    clsEmpty: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    clsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        marginBottom: 8,
    },
    clsRankCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clsRankText: {
        fontSize: 13,
        fontWeight: '900',
    },
    clsAvatarWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,215,0,0.1)',
    },
    clsAvatar: {
        width: '100%',
        height: '100%',
    },
    clsName: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#FFF',
    },
    clsGrade: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.45)',
        marginTop: 2,
    },
    clsScore: {
        alignItems: 'flex-end',
    },
    clsScoreNum: {
        fontSize: 16,
        fontWeight: '900',
    },
    clsScoreLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.35)',
        marginTop: 1,
    },
});
