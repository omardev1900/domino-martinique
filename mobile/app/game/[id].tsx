import { useLocalSearchParams } from 'expo-router';
import GameScreen from '../../src/screens/GameScreen';

export default function GameRoute() {
    const params = useLocalSearchParams<{
        id: string;
        userId: string;
        mode?: string;
        difficulty?: string;
        gameMode?: string;
        winningCondition?: string;
        turnDuration?: string;
        startingHandSize?: string;
        tableTier?: string; // 🪙 Table tier pour le calcul du buy-in et des rewards
    }>();

    return (
        <GameScreen
            gameId={params.id}
            userId={params.userId}
            mode={params.mode as 'solo' | 'multiplayer' | undefined}
            difficulty={params.difficulty as any}
            gameMode={params.gameMode as any}
            winningCondition={params.winningCondition ? Number(params.winningCondition) : undefined}
            turnDuration={params.turnDuration ? Number(params.turnDuration) : undefined}
            startingHandSize={params.startingHandSize ? Number(params.startingHandSize) : undefined}
            tableTier={params.tableTier}
        />
    );
}
