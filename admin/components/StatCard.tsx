'use client';

import React from 'react';

type StatCardProps = {
  title: string;
  value: number | string;
  icon: string;
  accent?: boolean;
  loading?: boolean;
};

export default function StatCard({ title, value, icon, accent = false, loading = false }: StatCardProps) {
  return (
    <div
      className={`bg-gray-900 border rounded-xl p-6 flex items-center gap-5 shadow-lg transition-all ${
        accent ? 'border-yellow-400' : 'border-gray-800'
      }`}
    >
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
          accent ? 'bg-yellow-400/10 text-yellow-400' : 'bg-gray-800 text-gray-300'
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-gray-400 text-sm font-medium truncate">{title}</p>
        {loading ? (
          <div className="h-7 w-20 bg-gray-800 rounded animate-pulse mt-1" />
        ) : (
          <p
            className={`text-2xl font-bold mt-0.5 ${accent ? 'text-yellow-400' : 'text-white'}`}
          >
            {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
          </p>
        )}
      </div>
    </div>
  );
}
