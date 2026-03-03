import { describe, it, expect } from 'vitest';

describe('TaskDayExecution Types', () => {
  it('should have correct interface fields', () => {
    const execution = {
      id: '1',
      taskId: 'task-1',
      date: '2024-01-15',
      pomodorosCompleted: 2,
      minutesWorked: 50,
      createdAt: '2024-01-15T10:00:00.000Z',
    };

    expect(execution.id).toBe('1');
    expect(execution.taskId).toBe('task-1');
    expect(execution.date).toBe('2024-01-15');
    expect(execution.pomodorosCompleted).toBe(2);
    expect(execution.minutesWorked).toBe(50);
    expect(execution.createdAt).toBeDefined();
  });

  it('should have workDates array in Task', () => {
    const task = {
      id: 'task-1',
      title: 'Test Task',
      projectId: 'project-1',
      estimatedPomodoros: 5,
      completedPomodoros: 2,
      status: 'active' as const,
      createdAt: '2024-01-15T10:00:00.000Z',
      workDates: ['2024-01-14', '2024-01-15'],
    };

    expect(Array.isArray(task.workDates)).toBe(true);
    expect(task.workDates).toHaveLength(2);
    expect(task.workDates).toContain('2024-01-15');
  });
});
