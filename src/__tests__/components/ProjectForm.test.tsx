import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ProjectForm from '../../renderer/components/ProjectForm';
import { useAppStore } from '../../renderer/stores';
import { createMockProject, mockElectronAPI, setupElectronMock, clearElectronMocks } from '../test-utils';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#78716c', '#6b7280', '#374151', '#1f2937',
];

describe('ProjectForm Component', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    setupElectronMock();
    clearElectronMocks();
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
    
    // Mock store data
    useAppStore.setState({
      projects: [],
      isLoading: false,
    });
    
    // Mock electron API
    mockElectronAPI.createProject.mockResolvedValue(createMockProject({ name: 'New Project' }));
    mockElectronAPI.updateProject.mockResolvedValue(createMockProject({ name: 'Updated Project' }));
  });

  const renderProjectForm = (props = {}) => {
    return render(
      <ProjectForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        {...props}
      />
    );
  };

  describe('Create New Project', () => {
    it('should render create project form', () => {
      renderProjectForm();
      
      expect(screen.getByText('新建项目')).toBeInTheDocument();
    });

    it('should have project name input', () => {
      renderProjectForm();
      
      const nameInput = screen.getByPlaceholderText('输入项目名称...');
      expect(nameInput).toBeInTheDocument();
    });

    it('should have color picker with preset colors', () => {
      renderProjectForm();
      
      // Check for color buttons (20 preset colors)
      const colorButtons = screen.getAllByRole('button', { name: '' });
      // There should be color buttons + form buttons
      expect(colorButtons.length).toBeGreaterThanOrEqual(PRESET_COLORS.length);
    });

    it('should have cancel and create buttons', () => {
      renderProjectForm();
      
      expect(screen.getByText('取消')).toBeInTheDocument();
      expect(screen.getByText('创建')).toBeInTheDocument();
    });

    it('should have preview section', () => {
      renderProjectForm();
      
      expect(screen.getByText(/预览:/)).toBeInTheDocument();
    });

    it('should render with input field', () => {
      renderProjectForm();
      
      const nameInput = screen.getByPlaceholderText('输入项目名称...');
      expect(nameInput).toBeInTheDocument();
    });

    it('should update name in preview when typing', () => {
      renderProjectForm();
      
      const nameInput = screen.getByPlaceholderText('输入项目名称...');
      fireEvent.change(nameInput, { target: { value: 'My Project' } });
      
      expect(screen.getByText('预览: My Project')).toBeInTheDocument();
    });

    it('should have create button disabled when name is empty', () => {
      renderProjectForm();
      
      const createButton = screen.getByText('创建');
      expect(createButton).toBeDisabled();
    });

    it('should have create button disabled when name is whitespace', () => {
      renderProjectForm();
      
      const nameInput = screen.getByPlaceholderText('输入项目名称...');
      fireEvent.change(nameInput, { target: { value: '   ' } });
      
      const createButton = screen.getByText('创建');
      expect(createButton).toBeDisabled();
    });

    it('should enable create button when name is entered', () => {
      renderProjectForm();
      
      const nameInput = screen.getByPlaceholderText('输入项目名称...');
      fireEvent.change(nameInput, { target: { value: 'New Project' } });
      
      const createButton = screen.getByText('创建');
      expect(createButton).not.toBeDisabled();
    });

    it('should call onCancel when cancel button is clicked', () => {
      renderProjectForm();
      
      fireEvent.click(screen.getByText('取消'));
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should create project when form is submitted', async () => {
      renderProjectForm();
      
      const nameInput = screen.getByPlaceholderText('输入项目名称...');
      fireEvent.change(nameInput, { target: { value: 'New Project' } });
      
      const createButton = screen.getByText('创建');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(mockElectronAPI.createProject).toHaveBeenCalledWith({
          name: 'New Project',
          color: PRESET_COLORS[0], // Default color
          status: 'active',
        });
      });
      
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('should show loading state while submitting', async () => {
      mockElectronAPI.createProject.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(createMockProject()), 100))
      );
      
      renderProjectForm();
      
      const nameInput = screen.getByPlaceholderText('输入项目名称...');
      fireEvent.change(nameInput, { target: { value: 'New Project' } });
      
      const createButton = screen.getByText('创建');
      fireEvent.click(createButton);
      
      expect(screen.getByText('保存中...')).toBeInTheDocument();
    });
  });

  describe('Edit Existing Project', () => {
    const existingProject = createMockProject({
      id: 'project-1',
      name: 'Existing Project',
      color: '#3b82f6',
    });

    it('should render edit project form when project is provided', () => {
      renderProjectForm({ project: existingProject });
      
      expect(screen.getByText('编辑项目')).toBeInTheDocument();
    });

    it('should pre-fill project name', () => {
      renderProjectForm({ project: existingProject });
      
      const nameInput = screen.getByPlaceholderText('输入项目名称...');
      expect(nameInput).toHaveValue('Existing Project');
    });

    it('should pre-select project color', () => {
      renderProjectForm({ project: existingProject });
      
      // The color picker should show the selected color
      const previewColor = screen.getByText(/预览:/).previousSibling;
      expect(previewColor).toHaveStyle({ backgroundColor: '#3b82f6' });
    });

    it('should have save button instead of create button', () => {
      renderProjectForm({ project: existingProject });
      
      expect(screen.getByText('保存')).toBeInTheDocument();
    });

    it('should update project when form is submitted', async () => {
      mockElectronAPI.updateProject.mockResolvedValue({ ...existingProject, name: 'Updated Name' });
      
      renderProjectForm({ project: existingProject });
      
      const nameInput = screen.getByPlaceholderText('输入项目名称...');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      
      const saveButton = screen.getByText('保存');
      await act(async () => {
        fireEvent.click(saveButton);
      });
      
      await waitFor(() => {
        expect(mockElectronAPI.updateProject).toHaveBeenCalledWith({
          ...existingProject,
          name: 'Updated Name',
        });
      });
      
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('should change color when different color is selected', async () => {
      renderProjectForm({ project: existingProject });
      
      // Get all color buttons (excluding form buttons)
      const colorButtons = screen.getAllByRole('button').filter(
        (btn) => btn.getAttribute('type') === 'button' && !btn.textContent
      );
      
      // Click the second color
      if (colorButtons.length > 1) {
        fireEvent.click(colorButtons[1]);
        
        const saveButton = screen.getByText('保存');
        await act(async () => {
          fireEvent.click(saveButton);
        });
        
        await waitFor(() => {
          expect(mockElectronAPI.updateProject).toHaveBeenCalledWith(
            expect.objectContaining({
              color: PRESET_COLORS[1],
            })
          );
        });
      }
    });
  });

  describe('Validation', () => {
    it('should trim whitespace from project name', async () => {
      renderProjectForm();
      
      const nameInput = screen.getByPlaceholderText('输入项目名称...');
      fireEvent.change(nameInput, { target: { value: '  Test Project  ' } });
      
      const createButton = screen.getByText('创建');
      await act(async () => {
        fireEvent.click(createButton);
      });
      
      await waitFor(() => {
        expect(mockElectronAPI.createProject).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Project',
          })
        );
      });
    });
  });
});
