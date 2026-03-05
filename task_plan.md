# Task Plan - Pomodoro App New Features

## Goal
1. **Feature 1**: When postponing a break, show countdown on focus page (TimerPage) displaying time until break starts
2. **Feature 2**: In task view (TasksPage), double-click task opens a new window to view/edit task notes

## Current State
- Branch: master (latest)
- Previous session completed merge of PR

## Understanding of Existing Code

### Feature 1 - Postpone Countdown:
- **timer.ts**: TimerManager has `postpone()` method that emits `break-postpone` event
- **timer.ts**: Has `postponeTimeoutId` that handles postpone duration
- **timer.ts**: After postpone, it calls `resumeBreakAfterPostpone()` after `postponeMinutes`
- **timerStore.ts**: Currently handles timer state but doesn't track postpone state
- **TimerPage.tsx**: Shows timer display but no postpone countdown

### Feature 2 - Task Notes Window:
- **TaskNotesPage.tsx**: Already exists with full notes editing functionality
- **break-window.ts**: Shows how to create new windows
- **main-window.ts**: Shows main window management
- Need to create a new window manager for task notes
- IPC already exists for task notes operations

## Implementation Plan

### Feature 1: Postpone Countdown on TimerPage

1. **Modify timer.ts**:
   - Add state to track postpone status (isPostponed, postponeEndTime)
   - Emit new event for postpone status change

2. **Modify timerStore.ts**:
   - Add state for postpone status
   - Add IPC listener for postpone events
   - Add computed for formatted postpone time

3. **Modify TimerPage.tsx**:
   - Add UI to show postpone countdown when in work phase but break is postponed

### Feature 2: Task Notes Window

1. **Create TaskNoteWindowManager** (new file):
   - Similar to BreakWindowManager
   - Creates a new window for task notes
   - Accepts taskId as parameter

2. **Modify main/index.ts**:
   - Add IPC handlers for opening task note window

3. **Modify preload.ts**:
   - Expose new IPC for opening task note window

4. **Modify TasksPage.tsx/TaskList.tsx**:
   - Add double-click handler to open note window

## Phases

### Phase 1: Feature 1 - Postpone Countdown
- [ ] Modify timer.ts to track postpone state
- [ ] Modify timerStore.ts for postpone state
- [ ] Modify TimerPage.tsx to show postpone countdown

### Phase 2: Feature 2 - Task Notes Window
- [ ] Create TaskNoteWindowManager
- [ ] Add IPC handlers in main/index.ts
- [ ] Add IPC exposure in preload.ts
- [ ] Add double-click handler in TaskList.tsx

### Phase 3: Build & Test
- [ ] Run TypeScript build
- [ ] Test Feature 1
- [ ] Test Feature 2
- [ ] Commit and build exe

## Decisions
- Use similar patterns as break-window.ts for new window creation
- Keep task notes window simpler than break window (no fullscreen)
