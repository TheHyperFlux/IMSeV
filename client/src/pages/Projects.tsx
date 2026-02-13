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
  Loader2
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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, usersRes, groupsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/users'),
        api.get('/groups')
      ]);

      let allProjects: Project[] = projectsRes.data.data;
      const allUsers: User[] = usersRes.data.data;
      const allGroups: Group[] = groupsRes.data.data;

      setUsers(allUsers);
      setGroups(allGroups);

      // Filter projects based on role
      if (currentUser) {
        if (currentUser.role === 'admin') {
          setProjects(allProjects);
        } else if (currentUser.role === 'mentor') {
          const mentorGroups = allGroups.filter(g =>
            g.adminIds.includes(currentUser.id) || g.memberIds.includes(currentUser.id)
          );
          const groupIds = mentorGroups.map(g => g.id);

          const visibleProjects = allProjects.filter(p =>
            p.mentorId === currentUser.id ||
            (p.groupId && groupIds.includes(p.groupId))
          );
          setProjects(visibleProjects);
        } else if (currentUser.role === 'intern') {
          const visibleProjects = allProjects.filter(p =>
            p.internIds.includes(currentUser.id)
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

  // Filter interns based on role logic
  const getAvailableInterns = () => {
    const allInterns = users.filter(u => u.role === 'intern');
    if (currentUser?.role === 'mentor') {
      const relevantGroups = groups.filter(g =>
        g.adminIds.includes(currentUser.id) || g.memberIds.includes(currentUser.id)
      );
      const memberIds = new Set(relevantGroups.flatMap(g => g.memberIds));
      return allInterns.filter(u => memberIds.has(u.id));
    }
    return allInterns; // Admins see all
  };

  const interns = getAvailableInterns(); // Not used directly in form currently, but logic kept

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

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateProject = async () => {
    try {
      const newProject = {
        name: formData.name,
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
    setFormData({
      name: project.name,
      description: project.description,
      department: project.department,
      status: project.status,
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '', // Format for date input
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      mentorId: project.mentorId,
      internIds: project.internIds,
    });
    setEditDialogOpen(true);
  };

  const getMentorName = (mentorId: string) => {
    const mentor = users.find(u => u.id === mentorId);
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
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Add a new project for interns to work on
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter project name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the project"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="mentor">Mentor</Label>
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
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateProject} disabled={!formData.name}>
                    Create Project
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-10 max-w-md"
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
                      <CardTitle className="text-lg">{project.name}</CardTitle>
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
                    <span>{project.internIds.length} intern(s) assigned</span>
                  </div>

                  {isAdminOrMentor && (
                    <div className="flex gap-2 pt-2">
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
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update project details and assignments
              </DialogDescription>
            </DialogHeader>
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
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditProject}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}