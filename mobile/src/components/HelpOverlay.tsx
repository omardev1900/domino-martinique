import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    ScrollView,
    Modal,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, ZoomIn, SlideInDown, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface HelpOverlayProps {
    visible: boolean;
    onClose: () => void;
}

type TabType = 'BASES' | 'MODES' | 'COCHON' | 'ECONOMIE' | 'LIGUE' | 'DON';

export const HelpOverlay: React.FC<HelpOverlayProps> = ({ visible, onClose }) => {
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;
    const [activeTab, setActiveTab] = useState<TabType>('BASES');

    // Animations
    const opacityValue = useSharedValue(0);
    const scaleValue = useSharedValue(0.9);

    useEffect(() => {
        if (visible) {
            opacityValue.value = withTiming(1, { duration: 300 });
            scaleValue.value = withSpring(1);
        } else {
            opacityValue.value = 0;
            scaleValue.value = 0.9;
        }
    }, [visible]);

    const animatedBackdropStyle = useAnimatedStyle(() => ({
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
        opacity: opacityValue.value
    }));

    const animatedContentStyle = useAnimatedStyle(() => ({
        opacity: opacityValue.value,
        transform: [{ scale: scaleValue.value }]
    }));

    if (!visible) return null;

    const renderTabButton = (type: TabType, label: string, icon: string) => (
        <TouchableOpacity
            style={[styles.tabButton, activeTab === type && styles.tabButtonActive]}
            onPress={() => setActiveTab(type)}
            activeOpacity={0.7}
        >
            <Text style={[styles.tabIcon, activeTab === type && styles.tabIconActive]}>{icon}</Text>
            <Text style={[styles.tabText, activeTab === type && styles.tabTextActive]}>{label}</Text>
        </TouchableOpacity>
    );

    const renderBases = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <Section title="Le But du Jeu" icon="🎯">
                <Text style={styles.para}>Le domino martiniquais se joue à <Text style={styles.bold}>3 joueurs</Text> avec un jeu de double-six (28 dominos).</Text>
                <Text style={styles.para}>Chaque joueur reçoit <Text style={styles.bold}>7 dominos</Text>. Les 7 restants sont mis à l'écart (le "talon") et ne sont pas utilisés.</Text>
                <Text style={styles.para}>Le but est d'être le premier à vider sa main.</Text>
            </Section>

            <Section title="La Pose" icon="🧩">
                <Text style={styles.para}>On pose un domino correspondant à l'une des deux extrémités libres du plateau.</Text>
                <Text style={styles.para}>Si vous ne pouvez pas jouer, vous <Text style={styles.bold}>"boudez"</Text> (passez votre tour).</Text>
            </Section>

            <Section title="Déterminer le départ" icon="🏁">
                <Text style={styles.para}>Le joueur avec le <Text style={styles.bold}>plus gros double</Text> commence la première manche (6-6, puis 5-5...).</Text>
                <Text style={styles.para}>Pour les manches suivantes, c'est le <Text style={styles.bold}>vainqueur précédent</Text> qui commence avec le domino de son choix.</Text>
            </Section>

            <Section title="Partie Bloquée" icon="🛑">
                <Text style={styles.para}>Si plus personne ne peut jouer, la partie est bloquée. Le joueur ayant le <Text style={styles.bold}>moins de points</Text> en main remporte la manche.</Text>
                <Text style={styles.para}>En cas d'égalité parfaite, la manche est nulle.</Text>
            </Section>
        </ScrollView>
    );

    const renderModes = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <Section title="Mode Manche" icon="🔢">
                <Text style={styles.para}>Le match se termine quand un joueur atteint un nombre défini de manches gagnées (ex: 3 manches).</Text>
            </Section>
            
            <Section title="Mode Score" icon="📈">
                <Text style={styles.para}>On cumule les points de victoire à chaque manche jusqu'à atteindre le score cible.</Text>
            </Section>

            <Section title="Mode Cochon" icon="🐷">
                <Text style={styles.para}>Le match s'arrête dès que <Text style={styles.bold}>3 Cochons</Text> ont été distribués au total durant la partie.</Text>
            </Section>
        </ScrollView>
    );

    const renderCochon = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <Section title="C'est quoi un Cochon ?" icon="🐷">
                <Text style={styles.para}>Un joueur est déclaré <Text style={styles.bold}>"Cochon"</Text> s'il termine une manche avec <Text style={styles.bold}>0 victoire</Text> alors que le match continue.</Text>
            </Section>

            <Section title="Cochon Simple vs Double" icon="🔥">
                <Text style={styles.para}><Text style={styles.bold}>Cochon Simple :</Text> Un seul adversaire finit à 0.</Text>
                <Text style={styles.para}><Text style={styles.bold}>Double Cochon :</Text> Les deux adversaires finissent à 0 (Score total: 3 - 0 - 0).</Text>
            </Section>

            <Section title="Gains & Pénalités" icon="⚖️">
                <Text style={styles.para}>Donner un cochon rapporte un <Text style={styles.bold}>bonus massif</Text> de Coins et de Points de Ligue.</Text>
                <Text style={styles.para}>Finir cochon entraîne une <Text style={styles.bold}>pénalité de points (-1)</Text> et aucun gain de Coins pour la manche.</Text>
            </Section>

            <Section title="Le Chiré" icon="✂️">
                <Text style={styles.para}>Si tous les joueurs gagnent au moins une manche (1-1-1), le jeu est "Chiré". Personne n'est cochon, aucun bonus de cochon n'est distribué.</Text>
            </Section>
        </ScrollView>
    );

    const renderEconomie = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <Section title="Les Pièces (Coins)" icon="🪙">
                <Text style={styles.para}>C'est votre argent de jeu. Utilisez-le pour payer le <Text style={styles.bold}>Buy-in</Text> des tables Multijoueurs.</Text>
                <Text style={styles.para}>Gagnez-en en remportant des matchs ou dans les coffres de niveau.</Text>
            </Section>

            <Section title="L'Expérience (XP)" icon="⭐">
                <Text style={styles.para}>Chaque action et chaque victoire vous rapporte de l'XP.</Text>
                <Text style={styles.para}>L'XP vous fait monter de <Text style={styles.bold}>Niveau</Text>. Plus votre niveau est haut, plus vous avez de bonus sur vos futurs gains !</Text>
            </Section>

            <Section title="Les Diamants" icon="💎">
                <Text style={styles.para}>Monnaie rare obtenue lors de victoires prestigieuses (Double Cochon) ou lors de passages de certains niveaux.</Text>
            </Section>

            <Section title="Les Coffres de Niveau" icon="📦">
                <Text style={styles.para}>À chaque passage de niveau, vous recevez un coffre contenant des récompenses aléatoires ou fixes.</Text>
            </Section>
        </ScrollView>
    );

    const renderLigue = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <Section title="Les Points de Ligue" icon="🐷">
                <Text style={styles.para}>Vous gagnez des points de ligue uniquement en <Text style={styles.bold}>infligeant des cochons</Text> à vos adversaires.</Text>
                <Text style={styles.para}>C'est la mesure de votre domination réelle sur le tapis.</Text>
            </Section>

            <Section title="Hiérarchie des Grades" icon="🎖️">
                <View style={styles.gradeRow}>
                    <Text style={styles.gradeBadge}>🥉</Text>
                    <View>
                        <Text style={styles.gradeTitle}>APPRENTI</Text>
                        <Text style={styles.gradeDesc}>Le début du voyage.</Text>
                    </View>
                </View>
                <View style={styles.gradeRow}>
                    <Text style={styles.gradeBadge}>🥈</Text>
                    <View>
                        <Text style={styles.gradeTitle}>MAÎTRE</Text>
                        <Text style={styles.gradeDesc}>Vous commencez à bousculer la table.</Text>
                    </View>
                </View>
                <View style={styles.gradeRow}>
                    <Text style={styles.gradeBadge}>🥇</Text>
                    <View>
                        <Text style={styles.gradeTitle}>ROI</Text>
                        <Text style={styles.gradeDesc}>Seuls les meilleurs atteignent ce trône.</Text>
                    </View>
                </View>
                <View style={styles.gradeRow}>
                    <Text style={styles.gradeBadge}>💎</Text>
                    <View>
                        <Text style={styles.gradeTitle}>LÉGENDE</Text>
                        <Text style={styles.gradeDesc}>Votre nom est craint sur toutes les tables.</Text>
                    </View>
                </View>
            </Section>
        </ScrollView>
    );

    const renderDon = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <Section title="Soutenir le projet" icon="🙏">
                <Text style={styles.para}>Domino Martiniquais est un projet indépendant développé avec passion pour notre culture.</Text>
                <Text style={styles.para}>Si le jeu te plaît, un don — même symbolique — nous aide à continuer à améliorer l'expérience pour toute la communauté.</Text>
            </Section>

            <Section title="Faire un don via Revolut" icon="💳">
                <Text style={styles.para}>Lien Revolut :</Text>
                <Text style={[styles.para, styles.link]}>revolut.me/mdc-domino</Text>
                <Text style={[styles.para, { marginTop: 6 }]}>Chaque contribution compte. Merci pour ton soutien ! 🙌</Text>
            </Section>

            <Section title="Coordonnées bancaires (MDC)" icon="🏦">
                <Text style={styles.para}><Text style={styles.bold}>Bénéficiaire :</Text> Association MDC Martinique</Text>
                <Text style={styles.para}><Text style={styles.bold}>IBAN :</Text> FR76 XXXX XXXX XXXX XXXX XXXX XXX</Text>
                <Text style={styles.para}><Text style={styles.bold}>BIC :</Text> XXXXFRPP</Text>
                <Text style={[styles.para, { opacity: 0.5, fontSize: 12 }]}>* Coordonnées à compléter par l'équipe MDC.</Text>
            </Section>
        </ScrollView>
    );

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
            <View style={styles.container}>
                <Animated.View style={animatedBackdropStyle}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
                </Animated.View>

                <Animated.View style={[
                    styles.content,
                    animatedContentStyle,
                    isLandscape ? styles.contentLandscape : styles.contentPortrait
                ]}>
                    <LinearGradient
                        colors={['#1A0E2E', '#2D1B4E']}
                        style={styles.gradient}
                    >
                        {/* Close Button (Floating) */}
                        <TouchableOpacity style={styles.floatingCloseButton} onPress={onClose}>
                            <Ionicons name="close-circle" size={32} color="#FFF" />
                        </TouchableOpacity>

                        {/* Tabs Navigation (Moved to Top) */}
                        <View style={styles.tabsWrapper}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                                {renderTabButton('BASES', 'Bases', '🎲')}
                                {renderTabButton('MODES', 'Modes', '🎮')}
                                {renderTabButton('COCHON', 'Cochon', '🐷')}
                                {renderTabButton('ECONOMIE', 'Gains', '💰')}
                                {renderTabButton('LIGUE', 'Ligue', '🏆')}
                                {renderTabButton('DON', 'Donner', '🤝')}
                            </ScrollView>
                        </View>

                        {/* Content Area */}
                        <View style={styles.body}>
                            {activeTab === 'BASES' && renderBases()}
                            {activeTab === 'MODES' && renderModes()}
                            {activeTab === 'COCHON' && renderCochon()}
                            {activeTab === 'ECONOMIE' && renderEconomie()}
                            {activeTab === 'LIGUE' && renderLigue()}
                            {activeTab === 'DON' && renderDon()}
                        </View>
                    </LinearGradient>
                </Animated.View>
            </View>
        </Modal>
    );
};

