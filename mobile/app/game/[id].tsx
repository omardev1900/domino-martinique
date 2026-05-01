import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import GameScreen from '../../src/screens/GameScreen';
import { AdBannerModal } from '../../src/components/AdBannerModal';
import { adService } from '../../src/core/services/ad.service';
import { Ad } from '../../src/core/ad.types';

export default function GameRoute() {
    const params = useLocalSearchParams<{
        id: string;
        userId: string;
        authUid?: string;
        mode?: string;
        difficulty?: string;
        gameMode?: string;
        winningCondition?: string;
        turnDuration?: string;
        startingHandSize?: string;
        tableTier?: string; // 🪙 Table tier pour le calcul du buy-in et des rewards
    }>();

    const [adToShow, setAdToShow] = useState<Ad | null>(null);

    useEffect(() => {
        if (params.mode !== 'solo') {
            adService.getAdForPlacement('BEFORE_MULTI').then(ad => {
                if (ad) setAdToShow(ad);
            });
        }
    }, []);

    return (
        <>
            <GameScreen
                gameId={params.id}
                userId={params.userId}
                authUid={params.authUid}
                mode={params.mode as 'solo' | 'multiplayer' | undefined}
                difficulty={params.difficulty as any}
                gameMode={params.gameMode as any}
                winningCondition={params.winningCondition ? Number(params.winningCondition) : undefined}
                turnDuration={params.turnDuration ? Number(params.turnDuration) : undefined}
                startingHandSize={params.startingHandSize ? Number(params.startingHandSize) : undefined}
                tableTier={params.tableTier}
            />
            <AdBannerModal ad={adToShow} onClose={() => setAdToShow(null)} />
        </>
    );
}
