import { useLocalSearchParams } from 'expo-router';
import GameScreen from '../../src/screens/GameScreen';

export default function GameRoute() {
    const { id, userId } = useLocalSearchParams<{ id: string; userId: string }>();

    // We pass the game ID and userId to the screen. 
    return <GameScreen gameId={id} userId={userId} />;
}
