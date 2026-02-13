import api from '@/lib/api';
import { Application, Project, Task, User, ActivityLog } from '@/types';

type ExportFormat = 'csv' | 'json';

interface ExportOptions {
  format: ExportFormat;
  filename: string;
}

const convertToCSV = (data: Record<string, any>[]): string => {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (Array.isArray(value)) return `"${value.join('; ')}"`;
      if (typeof value === 'object') return `"${JSON.stringify(value)}"`;
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportApplications = async (options: ExportOptions = { format: 'csv', filename: 'applications' }) => {
  try {
    const res = await api.get('/applications');
    const applications: Application[] = res.data.data;

    const data = applications.map(app => ({
      id: app.id,
      name: app.name,
      email: app.email,
      phone: app.phone,
      department: app.preferredDepartment,
      status: app.status,
      skills: app.skills,
      education: app.education,
      experience: app.experience,
      duration: app.duration,
      availableFrom: app.availableFrom,
      appliedAt: app.appliedAt,
      reviewedAt: app.reviewedAt || '',
      notes: app.notes || '',
    }));

    if (options.format === 'csv') {
      const csv = convertToCSV(data);
      downloadFile(csv, `${options.filename}.csv`, 'text/csv');
    } else {
      const json = JSON.stringify(data, null, 2);
      downloadFile(json, `${options.filename}.json`, 'application/json');
    }
  } catch (error) {
    console.error("Export failed", error);
  }
};

export const exportProjects = async (options: ExportOptions = { format: 'csv', filename: 'projects' }) => {
  try {
    const [projectsRes, usersRes] = await Promise.all([
      api.get('/projects'),
      api.get('/users')
    ]);
    const projects: Project[] = projectsRes.data.data;
    const users: User[] = usersRes.data.data;

    const data = projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      department: project.department,
      status: project.status,
      mentor: users.find(u => u.id === project.mentorId)?.name || '',
      interns: project.internIds.map(id => users.find(u => u.id === id)?.name || id).join('; '),
      startDate: project.startDate,
      endDate: project.endDate || '',
      createdAt: project.createdAt,
    }));

    if (options.format === 'csv') {
      const csv = convertToCSV(data);
      downloadFile(csv, `${options.filename}.csv`, 'text/csv');
    } else {
      const json = JSON.stringify(data, null, 2);
      downloadFile(json, `${options.filename}.json`, 'application/json');
    }
  } catch (error) {
    console.error("Export failed", error);
  }
};

export const exportTasks = async (options: ExportOptions = { format: 'csv', filename: 'tasks' }) => {
  try {
    const [tasksRes, usersRes, projectsRes] = await Promise.all([
      api.get('/tasks'),
      api.get('/users'),
      api.get('/projects')
    ]);
    const tasks: Task[] = tasksRes.data.data;
    const users: User[] = usersRes.data.data;
    const projects: Project[] = projectsRes.data.data;

    const data = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      project: projects.find(p => p.id === task.projectId)?.name || '',
      status: task.status,
      priority: task.priority,
      assignee: users.find(u => u.id === task.assigneeId)?.name || '',
      createdBy: users.find(u => u.id === task.createdBy)?.name || '',
      dueDate: task.dueDate || '',
      createdAt: task.createdAt,
      completedAt: task.completedAt || '',
    }));

    if (options.format === 'csv') {
      const csv = convertToCSV(data);
      downloadFile(csv, `${options.filename}.csv`, 'text/csv');
    } else {
      const json = JSON.stringify(data, null, 2);
      downloadFile(json, `${options.filename}.json`, 'application/json');
    }
  } catch (error) {
    console.error("Export failed", error);
  }
};

export const exportUsers = async (options: ExportOptions = { format: 'csv', filename: 'users' }) => {
  try {
    const res = await api.get('/users');
    const users: User[] = res.data.data;

    const data = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      skills: user.skills || [],
      phone: user.phone || '',
      bio: user.bio || '',
      isActive: user.isActive,
      joinedAt: user.joinedAt,
    }));

    if (options.format === 'csv') {
      const csv = convertToCSV(data);
      downloadFile(csv, `${options.filename}.csv`, 'text/csv');
    } else {
      const json = JSON.stringify(data, null, 2);
      downloadFile(json, `${options.filename}.json`, 'application/json');
    }
  } catch (error) {
    console.error("Export failed", error);
  }
};

export const exportActivityLogs = async (options: ExportOptions = { format: 'csv', filename: 'activity-logs' }) => {
  try {
    const [logsRes, usersRes] = await Promise.all([
      api.get('/activity-logs'),
      api.get('/users')
    ]);
    const logs: ActivityLog[] = logsRes.data.data;
    const users: User[] = usersRes.data.data;

    const data = logs.map(log => ({
      id: log.id,
      user: users.find(u => u.id === log.userId)?.name || '',
      action: log.action,
      details: log.details,
      resourceType: log.resourceType || '',
      resourceId: log.resourceId || '',
      timestamp: log.timestamp,
    }));

    if (options.format === 'csv') {
      const csv = convertToCSV(data);
      downloadFile(csv, `${options.filename}.csv`, 'text/csv');
    } else {
      const json = JSON.stringify(data, null, 2);
      downloadFile(json, `${options.filename}.json`, 'application/json');
    }
  } catch (error) {
    console.error("Export failed", error);
  }
};