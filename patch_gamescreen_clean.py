import sys

def main():
    file_path = r'e:\PROJETS\clients\domino_matrinique\mobile\src\screens\GameScreen.tsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Imports
    content = content.replace("import { adService } from '../core/services/ad.service';\n", "")
    content = content.replace("import { Ad, AdPlacement } from '../core/ad.types';\n", "")
    content = content.replace("import { AdBannerModal } from '../components/AdBannerModal';\n", "")
    
    if "useInterstitialAd" not in content:
        content = content.replace(
            "import { AdMobIds, useRewardedAd } from '../core/services/AdMobAdapter';",
            "import { AdMobIds, useRewardedAd, useInterstitialAd } from '../core/services/AdMobAdapter';"
        )

    # 2. Hooks and States
    content = content.replace("    const nextAdRef = useRef<Ad | 'ADMOB' | null>(null);\n", "")
    content = content.replace("    const [currentAd, setCurrentAd] = useState<Ad | null>(null);\n", "")
    
    hook_original = "    const [showRewardOverlay, setShowRewardOverlay] = useState(false);\n"
    hook_new = "    const [showRewardOverlay, setShowRewardOverlay] = useState(false);\n    const { isLoaded: isAdMobLoaded, isClosed: isAdMobClosed, load: loadAdMob, show: showAdMob } = useInterstitialAd(AdMobIds.INTERSTITIAL_FIN_PARTIE);\n"
    content = content.replace(hook_original, hook_new)

    # 3. AdMob loader effect
    preload_original = """    // Pré-chargement des pubs automatiques en fin de round/manche/match
    useEffect(() => {
        if (!gameState) return;
        let placement: AdPlacement | null = null;
        if (isSoloMode) {
            if (gameState.phase === 'PARTIE_END') placement = 'END_OF_ROUND';
            else if (gameState.phase === 'MANCHE_END') placement = 'END_OF_MANCHE';
            else if (gameState.phase === 'MATCH_END') placement = 'END_OF_MATCH';
        } else if (gameState.phase === 'MATCH_END') {
            placement = 'END_OF_MATCH';
        }
        if (placement) {
            // Priority : Admin Priority Ads
            adService.getAdForPlacement(placement, 'INTERSTITIAL', true).then(priorityAd => {
                if (priorityAd) {
                    nextAdRef.current = priorityAd;
                } else if (isAdMobLoaded && Platform.OS !== 'web') {
                    // Fallback 1: AdMob
                    nextAdRef.current = 'ADMOB';
                } else {
                    // Fallback 2: Admin Standard Ads
                    adService.getAdForPlacement(placement, 'INTERSTITIAL', false).then(fallbackAd => {
                        if (fallbackAd) {
                            nextAdRef.current = fallbackAd;
                        }
                    });
                }
            });
        }
    }, [gameState?.phase, isAdMobLoaded]);"""

    preload_new = """    // Préchargement AdMob
    useEffect(() => {
        loadAdMob();
    }, [loadAdMob]);

    useEffect(() => {
        if (isAdMobClosed) {
            loadAdMob();
            isAdVisibleRef.current = false;
            setIsAdVisible(false);
            if (pendingPhaseTransitionRef.current) {
                const pending = pendingPhaseTransitionRef.current;
                pendingPhaseTransitionRef.current = null;
                pending();
            }
        }
    }, [isAdMobClosed, loadAdMob]);"""
    content = content.replace(preload_original, preload_new)

    # 4. PARTIE_END
    p_end_orig = """                if (nextAdRef.current) {
                    isAdVisibleRef.current = true;
                    setIsAdVisible(true);
                    if (nextAdRef.current === 'ADMOB') {
                        setTimeout(() => {
                            try {
                                showAdMob();
                                setTimeout(() => {
                                    if (isAdVisibleRef.current) {
                                        LogService.warn('GameScreen', 'AdMob fallback timeout (PARTIE_END)');
                                        isAdVisibleRef.current = false;
                                        setIsAdVisible(false);
                                        if (pendingPhaseTransitionRef.current) {
                                            const pending = pendingPhaseTransitionRef.current;
                                            pendingPhaseTransitionRef.current = null;
                                            pending();
                                        }
                                    }
                                }, 15000);
                            } catch (e) {
                                LogService.error('GameScreen', 'Failed to show AdMob (PARTIE_END)', e);
                                isAdVisibleRef.current = false;
                                setIsAdVisible(false);
                                if (pendingPhaseTransitionRef.current) {
                                    const pending = pendingPhaseTransitionRef.current;
                                    pendingPhaseTransitionRef.current = null;
                                    pending();
                                }
                            }
                        }, 50);
                    } else {
                        setCurrentAd(nextAdRef.current);
                    }
                    nextAdRef.current = null;
                    pendingPhaseTransitionRef.current = () => partieEndContinueRef.current();
                } else if (isAdVisibleRef.current) {
                    pendingPhaseTransitionRef.current = () => partieEndContinueRef.current();
                } else {
                    partieEndContinueRef.current();
                }"""
    p_end_new = """                if (isSoloMode && isAdMobLoaded) {
                    isAdVisibleRef.current = true;
                    setIsAdVisible(true);
                    setTimeout(() => {
                        try {
                            showAdMob();
                        } catch (e) {
                            LogService.error('GameScreen', 'Failed to show AdMob (PARTIE_END)', e);
                            isAdVisibleRef.current = false;
                            setIsAdVisible(false);
                            partieEndContinueRef.current();
                        }
                    }, 50);
                    pendingPhaseTransitionRef.current = () => partieEndContinueRef.current();
                } else {
                    partieEndContinueRef.current();
                }"""
    content = content.replace(p_end_orig, p_end_new)

    # 5. MANCHE_END boude
    m_end_boude_orig = """                if (nextAdRef.current) {
                    isAdVisibleRef.current = true;
                    setIsAdVisible(true);
                    if (nextAdRef.current === 'ADMOB') {
                        setTimeout(() => {
                            try {
                                showAdMob();
                                setTimeout(() => {
                                    if (isAdVisibleRef.current) {
                                        LogService.warn('GameScreen', 'AdMob fallback timeout (MANCHE_END skip)');
                                        isAdVisibleRef.current = false;
                                        setIsAdVisible(false);
                                        if (pendingPhaseTransitionRef.current) {
                                            const pending = pendingPhaseTransitionRef.current;
                                            pendingPhaseTransitionRef.current = null;
                                            pending();
                                        }
                                    }
                                }, 15000);
                            } catch (e) {
                                LogService.error('GameScreen', 'Failed to show AdMob (MANCHE_END skip)', e);
                                isAdVisibleRef.current = false;
                                setIsAdVisible(false);
                                if (pendingPhaseTransitionRef.current) {
                                    const pending = pendingPhaseTransitionRef.current;
                                    pendingPhaseTransitionRef.current = null;
                                    pending();
                                }
                            }
                        }, 50);
                    } else {
                        setCurrentAd(nextAdRef.current);
                    }
                    nextAdRef.current = null;
                    pendingPhaseTransitionRef.current = () => setScoreOverlayPhase('MANCHE_END');
                } else if (isAdVisibleRef.current) {
                    pendingPhaseTransitionRef.current = () => setScoreOverlayPhase('MANCHE_END');
                } else {
                    setScoreOverlayPhase('MANCHE_END');
                }"""
    m_end_new = """                if (isSoloMode && isAdMobLoaded) {
                    isAdVisibleRef.current = true;
                    setIsAdVisible(true);
                    setTimeout(() => {
                        try {
                            showAdMob();
                        } catch (e) {
                            LogService.error('GameScreen', 'Failed to show AdMob (MANCHE_END)', e);
                            isAdVisibleRef.current = false;
                            setIsAdVisible(false);
                            setScoreOverlayPhase('MANCHE_END');
                        }
                    }, 50);
                    pendingPhaseTransitionRef.current = () => setScoreOverlayPhase('MANCHE_END');
                } else {
                    setScoreOverlayPhase('MANCHE_END');
                }"""
    content = content.replace(m_end_boude_orig, m_end_new)

    # 6. MANCHE_END normal
    m_end_norm_orig = """                if (nextAdRef.current) {
                    isAdVisibleRef.current = true;
                    setIsAdVisible(true);
                    if (nextAdRef.current === 'ADMOB') {
                        setTimeout(() => {
                            try {
                                showAdMob();
                                setTimeout(() => {
                                    if (isAdVisibleRef.current) {
                                        LogService.warn('GameScreen', 'AdMob fallback timeout (MANCHE_END)');
                                        isAdVisibleRef.current = false;
                                        setIsAdVisible(false);
                                        if (pendingPhaseTransitionRef.current) {
                                            const pending = pendingPhaseTransitionRef.current;
                                            pendingPhaseTransitionRef.current = null;
                                            pending();
                                        }
                                    }
                                }, 15000);
                            } catch (e) {
                                LogService.error('GameScreen', 'Failed to show AdMob (MANCHE_END)', e);
                                isAdVisibleRef.current = false;
                                setIsAdVisible(false);
                                if (pendingPhaseTransitionRef.current) {
                                    const pending = pendingPhaseTransitionRef.current;
                                    pendingPhaseTransitionRef.current = null;
                                    pending();
                                }
                            }
                        }, 50);
                    } else {
                        setCurrentAd(nextAdRef.current);
                    }
                    nextAdRef.current = null;
                    pendingPhaseTransitionRef.current = () => setScoreOverlayPhase('MANCHE_END');
                } else if (isAdVisibleRef.current) {
                    pendingPhaseTransitionRef.current = () => setScoreOverlayPhase('MANCHE_END');
                } else {
                    setScoreOverlayPhase('MANCHE_END');
                }"""
    content = content.replace(m_end_norm_orig, m_end_new)

    # 7. MATCH_END boude
    match_end_boude_orig = """                if (nextAdRef.current) {
                    isAdVisibleRef.current = true;
                    setIsAdVisible(true);
                    if (nextAdRef.current === 'ADMOB') {
                        setTimeout(() => {
                            try {
                                showAdMob();
                                setTimeout(() => {
                                    if (isAdVisibleRef.current) {
                                        LogService.warn('GameScreen', 'AdMob fallback timeout (MATCH_END skip)');
                                        isAdVisibleRef.current = false;
                                        setIsAdVisible(false);
                                        if (pendingPhaseTransitionRef.current) {
                                            const pending = pendingPhaseTransitionRef.current;
                                            pendingPhaseTransitionRef.current = null;
                                            pending();
                                        }
                                    }
                                }, 15000);
                            } catch (e) {
                                LogService.error('GameScreen', 'Failed to show AdMob (MATCH_END skip)', e);
                                isAdVisibleRef.current = false;
                                setIsAdVisible(false);
                                if (pendingPhaseTransitionRef.current) {
                                    const pending = pendingPhaseTransitionRef.current;
                                    pendingPhaseTransitionRef.current = null;
                                    pending();
                                }
                            }
                        }, 50);
                    } else {
                        setCurrentAd(nextAdRef.current);
                    }
                    nextAdRef.current = null;
                    pendingPhaseTransitionRef.current = () => setScoreOverlayPhase('MATCH_END');
                } else if (isAdVisibleRef.current) {
                    pendingPhaseTransitionRef.current = () => setScoreOverlayPhase('MATCH_END');
                } else {
                    setScoreOverlayPhase('MATCH_END');
                }"""
    match_end_new = """                if (isAdMobLoaded) {
                    isAdVisibleRef.current = true;
                    setIsAdVisible(true);
                    setTimeout(() => {
                        try {
                            showAdMob();
                        } catch (e) {
                            LogService.error('GameScreen', 'Failed to show AdMob (MATCH_END)', e);
                            isAdVisibleRef.current = false;
                            setIsAdVisible(false);
                            setScoreOverlayPhase('MATCH_END');
                        }
                    }, 50);
                    pendingPhaseTransitionRef.current = () => setScoreOverlayPhase('MATCH_END');
                } else {
                    setScoreOverlayPhase('MATCH_END');
                }"""
    content = content.replace(match_end_boude_orig, match_end_new)

    # 8. MATCH_END normal (triggerMatchEnd)
    match_end_norm_orig = """                if (nextAdRef.current) {
                    isAdVisibleRef.current = true;
                    setIsAdVisible(true);
                    if (nextAdRef.current === 'ADMOB') {
                        setTimeout(() => {
                            try {
                                showAdMob();
                                setTimeout(() => {
                                    if (isAdVisibleRef.current) {
                                        LogService.warn('GameScreen', 'AdMob fallback timeout (MATCH_END)');
                                        isAdVisibleRef.current = false;
                                        setIsAdVisible(false);
                                        if (pendingPhaseTransitionRef.current) {
                                            const pending = pendingPhaseTransitionRef.current;
                                            pendingPhaseTransitionRef.current = null;
                                            pending();
                                        }
                                    }
                                }, 15000);
                            } catch (e) {
                                LogService.error('GameScreen', 'Failed to show AdMob (MATCH_END)', e);
                                isAdVisibleRef.current = false;
                                setIsAdVisible(false);
                                if (pendingPhaseTransitionRef.current) {
                                    const pending = pendingPhaseTransitionRef.current;
                                    pendingPhaseTransitionRef.current = null;
                                    pending();
                                }
                            }
                        }, 50);
                    } else {
                        setCurrentAd(nextAdRef.current);
                    }
                    nextAdRef.current = null;
                    pendingPhaseTransitionRef.current = () => setScoreOverlayPhase('MATCH_END');
                } else if (isAdVisibleRef.current) {
                    pendingPhaseTransitionRef.current = () => setScoreOverlayPhase('MATCH_END');
                } else {
                    setScoreOverlayPhase('MATCH_END');
                }"""
    content = content.replace(match_end_norm_orig, match_end_new)

    # 9. Match reward logic
    reward_orig = """        if (scoreOverlayPhase === 'MATCH_END') {
            adService.getAdForPlacement('END_OF_MATCH', 'REWARDED').then(ad => {
                if (ad) {
                    setMatchRewardAmount(ad.rewardAmount ?? 100);
                    const timer = setTimeout(() => {
                        setShowMatchRewardModal(true);
                    }, 4000);
                    return () => clearTimeout(timer);
                }
            });
        } else {
            setShowMatchRewardModal(false);
        }"""
    reward_new = """        if (scoreOverlayPhase === 'MATCH_END') {
            setMatchRewardAmount(100);
            const timer = setTimeout(() => {
                setShowMatchRewardModal(true);
            }, 4000);
            return () => clearTimeout(timer);
        } else {
            setShowMatchRewardModal(false);
        }"""
    content = content.replace(reward_orig, reward_new)

    # 10. AdBannerModal rendering
    banner_modal_regex = """            {currentAd && (
                <AdBannerModal
                    ad={currentAd}
                    onClose={() => {
                        isAdVisibleRef.current = false;
                        setIsAdVisible(false);
                        setCurrentAd(null);
                        const pending = pendingPhaseTransitionRef.current;
                        if (pending) {
                            pendingPhaseTransitionRef.current = null;
                            pending();
                        }
                    }}
                />
            )}"""
    content = content.replace(banner_modal_regex, "")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    main()
