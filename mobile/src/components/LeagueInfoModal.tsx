import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInLeft, FadeInRight, FadeInUp } from 'react-native-reanimated';

import {
    LEAGUE_FRAME_THRESHOLDS,
    LEAGUE_ICONS,
    LEAGUE_LABELS,
    LEAGUE_FRAME_REWARDS,
    LEAGUE_GRADE_ORDER,
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
type ClassementCategory = 'PLUS_COCHONS' | 'MOINS_COCHONS' | 'PLUS_POINTS';
type ClassementMode = 'TOTAL' | 'PERF';

const CATEGORY_CONFIG: Record<ClassementCategory, { label: string; icon: string; color: string; sublabel: string }> = {
    PLUS_COCHONS: { label: '+ Cochons', icon: '🐷', color: '#FF8C00', sublabel: 'cochons infligés' },
    MOINS_COCHONS: { label: '- Cochons', icon: '🛡️', color: '#4FC3F7', sublabel: 'cochons subis' },
    PLUS_POINTS: { label: '+ Points', icon: '⭐', color: '#FFD700', sublabel: 'points cumulés' },
};

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

const gradeColor = (grade: LeagueGrade): string => {
    if (grade.startsWith('APPRENTI')) return '#9E9E9E';
    if (grade.startsWith('MAITRE')) return '#FFD700';
    if (grade === 'ROI') return '#4FC3F7';
    return '#FF5252';
};

export const LeagueInfoModal: React.FC<LeagueInfoModalProps> = ({ visible, onClose }) => {
    const [activeTab, setActiveTab] = useState<TabType>('MA_LIGUE');
    const [leaguePoints, setLeaguePoints] = useState(0);
    const [leagueGrade, setLeagueGrade] = useState<LeagueGrade>('APPRENTI_1');

    const [classementCategory, setClassementCategory] = useState<ClassementCategory>('PLUS_COCHONS');
    const [classementMode, setClassementMode] = useState<ClassementMode>('TOTAL');
    const [showAllPlayers, setShowAllPlayers] = useState(false);
    const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
    const [classementLoading, setClassementLoading] = useState(false);
    const [currentUid, setCurrentUid] = useState<string | null>(null);
    const classementUnsubRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (visible) {
            economyService.getEconomy().then(eco => {
                const cochons = Math.max(eco.cochonsGiven ?? 0, eco.leaguePoints ?? 0);
                setLeaguePoints(cochons);
                setLeagueGrade(getLeagueGrade(cochons) ?? 'APPRENTI_1');
            });
            authService.getCurrentUser().then(user => setCurrentUid(user?.uid ?? null));
        } else {
            classementUnsubRef.current?.();
            classementUnsubRef.current = null;
        }
    }, [visible]);

    useEffect(() => {
        if (activeTab !== 'CLASSEMENT' || !visible) return;
        if (classementUnsubRef.current) return;

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

    const renderInfos = () => (
        <ScrollView style={styles.dashContainer} contentContainerStyle={styles.dashContent} showsVerticalScrollIndicator={false}>
            <View style={styles.dashHeader}>
                <Ionicons name="trophy" size={18} color="#FFD700" />
                <Text style={styles.dashTitle}>LIGUE DES COCHONS</Text>
                <Text style={styles.dashSub}>Infligez des cochons pour grimper les rangs</Text>
            </View>

            <View style={styles.dashMain}>
                <View style={styles.dashLeft}>
                    <Animated.View entering={FadeInLeft.duration(450)} style={[styles.groupCard, styles.groupCardApprentit]}>
                        <View style={styles.groupHeader}>
                            <Text style={styles.groupIcon}>🥈</Text>
                            <Text style={[styles.groupTitle, { color: '#9E9E9E' }]}>APPRENTI</Text>
                        </View>
                        <View style={styles.subgradesRow}>
                            {APPRENTI_SUBS.map(sub => (
                                <View key={sub.grade} style={[styles.subBadge, { borderColor: sub.color }]}>
                                    <Text style={[styles.subNum, { color: sub.color }]}>{sub.num}</Text>
                                    <Text style={styles.subSeuil}>{sub.seuil}🐷</Text>
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

                    <Animated.View entering={FadeInLeft.duration(450).delay(120)} style={[styles.groupCard, styles.groupCardMaitre]}>
                        <View style={styles.groupHeader}>
                            <Text style={styles.groupIcon}>🥇</Text>
                            <Text style={[styles.groupTitle, { color: '#FFD700' }]}>MAÎTRE SAUCISSIER</Text>
                        </View>
                        <View style={styles.subgradesRow}>
                            {MAITRE_SUBS.map(sub => (
                                <View key={sub.grade} style={[styles.subBadge, { borderColor: sub.color }]}>
                                    <Text style={[styles.subNum, { color: sub.color }]}>{sub.num}</Text>
                                    <Text style={styles.subSeuil}>{sub.seuil}🐷</Text>
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

                <View style={styles.dashRight}>
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
        </ScrollView>
    );

    const renderMaLigue = () => {
        const currentIndex = LEAGUE_GRADE_ORDER.indexOf(leagueGrade);
        const nextGrade = currentIndex < LEAGUE_GRADE_ORDER.length - 1 ? LEAGUE_GRADE_ORDER[currentIndex + 1] : null;
        const prevGrade = currentIndex > 0 ? LEAGUE_GRADE_ORDER[currentIndex - 1] : null;
        const prevThreshold = prevGrade ? LEAGUE_FRAME_THRESHOLDS[prevGrade] : 0;
        const nextThreshold = nextGrade ? LEAGUE_FRAME_THRESHOLDS[nextGrade] : null;
        const range = nextThreshold != null ? nextThreshold - prevThreshold : LEAGUE_FRAME_THRESHOLDS[leagueGrade] - prevThreshold;
        const progress = nextThreshold != null ? Math.min((leaguePoints - prevThreshold) / Math.max(range, 1), 1) : 1;
        const color = gradeColor(leagueGrade);

        return (
            <ScrollView style={styles.maLigueScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <View style={[styles.heroCard, { borderColor: color }]}>
                    <Text style={styles.heroIcon}>{LEAGUE_ICONS[leagueGrade]}</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.heroLabel}>MON GRADE</Text>
                        <Text style={[styles.heroName, { color }]}>{LEAGUE_LABELS[leagueGrade]}</Text>
                        <Text style={styles.heroCochons}>🐷 {leaguePoints.toLocaleString()} cochons infligés</Text>
                    </View>
                </View>

                <View style={styles.progressBlock}>
                    <View style={styles.progressLabels}>
                        <Text style={styles.progressBound}>{prevThreshold}</Text>
                        {nextThreshold != null ? (
                            <Text style={styles.progressCenter}>→ {LEAGUE_LABELS[nextGrade!]} ({nextThreshold} 🐷)</Text>
                        ) : (
                            <Text style={styles.progressCenter}>Grade maximum 🔥</Text>
                        )}
                        <Text style={styles.progressBound}>{nextThreshold ?? '∞'}</Text>
                    </View>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: color }]} />
                    </View>
                    {nextThreshold != null ? (
                        <Text style={styles.progressHint}>
                            Encore {Math.max(0, nextThreshold - leaguePoints)} cochon{nextThreshold - leaguePoints > 1 ? 's' : ''} pour le prochain palier
                        </Text>
                    ) : null}
                </View>

                <Text style={styles.paliersTitle}>LES 8 PALIERS</Text>
                {LEAGUE_GRADE_ORDER.map((grade, index) => {
                    const isUnlocked = index <= currentIndex;
                    const isCurrent = grade === leagueGrade;
                    const colorForGrade = gradeColor(grade);

                    return (
                        <View
                            key={grade}
                            style={[styles.palierRow, isCurrent && { borderColor: colorForGrade, backgroundColor: `${colorForGrade}14` }]}
                        >
                            <Text style={[styles.palierIcon, !isUnlocked && { opacity: 0.25 }]}>
                                {isUnlocked ? LEAGUE_ICONS[grade] : '🔒'}
                            </Text>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.palierName, { color: isUnlocked ? colorForGrade : 'rgba(255,255,255,0.25)' }]}>
                                    {LEAGUE_LABELS[grade]}
                                </Text>
                                <Text style={styles.palierSeuil}>{LEAGUE_FRAME_THRESHOLDS[grade]} cochons</Text>
                            </View>
                            {isCurrent ? (
                                <View style={[styles.palierBadge, { backgroundColor: colorForGrade }]}>
                                    <Text style={styles.palierBadgeText}>VOUS</Text>
                                </View>
                            ) : null}
                        </View>
                    );
                })}
            </ScrollView>
        );
    };

    const renderClassement = () => {
        const cfg = CATEGORY_CONFIG[classementCategory];
        const isPerfMode = classementMode === 'PERF';
        const qualifiesForPerf = (entry: LeaderboardEntry) => entry.gamesPlayed >= 10;

        const getPerformanceValue = (entry: LeaderboardEntry): number => {
            if (entry.gamesPlayed <= 0) {
                return classementCategory === 'MOINS_COCHONS' ? Number.POSITIVE_INFINITY : 0;
            }
            if (classementCategory === 'PLUS_COCHONS') return entry.cochonsGiven / entry.gamesPlayed;
            if (classementCategory === 'MOINS_COCHONS') return entry.totalCochonsSubis / entry.gamesPlayed;
            return entry.totalPointsAccumulated / entry.gamesPlayed;
        };

        const sourceEntries = isPerfMode
            ? (showAllPlayers ? allEntries : allEntries.filter(qualifiesForPerf))
            : allEntries;

        const sorted = [...sourceEntries].sort((a, b) => {
            if (isPerfMode) {
                const aQualified = qualifiesForPerf(a);
                const bQualified = qualifiesForPerf(b);
                if (showAllPlayers && aQualified !== bQualified) return aQualified ? -1 : 1;

                if (classementCategory === 'MOINS_COCHONS') {
                    const diff = getPerformanceValue(a) - getPerformanceValue(b);
                    if (diff !== 0) return diff;
                    const tieByCochons = a.totalCochonsSubis - b.totalCochonsSubis;
                    if (tieByCochons !== 0) return tieByCochons;
                    return b.gamesPlayed - a.gamesPlayed;
                }

                const diff = getPerformanceValue(b) - getPerformanceValue(a);
                if (diff !== 0) return diff;

                if (classementCategory === 'PLUS_COCHONS') {
                    const tieByCochons = b.cochonsGiven - a.cochonsGiven;
                    if (tieByCochons !== 0) return tieByCochons;
                } else {
                    const tieByPoints = b.totalPointsAccumulated - a.totalPointsAccumulated;
                    if (tieByPoints !== 0) return tieByPoints;
                }

                return b.gamesPlayed - a.gamesPlayed;
            }

            if (classementCategory === 'PLUS_COCHONS') {
                const diff = b.cochonsGiven - a.cochonsGiven;
                return diff !== 0 ? diff : b.gamesPlayed - a.gamesPlayed;
            }

            if (classementCategory === 'MOINS_COCHONS') {
                const aHasMatches = a.gamesPlayed > 0;
                const bHasMatches = b.gamesPlayed > 0;
                if (aHasMatches !== bHasMatches) return aHasMatches ? -1 : 1;
                const diff = a.totalCochonsSubis - b.totalCochonsSubis;
                return diff !== 0 ? diff : b.gamesPlayed - a.gamesPlayed;
            }

            const diff = b.totalPointsAccumulated - a.totalPointsAccumulated;
            return diff !== 0 ? diff : b.gamesPlayed - a.gamesPlayed;
        }).slice(0, 30);

        const rankColor = (rank: number) => {
            if (rank === 1) return '#FFD700';
            if (rank === 2) return '#C0C0C0';
            if (rank === 3) return '#CD7F32';
            return 'rgba(255,255,255,0.25)';
        };

        const getEntryScore = (entry: LeaderboardEntry): string => {
            if (isPerfMode) {
                const perf = getPerformanceValue(entry);
                return Number.isFinite(perf) ? perf.toFixed(2) : '—';
            }
            if (classementCategory === 'PLUS_COCHONS') return `${entry.cochonsGiven.toLocaleString()}`;
            if (classementCategory === 'MOINS_COCHONS') return `${entry.totalCochonsSubis.toLocaleString()}`;
            return `${entry.totalPointsAccumulated.toLocaleString()}`;
        };

        const getEntryMeta = (entry: LeaderboardEntry): string => {
            const matchesLabel = `${entry.gamesPlayed} match${entry.gamesPlayed > 1 ? 's' : ''}`;
            if (!isPerfMode) return matchesLabel;
            if (classementCategory === 'PLUS_COCHONS') return `${entry.cochonsGiven.toLocaleString()} cochons en ${matchesLabel}`;
            if (classementCategory === 'MOINS_COCHONS') return `${entry.totalCochonsSubis.toLocaleString()} cochons subis en ${matchesLabel}`;
            return `${entry.totalPointsAccumulated.toLocaleString()} points en ${matchesLabel}`;
        };

        return (
            <View style={{ flex: 1 }}>
                <View style={styles.clsTopBar}>
                    <TouchableOpacity style={styles.clsBackBtn} onPress={() => setActiveTab('MA_LIGUE')}>
                        <Ionicons name="chevron-back" size={16} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.clsBackText}>Sections</Text>
                    </TouchableOpacity>
                    <Text style={styles.clsTopTitle}>Classement Ligue</Text>
                </View>

                <View style={styles.clsControlsRow}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.clsMetricTabs}
                        contentContainerStyle={styles.famRow}
                    >
                        {(Object.keys(CATEGORY_CONFIG) as ClassementCategory[]).map(cat => {
                            const catCfg = CATEGORY_CONFIG[cat];
                            const active = cat === classementCategory;
                            return (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.famBtn, active && { borderColor: catCfg.color, backgroundColor: `${catCfg.color}18` }]}
                                    onPress={() => setClassementCategory(cat)}
                                >
                                    <Text style={styles.famBtnText}>{catCfg.icon}</Text>
                                    <Text style={[styles.famBtnLabel, { color: active ? catCfg.color : 'rgba(255,255,255,0.45)' }]}>
                                        {catCfg.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <View style={styles.modeSwitch}>
                        {(['TOTAL', 'PERF'] as ClassementMode[]).map(mode => {
                            const active = mode === classementMode;
                            return (
                                <TouchableOpacity
                                    key={mode}
                                    style={[styles.modeBtn, active && styles.modeBtnActive]}
                                    onPress={() => {
                                        setClassementMode(mode);
                                        if (mode === 'TOTAL') setShowAllPlayers(false);
                                    }}
                                >
                                    <Text style={[styles.modeBtnText, active && styles.modeBtnTextActive]}>
                                        {mode === 'TOTAL' ? 'Total' : 'Perf'}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {isPerfMode ? (
                    <View style={styles.perfInfoRow}>
                        <TouchableOpacity
                            style={[styles.showAllBtn, showAllPlayers && styles.showAllBtnActive]}
                            onPress={() => setShowAllPlayers(prev => !prev)}
                        >
                            <Text style={[styles.showAllBtnText, showAllPlayers && styles.showAllBtnTextActive]}>
                                Afficher tous
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.perfHint}>Par défaut : minimum 10 matchs</Text>
                    </View>
                ) : null}

                {classementLoading ? (
                    <View style={styles.clsCenter}>
                        <ActivityIndicator color="#FFD700" size="large" />
                        <Text style={styles.clsLoadText}>Chargement...</Text>
                    </View>
                ) : sorted.length === 0 ? (
                    <View style={styles.clsCenter}>
                        <Text style={styles.clsEmpty}>
                            {isPerfMode ? 'Aucun joueur qualifié pour ce classement.' : "Aucun joueur pour l'instant."}
                        </Text>
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                        {sorted.map((entry, index) => {
                            const isMe = entry.uid === currentUid;
                            const localRank = index + 1;
                            const rc = rankColor(localRank);
                            const grade = getLeagueGrade(entry.cochonsGiven) ?? 'APPRENTI_1';
                            const avatarSrc = getAvatarImage(entry.avatarId || 'avatar_default');
                            const isQualified = qualifiesForPerf(entry);

                            return (
                                <Animated.View
                                    key={entry.uid}
                                    entering={FadeInUp.delay(index * 35).duration(300)}
                                    style={[styles.clsRow, isMe && { borderColor: cfg.color, backgroundColor: `${cfg.color}10` }]}
                                >
                                    <View style={[styles.clsRankCircle, { borderColor: rc }]}>
                                        <Text style={[styles.clsRankText, { color: rc }]}>{localRank}</Text>
                                    </View>

                                    <View style={styles.clsAvatarWrap}>
                                        <Image source={avatarSrc} style={styles.clsAvatar} contentFit="cover" cachePolicy="memory-disk" />
                                    </View>

                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.clsName, isMe && { color: cfg.color }]} numberOfLines={1}>
                                            {isMe ? `${entry.displayName} (Vous)` : entry.displayName}
                                        </Text>
                                        <Text style={styles.clsGrade}>
                                            {LEAGUE_ICONS[grade]} {LEAGUE_LABELS[grade]}
                                        </Text>
                                        {isPerfMode && !isQualified ? (
                                            <View style={styles.unqualifiedBadge}>
                                                <Text style={styles.unqualifiedBadgeText}>-10 matchs</Text>
                                            </View>
                                        ) : null}
                                    </View>

                                    <View style={styles.clsScore}>
                                        <Text style={[styles.clsScoreNum, { color: cfg.color }]}>
                                            {getEntryScore(entry)}
                                        </Text>
                                        <Text style={styles.clsScoreLabel}>{isPerfMode ? '/ match' : cfg.sublabel}</Text>
                                        <Text style={styles.clsMeta}>{getEntryMeta(entry)}</Text>
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
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>

                    {activeTab !== 'CLASSEMENT' ? (
                        <View style={styles.tabs}>
                            {([
                                { id: 'MA_LIGUE', label: '🐷 Ma Ligue' },
                                { id: 'CLASSEMENT', label: '🏅 Classement' },
                                { id: 'INFOS', label: '🏆 Infos' },
                            ] as { id: TabType; label: string }[]).map(tab => (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
                                    onPress={() => setActiveTab(tab.id)}
                                >
                                    <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : null}

                    <View style={styles.body}>
                        {activeTab === 'INFOS' ? renderInfos() : null}
                        {activeTab === 'MA_LIGUE' ? renderMaLigue() : null}
                        {activeTab === 'CLASSEMENT' ? renderClassement() : null}
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
    tabs: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 14,
        marginTop: 4,
        paddingRight: 44,
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
    dashContainer: {
        flex: 1,
    },
    dashContent: {
        paddingBottom: 20,
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
        flexDirection: 'row',
        gap: 10,
        alignItems: 'stretch',
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
    groupCard: {
        minHeight: 140,
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
        alignItems: 'stretch',
    },
    subBadge: {
        flex: 1,
        minHeight: 52,
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
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
    eliteCard: {
        minHeight: 140,
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
    clsTopBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    clsBackBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingVertical: 6,
        paddingRight: 8,
    },
    clsBackText: {
        color: 'rgba(255,255,255,0.72)',
        fontSize: 12,
        fontWeight: '700',
    },
    clsTopTitle: {
        color: '#FFD700',
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 0.4,
    },
    clsControlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    clsMetricTabs: {
        flex: 1,
        marginRight: 8,
    },
    famRow: {
        flexDirection: 'row',
        gap: 8,
    },
    famBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 9,
        paddingHorizontal: 12,
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
    modeSwitch: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    modeBtn: {
        paddingHorizontal: 12,
        paddingVertical: 9,
    },
    modeBtnActive: {
        backgroundColor: 'rgba(255,215,0,0.18)',
    },
    modeBtnText: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 11,
        fontWeight: '800',
    },
    modeBtnTextActive: {
        color: '#FFD700',
    },
    perfInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 10,
    },
    showAllBtn: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    showAllBtnActive: {
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255,215,0,0.14)',
    },
    showAllBtnText: {
        color: 'rgba(255,255,255,0.38)',
        fontSize: 11,
        fontWeight: '800',
    },
    showAllBtnTextActive: {
        color: '#FFD700',
    },
    perfHint: {
        flex: 1,
        textAlign: 'right',
        color: 'rgba(255,255,255,0.45)',
        fontSize: 11,
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
    unqualifiedBadge: {
        alignSelf: 'flex-start',
        marginTop: 5,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    unqualifiedBadgeText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 9,
        fontWeight: '800',
    },
    clsScore: {
        alignItems: 'flex-end',
        minWidth: 92,
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
    clsMeta: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.45)',
        marginTop: 3,
        textAlign: 'right',
        maxWidth: 120,
    },
});
