import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  getInternshipById,
  getApplicationsByUserId,
  addApplication, 
  generateId,
  addActivityLog,
  getUsers
} from '@/lib/storage';
import { Application, Internship } from '@/types';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  CheckCircle, 
  Loader2, 
  Send, 
  ArrowLeft,
  Briefcase,
  MapPin,
  Clock,
  Calendar,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

export default function ApplyInternship() {
  const { internshipId } = useParams<{ internshipId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifyNewApplication } = useNotifications();
  const [internship, setInternship] = useState<Internship | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  
  // Pre-fill form with user profile data
  const [formData, setFormData] = useState({
    phone: user?.phone || '',
    coverLetter: '',
    skills: user?.skills?.join(', ') || '',
    education: '',
    experience: '',
    availableFrom: '',
    linkedIn: '',
    portfolio: '',
  });

  useEffect(() => {
    if (internshipId) {
      const found = getInternshipById(internshipId);
      setInternship(found || null);
      
      // Check if already applied
      if (user) {
        const existingApps = getApplicationsByUserId(user.id);
        const hasApplied = existingApps.some(app => app.internshipId === internshipId);
        setAlreadyApplied(hasApplied);
      }
    }
  }, [internshipId, user]);

  useEffect(() => {
    // Update form when user data changes - auto-fill from profile
    if (user) {
      const educationText = user.education?.map(edu => {
        let text = `${edu.degree}`;
        if (edu.field) text += ` in ${edu.field}`;
        text += ` from ${edu.institution}`;
        if (edu.gpa) text += ` (GPA: ${edu.gpa})`;
        if (edu.yearPassed) text += ` - Passed ${edu.yearPassed}`;
        if (edu.current) text += ' - Currently Studying';
        if (edu.degree === 'Bachelor' && edu.semester) text += ` (Semester ${edu.semester})`;
        if (edu.degree === 'Bachelor' && edu.year && !edu.semester) text += ` (Year ${edu.year})`;
        return text;
      }).join('\n') || '';

      const experienceText = user.experience?.map(exp => 
        `${exp.position} at ${exp.company}${exp.description ? ': ' + exp.description : ''}`
      ).join('\n') || '';

      setFormData(prev => ({
        ...prev,
        phone: user.phone || prev.phone,
        skills: user.skills?.join(', ') || prev.skills,
        education: educationText || prev.education,
        experience: experienceText || prev.experience,
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !internship) return;
    
    setIsSubmitting(true);
    
    const application: Application = {
      id: generateId(),
      userId: user.id,
      internshipId: internship.id,
      name: user.name,
      email: user.email,
      phone: formData.phone,
      coverLetter: formData.coverLetter,
      skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
      education: formData.education,
      experience: formData.experience,
      preferredDepartment: internship.department,
      availableFrom: formData.availableFrom,
      duration: internship.duration,
      status: 'pending',
      appliedAt: new Date().toISOString(),
    };
    
    addApplication(application);
    
    addActivityLog({
      id: generateId(),
      userId: user.id,
      action: 'application_submitted',
      details: `Applied for ${internship.title}`,
      timestamp: new Date().toISOString(),
      resourceType: 'application',
      resourceId: application.id,
    });

    // Notify admins about new application
    const admins = getUsers().filter(u => u.role === 'admin');
    notifyNewApplication(admins.map(a => a.id), user.name);
    
    setSuccess(true);
    setIsSubmitting(false);
  };

  if (!internship) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Internship not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/internships')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Internships
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (alreadyApplied) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Already Applied</CardTitle>
              <CardDescription>
                You have already submitted an application for this internship.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" onClick={() => navigate('/internships')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Browse Other Internships
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (success) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Application Submitted!</CardTitle>
              <CardDescription>
                Your application for {internship.title} has been received.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                We'll review your application and get back to you soon. You can track your application status in the dashboard.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => navigate('/internships')}>
                  Browse More
                </Button>
                <Button onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/internships')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Internships
        </Button>

        {/* Internship Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{internship.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Briefcase className="h-4 w-4" />
                  {internship.department}
                </CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Open
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {internship.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {internship.location}
                </div>
              )}
              {internship.duration && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {internship.duration}
                </div>
              )}
              {internship.startDate && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(internship.startDate), 'MMM dd, yyyy')}
                </div>
              )}
              {internship.stipend && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  {internship.stipend}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle>Application Form</CardTitle>
            <CardDescription>
              Fill out the form below to apply. Some fields are pre-filled from your profile.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Pre-filled fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={user?.name} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email} disabled className="bg-muted" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
                {user?.phone && (
                  <p className="text-xs text-muted-foreground">Pre-filled from your profile</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="availableFrom">Available From *</Label>
                <Input
                  id="availableFrom"
                  type="date"
                  value={formData.availableFrom}
                  onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="education">Education *</Label>
                <Textarea
                  id="education"
                  placeholder="List your educational background (degree, university, year, GPA if applicable)"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  required
                  rows={3}
                />
                {user?.education && user.education.length > 0 && (
                  <p className="text-xs text-muted-foreground">Pre-filled from your profile</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Skills *</Label>
                <Input
                  id="skills"
                  placeholder="Enter skills separated by commas (e.g., React, Python, Data Analysis)"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  required
                />
                {user?.skills && user.skills.length > 0 && (
                  <p className="text-xs text-muted-foreground">Pre-filled from your profile</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Previous Experience</Label>
                <Textarea
                  id="experience"
                  placeholder="Describe any relevant work experience, projects, or internships"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  rows={3}
                />
                {user?.experience && user.experience.length > 0 && (
                  <p className="text-xs text-muted-foreground">Pre-filled from your profile</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedIn">LinkedIn Profile</Label>
                  <Input
                    id="linkedIn"
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={formData.linkedIn}
                    onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio">Portfolio / GitHub</Label>
                  <Input
                    id="portfolio"
                    type="url"
                    placeholder="https://github.com/username"
                    value={formData.portfolio}
                    onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverLetter">Cover Letter *</Label>
                <Textarea
                  id="coverLetter"
                  placeholder="Tell us why you're interested in this internship and what makes you a great fit..."
                  value={formData.coverLetter}
                  onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                  className="min-h-[150px]"
                  required
                />
              </div>

              <Alert>
                <AlertDescription>
                  By submitting this application, you confirm that all information provided is accurate and complete.
                </AlertDescription>
              </Alert>
            </CardContent>
            <div className="p-6 pt-0">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}