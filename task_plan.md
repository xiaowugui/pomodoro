# Task Plan: Pomodoro App Features & Bug Fixes

## Goal Statement
Implement complete project feature and fix all identified input issues in the Pomodoro app:
1. Add "complete project" functionality - mark entire project as complete (all tasks complete)
2. Fix task creation input issue where users cannot enter task name (requires project selection first)
3. Fix DailyViewPage checkbox not working (line 144 - checkbox has no onChange handler)
4. Fix import path inconsistency (.ts extension in some files)

## Project Context
- **Project**: Pomodoro Electron + React + TypeScript app
- **Data model**: Tasks have status ('active' | 'completed'), Projects currently have NO status field
- **Store**: Zustand store in appStore.ts with completeTask function for tasks

---

## Phase 1: Fix Import Path Inconsistency
**Status**: pending

### Tasks
- [ ] 1.1 Fix TasksPage.tsx import - remove .ts extension from '@shared/types.ts'
- [ ] 1.2 Fix ProjectList.tsx import - remove .ts extension from '@shared/types.ts'

---

## Phase 2: Fix DailyViewPage Broken Checkbox
**Status**: pending

### Tasks
- [ ] 2.1 Connect checkbox to task completion handler in DaySummary component
- [ ] 2.2 Use completeTask from useAppStore

---

## Phase 3: Fix Task Creation Input Issue
**Status**: pending

### Tasks
- [ ] 3.1 Add ability to create project directly from TaskForm if no projects exist
- [ ] 3.2 OR make project selection optional with validation message

---

## Phase 4: Implement Complete Project Feature
**Status**: pending

### Tasks
- [ ] 4.1 Add status field to Project type in types.ts
- [ ] 4.2 Add completeProject function to appStore.ts
- [ ] 4.3 Add completeProject IPC handler in main process
- [ ] 4.4 Add UI button in ProjectList to complete project
- [ ] 4.5 Update ProjectList UI to show completion status

---

## Phase 5: Build & Verify
**Status**: pending

### Tasks
- [ ] 5.1 Run build command to verify no errors
- [ ] 5.2 Test each feature manually

---

## Technical Notes

### Key Files
- `src/shared/types.ts` - Data type definitions
- `src/renderer/stores/appStore.ts` - Zustand store with data actions
- `src/main/storage.ts` - Electron main process storage
- `src/renderer/components/TaskForm.tsx` - Task creation form
- `src/renderer/components/ProjectForm.tsx` - Project creation form
- `src/renderer/components/ProjectList.tsx` - Project list with actions
- `src/renderer/pages/DailyViewPage.tsx` - Daily view with broken checkbox
- `src/renderer/pages/TasksPage.tsx` - Tasks page with import issue

### Dependencies
- completeTask already exists in appStore.ts
- IPC channels need to be added for project completion
