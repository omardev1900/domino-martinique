# TASKS - Taches actives

> Ce fichier contient uniquement les taches planifiees, pretes, en cours ou differees.
> Rien de livre ou archive ne doit rester ici.
>
> **Flux obligatoire :** `BACKLOG.md` -> `TASKS.md` -> `DONE.md`

**Derniere mise a jour :** 2026-05-21
**Sprint actuel :** Pre-Lancement Officiel

---

## Priorite immediate

Le repo est sorti des gros sprints de livraison d'avril-debut mai.
Le travail actif est maintenant un sprint court de finition avant lancement officiel.

---

## Sprint Pre-Lancement Officiel

| Ticket | Description | Priorite | Statut |
|---|---|---|---|
| **ECO-REBALANCE** | Economie revisee - coins pour jouer, recompenses et gains post-match | Haute | Differe |
| **OTP-INSCRIPTION** | OTP email a l'inscription avec code 6 chiffres — **Web uniquement** (`Platform.OS === 'web'`). Mobile non concerne (validation via Google Play / App Store). | Haute | Differe |
| **ANIM-DOMINO** | Animation glissee des dominos pendant le jeu | Moyenne | Pret |


---

## Ordre recommande

1. `ANIM-DOMINO`
2. `OTP-INSCRIPTION`
3. `ECO-REBALANCE`

Raison :
`CF-PROCESSMATCHREWARD-CORS` est demarre pour fiabiliser les tests Web locaux autour des recompenses de fin de match avant d'ajouter de nouvelles variantes pub.
`ECO-WELCOME-DAILY` est un correctif rapide des constantes d'economie (bienvenue 300, cadeau jour 200) avant que les nouveaux joueurs arrivent post-lancement.
`OTP-INSCRIPTION` est limite au Web uniquement (mobile non concerne) et reporte apres la phase de test ferme.
`ECO-REBALANCE` est differe en attendant l'arbitrage produit avec le client et l'associe.
`ANIM-DOMINO` restent secondaires tant que les retours de test ferme remontent encore des bugs visibles.

---

## Detail prioritaire - CF-PROCESSMATCHREWARD-CORS

Objectif :
fiabiliser les appels Web locaux a la Cloud Function `processMatchReward`, en particulier depuis `http://localhost:8081`, pour que les tests de recompense ne soient plus pollues par un probleme CORS.

Attendus :
- verifier comment `httpsCallable` appelle aujourd'hui `processMatchReward`
- confirmer si le blocage vient bien du CORS ou d'une autre couche Web locale
- corriger le serveur si necessaire, ou documenter clairement le fallback client si le comportement est volontaire
- valider que les recompenses post-match restent exploitables en test Web local

---

## Detail prioritaire - ECO-WELCOME-DAILY

Objectif :
reequilibrer les deux constantes cles de l'economie debutant avant l'afflux de nouveaux joueurs post-lancement.

Changements :
- `NEW_PLAYER_COINS` : `1000` → `300` (dans `economy.constants.ts`)
- `DAILY_REWARD_COINS` : `300` → `200` (dans `economy.constants.ts`)

Points d'attention :
- Ces constantes alimentent aussi bien le client (`economy.service.ts`) que la Cloud Function si elle y fait reference.
- Les joueurs existants ne sont PAS affectes (le cadeau de bienvenue n'est applique qu'a la creation du compte).
- Verifier les tests existants qui pourraient coder en dur ces valeurs.

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
