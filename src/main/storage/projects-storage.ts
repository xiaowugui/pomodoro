import { BaseStorage } from './base-storage';
import { Project } from '../../shared/types';

interface ProjectsStorageData {
  projects: Project[];
}

export class ProjectsStorage extends BaseStorage<ProjectsStorageData> {
  constructor(dataDir: string) {
    super({
      dataDir,
      fileName: 'projects.json',
      defaultValue: { projects: [] },
    });
  }

  protected mergeWithDefault(parsed: Partial<ProjectsStorageData>): ProjectsStorageData {
    const projects = (parsed.projects || []).map((p: Project) => ({
      ...p,
      status: p.status || 'active',
    }));
    return { projects };
  }

  protected getDefaultValue(): ProjectsStorageData {
    return { projects: [] };
  }

  getAll(): ProjectsStorageData {
    return { projects: [...this.data.projects] };
  }

  getItems(): Project[] {
    return [...this.data.projects];
  }

  getById(id: string): Project | undefined {
    return this.data.projects.find(p => p.id === id);
  }

  getActive(): Project[] {
    return this.data.projects.filter(p => p.status === 'active');
  }

  getCompleted(): Project[] {
    return this.data.projects.filter(p => p.status === 'completed');
  }

  create(project: Omit<Project, 'id' | 'createdAt'>): Project {
    const newProject: Project = {
      ...project,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      status: project.status || 'active',
    };
    this.data.projects.push(newProject);
    this.markDirty();
    this.save();
    return newProject;
  }

  update(project: Project): Project {
    const index = this.data.projects.findIndex(p => p.id === project.id);
    if (index === -1) {
      throw new Error(`Project not found: ${project.id}`);
    }
    this.data.projects[index] = { ...project };
    this.markDirty();
    this.save();
    return this.data.projects[index];
  }

  delete(id: string): boolean {
    const index = this.data.projects.findIndex(p => p.id === id);
    if (index === -1) {
      return false;
    }
    this.data.projects.splice(index, 1);
    this.markDirty();
    this.save();
    return true;
  }

  getProjectTaskIds(projectId: string): string[] {
    return this.data.projects
      .filter(p => p.id === projectId)
      .flatMap(() => []);
  }
}
