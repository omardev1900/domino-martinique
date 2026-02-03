
import React from 'react';

const ArchCard: React.FC<{ title: string; items: string[]; color: string; icon: string }> = ({ title, items, color, icon }) => (
  <div className="bg-stone-800/50 border border-stone-700 rounded-xl p-6 hover:border-amber-500/50 transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-12 h-1 rounded-full ${color}`}></div>
      <span className="text-2xl">{icon}</span>
    </div>
    <h3 className="text-lg font-bold text-stone-100 mb-4 group-hover:text-amber-500 transition-colors">{title}</h3>
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="text-stone-400 text-sm flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-stone-600 rounded-full"></span>
          {item}
        </li>
      ))}
    </ul>
  </div>
);

export const ArchitectureView: React.FC = () => {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div className="bg-amber-600/10 border border-amber-600/20 p-4 rounded-lg flex items-center gap-4">
        <span className="text-2xl">🚀</span>
        <p className="text-amber-200 text-sm">
          <strong>Stack Validée :</strong> Capacitor + React (Frontend) | Supabase (Backend/Realtime) | Framer Motion (Animations).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ArchCard 
          title="Frontend (Capacitor)"
          icon="📱"
          color="bg-blue-500"
          items={[
            "React 19 + TypeScript",
            "Tailwind CSS (Theming Premium)",
            "Framer Motion (Physique dominos)",
            "Capacitor Haptics (Vibrations)",
            "Optimisé pour iOS/Android"
          ]}
        />
        <ArchCard 
          title="Backend (Supabase)"
          icon="⚡"
          color="bg-emerald-500"
          items={[
            "PostgreSQL (Stockage persistant)",
            "Realtime Broadcast (Synchro tours)",
            "Edge Functions (Logique de jeu)",
            "Auth (Social Login)",
            "Storage (Assets/Avatars)"
          ]}
        />
        <ArchCard 
          title="Moteur de Jeu (JS Core)"
          icon="🎲"
          color="bg-amber-500"
          items={[
            "Algorithme de Fisher-Yates (Mélange)",
            "Validation Extremity (Left/Right)",
            "Calculateur de points (Boudé)",
            "Gestion du score 'Cochon'",
            "IA basique (fallback bots)"
          ]}
        />
      </div>

      <div className="mt-12 bg-stone-800 border border-stone-700 rounded-xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl grayscale">🌴</div>
        <h2 className="text-2xl font-premium text-stone-100 mb-6 flex items-center gap-3">
          Pipeline de Développement
        </h2>
        <div className="relative flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-stone-700 hidden md:block"></div>
          {[
            { phase: 1, title: 'Architecture & Stack', status: 'Validé', active: false, done: true },
            { phase: 2, title: 'Logique & Game Engine', status: 'Validé', active: false, done: true },
            { phase: 3, title: 'UI/UX 2D Premium', status: 'En cours', active: true, done: false },
            { phase: 4, title: 'Supabase Sync', status: 'En attente', active: false, done: false },
            { phase: 5, title: 'Beta & Polishing', status: 'En attente', active: false, done: false }
          ].map((p) => (
            <div key={p.phase} className="relative z-10 flex flex-col items-center text-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all ${
                p.done ? 'bg-green-600 border-stone-800 text-white' :
                p.active ? 'bg-amber-600 border-stone-800 text-white scale-110 shadow-[0_0_15px_rgba(217,119,6,0.5)]' : 
                'bg-stone-700 border-stone-800 text-stone-500'
              }`}>
                {p.done ? '✓' : p.phase}
              </div>
              <h4 className={`mt-4 font-bold ${p.active ? 'text-amber-500' : p.done ? 'text-green-500' : 'text-stone-500'}`}>{p.title}</h4>
              <p className="text-[10px] text-stone-600 uppercase tracking-widest mt-1 font-bold">{p.status}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
