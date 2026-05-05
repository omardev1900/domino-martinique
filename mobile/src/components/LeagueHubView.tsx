import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInUp } from 'react-native-reanimated';

import {
    LEAGUE_FRAME_THRESHOLDS,
    LEAGUE_ICONS,
    LEAGUE_LABELS,
    LEAGUE_FRAME_REWARDS,
    LEAGUE_GRADE_ORDER,
} from '../core/economy.constants';
import { getLeagueGrade } from '../core/RewardEngine';
import { LeagueGrade } from '../core/economy.types';
import { statsService } from '../core/services/stats.service';
import { leaderboardService, LeaderboardEntry } from '../core/services/leaderboard.service';
import { authService } from '../core/services/auth.service';
import { getAvatarImage } from '../core/avatars';
import { getLeagueProgress, getMonthlyCochonsFromHistory } from '../core/leagueProgress';

type TabType = 'MA_LIGUE' | 'CLASSEMENT_MOIS' | 'CLASSEMENT_GLOBAL';
type ClassementCategory = 'PLUS_COCHONS' | 'MOINS_COCHONS' | 'PLUS_POINTS';
type ClassementMode = 'TOTAL' | 'PERF';

const CATEGORY_CONFIG: Record<ClassementCategory, { label: string; icon: string; color: string; sublabel: string }> = {
    PLUS_COCHONS: { label: '+ Cochons', icon: '🐷', color: '#FF8C00', sublabel: 'cochons infligés' },
    MOINS_COCHONS: { label: '- Cochons', icon: '🛡️', color: '#4FC3F7', sublabel: 'cochons subis' },
    PLUS_POINTS: { label: '+ Points', icon: '⭐', color: '#FFD700', sublabel: 'points cumulés' },
};

const tierTheme = (grade: LeagueGrade) => {
    if (grade.startsWith('APPRENTI')) {
        return { tint: '#9E9E9E', bg: 'rgba(158,158,158,0.05)', border: 'rgba(158,158,158,0.22)' };
    }
    if (grade.startsWith('MAITRE')) {
        return { tint: '#FFD700', bg: 'rgba(255,215,0,0.05)', border: 'rgba(255,215,0,0.22)' };
    }
    if (grade === 'ROI') {
        return { tint: '#4FC3F7', bg: 'rgba(79,195,247,0.05)', border: 'rgba(79,195,247,0.28)' };
    }
    return { tint: '#FF5252', bg: 'rgba(255,82,82,0.05)', border: 'rgba(255,82,82,0.28)' };
};

