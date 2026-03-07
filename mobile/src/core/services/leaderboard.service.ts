/**
 * leaderboard.service.ts
 *
 * Service Firebase pour récupérer les classements des joueurs.
 * Gère la récupération du "Top XP" (Mapipi/Gran-Moun) et "Top Coins" (Richesse).
 */

import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { LeagueGrade } from '../economy.types';

export interface LeaderboardEntry {
    uid: string;
    displayName: string;
    avatarUrl?: string;
    xp: number;
    coins: number;
    level: number;
    leagueGrade: LeagueGrade;
    leaguePoints: number;
    rank: number;
}

export type LeaderboardCategory = 'XP' | 'COINS' | 'COCHONS';

class LeaderboardService {
    /**
     * Récupère le Top 50 des joueurs classés par XP décroissant.
     * @param limitCount Nombre max de joueurs à récupérer (défaut: 50)
     */
    async getTopPlayersByXP(limitCount: number = 50): Promise<LeaderboardEntry[]> {
        return this.fetchLeaderboard('economy.xp', limitCount);
    }

    /**
     * Récupère le Top 50 des joueurs classés par Coins décroissant.
     * @param limitCount Nombre max de joueurs à récupérer (défaut: 50)
     */
    async getTopPlayersByCoins(limitCount: number = 50): Promise<LeaderboardEntry[]> {
        return this.fetchLeaderboard('economy.coins', limitCount);
    }

    /**
     * Récupère le Top 50 des joueurs classés par Cochons (Points de Ligue) décroissant.
     * @param limitCount Nombre max de joueurs à récupérer (défaut: 50)
     */
    async getTopPlayersByCochons(limitCount: number = 50): Promise<LeaderboardEntry[]> {
        return this.fetchLeaderboard('economy.leaguePoints', limitCount);
    }

    /**
     * Fonction générique pour récupérer un classement basé sur un champ de l'économie.
     */
    private async fetchLeaderboard(orderByField: string, limitCount: number): Promise<LeaderboardEntry[]> {
        try {
            const usersRef = collection(db, 'users');
            // Requête : Trier par le champ spécifié en ordre décroissant, avec une limite
            const q = query(
                usersRef,
                orderBy(orderByField, 'desc'),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(q);
            const leaderboard: LeaderboardEntry[] = [];
            let currentRank = 1;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const economy = data.economy || {};

                // Ne garder que les joueurs qui ont de l'XP ou des Coins (éviter les faux profils)
                if (economy.xp !== undefined && economy.coins !== undefined) {
                    leaderboard.push({
                        uid: doc.id,
                        displayName: data.displayName || 'Joueur Anonyme',
                        avatarUrl: data.avatarUrl || 'avatar_default',
                        xp: economy.xp || 0,
                        coins: economy.coins || 0,
                        level: economy.level || 1,
                        leagueGrade: economy.leagueGrade || 'APPRENTI',
                        leaguePoints: economy.leaguePoints || 0,
                        rank: currentRank++,
                    });
                }
            });

            return leaderboard;
        } catch (error) {
            console.error('[LeaderboardService] Error fetching leaderboard for field ' + orderByField, error);
            return [];
        }
    }
}

export const leaderboardService = new LeaderboardService();
