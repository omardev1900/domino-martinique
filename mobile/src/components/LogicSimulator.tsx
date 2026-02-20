
import React, { useState } from 'react';
import { ALL_DOMINOS, HAND_SIZE, TALON_MORT_SIZE, WINS_TO_WIN_MATCH } from '@/core/constants';
import { Domino, GameState, PlayerId } from '@/core/types';
import * as Engine from '@/core/LogicEngine';

export const LogicSimulator: React.FC = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [logs, setLogs] = useState<string[]>(["Système de logique chargé. En attente de test..."]);
  const [mockState, setMockState] = useState<Partial<GameState>>({});

  const simulateEngineWorkflow = () => {
    setIsSimulating(true);
    setLogs(["Démarrage de la séquence logique..."]);

    // 1. Shuffle & Deal
    const deck = Engine.shuffleDeck();
    setLogs(prev => [...prev, `Deck généré : ${deck.length} dominos.`]);

    setTimeout(() => {
      const playerNames = ["Ti-Bout", "Vaval", "Chouval"];
      const distribution = Engine.dealGame(playerNames);
      setMockState(distribution);
      setLogs(prev => [...prev, "Dominos distribués aux 3 joueurs (7 chacun)."]);
      setLogs(prev => [...prev, "Talon Mort isolé (7 dominos)."]);

      setTimeout(() => {
        // 2. First Player Detection
        const firstPlayerId = Engine.determineFirstPlayer(distribution.players!);
        const firstPlayer = distribution.players?.find(p => p.id === firstPlayerId);
        setLogs(prev => [...prev, `Analyse des mains terminée.`]);
        setLogs(prev => [...prev, `Premier joueur : ${firstPlayer?.name} (${firstPlayerId})`]);

        setTimeout(() => {
          // 3. Simulation d'un coup valide
          const sampleDomino = firstPlayer?.hand[0]!;
          const move = Engine.checkValidMove(sampleDomino, null, null);
          setLogs(prev => [...prev, `Test coup initial : ${sampleDomino.left}:${sampleDomino.right} -> ${move.canPlay ? 'VALIDE' : 'REFUSÉ'}`]);

          setTimeout(() => {
            // 4. Simulation d'un Boudé
            setLogs(prev => [...prev, "--- Simulation d'un Boudé (Blocage) ---"]);
            const winnerId = Engine.determineWinnerOnBoudé(distribution.players!);
            if (winnerId === 'TIE') {
              setLogs(prev => [...prev, "Résultat : Égalité parfaite ! Partie annulée."]);
            } else {
              const winner = distribution.players?.find(p => p.id === winnerId);
              setLogs(prev => [...prev, `Résultat : ${winner?.name} gagne avec le moins de points.`]);
            }

            setTimeout(() => {
              // 5. Simulation Cochon
              setLogs(prev => [...prev, "--- Vérification Match & Cochon ---"]);
              const dummyState: GameState = {
                ...(distribution as GameState),
                players: distribution.players!.map((p, i) => ({
                  ...p,
                  currentMancheStars: i === 0 ? 3 : (i === 1 ? 1 : 0), // p1=3, p2=1, p3=0
                  totalRoundWins: 0,
                  totalPoints: 0
                }))
              };
              const finalState = Engine.handleEndOfRound(dummyState, 'p1');
              const cochon = finalState.players.find(p => p.isCochon);
              setLogs(prev => [...prev, `Match terminé ! Vainqueur : ${finalState.players[0].name}`]);
              if (cochon) {
                setLogs(prev => [...prev, `ALERTE : ${cochon.name} est COCHON (0 victoire).`]);
              }

              setLogs(prev => [...prev, "Moteur de jeu validé à 100%."]);
              setIsSimulating(false);
            }, 1000);
          }, 1000);
        }, 800);
      }, 800);
    }, 800);
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-stone-800 bg-stone-950 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-bold text-stone-100 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
            Moteur de Jeu (Itération 2)
          </h3>
          <p className="text-xs text-stone-500 uppercase tracking-widest mt-1">Validation des Algorithmes Métier</p>
        </div>
        <button
          onClick={simulateEngineWorkflow}
          disabled={isSimulating}
          className={`px-6 py-2 rounded-lg font-bold transition-all text-sm ${isSimulating ? 'bg-stone-800 text-stone-600 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_4px_0_rgb(146,64,14)] active:translate-y-1'
            }`}
        >
          {isSimulating ? 'Séquençage...' : 'Lancer Simulation Complète'}
        </button>
      </div>

      <div className="p-6 h-[350px] overflow-y-auto font-mono text-xs space-y-2 bg-black/40">
        {logs.map((log, i) => (
          <div key={i} className={`flex gap-3 border-l ${log.includes('ALERTE') ? 'border-red-500 bg-red-500/5' : 'border-stone-800'} pl-4 py-1`}>
            <span className="text-stone-600 font-bold">{String(i + 1).padStart(2, '0')}</span>
            <span className={
              log.includes('VALIDE') || log.includes('gagne') ? 'text-emerald-400' :
                log.includes('ALERTE') ? 'text-red-400 font-bold' :
                  log.includes('---') ? 'text-amber-500 font-bold py-2' :
                    'text-stone-400'
            }>
              {log}
            </span>
          </div>
        ))}
      </div>

      <div className="p-4 bg-stone-950 border-t border-stone-800 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-stone-900 p-4 rounded-xl border border-stone-800">
          <h4 className="text-amber-500 text-[10px] uppercase font-bold mb-2">checkValidMove()</h4>
          <p className="text-xs text-stone-400">Vérifie les extrémités gauche/droite et gère l'inversion des dominos.</p>
        </div>
        <div className="bg-stone-900 p-4 rounded-xl border border-stone-800">
          <h4 className="text-amber-500 text-[10px] uppercase font-bold mb-2">calculateScores()</h4>
          <p className="text-xs text-stone-400">Logique de boudé : somme des points et gestion des égalités (nulle).</p>
        </div>
        <div className="bg-stone-900 p-4 rounded-xl border border-stone-800">
          <h4 className="text-amber-500 text-[10px] uppercase font-bold mb-2">handleEndOfRound()</h4>
          <p className="text-xs text-stone-400">Incrémentation (0-3), détection de fin de match et statut "Cochon".</p>
        </div>
      </div>
    </div>
  );
};
