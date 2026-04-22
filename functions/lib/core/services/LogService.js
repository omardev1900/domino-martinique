"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogService = void 0;
/**
 * LogService — stub pour le contexte Cloud Functions.
 * RewardEngine.ts importe ce module ; dans la Cloud Function on redirige vers console.*.
 * Ce fichier n'est PAS copié depuis mobile/src/core — il est propre au backend.
 */
exports.LogService = {
    debug: (tag, message, ...args) => console.log(`[${tag}] ${message}`, ...args),
    info: (tag, message, ...args) => console.log(`[${tag}] ${message}`, ...args),
    warn: (tag, message, ...args) => console.warn(`[${tag}] ${message}`, ...args),
    error: (tag, message, ...args) => console.error(`[${tag}] ${message}`, ...args),
};
//# sourceMappingURL=LogService.js.map