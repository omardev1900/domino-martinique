# TASKS - Taches actives

> Ce fichier contient uniquement les taches planifiees, en cours, ou pretes a etre traitees.
> Rien d'archive ici.
>
> **Flux obligatoire :** `BACKLOG.md` -> `TASKS.md` -> `DONE.md`

**Derniere mise a jour :** 2026-05-10
**Sprint actuel :** Pre-Lancement Officiel

---

## Priorite immediate

Le repo est sorti des gros sprints de livraison d'avril-debut mai.
Le travail actif est maintenant un sprint court de finition avant lancement officiel.

---

## Sprint Pre-Lancement Officiel

| Ticket | Description | Priorite | Statut |
|---|---|---|---|
| **AUDIO-GAMEPLAY-HARDENING** | Audit et stabilisation audio gameplay - chevauchements BGM, doublons SFX, mix et pipeline pro | Haute | Pret |
| **ECO-REBALANCE** | Economie revisee - coins pour jouer, recompenses et gains post-match | Haute | Pret |
| **OTP-INSCRIPTION** | OTP email a l'inscription avec code 6 chiffres | Haute | Pret |
| **ADS-REWARD** | Doubler les gains apres pub via modal post-match | Moyenne | Pret |
| **R4-TECH-LEADERBOARD** | Agregats mensuels persistants pour sortir de la limite `matchHistory` | Moyenne | Pret |
| **ANIM-DOMINO** | Animation glissee des dominos pendant le jeu | Moyenne | Pret |

---

## Ordre recommande

1. `ECO-REBALANCE`
2. `AUDIO-GAMEPLAY-HARDENING`
3. `OTP-INSCRIPTION`
4. `ADS-REWARD`
5. `R4-TECH-LEADERBOARD`
6. `ANIM-DOMINO`

Raison :
`ECO-REBALANCE` reste structurant pour le lancement.
`AUDIO-GAMEPLAY-HARDENING` est critique pour la perception de qualite en partie et touche directement le ressenti gameplay.
`OTP-INSCRIPTION` a un fort impact produit/store.
`ADS-REWARD` depend d'une economie deja cadree.
`R4-TECH-LEADERBOARD` securise la suite.
`ANIM-DOMINO` reste utile, mais non bloquant fonctionnel.

---

## Detail prioritaire - AUDIO-GAMEPLAY-HARDENING

Objectif :
fiabiliser et professionnaliser le rendu audio en jeu avant lancement.

Problemes identifies :
- chevauchement ou relance parasite de musiques de fond
- doublons possibles sur les sons de fin de round / manche / match
- couplage incorrect entre activation SFX et lecture BGM
- mix incoherent entre bruitages, jingles et musique
- absence de politique audio centralisee par priorite de sons

Livrables attendus :
- separation propre des controles `BGM` et `SFX`
- suppression des doublons de declenchement sur les sons terminaux
- politique de priorite audio claire : BGM, gameplay SFX, UI, stingers majeurs
- ducking et reprise de musique stabilises
- audit des assets les plus critiques avec proposition de normalisation

Ordre d'execution recommande :
1. corriger l'architecture et les declencheurs
2. stabiliser le mix et les priorites runtime
3. nettoyer / remplacer les assets audio les moins qualitatifs

---

## Sous-tickets - AUDIO-GAMEPLAY-HARDENING

| Ticket | Description | Priorite | Statut |
|---|---|---|---|
| **AUDIO-A** | Audit des declencheurs audio - cartographie `playMusic` / `playSound` / `stopMusic` et detection des conflits | Haute | Fait |
| **AUDIO-B** | Separation propre `BGM` / `SFX` dans `SoundManager` et dans les reglages | Haute | Fait |
| **AUDIO-C** | Source de verite unique pour les sons terminaux round / manche / match | Haute | Fait |
| **AUDIO-D** | Politique de priorite audio runtime - BGM, UI, gameplay, stingers majeurs | Moyenne | Fait |
| **AUDIO-E** | Stabilisation de la musique de fond - transitions, watchdog, reprise, sorties de partie | Haute | Fait |
| **AUDIO-F** | Tuning du mixage et des volumes percus des SFX critiques | Moyenne | Pret |
| **AUDIO-G** | Audit et shortlist de remplacement / normalisation des assets audio faibles | Moyenne | Pret |
| **AUDIO-H** | Validation audio - tests manuels et couverture technique minimale | Moyenne | Pret |

Ordre recommande :
1. `AUDIO-A`
2. `AUDIO-B`
3. `AUDIO-C`
4. `AUDIO-E`
5. `AUDIO-D`
6. `AUDIO-F`
7. `AUDIO-G`
8. `AUDIO-H`

---

## Recent ferme

Les livraisons des 6 au 8 mai 2026 sont archivees dans `docs/pilotage/DONE.md` :

- `BOT-ADAPTIVE`
- `R4-B-GRADES`
- `R4-M3`
- `R4-B2`
- `R4-B5`
- `R4-M4`
- `R4-M2`
- `R4-M5`
- `R4-UX3`
- `LP-POLICY`

---

## Liens utiles

- Archive : `docs/pilotage/DONE.md`
- Backlog non planifie : `docs/pilotage/BACKLOG.md`
- Roadmap produit : `docs/ROADMAP.md`
- Changelog user-facing : `docs/feedback/CHANGELOG.md`
