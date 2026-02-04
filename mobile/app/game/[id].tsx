import { useLocalSearchParams } from 'expo-router';
import GameScreen from '../../src/screens/GameScreen';

export default function GameRoute() {
    const params = useLocalSearchParams<{
        id: string;
        userId: string;
        mode?: string;
        difficulty?: string;
    }>();

    return (
        <GameScreen
            gameId={params.id}
            userId={params.userId}
            mode={params.mode as 'solo' | 'multiplayer' | undefined}
            difficulty={params.difficulty as 'beginner' | 'intermediate' | undefined}
        />
    );
}
