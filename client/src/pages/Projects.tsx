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
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import api from '@/lib/api';
import { Project, ProjectStatus, User, Group } from '@/types';
import {
  Plus,
  Edit,
  Trash2,
  FolderKanban,
  Calendar,
  Users,
  Search,
  Loader2,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<ProjectStatus, string> = {
  planning: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  on_hold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

const defaultDepartments = [
  'Engineering',
  'Design',
  'Marketing',
  'Product',
  'Data Science',
  'Operations',
];

export default function Projects() {
  const { user: currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<Project | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: '',
    status: 'planning' as ProjectStatus,
    startDate: '',
    endDate: '',
    mentorId: '',
    internIds: [] as string[],
  });

  const normalizeId = (value: unknown): string => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
      const o = value as { id?: string; _id?: string };
      return o.id || o._id || '';
    }
    return String(value);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, usersRes, groupsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/users'),
        api.get('/groups')
      ]);

      const rawProjects = projectsRes.data?.data;
      let allProjects: Project[] = Array.isArray(rawProjects) ? rawProjects : [];
      const allUsers: User[] = Array.isArray(usersRes.data?.data) ? usersRes.data.data : [];
      const allGroups: Group[] = Array.isArray(groupsRes.data?.data) ? groupsRes.data.data : [];

      setUsers(allUsers);
      setGroups(allGroups);

      const norm = (v: unknown): string => {
        if (v == null) return '';
        if (typeof v === 'string') return v;
        if (typeof v === 'object' && v !== null) {
          const o = v as { id?: string; _id?: string };
          return o.id || o._id || '';
        }
        return String(v);
      };

      // Filter projects based on role (backend already filters; this guards client-side)
      if (currentUser) {
        if (currentUser.role === 'admin') {
          setProjects(allProjects);
        } else if (currentUser.role === 'mentor') {
          const mentorGroups = allGroups.filter(g =>
            (g.adminIds || []).some((id: unknown) => norm(id) === currentUser.id) ||
            (g.memberIds || []).some((id: unknown) => norm(id) === currentUser.id)
          );
          const groupIds = new Set(mentorGroups.map(g => g.id));
          const visibleProjects = allProjects.filter(p =>
            norm(p.mentorId) === currentUser.id ||
            (norm(p.groupId) && groupIds.has(norm(p.groupId)))
          );
          setProjects(visibleProjects);
        } else if (currentUser.role === 'intern') {
          const visibleProjects = allProjects.filter(p =>
            (p.internIds || []).some((id: unknown) => norm(id) === currentUser.id)
          );
          setProjects(visibleProjects);
        } else {
          setProjects([]);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const mentors = users.filter(u => u.role === 'mentor' || u.role === 'admin');

  // All users with intern role (for display; filtering by group uses normalized IDs below)
  const allInternsList = users.filter(u => u.role === 'intern');

  // For mentor: show interns from their groups; for admin: show all interns. Use normalized IDs.
  const getAvailableInterns = (): User[] => {
    if (!allInternsList.length) return [];
    if (currentUser?.role === 'admin') return allInternsList;
    if (currentUser?.role === 'mentor') {
      const relevantGroups = groups.filter(g =>
        (g.adminIds || []).some((id: unknown) => normalizeId(id) === currentUser.id) ||
        (g.memberIds || []).some((id: unknown) => normalizeId(id) === currentUser.id)
      );
      const memberIds = new Set(
        relevantGroups.flatMap(g => (g.memberIds || []).map((id: unknown) => normalizeId(id)))
      );
      if (memberIds.size === 0) return allInternsList; // Mentor with no groups: show all interns
      return allInternsList.filter(u => memberIds.has(u.id));
    }
    return allInternsList;
  };

  const interns = getAvailableInterns();

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      department: '',
      status: 'planning',
      startDate: '',
      endDate: '',
      mentorId: '',
      internIds: [],
    });
  };

  const filteredProjects = projects.filter(project => {
    const name = (project.name || '').toLowerCase();
    const department = (project.department || '').toLowerCase();
    const term = searchTerm.toLowerCase();

    return name.includes(term) || department.includes(term);
  });

  const handleCreateProject = async () => {
    try {
      const newProject = {
        title: formData.name,
        description: formData.description,
        department: formData.department,
        status: formData.status,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        mentorId: formData.mentorId,
        internIds: formData.internIds,
      };

      const res = await api.post('/projects', newProject);

      await api.post('/activity-logs', {
        userId: currentUser?.id,
        action: 'project_created',
        details: `Created project: ${formData.name}`,
        resourceType: 'project',
        resourceId: res.data.data.id,
      });

      toast.success('Project created successfully');
      fetchData();
      setCreateDialogOpen(false);
      resetForm();

    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error(error.response?.data?.error || 'Failed to create project');
    }
  };

  const handleEditProject = async () => {
    if (!selectedProject) return;

    try {
      const updateData = {
        name: formData.name,
        description: formData.description,
        department: formData.department,
        status: formData.status,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        mentorId: formData.mentorId,
        internIds: formData.internIds,
      };

      await api.put(`/projects/${selectedProject.id}`, updateData);

      await api.post('/activity-logs', {
        userId: currentUser?.id,
        action: 'project_updated',
        details: `Updated project: ${formData.name}`,
        resourceType: 'project',
        resourceId: selectedProject.id,
      });

      toast.success('Project updated successfully');
      fetchData();
      setEditDialogOpen(false);
      setSelectedProject(null);
      resetForm();

    } catch (error: any) {
      console.error('Error updating project:', error);
      toast.error(error.response?.data?.error || 'Failed to update project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await api.delete(`/projects/${projectId}`);
        toast.success('Project deleted successfully');
        fetchData();
      } catch (error: any) {
        console.error('Error deleting project:', error);
        toast.error(error.response?.data?.error || 'Failed to delete project');
      }
    }
  };

  const openEditDialog = (project: Project) => {
    setSelectedProject(project);
    const internIdStrings = (project.internIds || []).map((id: unknown) => normalizeId(id)).filter(Boolean);
    setFormData({
      name: project.name || (project as any).title || '',
      description: project.description || '',
      department: project.department || '',
      status: project.status,
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      mentorId: normalizeId(project.mentorId as any),
      internIds: internIdStrings,
    });
    setEditDialogOpen(true);
  };

  const getMentorName = (mentorId: any) => {
    const id = normalizeId(mentorId);
    const mentor = users.find(u => u.id === id);
    return mentor?.name || 'Unassigned';
  };

  const isAdminOrMentor = currentUser?.role === 'admin' || currentUser?.role === 'mentor';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-muted-foreground">
              Manage internship projects and assignments
            </p>
          </div>
          {isAdminOrMentor && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[90vh] flex flex-col overflow-hidden sm:max-h-[85vh]">
                <DialogHeader className="shrink-0">
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Add a new project for interns to work on
                  </DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto min-h-0 flex-1 pr-1 -mr-1 overscroll-contain">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter project name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the project"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department (optional)</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="Enter department or leave blank"
                        list="department-suggestions"
                      />
                      <datalist id="department-suggestions">
                        {defaultDepartments.map((dept) => (
                          <option key={dept} value={dept} />
                        ))}
                      </datalist>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value as ProjectStatus })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mentor">Mentor *</Label>
                    <Select
                      value={formData.mentorId}
                      onValueChange={(value) => setFormData({ ...formData, mentorId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select mentor" />
                      </SelectTrigger>
                      <SelectContent>
                        {mentors.map((mentor) => (
                          <SelectItem key={mentor.id} value={mentor.id}>
                            {mentor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assign Interns (optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between font-normal"
                        >
                          {formData.internIds.length === 0
                            ? 'Select interns...'
                            : `${formData.internIds.length} intern(s) selected`}
                          <span className="opacity-50">▼</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[200px] max-w-[min(320px,100vw-2rem)] p-0 z-[100]" align="start" sideOffset={8}>
                        <div className="max-h-[220px] overflow-y-auto overflow-x-hidden p-2" style={{ overscrollBehavior: 'contain' }}>
                          <div className="space-y-2">
                            {interns.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-3 px-1">No interns available. Add users with intern role in Users.</p>
                            ) : (
                              interns.map((intern) => (
                                <div key={intern.id} className="flex items-center space-x-2 py-1">
                                  <Checkbox
                                    id={`create-intern-${intern.id}`}
                                    checked={formData.internIds.includes(intern.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFormData(prev => ({ ...prev, internIds: [...prev.internIds, intern.id] }));
                                      } else {
                                        setFormData(prev => ({ ...prev, internIds: prev.internIds.filter(id => id !== intern.id) }));
                                      }
                                    }}
                                  />
                                  <label htmlFor={`create-intern-${intern.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1 truncate">
                                    {intern.name}
                                  </label>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                </div>
                <DialogFooter className="shrink-0 border-t pt-4 mt-4">
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateProject}
                    disabled={!formData.name || !formData.mentorId}
                  >
                    Create Project
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No projects found.</p>
              {isAdminOrMentor && (
                <Button className="mt-4" onClick={() => { resetForm(); setCreateDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {project.name || (project as any).title || 'Untitled Project'}
                      </CardTitle>
                      <CardDescription>{project.department}</CardDescription>
                    </div>
                    <Badge className={statusColors[project.status]}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description || 'No description provided'}
                  </p>

                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Mentor: {getMentorName(project.mentorId)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(project.startDate).toLocaleDateString()}
                      {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString()}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{(project.internIds || []).length} intern(s) assigned</span>
                  </div>

                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setSelectedProjectDetail(project); setDetailDialogOpen(true); }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View details
                    </Button>
                    {isAdminOrMentor && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openEditDialog(project)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProject(project.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[90vh] flex flex-col overflow-hidden sm:max-h-[85vh]">
            <DialogHeader className="shrink-0">
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update project details and assignments
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto min-h-0 flex-1 pr-1 -mr-1 overscroll-contain">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Project Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department (optional)</Label>
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Enter department or leave blank"
                    list="edit-department-suggestions"
                  />
                  <datalist id="edit-department-suggestions">
                    {defaultDepartments.map((dept) => (
                      <option key={dept} value={dept} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as ProjectStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mentor</Label>
                <Select
                  value={formData.mentorId}
                  onValueChange={(value) => setFormData({ ...formData, mentorId: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mentors.map((mentor) => (
                      <SelectItem key={mentor.id} value={mentor.id}>
                        {mentor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assign Interns</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                    >
                      {formData.internIds.length === 0
                        ? 'Select interns...'
                        : `${formData.internIds.length} intern(s) selected`}
                      <span className="opacity-50">▼</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[200px] max-w-[min(320px,100vw-2rem)] p-0 z-[100]" align="start" sideOffset={8}>
                    <div className="max-h-[220px] overflow-y-auto overflow-x-hidden p-2" style={{ overscrollBehavior: 'contain' }}>
                      <div className="space-y-2">
                        {interns.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-3 px-1">No interns available. Add users with intern role in Users.</p>
                        ) : (
                          interns.map((intern) => (
                            <div key={intern.id} className="flex items-center space-x-2 py-1">
                              <Checkbox
                                id={`edit-intern-${intern.id}`}
                                checked={formData.internIds.includes(intern.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData(prev => ({ ...prev, internIds: [...prev.internIds, intern.id] }));
                                  } else {
                                    setFormData(prev => ({ ...prev, internIds: prev.internIds.filter(id => id !== intern.id) }));
                                  }
                                }}
                              />
                              <label htmlFor={`edit-intern-${intern.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1 truncate">
                                {intern.name}
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            </div>
            <DialogFooter className="shrink-0 border-t pt-4 mt-4">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditProject}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Project detail dialog: admin, assigned mentor, and assigned interns can view */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-lg">
            {selectedProjectDetail && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl">
                    {selectedProjectDetail.name || (selectedProjectDetail as any).title || 'Project'}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedProjectDetail.department || 'No department'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="mt-1 text-sm">
                      {selectedProjectDetail.description || 'No description provided.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[selectedProjectDetail.status]}>
                      {selectedProjectDetail.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Mentor: {getMentorName(selectedProjectDetail.mentorId)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedProjectDetail.startDate
                        ? new Date(selectedProjectDetail.startDate).toLocaleDateString()
                        : '—'}
                      {selectedProjectDetail.endDate &&
                        ` – ${new Date(selectedProjectDetail.endDate).toLocaleDateString()}`}
                    </span>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Assigned interns</Label>
                    <ul className="mt-1 text-sm list-disc list-inside">
                      {(selectedProjectDetail.internIds || []).length === 0 ? (
                        <li className="text-muted-foreground">None assigned</li>
                      ) : (
                        (selectedProjectDetail.internIds || []).map((id: unknown) => {
                          const idStr = typeof id === 'string' ? id : (id as any)?.id || (id as any)?._id || '';
                          const u = users.find(uu => uu.id === idStr);
                          return <li key={idStr}>{u?.name || 'Unknown'}</li>;
                        })
                      )}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}