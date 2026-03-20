
> mobile@1.0.0 test
> jest --watchAll=false

FAIL src/__tests__/MultiplayerCochonSync.integration.test.ts
  ● Console

    console.log
      MANCHE WINNER: A

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      COCHON DETECTED! Count: 2

      at log (src/core/ScoringEngine.ts:101:21)

    console.log
      MANCHE WINNER: A

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      COCHON DETECTED! Count: 2

      at log (src/core/ScoringEngine.ts:101:21)

  ● Multiplayer Cochon Synchronization Integration › Propagation du Cochon : Player A gagne et les scores se synchronisent pour tous

    expect(received).toBe(expected) // Object.is equality

    Expected: "MANCHE_END"
    Received: "MATCH_END"

    [0m [90m 110 |[39m         [90m// Verify the logic result locally first[39m
     [90m 111 |[39m         expect(newStateAfterWin[33m.[39mmancheResult)[33m.[39mtoBe([32m'COCHON'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 112 |[39m         expect(newStateAfterWin[33m.[39mphase)[33m.[39mtoBe([32m'MANCHE_END'[39m)[33m;[39m
     [90m     |[39m                                        [31m[1m^[22m[39m
     [90m 113 |[39m
     [90m 114 |[39m         [36mconst[39m playerA [33m=[39m newStateAfterWin[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m [32m'A'[39m)[33m;[39m
     [90m 115 |[39m         [36mconst[39m playerB [33m=[39m newStateAfterWin[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m [32m'B'[39m)[33m;[39m[0m

      at Object.toBe (src/__tests__/MultiplayerCochonSync.integration.test.ts:112:40)
      at asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
      at _next (node_modules/@babel/runtime/helpers/asyncToGenerator.js:17:9)
      at node_modules/@babel/runtime/helpers/asyncToGenerator.js:22:7
      at Object.<anonymous> (node_modules/@babel/runtime/helpers/asyncToGenerator.js:14:12)

  ● Multiplayer Cochon Synchronization Integration › Robustesse (Latence) : Aucun démarrage de manche avant sauvegarde

    expect(received).toBe(expected) // Object.is equality

    Expected: "MANCHE_END"
    Received: "MATCH_END"

    [0m [90m 184 |[39m
     [90m 185 |[39m         [90m// Now phase is updated[39m
    [31m[1m>[22m[39m[90m 186 |[39m         expect(db[33m.[39mgetState()[33m.[39mphase)[33m.[39mtoBe([32m'MANCHE_END'[39m)[33m;[39m
     [90m     |[39m                                     [31m[1m^[22m[39m
     [90m 187 |[39m     })[33m;[39m
     [90m 188 |[39m })[33m;[39m
     [90m 189 |[39m[0m

      at Object.toBe (src/__tests__/MultiplayerCochonSync.integration.test.ts:186:37)
      at asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
      at _next (node_modules/@babel/runtime/helpers/asyncToGenerator.js:17:9)

FAIL src/core/__tests__/GameIntegration.test.ts
  ● Console

    console.error
      ERROR: currentPlayerId player1 not found in [p1, p2, p3]

    [0m [90m 24 |[39m             [36mconst[39m currentPlayer [33m=[39m state[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m state[33m.[39mcurrentPlayerId)[33m;[39m
     [90m 25 |[39m             [36mif[39m ([33m![39mcurrentPlayer) {
    [31m[1m>[22m[39m[90m 26 |[39m                 console[33m.[39merror([32m`ERROR: currentPlayerId ${state.currentPlayerId} not found in [${state.players.map(p => p.id).join(', ')}]`[39m)[33m;[39m
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 27 |[39m                 [36mthrow[39m [36mnew[39m [33mError[39m([32m"currentPlayer is undefined"[39m)[33m;[39m
     [90m 28 |[39m             }
     [90m 29 |[39m             [90m// AI Logic[39m[0m

      at error (src/core/__tests__/GameIntegration.test.ts:26:25)
      at playFullRound (src/core/__tests__/GameIntegration.test.ts:112:13)
      at Object._loop (src/core/__tests__/GameIntegration.test.ts:79:66)

  ● GameIntegration - Full Game Simulation › should simulate a full match between 3 bots without crashing

    currentPlayer is undefined

    [0m [90m 25 |[39m             [36mif[39m ([33m![39mcurrentPlayer) {
     [90m 26 |[39m                 console[33m.[39merror([32m`ERROR: currentPlayerId ${state.currentPlayerId} not found in [${state.players.map(p => p.id).join(', ')}]`[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 27 |[39m                 [36mthrow[39m [36mnew[39m [33mError[39m([32m"currentPlayer is undefined"[39m)[33m;[39m
     [90m    |[39m                       [31m[1m^[22m[39m
     [90m 28 |[39m             }
     [90m 29 |[39m             [90m// AI Logic[39m
     [90m 30 |[39m             [36mconst[39m move [33m=[39m getBotMove([0m

      at playFullRound (src/core/__tests__/GameIntegration.test.ts:27:23)
      at playFullRound (src/core/__tests__/GameIntegration.test.ts:112:13)
      at Object._loop (src/core/__tests__/GameIntegration.test.ts:79:66)

FAIL src/__tests__/rules_scenarios.test.ts
  ● Domino Martiniquais Rules - Termination Scenarios › Scenario 2-1-1: Should end in CHIRE (No cochon)

    expect(received).toBe(expected) // Object.is equality

    Expected: "MATCH_END"
    Received: "PARTIE_END"

    [0m [90m 34 |[39m         [36mconst[39m result [33m=[39m finalizeRound(state[33m,[39m [32m'p3'[39m)[33m;[39m
     [90m 35 |[39m
    [31m[1m>[22m[39m[90m 36 |[39m         expect(result[33m.[39mphase)[33m.[39mtoBe([32m'MATCH_END'[39m)[33m;[39m
     [90m    |[39m                              [31m[1m^[22m[39m
     [90m 37 |[39m         expect(result[33m.[39mmancheResult)[33m.[39mtoBe([32m'CHIRE'[39m)[33m;[39m
     [90m 38 |[39m         [90m// P1: 2 wins -> 2 pts, P2: 1 win -> 1 pt, P3: 1 win -> 1 pt[39m
     [90m 39 |[39m         expect(result[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m [32m'p1'[39m)[33m?[39m[33m.[39mtotalPoints)[33m.[39mtoBe([35m2[39m)[33m;[39m[0m

      at Object.toBe (src/__tests__/rules_scenarios.test.ts:36:30)

  ● Domino Martiniquais Rules - Termination Scenarios › Scenario 3-0-0: Should reward 5 pts (2 cochons)

    expect(received).toBe(expected) // Object.is equality

    Expected: 5
    Received: 0

    [0m [90m 49 |[39m         [36mconst[39m state [33m=[39m createMockState(players)[33m;[39m
     [90m 50 |[39m         [36mconst[39m result [33m=[39m finalizeRound(state[33m,[39m [32m'p1'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 51 |[39m         expect(result[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m [32m'p1'[39m)[33m?[39m[33m.[39mtotalPoints)[33m.[39mtoBe([35m5[39m)[33m;[39m
     [90m    |[39m                                                                      [31m[1m^[22m[39m
     [90m 52 |[39m         expect(result[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m [32m'p2'[39m)[33m?[39m[33m.[39mtotalPoints)[33m.[39mtoBe([33m-[39m[35m1[39m)[33m;[39m
     [90m 53 |[39m     })[33m;[39m
     [90m 54 |[39m[0m

      at Object.toBe (src/__tests__/rules_scenarios.test.ts:51:70)

  ● Domino Martiniquais Rules - Termination Scenarios › Scenario 3-1-0: Should reward 4 pts (1 cochon)

    expect(received).toBe(expected) // Object.is equality

    Expected: 4
    Received: 0

    [0m [90m 61 |[39m         [36mconst[39m state [33m=[39m createMockState(players)[33m;[39m
     [90m 62 |[39m         [36mconst[39m result [33m=[39m finalizeRound(state[33m,[39m [32m'p1'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 63 |[39m         expect(result[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m [32m'p1'[39m)[33m?[39m[33m.[39mtotalPoints)[33m.[39mtoBe([35m4[39m)[33m;[39m
     [90m    |[39m                                                                      [31m[1m^[22m[39m
     [90m 64 |[39m         expect(result[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m [32m'p3'[39m)[33m?[39m[33m.[39mtotalPoints)[33m.[39mtoBe([33m-[39m[35m1[39m)[33m;[39m
     [90m 65 |[39m         expect(result[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m [32m'p2'[39m)[33m?[39m[33m.[39mtotalPoints)[33m.[39mtoBe([35m1[39m)[33m;[39m [90m// Keep wins as pts[39m
     [90m 66 |[39m     })[33m;[39m[0m

      at Object.toBe (src/__tests__/rules_scenarios.test.ts:63:70)

  ● Domino Martiniquais Rules - Termination Scenarios › Scenario 2-1-0: Should continue round (Cochon remains)

    expect(received).toBe(expected) // Object.is equality

    Expected: "ROUND_END"
    Received: "PARTIE_END"

    [0m [90m 75 |[39m         [36mconst[39m result [33m=[39m finalizeRound(state[33m,[39m [32m'p1'[39m)[33m;[39m [90m// P1 wins -> 2-1-0[39m
     [90m 76 |[39m
    [31m[1m>[22m[39m[90m 77 |[39m         expect(result[33m.[39mphase)[33m.[39mtoBe([32m'ROUND_END'[39m)[33m;[39m
     [90m    |[39m                              [31m[1m^[22m[39m
     [90m 78 |[39m         expect(result[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m [32m'p1'[39m)[33m?[39m[33m.[39mwins)[33m.[39mtoBe([35m2[39m)[33m;[39m
     [90m 79 |[39m     })[33m;[39m
     [90m 80 |[39m[0m

      at Object.toBe (src/__tests__/rules_scenarios.test.ts:77:30)

  ● Domino Martiniquais Rules - Termination Scenarios › Tie-break Logic (BOUDE) › Tie-break: Highest Double wins

    expect(received).toBe(expected) // Object.is equality

    Expected: "p1"
    Received: "TIE"

    [0m [90m 88 |[39m             [90m// P1 and P2 have 2 points each. P1 has a double, P2 doesn't.[39m
     [90m 89 |[39m             [36mconst[39m winner [33m=[39m determineWinnerOnBoudé(players)[33m;[39m
    [31m[1m>[22m[39m[90m 90 |[39m             expect(winner)[33m.[39mtoBe([32m'p1'[39m)[33m;[39m
     [90m    |[39m                            [31m[1m^[22m[39m
     [90m 91 |[39m         })[33m;[39m
     [90m 92 |[39m
     [90m 93 |[39m         test([32m'Tie-break: Highest Double among multiple doubles'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.toBe (src/__tests__/rules_scenarios.test.ts:90:28)

FAIL src/hooks/game/__tests__/useGameTimers.test.tsx
  ● Console

    console.error
      An update to TestComponent inside a test was not wrapped in act(...).
      
      When testing, code that causes React state updates should be wrapped into act(...):
      
      act(() => {
        /* fire events that update state */
      });
      /* assert on the output */
      
      This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

    [0m [90m 109 |[39m             }
     [90m 110 |[39m
    [31m[1m>[22m[39m[90m 111 |[39m             setTimeLeft(remaining)[33m;[39m
     [90m     |[39m             [31m[1m^[22m[39m
     [90m 112 |[39m
     [90m 113 |[39m             [36mif[39m (remaining [33m===[39m [35m0[39m) {
     [90m 114 |[39m                 [36mif[39m (turnTimerRef[33m.[39mcurrent) clearInterval(turnTimerRef[33m.[39mcurrent)[33m;[39m[0m

      at node_modules/react-test-renderer/cjs/react-test-renderer.development.js:11801:19
      at runWithFiberInDEV (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:1574:13)
      at warnIfUpdatesNotWrappedWithActDEV (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:11800:9)
      at scheduleUpdateOnFiber (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:10326:9)
      at dispatchSetStateInternal (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:4148:13)
      at dispatchSetState (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:4107:7)
      at setTimeLeft (src/hooks/game/useGameTimers.ts:111:13)
      at callTimer (node_modules/@sinonjs/fake-timers/src/fake-timers-src.js:744:24)
      at doTickInner (node_modules/@sinonjs/fake-timers/src/fake-timers-src.js:1312:29)
      at doTick (node_modules/@sinonjs/fake-timers/src/fake-timers-src.js:1393:20)
      at Object.tick (node_modules/@sinonjs/fake-timers/src/fake-timers-src.js:1401:20)
      at Object.runToLast (node_modules/@sinonjs/fake-timers/src/fake-timers-src.js:1558:26)
      at FakeTimers.runOnlyPendingTimers (node_modules/@jest/fake-timers/build/modernFakeTimers.js:60:19)
      at Object.runOnlyPendingTimers (src/hooks/game/__tests__/useGameTimers.test.tsx:18:14)

    console.error
      An update to TestComponent inside a test was not wrapped in act(...).
      
      When testing, code that causes React state updates should be wrapped into act(...):
      
      act(() => {
        /* fire events that update state */
      });
      /* assert on the output */
      
      This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

    [0m [90m 129 |[39m         [36mif[39m (overtime [33m>[39m [35m0[39m) {
     [90m 130 |[39m             overtimeTimerRef[33m.[39mcurrent [33m=[39m setTimeout(() [33m=>[39m {
    [31m[1m>[22m[39m[90m 131 |[39m                 setOvertime(prev [33m=>[39m (prev [33m!==[39m [36mnull[39m [33m&&[39m prev [33m>[39m [35m0[39m [33m?[39m prev [33m-[39m [35m1[39m [33m:[39m [36mnull[39m))[33m;[39m
     [90m     |[39m                 [31m[1m^[22m[39m
     [90m 132 |[39m             }[33m,[39m [35m1000[39m)[33m;[39m
     [90m 133 |[39m         } [36melse[39m [36mif[39m (overtime [33m===[39m [35m0[39m) {
     [90m 134 |[39m             [36mconst[39m currentPlayerId [33m=[39m gameState[33m?[39m[33m.[39mcurrentPlayerId[33m;[39m[0m

      at node_modules/react-test-renderer/cjs/react-test-renderer.development.js:11801:19
      at runWithFiberInDEV (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:1574:13)
      at warnIfUpdatesNotWrappedWithActDEV (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:11800:9)
      at scheduleUpdateOnFiber (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:10326:9)
      at dispatchSetStateInternal (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:4148:13)
      at dispatchSetState (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:4107:7)
      at setOvertime (src/hooks/game/useGameTimers.ts:131:17)
      at callTimer (node_modules/@sinonjs/fake-timers/src/fake-timers-src.js:744:24)
      at doTickInner (node_modules/@sinonjs/fake-timers/src/fake-timers-src.js:1312:29)
      at doTick (node_modules/@sinonjs/fake-timers/src/fake-timers-src.js:1393:20)
      at Object.tick (node_modules/@sinonjs/fake-timers/src/fake-timers-src.js:1401:20)
      at Object.runToLast (node_modules/@sinonjs/fake-timers/src/fake-timers-src.js:1558:26)
      at FakeTimers.runOnlyPendingTimers (node_modules/@jest/fake-timers/build/modernFakeTimers.js:60:19)
      at Object.runOnlyPendingTimers (src/hooks/game/__tests__/useGameTimers.test.tsx:18:14)

    console.error
      An update to TestComponent inside a test was not wrapped in act(...).
      
      When testing, code that causes React state updates should be wrapped into act(...):
      
      act(() => {
        /* fire events that update state */
      });
      /* assert on the output */
      
      This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

    [0m [90m 129 |[39m         [36mif[39m (overtime [33m>[39m [35m0[39m) {
     [90m 130 |[39m             overtimeTimerRef[33m.[39mcurrent [33m=[39m setTimeout(() [33m=>[39m {
    [31m[1m>[22m[39m[90m 131 |[39m                 setOvertime(prev [33m=>[39m (prev [33m!==[39m [36mnull[39m [33m&&[39m prev [33m>[39m [35m0[39m [33m?[39m prev [33m-[39m [35m1[39m [33m:[39m [36mnull[39m))[33m;[39m
     [90m     |[39m                 [31m[1m^[22m[39m
     [90m 132 |[39m             }[33m,[39m [35m1000[39m)[33m;[39m
     [90m 133 |[39m         } [36melse[39m [36mif[39m (overtime [33m===[39m [35m0[39m) {
     [90m 134 |[39m             [36mconst[39m currentPlayerId [33m=[39m gameState[33m?[39m[33m.[39mcurrentPlayerId[33m;[39m[0m

      at node_modules/react-test-renderer/cjs/react-test-renderer.development.js:11801:19
      at runWithFiberInDEV (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:1574:13)
      at warnIfUpdatesNotWrappedWithActDEV (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:11800:9)
      at scheduleUpdateOnFiber (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:10326:9)
      at dispatchSetStateInternal (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:4148:13)
      at dispatchSetState (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:4107:7)
      at setOvertime (src/hooks/game/useGameTimers.ts:131:17)
      at callTimer (node_modules/@sinonjs/fake-timers/src/fake-timers-src.js:744:24)
      at doTickInner (node_modules/@sinonjs/fake-timers/src/fake-timers-src.js:1312:29)
      at doTick (node_modules/@sinonjs/fake-timers/src/fake-timers-src.js:1393:20)
      at Object.tick (node_modules/@sinonjs/fake-timers/src/fake-timers-src.js:1401:20)
      at Object.runToLast (node_modules/@sinonjs/fake-timers/src/fake-timers-src.js:1558:26)
      at FakeTimers.runOnlyPendingTimers (node_modules/@jest/fake-timers/build/modernFakeTimers.js:60:19)
      at Object.runOnlyPendingTimers (src/hooks/game/__tests__/useGameTimers.test.tsx:18:14)

  ● useGameTimers Hook (Component Wrapper) › triggers onTimeout when overtime reaches 0

    expect(received).toBe(expected) // Object.is equality

    Expected: 0
    Received: 4

    [0m [90m 102 |[39m         })[33m;[39m
     [90m 103 |[39m
    [31m[1m>[22m[39m[90m 104 |[39m         expect(getByTestId([32m'overtime'[39m)[33m.[39mprops[33m.[39mchildren)[33m.[39mtoBe([35m0[39m)[33m;[39m
     [90m     |[39m                                                        [31m[1m^[22m[39m
     [90m 105 |[39m         expect(mockOnTimeout)[33m.[39mtoHaveBeenCalledWith([32m'p1'[39m[33m,[39m expect[33m.[39many([33mNumber[39m))[33m;[39m
     [90m 106 |[39m     })[33m;[39m
     [90m 107 |[39m })[33m;[39m[0m

      at Object.toBe (src/hooks/game/__tests__/useGameTimers.test.tsx:104:56)

FAIL src/hooks/game/__tests__/IntegrationArchitecture.test.tsx
  ● Integration Architecture › Scenario 3: Le Réveil du Bot (Bot Awakening)

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

    [0m [90m 163 |[39m
     [90m 164 |[39m         [90m// Le dispatch devrait avoir été appelé ('PASS_TURN' s'il n'a pas de coups valides, ce qui est le cas ici)[39m
    [31m[1m>[22m[39m[90m 165 |[39m         expect(spyDispatch)[33m.[39mtoHaveBeenCalled()[33m;[39m
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 166 |[39m         [36mconst[39m callArgs [33m=[39m spyDispatch[33m.[39mmock[33m.[39mcalls[[35m0[39m][[35m0[39m][33m;[39m
     [90m 167 |[39m         expect([[32m'PLAY_TILE'[39m[33m,[39m [32m'PASS_TURN'[39m])[33m.[39mtoContain(callArgs[33m.[39mtype)[33m;[39m
     [90m 168 |[39m     })[33m;[39m[0m

      at Object.toHaveBeenCalled (src/hooks/game/__tests__/IntegrationArchitecture.test.tsx:165:29)

FAIL src/core/StressTest.test.ts
  ● Console

    console.log
      MANCHE WINNER: p2

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      COCHON DETECTED! Count: 1

      at log (src/core/ScoringEngine.ts:101:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p2

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      MANCHE WINNER: p2

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      COCHON DETECTED! Count: 1

      at log (src/core/ScoringEngine.ts:101:21)

    console.log
      MANCHE WINNER: p2

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      COCHON DETECTED! Count: 1

      at log (src/core/ScoringEngine.ts:101:21)

    console.log
      MANCHE WINNER: p2

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      COCHON DETECTED! Count: 1

      at log (src/core/ScoringEngine.ts:101:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p2

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p3

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p3

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p3

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

  ● Phase 2.3: Stress Test Simulation › Match termination in MANCHE mode

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: false

    [0m [90m 57 |[39m         [36mconst[39m { state } [33m=[39m simulateMatch([32m'MANCHE'[39m[33m,[39m [35m3[39m)[33m;[39m
     [90m 58 |[39m         expect(state[33m.[39mphase)[33m.[39mtoBe([32m'MATCH_END'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 59 |[39m         expect(state[33m.[39mplayers[33m.[39msome(p [33m=>[39m p[33m.[39mmancheWins [33m>=[39m [35m3[39m))[33m.[39mtoBe([36mtrue[39m)[33m;[39m
     [90m    |[39m                                                            [31m[1m^[22m[39m
     [90m 60 |[39m     })[33m;[39m
     [90m 61 |[39m
     [90m 62 |[39m     test([32m'Match termination in SCORE mode'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.toBe (src/core/StressTest.test.ts:59:60)

  ● Phase 2.3: Stress Test Simulation › Match termination in COCHON mode (individual limit)

    expect(received).toBe(expected) // Object.is equality

    Expected: "MATCH_END"
    Received: "PLAYING"

    [0m [90m 68 |[39m     test([32m'Match termination in COCHON mode (individual limit)'[39m[33m,[39m () [33m=>[39m {
     [90m 69 |[39m         [36mconst[39m { state } [33m=[39m simulateMatch([32m'COCHON'[39m[33m,[39m [35m3[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 70 |[39m         expect(state[33m.[39mphase)[33m.[39mtoBe([32m'MATCH_END'[39m)[33m;[39m
     [90m    |[39m                             [31m[1m^[22m[39m
     [90m 71 |[39m         expect(state[33m.[39mplayers[33m.[39msome(p [33m=>[39m p[33m.[39mtotalCochons [33m>=[39m [35m3[39m))[33m.[39mtoBe([36mtrue[39m)[33m;[39m
     [90m 72 |[39m     })[33m;[39m
     [90m 73 |[39m[0m

      at Object.toBe (src/core/StressTest.test.ts:70:29)

FAIL src/core/__tests__/ScoringScenarios.test.ts
  ● Console

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.error
      
      --- Test 1: Chirée (C wins) ---

    [0m [90m 29 |[39m     [90m// Helper to log clear results[39m
     [90m 30 |[39m     [36mconst[39m logResult [33m=[39m (title[33m:[39m string[33m,[39m result[33m:[39m [33mGameState[39m[33m,[39m expected[33m:[39m any) [33m=>[39m {
    [31m[1m>[22m[39m[90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
     [90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m 34 |[39m         })[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:31:17)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:48:9)

    console.error
      Player A: Stars=2, TotalPts=0, IsCochon=false

    [0m [90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
    [31m[1m>[22m[39m[90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 34 |[39m         })[33m;[39m
     [90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m 36 |[39m     }[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:33:21)
          at Array.forEach (<anonymous>)
      at forEach (src/core/__tests__/ScoringScenarios.test.ts:32:24)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:48:9)

    console.error
      Player B: Stars=1, TotalPts=0, IsCochon=false

    [0m [90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
    [31m[1m>[22m[39m[90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 34 |[39m         })[33m;[39m
     [90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m 36 |[39m     }[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:33:21)
          at Array.forEach (<anonymous>)
      at forEach (src/core/__tests__/ScoringScenarios.test.ts:32:24)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:48:9)

    console.error
      Player C: Stars=1, TotalPts=0, IsCochon=false

    [0m [90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
    [31m[1m>[22m[39m[90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 34 |[39m         })[33m;[39m
     [90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m 36 |[39m     }[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:33:21)
          at Array.forEach (<anonymous>)
      at forEach (src/core/__tests__/ScoringScenarios.test.ts:32:24)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:48:9)

    console.error
      Phase: MANCHE_END, MancheResult: CHIRE

    [0m [90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m 34 |[39m         })[33m;[39m
    [31m[1m>[22m[39m[90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 36 |[39m     }[33m;[39m
     [90m 37 |[39m
     [90m 38 |[39m     test([32m'1. Test Chirée'[39m[33m,[39m () [33m=>[39m {[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:35:17)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:48:9)

    console.log
      MANCHE WINNER: A

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      COCHON DETECTED! Count: 2

      at log (src/core/ScoringEngine.ts:101:21)

    console.error
      
      --- Test 2: Double Cochon (A wins) ---

    [0m [90m 29 |[39m     [90m// Helper to log clear results[39m
     [90m 30 |[39m     [36mconst[39m logResult [33m=[39m (title[33m:[39m string[33m,[39m result[33m:[39m [33mGameState[39m[33m,[39m expected[33m:[39m any) [33m=>[39m {
    [31m[1m>[22m[39m[90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
     [90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m 34 |[39m         })[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:31:17)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:74:9)

    console.error
      Player A: Stars=3, TotalPts=5, IsCochon=false

    [0m [90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
    [31m[1m>[22m[39m[90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 34 |[39m         })[33m;[39m
     [90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m 36 |[39m     }[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:33:21)
          at Array.forEach (<anonymous>)
      at forEach (src/core/__tests__/ScoringScenarios.test.ts:32:24)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:74:9)

    console.error
      Player B: Stars=0, TotalPts=-1, IsCochon=true

    [0m [90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
    [31m[1m>[22m[39m[90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 34 |[39m         })[33m;[39m
     [90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m 36 |[39m     }[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:33:21)
          at Array.forEach (<anonymous>)
      at forEach (src/core/__tests__/ScoringScenarios.test.ts:32:24)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:74:9)

    console.error
      Player C: Stars=0, TotalPts=-1, IsCochon=true

    [0m [90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
    [31m[1m>[22m[39m[90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 34 |[39m         })[33m;[39m
     [90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m 36 |[39m     }[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:33:21)
          at Array.forEach (<anonymous>)
      at forEach (src/core/__tests__/ScoringScenarios.test.ts:32:24)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:74:9)

    console.error
      Phase: MANCHE_END, MancheResult: COCHON

    [0m [90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m 34 |[39m         })[33m;[39m
    [31m[1m>[22m[39m[90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 36 |[39m     }[33m;[39m
     [90m 37 |[39m
     [90m 38 |[39m     test([32m'1. Test Chirée'[39m[33m,[39m () [33m=>[39m {[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:35:17)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:74:9)

    console.log
      MANCHE WINNER: A

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      COCHON DETECTED! Count: 1

      at log (src/core/ScoringEngine.ts:101:21)

    console.error
      
      --- Test 3: Simple Cochon (A wins) ---

    [0m [90m 29 |[39m     [90m// Helper to log clear results[39m
     [90m 30 |[39m     [36mconst[39m logResult [33m=[39m (title[33m:[39m string[33m,[39m result[33m:[39m [33mGameState[39m[33m,[39m expected[33m:[39m any) [33m=>[39m {
    [31m[1m>[22m[39m[90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
     [90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m 34 |[39m         })[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:31:17)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:99:9)

    console.error
      Player A: Stars=3, TotalPts=4, IsCochon=false

    [0m [90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
    [31m[1m>[22m[39m[90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 34 |[39m         })[33m;[39m
     [90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m 36 |[39m     }[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:33:21)
          at Array.forEach (<anonymous>)
      at forEach (src/core/__tests__/ScoringScenarios.test.ts:32:24)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:99:9)

    console.error
      Player B: Stars=1, TotalPts=0, IsCochon=false

    [0m [90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
    [31m[1m>[22m[39m[90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 34 |[39m         })[33m;[39m
     [90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m 36 |[39m     }[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:33:21)
          at Array.forEach (<anonymous>)
      at forEach (src/core/__tests__/ScoringScenarios.test.ts:32:24)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:99:9)

    console.error
      Player C: Stars=0, TotalPts=-1, IsCochon=true

    [0m [90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
    [31m[1m>[22m[39m[90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 34 |[39m         })[33m;[39m
     [90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m 36 |[39m     }[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:33:21)
          at Array.forEach (<anonymous>)
      at forEach (src/core/__tests__/ScoringScenarios.test.ts:32:24)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:99:9)

    console.error
      Phase: MANCHE_END, MancheResult: COCHON

    [0m [90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m 34 |[39m         })[33m;[39m
    [31m[1m>[22m[39m[90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 36 |[39m     }[33m;[39m
     [90m 37 |[39m
     [90m 38 |[39m     test([32m'1. Test Chirée'[39m[33m,[39m () [33m=>[39m {[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:35:17)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:99:9)

    console.error
      
      --- Test 4: Match NOT Over after round ---

    [0m [90m 29 |[39m     [90m// Helper to log clear results[39m
     [90m 30 |[39m     [36mconst[39m logResult [33m=[39m (title[33m:[39m string[33m,[39m result[33m:[39m [33mGameState[39m[33m,[39m expected[33m:[39m any) [33m=>[39m {
    [31m[1m>[22m[39m[90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
     [90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m 34 |[39m         })[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:31:17)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:135:9)

    console.error
      Player A: Stars=1, TotalPts=29, IsCochon=false

    [0m [90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
    [31m[1m>[22m[39m[90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 34 |[39m         })[33m;[39m
     [90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m 36 |[39m     }[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:33:21)
          at Array.forEach (<anonymous>)
      at forEach (src/core/__tests__/ScoringScenarios.test.ts:32:24)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:135:9)

    console.error
      Player B: Stars=0, TotalPts=10, IsCochon=false

    [0m [90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
    [31m[1m>[22m[39m[90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 34 |[39m         })[33m;[39m
     [90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m 36 |[39m     }[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:33:21)
          at Array.forEach (<anonymous>)
      at forEach (src/core/__tests__/ScoringScenarios.test.ts:32:24)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:135:9)

    console.error
      Player C: Stars=0, TotalPts=10, IsCochon=false

    [0m [90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
    [31m[1m>[22m[39m[90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 34 |[39m         })[33m;[39m
     [90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m 36 |[39m     }[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:33:21)
          at Array.forEach (<anonymous>)
      at forEach (src/core/__tests__/ScoringScenarios.test.ts:32:24)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:135:9)

    console.error
      Phase: PARTIE_END, MancheResult: null

    [0m [90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m 34 |[39m         })[33m;[39m
    [31m[1m>[22m[39m[90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 36 |[39m     }[33m;[39m
     [90m 37 |[39m
     [90m 38 |[39m     test([32m'1. Test Chirée'[39m[33m,[39m () [33m=>[39m {[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:35:17)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:135:9)

    console.log
      MANCHE WINNER: A

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      COCHON DETECTED! Count: 2

      at log (src/core/ScoringEngine.ts:101:21)

    console.error
      
      --- Test 5: Match Over at Manche End ---

    [0m [90m 29 |[39m     [90m// Helper to log clear results[39m
     [90m 30 |[39m     [36mconst[39m logResult [33m=[39m (title[33m:[39m string[33m,[39m result[33m:[39m [33mGameState[39m[33m,[39m expected[33m:[39m any) [33m=>[39m {
    [31m[1m>[22m[39m[90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
     [90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m 34 |[39m         })[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:31:17)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:153:9)

    console.error
      Player A: Stars=3, TotalPts=34, IsCochon=false

    [0m [90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
    [31m[1m>[22m[39m[90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 34 |[39m         })[33m;[39m
     [90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m 36 |[39m     }[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:33:21)
          at Array.forEach (<anonymous>)
      at forEach (src/core/__tests__/ScoringScenarios.test.ts:32:24)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:153:9)

    console.error
      Player B: Stars=0, TotalPts=9, IsCochon=true

    [0m [90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
    [31m[1m>[22m[39m[90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 34 |[39m         })[33m;[39m
     [90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m 36 |[39m     }[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:33:21)
          at Array.forEach (<anonymous>)
      at forEach (src/core/__tests__/ScoringScenarios.test.ts:32:24)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:153:9)

    console.error
      Player C: Stars=0, TotalPts=9, IsCochon=true

    [0m [90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
    [31m[1m>[22m[39m[90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 34 |[39m         })[33m;[39m
     [90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m 36 |[39m     }[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:33:21)
          at Array.forEach (<anonymous>)
      at forEach (src/core/__tests__/ScoringScenarios.test.ts:32:24)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:153:9)

    console.error
      Phase: MATCH_END, MancheResult: COCHON

    [0m [90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m 34 |[39m         })[33m;[39m
    [31m[1m>[22m[39m[90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 36 |[39m     }[33m;[39m
     [90m 37 |[39m
     [90m 38 |[39m     test([32m'1. Test Chirée'[39m[33m,[39m () [33m=>[39m {[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:35:17)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:153:9)

    console.log
      MANCHE WINNER: A

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      COCHON DETECTED! Count: 2

      at log (src/core/ScoringEngine.ts:101:21)

    console.log
      MANCHE WINNER: A

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      COCHON DETECTED! Count: 1

      at log (src/core/ScoringEngine.ts:101:21)

    console.log
      TIE AT THRESHOLD (30)! Continuing for another manche...

      at log (src/core/ScoringEngine.ts:179:29)

    console.error
      
      --- Test 7: Tie-Breaker (A and B at 30) ---

    [0m [90m 29 |[39m     [90m// Helper to log clear results[39m
     [90m 30 |[39m     [36mconst[39m logResult [33m=[39m (title[33m:[39m string[33m,[39m result[33m:[39m [33mGameState[39m[33m,[39m expected[33m:[39m any) [33m=>[39m {
    [31m[1m>[22m[39m[90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
     [90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m 34 |[39m         })[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:31:17)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:188:9)

    console.error
      Player A: Stars=3, TotalPts=30, IsCochon=false

    [0m [90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
    [31m[1m>[22m[39m[90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 34 |[39m         })[33m;[39m
     [90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m 36 |[39m     }[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:33:21)
          at Array.forEach (<anonymous>)
      at forEach (src/core/__tests__/ScoringScenarios.test.ts:32:24)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:188:9)

    console.error
      Player B: Stars=1, TotalPts=30, IsCochon=false

    [0m [90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
    [31m[1m>[22m[39m[90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 34 |[39m         })[33m;[39m
     [90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m 36 |[39m     }[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:33:21)
          at Array.forEach (<anonymous>)
      at forEach (src/core/__tests__/ScoringScenarios.test.ts:32:24)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:188:9)

    console.error
      Player C: Stars=0, TotalPts=9, IsCochon=true

    [0m [90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
    [31m[1m>[22m[39m[90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 34 |[39m         })[33m;[39m
     [90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m 36 |[39m     }[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:33:21)
          at Array.forEach (<anonymous>)
      at forEach (src/core/__tests__/ScoringScenarios.test.ts:32:24)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:188:9)

    console.error
      Phase: MANCHE_END, MancheResult: COCHON

    [0m [90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m 34 |[39m         })[33m;[39m
    [31m[1m>[22m[39m[90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 36 |[39m     }[33m;[39m
     [90m 37 |[39m
     [90m 38 |[39m     test([32m'1. Test Chirée'[39m[33m,[39m () [33m=>[39m {[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:35:17)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:188:9)

    console.log
      MANCHE WINNER: A

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      COCHON DETECTED! Count: 2

      at log (src/core/ScoringEngine.ts:101:21)

    console.error
      
      --- Test 8: Boudé resolved (A wins, Double Cochon) ---

    [0m [90m 29 |[39m     [90m// Helper to log clear results[39m
     [90m 30 |[39m     [36mconst[39m logResult [33m=[39m (title[33m:[39m string[33m,[39m result[33m:[39m [33mGameState[39m[33m,[39m expected[33m:[39m any) [33m=>[39m {
    [31m[1m>[22m[39m[90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
     [90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m 34 |[39m         })[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:31:17)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:220:9)

    console.error
      Player A: Stars=3, TotalPts=5, IsCochon=false

    [0m [90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
    [31m[1m>[22m[39m[90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 34 |[39m         })[33m;[39m
     [90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m 36 |[39m     }[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:33:21)
          at Array.forEach (<anonymous>)
      at forEach (src/core/__tests__/ScoringScenarios.test.ts:32:24)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:220:9)

    console.error
      Player B: Stars=0, TotalPts=-1, IsCochon=true

    [0m [90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
    [31m[1m>[22m[39m[90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 34 |[39m         })[33m;[39m
     [90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m 36 |[39m     }[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:33:21)
          at Array.forEach (<anonymous>)
      at forEach (src/core/__tests__/ScoringScenarios.test.ts:32:24)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:220:9)

    console.error
      Player C: Stars=0, TotalPts=-1, IsCochon=true

    [0m [90m 31 |[39m         console[33m.[39merror([32m`\n--- ${title} ---`[39m)[33m;[39m
     [90m 32 |[39m         result[33m.[39mplayers[33m.[39mforEach(p [33m=>[39m {
    [31m[1m>[22m[39m[90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 34 |[39m         })[33m;[39m
     [90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m 36 |[39m     }[33m;[39m[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:33:21)
          at Array.forEach (<anonymous>)
      at forEach (src/core/__tests__/ScoringScenarios.test.ts:32:24)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:220:9)

    console.error
      Phase: MANCHE_END, MancheResult: COCHON

    [0m [90m 33 |[39m             console[33m.[39merror([32m`Player ${p.id}: Stars=${p.currentMancheStars}, TotalPts=${p.totalPoints}, IsCochon=${p.isCochon}`[39m)[33m;[39m
     [90m 34 |[39m         })[33m;[39m
    [31m[1m>[22m[39m[90m 35 |[39m         console[33m.[39merror([32m`Phase: ${result.phase}, MancheResult: ${result.mancheResult}`[39m)[33m;[39m
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 36 |[39m     }[33m;[39m
     [90m 37 |[39m
     [90m 38 |[39m     test([32m'1. Test Chirée'[39m[33m,[39m () [33m=>[39m {[0m

      at error (src/core/__tests__/ScoringScenarios.test.ts:35:17)
      at Object.logResult (src/core/__tests__/ScoringScenarios.test.ts:220:9)

  ● Scoring Verification › 4. Test Match NOT Over after round win (must wait for manche end)

    expect(received).toBe(expected) // Object.is equality

    Expected: 30
    Received: 29

    [0m [90m 136 |[39m
     [90m 137 |[39m         [36mconst[39m playerA [33m=[39m newState[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m [32m'A'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 138 |[39m         expect(playerA[33m?[39m[33m.[39mtotalPoints)[33m.[39mtoBe([35m30[39m)[33m;[39m
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 139 |[39m         expect(newState[33m.[39mphase)[33m.[39mtoBe([32m'PARTIE_END'[39m)[33m;[39m [90m// Deferred until manche winner or chira[39m
     [90m 140 |[39m     })[33m;[39m
     [90m 141 |[39m[0m

      at Object.toBe (src/core/__tests__/ScoringScenarios.test.ts:138:38)

  ● Scoring Verification › 5. Test Match Over at Manche End

    expect(received).toBe(expected) // Object.is equality

    Expected: 30
    Received: 34

    [0m [90m 154 |[39m
     [90m 155 |[39m         [36mconst[39m playerA [33m=[39m newState[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m [32m'A'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 156 |[39m         expect(playerA[33m?[39m[33m.[39mtotalPoints)[33m.[39mtoBe([35m30[39m)[33m;[39m
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 157 |[39m         expect(newState[33m.[39mphase)[33m.[39mtoBe([32m'MATCH_END'[39m)[33m;[39m
     [90m 158 |[39m     })[33m;[39m
     [90m 159 |[39m[0m

      at Object.toBe (src/core/__tests__/ScoringScenarios.test.ts:156:38)

  ● Scoring Verification › 8. Test resolveBoude with Cochon scoring

    expect(received).toBe(expected) // Object.is equality

    Expected: 3
    Received: 5

    [0m [90m 223 |[39m         [90m// A should get 1 (win) + 2 (cochons) = 3 total points.[39m
     [90m 224 |[39m         [36mconst[39m playerA [33m=[39m newState[33m.[39mplayers[33m.[39mfind((p[33m:[39m [33mPlayer[39m) [33m=>[39m p[33m.[39mid [33m===[39m [32m'A'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 225 |[39m         expect(playerA[33m?[39m[33m.[39mtotalPoints)[33m.[39mtoBe([35m3[39m)[33m;[39m
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 226 |[39m         [90m// Phase should be MATCH_END if winningCondition is 3 ? Wait, default winningCondition is 30.[39m
     [90m 227 |[39m         [90m// It should be MANCHE_END because A reaches 3 stars.[39m
     [90m 228 |[39m         expect(newState[33m.[39mphase)[33m.[39mtoBe([32m'MANCHE_END'[39m)[33m;[39m[0m

      at Object.toBe (src/core/__tests__/ScoringScenarios.test.ts:225:38)

FAIL src/hooks/game/__tests__/useGameEngine.test.tsx
  ● Console

    console.error
      [ActionDispatcher] Erreur durant l'action: Error: Player has valid moves, cannot pass
          at passTurn (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\src\core\LogicEngine.ts:389:15)
          at Object.<anonymous> (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\src\hooks\game\useActionDispatcher.ts:90:40)
          at Generator.next (<anonymous>)
          at asyncGeneratorStep (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\@babel\runtime\helpers\asyncToGenerator.js:3:17)
          at _next (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\@babel\runtime\helpers\asyncToGenerator.js:17:9)
          at E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\@babel\runtime\helpers\asyncToGenerator.js:22:7
          at new Promise (<anonymous>)
          at Object.<anonymous> (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\@babel\runtime\helpers\asyncToGenerator.js:14:12)
          at Object.apply [as current] (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\src\hooks\game\useActionDispatcher.ts:179:6)
          at current (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\src\hooks\game\useAutoPass.ts:76:29)
          at callTimer (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\@sinonjs\fake-timers\src\fake-timers-src.js:744:24)
          at doTickInner (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\@sinonjs\fake-timers\src\fake-timers-src.js:1312:29)
          at doTick (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\@sinonjs\fake-timers\src\fake-timers-src.js:1393:20)
          at Object.tick (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\@sinonjs\fake-timers\src\fake-timers-src.js:1401:20)
          at Object.runToLast (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\@sinonjs\fake-timers\src\fake-timers-src.js:1558:26)
          at FakeTimers.runOnlyPendingTimers (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\@jest\fake-timers\build\modernFakeTimers.js:60:19)
          at Object.runOnlyPendingTimers (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\jest-runtime\build\index.js:2136:52)
          at Object.runOnlyPendingTimers (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\src\hooks\game\__tests__\useGameEngine.test.tsx:35:14)
          at Promise.then.completed (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\jest-circus\build\utils.js:298:28)
          at new Promise (<anonymous>)
          at callAsyncCircusFn (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\jest-circus\build\utils.js:231:10)
          at _callCircusHook (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\jest-circus\build\run.js:281:40)
          at _runTest (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\jest-circus\build\run.js:254:5)
          at _runTestsForDescribeBlock (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\jest-circus\build\run.js:126:9)
          at _runTestsForDescribeBlock (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\jest-circus\build\run.js:121:9)
          at run (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\jest-circus\build\run.js:71:3)
          at runAndTransformResultsToJestFormat (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapterInit.js:122:21)
          at jestAdapter (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:79:19)
          at runTestInternal (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\jest-runner\build\runTest.js:367:16)
          at runTest (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\jest-runner\build\runTest.js:444:34)
          at Object.worker (E:\HAPPYAGENCY\00 Clients\00 En cours\Manuel\code src\react-native\mobile\node_modules\jest-runner\build\testWorker.js:106:12)

    [0m [90m 171 |[39m             }
     [90m 172 |[39m         } [36mcatch[39m (e) {
    [31m[1m>[22m[39m[90m 173 |[39m             console[33m.[39merror([32m'[ActionDispatcher] Erreur durant l\'action:'[39m[33m,[39m e)[33m;[39m
     [90m     |[39m                     [31m[1m^[22m[39m
     [90m 174 |[39m         } [36mfinally[39m {
     [90m 175 |[39m             [90m// Toujours libérer le verrou à la fin de l'action, qu'elle réussisse ou échoue ![39m
     [90m 176 |[39m             releaseLock()[33m;[39m[0m

      at Object.error (src/hooks/game/useActionDispatcher.ts:173:21)
      at asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
      at _next (node_modules/@babel/runtime/helpers/asyncToGenerator.js:17:9)
      at node_modules/@babel/runtime/helpers/asyncToGenerator.js:22:7
      at Object.<anonymous> (node_modules/@babel/runtime/helpers/asyncToGenerator.js:14:12)
      at Object.apply [as current] (src/hooks/game/useActionDispatcher.ts:179:6)
      at current (src/hooks/game/useAutoPass.ts:76:29)
      at callTimer (node_modules/@sinonjs/fake-timers/src/fake-timers-src.js:744:24)
      at doTickInner (node_modules/@sinonjs/fake-timers/src/fake-timers-src.js:1312:29)
      at doTick (node_modules/@sinonjs/fake-timers/src/fake-timers-src.js:1393:20)
      at Object.tick (node_modules/@sinonjs/fake-timers/src/fake-timers-src.js:1401:20)
      at Object.runToLast (node_modules/@sinonjs/fake-timers/src/fake-timers-src.js:1558:26)
      at FakeTimers.runOnlyPendingTimers (node_modules/@jest/fake-timers/build/modernFakeTimers.js:60:19)
      at Object.runOnlyPendingTimers (src/hooks/game/__tests__/useGameEngine.test.tsx:35:14)

  ● useGameEngine Hook (Component Wrapper) › handles playing a domino successfully

    TypeError: getByTestId(...).props.onPress is not a function

    [0m [90m 88 |[39m
     [90m 89 |[39m         [36mawait[39m act([36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 90 |[39m             getByTestId([32m'play'[39m)[33m.[39mprops[33m.[39monPress()[33m;[39m
     [90m    |[39m                                       [31m[1m^[22m[39m
     [90m 91 |[39m         })[33m;[39m
     [90m 92 |[39m
     [90m 93 |[39m         expect(mockOnTilePlayed)[33m.[39mtoHaveBeenCalled()[33m;[39m[0m

      at onPress (src/hooks/game/__tests__/useGameEngine.test.tsx:90:39)
      at asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
      at _next (node_modules/@babel/runtime/helpers/asyncToGenerator.js:17:9)
      at node_modules/@babel/runtime/helpers/asyncToGenerator.js:22:7
      at node_modules/@babel/runtime/helpers/asyncToGenerator.js:14:12
      at callback (node_modules/@testing-library/react-native/src/act.ts:31:24)
      at Object.<anonymous>.process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:789:22)
      at actImplementation (node_modules/@testing-library/react-native/src/act.ts:30:25)
      at Object.<anonymous> (src/hooks/game/__tests__/useGameEngine.test.tsx:89:18)
      at asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
      at _next (node_modules/@babel/runtime/helpers/asyncToGenerator.js:17:9)
      at node_modules/@babel/runtime/helpers/asyncToGenerator.js:22:7
      at Object.<anonymous> (node_modules/@babel/runtime/helpers/asyncToGenerator.js:14:12)

  ● useGameEngine Hook (Component Wrapper) › blocks manual pass if valid moves exist

    TypeError: getByTestId(...).props.onPress is not a function

    [0m [90m 104 |[39m
     [90m 105 |[39m         [36mawait[39m act([36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 106 |[39m             getByTestId([32m'pass'[39m)[33m.[39mprops[33m.[39monPress()[33m;[39m
     [90m     |[39m                                       [31m[1m^[22m[39m
     [90m 107 |[39m         })[33m;[39m
     [90m 108 |[39m
     [90m 109 |[39m         expect([33mDominoEngine[39m[33m.[39mpassTurn)[33m.[39mnot[33m.[39mtoHaveBeenCalled()[33m;[39m[0m

      at onPress (src/hooks/game/__tests__/useGameEngine.test.tsx:106:39)
      at asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
      at _next (node_modules/@babel/runtime/helpers/asyncToGenerator.js:17:9)
      at node_modules/@babel/runtime/helpers/asyncToGenerator.js:22:7
      at node_modules/@babel/runtime/helpers/asyncToGenerator.js:14:12
      at callback (node_modules/@testing-library/react-native/src/act.ts:31:24)
      at Object.<anonymous>.process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:789:22)
      at actImplementation (node_modules/@testing-library/react-native/src/act.ts:30:25)
      at Object.<anonymous> (src/hooks/game/__tests__/useGameEngine.test.tsx:105:18)
      at asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
      at _next (node_modules/@babel/runtime/helpers/asyncToGenerator.js:17:9)
      at node_modules/@babel/runtime/helpers/asyncToGenerator.js:22:7
      at Object.<anonymous> (node_modules/@babel/runtime/helpers/asyncToGenerator.js:14:12)

  ● useGameEngine Hook (Component Wrapper) › allows manual pass if no valid moves exist

    TypeError: getByTestId(...).props.onPress is not a function

    [0m [90m 118 |[39m
     [90m 119 |[39m         [36mawait[39m act([36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 120 |[39m             getByTestId([32m'pass'[39m)[33m.[39mprops[33m.[39monPress()[33m;[39m
     [90m     |[39m                                       [31m[1m^[22m[39m
     [90m 121 |[39m         })[33m;[39m
     [90m 122 |[39m
     [90m 123 |[39m         expect([33mDominoEngine[39m[33m.[39mpassTurn)[33m.[39mtoHaveBeenCalled()[33m;[39m[0m

      at onPress (src/hooks/game/__tests__/useGameEngine.test.tsx:120:39)
      at asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
      at _next (node_modules/@babel/runtime/helpers/asyncToGenerator.js:17:9)
      at node_modules/@babel/runtime/helpers/asyncToGenerator.js:22:7
      at node_modules/@babel/runtime/helpers/asyncToGenerator.js:14:12
      at callback (node_modules/@testing-library/react-native/src/act.ts:31:24)
      at Object.<anonymous>.process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:789:22)
      at actImplementation (node_modules/@testing-library/react-native/src/act.ts:30:25)
      at Object.<anonymous> (src/hooks/game/__tests__/useGameEngine.test.tsx:119:18)
      at asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
      at _next (node_modules/@babel/runtime/helpers/asyncToGenerator.js:17:9)
      at node_modules/@babel/runtime/helpers/asyncToGenerator.js:22:7
      at Object.<anonymous> (node_modules/@babel/runtime/helpers/asyncToGenerator.js:14:12)

FAIL src/__tests__/MultiplayerLogic.test.ts
  ● Console

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      COCHON DETECTED! Count: 2

      at log (src/core/ScoringEngine.ts:101:21)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      COCHON DETECTED! Count: 2

      at log (src/core/ScoringEngine.ts:101:21)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      COCHON DETECTED! Count: 1

      at log (src/core/ScoringEngine.ts:101:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      Manche finished normally.

      at log (src/core/ScoringEngine.ts:104:21)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      COCHON DETECTED! Count: 2

      at log (src/core/ScoringEngine.ts:101:21)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      COCHON DETECTED! Count: 1

      at log (src/core/ScoringEngine.ts:101:21)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      COCHON DETECTED! Count: 2

      at log (src/core/ScoringEngine.ts:101:21)

  ● Multiplayer Game Logic & Rules Verification › Scoring & Game Modes › Mode MANCHE: Match ends at correct winningCondition (mancheWins)

    expect(received).toBe(expected) // Object.is equality

    Expected: "MATCH_END"
    Received: "MANCHE_END"

    [0m [90m 31 |[39m
     [90m 32 |[39m             expect(newState[33m.[39mplayers[[35m0[39m][33m.[39mmancheWins)[33m.[39mtoBe([35m3[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 33 |[39m             expect(newState[33m.[39mphase)[33m.[39mtoBe([32m'MATCH_END'[39m)[33m;[39m
     [90m    |[39m                                    [31m[1m^[22m[39m
     [90m 34 |[39m             expect(newState[33m.[39mmancheResult)[33m.[39mtoBe([32m'COCHON'[39m)[33m;[39m [90m// Assuming others had 0 wins (default in mock)[39m
     [90m 35 |[39m         })[33m;[39m
     [90m 36 |[39m[0m

      at Object.toBe (src/__tests__/MultiplayerLogic.test.ts:33:36)

  ● Multiplayer Game Logic & Rules Verification › Scoring & Game Modes › Mode COCHON: totalCochons increments and triggers Match End

    expect(received).toBe(expected) // Object.is equality

    Expected: 2
    Received: 1

    [0m [90m 56 |[39m             [36mconst[39m newState [33m=[39m handleEndOfRound(state[33m,[39m [32m'p1'[39m)[33m;[39m
     [90m 57 |[39m
    [31m[1m>[22m[39m[90m 58 |[39m             expect(newState[33m.[39mplayers[[35m1[39m][33m.[39mtotalCochons)[33m.[39mtoBe([35m2[39m)[33m;[39m
     [90m    |[39m                                                      [31m[1m^[22m[39m
     [90m 59 |[39m             expect(newState[33m.[39mphase)[33m.[39mtoBe([32m'MATCH_END'[39m)[33m;[39m
     [90m 60 |[39m         })[33m;[39m
     [90m 61 |[39m[0m

      at Object.toBe (src/__tests__/MultiplayerLogic.test.ts:58:54)

  ● Multiplayer Game Logic & Rules Verification › Martinique Rules (Chiré, Cochon, 3-Round Rule) › CHIRE: Occurs when everyone has at least one win

    expect(received).toBe(expected) // Object.is equality

    Expected: "CHIRE"
    Received: "NORMAL"

    [0m [90m 73 |[39m             [36mconst[39m newState [33m=[39m handleEndOfRound(state[33m,[39m [32m'p1'[39m)[33m;[39m
     [90m 74 |[39m
    [31m[1m>[22m[39m[90m 75 |[39m             expect(newState[33m.[39mmancheResult)[33m.[39mtoBe([32m'CHIRE'[39m)[33m;[39m
     [90m    |[39m                                           [31m[1m^[22m[39m
     [90m 76 |[39m             expect(newState[33m.[39mplayers[[35m0[39m][33m.[39mtotalPoints)[33m.[39mtoBe([35m0[39m)[33m;[39m [90m// No points awarded in Chiré[39m
     [90m 77 |[39m             expect(newState[33m.[39mphase)[33m.[39mtoBe([32m'MANCHE_END'[39m)[33m;[39m
     [90m 78 |[39m         })[33m;[39m[0m

      at Object.toBe (src/__tests__/MultiplayerLogic.test.ts:75:43)

FAIL src/core/__tests__/GameStressTest.test.ts
  ● Console

    console.log
      MANCHE WINNER: bot-2

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      COCHON DETECTED! Count: 2

      at log (src/core/ScoringEngine.ts:101:21)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

  ● LogicEngine Stress Test (500 parties automatiques) › devrait terminer 500 parties sans boucle infinie

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: false

    [0m [90m 73 |[39m             [90m// On vérifie que quelqu'un a atteint le winningCondition (Normalement oui si MATCH_END)[39m
     [90m 74 |[39m             [36mconst[39m hasWinner [33m=[39m state[33m.[39mplayers[33m.[39msome(p [33m=>[39m p[33m.[39mmancheWins [33m>=[39m state[33m.[39mwinningCondition)[33m;[39m
    [31m[1m>[22m[39m[90m 75 |[39m             expect(hasWinner)[33m.[39mtoBe([36mtrue[39m)[33m;[39m
     [90m    |[39m                               [31m[1m^[22m[39m
     [90m 76 |[39m
     [90m 77 |[39m             [90m// "vérifie que le score du gagnant est cohérent avec la somme des points restants dans les mains des adversaires"[39m
     [90m 78 |[39m             [90m// Dans ce jeu, state.mancheResult dit peut-être CHIRE. On vérifie juste qu'il y a des points[39m[0m

      at toBe (src/core/__tests__/GameStressTest.test.ts:75:31)
      at Object._loop (src/core/__tests__/GameStressTest.test.ts:15:47)

FAIL src/core/DominoEngine.test.ts
  ● DominoEngine Migration (Phase 1.4) › Intelligence Valou : Priorité aux doubles pour commencer

    expect(received).toBe(expected) // Object.is equality

    Expected: "2"
    Received: "1"

    [0m [90m 86 |[39m         ][33m;[39m
     [90m 87 |[39m         [36mconst[39m decision [33m=[39m getBotMove(hand[33m,[39m [36mnull[39m[33m,[39m [32m'valou_legend'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 88 |[39m         expect(decision[33m?[39m[33m.[39mtile[33m.[39mid)[33m.[39mtoBe([32m'2'[39m)[33m;[39m
     [90m    |[39m                                   [31m[1m^[22m[39m
     [90m 89 |[39m     })[33m;[39m
     [90m 90 |[39m
     [90m 91 |[39m })[33m;[39m[0m

      at Object.toBe (src/core/DominoEngine.test.ts:88:35)

PASS src/core/__tests__/ManualSimulation.test.ts
  ● Console

    console.log
      
      Scenario 1: Input Score 2-1-0 + Winner P3 (Final 2-1-1)

      at Object.log (src/core/__tests__/ManualSimulation.test.ts:31:17)

    console.log
      CHIRÉE DETECTED! Manche ends, manche increments.

      at log (src/core/ScoringEngine.ts:63:17)

    console.log
      Final Wins: P1: 2, P2: 1, P3: 1

      at Object.log (src/core/__tests__/ManualSimulation.test.ts:46:17)

    console.log
      Phase: MANCHE_END

      at Object.log (src/core/__tests__/ManualSimulation.test.ts:47:17)

    console.log
      Result Type: CHIRE

      at Object.log (src/core/__tests__/ManualSimulation.test.ts:48:17)

    console.log
      
      Scenario 2: Input Score 2-0-0 + Winner P1 (Final 3-0-0)

      at Object.log (src/core/__tests__/ManualSimulation.test.ts:63:17)

    console.log
      MANCHE WINNER: p1

      at log (src/core/ScoringEngine.ts:95:17)

    console.log
      COCHON DETECTED! Count: 2

      at log (src/core/ScoringEngine.ts:101:21)

    console.log
      Final Wins: P1: 3, P2: 0, P3: 0

      at Object.log (src/core/__tests__/ManualSimulation.test.ts:76:17)

    console.log
      Result Type: COCHON

      at Object.log (src/core/__tests__/ManualSimulation.test.ts:77:17)

    console.log
      Points Awarded (TotalPoints): P1: 5, P2: -1, P3: -1

      at Object.log (src/core/__tests__/ManualSimulation.test.ts:78:17)

    console.log
      
      Scenario 3: Input Score 1-1-0 + Winner P1 (Final 2-1-0)

      at Object.log (src/core/__tests__/ManualSimulation.test.ts:111:17)

    console.log
      Final Wins: P1: 2, P2: 1, P3: 0

      at Object.log (src/core/__tests__/ManualSimulation.test.ts:127:17)

    console.log
      Phase: PARTIE_END

      at Object.log (src/core/__tests__/ManualSimulation.test.ts:128:17)

PASS src/components/game/__tests__/ActionFooter.test.tsx
PASS src/core/__tests__/LogicEngine.test.ts
PASS src/core/__tests__/BotEngine.test.ts
FAIL src/components/game/__tests__/GameHeader.test.tsx
  ● Console

    console.error
      An update to Icon inside a test was not wrapped in act(...).
      
      When testing, code that causes React state updates should be wrapped into act(...):
      
      act(() => {
        /* fire events that update state */
      });
      /* assert on the output */
      
      This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

      at node_modules/react-test-renderer/cjs/react-test-renderer.development.js:11801:19
      at runWithFiberInDEV (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:1574:13)
      at warnIfUpdatesNotWrappedWithActDEV (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:11800:9)
      at scheduleUpdateOnFiber (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:10326:9)
      at Object.enqueueSetState (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:14179:14)
      at Icon.Object.<anonymous>.process.env.NODE_ENV.Component.setState (node_modules/react/cjs/react.development.js:632:20)
      at Icon.setState (node_modules/@expo/vector-icons/src/createIconSet.tsx:181:31)
      at asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
      at _next (node_modules/@babel/runtime/helpers/asyncToGenerator.js:17:9)

  ● GameHeader Component › renders correctly when phase is PLAYING

    Unable to find an element with text: 🏆 Manche · Obj: 3 manches

    [36m<View[39m
      [33mtestID[39m=[32m"game-header"[39m
    [36m>[39m
      [36m<View>[39m
        [36m<Text>[39m
          [0m3 Victoires[0m
        [36m</Text>[39m
      [36m</View>[39m
      [36m<View>[39m
        [36m<Text>[39m
          [0mM[0m
          [0m1[0m
          [0m / R[0m
          [0m2[0m
        [36m</Text>[39m
      [36m</View>[39m
      [36m<View>[39m
        [36m<View[39m
          [33maccessible[39m=[32m{true}[39m
          [33mtestID[39m=[32m"btn-pause"[39m
        [36m>[39m
          [36m<Text />[39m
        [36m</View>[39m
      [36m</View>[39m
    [36m</View>[39m

    [0m [90m 32 |[39m         [36mconst[39m { getByText } [33m=[39m render([33m<[39m[33mGameHeader[39m {[33m...[39mdefaultProps} [33m/[39m[33m>[39m)[33m;[39m
     [90m 33 |[39m
    [31m[1m>[22m[39m[90m 34 |[39m         expect(getByText([32m'🏆 Manche · Obj: 3 manches'[39m))[33m.[39mtoBeTruthy()[33m;[39m
     [90m    |[39m                [31m[1m^[22m[39m
     [90m 35 |[39m         expect(getByText([32m'M1 / R2'[39m))[33m.[39mtoBeTruthy()[33m;[39m
     [90m 36 |[39m     })[33m;[39m
     [90m 37 |[39m[0m

      at Object.getByText (src/components/game/__tests__/GameHeader.test.tsx:34:16)

  ● GameHeader Component › calls onToggleSound when sound button is pressed

    Unable to find an element with testID: btn-sound

    [36m<View[39m
      [33mtestID[39m=[32m"game-header"[39m
    [36m>[39m
      [36m<View>[39m
        [36m<Text>[39m
          [0m3 Victoires[0m
        [36m</Text>[39m
      [36m</View>[39m
      [36m<View>[39m
        [36m<Text>[39m
          [0mM[0m
          [0m1[0m
          [0m / R[0m
          [0m2[0m
        [36m</Text>[39m
      [36m</View>[39m
      [36m<View>[39m
        [36m<View[39m
          [33maccessible[39m=[32m{true}[39m
          [33mtestID[39m=[32m"btn-pause"[39m
        [36m>[39m
          [36m<Text>[39m
            [0m[0m
          [36m</Text>[39m
        [36m</View>[39m
      [36m</View>[39m
    [36m</View>[39m

    [0m [90m 70 |[39m         [36mconst[39m { getByTestId } [33m=[39m render([33m<[39m[33mGameHeader[39m {[33m...[39mdefaultProps} [33m/[39m[33m>[39m)[33m;[39m
     [90m 71 |[39m
    [31m[1m>[22m[39m[90m 72 |[39m         fireEvent[33m.[39mpress(getByTestId([32m'btn-sound'[39m))[33m;[39m
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 73 |[39m         expect(defaultProps[33m.[39monToggleSound)[33m.[39mtoHaveBeenCalledTimes([35m1[39m)[33m;[39m
     [90m 74 |[39m     })[33m;[39m
     [90m 75 |[39m[0m

      at Object.getByTestId (src/components/game/__tests__/GameHeader.test.tsx:72:25)

  ● GameHeader Component › calls onOpenSettings when settings button is pressed

    Unable to find an element with testID: btn-settings

    [36m<View[39m
      [33mtestID[39m=[32m"game-header"[39m
    [36m>[39m
      [36m<View>[39m
        [36m<Text>[39m
          [0m3 Victoires[0m
        [36m</Text>[39m
      [36m</View>[39m
      [36m<View>[39m
        [36m<Text>[39m
          [0mM[0m
          [0m1[0m
          [0m / R[0m
          [0m2[0m
        [36m</Text>[39m
      [36m</View>[39m
      [36m<View>[39m
        [36m<View[39m
          [33maccessible[39m=[32m{true}[39m
          [33mtestID[39m=[32m"btn-pause"[39m
        [36m>[39m
          [36m<Text>[39m
            [0m[0m
          [36m</Text>[39m
        [36m</View>[39m
      [36m</View>[39m
    [36m</View>[39m

    [0m [90m 77 |[39m         [36mconst[39m { getByTestId } [33m=[39m render([33m<[39m[33mGameHeader[39m {[33m...[39mdefaultProps} [33m/[39m[33m>[39m)[33m;[39m
     [90m 78 |[39m
    [31m[1m>[22m[39m[90m 79 |[39m         fireEvent[33m.[39mpress(getByTestId([32m'btn-settings'[39m))[33m;[39m
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 80 |[39m         expect(defaultProps[33m.[39monOpenSettings)[33m.[39mtoHaveBeenCalledTimes([35m1[39m)[33m;[39m
     [90m 81 |[39m     })[33m;[39m
     [90m 82 |[39m })[33m;[39m[0m

      at Object.getByTestId (src/components/game/__tests__/GameHeader.test.tsx:79:25)

PASS src/core/BoudeRules.test.ts
FAIL src/hooks/game/__tests__/testUtils.ts
  ● Test suite failed to run

    Your test suite must contain at least one test.

      at onResult (node_modules/@jest/core/build/TestScheduler.js:133:18)
      at node_modules/@jest/core/build/TestScheduler.js:254:19
      at node_modules/emittery/index.js:363:13
          at Array.map (<anonymous>)
      at Emittery.emit (node_modules/emittery/index.js:361:23)

FAIL src/components/game/__tests__/GameOverlays.test.tsx (6.486 s)
  ● Console

    console.error
      An update to Icon inside a test was not wrapped in act(...).
      
      When testing, code that causes React state updates should be wrapped into act(...):
      
      act(() => {
        /* fire events that update state */
      });
      /* assert on the output */
      
      This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

      at node_modules/react-test-renderer/cjs/react-test-renderer.development.js:11801:19
      at runWithFiberInDEV (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:1574:13)
      at warnIfUpdatesNotWrappedWithActDEV (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:11800:9)
      at scheduleUpdateOnFiber (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:10326:9)
      at Object.enqueueSetState (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:14179:14)
      at Icon.Object.<anonymous>.process.env.NODE_ENV.Component.setState (node_modules/react/cjs/react.development.js:632:20)
      at Icon.setState (node_modules/@expo/vector-icons/src/createIconSet.tsx:181:31)
      at asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
      at _next (node_modules/@babel/runtime/helpers/asyncToGenerator.js:17:9)

  ● GameOverlays Component › calls onLeaveRoom when quit button is pressed inside pause overlay

    Unable to find an element with testID: btn-quit

    [36m<View[39m
      [33mpointerEvents[39m=[32m"box-none"[39m
      [33mtestID[39m=[32m"game-overlays"[39m
    [36m>[39m
      [36m<View[39m
        [33mtestID[39m=[32m"pause-overlay"[39m
      [36m>[39m
        [36m<View[39m
          [33mnativeID[39m=[32m"3"[39m
        [36m>[39m
          [36m<Text>[39m
            [0m[0m
          [36m</Text>[39m
          [36m<Text>[39m
            [0mPAUSE[0m
          [36m</Text>[39m
          [36m<View[39m
            [33maccessible[39m=[32m{true}[39m
            [33mtestID[39m=[32m"btn-resume"[39m
          [36m>[39m
            [36m<Text>[39m
              [0mREPRENDRE[0m
            [36m</Text>[39m
          [36m</View>[39m
        [36m</View>[39m
      [36m</View>[39m
    [36m</View>[39m

    [0m [90m 66 |[39m             [33m<[39m[33mGameOverlays[39m {[33m...[39mdefaultProps} isPaused[33m=[39m{[36mtrue[39m} [33m/[39m[33m>[39m
     [90m 67 |[39m         )[33m;[39m
    [31m[1m>[22m[39m[90m 68 |[39m         fireEvent[33m.[39mpress(getByTestId([32m'btn-quit'[39m))[33m;[39m
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 69 |[39m         expect(defaultProps[33m.[39monLeaveRoom)[33m.[39mtoHaveBeenCalled()[33m;[39m
     [90m 70 |[39m     })[33m;[39m
     [90m 71 |[39m[0m

      at Object.getByTestId (src/components/game/__tests__/GameOverlays.test.tsx:68:25)

  ● GameOverlays Component › calls UnifiedResultOverlay with correct props when showScoreOverlay is true

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: ObjectContaining {"currentUserId": "player1", "gameState": {"gameMode": "MANCHE", "mancheNumber": 1, "phase": "PLAYING", "roundNumber": 2, "winningCondition": 3}, "isHost": true, "visible": true}, {}
    Received: {"currentUserId": "player1", "gameState": {"gameMode": "MANCHE", "mancheNumber": 1, "phase": "PLAYING", "roundNumber": 2, "winningCondition": 3}, "isHost": true, "matchReward": undefined, "onContinue": [Function mockConstructor], "onLeave": [Function mockConstructor], "visible": true}, undefined

    Number of calls: 1

    [0m [90m 100 |[39m         )[33m;[39m
     [90m 101 |[39m
    [31m[1m>[22m[39m[90m 102 |[39m         expect([33mUnifiedResultOverlay[39m)[33m.[39mtoHaveBeenCalledWith(
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 103 |[39m             expect[33m.[39mobjectContaining({
     [90m 104 |[39m                 gameState[33m:[39m mockGameState[33m,[39m
     [90m 105 |[39m                 visible[33m:[39m [36mtrue[39m[33m,[39m[0m

      at Object.toHaveBeenCalledWith (src/components/game/__tests__/GameOverlays.test.tsx:102:38)

PASS src/components/game/__tests__/PlayerArea.test.tsx
FAIL src/hooks/game/__tests__/useGameSync.test.ts (12.085 s)
  ● Console

    console.error
      An update to HookContainer inside a test was not wrapped in act(...).
      
      When testing, code that causes React state updates should be wrapped into act(...):
      
      act(() => {
        /* fire events that update state */
      });
      /* assert on the output */
      
      This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

    [0m [90m 50 |[39m
     [90m 51 |[39m         [90m// First, explicitly declare we are online[39m
    [31m[1m>[22m[39m[90m 52 |[39m         signalPlayerOnline()[33m.[39mthen(() [33m=>[39m setIsStarting([36mfalse[39m))[33m;[39m
     [90m    |[39m                                         [31m[1m^[22m[39m
     [90m 53 |[39m
     [90m 54 |[39m         [36mconst[39m unsubscribe [33m=[39m onSnapshot(roomRef[33m,[39m (docSnap) [33m=>[39m {
     [90m 55 |[39m             [36mif[39m (docSnap[33m.[39mexists()) {[0m

      at node_modules/react-test-renderer/cjs/react-test-renderer.development.js:11801:19
      at runWithFiberInDEV (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:1574:13)
      at warnIfUpdatesNotWrappedWithActDEV (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:11800:9)
      at scheduleUpdateOnFiber (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:10326:9)
      at dispatchSetStateInternal (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:4148:13)
      at dispatchSetState (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:4107:7)
      at setIsStarting (src/hooks/game/useGameSync.ts:52:41)

    console.error
      An update to HookContainer inside a test was not wrapped in act(...).
      
      When testing, code that causes React state updates should be wrapped into act(...):
      
      act(() => {
        /* fire events that update state */
      });
      /* assert on the output */
      
      This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

    [0m [90m 50 |[39m
     [90m 51 |[39m         [90m// First, explicitly declare we are online[39m
    [31m[1m>[22m[39m[90m 52 |[39m         signalPlayerOnline()[33m.[39mthen(() [33m=>[39m setIsStarting([36mfalse[39m))[33m;[39m
     [90m    |[39m                                         [31m[1m^[22m[39m
     [90m 53 |[39m
     [90m 54 |[39m         [36mconst[39m unsubscribe [33m=[39m onSnapshot(roomRef[33m,[39m (docSnap) [33m=>[39m {
     [90m 55 |[39m             [36mif[39m (docSnap[33m.[39mexists()) {[0m

      at node_modules/react-test-renderer/cjs/react-test-renderer.development.js:11801:19
      at runWithFiberInDEV (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:1574:13)
      at warnIfUpdatesNotWrappedWithActDEV (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:11800:9)
      at scheduleUpdateOnFiber (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:10326:9)
      at dispatchSetStateInternal (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:4148:13)
      at dispatchSetState (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:4107:7)
      at setIsStarting (src/hooks/game/useGameSync.ts:52:41)

    console.error
      An update to HookContainer inside a test was not wrapped in act(...).
      
      When testing, code that causes React state updates should be wrapped into act(...):
      
      act(() => {
        /* fire events that update state */
      });
      /* assert on the output */
      
      This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

    [0m [90m 50 |[39m
     [90m 51 |[39m         [90m// First, explicitly declare we are online[39m
    [31m[1m>[22m[39m[90m 52 |[39m         signalPlayerOnline()[33m.[39mthen(() [33m=>[39m setIsStarting([36mfalse[39m))[33m;[39m
     [90m    |[39m                                         [31m[1m^[22m[39m
     [90m 53 |[39m
     [90m 54 |[39m         [36mconst[39m unsubscribe [33m=[39m onSnapshot(roomRef[33m,[39m (docSnap) [33m=>[39m {
     [90m 55 |[39m             [36mif[39m (docSnap[33m.[39mexists()) {[0m

      at node_modules/react-test-renderer/cjs/react-test-renderer.development.js:11801:19
      at runWithFiberInDEV (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:1574:13)
      at warnIfUpdatesNotWrappedWithActDEV (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:11800:9)
      at scheduleUpdateOnFiber (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:10326:9)
      at dispatchSetStateInternal (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:4148:13)
      at dispatchSetState (node_modules/react-test-renderer/cjs/react-test-renderer.development.js:4107:7)
      at setIsStarting (src/hooks/game/useGameSync.ts:52:41)

  ● useGameSync Hook › runs safeUpdateGameState and rejects older timestamps

    thrown: "Exceeded timeout of 5000 ms for a test.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 87 |[39m     })[33m;[39m
     [90m 88 |[39m
    [31m[1m>[22m[39m[90m 89 |[39m     it([32m'runs safeUpdateGameState and rejects older timestamps'[39m[33m,[39m [36masync[39m () [33m=>[39m {
     [90m    |[39m     [31m[1m^[22m[39m
     [90m 90 |[39m         [36mconst[39m mockTransaction [33m=[39m {
     [90m 91 |[39m             [36mget[39m[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue({
     [90m 92 |[39m                 exists[33m:[39m () [33m=>[39m [36mtrue[39m[33m,[39m[0m

      at it (src/hooks/game/__tests__/useGameSync.test.ts:89:5)
      at Object.describe (src/hooks/game/__tests__/useGameSync.test.ts:42:1)

  ● useGameSync Hook › runs safeUpdateGameState and allows newer timestamps

    thrown: "Exceeded timeout of 5000 ms for a test.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 122 |[39m     })[33m;[39m
     [90m 123 |[39m
    [31m[1m>[22m[39m[90m 124 |[39m     it([32m'runs safeUpdateGameState and allows newer timestamps'[39m[33m,[39m [36masync[39m () [33m=>[39m {
     [90m     |[39m     [31m[1m^[22m[39m
     [90m 125 |[39m         [36mconst[39m mockTransaction [33m=[39m {
     [90m 126 |[39m             [36mget[39m[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue({
     [90m 127 |[39m                 exists[33m:[39m () [33m=>[39m [36mtrue[39m[33m,[39m[0m

      at it (src/hooks/game/__tests__/useGameSync.test.ts:124:5)
      at Object.describe (src/hooks/game/__tests__/useGameSync.test.ts:42:1)

Summary of all failing tests
FAIL src/__tests__/MultiplayerCochonSync.integration.test.ts
  ● Multiplayer Cochon Synchronization Integration › Propagation du Cochon : Player A gagne et les scores se synchronisent pour tous

    expect(received).toBe(expected) // Object.is equality

    Expected: "MANCHE_END"
    Received: "MATCH_END"

    [0m [90m 110 |[39m         [90m// Verify the logic result locally first[39m
     [90m 111 |[39m         expect(newStateAfterWin[33m.[39mmancheResult)[33m.[39mtoBe([32m'COCHON'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 112 |[39m         expect(newStateAfterWin[33m.[39mphase)[33m.[39mtoBe([32m'MANCHE_END'[39m)[33m;[39m
     [90m     |[39m                                        [31m[1m^[22m[39m
     [90m 113 |[39m
     [90m 114 |[39m         [36mconst[39m playerA [33m=[39m newStateAfterWin[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m [32m'A'[39m)[33m;[39m
     [90m 115 |[39m         [36mconst[39m playerB [33m=[39m newStateAfterWin[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m [32m'B'[39m)[33m;[39m[0m

      at Object.toBe (src/__tests__/MultiplayerCochonSync.integration.test.ts:112:40)
      at asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
      at _next (node_modules/@babel/runtime/helpers/asyncToGenerator.js:17:9)
      at node_modules/@babel/runtime/helpers/asyncToGenerator.js:22:7
      at Object.<anonymous> (node_modules/@babel/runtime/helpers/asyncToGenerator.js:14:12)

  ● Multiplayer Cochon Synchronization Integration › Robustesse (Latence) : Aucun démarrage de manche avant sauvegarde

    expect(received).toBe(expected) // Object.is equality

    Expected: "MANCHE_END"
    Received: "MATCH_END"

    [0m [90m 184 |[39m
     [90m 185 |[39m         [90m// Now phase is updated[39m
    [31m[1m>[22m[39m[90m 186 |[39m         expect(db[33m.[39mgetState()[33m.[39mphase)[33m.[39mtoBe([32m'MANCHE_END'[39m)[33m;[39m
     [90m     |[39m                                     [31m[1m^[22m[39m
     [90m 187 |[39m     })[33m;[39m
     [90m 188 |[39m })[33m;[39m
     [90m 189 |[39m[0m

      at Object.toBe (src/__tests__/MultiplayerCochonSync.integration.test.ts:186:37)
      at asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
      at _next (node_modules/@babel/runtime/helpers/asyncToGenerator.js:17:9)

FAIL src/core/__tests__/GameIntegration.test.ts
  ● GameIntegration - Full Game Simulation › should simulate a full match between 3 bots without crashing

    currentPlayer is undefined

    [0m [90m 25 |[39m             [36mif[39m ([33m![39mcurrentPlayer) {
     [90m 26 |[39m                 console[33m.[39merror([32m`ERROR: currentPlayerId ${state.currentPlayerId} not found in [${state.players.map(p => p.id).join(', ')}]`[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 27 |[39m                 [36mthrow[39m [36mnew[39m [33mError[39m([32m"currentPlayer is undefined"[39m)[33m;[39m
     [90m    |[39m                       [31m[1m^[22m[39m
     [90m 28 |[39m             }
     [90m 29 |[39m             [90m// AI Logic[39m
     [90m 30 |[39m             [36mconst[39m move [33m=[39m getBotMove([0m

      at playFullRound (src/core/__tests__/GameIntegration.test.ts:27:23)
      at playFullRound (src/core/__tests__/GameIntegration.test.ts:112:13)
      at Object._loop (src/core/__tests__/GameIntegration.test.ts:79:66)

FAIL src/__tests__/rules_scenarios.test.ts
  ● Domino Martiniquais Rules - Termination Scenarios › Scenario 2-1-1: Should end in CHIRE (No cochon)

    expect(received).toBe(expected) // Object.is equality

    Expected: "MATCH_END"
    Received: "PARTIE_END"

    [0m [90m 34 |[39m         [36mconst[39m result [33m=[39m finalizeRound(state[33m,[39m [32m'p3'[39m)[33m;[39m
     [90m 35 |[39m
    [31m[1m>[22m[39m[90m 36 |[39m         expect(result[33m.[39mphase)[33m.[39mtoBe([32m'MATCH_END'[39m)[33m;[39m
     [90m    |[39m                              [31m[1m^[22m[39m
     [90m 37 |[39m         expect(result[33m.[39mmancheResult)[33m.[39mtoBe([32m'CHIRE'[39m)[33m;[39m
     [90m 38 |[39m         [90m// P1: 2 wins -> 2 pts, P2: 1 win -> 1 pt, P3: 1 win -> 1 pt[39m
     [90m 39 |[39m         expect(result[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m [32m'p1'[39m)[33m?[39m[33m.[39mtotalPoints)[33m.[39mtoBe([35m2[39m)[33m;[39m[0m

      at Object.toBe (src/__tests__/rules_scenarios.test.ts:36:30)

  ● Domino Martiniquais Rules - Termination Scenarios › Scenario 3-0-0: Should reward 5 pts (2 cochons)

    expect(received).toBe(expected) // Object.is equality

    Expected: 5
    Received: 0

    [0m [90m 49 |[39m         [36mconst[39m state [33m=[39m createMockState(players)[33m;[39m
     [90m 50 |[39m         [36mconst[39m result [33m=[39m finalizeRound(state[33m,[39m [32m'p1'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 51 |[39m         expect(result[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m [32m'p1'[39m)[33m?[39m[33m.[39mtotalPoints)[33m.[39mtoBe([35m5[39m)[33m;[39m
     [90m    |[39m                                                                      [31m[1m^[22m[39m
     [90m 52 |[39m         expect(result[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m [32m'p2'[39m)[33m?[39m[33m.[39mtotalPoints)[33m.[39mtoBe([33m-[39m[35m1[39m)[33m;[39m
     [90m 53 |[39m     })[33m;[39m
     [90m 54 |[39m[0m

      at Object.toBe (src/__tests__/rules_scenarios.test.ts:51:70)

  ● Domino Martiniquais Rules - Termination Scenarios › Scenario 3-1-0: Should reward 4 pts (1 cochon)

    expect(received).toBe(expected) // Object.is equality

    Expected: 4
    Received: 0

    [0m [90m 61 |[39m         [36mconst[39m state [33m=[39m createMockState(players)[33m;[39m
     [90m 62 |[39m         [36mconst[39m result [33m=[39m finalizeRound(state[33m,[39m [32m'p1'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 63 |[39m         expect(result[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m [32m'p1'[39m)[33m?[39m[33m.[39mtotalPoints)[33m.[39mtoBe([35m4[39m)[33m;[39m
     [90m    |[39m                                                                      [31m[1m^[22m[39m
     [90m 64 |[39m         expect(result[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m [32m'p3'[39m)[33m?[39m[33m.[39mtotalPoints)[33m.[39mtoBe([33m-[39m[35m1[39m)[33m;[39m
     [90m 65 |[39m         expect(result[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m [32m'p2'[39m)[33m?[39m[33m.[39mtotalPoints)[33m.[39mtoBe([35m1[39m)[33m;[39m [90m// Keep wins as pts[39m
     [90m 66 |[39m     })[33m;[39m[0m

      at Object.toBe (src/__tests__/rules_scenarios.test.ts:63:70)

  ● Domino Martiniquais Rules - Termination Scenarios › Scenario 2-1-0: Should continue round (Cochon remains)

    expect(received).toBe(expected) // Object.is equality

    Expected: "ROUND_END"
    Received: "PARTIE_END"

    [0m [90m 75 |[39m         [36mconst[39m result [33m=[39m finalizeRound(state[33m,[39m [32m'p1'[39m)[33m;[39m [90m// P1 wins -> 2-1-0[39m
     [90m 76 |[39m
    [31m[1m>[22m[39m[90m 77 |[39m         expect(result[33m.[39mphase)[33m.[39mtoBe([32m'ROUND_END'[39m)[33m;[39m
     [90m    |[39m                              [31m[1m^[22m[39m
     [90m 78 |[39m         expect(result[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m [32m'p1'[39m)[33m?[39m[33m.[39mwins)[33m.[39mtoBe([35m2[39m)[33m;[39m
     [90m 79 |[39m     })[33m;[39m
     [90m 80 |[39m[0m

      at Object.toBe (src/__tests__/rules_scenarios.test.ts:77:30)

  ● Domino Martiniquais Rules - Termination Scenarios › Tie-break Logic (BOUDE) › Tie-break: Highest Double wins

    expect(received).toBe(expected) // Object.is equality

    Expected: "p1"
    Received: "TIE"

    [0m [90m 88 |[39m             [90m// P1 and P2 have 2 points each. P1 has a double, P2 doesn't.[39m
     [90m 89 |[39m             [36mconst[39m winner [33m=[39m determineWinnerOnBoudé(players)[33m;[39m
    [31m[1m>[22m[39m[90m 90 |[39m             expect(winner)[33m.[39mtoBe([32m'p1'[39m)[33m;[39m
     [90m    |[39m                            [31m[1m^[22m[39m
     [90m 91 |[39m         })[33m;[39m
     [90m 92 |[39m
     [90m 93 |[39m         test([32m'Tie-break: Highest Double among multiple doubles'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.toBe (src/__tests__/rules_scenarios.test.ts:90:28)

FAIL src/hooks/game/__tests__/useGameTimers.test.tsx
  ● useGameTimers Hook (Component Wrapper) › triggers onTimeout when overtime reaches 0

    expect(received).toBe(expected) // Object.is equality

    Expected: 0
    Received: 4

    [0m [90m 102 |[39m         })[33m;[39m
     [90m 103 |[39m
    [31m[1m>[22m[39m[90m 104 |[39m         expect(getByTestId([32m'overtime'[39m)[33m.[39mprops[33m.[39mchildren)[33m.[39mtoBe([35m0[39m)[33m;[39m
     [90m     |[39m                                                        [31m[1m^[22m[39m
     [90m 105 |[39m         expect(mockOnTimeout)[33m.[39mtoHaveBeenCalledWith([32m'p1'[39m[33m,[39m expect[33m.[39many([33mNumber[39m))[33m;[39m
     [90m 106 |[39m     })[33m;[39m
     [90m 107 |[39m })[33m;[39m[0m

      at Object.toBe (src/hooks/game/__tests__/useGameTimers.test.tsx:104:56)

FAIL src/hooks/game/__tests__/IntegrationArchitecture.test.tsx
  ● Integration Architecture › Scenario 3: Le Réveil du Bot (Bot Awakening)

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

    [0m [90m 163 |[39m
     [90m 164 |[39m         [90m// Le dispatch devrait avoir été appelé ('PASS_TURN' s'il n'a pas de coups valides, ce qui est le cas ici)[39m
    [31m[1m>[22m[39m[90m 165 |[39m         expect(spyDispatch)[33m.[39mtoHaveBeenCalled()[33m;[39m
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 166 |[39m         [36mconst[39m callArgs [33m=[39m spyDispatch[33m.[39mmock[33m.[39mcalls[[35m0[39m][[35m0[39m][33m;[39m
     [90m 167 |[39m         expect([[32m'PLAY_TILE'[39m[33m,[39m [32m'PASS_TURN'[39m])[33m.[39mtoContain(callArgs[33m.[39mtype)[33m;[39m
     [90m 168 |[39m     })[33m;[39m[0m

      at Object.toHaveBeenCalled (src/hooks/game/__tests__/IntegrationArchitecture.test.tsx:165:29)

FAIL src/core/StressTest.test.ts
  ● Phase 2.3: Stress Test Simulation › Match termination in MANCHE mode

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: false

    [0m [90m 57 |[39m         [36mconst[39m { state } [33m=[39m simulateMatch([32m'MANCHE'[39m[33m,[39m [35m3[39m)[33m;[39m
     [90m 58 |[39m         expect(state[33m.[39mphase)[33m.[39mtoBe([32m'MATCH_END'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 59 |[39m         expect(state[33m.[39mplayers[33m.[39msome(p [33m=>[39m p[33m.[39mmancheWins [33m>=[39m [35m3[39m))[33m.[39mtoBe([36mtrue[39m)[33m;[39m
     [90m    |[39m                                                            [31m[1m^[22m[39m
     [90m 60 |[39m     })[33m;[39m
     [90m 61 |[39m
     [90m 62 |[39m     test([32m'Match termination in SCORE mode'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.toBe (src/core/StressTest.test.ts:59:60)

  ● Phase 2.3: Stress Test Simulation › Match termination in COCHON mode (individual limit)

    expect(received).toBe(expected) // Object.is equality

    Expected: "MATCH_END"
    Received: "PLAYING"

    [0m [90m 68 |[39m     test([32m'Match termination in COCHON mode (individual limit)'[39m[33m,[39m () [33m=>[39m {
     [90m 69 |[39m         [36mconst[39m { state } [33m=[39m simulateMatch([32m'COCHON'[39m[33m,[39m [35m3[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 70 |[39m         expect(state[33m.[39mphase)[33m.[39mtoBe([32m'MATCH_END'[39m)[33m;[39m
     [90m    |[39m                             [31m[1m^[22m[39m
     [90m 71 |[39m         expect(state[33m.[39mplayers[33m.[39msome(p [33m=>[39m p[33m.[39mtotalCochons [33m>=[39m [35m3[39m))[33m.[39mtoBe([36mtrue[39m)[33m;[39m
     [90m 72 |[39m     })[33m;[39m
     [90m 73 |[39m[0m

      at Object.toBe (src/core/StressTest.test.ts:70:29)

FAIL src/core/__tests__/ScoringScenarios.test.ts
  ● Scoring Verification › 4. Test Match NOT Over after round win (must wait for manche end)

    expect(received).toBe(expected) // Object.is equality

    Expected: 30
    Received: 29

    [0m [90m 136 |[39m
     [90m 137 |[39m         [36mconst[39m playerA [33m=[39m newState[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m [32m'A'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 138 |[39m         expect(playerA[33m?[39m[33m.[39mtotalPoints)[33m.[39mtoBe([35m30[39m)[33m;[39m
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 139 |[39m         expect(newState[33m.[39mphase)[33m.[39mtoBe([32m'PARTIE_END'[39m)[33m;[39m [90m// Deferred until manche winner or chira[39m
     [90m 140 |[39m     })[33m;[39m
     [90m 141 |[39m[0m

      at Object.toBe (src/core/__tests__/ScoringScenarios.test.ts:138:38)

  ● Scoring Verification › 5. Test Match Over at Manche End

    expect(received).toBe(expected) // Object.is equality

    Expected: 30
    Received: 34

    [0m [90m 154 |[39m
     [90m 155 |[39m         [36mconst[39m playerA [33m=[39m newState[33m.[39mplayers[33m.[39mfind(p [33m=>[39m p[33m.[39mid [33m===[39m [32m'A'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 156 |[39m         expect(playerA[33m?[39m[33m.[39mtotalPoints)[33m.[39mtoBe([35m30[39m)[33m;[39m
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 157 |[39m         expect(newState[33m.[39mphase)[33m.[39mtoBe([32m'MATCH_END'[39m)[33m;[39m
     [90m 158 |[39m     })[33m;[39m
     [90m 159 |[39m[0m

      at Object.toBe (src/core/__tests__/ScoringScenarios.test.ts:156:38)

  ● Scoring Verification › 8. Test resolveBoude with Cochon scoring

    expect(received).toBe(expected) // Object.is equality

    Expected: 3
    Received: 5

    [0m [90m 223 |[39m         [90m// A should get 1 (win) + 2 (cochons) = 3 total points.[39m
     [90m 224 |[39m         [36mconst[39m playerA [33m=[39m newState[33m.[39mplayers[33m.[39mfind((p[33m:[39m [33mPlayer[39m) [33m=>[39m p[33m.[39mid [33m===[39m [32m'A'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 225 |[39m         expect(playerA[33m?[39m[33m.[39mtotalPoints)[33m.[39mtoBe([35m3[39m)[33m;[39m
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 226 |[39m         [90m// Phase should be MATCH_END if winningCondition is 3 ? Wait, default winningCondition is 30.[39m
     [90m 227 |[39m         [90m// It should be MANCHE_END because A reaches 3 stars.[39m
     [90m 228 |[39m         expect(newState[33m.[39mphase)[33m.[39mtoBe([32m'MANCHE_END'[39m)[33m;[39m[0m

      at Object.toBe (src/core/__tests__/ScoringScenarios.test.ts:225:38)

FAIL src/hooks/game/__tests__/useGameEngine.test.tsx
  ● useGameEngine Hook (Component Wrapper) › handles playing a domino successfully

    TypeError: getByTestId(...).props.onPress is not a function

    [0m [90m 88 |[39m
     [90m 89 |[39m         [36mawait[39m act([36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 90 |[39m             getByTestId([32m'play'[39m)[33m.[39mprops[33m.[39monPress()[33m;[39m
     [90m    |[39m                                       [31m[1m^[22m[39m
     [90m 91 |[39m         })[33m;[39m
     [90m 92 |[39m
     [90m 93 |[39m         expect(mockOnTilePlayed)[33m.[39mtoHaveBeenCalled()[33m;[39m[0m

      at onPress (src/hooks/game/__tests__/useGameEngine.test.tsx:90:39)
      at asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
      at _next (node_modules/@babel/runtime/helpers/asyncToGenerator.js:17:9)
      at node_modules/@babel/runtime/helpers/asyncToGenerator.js:22:7
      at node_modules/@babel/runtime/helpers/asyncToGenerator.js:14:12
      at callback (node_modules/@testing-library/react-native/src/act.ts:31:24)
      at Object.<anonymous>.process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:789:22)
      at actImplementation (node_modules/@testing-library/react-native/src/act.ts:30:25)
      at Object.<anonymous> (src/hooks/game/__tests__/useGameEngine.test.tsx:89:18)
      at asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
      at _next (node_modules/@babel/runtime/helpers/asyncToGenerator.js:17:9)
      at node_modules/@babel/runtime/helpers/asyncToGenerator.js:22:7
      at Object.<anonymous> (node_modules/@babel/runtime/helpers/asyncToGenerator.js:14:12)

  ● useGameEngine Hook (Component Wrapper) › blocks manual pass if valid moves exist

    TypeError: getByTestId(...).props.onPress is not a function

    [0m [90m 104 |[39m
     [90m 105 |[39m         [36mawait[39m act([36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 106 |[39m             getByTestId([32m'pass'[39m)[33m.[39mprops[33m.[39monPress()[33m;[39m
     [90m     |[39m                                       [31m[1m^[22m[39m
     [90m 107 |[39m         })[33m;[39m
     [90m 108 |[39m
     [90m 109 |[39m         expect([33mDominoEngine[39m[33m.[39mpassTurn)[33m.[39mnot[33m.[39mtoHaveBeenCalled()[33m;[39m[0m

      at onPress (src/hooks/game/__tests__/useGameEngine.test.tsx:106:39)
      at asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
      at _next (node_modules/@babel/runtime/helpers/asyncToGenerator.js:17:9)
      at node_modules/@babel/runtime/helpers/asyncToGenerator.js:22:7
      at node_modules/@babel/runtime/helpers/asyncToGenerator.js:14:12
      at callback (node_modules/@testing-library/react-native/src/act.ts:31:24)
      at Object.<anonymous>.process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:789:22)
      at actImplementation (node_modules/@testing-library/react-native/src/act.ts:30:25)
      at Object.<anonymous> (src/hooks/game/__tests__/useGameEngine.test.tsx:105:18)
      at asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
      at _next (node_modules/@babel/runtime/helpers/asyncToGenerator.js:17:9)
      at node_modules/@babel/runtime/helpers/asyncToGenerator.js:22:7
      at Object.<anonymous> (node_modules/@babel/runtime/helpers/asyncToGenerator.js:14:12)

  ● useGameEngine Hook (Component Wrapper) › allows manual pass if no valid moves exist

    TypeError: getByTestId(...).props.onPress is not a function

    [0m [90m 118 |[39m
     [90m 119 |[39m         [36mawait[39m act([36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 120 |[39m             getByTestId([32m'pass'[39m)[33m.[39mprops[33m.[39monPress()[33m;[39m
     [90m     |[39m                                       [31m[1m^[22m[39m
     [90m 121 |[39m         })[33m;[39m
     [90m 122 |[39m
     [90m 123 |[39m         expect([33mDominoEngine[39m[33m.[39mpassTurn)[33m.[39mtoHaveBeenCalled()[33m;[39m[0m

      at onPress (src/hooks/game/__tests__/useGameEngine.test.tsx:120:39)
      at asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
      at _next (node_modules/@babel/runtime/helpers/asyncToGenerator.js:17:9)
      at node_modules/@babel/runtime/helpers/asyncToGenerator.js:22:7
      at node_modules/@babel/runtime/helpers/asyncToGenerator.js:14:12
      at callback (node_modules/@testing-library/react-native/src/act.ts:31:24)
      at Object.<anonymous>.process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:789:22)
      at actImplementation (node_modules/@testing-library/react-native/src/act.ts:30:25)
      at Object.<anonymous> (src/hooks/game/__tests__/useGameEngine.test.tsx:119:18)
      at asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
      at _next (node_modules/@babel/runtime/helpers/asyncToGenerator.js:17:9)
      at node_modules/@babel/runtime/helpers/asyncToGenerator.js:22:7
      at Object.<anonymous> (node_modules/@babel/runtime/helpers/asyncToGenerator.js:14:12)

FAIL src/__tests__/MultiplayerLogic.test.ts
  ● Multiplayer Game Logic & Rules Verification › Scoring & Game Modes › Mode MANCHE: Match ends at correct winningCondition (mancheWins)

    expect(received).toBe(expected) // Object.is equality

    Expected: "MATCH_END"
    Received: "MANCHE_END"

    [0m [90m 31 |[39m
     [90m 32 |[39m             expect(newState[33m.[39mplayers[[35m0[39m][33m.[39mmancheWins)[33m.[39mtoBe([35m3[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 33 |[39m             expect(newState[33m.[39mphase)[33m.[39mtoBe([32m'MATCH_END'[39m)[33m;[39m
     [90m    |[39m                                    [31m[1m^[22m[39m
     [90m 34 |[39m             expect(newState[33m.[39mmancheResult)[33m.[39mtoBe([32m'COCHON'[39m)[33m;[39m [90m// Assuming others had 0 wins (default in mock)[39m
     [90m 35 |[39m         })[33m;[39m
     [90m 36 |[39m[0m

      at Object.toBe (src/__tests__/MultiplayerLogic.test.ts:33:36)

  ● Multiplayer Game Logic & Rules Verification › Scoring & Game Modes › Mode COCHON: totalCochons increments and triggers Match End

    expect(received).toBe(expected) // Object.is equality

    Expected: 2
    Received: 1

    [0m [90m 56 |[39m             [36mconst[39m newState [33m=[39m handleEndOfRound(state[33m,[39m [32m'p1'[39m)[33m;[39m
     [90m 57 |[39m
    [31m[1m>[22m[39m[90m 58 |[39m             expect(newState[33m.[39mplayers[[35m1[39m][33m.[39mtotalCochons)[33m.[39mtoBe([35m2[39m)[33m;[39m
     [90m    |[39m                                                      [31m[1m^[22m[39m
     [90m 59 |[39m             expect(newState[33m.[39mphase)[33m.[39mtoBe([32m'MATCH_END'[39m)[33m;[39m
     [90m 60 |[39m         })[33m;[39m
     [90m 61 |[39m[0m

      at Object.toBe (src/__tests__/MultiplayerLogic.test.ts:58:54)

  ● Multiplayer Game Logic & Rules Verification › Martinique Rules (Chiré, Cochon, 3-Round Rule) › CHIRE: Occurs when everyone has at least one win

    expect(received).toBe(expected) // Object.is equality

    Expected: "CHIRE"
    Received: "NORMAL"

    [0m [90m 73 |[39m             [36mconst[39m newState [33m=[39m handleEndOfRound(state[33m,[39m [32m'p1'[39m)[33m;[39m
     [90m 74 |[39m
    [31m[1m>[22m[39m[90m 75 |[39m             expect(newState[33m.[39mmancheResult)[33m.[39mtoBe([32m'CHIRE'[39m)[33m;[39m
     [90m    |[39m                                           [31m[1m^[22m[39m
     [90m 76 |[39m             expect(newState[33m.[39mplayers[[35m0[39m][33m.[39mtotalPoints)[33m.[39mtoBe([35m0[39m)[33m;[39m [90m// No points awarded in Chiré[39m
     [90m 77 |[39m             expect(newState[33m.[39mphase)[33m.[39mtoBe([32m'MANCHE_END'[39m)[33m;[39m
     [90m 78 |[39m         })[33m;[39m[0m

      at Object.toBe (src/__tests__/MultiplayerLogic.test.ts:75:43)

FAIL src/core/__tests__/GameStressTest.test.ts
  ● LogicEngine Stress Test (500 parties automatiques) › devrait terminer 500 parties sans boucle infinie

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: false

    [0m [90m 73 |[39m             [90m// On vérifie que quelqu'un a atteint le winningCondition (Normalement oui si MATCH_END)[39m
     [90m 74 |[39m             [36mconst[39m hasWinner [33m=[39m state[33m.[39mplayers[33m.[39msome(p [33m=>[39m p[33m.[39mmancheWins [33m>=[39m state[33m.[39mwinningCondition)[33m;[39m
    [31m[1m>[22m[39m[90m 75 |[39m             expect(hasWinner)[33m.[39mtoBe([36mtrue[39m)[33m;[39m
     [90m    |[39m                               [31m[1m^[22m[39m
     [90m 76 |[39m
     [90m 77 |[39m             [90m// "vérifie que le score du gagnant est cohérent avec la somme des points restants dans les mains des adversaires"[39m
     [90m 78 |[39m             [90m// Dans ce jeu, state.mancheResult dit peut-être CHIRE. On vérifie juste qu'il y a des points[39m[0m

      at toBe (src/core/__tests__/GameStressTest.test.ts:75:31)
      at Object._loop (src/core/__tests__/GameStressTest.test.ts:15:47)

FAIL src/core/DominoEngine.test.ts
  ● DominoEngine Migration (Phase 1.4) › Intelligence Valou : Priorité aux doubles pour commencer

    expect(received).toBe(expected) // Object.is equality

    Expected: "2"
    Received: "1"

    [0m [90m 86 |[39m         ][33m;[39m
     [90m 87 |[39m         [36mconst[39m decision [33m=[39m getBotMove(hand[33m,[39m [36mnull[39m[33m,[39m [32m'valou_legend'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 88 |[39m         expect(decision[33m?[39m[33m.[39mtile[33m.[39mid)[33m.[39mtoBe([32m'2'[39m)[33m;[39m
     [90m    |[39m                                   [31m[1m^[22m[39m
     [90m 89 |[39m     })[33m;[39m
     [90m 90 |[39m
     [90m 91 |[39m })[33m;[39m[0m

      at Object.toBe (src/core/DominoEngine.test.ts:88:35)

FAIL src/components/game/__tests__/GameHeader.test.tsx
  ● GameHeader Component › renders correctly when phase is PLAYING

    Unable to find an element with text: �� Manche · Obj: 3 manches

    [36m<View[39m
      [33mtestID[39m=[32m"game-header"[39m
    [36m>[39m
      [36m<View>[39m
        [36m<Text>[39m
          [0m3 Victoires[0m
        [36m</Text>[39m
      [36m</View>[39m
      [36m<View>[39m
        [36m<Text>[39m
          [0mM[0m
          [0m1[0m
          [0m / R[0m
          [0m2[0m
        [36m</Text>[39m
      [36m</View>[39m
      [36m<View>[39m
        [36m<View[39m
          [33maccessible[39m=[32m{true}[39m
          [33mtestID[39m=[32m"btn-pause"[39m
        [36m>[39m
          [36m<Text />[39m
        [36m</View>[39m
      [36m</View>[39m
    [36m</View>[39m

    [0m [90m 32 |[39m         [36mconst[39m { getByText } [33m=[39m render([33m<[39m[33mGameHeader[39m {[33m...[39mdefaultProps} [33m/[39m[33m>[39m)[33m;[39m
     [90m 33 |[39m
    [31m[1m>[22m[39m[90m 34 |[39m         expect(getByText([32m'�� Manche · Obj: 3 manches'[39m))[33m.[39mtoBeTruthy()[33m;[39m
     [90m    |[39m                [31m[1m^[22m[39m
     [90m 35 |[39m         expect(getByText([32m'M1 / R2'[39m))[33m.[39mtoBeTruthy()[33m;[39m
     [90m 36 |[39m     })[33m;[39m
     [90m 37 |[39m[0m

      at Object.getByText (src/components/game/__tests__/GameHeader.test.tsx:34:16)

  ● GameHeader Component › calls onToggleSound when sound button is pressed

    Unable to find an element with testID: btn-sound

    [36m<View[39m
      [33mtestID[39m=[32m"game-header"[39m
    [36m>[39m
      [36m<View>[39m
        [36m<Text>[39m
          [0m3 Victoires[0m
        [36m</Text>[39m
      [36m</View>[39m
      [36m<View>[39m
        [36m<Text>[39m
          [0mM[0m
          [0m1[0m
          [0m / R[0m
          [0m2[0m
        [36m</Text>[39m
      [36m</View>[39m
      [36m<View>[39m
        [36m<View[39m
          [33maccessible[39m=[32m{true}[39m
          [33mtestID[39m=[32m"btn-pause"[39m
        [36m>[39m
          [36m<Text>[39m
            [0m[0m
          [36m</Text>[39m
        [36m</View>[39m
      [36m</View>[39m
    [36m</View>[39m

    [0m [90m 70 |[39m         [36mconst[39m { getByTestId } [33m=[39m render([33m<[39m[33mGameHeader[39m {[33m...[39mdefaultProps} [33m/[39m[33m>[39m)[33m;[39m
     [90m 71 |[39m
    [31m[1m>[22m[39m[90m 72 |[39m         fireEvent[33m.[39mpress(getByTestId([32m'btn-sound'[39m))[33m;[39m
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 73 |[39m         expect(defaultProps[33m.[39monToggleSound)[33m.[39mtoHaveBeenCalledTimes([35m1[39m)[33m;[39m
     [90m 74 |[39m     })[33m;[39m
     [90m 75 |[39m[0m

      at Object.getByTestId (src/components/game/__tests__/GameHeader.test.tsx:72:25)

  ● GameHeader Component › calls onOpenSettings when settings button is pressed

    Unable to find an element with testID: btn-settings

    [36m<View[39m
      [33mtestID[39m=[32m"game-header"[39m
    [36m>[39m
      [36m<View>[39m
        [36m<Text>[39m
          [0m3 Victoires[0m
        [36m</Text>[39m
      [36m</View>[39m
      [36m<View>[39m
        [36m<Text>[39m
          [0mM[0m
          [0m1[0m
          [0m / R[0m
          [0m2[0m
        [36m</Text>[39m
      [36m</View>[39m
      [36m<View>[39m
        [36m<View[39m
          [33maccessible[39m=[32m{true}[39m
          [33mtestID[39m=[32m"btn-pause"[39m
        [36m>[39m
          [36m<Text>[39m
            [0m[0m
          [36m</Text>[39m
        [36m</View>[39m
      [36m</View>[39m
    [36m</View>[39m

    [0m [90m 77 |[39m         [36mconst[39m { getByTestId } [33m=[39m render([33m<[39m[33mGameHeader[39m {[33m...[39mdefaultProps} [33m/[39m[33m>[39m)[33m;[39m
     [90m 78 |[39m
    [31m[1m>[22m[39m[90m 79 |[39m         fireEvent[33m.[39mpress(getByTestId([32m'btn-settings'[39m))[33m;[39m
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 80 |[39m         expect(defaultProps[33m.[39monOpenSettings)[33m.[39mtoHaveBeenCalledTimes([35m1[39m)[33m;[39m
     [90m 81 |[39m     })[33m;[39m
     [90m 82 |[39m })[33m;[39m[0m

      at Object.getByTestId (src/components/game/__tests__/GameHeader.test.tsx:79:25)

FAIL src/hooks/game/__tests__/testUtils.ts
  ● Test suite failed to run

    Your test suite must contain at least one test.

      at onResult (node_modules/@jest/core/build/TestScheduler.js:133:18)
      at node_modules/@jest/core/build/TestScheduler.js:254:19
      at node_modules/emittery/index.js:363:13
          at Array.map (<anonymous>)
      at Emittery.emit (node_modules/emittery/index.js:361:23)

FAIL src/components/game/__tests__/GameOverlays.test.tsx (6.486 s)
  ● GameOverlays Component › calls onLeaveRoom when quit button is pressed inside pause overlay

    Unable to find an element with testID: btn-quit

    [36m<View[39m
      [33mpointerEvents[39m=[32m"box-none"[39m
      [33mtestID[39m=[32m"game-overlays"[39m
    [36m>[39m
      [36m<View[39m
        [33mtestID[39m=[32m"pause-overlay"[39m
      [36m>[39m
        [36m<View[39m
          [33mnativeID[39m=[32m"3"[39m
        [36m>[39m
          [36m<Text>[39m
            [0m[0m
          [36m</Text>[39m
          [36m<Text>[39m
            [0mPAUSE[0m
          [36m</Text>[39m
          [36m<View[39m
            [33maccessible[39m=[32m{true}[39m
            [33mtestID[39m=[32m"btn-resume"[39m
          [36m>[39m
            [36m<Text>[39m
              [0mREPRENDRE[0m
            [36m</Text>[39m
          [36m</View>[39m
        [36m</View>[39m
      [36m</View>[39m
    [36m</View>[39m

    [0m [90m 66 |[39m             [33m<[39m[33mGameOverlays[39m {[33m...[39mdefaultProps} isPaused[33m=[39m{[36mtrue[39m} [33m/[39m[33m>[39m
     [90m 67 |[39m         )[33m;[39m
    [31m[1m>[22m[39m[90m 68 |[39m         fireEvent[33m.[39mpress(getByTestId([32m'btn-quit'[39m))[33m;[39m
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 69 |[39m         expect(defaultProps[33m.[39monLeaveRoom)[33m.[39mtoHaveBeenCalled()[33m;[39m
     [90m 70 |[39m     })[33m;[39m
     [90m 71 |[39m[0m

      at Object.getByTestId (src/components/game/__tests__/GameOverlays.test.tsx:68:25)

  ● GameOverlays Component › calls UnifiedResultOverlay with correct props when showScoreOverlay is true

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: ObjectContaining {"currentUserId": "player1", "gameState": {"gameMode": "MANCHE", "mancheNumber": 1, "phase": "PLAYING", "roundNumber": 2, "winningCondition": 3}, "isHost": true, "visible": true}, {}
    Received: {"currentUserId": "player1", "gameState": {"gameMode": "MANCHE", "mancheNumber": 1, "phase": "PLAYING", "roundNumber": 2, "winningCondition": 3}, "isHost": true, "matchReward": undefined, "onContinue": [Function mockConstructor], "onLeave": [Function mockConstructor], "visible": true}, undefined

    Number of calls: 1

    [0m [90m 100 |[39m         )[33m;[39m
     [90m 101 |[39m
    [31m[1m>[22m[39m[90m 102 |[39m         expect([33mUnifiedResultOverlay[39m)[33m.[39mtoHaveBeenCalledWith(
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 103 |[39m             expect[33m.[39mobjectContaining({
     [90m 104 |[39m                 gameState[33m:[39m mockGameState[33m,[39m
     [90m 105 |[39m                 visible[33m:[39m [36mtrue[39m[33m,[39m[0m

      at Object.toHaveBeenCalledWith (src/components/game/__tests__/GameOverlays.test.tsx:102:38)

FAIL src/hooks/game/__tests__/useGameSync.test.ts (12.085 s)
  ● useGameSync Hook › runs safeUpdateGameState and rejects older timestamps

    thrown: "Exceeded timeout of 5000 ms for a test.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 87 |[39m     })[33m;[39m
     [90m 88 |[39m
    [31m[1m>[22m[39m[90m 89 |[39m     it([32m'runs safeUpdateGameState and rejects older timestamps'[39m[33m,[39m [36masync[39m () [33m=>[39m {
     [90m    |[39m     [31m[1m^[22m[39m
     [90m 90 |[39m         [36mconst[39m mockTransaction [33m=[39m {
     [90m 91 |[39m             [36mget[39m[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue({
     [90m 92 |[39m                 exists[33m:[39m () [33m=>[39m [36mtrue[39m[33m,[39m[0m

      at it (src/hooks/game/__tests__/useGameSync.test.ts:89:5)
      at Object.describe (src/hooks/game/__tests__/useGameSync.test.ts:42:1)

  ● useGameSync Hook › runs safeUpdateGameState and allows newer timestamps

    thrown: "Exceeded timeout of 5000 ms for a test.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 122 |[39m     })[33m;[39m
     [90m 123 |[39m
    [31m[1m>[22m[39m[90m 124 |[39m     it([32m'runs safeUpdateGameState and allows newer timestamps'[39m[33m,[39m [36masync[39m () [33m=>[39m {
     [90m     |[39m     [31m[1m^[22m[39m
     [90m 125 |[39m         [36mconst[39m mockTransaction [33m=[39m {
     [90m 126 |[39m             [36mget[39m[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue({
     [90m 127 |[39m                 exists[33m:[39m () [33m=>[39m [36mtrue[39m[33m,[39m[0m

      at it (src/hooks/game/__tests__/useGameSync.test.ts:124:5)
      at Object.describe (src/hooks/game/__tests__/useGameSync.test.ts:42:1)


Test Suites: 15 failed, 6 passed, 21 total
Tests:       30 failed, 75 passed, 105 total
Snapshots:   0 total
Time:        13.948 s
Ran all test suites.
