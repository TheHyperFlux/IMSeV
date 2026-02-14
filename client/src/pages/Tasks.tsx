import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { Task, TaskStatus, TaskPriority, Project, User, Group } from '@/types';
import {
  Plus,
  Edit,
  Trash2,
  CheckSquare,
  Search,
  Calendar,
  User as UserIcon,
  Flag,
  Users,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<TaskStatus, string> = {
  todo: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  in_review: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export default function Tasks() {
  const { user: currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    assigneeId: '',
    groupId: '',
    dueDate: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, projectsRes, usersRes, groupsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects'),
        api.get('/users'),
        api.get('/groups')
      ]);

      const rawTasks = tasksRes.data?.data;
      let allTasks: Task[] = Array.isArray(rawTasks) ? rawTasks : [];
      const allProjects: Project[] = Array.isArray(projectsRes.data?.data) ? projectsRes.data.data : [];
      const allUsers: User[] = Array.isArray(usersRes.data?.data) ? usersRes.data.data : [];
      const allGroups: Group[] = Array.isArray(groupsRes.data?.data) ? groupsRes.data.data : [];

      setProjects(allProjects);
      setUsers(allUsers);
      setGroups(allGroups);

      // normalizeId for comparing IDs (API may return string or object)
      const norm = (v: unknown): string => {
        if (v == null) return '';
        if (typeof v === 'string') return v;
        if (typeof v === 'object' && v !== null) {
          const o = v as { id?: string; _id?: string };
          return o.id || o._id || '';
        }
        return String(v);
      };

      // Filter tasks based on role
      if (currentUser) {
        if (currentUser.role === 'admin') {
          setTasks(allTasks);
        } else if (currentUser.role === 'mentor') {
          const managedGroups = allGroups.filter(g =>
            (g.adminIds || []).some((id: unknown) => norm(id) === currentUser.id) ||
            (g.memberIds || []).some((id: unknown) => norm(id) === currentUser.id)
          );
          const managedGroupIds = new Set(managedGroups.map(g => g.id));
          const managedInternIds = new Set(
            managedGroups.flatMap(g => (g.memberIds || []).map((id: unknown) => norm(id)))
          );
          const visibleTasks = allTasks.filter(task =>
            norm(task.createdBy) === currentUser.id ||
            (norm(task.groupId) && managedGroupIds.has(norm(task.groupId))) ||
            (norm(task.assigneeId) && managedInternIds.has(norm(task.assigneeId)))
          );
          setTasks(visibleTasks);
        } else {
          // Intern: backend already returns only tasks assigned to them or their groups; show all returned
          setTasks(allTasks);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const interns = users.filter(u => u.role === 'intern');

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      projectId: '',
      status: 'todo',
      priority: 'medium',
      assigneeId: '',
      groupId: '',
      dueDate: '',
    });
  };

  const getFilteredTasks = () => {
    let filtered = tasks;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(term) ||
        (task.description || '').toLowerCase().includes(term)
      );
    }

    // Filter by tab
    if (activeTab === 'my') {
      filtered = filtered.filter(task => task.assigneeId === currentUser?.id);
    } else if (activeTab !== 'all') {
      filtered = filtered.filter(task => task.status === activeTab);
    }

    return filtered;
  };

  const handleCreateTask = async () => {
    try {
      const newTask: any = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        assigneeId: formData.assigneeId || undefined,
        groupId: formData.groupId || undefined,
        dueDate: formData.dueDate || undefined,
      };

      // Only include projectId if a project is actually selected
      if (formData.projectId) {
        newTask.projectId = formData.projectId;
      }

      const res = await api.post('/tasks', newTask);

      await api.post('/activity-logs', {
        userId: currentUser?.id,
        action: 'task_created',
        details: `Created task: ${formData.title}`,
        resourceType: 'task',
        resourceId: res.data.data.id,
      });

      toast.success('Task created successfully');
      fetchData();
      setCreateDialogOpen(false);
      resetForm();

    } catch (error: any) {
      console.error('Error creating task:', error);
      toast.error(error.response?.data?.error || 'Failed to create task');
    }
  };

  const getAvailableInterns = () => {
    if (currentUser?.role === 'mentor') {
      const relevantGroups = groups.filter(g =>
        g.adminIds.includes(currentUser.id) || g.memberIds.includes(currentUser.id)
      );
      const memberIds = new Set(relevantGroups.flatMap(g => g.memberIds));
      return interns.filter(u => memberIds.has(u.id));
    }
    return interns;
  };

  const availableInterns = getAvailableInterns();

  const handleEditTask = async () => {
    if (!selectedTask) return;

    try {
      const updateData: any = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        assigneeId: formData.assigneeId || undefined,
        groupId: formData.groupId || undefined,
        dueDate: formData.dueDate || undefined,
        completedAt: formData.status === 'completed' && selectedTask.status !== 'completed' ? new Date().toISOString() : undefined,
      };

      // Only include projectId if set; avoid sending empty string
      if (formData.projectId) {
        updateData.projectId = formData.projectId;
      }

      await api.put(`/tasks/${selectedTask.id}`, updateData);

      await api.post('/activity-logs', {
        userId: currentUser?.id,
        action: 'task_updated',
        details: `Updated task: ${formData.title}`,
        resourceType: 'task',
        resourceId: selectedTask.id,
      });

      toast.success('Task updated successfully');
      fetchData();
      setEditDialogOpen(false);
      setSelectedTask(null);
      resetForm();

    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error(error.response?.data?.error || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${taskId}`);
        toast.success('Task deleted successfully');
        fetchData();
      } catch (error: any) {
        console.error('Error deleting task:', error);
        toast.error(error.response?.data?.error || 'Failed to delete task');
      }
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, {
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
      });
      fetchData(); // Refresh to ensure sync
    } catch (error: any) {
      console.error('Error updating task status:', error);
      toast.error(error.response?.data?.error || 'Failed to update task status');
    }
  };

  const normalizeId = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      return (value as any).id || (value as any)._id || '';
    }
    return String(value);
  };

  const openEditDialog = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      projectId: normalizeId(task.projectId as any),
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId || '',
      groupId: task.groupId || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    });
    setEditDialogOpen(true);
  };

  const getProjectName = (projectId: any) => {
    const id = normalizeId(projectId);
    const project = projects.find(p => p.id === id);
    if (!project) return 'No Project';
    return project.name || (project as any).title || 'No Project';
  };

  const getAssigneeName = (assigneeId?: string | unknown, groupId?: string | unknown) => {
    const gid = normalizeId(groupId);
    if (gid) {
      const group = groups.find(g => g.id === gid);
      return group ? `Group: ${group.name}` : 'Unknown Group';
    }
    const aid = normalizeId(assigneeId);
    if (!aid) return 'Unassigned';
    const assignee = users.find(u => u.id === aid);
    return assignee?.name || 'Unknown';
  };

  const isAdminOrMentor = currentUser?.role === 'admin' || currentUser?.role === 'mentor';
  const filteredTasks = getFilteredTasks();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">
              Manage and track task progress
            </p>
          </div>
          {isAdminOrMentor && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Add a new task to a project
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Task Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter task title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the task"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project">Project *</Label>
                    <Select
                      value={formData.projectId}
                      onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name || (project as any).title || 'Untitled Project'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignee">Assign To (Individual) *</Label>
                    <Select
                      value={formData.assigneeId || "__unassigned__"}
                      onValueChange={(value) => setFormData({ ...formData, assigneeId: value === "__unassigned__" ? '' : value, groupId: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__unassigned__">Unassigned</SelectItem>
                        {availableInterns.map((intern) => (
                          <SelectItem key={intern.id} value={intern.id}>
                            {intern.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group">Or Assign To (Group) *</Label>
                    <Select
                      value={formData.groupId || "__nogroup__"}
                      onValueChange={(value) => setFormData({ ...formData, groupId: value === "__nogroup__" ? '' : value, assigneeId: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No Group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__nogroup__">No Group</SelectItem>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            <div className="flex items-center gap-2">
                              <Users className="h-3 w-3" />
                              {group.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTask}
                    disabled={
                      !formData.title ||
                      !formData.description ||
                      !formData.projectId ||
                      (!formData.assigneeId && !formData.groupId)
                    }
                  >
                    Create Task
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="my">My Tasks</TabsTrigger>
            <TabsTrigger value="todo">To Do</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tasks found.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">{task.title}</h3>
                            <Badge className={priorityColors[task.priority]} variant="outline">
                              <Flag className="h-3 w-3 mr-1" />
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                            {task.description || 'No description'}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CheckSquare className="h-3 w-3" />
                              {getProjectName(task.projectId)}
                            </span>
                            <span className="flex items-center gap-1">
                              {task.groupId ? <Users className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                              {getAssigneeName(task.assigneeId, task.groupId)}
                            </span>
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={task.status}
                            onValueChange={(value) => handleStatusChange(task.id, value as TaskStatus)}
                          >
                            <SelectTrigger className="w-32">
                              <Badge className={statusColors[task.status]}>
                                {task.status.replace('_', ' ')}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="in_review">In Review</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          {isAdminOrMentor && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(task)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Update task details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Task Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Project</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name || (project as any).title || 'Untitled Project'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Select
                    value={formData.assigneeId || "__unassigned__"}
                    onValueChange={(value) => setFormData({ ...formData, assigneeId: value === "__unassigned__" ? '' : value, groupId: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__unassigned__">Unassigned</SelectItem>
                      {availableInterns.map((intern) => (
                        <SelectItem key={intern.id} value={intern.id}>
                          {intern.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Or Assign To Group</Label>
                <Select
                  value={formData.groupId || "__nogroup__"}
                  onValueChange={(value) => setFormData({ ...formData, groupId: value === "__nogroup__" ? '' : value, assigneeId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__nogroup__">No Group</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          {group.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditTask}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}