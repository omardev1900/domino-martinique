'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────────────────────

type DayData = { date: string; parties: number };
type Period = '7d' | '30d';

type ModeStats = {
  mode: string;
  count: number;
  pct: number;
  color: string;
};

type WinCondBucket = { label: string; count: number };

// ── Constants ─────────────────────────────────────────────────────────────────

const MODE_COLORS: Record<string, string> = {
  MANCHE:   '#facc15', // yellow
  VICTOIRE: '#34d399', // green
  SCORE:    '#60a5fa', // blue
  COCHON:   '#f87171', // red
};

const MODE_LABELS: Record<string, string> = {
  MANCHE:   '🏁 Manche',
  VICTOIRE: '🏆 Victoire',
  SCORE:    '🔢 Score',
  COCHON:   '🐷 Cochon',
};

const WIN_COND_LABELS: Record<string, (v: number) => string> = {
  MANCHE:   (v) => `${v} manche${v > 1 ? 's' : ''}`,
  VICTOIRE: (v) => `${v} victoire${v > 1 ? 's' : ''}`,
  SCORE:    (v) => `${v} pts`,
  COCHON:   (v) => `${v} cochon${v > 1 ? 's' : ''}`,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function getDateLabel(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function buildDayBuckets(days: number): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    map.set(getDateLabel(d.getTime()), 0);
  }
  return map;
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

const darkTooltip = {
  contentStyle: { backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 },
  labelStyle: { color: '#f9fafb', fontWeight: 600 },
  itemStyle: { color: '#facc15' },
};

// ── Page component ─────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('7d');
  const [dayData, setDayData] = useState<DayData[]>([]);
  const [hourData, setHourData] = useState<{ heure: string; parties: number }[]>([]);
  const [modeStats, setModeStats] = useState<ModeStats[]>([]);
  const [winCondData, setWinCondData] = useState<WinCondBucket[]>([]);
  const [diffData, setDiffData] = useState<{ label: string; count: number }[]>([]);
  const [soloMultiData, setSoloMultiData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRooms, setTotalRooms] = useState(0);
  const [avgPerDay, setAvgPerDay] = useState(0);
  const [peakDay, setPeakDay] = useState<DayData | null>(null);
  const [peakHour, setPeakHour] = useState<number | null>(null);
  const [topMode, setTopMode] = useState<string>('—');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const days = period === '7d' ? 7 : 30;
        const since = new Date();
        since.setDate(since.getDate() - days);
        since.setHours(0, 0, 0, 0);

        const snap = await getDocs(
          query(collection(db, 'rooms'), where('createdAt', '>=', since.getTime()))
        );

        // ── Buckets ──────────────────────────────────────────────────────────
        const dayBuckets = buildDayBuckets(days);
        const hourBuckets = new Map<number, number>();
        for (let h = 0; h < 24; h++) hourBuckets.set(h, 0);

        const modeBuckets: Record<string, number> = { MANCHE: 0, VICTOIRE: 0, SCORE: 0, COCHON: 0 };
        const winCondBuckets = new Map<string, number>();
        const diffBuckets: Record<string, number> = {};
        let soloCount = 0;
        let multiCount = 0;

        snap.docs.forEach((d) => {
          const data = d.data();
          const ts = data.createdAt as number;
          if (!ts) return;

          // Day / hour
          const label = getDateLabel(ts);
          if (dayBuckets.has(label)) dayBuckets.set(label, (dayBuckets.get(label) ?? 0) + 1);
          const hour = new Date(ts).getHours();
          hourBuckets.set(hour, (hourBuckets.get(hour) ?? 0) + 1);

          // Game mode
          const gm: string = (data.gameMode || 'MANCHE').toUpperCase();
          if (gm in modeBuckets) modeBuckets[gm]++;
          else modeBuckets[gm] = (modeBuckets[gm] ?? 0) + 1;

          // Winning condition
          const wc = data.winningCondition;
          if (wc !== undefined && wc !== null) {
            const wcLabel = WIN_COND_LABELS[gm]
              ? `${WIN_COND_LABELS[gm](Number(wc))} (${gm === 'MANCHE' ? 'Manche' : gm === 'VICTOIRE' ? 'Victoire' : gm === 'SCORE' ? 'Score' : 'Cochon'})`
              : `${wc}`;
            winCondBuckets.set(wcLabel, (winCondBuckets.get(wcLabel) ?? 0) + 1);
          }

          // Difficulty
          const diff = data.difficulty || 'N/A';
          diffBuckets[diff] = (diffBuckets[diff] ?? 0) + 1;

          // Solo / Multi
          const roomMode = (data.mode || '').toUpperCase();
          if (roomMode === 'SOLO') soloCount++;
          else multiCount++;
        });

        // ── Derived arrays ────────────────────────────────────────────────────
        const total = snap.size;
        const dayArr: DayData[] = Array.from(dayBuckets.entries()).map(([date, parties]) => ({ date, parties }));
        const hourArr = Array.from(hourBuckets.entries()).map(([h, parties]) => ({
          heure: `${String(h).padStart(2, '0')}h`,
          parties,
        }));

        const modeArr: ModeStats[] = Object.entries(modeBuckets)
          .filter(([, v]) => v > 0)
          .sort(([, a], [, b]) => b - a)
          .map(([mode, count]) => ({
            mode,
            count,
            pct: total > 0 ? Math.round((count / total) * 100) : 0,
            color: MODE_COLORS[mode] ?? '#9ca3af',
          }));

        const winCondArr: WinCondBucket[] = Array.from(winCondBuckets.entries())
          .sort(([, a], [, b]) => b - a)
          .slice(0, 8)
          .map(([label, count]) => ({ label, count }));

        const diffArr = Object.entries(diffBuckets)
          .sort(([, a], [, b]) => b - a)
          .map(([diff, count]) => ({
            label: diff === 'easy' ? 'Facile' : diff === 'medium' ? 'Moyen' : diff === 'hard' ? 'Difficile' : diff,
            count,
          }));

        const smArr = [
          { name: 'Multi', value: multiCount, color: '#facc15' },
          { name: 'Solo', value: soloCount, color: '#6b7280' },
        ].filter((x) => x.value > 0);

        const peak = dayArr.reduce((best, cur) => (cur.parties > best.parties ? cur : best), dayArr[0]);
        const peakH = Array.from(hourBuckets.entries()).reduce(
          (best, [h, v]) => (v > best[1] ? [h, v] : best),
          [0, 0]
        )[0];

        setDayData(dayArr);
        setHourData(hourArr);
        setModeStats(modeArr);
        setWinCondData(winCondArr);
        setDiffData(diffArr);
        setSoloMultiData(smArr);
        setTotalRooms(total);
        setAvgPerDay(Math.round(total / days));
        setPeakDay(peak);
        setPeakHour(peakH);
        setTopMode(modeArr[0] ? (MODE_LABELS[modeArr[0].mode] ?? modeArr[0].mode) : '—');
      } catch (err) {
        console.error('Analytics error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1 text-sm">Analyse des parties, modes de jeu et heures de pointe</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                period === p
                  ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white hover:bg-gray-700'
              }`}
            >
              {p === '7d' ? '7 jours' : '30 jours'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-4 py-24">
          <div className="w-9 h-9 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Analyse en cours…</p>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
            <SummaryCard label={`Parties (${period === '7d' ? '7j' : '30j'})`} value={totalRooms.toLocaleString('fr-FR')} icon="🎲" />
            <SummaryCard label="Moyenne / jour" value={avgPerDay.toLocaleString('fr-FR')} icon="📈" />
            <SummaryCard label="Jour le plus actif" value={peakDay ? `${peakDay.date} (${peakDay.parties})` : '—'} icon="🏆" />
            <SummaryCard label="Heure de pointe" value={peakHour !== null ? `${String(peakHour).padStart(2, '0')}h00` : '—'} icon="⏰" />
            <SummaryCard label="Mode dominant" value={topMode} icon="🥇" />
          </div>

          {/* Row 1 : Parties par jour + Solo/Multi */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Area chart */}
            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-1">Parties par jour</h2>
              <p className="text-gray-500 text-xs mb-6">Salles créées sur les {period === '7d' ? '7' : '30'} derniers jours</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dayData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorParties" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#facc15" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...darkTooltip} formatter={(v: number) => [`${v} partie${v !== 1 ? 's' : ''}`, '']} />
                  <Area type="monotone" dataKey="parties" stroke="#facc15" strokeWidth={2} fill="url(#colorParties)"
                    dot={{ r: 3, fill: '#facc15', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#facc15' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Solo vs Multi donut */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col">
              <h2 className="text-white font-semibold mb-1">Solo vs Multijoueur</h2>
              <p className="text-gray-500 text-xs mb-4">Répartition des parties</p>
              {soloMultiData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">Aucune donnée</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={soloMultiData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                        {soloMultiData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }} formatter={(v: number) => [`${v} partie${v !== 1 ? 's' : ''}`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 space-y-2">
                    {soloMultiData.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                          <span className="text-gray-300">{entry.name}</span>
                        </div>
                        <span className="text-white font-semibold">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Row 2 : Modes de jeu */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Mode bars */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-1">Répartition par mode de jeu</h2>
              <p className="text-gray-500 text-xs mb-5">MANCHE · VICTOIRE · SCORE · COCHON</p>
              {modeStats.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-6">Aucune donnée</p>
              ) : (
                <div className="space-y-4">
                  {modeStats.map((m) => (
                    <div key={m.mode}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-300">{MODE_LABELS[m.mode] ?? m.mode}</span>
                        <span className="text-sm font-bold text-white">
                          {m.count} <span className="text-gray-500 font-normal text-xs">({m.pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${m.pct}%`, backgroundColor: m.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Winning condition horizontal bars */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-1">Conditions de victoire les plus jouées</h2>
              <p className="text-gray-500 text-xs mb-5">Objectif choisi à la création de la partie</p>
              {winCondData.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-6">Aucune donnée</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={winCondData} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="label" width={130} tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip {...darkTooltip} formatter={(v: number) => [`${v} partie${v !== 1 ? 's' : ''}`, '']} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {winCondData.map((entry, i) => {
                        // Color bar by detected mode in label
                        const color = entry.label.includes('Manche') ? '#facc15'
                          : entry.label.includes('Victoire') ? '#34d399'
                          : entry.label.includes('Score') ? '#60a5fa'
                          : entry.label.includes('Cochon') ? '#f87171'
                          : '#9ca3af';
                        return <Cell key={i} fill={color} fillOpacity={0.8} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Row 3 : Heures de pointe + Difficulté */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hours bar */}
            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-1">Heures de pointe</h2>
              <p className="text-gray-500 text-xs mb-6">Distribution des parties par heure de la journée</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={hourData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="heure" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                  <YAxis allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...darkTooltip} formatter={(v: number) => [`${v} partie${v !== 1 ? 's' : ''}`, '']} />
                  <Bar dataKey="parties" fill="#facc15" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Difficulty */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-1">Difficulté IA</h2>
              <p className="text-gray-500 text-xs mb-5">Niveau choisi en mode solo</p>
              {diffData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-600 text-sm py-6">Aucune donnée</div>
              ) : (
                <div className="space-y-3 mt-4">
                  {diffData.map((d, i) => {
                    const colors = ['#34d399', '#facc15', '#f87171', '#9ca3af'];
                    const total = diffData.reduce((s, x) => s + x.count, 0);
                    const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-300">{d.label}</span>
                          <span className="text-sm font-bold text-white">{d.count} <span className="text-gray-500 font-normal text-xs">({pct}%)</span></span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <p className="text-gray-400 text-xs font-medium">{label}</p>
      </div>
      <p className="text-white font-bold text-base leading-tight">{value}</p>
    </div>
  );
}
