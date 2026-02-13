import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { isProfileComplete, Education, Experience } from '@/types';
import { 
  User, 
  Mail, 
  Phone, 
  Building,
  Calendar,
  Edit,
  Save,
  X,
  Shield,
  CheckCircle,
  Plus,
  Trash2,
  GraduationCap,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [educationDialogOpen, setEducationDialogOpen] = useState(false);
  const [experienceDialogOpen, setExperienceDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    skills: user?.skills?.join(', ') || '',
    department: user?.department || '',
  });

  const [educationForm, setEducationForm] = useState<Education>({
    institution: '',
    degree: 'SEE',
    field: '',
    gpa: '',
    yearPassed: '',
    semester: '',
    year: '',
    current: false,
  });

  const [experienceForm, setExperienceForm] = useState<Experience>({
    company: '',
    position: '',
    description: '',
    startDate: '',
    endDate: '',
    current: false,
  });

  const profileComplete = user ? isProfileComplete(user) : false;
  
  const getProfileCompleteness = () => {
    if (!user) return 0;
    let score = 0;
    if (user.name) score += 20;
    if (user.email) score += 20;
    if (user.phone) score += 20;
    if (user.skills && user.skills.length > 0) score += 20;
    if (user.education && user.education.length > 0) score += 20;
    return score;
  };

  const handleSave = () => {
    updateProfile({
      name: formData.name,
      phone: formData.phone || undefined,
      bio: formData.bio || undefined,
      skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      department: formData.department || undefined,
      profileCompleted: isProfileComplete({
        ...user!,
        name: formData.name,
        phone: formData.phone,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      }),
    });
    setIsEditing(false);
    toast.success('Profile updated successfully');
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      skills: user?.skills?.join(', ') || '',
      department: user?.department || '',
    });
    setIsEditing(false);
  };

  const handleAddEducation = () => {
    const newEducation = [...(user?.education || []), educationForm];
    updateProfile({ 
      education: newEducation,
      profileCompleted: isProfileComplete({ ...user!, education: newEducation }),
    });
    setEducationDialogOpen(false);
    setEducationForm({
      institution: '',
      degree: 'SEE',
      field: '',
      gpa: '',
      yearPassed: '',
      semester: '',
      year: '',
      current: false,
    });
    toast.success('Education added successfully');
  };

  const handleRemoveEducation = (index: number) => {
    const newEducation = user?.education?.filter((_, i) => i !== index) || [];
    updateProfile({ 
      education: newEducation,
      profileCompleted: isProfileComplete({ ...user!, education: newEducation }),
    });
    toast.success('Education removed');
  };

  const handleAddExperience = () => {
    const newExperience = [...(user?.experience || []), experienceForm];
    updateProfile({ experience: newExperience });
    setExperienceDialogOpen(false);
    setExperienceForm({
      company: '',
      position: '',
      description: '',
      startDate: '',
      endDate: '',
      current: false,
    });
    toast.success('Experience added successfully');
  };

  const handleRemoveExperience = (index: number) => {
    const newExperience = user?.experience?.filter((_, i) => i !== index) || [];
    updateProfile({ experience: newExperience });
    toast.success('Experience removed');
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings and profile information
            </p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {/* Profile Completeness */}
        {!profileComplete && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your profile is incomplete. Complete your profile to apply for internships.
              <div className="mt-2">
                <Progress value={getProfileCompleteness()} className="h-2" />
                <p className="text-xs mt-1">{getProfileCompleteness()}% complete</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold">{user?.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="capitalize">
                          <Shield className="h-3 w-3 mr-1" />
                          {user?.role}
                        </Badge>
                        {user?.isActive && (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                        {profileComplete && (
                          <Badge className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Profile Complete
                          </Badge>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {user?.email}
                  </span>
                  {user?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {user.phone}
                    </span>
                  )}
                  {user?.department && (
                    <span className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {user.department}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(user?.joinedAt || '').toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Your personal and professional details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Engineering"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">Skills * (comma-separated)</Label>
                  <Input
                    id="skills"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="React, TypeScript, Node.js"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone *</p>
                    <p className="font-medium">{user?.phone || <span className="text-destructive">Not provided</span>}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{user?.department || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium capitalize">{user?.role}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Bio</p>
                  <p className="text-sm">{user?.bio || 'No bio provided yet.'}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Skills *</p>
                  {user?.skills && user.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-destructive">No skills added yet. Please add your skills.</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Education Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Education *
                </CardTitle>
                <CardDescription>
                  Your educational background
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setEducationDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {user?.education && user.education.length > 0 ? (
              <div className="space-y-4">
                {user.education.map((edu, index) => (
                  <div key={index} className="flex items-start justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{edu.degree} {edu.field && `in ${edu.field}`}</p>
                      <p className="text-sm text-muted-foreground">{edu.institution}</p>
                      <div className="text-xs text-muted-foreground space-x-2">
                        {edu.gpa && <span>GPA: {edu.gpa}</span>}
                        {edu.yearPassed && <span>• Passed: {edu.yearPassed}</span>}
                        {edu.current && <span>• Currently Studying</span>}
                        {edu.degree === 'Bachelor' && edu.semester && <span>• Semester: {edu.semester}</span>}
                        {edu.degree === 'Bachelor' && edu.year && !edu.semester && <span>• Year: {edu.year}</span>}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleRemoveEducation(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-destructive">No education added yet. Please add your education details.</p>
            )}
          </CardContent>
        </Card>

        {/* Experience Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Experience (Optional)
                </CardTitle>
                <CardDescription>
                  Your work experience
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setExperienceDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {user?.experience && user.experience.length > 0 ? (
              <div className="space-y-4">
                {user.experience.map((exp, index) => (
                  <div key={index} className="flex items-start justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{exp.position}</p>
                      <p className="text-sm text-muted-foreground">{exp.company}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(exp.startDate).toLocaleDateString()} - {exp.current ? 'Present' : new Date(exp.endDate!).toLocaleDateString()}
                      </p>
                      {exp.description && (
                        <p className="text-sm mt-2">{exp.description}</p>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleRemoveExperience(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No experience added yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Account status and security details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Account Status</p>
                <p className="text-sm text-muted-foreground">
                  Your account is currently active
                </p>
              </div>
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
            
            <Separator />

            <Alert>
              <AlertDescription>
                For security reasons, password changes must be done by contacting an administrator.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Add Education Dialog */}
        <Dialog open={educationDialogOpen} onOpenChange={setEducationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Education</DialogTitle>
              <DialogDescription>
                Add your educational background
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="institution">School/Institution Name *</Label>
                <Input
                  id="institution"
                  value={educationForm.institution}
                  onChange={(e) => setEducationForm({ ...educationForm, institution: e.target.value })}
                  placeholder="Enter school or institution name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="degree">Degree *</Label>
                  <Select
                    value={educationForm.degree}
                    onValueChange={(value: 'SEE' | 'Higher Secondary' | 'Bachelor') => setEducationForm({ ...educationForm, degree: value, semester: '', year: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select degree" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEE">SEE</SelectItem>
                      <SelectItem value="Higher Secondary">Higher Secondary</SelectItem>
                      <SelectItem value="Bachelor">Bachelor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field">Field of Study</Label>
                  <Input
                    id="field"
                    value={educationForm.field}
                    onChange={(e) => setEducationForm({ ...educationForm, field: e.target.value })}
                    placeholder="e.g., Science, Computer Science"
                  />
                </div>
              </div>
              
              {educationForm.degree === 'Bachelor' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Select
                      value={educationForm.semester || ''}
                      onValueChange={(value) => setEducationForm({ ...educationForm, semester: value, year: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                          <SelectItem key={sem} value={sem.toString()}>{sem}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Or Year</Label>
                    <Select
                      value={educationForm.year || ''}
                      onValueChange={(value) => setEducationForm({ ...educationForm, year: value, semester: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map(yr => (
                          <SelectItem key={yr} value={yr.toString()}>{yr}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gpa">GPA Obtained (if passed)</Label>
                  <Input
                    id="gpa"
                    value={educationForm.gpa || ''}
                    onChange={(e) => setEducationForm({ ...educationForm, gpa: e.target.value })}
                    placeholder="e.g., 3.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearPassed">Year Passed (if passed)</Label>
                  <Input
                    id="yearPassed"
                    value={educationForm.yearPassed || ''}
                    onChange={(e) => setEducationForm({ ...educationForm, yearPassed: e.target.value })}
                    placeholder="e.g., 2023"
                    disabled={educationForm.current}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="currentEducation"
                  checked={educationForm.current}
                  onCheckedChange={(checked) => setEducationForm({ ...educationForm, current: !!checked, yearPassed: '' })}
                />
                <label htmlFor="currentEducation" className="text-sm">Currently studying here</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEducationDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddEducation}
                disabled={!educationForm.institution || !educationForm.degree}
              >
                Add Education
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Experience Dialog */}
        <Dialog open={experienceDialogOpen} onOpenChange={setExperienceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Experience</DialogTitle>
              <DialogDescription>
                Add your work experience
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={experienceForm.company}
                  onChange={(e) => setExperienceForm({ ...experienceForm, company: e.target.value })}
                  placeholder="Company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={experienceForm.position}
                  onChange={(e) => setExperienceForm({ ...experienceForm, position: e.target.value })}
                  placeholder="Job title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expDescription">Description</Label>
                <Textarea
                  id="expDescription"
                  value={experienceForm.description}
                  onChange={(e) => setExperienceForm({ ...experienceForm, description: e.target.value })}
                  placeholder="Describe your responsibilities..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={experienceForm.startDate}
                    onChange={(e) => setExperienceForm({ ...experienceForm, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={experienceForm.endDate}
                    onChange={(e) => setExperienceForm({ ...experienceForm, endDate: e.target.value })}
                    disabled={experienceForm.current}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="currentExperience"
                  checked={experienceForm.current}
                  onCheckedChange={(checked) => setExperienceForm({ ...experienceForm, current: !!checked })}
                />
                <label htmlFor="currentExperience" className="text-sm">Currently working here</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExperienceDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddExperience}
                disabled={!experienceForm.company || !experienceForm.position || !experienceForm.startDate}
              >
                Add Experience
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
