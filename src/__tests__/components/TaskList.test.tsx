import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TaskList from '../../renderer/components/TaskList';
import { useAppStore } from '../../renderer/stores';
import { createMockProject, createMockTask, mockElectronAPI, setupElectronMock, clearElectronMocks } from '../test-utils';

describe('TaskList Component', () => {
  const mockOnEdit = vi.fn();
  const mockOnSelect = vi.fn();
  const mockOnOpenNotes = vi.fn();

  const mockProjects = [
    createMockProject({ id: 'project-1', name: 'Project 1', color: '#ef4444' }),
    createMockProject({ id: 'project-2', name: 'Project 2', color: '#3b82f6' }),
  ];

  const mockTasks = [
    createMockTask({
      id: 'task-1',
      title: 'AI Task 1',
      projectId: 'project-1',
      taskType: 'ai' as const,
      status: 'active',
    }),
    createMockTask({
      id: 'task-2',
      title: 'Normal Task 1',
      projectId: 'project-1',
      taskType: 'normal' as const,
      status: 'active',
    }),
    createMockTask({
      id: 'task-3',
      title: 'Completed Task',
      projectId: 'project-2',
      taskType: 'ai' as const,
      status: 'completed',
    }),
  ];

  beforeEach(() => {
    setupElectronMock();
    clearElectronMocks();
    mockOnEdit.mockClear();
    mockOnSelect.mockClear();
    mockOnOpenNotes.mockClear();

    useAppStore.setState({
      projects: mockProjects,
      tasks: mockTasks,
      isLoading: false,
    });

    mockElectronAPI.deleteTask.mockResolvedValue(true);
  });

  const renderTaskList = (props = {}) => {
    return render(
      <TaskList
        onEdit={mockOnEdit}
        onSelect={mockOnSelect}
        onOpenNotes={mockOnOpenNotes}
        {...props}
      />
    );
  };

  describe('Rendering', () => {
    it('should render task list with tasks', () => {
      renderTaskList();

      expect(screen.getByText('AI Task 1')).toBeInTheDocument();
      expect(screen.getByText('Normal Task 1')).toBeInTheDocument();
    });

    it('should display project names', () => {
      renderTaskList();

      expect(screen.getAllByText('Project 1').length).toBeGreaterThan(0);
    });

    it('should show status filter buttons', () => {
      renderTaskList();

      expect(screen.getAllByText('进行中').length).toBeGreaterThan(0);
      expect(screen.getAllByText('已完成').length).toBeGreaterThan(0);
    });

    it('should show type filter buttons', () => {
      renderTaskList();

      expect(screen.getAllByText('AI任务').length).toBeGreaterThan(0);
      expect(screen.getAllByText('普通').length).toBeGreaterThan(0);
    });

    it('should display AI task type label', () => {
      renderTaskList();

      const aiLabels = screen.getAllByText('AI');
      expect(aiLabels.length).toBeGreaterThan(0);
    });

    it('should display normal task type label', () => {
      renderTaskList();

      const normalLabels = screen.getAllByText('普通');
      expect(normalLabels.length).toBeGreaterThan(0);
    });
  });

  describe('Default Filtering', () => {
    it('should show active tasks by default', () => {
      renderTaskList();

      expect(screen.getByText('AI Task 1')).toBeInTheDocument();
      expect(screen.getByText('Normal Task 1')).toBeInTheDocument();
    });
  });

  describe('External Filter', () => {
    it('should filter by completed when externalFilter is provided', () => {
      renderTaskList({ externalFilter: 'completed' });

      expect(screen.getByText('Completed Task')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no tasks', () => {
      useAppStore.setState({
        projects: mockProjects,
        tasks: [],
        isLoading: false,
      });

      renderTaskList();

      expect(screen.getByText('暂无任务')).toBeInTheDocument();
    });
  });
});
