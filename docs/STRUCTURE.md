# 📐 STRUCTURE — Comment ce dossier `docs/` est organisé

> Ce fichier explique la logique de la doc. À lire **une seule fois** pour comprendre.
> Pour piloter au quotidien : aller directement dans `pilotage/`.

---

## 🎯 Principe

**Chaque fichier répond à UNE question de chef de projet.**
Si un fichier en couvre plusieurs, on le scinde. Si une question n'a pas de fichier, on en crée un.

Les 5 questions quotidiennes :

| Question | Fichier |
|---|---|
| Qu'est-ce qu'on livre cette semaine ? | `pilotage/TASKS.md` |
| Qu'est-ce qu'on fera plus tard ? | `pilotage/BACKLOG.md` |
| Qu'est-ce qu'on a déjà livré ? | `pilotage/DONE.md` + `feedback/CHANGELOG.md` |
| Qu'a dit le client, mot pour mot ? | `feedback/CLIENT.md` |
| On va où à long terme ? | `ROADMAP.md` |

---

## 📁 Arborescence

```
docs/
├── STRUCTURE.md               ← CE FICHIER — explication de l'organisation
├── ROADMAP.md                 ← Vision long terme (phases, blocs)
│
├── pilotage/                  ← 🔴 Ça bouge tous les jours
│   ├── TASKS.md               ← Actif maintenant (sprint en cours)
│   ├── BACKLOG.md             ← À faire plus tard
│   └── DONE.md                ← Archive chronologique
│
├── specs/                     ← 🟢 Stable — référence technique
│   ├── ARCHITECTURE.md        ← Stack, flux, conventions code
│   ├── METIER.md              ← Règles du domaine / business logic
│   └── features/              ← 1 fichier par feature complexe
│
└── feedback/                  ← 🟡 Histoire du produit (append-only)
    ├── CLIENT.md              ← Retours bruts client (jamais modifié, daté)
    └── CHANGELOG.md           ← Versions livrées (user-facing)
```

**À la racine du projet** (hors `docs/`) :
- `README.md` — brief du projet (< 100 lignes) : stack, équipe, état actuel
- `CLAUDE.md` — règles IA + workflow + prompts types (lu automatiquement par Claude Code)

---

## 🔄 Workflow des tâches (Kanban 3 états)

```
BACKLOG.md  →  TASKS.md  →  DONE.md
 (à faire)     (en cours)    (archive)
```

### Règles de transition

1. **Nouvelle demande** (client, bug, idée) → ajoutée à `BACKLOG.md`
2. **Décision de traiter** → déplacée de `BACKLOG.md` vers `TASKS.md`
3. **Tâche terminée** → déplacée de `TASKS.md` vers `DONE.md` avec la date

### Cas particuliers

- **Retour client brut** → toujours capturé d'abord dans `feedback/CLIENT.md` (verbatim, daté). Puis reformulé côté plan dans `BACKLOG.md`.
- **Version livrée au user** → entrée dans `feedback/CHANGELOG.md` (format semver).
- **Bug découvert en cours de dev** → ajouté directement à `TASKS.md` si traité immédiatement, sinon `BACKLOG.md`.

### Discipline de clôture

Une tâche n'est pas considérée comme terminée tant que les fichiers de suivi ne sont pas synchronisés.

Checklist minimale :
- retirer le ticket de `TASKS.md`
- archiver le ticket dans `DONE.md` sous la date du jour
- ajouter `feedback/CHANGELOG.md` si le changement est visible côté utilisateur
- ne laisser aucun ticket ou sous-ticket `Fait` dans `TASKS.md`

---

## 💰 Économie de tokens — lecture à la demande

Claude charge automatiquement `CLAUDE.md` + `README.md` à chaque session (environ 300 lignes max).

Le reste est lu **seulement si nécessaire** :

| Session type | Fichiers chargés |
|---|---|
| *"Démarre la tâche X"* | `pilotage/TASKS.md` + éventuellement `specs/features/X.md` |
| *"Ajoute au backlog : …"* | `pilotage/BACKLOG.md` seulement |
| *"Où en est-on ?"* | `pilotage/TASKS.md` + `pilotage/DONE.md` (fin) |
| *"Nouveau retour client"* | `feedback/CLIENT.md` + `pilotage/BACKLOG.md` |
| *"Explique l'architecture"* | `specs/ARCHITECTURE.md` |

**Règle d'or** : `CLAUDE.md` doit rester ≤ 150 lignes. Tout le reste va dans des fichiers dédiés, chargés à la demande.

---

## ✍️ 5 commandes verbales standards

Documentées dans `CLAUDE.md`. Elles couvrent 90% du cycle de vie d'une tâche.

| Commande | Effet |
|---|---|
| `Ajoute au backlog : <description>` | 1 ligne dans `BACKLOG.md` |
| `Démarre <ID>` | Déplace `BACKLOG.md` → `TASKS.md`, lit la spec si existe, propose un plan |
| `Livre <ID>` | Coche dans `TASKS.md`, déplace vers `DONE.md` avec date, met à jour `CHANGELOG.md` si user-facing |
| `Où en est-on ?` | Résumé en 3 lignes : actif / livré cette semaine / prochaine priorité |
| `Nouveau retour client : "<citation>"` | Ajoute verbatim à `feedback/CLIENT.md` + entrée liée dans `BACKLOG.md` |

---

## 🆕 Démarrer un nouveau projet en 5 minutes

Cloner ce template, puis :

1. Renseigner `README.md` (stack, équipe, objectif)
2. Lister les premières tâches dans `pilotage/TASKS.md`
3. Créer `specs/ARCHITECTURE.md` dès que le premier composant est en place
4. Laisser les autres fichiers vides — ils se rempliront au fil du temps

**YAGNI appliqué à la doc** : ne pas pré-remplir ce qui n'existe pas encore.

---

## 🚫 Anti-patterns à éviter

- Mettre 3000 lignes dans `CLAUDE.md` → Claude brûle des tokens à chaque session
- Créer 15 fichiers markdown redondants (CONTEXT, OVERVIEW, ABOUT, README, INTRO…) → un seul `README.md` suffit
- Laisser des tâches ou sous-tâches `Fait` dans `TASKS.md` → les retirer et les archiver dans `DONE.md`
- Modifier le contenu d'un feedback client dans `feedback/CLIENT.md` → ce fichier est sacré, append-only
- Créer un fichier par sprint (`sprint-1.md`, `sprint-2.md`…) → `TASKS.md` unique + archive dans `DONE.md` suffit
