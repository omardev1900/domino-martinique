'use client';

import React, { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import type { AdminRole } from '@/lib/adminAuth';

type Admin = {
  uid: string;
  email: string;
  role: AdminRole;
  createdAt: number | null;
};

export default function AccessPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('manager');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<AdminRole>('manager');

  const fetchToken = async () => {
    return await auth.currentUser?.getIdToken();
  };

  const fetchAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await fetchToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/admins', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch admins');
      const data = await res.json();
      setAdmins(data.admins);
    } catch (err: any) {
      setError(err.message || 'Error fetching admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingAdmin(true);
    setError(null);

    try {
      const token = await fetchToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newEmail, role: newRole }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add admin');
      }

      setNewEmail('');
      setNewRole('manager');
      setShowAddForm(false);
      fetchAdmins();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleChangeRole = async (uid: string, newRoleVal: AdminRole) => {
    setError(null);
    try {
      const token = await fetchToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`/api/admins/${uid}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRoleVal }),
      });

      if (!res.ok) throw new Error('Failed to update role');
      setEditingUid(null);
      fetchAdmins();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteAdmin = async (uid: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet admin ?')) return;

    setError(null);
    try {
      const token = await fetchToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`/api/admins/${uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete admin');
      }

      fetchAdmins();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const currentUserUid = auth.currentUser?.uid;

  return (
    <div className="p-8 min-h-screen bg-gray-950">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Gestion des admins</h1>
            <p className="text-gray-400">Gérez les accès et les rôles des administrateurs</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 transition-colors"
          >
            + Ajouter un admin
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-600 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Add form */}
        {showAddForm && (
          <div className="mb-8 p-6 bg-gray-900 border border-gray-800 rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-4">Ajouter un nouvel admin</h2>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                  placeholder="admin@example.com"
                  disabled={addingAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rôle
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                  disabled={addingAdmin}
                >
                  <option value="superadmin">Superadmin (accès complet)</option>
                  <option value="manager">Manager (contenu uniquement)</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={addingAdmin}
                  className="px-4 py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors"
                >
                  {addingAdmin ? 'Création en cours…' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-400">Chargement des admins…</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              Aucun admin trouvé
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-800 bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                      Rôle
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                      Créé le
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {admins.map((admin) => {
                    const isSelf = admin.uid === currentUserUid;
                    const isEditing = editingUid === admin.uid;

                    return (
                      <tr key={admin.uid} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-200 font-medium">
                          {admin.email}
                          {isSelf && (
                            <span className="ml-2 text-xs text-yellow-400">(Vous)</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {isEditing ? (
                            <select
                              value={editingRole}
                              onChange={(e) => setEditingRole(e.target.value as AdminRole)}
                              className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-yellow-400"
                            >
                              <option value="superadmin">Superadmin</option>
                              <option value="manager">Manager</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                admin.role === 'superadmin'
                                  ? 'bg-yellow-400/20 text-yellow-300'
                                  : 'bg-blue-400/20 text-blue-300'
                              }`}
                            >
                              {admin.role === 'superadmin' ? 'Superadmin' : 'Manager'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {admin.createdAt
                            ? new Date(admin.createdAt).toLocaleDateString('fr-FR')
                            : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-right space-x-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => {
                                  handleChangeRole(admin.uid, editingRole);
                                }}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                              >
                                Valider
                              </button>
                              <button
                                onClick={() => setEditingUid(null)}
                                className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-xs font-medium"
                              >
                                Annuler
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingUid(admin.uid);
                                  setEditingRole(admin.role);
                                }}
                                className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-xs font-medium"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => handleDeleteAdmin(admin.uid)}
                                disabled={isSelf}
                                className={`px-3 py-1 rounded text-xs font-medium ${
                                  isSelf
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-700'
                                }`}
                                title={isSelf ? 'Vous ne pouvez pas vous supprimer' : ''}
                              >
                                Supprimer
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
