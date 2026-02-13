export type UserRole = 'admin' | 'mentor' | 'intern' | 'applicant';

export type ApplicationStatus = 'pending' | 'under_review' | 'interviewed' | 'accepted' | 'rejected' | 'on_hold';

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'completed';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed';

export type InternshipStatus = 'draft' | 'open' | 'closed' | 'filled';

export type DegreeType = 'SEE' | 'Higher Secondary' | 'Bachelor';

export interface Education {
  institution: string;
  degree: DegreeType;
  field: string;
  gpa?: string;
  yearPassed?: string;
  semester?: string; // For Bachelor degree
  year?: string; // For Bachelor degree (alternative to semester)
  current: boolean;
}

export interface Experience {
  company: string;
  position: string;
  description: string;
  startDate: string;
  endDate?: string;
  current: boolean;
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  bio?: string;
  skills?: string[];
  department?: string;
  education?: Education[];
  experience?: Experience[];
  joinedAt: string;
  isActive: boolean;
  profileCompleted?: boolean;
  assignedGroupId?: string;
  groupIds?: string[]; // For mentors: groups they manage
  managedInternIds?: string[]; // For mentors: interns they manage
}

export interface Application {
  id: string;
  userId: string;
  internshipId: string;
  name: string;
  email: string;
  phone: string;
  resume?: string;
  coverLetter: string;
  skills: string[];
  education: string;
  experience: string;
  preferredDepartment: string;
  availableFrom: string;
  duration: string;
  status: ApplicationStatus;
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  assignedGroupId?: string;
}

export interface Internship {
  id: string;
  title: string;
  description: string;
  department: string;
  location: string;
  duration: string;
  startDate: string;
  requirements: string[];
  responsibilities: string[];
  stipend?: string;
  slots: number;
  filledSlots: number;
  status: InternshipStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deadline?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  department: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  mentorId: string;
  internIds: string[];
  groupId?: string; // For group-based project assignment
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  groupId?: string; // For group-based task assignment
  dueDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface DailyLog {
  id: string;
  userId: string | { id: string; name: string };
  date: string;
  tasksCompleted: string;
  tasksPlanned: string;
  challenges?: string;
  learnings?: string;
  hoursWorked: number;
  mood: 'great' | 'good' | 'okay' | 'struggling';
  sharedWith?: string[]; // User IDs of mentors/admins this log is shared with
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string | { id: string; name: string; avatar?: string };
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  participantIds: (string | { id: string; name: string; avatar?: string })[];
  groupId?: string | { id: string; name: string };
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  adminIds: string[];
  chatId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  resourceType?: string;
  resourceId?: string;
}

// Helper function to check if profile is complete
export function isProfileComplete(user: User): boolean {
  return !!(
    user.name &&
    user.email &&
    user.phone &&
    user.skills && user.skills.length > 0 &&
    user.education && user.education.length > 0
  );
}
