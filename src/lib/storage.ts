import { User, Application, Project, Task, Message, Chat, Group, Notification, ActivityLog, DailyLog, Internship } from '@/types';

const STORAGE_KEYS = {
  USERS: 'ims_users',
  APPLICATIONS: 'ims_applications',
  PROJECTS: 'ims_projects',
  TASKS: 'ims_tasks',
  MESSAGES: 'ims_messages',
  CHATS: 'ims_chats',
  GROUPS: 'ims_groups',
  NOTIFICATIONS: 'ims_notifications',
  ACTIVITY_LOGS: 'ims_activity_logs',
  CURRENT_USER: 'ims_current_user',
  DAILY_LOGS: 'ims_daily_logs',
  INTERNSHIPS: 'ims_internships',
};

// Generic storage functions
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// User functions
export const getUsers = (): User[] => getItem(STORAGE_KEYS.USERS, []);
export const setUsers = (users: User[]): void => setItem(STORAGE_KEYS.USERS, users);
export const getUserById = (id: string): User | undefined => getUsers().find(u => u.id === id);
export const getUserByEmail = (email: string): User | undefined => getUsers().find(u => u.email === email);

export const addUser = (user: User): void => {
  const users = getUsers();
  users.push(user);
  setUsers(users);
};

export const updateUser = (id: string, updates: Partial<User>): void => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    setUsers(users);
  }
};

export const deleteUser = (id: string): void => {
  setUsers(getUsers().filter(u => u.id !== id));
};

// Current user (auth)
export const getCurrentUser = (): User | null => getItem(STORAGE_KEYS.CURRENT_USER, null);
export const setCurrentUser = (user: User | null): void => setItem(STORAGE_KEYS.CURRENT_USER, user);

// Application functions
export const getApplications = (): Application[] => getItem(STORAGE_KEYS.APPLICATIONS, []);
export const setApplications = (apps: Application[]): void => setItem(STORAGE_KEYS.APPLICATIONS, apps);
export const getApplicationById = (id: string): Application | undefined => getApplications().find(a => a.id === id);
export const getApplicationsByUserId = (userId: string): Application[] => getApplications().filter(a => a.userId === userId);
export const getApplicationsByInternshipId = (internshipId: string): Application[] => getApplications().filter(a => a.internshipId === internshipId);

export const addApplication = (app: Application): void => {
  const apps = getApplications();
  apps.push(app);
  setApplications(apps);
};

export const updateApplication = (id: string, updates: Partial<Application>): void => {
  const apps = getApplications();
  const index = apps.findIndex(a => a.id === id);
  if (index !== -1) {
    apps[index] = { ...apps[index], ...updates };
    setApplications(apps);
  }
};

export const deleteApplication = (id: string): void => {
  setApplications(getApplications().filter(a => a.id !== id));
};

// Internship functions
export const getInternships = (): Internship[] => getItem(STORAGE_KEYS.INTERNSHIPS, []);
export const setInternships = (internships: Internship[]): void => setItem(STORAGE_KEYS.INTERNSHIPS, internships);
export const getInternshipById = (id: string): Internship | undefined => getInternships().find(i => i.id === id);

export const addInternship = (internship: Internship): void => {
  const internships = getInternships();
  internships.push(internship);
  setInternships(internships);
};

export const updateInternship = (id: string, updates: Partial<Internship>): void => {
  const internships = getInternships();
  const index = internships.findIndex(i => i.id === id);
  if (index !== -1) {
    internships[index] = { ...internships[index], ...updates };
    setInternships(internships);
  }
};

export const deleteInternship = (id: string): void => {
  setInternships(getInternships().filter(i => i.id !== id));
};

// Project functions
export const getProjects = (): Project[] => getItem(STORAGE_KEYS.PROJECTS, []);
export const setProjects = (projects: Project[]): void => setItem(STORAGE_KEYS.PROJECTS, projects);
export const getProjectById = (id: string): Project | undefined => getProjects().find(p => p.id === id);

export const addProject = (project: Project): void => {
  const projects = getProjects();
  projects.push(project);
  setProjects(projects);
};

