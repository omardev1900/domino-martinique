# TASKS - Taches actives

> Ce fichier contient uniquement les taches planifiees, en cours, ou pretes a etre traitees.
> Rien d'archive ici.
>
> **Flux obligatoire :** `BACKLOG.md` -> `TASKS.md` -> `DONE.md`

**Derniere mise a jour :** 2026-05-12
**Sprint actuel :** Pre-Lancement Officiel

---

## Priorite immediate

Le repo est sorti des gros sprints de livraison d'avril-debut mai.
Le travail actif est maintenant un sprint court de finition avant lancement officiel.

---

## Sprint Pre-Lancement Officiel

| Ticket | Description | Priorite | Statut |
|---|---|---|---|
| **AUDIO-GAMEPLAY-HARDENING** | Audit et stabilisation audio gameplay - chevauchements BGM, doublons SFX, mix et pipeline pro | Haute | Fait |
| **MATCH-END-OVERLAY-FLOW** | Fin de match - autorite unique sur le modal final et resynchronisation avec les sons terminaux | Haute | Fait |
| **LEAGUE-GRADEUP-CELEBRATION** | Passage de palier Ligue - celebration plus premium avec applause, modal persistant et partage | Haute | Fait |
| **MATCH-END-APPLAUSE** | Fin de match - enrichir la celebration sonore avec `applause.mp3` joue 800 ms apres `matchEnd` | Moyenne | Pret |
| **AUDIO-BGM-SIMPLIFY** | Simplifier la BGM a 2 slots metier (`appActive`, `inGame`) et supprimer l'heritage des anciens contextes | Moyenne | Pret |
| **ECO-REBALANCE** | Economie revisee - coins pour jouer, recompenses et gains post-match | Haute | Differe |
| **OTP-INSCRIPTION** | OTP email a l'inscription avec code 6 chiffres | Haute | Differe |
| **ADS-REWARD** | Doubler les gains apres pub via modal post-match | Moyenne | Differe |
| **R4-TECH-LEADERBOARD** | Agregats mensuels persistants pour sortir de la limite `matchHistory` | Moyenne | Pret |
| **ANIM-DOMINO** | Animation glissee des dominos pendant le jeu | Moyenne | Pret |

---

## Ordre recommande

1. `MATCH-END-APPLAUSE`
2. `AUDIO-BGM-SIMPLIFY`
3. stabilisation / bugs remontes pendant les tests fermes
4. `ADS-REWARD`
5. `OTP-INSCRIPTION`
6. `ECO-REBALANCE`
7. `R4-TECH-LEADERBOARD`
8. `ANIM-DOMINO`

Raison :
`MATCH-END-APPLAUSE` est un enrichissement localise et simple a valider : garder `matchEnd`, puis declencher `applause.mp3` a `+800 ms`.
`MATCH-END-OVERLAY-FLOW` est corrige et archive : le modal final a maintenant une sequence dediee et le stinger `matchEnd` n'entre plus en conflit avec le resume de round.
`AUDIO-BGM-SIMPLIFY` devient la prochaine simplification technique utile pour consolider le nouveau modele BGM et reduire le risque de rechute.
`ADS-REWARD` est prevu juste apres validation des tests fermes et avant test ouvert Google Play.
`OTP-INSCRIPTION` est volontairement reporte apres la phase de test ferme.
`ECO-REBALANCE` est differe en attendant l'arbitrage produit avec le client et l'associe.
`R4-TECH-LEADERBOARD` et `ANIM-DOMINO` restent secondaires tant que les retours de test ferme remontent encore des bugs visibles.

---

## Detail prioritaire - LEAGUE-GRADEUP-CELEBRATION

Objectif :
rendre le passage de palier Ligue beaucoup plus celebratoire et moins brusque.

Problemes identifies :
- le modal de passage de palier apparait de facon trop seche
- aucun son ne vient souligner l'evenement
- le modal peut se fermer trop vite, ce qui casse le moment
- absence de partage social alors que c'est un moment fort de progression

Livrables attendus :
- ajout d'un second son `applause.mp3` pour accompagner le passage de palier
- modal de grade-up non auto-ferme, avec CTA explicite (`Continuer`, `Accueil` ou equivalent)
- ajout d'un bouton de partage similaire a la fin de match gagnante
- verification que la celebration reste propre en solo comme en multi local

Ordre d'execution recommande :
1. integrer l'asset `applause.mp3` dans le pipeline audio
2. rendre le modal persistant jusqu'a action utilisateur
3. ajouter les CTA et le bouton de partage
4. verifier le timing avec les overlays de recompense existants

---

## Detail prioritaire - MATCH-END-APPLAUSE

