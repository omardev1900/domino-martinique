# Task List: Domino Martiniquais Project

## Phase 1-3: ✓ COMPLETE
- [x] Architecture & Technical Choices
- [x] Game Engine (Logic + Tests)
- [x] UX/UI & Design System
- [x] Gameplay Features (Timer, Auto-play, Round Restart, Cochon Points)

---

## Phase 4: Core Game Modes (MVP Priority)

### 4.1 Home Screen & Navigation ✓ COMPLETE
- [x] Splash Screen (3s with logo, spinner, countdown)
- [x] Home Screen UI (Main menu with cards)
- [x] Mode selection (Solo / Multiplayer)
- [x] Settings button
- [x] Responsive landscape layout

### 4.2 Solo Mode (1 Player vs 1 Bot) ✓ COMPLETE
- [x] Bot engine (already exists)
- [x] Solo mode UI/flow (difficulty selection screen)
- [x] 2-player game logic adaptation (`dealGameSolo`)
- [x] Fix Solo Game Loop (Bot auto-play, human interaction unblocked)
- [x] Connect solo screen to game with bot opponent

### 4.6 Solo Mode Firebase Decoupling & Bot Refinement ✓ COMPLETE
- [x] Disable Firebase sync for mode === 'solo'
- [x] Ensure local state updates in all Solo Mode actions
- [x] Verify/Fix Bot move selection logic
- [x] Test Offline/Airplane Mode persistence

### 4.3 Multiplayer - Private Tables ✓ COMPLETE
- [x] Backend logic (createRoom, joinRoom)
- [x] Create room UI (lobby.tsx)
- [x] Join room UI with code input
- [x] Share room code functionality (Copy/Share buttons)
- [x] Lobby State Management
- [x] 3-Player Requirement Enforcement

### 4.4 UI/UX Refactoring & Polish (Landscape Redesign) ✓ COMPLETE
- [x] Complete HUD Redesign (Avatars, Timer, Corners)
- [x] Landscape Lobby Redesign (3 Horizontal Cards)
- [x] Fix Visual Regressions (Domino Spacing, Doubles Orientation)
- [x] Default Avatars & Labels

### 4.5 Real-time Sync Completion ✓ COMPLETE
- [x] Service Implementation (`firebase.ts`)
- [x] Room Rejoin Logic
- [x] Frontend Integration of Real-time Updates
- [ ] Multi-device Testing (Pending user verification)

---

## Phase 5: Polish & Feedback (Tactile Experience) ✓ COMPLETE

### 5.1 Audio Implementation ✓ COMPLETE
- [x] Sound Effects: Tile Placement ("Clack")
- [x] Sound Effects: Shuffle/Dealing
- [x] Sound Effects: Turn Alert
- [x] Sound Effects: Game Over (Victory/Defeat)
- [x] BGM (Background Music) Toggle

### 5.2 Haptic Feedback ✓ COMPLETE
- [x] Placement Impact (light vibration)
- [x] Turn Alert (patterned vibration)
- [x] Error/Invalid Move feedback

---

## Phase 6: User System & Authentication

### 6.1 Guest Mode (Quick Start)
- [ ] Play without account
- [ ] Local stats storage

### 6.2 Firebase Authentication
- [ ] Email/Password sign-up
- [ ] Social login (Google/Apple)

### 6.3 Profile System
- [ ] Profile Screen
- [ ] Avatar Selection
- [ ] Player Statistics

---

## Phase 7: Multiplayer - Public Tables
- [ ] Automatic matchmaking (Future)
- [x] Public room listing (Lobby List & Host Toggle)

---

## Phase 8: Social & Leaderboards
- [ ] Global/Weekly Leaderboards
- [ ] Friend System
- [ ] Match History

---

## Phase 9: Tournament System
- [ ] Tournament Infrastructure
- [ ] Fixed Matches Format
- [ ] Target Points Format
- [ ] Tournament UI

---

## Phase 10: Launch
- [ ] AdMob / IAP
- [ ] Store Assets
- [ ] Beta Testing
- [ ] Publication