export const updateProject = (id: string, updates: Partial<Project>): void => {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === id);
  if (index !== -1) {
    projects[index] = { ...projects[index], ...updates };
    setProjects(projects);
  }
};

export const deleteProject = (id: string): void => {
  setProjects(getProjects().filter(p => p.id !== id));
};

// Task functions
export const getTasks = (): Task[] => getItem(STORAGE_KEYS.TASKS, []);
export const setTasks = (tasks: Task[]): void => setItem(STORAGE_KEYS.TASKS, tasks);
export const getTaskById = (id: string): Task | undefined => getTasks().find(t => t.id === id);
export const getTasksByProjectId = (projectId: string): Task[] => getTasks().filter(t => t.projectId === projectId);
export const getTasksByAssigneeId = (assigneeId: string): Task[] => getTasks().filter(t => t.assigneeId === assigneeId);

export const addTask = (task: Task): void => {
  const tasks = getTasks();
  tasks.push(task);
  setTasks(tasks);
};

export const updateTask = (id: string, updates: Partial<Task>): void => {
  const tasks = getTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates };
    setTasks(tasks);
  }
};

export const deleteTask = (id: string): void => {
  setTasks(getTasks().filter(t => t.id !== id));
};

// Daily Log functions
export const getDailyLogs = (): DailyLog[] => getItem(STORAGE_KEYS.DAILY_LOGS, []);
export const setDailyLogs = (logs: DailyLog[]): void => setItem(STORAGE_KEYS.DAILY_LOGS, logs);
export const getDailyLogById = (id: string): DailyLog | undefined => getDailyLogs().find(l => l.id === id);
export const getDailyLogsByUserId = (userId: string): DailyLog[] => 
  getDailyLogs().filter(l => l.userId === userId).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

export const addDailyLog = (log: DailyLog): void => {
  const logs = getDailyLogs();
  logs.push(log);
  setDailyLogs(logs);
};

export const updateDailyLog = (id: string, updates: Partial<DailyLog>): void => {
  const logs = getDailyLogs();
  const index = logs.findIndex(l => l.id === id);
  if (index !== -1) {
    logs[index] = { ...logs[index], ...updates };
    setDailyLogs(logs);
  }
};

export const deleteDailyLog = (id: string): void => {
  setDailyLogs(getDailyLogs().filter(l => l.id !== id));
};

// Chat functions
export const getChats = (): Chat[] => getItem(STORAGE_KEYS.CHATS, []);
export const setChats = (chats: Chat[]): void => setItem(STORAGE_KEYS.CHATS, chats);
export const getChatById = (id: string): Chat | undefined => getChats().find(c => c.id === id);
export const getChatsByUserId = (userId: string): Chat[] => getChats().filter(c => c.participantIds.includes(userId));
export const getChatByGroupId = (groupId: string): Chat | undefined => getChats().find(c => c.groupId === groupId);

export const addChat = (chat: Chat): void => {
  const chats = getChats();
  chats.push(chat);
  setChats(chats);
};

export const updateChat = (id: string, updates: Partial<Chat>): void => {
  const chats = getChats();
  const index = chats.findIndex(c => c.id === id);
  if (index !== -1) {
    chats[index] = { ...chats[index], ...updates };
    setChats(chats);
  }
};

// Message functions
export const getMessages = (): Message[] => getItem(STORAGE_KEYS.MESSAGES, []);
export const setMessages = (messages: Message[]): void => setItem(STORAGE_KEYS.MESSAGES, messages);
export const getMessagesByChatId = (chatId: string): Message[] => 
  getMessages().filter(m => m.chatId === chatId).sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

export const addMessage = (message: Message): void => {
  const messages = getMessages();
  messages.push(message);
  setMessages(messages);
  // Update chat's last message
  updateChat(message.chatId, {
    lastMessage: message.content,
    lastMessageAt: message.timestamp,
  });
};

// Group functions
export const getGroups = (): Group[] => getItem(STORAGE_KEYS.GROUPS, []);
export const setGroups = (groups: Group[]): void => setItem(STORAGE_KEYS.GROUPS, groups);
export const getGroupById = (id: string): Group | undefined => getGroups().find(g => g.id === id);
export const getGroupsByUserId = (userId: string): Group[] => getGroups().filter(g => g.memberIds.includes(userId));

