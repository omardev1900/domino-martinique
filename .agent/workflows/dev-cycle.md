---
description: Workflow de développement pour le projet Domino Martiniquais — une action à la fois, testée et validée avant commit.
---

# 🔄 Cycle de Développement — Domino Martiniquais

Ce workflow s'applique à TOUTE tâche de ce projet, sans exception.

## Règles fondamentales

- **UNE SEULE action/tâche par itération**. Ne jamais regrouper plusieurs changements fonctionnels.
- **Tester en profondeur** avant de présenter au user.
- **Attendre la validation manuelle** du user avant tout commit.
- **Ne JAMAIS passer à la tâche suivante** sans approbation explicite du user.

## Cycle par tâche

### Étape 1 — Identifier l'action
- Lire `docs/PROJECT_STATUS.md` pour connaître la prochaine tâche priorisée.
- Annoncer au user : quelle tâche, quels fichiers impactés, quel résultat attendu.
- Attendre le feu vert du user avant de coder.

### Étape 2 — Implémenter
- Coder l'action unique.
- Limiter les modifications au strict nécessaire pour cette tâche.
- Ne pas "profiter" pour refactorer d'autres parties du code.

### Étape 3 — Tests profonds automatisés
- Lancer les tests unitaires existants (`npm test` ou équivalent).
- Si la tâche concerne la logique de jeu : lancer le stress test (`verify_stress_test.ts`).
- Si la tâche concerne l'UI : vérifier la compilation (`npx expo start` ou build).
- Documenter les résultats des tests dans le rapport au user.

### Étape 4 — Rapport au user + attente validation manuelle
- Présenter au user :
  - Ce qui a été fait (résumé concis).
  - Résultats des tests automatisés.
  - Instructions pour les tests manuels/visuels (quoi vérifier sur le téléphone).
- **STOP** — Attendre la confirmation explicite du user.
- Si le user signale un bug → retour à l'étape 2. Ne PAS avancer.

### Étape 5 — Commit
// turbo
- Après approbation du user uniquement.
- Message de commit clair : `feat(phase-X.Y): description courte de la tâche`
- Commande : `git add -A && git commit -m "feat(phase-X.Y): <description>"`

### Étape 6 — Mettre à jour le suivi
- Cocher la tâche dans `docs/PROJECT_STATUS.md` (passer `[ ]` à `[x]`).
- Mettre à jour la date de dernière mise à jour.
- Annoncer la prochaine tâche priorisée et retour à l'étape 1.

## Résumé visuel du cycle

```
┌─────────────────────────────────────────┐
│  1. Identifier la tâche                 │
│  2. Implémenter (une seule action)      │
│  3. Tests automatisés profonds          │
│  4. Rapport → ATTENDRE validation user  │
│  5. Commit (après approbation)          │
│  6. Mise à jour PROJECT_STATUS.md       │
│  ↻ Retour à 1 pour la tâche suivante   │
└─────────────────────────────────────────┘
```

## Conventions de commit

- `feat(phase-X.Y): ...` — nouvelle fonctionnalité
- `fix(phase-X.Y): ...` — correction de bug
- `refactor(phase-X.Y): ...` — refactoring sans changement fonctionnel
- `test(phase-X.Y): ...` — ajout/modification de tests
