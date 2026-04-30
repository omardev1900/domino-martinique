/**
 * leaderboard.service.ts
 *
 * Service Firebase pour récupérer les classements des joueurs.
 * Gère la récupération du "Top XP" (Mapipi/Gran-Moun) et "Top Coins" (Richesse).
 *
 * v2 — Utilise onSnapshot() pour des mises à jour en temps réel.
 *       Expose getPlayerRank() pour afficher la position d'un joueur hors Top 50.
 */

import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    where,
    getCountFromServer,
    Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { LeagueGrade } from '../economy.types';

export interface LeaderboardEntry {
    uid: string;
    displayName: string;
    avatarId: string;
    activeFrame?: string;
    xp: number;
    coins: number;
    level: number;
    leagueGrade: LeagueGrade;
    leaguePoints: number;
    /** Cochons réellement infligés (source de vérité pour le grade) */
    cochonsGiven: number;
    /** Cochons infligés depuis le 1er du mois en cours (calculé depuis matchHistory) */
    cochonsGivenThisMonth: number;
    rank: number;
}

export type LeaderboardCategory = 'XP' | 'COINS' | 'COCHONS';

/** Champ Firestore correspondant à chaque catégorie */
const CATEGORY_FIELD: Record<LeaderboardCategory, string> = {
    XP: 'economy.xp',
    COINS: 'economy.coins',
    COCHONS: 'economy.cochonsGiven',
};

class LeaderboardService {

    /**
     * S'abonne en temps réel au classement de la catégorie donnée.
     * Appelle `callback` à chaque mise à jour de Firestore.
     * Retourne une fonction `unsubscribe` à appeler lors du démontage.
     *
     * @param category   - 'XP' | 'COINS' | 'COCHONS'
     * @param limitCount - Nombre de joueurs à récupérer (défaut: 50)
     * @param callback   - Fonction appelée avec les entrées mises à jour
     */
    subscribeLeaderboard(
        category: LeaderboardCategory,
        limitCount: number = 50,
        callback: (entries: LeaderboardEntry[]) => void
    ): Unsubscribe {
        const field = CATEGORY_FIELD[category];
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy(field, 'desc'), limit(limitCount));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const leaderboard: LeaderboardEntry[] = [];
            let currentRank = 1;

            // Début du mois en cours (timestamp)
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

            snapshot.forEach((doc) => {
                const data = doc.data();
                const economy = data.economy || {};
                const stats = data.stats || {};

                // Ne garder que les joueurs ayant de l'XP ou des Coins (éviter les faux profils)
                if (economy.xp !== undefined && economy.coins !== undefined) {
                    // Priorité à stats.totalCochonsInflicted (jamais désynchronisé) avec fallback economy.cochonsGiven
                    const cochonsGiven = stats.totalCochonsInflicted || economy.cochonsGiven || 0;

                    // Cochons donnés ce mois — somme des m.cochons depuis le 1er du mois
                    const matchHistory: Array<{ timestamp?: number; cochons?: number }> = stats.matchHistory || [];
                    const cochonsGivenThisMonth = matchHistory
                        .filter(m => (m.timestamp ?? 0) >= startOfMonth)
                        .reduce((sum, m) => sum + (m.cochons ?? 0), 0);

                    leaderboard.push({
                        uid: doc.id,
                        displayName: data.displayName || data.email?.split('@')[0] || 'Joueur',
                        avatarId: data.avatarId || data.avatarUrl || 'avatar_default',
                        activeFrame: economy.activeFrame || null,
                        xp: economy.xp || 0,
                        coins: economy.coins || 0,
                        level: economy.level || 1,
                        leagueGrade: economy.leagueGrade || null,
                        leaguePoints: economy.leaguePoints || 0,
                        cochonsGiven,
                        cochonsGivenThisMonth,
                        rank: currentRank++,
                    });
                }
            });

            callback(leaderboard);
        }, (error) => {
            console.error('[LeaderboardService] onSnapshot error:', error);
            callback([]);
        });

        return unsubscribe;
    }

    /**
     * Retourne le rang approximatif d'un joueur pour une catégorie donnée.
     * Compte le nombre de joueurs ayant un score strictement supérieur au sien,
     * puis ajoute 1 pour obtenir sa position.
     *
     * Retourne `null` si le joueur n'a pas de données Firebase (invité).
     */
    async getPlayerRank(
        uid: string,
        category: LeaderboardCategory,
        playerScore: number
    ): Promise<number | null> {
        if (uid.startsWith('guest_')) return null;

        try {
            const field = CATEGORY_FIELD[category];
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where(field, '>', playerScore));
            const snapshot = await getCountFromServer(q);
            return snapshot.data().count + 1;
        } catch (error) {
            console.error('[LeaderboardService] getPlayerRank error:', error);
            return null;
        }
    }
}

export const leaderboardService = new LeaderboardService();
