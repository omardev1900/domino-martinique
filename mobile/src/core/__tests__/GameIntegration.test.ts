import { dealGame, handleTurn, passTurn, checkValidMove, determineFirstPlayer } from '../LogicEngine';
import { getBotMove } from '../BotEngine';
import { GameState, PlayerId, GamePhase } from '../types';
import { WINS_TO_WIN_MATCH, MAX_PLAYERS } from '../constants';

const MAX_TURNS = 200; // Fail-safe to prevent infinite loops

describe('GameIntegration - Full Game Simulation', () => {
    let state: GameState;

    const playFullRound = () => {
        let turns = 0;

        // 1. Determine who starts
        if (state.firstPlayerOfRound) {
            state.currentPlayerId = state.firstPlayerOfRound;
        } else {
            state.currentPlayerId = determineFirstPlayer(state.players);
        }

        while (state.phase === 'PLAYING' && turns < MAX_TURNS) {
            turns++;
            const currentPlayer = state.players.find(p => p.id === state.currentPlayerId)!;

            // AI Logic
            const move = getBotMove(
                currentPlayer.hand,
                state.table.leftValue,
                state.table.rightValue
            );

            if (move) {
                // Play
                state = handleTurn(state, currentPlayer.id, move);
            } else {
                // Pass (using the LogicEngine passTurn directly)
                // We must catch errors because passTurn throws if player can actually play
                // But getBotMove should align with checkValidMove.
                // However, let's verify if passTurn works here.
                try {
                    state = passTurn(state, currentPlayer.id);
                } catch (e: any) {
                    // This shouldn't happen if getBotMove is correct, 
                    // unless getBotMove missed a valid move.
                    throw new Error(`Bot ${currentPlayer.id} tried to pass but had valid moves! Error: ${e.message}`);
                }
            }
        }

        if (turns >= MAX_TURNS) {
            throw new Error("Game loop exceeded max turns - infinite loop detected?");
        }
    };

    it('should simulate a full match between 3 bots without crashing', () => {
        // Init
        const partial = dealGame(['Bot1', 'Bot2', 'Bot3']);
        state = {
            gameId: 'integration-test',
            players: partial.players as any,
            talonMort: partial.talonMort as any,
            table: partial.table!,
            currentPlayerId: partial.players![0].id,
            phase: 'PLAYING',
            firstPlayerOfRound: null,
            history: [],
            winningCondition: WINS_TO_WIN_MATCH,
            lastActionTimestamp: Date.now()
        };

        // Mark all as bots (optional, mostly for our generic logic if we used it)
        state.players.forEach(p => p.isBot = true);

        // Loop until Match End
        let rounds = 0;
        const MAX_ROUNDS = 20; // Should finish before 20 rounds if win cond is 3

        while (state.phase !== 'MATCH_END' && rounds < MAX_ROUNDS) {
            rounds++;

            // Verify we are starting a round or continuing?
            // If previous phase was ROUND_END, we need to re-deal
            if (state.phase === 'ROUND_END' || state.phase === 'BOUDE') {
                // Simulate re-deal logic (LogicEngine doesn't have a specific "nextRound" function that keeps scores, 
                // usually handled by server/GameScreen state management. We mimic it here.)
                const winners = state.players.map(p => ({ id: p.id, wins: p.wins }));
                const nextStartPlayer = state.firstPlayerOfRound; // LogicEngine sets this for next round

                const newDeal = dealGame(['Bot1', 'Bot2', 'Bot3']);

                // Restore state with new deal but keep wins
                state = {
                    ...state,
                    players: newDeal.players as any,
                    talonMort: newDeal.talonMort as any,
                    table: newDeal.table!,
                    phase: 'PLAYING',
                    history: []
                };

                // Restore wins and names
                state.players.forEach((p, i) => {
                    // Assert mapping by index for simplicity in this test
                    p.wins = winners[i].wins;
                    p.id = winners[i].id; // Ensure IDs persist
                });

                state.firstPlayerOfRound = nextStartPlayer;
            }

            playFullRound();

            // Assert round ended correctly
            expect(['ROUND_END', 'MATCH_END', 'BOUDE']).toContain(state.phase);
        }

        console.log(`Match finished in ${rounds} rounds.`);
        const winner = state.players.find(p => p.wins >= WINS_TO_WIN_MATCH);

        // Assertions
        expect(state.phase).toBe('MATCH_END');
        expect(winner).toBeDefined();
        // Check no pig (isCochon) logic if needed, but basic check passes.
    });
});
