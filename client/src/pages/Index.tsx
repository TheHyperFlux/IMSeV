import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  Users,
  FolderKanban,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Briefcase,
  Target,
  Award,
  Clock,
  Shield,
  Zap,
  MapPin,
  Calendar,
  DollarSign,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Internship } from '@/types';
import { cn } from '@/lib/utils';

// Inject slide-in animation styles
if (typeof document !== 'undefined') {
  const styleId = 'index-slide-in-animation';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .slide-in {
        animation: slideIn 0.5s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
  }
}

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllInternships, setShowAllInternships] = useState(false);

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        setLoading(true);
        const res = await api.get('/internships');
        const allInternships: Internship[] = res.data.data;
        setInternships(allInternships.filter(i => i.status === 'open'));
      } catch (error) {
        console.error('Error fetching internships:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInternships();
  }, []);

  const handleApply = (internshipId: string) => {
    if (user) {
      navigate(`/apply/${internshipId}`);
    } else {
      navigate('/login', { state: { redirectTo: `/apply/${internshipId}` } });
    }
  };

  const features = [
    {
      icon: GraduationCap,
      title: 'Streamlined Applications',
      description: 'Easy-to-use application portal for aspiring interns with real-time status tracking.'
    },
    {
      icon: FolderKanban,
      title: 'Project Management',
      description: 'Assign and manage internship projects with comprehensive task tracking.'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Connect interns with mentors through groups and seamless communication.'
    },
    {
      icon: MessageSquare,
      title: 'Real-time Messaging',
      description: 'Built-in chat system for direct and group conversations.'
    },
    {
      icon: CheckCircle2,
      title: 'Task Tracking',
      description: 'Monitor progress with priority-based task management and deadlines.'
    },
    {
      icon: Shield,
      title: 'Role-based Access',
      description: 'Secure system with admin, mentor, intern, and applicant roles.'
    }
  ];

  const stats = [
    { value: '500+', label: 'Interns Managed' },
    { value: '100+', label: 'Projects Completed' },
    { value: '50+', label: 'Partner Companies' },
    { value: '95%', label: 'Satisfaction Rate' }
  ];

  const howItWorks = [
    {
      step: 1,
      icon: Briefcase,
      title: 'Apply',
      description: 'Submit your application with resume, cover letter, and skills.'
    },
    {
      step: 2,
      icon: Target,
      title: 'Get Reviewed',
      description: 'Your application is reviewed by mentors and administrators.'
    },
    {
      step: 3,
      icon: FolderKanban,
      title: 'Join Projects',
      description: 'Once accepted, get assigned to real-world projects.'
    },
    {
      step: 4,
      icon: Award,
      title: 'Complete & Grow',
      description: 'Finish tasks, gain experience, and earn your certificate.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Numa IMS</span>
          </div>
          <nav className="flex items-center gap-4">
            <a href="#programs" className="text-sm font-medium hover:text-primary hidden md:block">
              Programs
            </a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-primary hidden md:block">
              How it Works
            </a>
            {user ? (
              <Button asChild>
                <Link to="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Get Started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-background" />
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              <Zap className="mr-1 h-3 w-3" />
              Numa Digital Farm Internship Portal
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Grow Your Career at <br />
              <span className="text-primary">Numa Digital Farm</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Join our innovative team and gain real-world experience.
              Manage your internship journey, collaborate with mentors, and build the future of technology.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <a href="#programs">
                  View Open Positions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to={user ? "/dashboard" : "/login"}>
                  {user ? "Go to Dashboard" : "Sign In"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30 py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Programs Section */}
      <section id="programs" className="py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold">Open Internship Positions</h2>
            <p className="text-muted-foreground">
              Explore our current opportunities and start your career journey with Numa Digital Farm.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : internships.length === 0 ? (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No Open Positions Currently</p>
                <p className="text-muted-foreground mb-4">
                  Check back soon for new opportunities, or register to get notified.
                </p>
                <Button asChild>
                  <Link to="/register">Register for Updates</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {internships.slice(0, showAllInternships ? internships.length : 3).map((internship, index) => (
                  <Card 
                    key={internship.id} 
                    className={cn(
                      "flex flex-col hover:shadow-lg transition-shadow",
                      index >= 3 && "slide-in"
                    )}
                    style={index >= 3 ? { animationDelay: `${(index - 3) * 0.1}s` } : {}}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Badge variant={internship.status === 'open' ? 'default' : 'secondary'}>
                          {internship.status === 'open' ? 'Open' : internship.status}
                        </Badge>
                        {internship.stipend && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {internship.stipend}
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-xl mt-2">{internship.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {internship.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <span>{internship.department}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{internship.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{internship.duration}</span>
                        </div>
                        {internship.deadline && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Deadline: {new Date(internship.deadline).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground mb-2">Requirements:</p>
                        <div className="flex flex-wrap gap-1">
                          {internship.requirements.slice(0, 3).map((req, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {req}
                            </Badge>
                          ))}
                          {internship.requirements.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{internship.requirements.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 text-sm">
                        <span className="text-muted-foreground">
                          {internship.slots - internship.filledSlots} of {internship.slots} slots available
                        </span>
                      </div>
                    </CardContent>
                    <div className="p-6 pt-0">
                      <Button
                        className="w-full"
                        onClick={() => handleApply(internship.id)}
                        disabled={internship.filledSlots >= internship.slots}
                      >
                        {internship.filledSlots >= internship.slots ? 'Fully Booked' : 'Apply Now'}
                        {internship.filledSlots < internship.slots && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              {internships.length > 3 && !showAllInternships && (
                <div className="flex justify-center mt-8">
                  <Button onClick={() => setShowAllInternships(true)} size="lg" variant="outline">
                    View All ({internships.length - 3} more opportunities)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-muted/30 py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold">How It Works</h2>
            <p className="text-muted-foreground">
              Your journey from applicant to successful intern in four simple steps.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <item.icon className="h-8 w-8" />
                </div>
                <div className="mb-2 text-sm font-medium text-primary">Step {item.step}</div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Different Roles */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold">Built for Everyone</h2>
            <p className="text-muted-foreground">
              Tailored experiences for every role in our organization.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  For Interns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Submit and track applications</p>
                <p>✓ View assigned projects and tasks</p>
                <p>✓ Log daily progress</p>
                <p>✓ Communicate with mentors</p>
                <p>✓ Track your growth</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  For Mentors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Review applications</p>
                <p>✓ Create and assign projects</p>
                <p>✓ Manage tasks and deadlines</p>
                <p>✓ Guide intern development</p>
                <p>✓ Track team progress</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  For Administrators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Create internship programs</p>
                <p>✓ Full user management</p>
                <p>✓ Group administration</p>
                <p>✓ System-wide analytics</p>
                <p>✓ Complete access control</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-primary py-20 text-primary-foreground">
        <div className="container text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Start Your Career?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-primary-foreground/80">
            Join the Numa Digital Farm internship program today. Create your profile, apply to open positions,
            and kickstart your career.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>Setup in under 5 minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-semibold">Numa IMS</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Numa Digital Farm. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
