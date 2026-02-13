import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FolderKanban, 
  CheckSquare, 
  ClipboardList,
  TrendingUp,
  Clock,
  Award,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getUsers, getApplications, getProjects, getTasks, getTasksByAssigneeId } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { UpcomingDeadlines } from '@/components/dashboard/UpcomingDeadlines';

export default function Dashboard() {
  const { user } = useAuth();
  
  const users = getUsers();
  const applications = getApplications();
  const projects = getProjects();
  const tasks = getTasks();
  const myTasks = user ? getTasksByAssigneeId(user.id) : [];

  const stats = {
    totalUsers: users.length,
    totalApplications: applications.length,
    pendingApplications: applications.filter(a => a.status === 'pending').length,
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    myPendingTasks: myTasks.filter(t => t.status !== 'completed').length,
    myCompletedTasks: myTasks.filter(t => t.status === 'completed').length,
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {getGreeting()}, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your internship program today.
            </p>
          </div>
          <Badge variant="outline" className="w-fit capitalize">
            {user?.role}
          </Badge>
        </div>

        {/* Admin/Mentor Stats */}
        {(user?.role === 'admin' || user?.role === 'mentor') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Users"
              value={stats.totalUsers}
              description="Active team members"
              icon={Users}
            />
            <StatsCard
              title="Applications"
              value={stats.totalApplications}
              description={`${stats.pendingApplications} pending review`}
              icon={ClipboardList}
            />
            <StatsCard
              title="Projects"
              value={stats.totalProjects}
              description={`${stats.activeProjects} active`}
              icon={FolderKanban}
            />
            <StatsCard
              title="Tasks"
              value={stats.totalTasks}
              description={`${stats.completedTasks} completed`}
              icon={CheckSquare}
            />
          </div>
        )}

        {/* Intern Stats */}
        {user?.role === 'intern' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatsCard
              title="My Tasks"
              value={myTasks.length}
              description={`${stats.myPendingTasks} pending`}
              icon={CheckSquare}
            />
            <StatsCard
              title="Completed"
              value={stats.myCompletedTasks}
              description="Tasks finished"
              icon={Award}
            />
            <StatsCard
              title="Progress"
              value={`${myTasks.length > 0 ? Math.round((stats.myCompletedTasks / myTasks.length) * 100) : 0}%`}
              description="Completion rate"
              icon={TrendingUp}
            />
          </div>
        )}

        {/* Applicant View */}
        {user?.role === 'applicant' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Application Status
              </CardTitle>
              <CardDescription>
                Track your internship application progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applications.filter(a => a.userId === user.id).length > 0 ? (
                <div className="space-y-4">
                  {applications
                    .filter(a => a.userId === user.id)
                    .map(app => (
                      <div key={app.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{app.preferredDepartment}</p>
                          <p className="text-sm text-muted-foreground">
                            Applied {new Date(app.appliedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={
                          app.status === 'accepted' ? 'default' :
                          app.status === 'rejected' ? 'destructive' :
                          'secondary'
                        }>
                          {app.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    You haven't submitted an application yet.
                  </p>
                  <Button asChild>
                    <Link to="/internships">
                      Apply Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dashboard Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {user?.role === 'admin' && (
            <div className="lg:col-span-2">
              <RecentActivity />
            </div>
          )}
          <div className={`space-y-6 ${user?.role !== 'admin' ? 'lg:col-span-3' : ''}`}>
            <QuickActions />
            <UpcomingDeadlines />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}