# ✅ TASKS — Tâches actives (sprint en cours)

> **Rôle** : ce fichier contient uniquement les tâches **planifiées, en cours, ou prêtes à être traitées**.
> Rien d'archivé ici, rien de non-planifié non plus.
>
> **Flux** : `TASKS_TODO.md` → **`TASKS.md`** → `TASKS_DONE.md`
>
> - Nouvelle demande client → ajoutée à `TASKS_TODO.md`
> - Décision de traiter une tâche → la déplacer ici
> - Tâche terminée → la déplacer dans `TASKS_DONE.md` avec la date

**Dernière mise à jour :** 25 avril 2026
**Sprint actuel :** 🚨 Sprint Lancement — Retour client #2 (2 items restants)

---

## 🚨 Sprint Lancement — Tâches restantes

### 🟡 Amélioration UX
- [ ] **[R2-A1]** Animation glissement des dominos
  - Animation "glissé" : domino qui glisse vers le plateau lorsqu'il est joué
  - Reporté depuis Bloc 8 — à traiter avant le lancement si possible
  - **Estimation** : 2-3 jours (complexe)

### 🔧 Tech / Migration
- [ ] **[R2-T1]** Migration vers Universal Links pour le partage WhatsApp
  - **Problème** : le lien d'invitation actuel utilise un protocole custom (`domino-martinique://`) qui reste inactif (noir, non-cliquable) dans WhatsApp → l'utilisateur doit copier/coller le code manuellement
  - **Objectif** : rendre le lien entièrement cliquable (bleu) dans WhatsApp pour ouvrir directement l'app sur la bonne table
  - [ ] Choisir le domaine Universal Link (ex: `https://domino-martinique.com/join/<code>`)
  - [ ] iOS : configurer `apple-app-site-association` sur le domaine + `associatedDomains` dans `app.json`
  - [ ] Android : configurer `assetlinks.json` sur le domaine + `intentFilters` dans `app.json`
  - [ ] Page web de fallback `/join/<code>` (redirection vers store si app non installée)
  - [ ] Remplacer la génération du lien `domino-martinique://` par l'URL HTTPS dans le code de partage
  - [ ] Adapter le deep-link handler mobile pour parser le nouveau format
  - [ ] Tester sur WhatsApp iOS + Android (app installée / non installée)
  - **Estimation** : ~1 jour

---

## 🎯 Ordre d'attaque recommandé

1. **[R2-T1]** — Universal Links (~1 jour) : améliore significativement l'onboarding via partage
2. **[R2-A1]** — Animation dominos (2-3 jours) : finition UX, peut être repoussé si le lancement presse

---

## 📚 Autres fichiers de suivi

- **Archive** des tâches terminées → `TASKS_DONE.md`
- **Backlog** (blocs futurs, Bot MÈTKAYALI, feedback déprioritisé) → `TASKS_TODO.md`
- **Retours client bruts** → `FEEDBACK_CLIENT.md`
- **Roadmap globale** → `ROADMAP.md`
- **Spec technique sprint** → `SPRINT_LANCEMENT.md`