export const LeagueHubView: React.FC = () => {
    const { width } = useWindowDimensions();
    const [activeTab, setActiveTab] = useState<TabType>('MA_LIGUE');
    const [leaguePoints, setLeaguePoints] = useState(0);
    const [classementCategory, setClassementCategory] = useState<ClassementCategory>('PLUS_COCHONS');
    const [classementMode, setClassementMode] = useState<ClassementMode>('TOTAL');
    const [showAllPlayers, setShowAllPlayers] = useState(false);
    const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
    const [classementLoading, setClassementLoading] = useState(false);
    const [currentUid, setCurrentUid] = useState<string | null>(null);
    const classementUnsubRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        statsService.getStats().then((stats) => {
            setLeaguePoints(getMonthlyCochonsFromHistory(stats.matchHistory));
        });
        authService.getCurrentUser().then((user) => setCurrentUid(user?.uid ?? null));
    }, []);

    useEffect(() => {
        const isClassementTab = activeTab === 'CLASSEMENT_MOIS' || activeTab === 'CLASSEMENT_GLOBAL';
        if (!isClassementTab) {
            classementUnsubRef.current?.();
            classementUnsubRef.current = null;
            return;
        }
        if (classementUnsubRef.current) return;

        setClassementLoading(true);
        classementUnsubRef.current = leaderboardService.subscribeLeagueClassement((entries) => {
            setAllEntries(entries);
            setClassementLoading(false);
        });

        return () => {
            classementUnsubRef.current?.();
            classementUnsubRef.current = null;
        };
    }, [activeTab]);

    const progress = useMemo(() => getLeagueProgress(leaguePoints), [leaguePoints]);

    const renderMaLigue = () => {
        const currentIndex = progress.grade ? LEAGUE_GRADE_ORDER.indexOf(progress.grade) : -1;
        const tierCardWidth = width >= 900 ? '22.5%' : '47%';

        return (
            <ScrollView style={styles.maLigueScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.maLigueContent}>
                <Animated.View entering={FadeInUp.duration(420)} style={styles.leagueIntroCard}>
                    <Text style={styles.leagueIntroEmoji}>🏆</Text>
                    <Text style={styles.leagueIntroTitle}>
                        {leaguePoints === 0
                            ? 'Donnez votre premier cochon !'
                            : `${leaguePoints.toLocaleString()} cochon${leaguePoints > 1 ? 's' : ''} du mois`}
                    </Text>
                    <Text style={styles.leagueIntroSubtitle}>
                        {progress.nextThreshold != null
                            ? `Plus que ${progress.remainingToNext} cochon${progress.remainingToNext > 1 ? 's' : ''} pour le prochain palier`
                            : 'Vous avez atteint le grade maximum du mois'}
                    </Text>
                    <View style={styles.leagueProgressPill}>
                        <Text style={styles.leagueProgressPillText}>
                            {progress.nextThreshold != null
                                ? `${leaguePoints} / ${progress.nextThreshold} 🐷 vers le prochain palier`
                                : `${leaguePoints} 🐷 • grade maximum`}
                        </Text>
                    </View>
                </Animated.View>

                <View style={styles.monthlyGradeCard}>
                    <View style={styles.monthlyGradeHeader}>
                        <Text style={styles.monthlyGradeHeaderValue}>
                            {progress.grade ? LEAGUE_ICONS[progress.grade] : '🥉'} {progress.grade ? LEAGUE_LABELS[progress.grade] : 'Sans grade'}
                        </Text>
                    </View>
                    <View style={styles.progressLabels}>
                        <Text style={styles.progressBound}>{progress.previousThreshold}</Text>
                        {progress.nextThreshold != null && progress.nextGrade ? (
                            <Text style={styles.progressCenter}>→ {LEAGUE_LABELS[progress.nextGrade]} ({progress.nextThreshold} 🐷)</Text>
                        ) : (
                            <Text style={styles.progressCenter}>Grade maximum 🔥</Text>
                        )}
                        <Text style={styles.progressBound}>{progress.nextThreshold ?? '∞'}</Text>
                    </View>
                    <View style={styles.monthlyProgressTrack}>
                        <View style={[styles.monthlyProgressFill, { width: `${Math.max(2, Math.round(progress.progressPercent * 100))}%` }]} />
                    </View>
                </View>

                <Text style={styles.paliersTitle}>PALIERS DU MOIS</Text>
                <View style={styles.tiersGrid}>
                    {LEAGUE_GRADE_ORDER.map((grade, index) => {
                        const isUnlocked = index <= currentIndex;
                        const isCurrent = grade === progress.grade;
                        const theme = tierTheme(grade);

                        return (
                            <Animated.View
                                key={grade}
                                entering={FadeInUp.delay(index * 50).duration(280)}
                                style={[
                                    styles.tierCard,
                                    { width: tierCardWidth },
                                    isUnlocked && {
                                        backgroundColor: theme.bg,
                                        borderColor: theme.border,
                                        shadowColor: theme.tint,
                                    },
                                    isUnlocked ? styles.tierCardUnlocked : styles.tierCardLocked,
                                    isCurrent && styles.tierCardActive,
                                ]}
                            >
                                {isCurrent ? (
                                    <View style={styles.activeBadge}>
                                        <Text style={styles.activeBadgeText}>ACTUEL</Text>
                                    </View>
                                ) : null}
                                <Text style={[styles.tierGradeIcon, !isUnlocked && styles.tierGradeIconLocked]}>
                                    {isUnlocked ? LEAGUE_ICONS[grade] : '🔒'}
                                </Text>
                                <Text style={[styles.tierThreshold, { color: isUnlocked ? theme.tint : 'rgba(255,255,255,0.4)' }]}>
                                    {LEAGUE_FRAME_THRESHOLDS[grade]} 🐷
                                </Text>
                                <Text style={[styles.tierLabel, { color: isUnlocked ? '#FFFFFF' : 'rgba(255,255,255,0.5)' }]}>
                                    {LEAGUE_LABELS[grade]}
                                </Text>
                                <View style={[styles.rewardBadge, { borderColor: isUnlocked ? theme.border : 'rgba(255,255,255,0.12)' }]}>
                                    <Text style={[styles.rewardBadgeText, { color: isUnlocked ? theme.tint : 'rgba(255,255,255,0.4)' }]}>
                                        +{LEAGUE_FRAME_REWARDS[grade].coinsBonus.toLocaleString()} 🪙
                                    </Text>
                                </View>
                            </Animated.View>
                        );
                    })}
                </View>

            </ScrollView>
        );
    };

    const renderClassement = (scope: 'MONTHLY' | 'GLOBAL') => {
        const cfg = CATEGORY_CONFIG[classementCategory];
        const isPerfMode = classementMode === 'PERF';
        const isMonthlyScope = scope === 'MONTHLY';

        const getGamesPlayed = (entry: LeaderboardEntry) => isMonthlyScope ? entry.gamesPlayedThisMonth : entry.gamesPlayed;
        const getCochonsGiven = (entry: LeaderboardEntry) => isMonthlyScope ? entry.cochonsGivenThisMonth : entry.cochonsGiven;
        const getCochonsSubis = (entry: LeaderboardEntry) => isMonthlyScope ? entry.totalCochonsSubisThisMonth : entry.totalCochonsSubis;
        const getPointsAccumulated = (entry: LeaderboardEntry) => isMonthlyScope ? entry.totalPointsAccumulatedThisMonth : entry.totalPointsAccumulated;

        const qualifiesForPerf = (entry: LeaderboardEntry) => getGamesPlayed(entry) >= 10;

        const getPerformanceValue = (entry: LeaderboardEntry): number => {
            const gamesPlayed = getGamesPlayed(entry);
            if (gamesPlayed <= 0) {
                return classementCategory === 'MOINS_COCHONS' ? Number.POSITIVE_INFINITY : 0;
            }
            if (classementCategory === 'PLUS_COCHONS') return getCochonsGiven(entry) / gamesPlayed;
            if (classementCategory === 'MOINS_COCHONS') return getCochonsSubis(entry) / gamesPlayed;
            return getPointsAccumulated(entry) / gamesPlayed;
        };

        const sourceEntries = isPerfMode
            ? (showAllPlayers ? allEntries : allEntries.filter(qualifiesForPerf))
            : allEntries;

        const sorted = [...sourceEntries].sort((a, b) => {
            const aGames = getGamesPlayed(a);
            const bGames = getGamesPlayed(b);
            const aCochons = getCochonsGiven(a);
            const bCochons = getCochonsGiven(b);
            const aSubis = getCochonsSubis(a);
            const bSubis = getCochonsSubis(b);
            const aPoints = getPointsAccumulated(a);
            const bPoints = getPointsAccumulated(b);

            if (isPerfMode) {
                const aQualified = qualifiesForPerf(a);
                const bQualified = qualifiesForPerf(b);
                if (showAllPlayers && aQualified !== bQualified) return aQualified ? -1 : 1;

                if (classementCategory === 'MOINS_COCHONS') {
                    const diff = getPerformanceValue(a) - getPerformanceValue(b);
                    if (diff !== 0) return diff;
                    const tieByCochons = aSubis - bSubis;
                    if (tieByCochons !== 0) return tieByCochons;
                    return bGames - aGames;
                }

                const diff = getPerformanceValue(b) - getPerformanceValue(a);
                if (diff !== 0) return diff;

                if (classementCategory === 'PLUS_COCHONS') {
                    const tieByCochons = bCochons - aCochons;
                    if (tieByCochons !== 0) return tieByCochons;
                } else {
                    const tieByPoints = bPoints - aPoints;
                    if (tieByPoints !== 0) return tieByPoints;
                }
                return bGames - aGames;
            }

            if (classementCategory === 'PLUS_COCHONS') {
                const diff = bCochons - aCochons;
                return diff !== 0 ? diff : bGames - aGames;
            }
            if (classementCategory === 'MOINS_COCHONS') {
                const aHasMatches = aGames > 0;
                const bHasMatches = bGames > 0;
                if (aHasMatches !== bHasMatches) return aHasMatches ? -1 : 1;
                const diff = aSubis - bSubis;
                return diff !== 0 ? diff : bGames - aGames;
            }
            const diff = bPoints - aPoints;
            return diff !== 0 ? diff : bGames - aGames;
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
            if (classementCategory === 'PLUS_COCHONS') return `${getCochonsGiven(entry).toLocaleString()}`;
            if (classementCategory === 'MOINS_COCHONS') return `${getCochonsSubis(entry).toLocaleString()}`;
            return `${getPointsAccumulated(entry).toLocaleString()}`;
        };

        const getEntryMeta = (entry: LeaderboardEntry): string => {
            const gamesPlayed = getGamesPlayed(entry);
            const matchesLabel = `${gamesPlayed} match${gamesPlayed > 1 ? 's' : ''}`;
            if (!isPerfMode) return matchesLabel;
            if (classementCategory === 'PLUS_COCHONS') return `${getCochonsGiven(entry).toLocaleString()} cochons en ${matchesLabel}`;
            if (classementCategory === 'MOINS_COCHONS') return `${getCochonsSubis(entry).toLocaleString()} cochons subis en ${matchesLabel}`;
            return `${getPointsAccumulated(entry).toLocaleString()} points en ${matchesLabel}`;
        };

        return (
            <View style={{ flex: 1 }}>
                <View style={styles.scopeHeader}>
                    <Text style={styles.scopeHeaderTitle}>
                        {isMonthlyScope ? 'Classement du mois' : 'Classement global'}
                    </Text>
                    <Text style={styles.scopeHeaderSub}>
                        {isMonthlyScope ? 'Basé sur les performances du mois en cours' : 'Basé sur les performances cumulées'}
                    </Text>
                </View>

                <View style={styles.clsControlsRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clsMetricTabs} contentContainerStyle={styles.famRow}>
                        {(Object.keys(CATEGORY_CONFIG) as ClassementCategory[]).map((cat) => {
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
                        {(['TOTAL', 'PERF'] as ClassementMode[]).map((mode) => {
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
                            onPress={() => setShowAllPlayers((prev) => !prev)}
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
                            const avatarSrc = getAvatarImage(entry.avatarId || 'avatar_default');
                            const isQualified = qualifiesForPerf(entry);
                            const grade = isMonthlyScope ? (getLeagueGrade(entry.cochonsGivenThisMonth) ?? null) : null;

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
                                        {grade ? (
                                            <Text style={styles.clsGrade}>
                                                {LEAGUE_ICONS[grade]} {LEAGUE_LABELS[grade]}
                                            </Text>
                                        ) : null}
                                        {isPerfMode && !isQualified ? (
                                            <View style={styles.unqualifiedBadge}>
                                                <Text style={styles.unqualifiedBadgeText}>-10 matchs</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                    <View style={styles.clsScore}>
                                        <Text style={[styles.clsScoreNum, { color: cfg.color }]}>{getEntryScore(entry)}</Text>
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
        <View style={styles.container}>
            <View style={styles.tabs}>
                {([
                    { id: 'MA_LIGUE', label: '🐷 Ma Ligue' },
                    { id: 'CLASSEMENT_MOIS', label: '🏅 Classement du mois' },
                    { id: 'CLASSEMENT_GLOBAL', label: '🌍 Classement global' },
                ] as { id: TabType; label: string }[]).map((tab) => (
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
            <View style={styles.body}>
                {activeTab === 'MA_LIGUE' ? renderMaLigue() : null}
                {activeTab === 'CLASSEMENT_MOIS' ? renderClassement('MONTHLY') : null}
                {activeTab === 'CLASSEMENT_GLOBAL' ? renderClassement('GLOBAL') : null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabs: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 14,
        marginTop: 4,
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
        textAlign: 'center',
    },
    tabTextActive: { color: '#FFD700' },
    body: { flex: 1 },
    maLigueScroll: { flex: 1 },
    maLigueContent: { paddingBottom: 24 },
    leagueIntroCard: {
        backgroundColor: 'rgba(255,215,0,0.08)',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.2)',
        marginBottom: 18,
    },
    leagueIntroEmoji: { fontSize: 40, marginBottom: 8 },
    leagueIntroTitle: {
        color: '#FFD700',
        fontSize: 22,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 6,
    },
    leagueIntroSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    leagueProgressPill: {
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.18)',
    },
    leagueProgressPillText: {
        color: '#FFD700',
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
    },
    monthlyGradeCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 18,
    },
    monthlyGradeHeader: { alignItems: 'center', marginBottom: 8 },
    monthlyGradeHeaderValue: {
        color: '#FFD700',
        fontSize: 18,
        fontWeight: '900',
        marginTop: 6,
        textAlign: 'center',
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 7,
    },
    progressBound: { fontSize: 11, color: 'rgba(255,255,255,0.3)', width: 32 },
    progressCenter: {
        flex: 1,
        textAlign: 'center',
        fontSize: 11,
        color: 'rgba(255,255,255,0.55)',
        fontWeight: 'bold',
    },
    monthlyProgressTrack: {
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.07)',
        overflow: 'hidden',
    },
    monthlyProgressFill: {
        height: '100%',
        borderRadius: 10,
        backgroundColor: '#FFD700',
    },
    paliersTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: 'rgba(255,215,0,0.5)',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 12,
        textAlign: 'center',
    },
    tiersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    tierCard: {
        minWidth: 145,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        gap: 8,
        position: 'relative',
    },
    tierCardUnlocked: {
        borderWidth: 1.5,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 3,
    },
    tierCardLocked: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    tierCardActive: {
        borderColor: '#FFD700',
        borderWidth: 2,
        backgroundColor: 'rgba(255,215,0,0.12)',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
    },
    activeBadge: {
        position: 'absolute',
        top: -10,
        backgroundColor: '#FFD700',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
    },
    activeBadgeText: {
        color: '#1A0535',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    tierGradeIcon: { fontSize: 28 },
    tierGradeIconLocked: { opacity: 0.5 },
    tierThreshold: { fontSize: 16, fontWeight: '900' },
    tierLabel: {
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    rewardBadge: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
    },
    rewardBadgeText: { fontWeight: '900', fontSize: 12 },
    scopeHeader: {
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    scopeHeaderTitle: { color: '#FFD700', fontSize: 16, fontWeight: '900' },
    scopeHeaderSub: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 4 },
    clsControlsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    clsMetricTabs: { flex: 1, marginRight: 8 },
    famRow: { flexDirection: 'row', gap: 8 },
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
    famBtnText: { fontSize: 14 },
    famBtnLabel: { fontSize: 11, fontWeight: '800' },
    modeSwitch: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    modeBtn: { paddingHorizontal: 12, paddingVertical: 9 },
    modeBtnActive: { backgroundColor: 'rgba(255,215,0,0.18)' },
    modeBtnText: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '800' },
    modeBtnTextActive: { color: '#FFD700' },
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
    showAllBtnActive: { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.14)' },
    showAllBtnText: { color: 'rgba(255,255,255,0.38)', fontSize: 11, fontWeight: '800' },
    showAllBtnTextActive: { color: '#FFD700' },
    perfHint: { flex: 1, textAlign: 'right', color: 'rgba(255,255,255,0.45)', fontSize: 11 },
    clsCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
    clsLoadText: { color: 'rgba(255,255,255,0.4)', marginTop: 12, fontSize: 13 },
    clsEmpty: { color: 'rgba(255,255,255,0.35)', fontSize: 14, textAlign: 'center', paddingHorizontal: 20 },
    clsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        marginBottom: 8,
    },
    clsRankCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1.4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clsRankText: { fontSize: 13, fontWeight: '900' },
    clsAvatarWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    clsAvatar: { width: '100%', height: '100%' },
    clsName: { color: '#FFF', fontSize: 13, fontWeight: '800' },
    clsGrade: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
    clsScore: { alignItems: 'flex-end', marginLeft: 8, minWidth: 86 },
    clsScoreNum: { fontSize: 18, fontWeight: '900' },
    clsScoreLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: -1 },
    clsMeta: { color: 'rgba(255,255,255,0.28)', fontSize: 10, marginTop: 4, textAlign: 'right' },
    unqualifiedBadge: {
        alignSelf: 'flex-start',
        marginTop: 6,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 7,
        paddingVertical: 3,
    },
    unqualifiedBadgeText: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '800' },
});
