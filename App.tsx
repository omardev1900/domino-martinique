
import React, { useState } from 'react';
import { ArchitectureView } from './components/ArchitectureView';
import { LogicSimulator } from './components/LogicSimulator';
import { RulesPanel } from './components/RulesPanel';
import { DesignMockup } from './components/DesignMockup';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'logic' | 'design' | 'rules'>('architecture');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Premium */}
      <header className="bg-stone-950 border-b border-stone-800 p-6 shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-premium text-amber-500 tracking-wider uppercase">
              Domino Martinique <span className="text-stone-500 font-sans text-lg font-normal">V1</span>
            </h1>
            <p className="text-stone-400 text-sm mt-1">
              Lead Architect Workspace • <span className="text-green-500 font-semibold italic">Phase 3: Design UI/UX</span>
            </p>
          </div>
          
          <nav className="flex bg-stone-900 rounded-lg p-1 border border-stone-800">
            {[
              { id: 'architecture', label: 'Architecture' },
              { id: 'logic', label: 'Logique' },
              { id: 'design', label: 'Design UI' },
              { id: 'rules', label: 'Règles' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-md transition-all text-sm font-semibold ${
                  activeTab === tab.id 
                    ? 'bg-amber-600 text-white shadow-lg' 
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-8">
        {activeTab === 'architecture' && <ArchitectureView />}
        {activeTab === 'logic' && <LogicSimulator />}
        {activeTab === 'design' && <DesignMockup />}
        {activeTab === 'rules' && <RulesPanel />}
      </main>

      {/* Footer */}
      <footer className="bg-stone-950 border-t border-stone-800 p-8 text-center text-stone-600 text-sm">
        <p>© 2024 Domino Martinique Dev Team • Approche Itérative : Phase 3 Design</p>
      </footer>
    </div>
  );
};

export default App;
