/**
 * LogService - Service de gestion des logs pour le projet Domino Martinique.
 * Il permet d'étouffer les logs de routine en production (SEC-6).
 * 
 * @usage LogService.info('MonTag', 'Message', data);
 */

// Utilisation de __DEV__ (global dans React Native) pour détecter l'environnement.
// En environnement de test (Jest), __DEV__ est généralement défini, sinon on fallback sur true.
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

export const LogService = {
  /**
   * Logs d'information généraux (Visible uniquement en DEV)
   */
  info: (tag: string, message: string, ...args: any[]) => {
    if (isDev) {
      console.log(`[${tag}] ${message}`, ...args);
    }
  },

  /**
   * Logs de debug verbeux (Visible uniquement en DEV)
   */
  debug: (tag: string, message: string, ...args: any[]) => {
    if (isDev) {
      console.log(`🔍 [DEBUG][${tag}] ${message}`, ...args);
    }
  },

  /**
   * Avertissements (Visible uniquement en DEV)
   */
  warn: (tag: string, message: string, ...args: any[]) => {
    if (isDev) {
      console.warn(`⚠️ [WARN][${tag}] ${message}`, ...args);
    }
  },

  /**
   * Erreurs critiques (TOUJOURS visible, même en production)
   */
  error: (tag: string, message: string, ...args: any[]) => {
    console.error(`❌ [ERROR][${tag}] ${message}`, ...args);
  },

  /**
   * Log générique (pour compatibilité avec logger.ts)
   */
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  }
};
