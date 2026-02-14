import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { Application } from '@/types';
import { FileText, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function MyApplication() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const res = await api.get('/applications');
        const data = res.data?.data;
        setApplications(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch applications:', error);
        toast.error('Failed to load your applications');
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [user]);

  const getInternshipTitle = (app: Application) => {
    const id = app.internshipId;
    if (typeof id === 'object' && id !== null && 'title' in id) {
      return (id as { title?: string }).title || app.preferredDepartment || 'Application';
    }
    return app.preferredDepartment || 'Application';
  };

  const getAppliedAt = (app: Application) => {
    const date = app.appliedAt;
    if (!date) return '—';
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-7 w-7" />
            My Application
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your internship application progress
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>
              View the status of your submitted applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{getInternshipTitle(app)}</p>
                      <p className="text-sm text-muted-foreground">
                        Applied {getAppliedAt(app)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        app.status === 'accepted'
                          ? 'default'
                          : app.status === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {app.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  You haven&apos;t submitted an application yet.
                </p>
                <Button asChild>
                  <Link to="/internships">
                    Browse Internships
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
