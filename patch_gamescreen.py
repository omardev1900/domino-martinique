import re
import sys

def main():
    file_path = r'e:\PROJETS\clients\domino_matrinique\mobile\src\screens\GameScreen.tsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Imports
    content = re.sub(r"import \{ adService \} from '\.\./core/services/ad\.service';\n", '', content)
    content = re.sub(r"import \{ Ad, AdPlacement \} from '\.\./core/ad\.types';\n", '', content)
    content = re.sub(r"import \{ AdBannerModal \} from '\.\./components/AdBannerModal';\n", '', content)
    content = re.sub(
        r"import \{ AdMobIds, useRewardedAd \} from '\.\./core/services/AdMobAdapter';\n",
        r"import { AdMobIds, useRewardedAd, useInterstitialAd } from '../core/services/AdMobAdapter';\n",
        content
    )
    if "useInterstitialAd" not in content:
        content = re.sub(
            r"import \{ AdMobIds, useRewardedAd \} from '\.\./core/services/AdMobAdapter';",
            r"import { AdMobIds, useRewardedAd, useInterstitialAd } from '../core/services/AdMobAdapter';",
            content
        )

    # 2. Hooks and States
    content = re.sub(r"    const nextAdRef = useRef<Ad \| 'ADMOB' \| null>\(null\);\n", '', content)
    content = re.sub(r"    const \[currentAd, setCurrentAd\] = useState<Ad \| null>\(null\);\n", '', content)
    
    # Add useInterstitialAd hook
    content = re.sub(
        r"    const \[showRewardOverlay, setShowRewardOverlay\] = useState\(false\);\n",
        r"    const [showRewardOverlay, setShowRewardOverlay] = useState(false);\n    const { isLoaded: isAdMobLoaded, isClosed: isAdMobClosed, load: loadAdMob, show: showAdMob } = useInterstitialAd(AdMobIds.INTERSTITIAL_FIN_PARTIE);\n",
        content
    )

    # 3. AdMob loader effect
    admob_effect = """    // Préchargement AdMob
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
    }, [isAdMobClosed, loadAdMob]);
"""
    # Replace the old preload_ads logic with the admob_effect
    preload_ads_regex = r"    // Pré-chargement des pubs automatiques en fin de round/manche/match\n    useEffect\(\(\) => \{\n        if \(\!gameState\) return;\n[\s\S]*?    \}, \[gameState\?\.phase, isAdMobLoaded\]\);\n"
    content = re.sub(preload_ads_regex, admob_effect, content)

    # 4. PARTIE_END
    partie_end_original = r"""            pendingRoundResultTransition\.current = \(\) => \{
                if \(nextAdRef\.current\) \{
                    isAdVisibleRef\.current = true;
                    setIsAdVisible\(true\);
                    if \(nextAdRef\.current === 'ADMOB'\) \{
                        setTimeout\(\(\) => \{
                            try \{
                                showAdMob\(\);
                                setTimeout\(\(\) => \{
                                    if \(isAdVisibleRef\.current\) \{
                                        LogService\.warn\('GameScreen', 'AdMob fallback timeout \(PARTIE_END\)'\);
                                        isAdVisibleRef\.current = false;
                                        setIsAdVisible\(false\);
                                        if \(pendingPhaseTransitionRef\.current\) \{
                                            const pending = pendingPhaseTransitionRef\.current;
                                            pendingPhaseTransitionRef\.current = null;
                                            pending\(\);
                                        \}
                                    \}
                                \}, 15000\);
                            \} catch \(e\) \{
                                LogService\.error\('GameScreen', 'Failed to show AdMob \(PARTIE_END\)', e\);
                                isAdVisibleRef\.current = false;
                                setIsAdVisible\(false\);
                                if \(pendingPhaseTransitionRef\.current\) \{
                                    const pending = pendingPhaseTransitionRef\.current;
                                    pendingPhaseTransitionRef\.current = null;
                                    pending\(\);
                                \}
                            \}
                        \}, 50\);
                    \} else \{
                        setCurrentAd\(nextAdRef\.current\);
                    \}
                    nextAdRef\.current = null;
                    pendingPhaseTransitionRef\.current = \(\) => partieEndContinueRef\.current\(\);
                \} else if \(isAdVisibleRef\.current\) \{
                    pendingPhaseTransitionRef\.current = \(\) => partieEndContinueRef\.current\(\);
                \} else \{
                    partieEndContinueRef\.current\(\);
                \}
            \};"""

    partie_end_replacement = """            pendingRoundResultTransition.current = () => {
                if (isSoloMode && isAdMobLoaded) {
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
                }
            };"""
    content = re.sub(partie_end_original, partie_end_replacement, content)

    # 5. MANCHE_END
    manche_end_original = r"""                if \(nextAdRef\.current\) \{
                    isAdVisibleRef\.current = true;
                    setIsAdVisible\(true\);
                    if \(nextAdRef\.current === 'ADMOB'\) \{
                        setTimeout\(\(\) => \{
                            try \{
                                showAdMob\(\);
                                setTimeout\(\(\) => \{
                                    if \(isAdVisibleRef\.current\) \{
                                        LogService\.warn\('GameScreen', 'AdMob fallback timeout \(MANCHE_END skip\)'\);
                                        isAdVisibleRef\.current = false;
                                        setIsAdVisible\(false\);
                                        if \(pendingPhaseTransitionRef\.current\) \{
                                            const pending = pendingPhaseTransitionRef\.current;
                                            pendingPhaseTransitionRef\.current = null;
                                            pending\(\);
                                        \}
                                    \}
                                \}, 15000\);
                            \} catch \(e\) \{
                                LogService\.error\('GameScreen', 'Failed to show AdMob \(MANCHE_END skip\)', e\);
                                isAdVisibleRef\.current = false;
                                setIsAdVisible\(false\);
                                if \(pendingPhaseTransitionRef\.current\) \{
                                    const pending = pendingPhaseTransitionRef\.current;
                                    pendingPhaseTransitionRef\.current = null;
                                    pending\(\);
                                \}
                            \}
                        \}, 50\);
                    \} else \{
                        setCurrentAd\(nextAdRef\.current\);
                    \}
                    nextAdRef\.current = null;
                    pendingPhaseTransitionRef\.current = \(\) => setScoreOverlayPhase\('MANCHE_END'\);
                \} else if \(isAdVisibleRef\.current\) \{
                    pendingPhaseTransitionRef\.current = \(\) => setScoreOverlayPhase\('MANCHE_END'\);
                \} else \{
                    setScoreOverlayPhase\('MANCHE_END'\);
                \}"""
                
    manche_end_replacement = """                if (isSoloMode && isAdMobLoaded) {
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
    content = re.sub(manche_end_original, manche_end_replacement, content)

    # 6. MATCH_END
    match_end_original = r"""                if \(nextAdRef\.current\) \{
                    isAdVisibleRef\.current = true;
                    setIsAdVisible\(true\);
                    if \(nextAdRef\.current === 'ADMOB'\) \{
                        setTimeout\(\(\) => \{
                            try \{
                                showAdMob\(\);
                                setTimeout\(\(\) => \{
                                    if \(isAdVisibleRef\.current\) \{
                                        LogService\.warn\('GameScreen', 'AdMob fallback timeout \(MATCH_END skip\)'\);
                                        isAdVisibleRef\.current = false;
                                        setIsAdVisible\(false\);
                                        if \(pendingPhaseTransitionRef\.current\) \{
                                            const pending = pendingPhaseTransitionRef\.current;
                                            pendingPhaseTransitionRef\.current = null;
                                            pending\(\);
                                        \}
                                    \}
                                \}, 15000\);
                            \} catch \(e\) \{
                                LogService\.error\('GameScreen', 'Failed to show AdMob \(MATCH_END skip\)', e\);
                                isAdVisibleRef\.current = false;
                                setIsAdVisible\(false\);
                                if \(pendingPhaseTransitionRef\.current\) \{
                                    const pending = pendingPhaseTransitionRef\.current;
                                    pendingPhaseTransitionRef\.current = null;
                                    pending\(\);
                                \}
                            \}
                        \}, 50\);
                    \} else \{
                        setCurrentAd\(nextAdRef\.current\);
                    \}
                    nextAdRef\.current = null;
                    pendingPhaseTransitionRef\.current = \(\) => setScoreOverlayPhase\('MATCH_END'\);
                \} else if \(isAdVisibleRef\.current\) \{
                    pendingPhaseTransitionRef\.current = \(\) => setScoreOverlayPhase\('MATCH_END'\);
                \} else \{
                    setScoreOverlayPhase\('MATCH_END'\);
                \}"""
                
    match_end_replacement = """                if (isAdMobLoaded) {
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
    content = re.sub(match_end_original, match_end_replacement, content)

    # 7. AdBannerModal rendering
    banner_modal_regex = r"\s*\{currentAd && \([\s\S]*?</AdBannerModal>\n\s*\)\}\n"
    content = re.sub(banner_modal_regex, '\n', content)

    # 8. Match reward logic
    reward_replacement = """        if (scoreOverlayPhase === 'MATCH_END') {
            setMatchRewardAmount(100);
            const timer = setTimeout(() => {
                setShowMatchRewardModal(true);
            }, 4000);
            return () => clearTimeout(timer);
        } else {
            setShowMatchRewardModal(false);
        }"""
    content = re.sub(r"        if \(scoreOverlayPhase === 'MATCH_END'\) \{\n\s*adService\.getAdForPlacement\('END_OF_MATCH', 'REWARDED'\)\.then\(ad => \{\n\s*if \(ad\) \{\n\s*setMatchRewardAmount\(ad\.rewardAmount \?\? 100\);\n\s*const timer = setTimeout\(\(\) => \{\n\s*setShowMatchRewardModal\(true\);\n\s*\}, 4000\);\n\s*return \(\) => clearTimeout\(timer\);\n\s*\}\n\s*\}\);\n\s*\} else \{\n\s*setShowMatchRewardModal\(false\);\n\s*\}", reward_replacement, content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    main()
