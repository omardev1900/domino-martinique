Résumé du plan v3 — 10 étapes, 4 sprints

🔴 Sprint 1 — Tests cassés (URGENT — ~10 min)
#	Tâche	Fix
1	3 tests useGameEngine	Ajouter getForcedOpeningDominoId: jest.fn() dans le mock LogicEngine
2	1 test getValidMoves	Le test est mal écrit — d22 matche légalement, corriger l'assertion

🟠 Sprint 2 — Sécurité secondaire (~90 min)
#	Tâche
3	SEC-7 : Validation displayName, roomName, bornes économiques
4	SEC-8 : Debounce sur les écritures Firebase (rate limiting client)

🟡 Sprint 3 — Qualité (~2h30)
#	Tâche
5	P7 : Asset pass_turn.mp3 manquant (ajouter ou supprimer les appels)
6	C7 : Autoplay web — appeler unlockAudio() sur le premier touch
7	P2 : Remplacer JSON.parse(JSON.stringify()) par structuredClone()
8	P4 : Source unique setGameState — refactoring lourd, branche dédiée

🟢 Sprint 4 — UX Produit (~20 min)
#	Tâche
9	F2 : Masquer le mode Tournoi (affiché mais vide)
10	F4 : Supprimer l'écran "Explore" placeholder
⏸ Reporté (sprints futurs)
SEC-4 : AsyncStorage chiffré
C6 : Renommage PARTIE_END
F1 : Tirage au talon (à clarifier product owner)
F3 : Validation boutique côté serveur