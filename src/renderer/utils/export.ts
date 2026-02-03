import { PomodoroLog } from '@shared/types';

export const exportToCSV = (logs: PomodoroLog[], filename: string = 'pomodoro_logs.csv') => {
  const headers = ['ID', 'Task ID', 'Project ID', 'Start Time', 'End Time', 'Duration (minutes)', 'Completed', 'Type'];
  const rows = logs.map(log => [
    log.id,
    log.taskId,
    log.projectId,
    log.startTime,
    log.endTime,
    Math.round(log.duration / 60).toString(),
    log.completed ? 'Yes' : 'No',
    log.type
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
