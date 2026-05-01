/**
 * Borne canonique du mois courant en UTC.
 * Tous les clients partagent ainsi la même fenêtre mensuelle,
 * indépendamment du fuseau horaire local du device.
 */
export const getStartOfCurrentMonthUtc = (now: Date = new Date()): number =>
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
