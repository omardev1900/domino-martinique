# 🎯 Domino Martiniquais — Instructions Codex

> Fichier chargé automatiquement à chaque session. Max 150 lignes.
> Détails complets dans `docs/`.

---

## 📚 Fichiers de référence

- **Brief projet** → @README.md
- **Structure de la doc** → @docs/STRUCTURE.md *(à lire une fois, pour comprendre l'organisation)*
- **Tâches actives** → @docs/pilotage/TASKS.md
- **Backlog** → @docs/pilotage/BACKLOG.md
- **Archive** → @docs/pilotage/DONE.md
- **Retours client** → @docs/feedback/CLIENT.md
- **Changelog** → @docs/feedback/CHANGELOG.md
- **Architecture** → @docs/specs/ARCHITECTURE.md
- **Règles du jeu** → @docs/specs/GAME_RULES.md
- **Roadmap** → @docs/ROADMAP.md

---

## 🔄 Workflow des tâches (OBLIGATOIRE)

```
BACKLOG.md  →  TASKS.md  →  DONE.md
 (à faire)     (en cours)    (archive)
```

- Nouvelle demande → ajoutée à `BACKLOG.md`
- Décision de traiter → déplacée vers `TASKS.md`
- Tâche terminée → déplacée vers `DONE.md` sous la date du jour (`### AAAA-MM-JJ`)

Les retours client bruts vont **d'abord** dans `feedback/CLIENT.md` (verbatim, daté), puis reformulés dans `BACKLOG.md`.

---

## ✍️ 5 Commandes verbales standards

| Commande | Action |
|---|---|
| `Ajoute au backlog : <description>` | 1 ligne ajoutée dans `BACKLOG.md` sous la bonne section |
| `Démarre <ID>` | Déplace l'entrée `BACKLOG.md` → `TASKS.md`, lit la spec si existe, propose un plan avant de coder |
| `Livre <ID>` | Coche dans `TASKS.md`, déplace vers `DONE.md` sous la date du jour, ajoute au `CHANGELOG.md` si user-facing |
| `Où en est-on ?` | Résumé en 3 lignes : actif / livré cette semaine / prochaine priorité |
| `Nouveau retour client : "<citation>"` | Append verbatim à `feedback/CLIENT.md` + entrée liée dans `BACKLOG.md` |

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
- Ne pas restructurer les fichiers critiques sans discussion *(voir liste dans `docs/specs/ARCHITECTURE.md`)*

---

## 🚫 Ne jamais faire

- Pas de `any` TypeScript sans justification
- Pas de mutation d'état hors `useActionDispatcher`
- Pas de clés secrètes dans le code — toujours dans `.env`
- Ne pas réintroduire le mode invité (supprimé définitivement)
- Ne pas réimplémenter : système d'amis, graphismes 3D, chat texte libre, cash-prize tournois

---

## 🛠️ Conventions de code

- TypeScript strict + validation inputs via Zod
- Tests obligatoires pour toute logique dans `LogicEngine`
- `structuredClone` — jamais `JSON.parse(JSON.stringify())`
- Nouveaux composants : reproduire le pattern de `src/features/auth/`
- Nouvelles features : suivre le pattern des Custom Hooks (`useGameEngine`, etc.)

---

## 📝 Pour Codex

**En début de session :**
1. Consulter `docs/pilotage/TASKS.md` pour voir les tâches actives
2. Si vide → proposer à l'utilisateur de piocher dans `docs/pilotage/BACKLOG.md`

**En fin de tâche :**
1. Cocher la case dans `TASKS.md`
2. Déplacer l'entrée vers `DONE.md` sous la date du jour
3. Si visible côté user → ajouter au `CHANGELOG.md`

**Jamais modifier** un feedback client archivé dans `docs/feedback/CLIENT.md`.
