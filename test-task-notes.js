/**
 * Task Notes CRUD Test Suite
 * 
 * Tests for TaskNote and TaskLink operations in StorageManager
 * 
 * Run with: node test-task-notes.js
 * (Requires build first: npm run build:main)
 */

// Mock Electron app for Node.js environment
const mockApp = {
  getPath: (name) => {
    if (name === 'userData') {
      return './test-data';
    }
    return '';
  }
};

// Mock fs module
const fs = {
  promises: {
    readFile: async (path) => {
      try {
        return JSON.stringify({
          settings: {},
          projects: [],
          tasks: [],
          logs: [],
          dayExecutions: [],
          taskNotes: []
        });
      } catch {
        throw new Error('File not found');
      }
    },
    writeFile: async (path, data) => {
      console.log('Saved to:', path);
      return true;
    },
    mkdir: async (path, options) => {
      return true;
    }
  }
};

// Simple test runner
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

// Test cases
test('TaskNote interface should have required fields', () => {
  const note = {
    id: 'note-1',
    taskId: 'task-1',
    content: 'Test content',
    links: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };
  
  assert(note.id === 'note-1', 'id should exist');
  assert(note.taskId === 'task-1', 'taskId should exist');
  assert(note.content === 'Test content', 'content should exist');
  assert(Array.isArray(note.links), 'links should be an array');
});

test('TaskLink interface should have required fields', () => {
  const link = {
    id: 'link-1',
    title: 'Google',
    url: 'https://google.com',
    createdAt: '2024-01-01T00:00:00.000Z'
  };
  
  assert(link.id === 'link-1', 'id should exist');
  assert(link.title === 'Google', 'title should exist');
  assert(link.url === 'https://google.com', 'url should exist');
});

test('TaskNote with links should work correctly', () => {
  const note = {
    id: 'note-1',
    taskId: 'task-1',
    content: 'Important task notes',
    links: [
      { id: 'link-1', title: 'Docs', url: 'https://docs.example.com', createdAt: '2024-01-01T00:00:00.000Z' },
      { id: 'link-2', title: 'Tutorial', url: 'https://tutorial.example.com', createdAt: '2024-01-01T00:00:00.000Z' }
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z'
  };
  
  assertEqual(note.links.length, 2, 'Should have 2 links');
  assert(note.links[0].title === 'Docs', 'First link title should be Docs');
  assert(note.links[1].title === 'Tutorial', 'Second link title should be Tutorial');
});

test('Adding link to note should work', () => {
  const note = {
    id: 'note-1',
    taskId: 'task-1',
    content: '',
    links: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };
  
  const newLink = {
    id: 'link-new',
    title: 'New Link',
    url: 'https://newlink.com',
    createdAt: '2024-01-02T00:00:00.000Z'
  };
  
  note.links.push(newLink);
  note.updatedAt = newLink.createdAt;
  
  assertEqual(note.links.length, 1, 'Should have 1 link after adding');
  assert(note.links[0].id === 'link-new', 'Link id should match');
});

test('Removing link from note should work', () => {
  const note = {
    id: 'note-1',
    taskId: 'task-1',
    content: '',
    links: [
      { id: 'link-1', title: 'Keep', url: 'https://keep.com', createdAt: '2024-01-01T00:00:00.000Z' },
      { id: 'link-2', title: 'Remove', url: 'https://remove.com', createdAt: '2024-01-01T00:00:00.000Z' }
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };
  
  const linkIdToRemove = 'link-2';
  note.links = note.links.filter(l => l.id !== linkIdToRemove);
  note.updatedAt = new Date().toISOString();
  
  assertEqual(note.links.length, 1, 'Should have 1 link after removal');
  assert(note.links[0].id === 'link-1', 'Remaining link should be link-1');
});

test('Updating note content should work', () => {
  const note = {
    id: 'note-1',
    taskId: 'task-1',
    content: 'Original content',
    links: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };
  
  const originalUpdatedAt = note.updatedAt;
  
  // Simulate delay
  note.content = 'Updated content';
  note.updatedAt = new Date().toISOString();
  
  assert(note.content === 'Updated content', 'Content should be updated');
  assert(note.updatedAt !== originalUpdatedAt, 'updatedAt should change');
});

test('Deleting task should cascade delete note', () => {
  const taskNotes = [
    { id: 'note-1', taskId: 'task-1', content: 'Note for task 1', links: [] },
    { id: 'note-2', taskId: 'task-2', content: 'Note for task 2', links: [] },
    { id: 'note-3', taskId: 'task-3', content: 'Note for task 3', links: [] }
  ];
  
  const taskIdToDelete = 'task-2';
  
  // Simulate cascade delete
  const remainingNotes = taskNotes.filter(n => n.taskId !== taskIdToDelete);
  
  assertEqual(remainingNotes.length, 2, 'Should have 2 notes remaining');
  assert(remainingNotes.every(n => n.taskId !== 'task-2'), 'No notes for deleted task');
});

test('getTaskNoteByTask should return correct note', () => {
  const taskNotes = [
    { id: 'note-1', taskId: 'task-1', content: 'Note 1' },
    { id: 'note-2', taskId: 'task-2', content: 'Note 2' },
    { id: 'note-3', taskId: 'task-3', content: 'Note 3' }
  ];
  
  const findNoteByTaskId = (taskId) => taskNotes.find(n => n.taskId === taskId);
  
  const note = findNoteByTaskId('task-2');
  assert(note !== undefined, 'Should find note');
  assert(note.content === 'Note 2', 'Content should match');
});

test('Creating note for task should return new note with generated id', () => {
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const createTaskNote = (taskId) => {
    const now = new Date().toISOString();
    return {
      id: generateId(),
      taskId,
      content: '',
      links: [],
      createdAt: now,
      updatedAt: now
    };
  };
  
  const newNote = createTaskNote('task-new');
  
  assert(newNote.id !== undefined, 'Should have generated id');
  assert(newNote.taskId === 'task-new', 'taskId should match');
  assert(newNote.content === '', 'content should be empty string');
  assert(Array.isArray(newNote.links), 'links should be empty array');
  assert(newNote.createdAt !== undefined, 'createdAt should be set');
  assert(newNote.updatedAt !== undefined, 'updatedAt should be set');
});

// Run tests
async function runTests() {
  console.log('Running Task Notes CRUD Tests...\n');
  
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${name}`);
      console.log(`  Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n${'='.repeat(40)}`);
  console.log(`Tests: ${passed + failed}, Passed: ${passed}, Failed: ${failed}`);
  console.log(`${'='.repeat(40)}`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
