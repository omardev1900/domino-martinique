'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PlayerRow, { PlayerProfile } from '@/components/PlayerRow';
import PlayerModal from '@/components/PlayerModal';

const PAGE_SIZE = 20;

type SortKey = 'displayName' | 'email' | 'level' | 'coins' | 'isBanned';
type SortDir = 'asc' | 'desc';

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 text-gray-700">↕</span>;
  return <span className="ml-1 text-yellow-400">{dir === 'asc' ? '↑' : '↓'}</span>;
}

function SortableTh({
  label, sortKey, current, dir, onSort, className = '',
}: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir;
  onSort: (k: SortKey) => void; className?: string;
}) {
  const active = current === sortKey;
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-yellow-400 ${active ? 'text-yellow-400' : 'text-gray-500'} ${className}`}
      onClick={() => onSort(sortKey)}
    >
      {label}<SortIcon active={active} dir={dir} />
    </th>
  );
}

export default function PlayersPage() {
  const [allPlayers, setAllPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('displayName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<{ migrated: number; skipped: number } | null>(null);

  const handleMigrateCochons = async () => {
    if (!confirm('Migrer economy.cochonsGiven depuis stats.totalCochonsInflicted pour tous les joueurs ?')) return;
    setMigrating(true);
    setMigrateResult(null);
    try {
      const res = await fetch('/api/migrate-cochons', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMigrateResult({ migrated: data.migrated, skipped: data.skipped });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert('Erreur migration : ' + err.message);
    } finally {
      setMigrating(false);
    }
  };

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAllPlayers(data.users as PlayerProfile[]);
    } catch (err) {
      console.error('Erreur chargement joueurs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers, refreshKey]);
  useEffect(() => { setPage(1); }, [search, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const getValue = (p: PlayerProfile, key: SortKey): string | number => {
    switch (key) {
      case 'displayName': return (p.displayName || '').toLowerCase();
      case 'email': return (p.email || '').toLowerCase();
      case 'level': return p.stats?.level ?? 0;
      case 'coins': return p.economy?.coins ?? p.stats?.coins ?? 0;
      case 'isBanned': return p.isBanned ? 1 : 0;
    }
  };

  const filtered = allPlayers
    .filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (p.displayName || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const av = getValue(a, sortKey);
      const bv = getValue(b, sortKey);
      const cmp = typeof av === 'number' ? av - (bv as number) : (av as string).localeCompare(bv as string);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
    {selectedPlayer && (
      <PlayerModal
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        onUpdated={() => { setRefreshKey((k) => k + 1); setSelectedPlayer(null); }}
      />
    )}
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Joueurs</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {loading ? 'Chargement…' : `${allPlayers.length.toLocaleString('fr-FR')} joueurs inscrits`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {migrateResult && (
            <span className="text-xs text-green-400">
              ✅ {migrateResult.migrated} migrés, {migrateResult.skipped} déjà OK
            </span>
          )}
          <button
            onClick={handleMigrateCochons}
            disabled={migrating || loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-900 hover:bg-orange-800 border border-orange-700 rounded-xl text-sm font-medium text-orange-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Synchronise economy.cochonsGiven depuis stats.totalCochonsInflicted pour tous les joueurs"
          >
            <span className={migrating ? 'animate-spin inline-block' : ''}>🐷</span>
            {migrating ? 'Migration…' : 'Migrer cochons'}
          </button>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm font-medium text-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={loading ? 'animate-spin inline-block' : ''}>↻</span>
            Actualiser
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email…"
            className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl pl-10 pr-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-lg leading-none">×</button>
          )}
        </div>
        {search && (
          <p className="text-gray-500 text-xs mt-2 ml-1">
            {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} pour &quot;{search}&quot;
          </p>
        )}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center gap-4">
            <div className="w-9 h-9 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Chargement des joueurs…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-gray-400 font-medium">{search ? 'Aucun joueur trouvé' : 'Aucun joueur inscrit'}</p>
            <p className="text-gray-600 text-sm mt-1">{search ? 'Essayez un autre terme de recherche' : 'Les joueurs apparaîtront ici après leur inscription'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-4 py-3 w-12" />
                    <SortableTh label="Nom" sortKey="displayName" current={sortKey} dir={sortDir} onSort={handleSort} className="text-left" />
                    <SortableTh label="Email" sortKey="email" current={sortKey} dir={sortDir} onSort={handleSort} className="text-left" />
                    <SortableTh label="Niveau" sortKey="level" current={sortKey} dir={sortDir} onSort={handleSort} className="text-center" />
                    <SortableTh label="Coins" sortKey="coins" current={sortKey} dir={sortDir} onSort={handleSort} className="text-center" />
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Victoires / Parties</th>
                    <SortableTh label="Statut" sortKey="isBanned" current={sortKey} dir={sortDir} onSort={handleSort} className="text-center" />
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((player) => (
                    <PlayerRow key={player.uid} player={player} onUpdated={() => setRefreshKey((k) => k + 1)} onSelect={setSelectedPlayer} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
                <p className="text-gray-500 text-sm">
                  Page {page} sur {totalPages} — <span className="text-gray-400">{filtered.length.toLocaleString('fr-FR')} joueur{filtered.length !== 1 ? 's' : ''}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed">← Précédent</button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (page <= 3) pageNum = i + 1;
                      else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = page - 2 + i;
                      return (
                        <button key={pageNum} onClick={() => setPage(pageNum)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${page === pageNum ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'}`}>{pageNum}</button>
                      );
                    })}
                  </div>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed">Suivant →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}
