import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getInternships,
  addInternship,
  updateInternship,
  deleteInternship,
  generateId,
  addActivityLog,
  getApplicationsByInternshipId
} from '@/lib/storage';
import { Internship, InternshipStatus } from '@/types';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  MapPin,
  Clock,
  Users,
  Briefcase,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const defaultDepartments = [
  'Engineering',
  'Design',
  'Marketing',
  'Product',
  'Data Science',
  'Operations',
  'Human Resources',
];

interface InternshipFormData {
  title: string;
  description: string;
  department: string;
  location: string;
  duration: string;
  startDate: string;
  deadline: string;
  requirements: string;
  responsibilities: string;
  stipend: string;
  slots: number;
  status: InternshipStatus;
}

interface FormDialogProps {
  formData: InternshipFormData;
  setFormData: (data: InternshipFormData) => void;
  isAdmin: boolean;
  isEdit?: boolean;
}

const FormDialog = ({ formData, setFormData, isAdmin, isEdit = false }: FormDialogProps) => (
  <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
    <div className="space-y-2">
      <Label htmlFor="title">Title *</Label>
      <Input
        id="title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Software Engineering Intern"
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Department *</Label>
        <Input
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          placeholder="Enter department"
          list="internship-department-suggestions"
        />
        <datalist id="internship-department-suggestions">
          {defaultDepartments.map((dept) => (
            <option key={dept} value={dept} />
          ))}
        </datalist>
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Remote / New York"
        />
      </div>
    </div>
    <div className="space-y-2">
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Describe the internship opportunity..."
        rows={3}
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="duration">Duration</Label>
        <Input
          id="duration"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          placeholder="3 months"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="startDate">Start Date</Label>
        <Input
          id="startDate"
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="deadline">Application Deadline</Label>
        <Input
          id="deadline"
          type="date"
          value={formData.deadline}
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slots">Available Slots</Label>
        <Input
          id="slots"
          type="number"
          min="1"
          value={formData.slots}
          onChange={(e) => setFormData({ ...formData, slots: parseInt(e.target.value) || 1 })}
        />
      </div>
    </div>
    <div className="space-y-2">
      <Label htmlFor="stipend">Stipend (optional)</Label>
      <Input
        id="stipend"
        value={formData.stipend}
        onChange={(e) => setFormData({ ...formData, stipend: e.target.value })}
        placeholder="$1000/month"
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="requirements">Requirements (one per line)</Label>
      <Textarea
        id="requirements"
        value={formData.requirements}
        onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
        placeholder="Currently enrolled in CS program&#10;Familiar with React&#10;Strong communication skills"
        rows={4}
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="responsibilities">Responsibilities (one per line)</Label>
      <Textarea
        id="responsibilities"
        value={formData.responsibilities}
        onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
        placeholder="Develop new features&#10;Write unit tests&#10;Participate in code reviews"
        rows={4}
      />
    </div>
    {isAdmin && (
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value: InternshipStatus) => setFormData({ ...formData, status: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="filled">Filled</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )}
  </div>
);

export default function Internships() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [internships, setInternships] = useState<Internship[]>(getInternships());
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);

  const isAdmin = user?.role === 'admin';

  const [formData, setFormData] = useState<InternshipFormData>({
    title: '',
    description: '',
    department: '',
    location: '',
    duration: '',
    startDate: '',
    deadline: '',
    requirements: '',
    responsibilities: '',
    stipend: '',
    slots: 1,
    status: 'open',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      department: '',
      location: '',
      duration: '',
      startDate: '',
      deadline: '',
      requirements: '',
      responsibilities: '',
      stipend: '',
      slots: 1,
      status: 'open',
    });
  };

  const getFilteredInternships = () => {
    let filtered = internships;

    // Non-admin users only see open internships
    if (!isAdmin) {
      filtered = filtered.filter(i => i.status === 'open');
    }

    if (searchTerm) {
      filtered = filtered.filter(i =>
        i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const handleCreateInternship = () => {
    if (!formData.title || !formData.department) return;

    const newInternship: Internship = {
      id: generateId(),
      title: formData.title,
      description: formData.description,
      department: formData.department,
      location: formData.location,
      duration: formData.duration,
      startDate: formData.startDate,
      deadline: formData.deadline || undefined,
      requirements: formData.requirements.split('\n').filter(Boolean),
      responsibilities: formData.responsibilities.split('\n').filter(Boolean),
      stipend: formData.stipend || undefined,
      slots: formData.slots,
      filledSlots: 0,
      status: formData.status,
      createdBy: user?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addInternship(newInternship);

    addActivityLog({
      id: generateId(),
      userId: user?.id || '',
      action: 'internship_created',
      details: `Created internship: ${formData.title}`,
      timestamp: new Date().toISOString(),
      resourceType: 'internship',
      resourceId: newInternship.id,
    });

    setInternships(getInternships());
    setCreateDialogOpen(false);
    resetForm();
  };

  const handleEditInternship = () => {
    if (!selectedInternship) return;

    updateInternship(selectedInternship.id, {
      title: formData.title,
      description: formData.description,
      department: formData.department,
      location: formData.location,
      duration: formData.duration,
      startDate: formData.startDate,
      deadline: formData.deadline || undefined,
      requirements: formData.requirements.split('\n').filter(Boolean),
      responsibilities: formData.responsibilities.split('\n').filter(Boolean),
      stipend: formData.stipend || undefined,
      slots: formData.slots,
      status: formData.status,
      updatedAt: new Date().toISOString(),
    });

    setInternships(getInternships());
    setEditDialogOpen(false);
    setSelectedInternship(null);
    resetForm();
  };

  const handleDeleteInternship = (internshipId: string) => {
    if (confirm('Are you sure you want to delete this internship?')) {
      deleteInternship(internshipId);
      setInternships(getInternships());
    }
  };

  const openEditDialog = (internship: Internship) => {
    setSelectedInternship(internship);
    setFormData({
      title: internship.title,
      description: internship.description,
      department: internship.department,
      location: internship.location,
      duration: internship.duration,
      startDate: internship.startDate,
      deadline: internship.deadline || '',
      requirements: internship.requirements.join('\n'),
      responsibilities: internship.responsibilities.join('\n'),
      stipend: internship.stipend || '',
      slots: internship.slots,
      status: internship.status,
    });
    setEditDialogOpen(true);
  };

  const handleApply = (internshipId: string) => {
    navigate(`/apply/${internshipId}`);
  };

  const getStatusColor = (status: InternshipStatus) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'closed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'filled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getApplicationCount = (internshipId: string) => {
    return getApplicationsByInternshipId(internshipId).length;
  };

  const filteredInternships = getFilteredInternships();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Internship Opportunities</h1>
            <p className="text-muted-foreground">
              {isAdmin ? 'Manage internship listings' : 'Browse and apply for internships'}
            </p>
          </div>
          {isAdmin && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setCreateDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Internship
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Internship</DialogTitle>
                  <DialogDescription>
                    Add a new internship opportunity
                  </DialogDescription>
                </DialogHeader>
                <FormDialog formData={formData} setFormData={setFormData} isAdmin={isAdmin} />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateInternship} disabled={!formData.title || !formData.department}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search internships..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredInternships.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No internships available at the moment.</p>
              {isAdmin && (
                <Button className="mt-4" onClick={() => { resetForm(); setCreateDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Internship
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredInternships.map((internship) => (
              <Card key={internship.id} className="hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{internship.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        {internship.department}
                      </CardDescription>
                    </div>
                    <Badge className={cn('text-xs', getStatusColor(internship.status))}>
                      {internship.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {internship.description || 'No description provided.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {internship.location && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {internship.location}
                      </div>
                    )}
                    {internship.duration && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {internship.duration}
                      </div>
                    )}
                    {internship.startDate && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Starts {format(new Date(internship.startDate), 'MMM dd, yyyy')}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {internship.filledSlots}/{internship.slots} slots
                    </div>
                    {internship.stipend && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        {internship.stipend}
                      </div>
                    )}
                  </div>

                  {internship.requirements.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Requirements</p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        {internship.requirements.slice(0, 3).map((req, index) => (
                          <li key={index} className="truncate">{req}</li>
                        ))}
                        {internship.requirements.length > 3 && (
                          <li className="text-primary">+{internship.requirements.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {internship.deadline && (
                    <div className="text-sm text-orange-600 dark:text-orange-400">
                      Application deadline: {format(new Date(internship.deadline), 'MMM dd, yyyy')}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  {isAdmin ? (
                    <>
                      <div className="text-sm text-muted-foreground">
                        {getApplicationCount(internship.id)} applications
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(internship)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteInternship(internship.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-muted-foreground">
                        {internship.slots - internship.filledSlots} spots remaining
                      </div>
                      <Button onClick={() => handleApply(internship.id)}>
                        Apply Now
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Internship</DialogTitle>
              <DialogDescription>
                Update internship details
              </DialogDescription>
            </DialogHeader>
            <FormDialog formData={formData} setFormData={setFormData} isAdmin={isAdmin} isEdit />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditInternship}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}