Objectif :
enrichir la celebration de fin de match avec une seconde couche sonore plus chaleureuse, sans casser le stinger actuel.

Demande validee :
- garder le son de fin de match actuel (`matchEnd`)
- jouer ensuite `applause.mp3`
- delai cible : `+800 ms` apres le declenchement de `matchEnd`

Points d'attention :
- ne pas superposer brutalement les deux sons a volume fort
- respecter la politique audio existante pour eviter un chevauchement avec d'autres stingers
- verifier le rendu reel sur mobile et web

Ordre d'execution recommande :
1. ajouter `applause.mp3` au pipeline audio
2. declencher `matchEnd`, puis `applause` avec timer `800 ms`
3. tester la synchronisation avec l'ouverture du modal final

---

## Detail prioritaire - AUDIO-BGM-SIMPLIFY

Objectif :
reduire la lassitude creee par la BGM actuelle et finir la simplification du modele musical.

Problemes identifies :
- une boucle BGM unique finit par fatiguer a l'usage
- l'ancien heritage multi-contextes complique encore le raisonnement produit
- certains ecrans devraient rester silencieux ou au moins plus sobres

Pistes deja validees :
- conserver aucun BGM sur splash/login
- garder 2 contextes maximum : `appActive` et `inGame`
- etudier ensuite une variation plus agreable :
  - 2 BGM possibles hors partie
  - 2 BGM possibles en partie
  - ou une BGM plus basse / plus discrete selon les ecrans

Point de reprise :
commencer par le design produit/audio avant d'ajouter plusieurs nouvelles pistes, pour eviter de complexifier le runtime trop tot.

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
| **AUDIO-F** | Tuning du mixage et des volumes percus des SFX critiques | Moyenne | Fait |
| **AUDIO-G** | Audit et shortlist de remplacement / normalisation des assets audio faibles | Moyenne | Fait |
| **AUDIO-H** | Validation audio - tests manuels et couverture technique minimale | Moyenne | Fait |

Ordre recommande :
1. `AUDIO-A`
2. `AUDIO-B`
3. `AUDIO-C`
4. `AUDIO-E`
5. `AUDIO-D`
6. `AUDIO-F`
7. `AUDIO-G`
8. `AUDIO-H`

Shortlist AUDIO-G :
- `start-game.mp3` : asset tres lourd (~2.5 MB), probablement trop long / envahissant pour un simple lancement. A recouper ou remplacer en priorite.
- `bgm.mp3` : unique fallback reutilise dans plusieurs contextes herites. A terme, simplifier a 2 slots metier (`appActive`, `inGame`) avec assets dedies.
- `partie-end.mp3` : plus long et plus massif que `manche-end.mp3` / `match-end.mp3`, a verifier pour eviter un rendu "interrompt puis repart".
- `timer.mp3` et `end_time.mp3` : garder sous controle; le mix a ete baisse, mais il faudra verifier que l'attaque n'est pas trop agressive en conditions reelles.
- `notify.mp3` / `toktok.mp3` : petits assets tres frequents, a valider a l'oreille pour s'assurer qu'ils restent premium et non "cheap" a repetition.
- `clack1.mp3` / `clack2.mp3` / `clack3.mp3` : bons candidats a une normalisation de timbre / niveau si les impacts paraissent heterogenes entre eux.

Checklist AUDIO-H :
- Boot web/mobile : aucun BGM sur splash ni login.
- Arrivee sur `/home` : une seule BGM demarre, sans doublon ni reprise audible parasite.
- Navigation hors partie : la meme BGM reste stable entre home, ligue, boutique, stats.
- Entree en partie : transition vers la BGM de jeu sans superposition perceptible.
- Switch `Musique` : coupe/reprend la BGM immediatement.
- Switch `Effets` : coupe/reprend uniquement les SFX, sans impact sur la BGM.
- Pose domino : `clack` audible mais discret, sans saturation a repetition.
- Pass / auto-pass : `toktok` / `notify` audibles mais non agressifs.
- Timer <5s : `timer` perceptible mais en retrait.
- Expiration timer : `end_time` plus fort que `timer`, sans etre strident.
- Fin de round : un seul stinger terminal joue, sans doublon.
- Fin de manche : un seul stinger terminal joue, sans double modal ni coupure bizarre.
- Fin de match : son `matchEnd` bien audible et synchronise avec le modal final visible a l'ecran.
- Revenir au menu apres une partie : pas de musique fantome, pas de reprise double.

Couverture technique deja en place :
- `src/core/audio/__tests__/SoundManager.test.ts`
- `src/components/game/__tests__/RoundResultCard.test.tsx`
- `src/screens/__tests__/GameScreen.gradeUp.test.tsx`
- `src/core/__tests__/GameIntegration.test.ts`

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
