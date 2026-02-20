
import React from 'react';

export const DesignMockup: React.FC = () => {
  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Phone Frame Mockup */}
      <div className="w-full max-w-[360px] mx-auto aspect-[9/19] bg-stone-950 rounded-[3rem] border-[8px] border-stone-800 shadow-2xl relative overflow-hidden flex flex-col">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-stone-800 rounded-b-2xl z-20"></div>

        {/* Game Table (Portrait) */}
        <div className="flex-1 wood-texture relative flex flex-col p-4">
          {/* Adversaires (Haut) */}
          <div className="flex justify-between mt-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full border-2 border-amber-500 bg-stone-700 flex items-center justify-center text-xl shadow-lg">👨🏾‍🦱</div>
              <div className="bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold text-amber-500">Ti-Bout (🀰 5)</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full border-2 border-stone-500 bg-stone-700 flex items-center justify-center text-xl shadow-lg">🧔🏾</div>
              <div className="bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold text-stone-300">Vaval (🀰 7)</div>
            </div>
          </div>

          {/* Serpent Central (Placeholder) */}
          <div className="flex-1 flex flex-col justify-center items-center gap-2">
             <div className="bg-stone-900/40 p-4 rounded-full border border-white/5 text-center">
                <p className="text-[10px] uppercase tracking-tighter text-stone-500 font-bold mb-2">Zone du Serpent</p>
                <div className="flex gap-1 justify-center rotate-12">
                   <div className="w-6 h-10 bg-white rounded border border-stone-400 flex flex-col items-center justify-center text-black font-bold text-xs">6<hr className="w-full border-stone-300"/>6</div>
                   <div className="w-6 h-10 bg-white rounded border border-stone-400 flex flex-col items-center justify-center text-black font-bold text-xs">6<hr className="w-full border-stone-300"/>2</div>
                   <div className="w-6 h-10 bg-white rounded border border-stone-400 flex flex-col items-center justify-center text-black font-bold text-xs">2<hr className="w-full border-stone-300"/>4</div>
                </div>
             </div>
          </div>

          {/* Main du Joueur (Bas) */}
          <div className="mt-auto pb-6">
            <div className="flex justify-center -space-x-3">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div 
                  key={i} 
                  className="w-10 h-16 bg-stone-100 rounded-md border border-stone-400 shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-black font-bold transition-transform hover:-translate-y-4 hover:z-10 cursor-pointer"
                  style={{ transform: `rotate(${(i - 4) * 4}deg)` }}
                >
                  <span className="text-xs">{i}</span>
                  <hr className="w-full border-stone-300 my-0.5"/>
                  <span className="text-xs">{i === 7 ? 0 : i}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-[10px] font-bold text-amber-500 mt-4 uppercase tracking-widest bg-black/40 py-1 rounded-full">À votre tour</p>
          </div>
        </div>
      </div>

      {/* Design Specs / Description */}
      <div className="flex-1 space-y-6">
        <div className="bg-stone-800 border border-stone-700 p-6 rounded-2xl">
          <h3 className="text-xl font-bold text-amber-500 mb-4">Spécifications Visuelles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-stone-100 mb-1">Thème "Bois Tropical"</h4>
                <p className="text-xs text-stone-400 leading-relaxed">Textures de bois de Mahogany et Teak pour le plateau, créant une ambiance authentique.</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-100 mb-1">Dominos 2D Premium</h4>
                <p className="text-xs text-stone-400 leading-relaxed">Aspect ivoire poli, ombres portées dynamiques pour donner de la profondeur sans alourdir le CPU.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-stone-100 mb-1">Feedback Haptique</h4>
                <p className="text-xs text-stone-400 leading-relaxed">Vibrations courtes lors de la pose d'un domino et lors du blocage "Boudé".</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-100 mb-1">Animations (Framer)</h4>
                <p className="text-xs text-stone-400 leading-relaxed">Courbes de Bézier pour les déplacements, transitions de zoom automatiques sur la table.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-950/20 border border-amber-500/30 p-6 rounded-2xl">
          <h3 className="text-xl font-bold text-amber-500 mb-4">Système de Menus</h3>
          <ul className="space-y-3">
            {[
              { step: '01', title: 'Splash Screen', desc: 'Identité visuelle & Chargement Assets' },
              { step: '02', title: 'Main Menu', desc: 'Accès rapide Jeu / Profil / Classement' },
              { step: '03', title: 'Lobby', desc: 'Choix de la table (Mise, Joueurs)' },
              { step: '04', title: 'Game View', desc: 'Table de jeu temps réel (Portrait)' }
            ].map((s) => (
              <li key={s.step} className="flex gap-4">
                <span className="text-amber-500 font-mono font-bold">{s.step}</span>
                <div>
                  <h4 className="text-sm font-bold text-stone-100">{s.title}</h4>
                  <p className="text-[11px] text-stone-500">{s.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
