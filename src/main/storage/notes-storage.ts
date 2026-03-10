import { BaseStorage } from './base-storage';
import { TaskNote, TaskLink } from '../../shared/types';

interface NotesStorageData {
  taskNotes: TaskNote[];
}

export class NotesStorage extends BaseStorage<NotesStorageData> {
  constructor(dataDir: string) {
    super({
      dataDir,
      fileName: 'notes.json',
      defaultValue: { taskNotes: [] },
    });
  }

  protected mergeWithDefault(parsed: Partial<NotesStorageData>): NotesStorageData {
    return {
      taskNotes: parsed.taskNotes || [],
    };
  }

  protected getDefaultValue(): NotesStorageData {
    return { taskNotes: [] };
  }

  getAll(): NotesStorageData {
    return { taskNotes: [...this.data.taskNotes] };
  }

  getItems(): TaskNote[] {
    return [...this.data.taskNotes];
  }

  getById(id: string): TaskNote | undefined {
    return this.data.taskNotes.find(n => n.id === id);
  }

  getByTask(taskId: string): TaskNote | undefined {
    return this.data.taskNotes.find(n => n.taskId === taskId);
  }

  create(taskId: string): TaskNote {
    const existing = this.getByTask(taskId);
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const newNote: TaskNote = {
      id: this.generateId(),
      taskId,
      content: '',
      links: [],
      createdAt: now,
      updatedAt: now,
    };
    this.data.taskNotes.push(newNote);
    this.markDirty();
    this.save();
    return newNote;
  }

  update(note: TaskNote): TaskNote {
    const index = this.data.taskNotes.findIndex(n => n.id === note.id);
    if (index === -1) {
      throw new Error(`TaskNote not found: ${note.id}`);
    }
    this.data.taskNotes[index] = {
      ...note,
      updatedAt: new Date().toISOString(),
    };
    this.markDirty();
    this.save();
    return this.data.taskNotes[index];
  }

  delete(id: string): boolean {
    const index = this.data.taskNotes.findIndex(n => n.id === id);
    if (index === -1) {
      return false;
    }
    this.data.taskNotes.splice(index, 1);
    this.markDirty();
    this.save();
    return true;
  }

  deleteByTask(taskId: string): boolean {
    const index = this.data.taskNotes.findIndex(n => n.taskId === taskId);
    if (index === -1) {
      return false;
    }
    this.data.taskNotes.splice(index, 1);
    this.markDirty();
    this.save();
    return true;
  }

  addLink(noteId: string, link: Omit<TaskLink, 'id' | 'createdAt'>): TaskLink {
    const note = this.getById(noteId);
    if (!note) {
      throw new Error(`TaskNote not found: ${noteId}`);
    }

    const newLink: TaskLink = {
      ...link,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };
    note.links.push(newLink);
    note.updatedAt = new Date().toISOString();
    this.markDirty();
    this.save();
    return newLink;
  }

  updateLink(noteId: string, link: TaskLink): TaskLink {
    const note = this.getById(noteId);
    if (!note) {
      throw new Error(`TaskNote not found: ${noteId}`);
    }

    const linkIndex = note.links.findIndex(l => l.id === link.id);
    if (linkIndex === -1) {
      throw new Error(`TaskLink not found: ${link.id}`);
    }
    note.links[linkIndex] = link;
    note.updatedAt = new Date().toISOString();
    this.markDirty();
    this.save();
    return note.links[linkIndex];
  }

  deleteLink(noteId: string, linkId: string): boolean {
    const note = this.getById(noteId);
    if (!note) {
      return false;
    }

    const linkIndex = note.links.findIndex(l => l.id === linkId);
    if (linkIndex === -1) {
      return false;
    }
    note.links.splice(linkIndex, 1);
    note.updatedAt = new Date().toISOString();
    this.markDirty();
    this.save();
    return true;
  }
}
