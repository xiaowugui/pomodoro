import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useTimerStore } from '../../renderer/stores/timerStore';
import { createMockTimerState, mockElectronAPI, setupElectronMock, clearElectronMocks } from '../test-utils';

// Reset store before each test
beforeEach(() => {
  setupElectronMock();
  clearElectronMocks();
  
  // Mock electron API implementations
  mockElectronAPI.timerStart.mockResolvedValue(undefined);
  mockElectronAPI.timerPause.mockResolvedValue(undefined);
  mockElectronAPI.timerResume.mockResolvedValue(undefined);
  mockElectronAPI.timerStop.mockResolvedValue(undefined);
  mockElectronAPI.timerSkip.mockResolvedValue(undefined);
  mockElectronAPI.timerComplete.mockResolvedValue(undefined);
  mockElectronAPI.getPostponeState.mockResolvedValue({ isPostponed: false, postponeEndTime: 0 });
  
  // Reset store to initial state
  useTimerStore.setState({
    isRunning: false,
    timeRemaining: 25 * 60,
    totalTime: 25 * 60,
    phase: 'idle',
    currentTaskId: null,
    pomodorosCompleted: 0,
    sessionId: null,
    canSkip: false,
    isPostponed: false,
    postponeEndTime: 0,
  });
});

describe('Timer Store', () => {
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useTimerStore.getState();
      
      expect(state.isRunning).toBe(false);
      expect(state.timeRemaining).toBe(25 * 60);
      expect(state.totalTime).toBe(25 * 60);
      expect(state.phase).toBe('idle');
      expect(state.currentTaskId).toBe(null);
      expect(state.pomodorosCompleted).toBe(0);
      expect(state.sessionId).toBe(null);
    });

    it('should have initial UI state', () => {
      const state = useTimerStore.getState();
      
      expect(state.canSkip).toBe(false);
      expect(state.isPostponed).toBe(false);
      expect(state.postponeEndTime).toBe(0);
    });
  });

  describe('Timer Controls', () => {
    it('should start timer', async () => {
      const { start } = useTimerStore.getState();
      
      await act(async () => {
        await start();
      });
      
      expect(mockElectronAPI.timerStart).toHaveBeenCalledWith(undefined);
    });

    it('should start timer with task ID', async () => {
      const { start } = useTimerStore.getState();
      
      await act(async () => {
        await start('task-123');
      });
      
      expect(mockElectronAPI.timerStart).toHaveBeenCalledWith('task-123');
    });

    it('should pause timer', async () => {
      const { pause } = useTimerStore.getState();
      
      await act(async () => {
        await pause();
      });
      
      expect(mockElectronAPI.timerPause).toHaveBeenCalled();
    });

    it('should resume timer', async () => {
      const { resume } = useTimerStore.getState();
      
      await act(async () => {
        await resume();
      });
      
      expect(mockElectronAPI.timerResume).toHaveBeenCalled();
    });

    it('should stop timer', async () => {
      const { stop } = useTimerStore.getState();
      
      await act(async () => {
        await stop();
      });
      
      expect(mockElectronAPI.timerStop).toHaveBeenCalled();
    });

    it('should skip timer', async () => {
      const { skip } = useTimerStore.getState();
      
      await act(async () => {
        await skip();
      });
      
      expect(mockElectronAPI.timerSkip).toHaveBeenCalled();
    });

    it('should complete timer', async () => {
      const { complete } = useTimerStore.getState();
      
      await act(async () => {
        await complete();
      });
      
      expect(mockElectronAPI.timerComplete).toHaveBeenCalled();
    });
  });

  describe('Task Management', () => {
    it('should set current task', () => {
      const { setCurrentTask } = useTimerStore.getState();
      
      act(() => {
        setCurrentTask('task-123');
      });
      
      const state = useTimerStore.getState();
      expect(state.currentTaskId).toBe('task-123');
    });

    it('should clear current task', () => {
      // First set a task
      useTimerStore.setState({ currentTaskId: 'task-123' });
      
      const { setCurrentTask } = useTimerStore.getState();
      
      act(() => {
        setCurrentTask(null);
      });
      
      const state = useTimerStore.getState();
      expect(state.currentTaskId).toBe(null);
    });
  });

  describe('State Updates', () => {
    it('should update state from IPC', () => {
      const { updateState } = useTimerStore.getState();
      
      const newState: Partial<typeof useTimerStore.getState> = {
        isRunning: true,
        timeRemaining: 20 * 60,
        phase: 'work',
      };
      
      act(() => {
        updateState(newState);
      });
      
      const state = useTimerStore.getState();
      expect(state.isRunning).toBe(true);
      expect(state.timeRemaining).toBe(20 * 60);
      expect(state.phase).toBe('work');
    });

    it('should update canSkip based on progress', () => {
      const { updateState } = useTimerStore.getState();
      
      // Set to work phase with 40% progress (should allow skip at 30%)
      act(() => {
        updateState({
          phase: 'work',
          totalTime: 25 * 60,
          timeRemaining: 15 * 60, // 10 min remaining = 60% complete
        });
      });
      
      const state = useTimerStore.getState();
      expect(state.canSkip).toBe(true);
    });

    it('should not allow skip in idle phase', () => {
      const { updateState } = useTimerStore.getState();
      
      act(() => {
        updateState({
          phase: 'idle',
          timeRemaining: 0,
        });
      });
      
      const state = useTimerStore.getState();
      expect(state.canSkip).toBe(false);
    });
  });

  describe('Postpone State', () => {
    it('should set postpone state', () => {
      const { setPostponeState } = useTimerStore.getState();
      
      const postponeEndTime = Date.now() + 2 * 60 * 1000; // 2 minutes from now
      
      act(() => {
        setPostponeState(true, postponeEndTime);
      });
      
      const state = useTimerStore.getState();
      expect(state.isPostponed).toBe(true);
      expect(state.postponeEndTime).toBe(postponeEndTime);
    });

    it('should clear postpone state', () => {
      // First set postpone state
      useTimerStore.setState({
        isPostponed: true,
        postponeEndTime: Date.now() + 2 * 60 * 1000,
      });
      
      const { setPostponeState } = useTimerStore.getState();
      
      act(() => {
        setPostponeState(false, 0);
      });
      
      const state = useTimerStore.getState();
      expect(state.isPostponed).toBe(false);
      expect(state.postponeEndTime).toBe(0);
    });
  });

  describe('Formatting Helpers', () => {
    it('should format time correctly', () => {
      useTimerStore.setState({ timeRemaining: 25 * 60 }); // 25:00
      
      const { getFormattedTime } = useTimerStore.getState();
      expect(getFormattedTime()).toBe('25:00');
    });

    it('should format time with seconds', () => {
      useTimerStore.setState({ timeRemaining: 5 * 60 + 30 }); // 05:30
      
      const { getFormattedTime } = useTimerStore.getState();
      expect(getFormattedTime()).toBe('05:30');
    });

    it('should format postpone time correctly', () => {
      const postponeEndTime = Date.now() + 2 * 60 * 1000;
      useTimerStore.setState({
        isPostponed: true,
        postponeEndTime,
      });
      
      const { getFormattedPostponeTime } = useTimerStore.getState();
      const formatted = getFormattedPostponeTime();
      
      // Should be around 02:00 (minus a few milliseconds)
      expect(formatted).toMatch(/02:0\d/);
    });

    it('should return 00:00 when not postponed', () => {
      useTimerStore.setState({
        isPostponed: false,
        postponeEndTime: 0,
      });
      
      const { getFormattedPostponeTime } = useTimerStore.getState();
      expect(getFormattedPostponeTime()).toBe('00:00');
    });

    it('should calculate progress correctly', () => {
      useTimerStore.setState({
        timeRemaining: 12.5 * 60, // 50% remaining
        totalTime: 25 * 60,
      });
      
      const { getProgress } = useTimerStore.getState();
      expect(getProgress()).toBe(50);
    });

    it('should return 0 progress when totalTime is 0', () => {
      useTimerStore.setState({
        timeRemaining: 0,
        totalTime: 0,
      });
      
      const { getProgress } = useTimerStore.getState();
      expect(getProgress()).toBe(0);
    });
  });

  describe('Phase Labels', () => {
    it('should return correct label for work phase', () => {
      useTimerStore.setState({ phase: 'work' });
      expect(useTimerStore.getState().getPhaseLabel()).toBe('专注时间');
    });

    it('should return correct label for short_break phase', () => {
      useTimerStore.setState({ phase: 'short_break' });
      expect(useTimerStore.getState().getPhaseLabel()).toBe('短休息');
    });

    it('should return correct label for long_break phase', () => {
      useTimerStore.setState({ phase: 'long_break' });
      expect(useTimerStore.getState().getPhaseLabel()).toBe('长休息');
    });

    it('should return correct label for idle phase', () => {
      useTimerStore.setState({ phase: 'idle' });
      expect(useTimerStore.getState().getPhaseLabel()).toBe('准备开始');
    });
  });

  describe('Break Window Actions', () => {
    it('should handle complete action', async () => {
      const { handleBreakAction } = useTimerStore.getState();
      
      await act(async () => {
        await handleBreakAction('complete');
      });
      
      expect(mockElectronAPI.timerSkip).toHaveBeenCalled();
    });

    it('should handle skip action', async () => {
      const { handleBreakAction } = useTimerStore.getState();
      
      await act(async () => {
        await handleBreakAction('skip');
      });
      
      expect(mockElectronAPI.timerSkip).toHaveBeenCalled();
    });
  });
});
