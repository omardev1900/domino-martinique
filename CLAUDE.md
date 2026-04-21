# 🎯 Domino Martiniquais — Instructions Claude Code

> Fichier chargé automatiquement à chaque session. Détails complets dans `docs/`.

---

## 📚 Contexte projet

**Lire @docs/CONTEXT.md avant toute nouvelle feature ou tâche non triviale.**

Autres docs à référencer selon le besoin :
- Tâches en cours → @docs/TASKS.md
- Retours client → @docs/FEEDBACK_CLIENT.md
- Roadmap → @docs/ROADMAP.md

---

## 🏗️ Règles absolues — Architecture

**Flux obligatoire pour toute action de jeu :**
```
GameScreen → useGameEngine → useActionDispatcher → LogicEngine.ts
```

- Toute nouvelle logique métier → `LogicEngine.ts` (fonctions pures, testables)
- Toute nouvelle logique de scoring → `ScoringEngine.ts`
- Logs uniquement via `LogService` — jamais de `console.*` direct
- Écriture Firestore uniquement dans `try/finally` atomique
- Ne pas restructurer les fichiers critiques sans discussion

---

## 🚫 Ne jamais faire

- Pas de `any` TypeScript sans justification
- Pas de mutation d'état hors `useActionDispatcher`
- Pas de clés secrètes dans le code — toujours dans `.env`
- Ne pas réintroduire le mode invité (supprimé définitivement)
- Ne pas réimplémenter : système d'amis, graphismes 3D, IA probabiliste, chat texte libre, cash-prize tournois

---

## 🛠️ Conventions de code

- TypeScript strict + validation inputs via Zod
- Tests obligatoires pour toute logique dans `LogicEngine`
- `structuredClone` — jamais `JSON.parse(JSON.stringify())`
- Nouveaux composants : reproduire le pattern de `src/features/auth/`
- Nouvelles features : suivre le pattern des Custom Hooks (`useGameEngine`, etc.)
