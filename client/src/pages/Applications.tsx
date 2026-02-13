import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';
import { Application, ApplicationStatus, Group, Internship } from '@/types';
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  GraduationCap,
  PauseCircle,
  UsersRound,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<ApplicationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  under_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  interviewed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  on_hold: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

export default function Applications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsRes, groupsRes, internshipsRes] = await Promise.all([
        api.get('/applications'),
        api.get('/groups'),
        api.get('/internships')
      ]);
      setApplications(appsRes.data.data);
      setGroups(groupsRes.data.data);
      setInternships(internshipsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const filteredApplications = applications.filter(app => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.preferredDepartment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getInternshipTitle = (internshipId: any) => {
    if (!internshipId) return 'Unknown';
    const id = typeof internshipId === 'string' ? internshipId : (internshipId.id || internshipId._id || (internshipId.toString && internshipId.toString()));
    const internship = internships.find(i => i.id === id);
    return internship ? internship.title : 'Unknown';
  };

  const handleViewApplication = (app: Application) => {
    setSelectedApp(app);
    setNotes(app.notes || '');
    setViewDialogOpen(true);
  };

  const handleStatusChange = (appId: string, newStatus: ApplicationStatus) => {
    if (newStatus === 'accepted') {
      setAcceptDialogOpen(true);
      return;
    }

    processStatusChange(appId, newStatus);
  };

  const processStatusChange = async (appId: string, newStatus: ApplicationStatus, groupId?: string) => {
    try {
      if (newStatus === 'accepted') {
        // Use server-side accept endpoint to perform onboarding atomically
        await api.post(`/applications/${appId}/accept`, {
          groupId: groupId || undefined,
          notes,
        });
      } else {
        const updateData: any = {
          status: newStatus,
          notes,
          reviewedBy: user?.id,
          reviewedAt: new Date().toISOString(),
        };

        if (groupId) {
          updateData.assignedGroupId = groupId;
        }

        await api.put(`/applications/${appId}`, updateData);
      }

      toast.success(`Application ${newStatus.replace('_', ' ')}`);
      fetchData();
      setViewDialogOpen(false);
      setAcceptDialogOpen(false);
      setSelectedGroupId('');

    } catch (error: any) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application status');
    }
  };

  const handleAcceptWithGroup = () => {
    if (!selectedApp) return;
    const gid = selectedGroupId === 'none' ? undefined : (selectedGroupId || undefined);
    processStatusChange(selectedApp.id, 'accepted', gid);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Applications</h1>
            <p className="text-muted-foreground">
              Review and manage internship applications
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{applications.length} total</Badge>
            <Badge className={statusColors.pending}>
              {applications.filter(a => a.status === 'pending').length} pending
            </Badge>
            <Badge className={statusColors.accepted}>
              {applications.filter(a => a.status === 'accepted').length} accepted
            </Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or department..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="interviewed">Interviewed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No applications found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{app.name}</p>
                            <p className="text-sm text-muted-foreground">{app.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getInternshipTitle(app.internshipId)}
                        </TableCell>
                        <TableCell>{app.preferredDepartment}</TableCell>
                        <TableCell>
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[app.status]}>
                            {app.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewApplication(app)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Application Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
              <DialogDescription>
                Review the application and update its status
              </DialogDescription>
            </DialogHeader>

            {selectedApp && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedApp.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email
                    </p>
                    <p className="font-medium">{selectedApp.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Phone
                    </p>
                    <p className="font-medium">{selectedApp.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Briefcase className="h-3 w-3" /> Department
                    </p>
                    <p className="font-medium">{selectedApp.preferredDepartment}</p>
                  </div>
                  {selectedApp.availableFrom && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Available From
                      </p>
                      <p className="font-medium">
                        {(() => {
                          const d = new Date(selectedApp.availableFrom);
                          return isNaN(d.getTime()) ? selectedApp.availableFrom : d.toLocaleDateString();
                        })()}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{selectedApp.duration}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" /> Education
                  </p>
                  <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">{selectedApp.education}</p>
                </div>

                {selectedApp.skills && selectedApp.skills.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedApp.skills.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedApp.experience && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Experience</p>
                    <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">{selectedApp.experience}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Cover Letter</p>
                  <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
                    {selectedApp.coverLetter}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Reviewer Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add notes about this application..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Current Status</p>
                  <Badge className={statusColors[selectedApp.status]}>
                    {selectedApp.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => handleStatusChange(selectedApp!.id, 'under_review')}
              >
                <Clock className="h-4 w-4 mr-2" />
                Under Review
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStatusChange(selectedApp!.id, 'on_hold')}
              >
                <PauseCircle className="h-4 w-4 mr-2" />
                On Hold
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleStatusChange(selectedApp!.id, 'rejected')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => handleStatusChange(selectedApp!.id, 'accepted')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Accept and Assign Group Dialog */}
        <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Accept Application</DialogTitle>
              <DialogDescription>
                Optionally assign the applicant to a group for team collaboration and communication.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group">Assign to Group (Optional)</Label>
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No group</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center gap-2">
                          <UsersRound className="h-4 w-4" />
                          {group.name} ({group.memberIds.length} members)
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Assigning to a group will allow the intern to communicate with their team.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAcceptDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAcceptWithGroup}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept & Onboard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