const Section = ({ title, icon, children }: { title: string, icon: string, children: React.ReactNode }) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>{icon}</Text>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={styles.sectionBody}>
            {children}
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 215, 0, 0.4)',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },
    contentPortrait: {
        width: '96%',
        height: '92%',
    },
    contentLandscape: {
        width: '94%',
        height: '92%',
    },
    gradient: {
        flex: 1,
    },
    floatingCloseButton: {
        position: 'absolute',
        top: 10,
        right: 15,
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 5,
    },
    tabsWrapper: {
        paddingTop: 15,
        paddingBottom: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,215,0,0.2)',
    },
    tabsScroll: {
        paddingHorizontal: 20,
        paddingRight: 60, // Space for close button
        gap: 12,
    },
    tabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    tabButtonActive: {
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        borderColor: '#FFD700',
    },
    tabIcon: {
        fontSize: 16,
        marginRight: 8,
        opacity: 0.6,
    },
    tabIconActive: {
        opacity: 1,
    },
    tabText: {
        color: 'rgba(255,255,255,0.6)',
        fontWeight: 'bold',
        fontSize: 13,
    },
    tabTextActive: {
        color: '#FFD700',
    },
    body: {
        flex: 1,
        paddingHorizontal: 20,
    },
    tabContent: {
        paddingVertical: 20,
    },
    section: {
        marginBottom: 25,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10,
    },
    sectionIcon: {
        fontSize: 22,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    sectionBody: {
        paddingLeft: 4,
    },
    para: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 10,
    },
    bold: {
        color: '#FFD700',
        fontWeight: 'bold',
    },
    gradeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        gap: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 10,
        borderRadius: 12,
    },
    gradeBadge: {
        fontSize: 30,
    },
    gradeTitle: {
        color: '#FFD700',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 1,
    },
    gradeDesc: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
    },
    link: {
        color: '#6BE5FF',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});
