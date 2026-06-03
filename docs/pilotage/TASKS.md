# TASKS - Taches actives

> Ce fichier contient uniquement les taches planifiees, pretes, en cours ou differees.
> Rien de livre ou archive ne doit rester ici.
>
> **Flux obligatoire :** `BACKLOG.md` -> `TASKS.md` -> `DONE.md`

**Derniere mise a jour :** 2026-06-03 (10h15)
**Sprint actuel :** Pre-Lancement Officiel

---

## Priorite immediate

Le repo est sorti des gros sprints de livraison d'avril-debut mai.
Le travail actif est maintenant un sprint court de finition avant lancement officiel.

---

## Sprint Pre-Lancement Officiel

**Sprint actuel :** Pre-Lancement Officiel

---

## Priorite immediate

Le repo est sorti des gros sprints de livraison d'avril-debut mai.
Le travail actif est maintenant un sprint court de finition avant lancement officiel.

---

## Sprint Pre-Lancement Officiel

| Ticket | Description | Priorite | Statut |
|---|---|---|---|
| **UX-ENDMATCH-FLOW-CLEANUP** | Assainir tout le process de fin de match : ne plus afficher le plateau apres la fin, fermeture immediates des modals (pub, menu options, resultats), nettoyer la sequence entiere et garantir que chaque modal repond au premier appui sans zone morte ni conflit d'overlay. *(Regroupe UX-ADS-MODAL-CLOSE)* | Haute | Priorite |
| **OTP-INSCRIPTION** | OTP email a l'inscription avec code 6 chiffres — **Web uniquement** (`Platform.OS === 'web'`). Mobile non concerne (validation via Google Play / App Store). | Haute | Differe |
## Ordre recommande

1. `UX-ENDMATCH-FLOW-CLEANUP` (prioritaire — retours clients actifs)
2. `OTP-INSCRIPTION` (differe — Web uniquement)

Raison :
`UX-ENDMATCH-FLOW-CLEANUP` regroupe desormais la correction des fermetures de modals (`UX-ADS-MODAL-CLOSE`) et l'assainissement complet du flow de fin de match. C'est la priorite immediate avant le lancement.
`OTP-INSCRIPTION` est limite au Web uniquement (mobile non concerne) et reporte apres la phase de test ferme.

---

## Detail prioritaire - UX-ENDMATCH-FLOW-CLEANUP

Objectif :
Assainir completement le process de fin de match et garantir que toutes les interactions modals repondent immediatement.

Perimetre :
- Ne plus afficher le plateau apres la fin du match
- Fermeture immediate des modals : pub fin de match, menu options, resultats (premier appui, sans zone morte, sans conflit d'overlay)
- Nettoyer la sequence : resultats → pub contre coins → details
- Garantir que chaque modal repond immediatement aux clics utilisateur

Originellement deux tickets distincts :
- `UX-ADS-MODAL-CLOSE` : fermetures difficiles pub + menu options
- `UX-ENDMATCH-FLOW-CLEANUP` : plateau post-match + sequence resultats
Regroupes car ils partagent la meme zone de code (`GameOverlays`, `UnifiedResultOverlay`).

---

## Regle de tenue a jour

Un ticket n'est pas considere comme termine tant que les fichiers de suivi ne sont pas synchronises.

Checklist de cloture obligatoire :
1. retirer le ticket de `TASKS.md`
2. ajouter l'entree archivee dans `DONE.md` sous la date du jour
3. ajouter `CHANGELOG.md` si le changement est visible cote joueur / utilisateur
4. verifier qu'aucun sous-ticket `Fait` ne reste dans `TASKS.md`

---

## Liens utiles

- Archive : `docs/pilotage/DONE.md`
- Backlog non planifie : `docs/pilotage/BACKLOG.md`
- Roadmap produit : `docs/ROADMAP.md`
- Changelog user-facing : `docs/feedback/CHANGELOG.md`