export const addGroup = (group: Group): void => {
  const groups = getGroups();
  groups.push(group);
  setGroups(groups);
  
  // Update mentor groupIds and managedInternIds
  updateMentorPermissions();
};

export const updateGroup = (id: string, updates: Partial<Group>): void => {
  const groups = getGroups();
  const index = groups.findIndex(g => g.id === id);
  if (index !== -1) {
    groups[index] = { ...groups[index], ...updates };
    setGroups(groups);
    
    // Update mentor groupIds and managedInternIds
    updateMentorPermissions();
  }
};

// Update mentor permissions based on group assignments
const updateMentorPermissions = (): void => {
  const users = getUsers();
  const groups = getGroups();
  
  // Reset all mentor permissions
  users.forEach(user => {
    if (user.role === 'mentor') {
      user.groupIds = [];
      user.managedInternIds = [];
    }
  });
  
  // Update permissions based on groups
  groups.forEach(group => {
    group.adminIds.forEach(adminId => {
      const mentor = users.find(u => u.id === adminId && u.role === 'mentor');
      if (mentor) {
        if (!mentor.groupIds) mentor.groupIds = [];
        if (!mentor.managedInternIds) mentor.managedInternIds = [];
        
        if (!mentor.groupIds.includes(group.id)) {
          mentor.groupIds.push(group.id);
        }
        
        group.memberIds.forEach(memberId => {
          if (!mentor.managedInternIds.includes(memberId)) {
            mentor.managedInternIds.push(memberId);
          }
        });
      }
    });
  });
  
  setUsers(users);
};

export const deleteGroup = (id: string): void => {
  setGroups(getGroups().filter(g => g.id !== id));
};

// Notification functions
export const getNotifications = (): Notification[] => getItem(STORAGE_KEYS.NOTIFICATIONS, []);
export const setNotifications = (notifications: Notification[]): void => setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
export const getNotificationsByUserId = (userId: string): Notification[] => 
  getNotifications().filter(n => n.userId === userId).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

export const addNotification = (notification: Notification): void => {
  const notifications = getNotifications();
  notifications.push(notification);
  setNotifications(notifications);
};

export const markNotificationAsRead = (id: string): void => {
  const notifications = getNotifications();
  const index = notifications.findIndex(n => n.id === id);
  if (index !== -1) {
    notifications[index].isRead = true;
    setNotifications(notifications);
  }
};

// Activity log functions
export const getActivityLogs = (): ActivityLog[] => getItem(STORAGE_KEYS.ACTIVITY_LOGS, []);
export const setActivityLogs = (logs: ActivityLog[]): void => setItem(STORAGE_KEYS.ACTIVITY_LOGS, logs);

export const addActivityLog = (log: ActivityLog): void => {
  const logs = getActivityLogs();
  logs.push(log);
  setActivityLogs(logs);
};

export const getActivityLogsByUserId = (userId: string): ActivityLog[] => 
  getActivityLogs().filter(l => l.userId === userId).sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

export const getRecentActivityLogs = (limit: number = 10): ActivityLog[] =>
  getActivityLogs().sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, limit);

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Initialize with default admin user if no users exist
export const initializeStorage = (): void => {
  const users = getUsers();
  if (users.length === 0) {
    const adminUser: User = {
      id: generateId(),
      email: 'admin@internship.com',
      password: 'admin123',
      name: 'System Admin',
      role: 'admin',
      bio: 'System administrator for the Internship Management System',
      department: 'Administration',
      joinedAt: new Date().toISOString(),
      isActive: true,
    };
    addUser(adminUser);
    
    // Add a sample mentor
    const mentorUser: User = {
      id: generateId(),
      email: 'mentor@internship.com',
      password: 'mentor123',
      name: 'John Mentor',
      role: 'mentor',
      bio: 'Senior Software Engineer and Intern Mentor',
      department: 'Engineering',
      skills: ['React', 'Node.js', 'Python', 'System Design'],
      joinedAt: new Date().toISOString(),
      isActive: true,
    };
    addUser(mentorUser);
  }
  
  // Update mentor permissions based on existing groups
  updateMentorPermissions();
};