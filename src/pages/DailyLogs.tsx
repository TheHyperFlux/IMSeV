import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  getDailyLogs, 
  getDailyLogsByUserId,
  addDailyLog, 
  updateDailyLog, 
  deleteDailyLog,
  generateId,
  addActivityLog,
  getUsers,
  addNotification
} from '@/lib/storage';
import { DailyLog } from '@/types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Calendar,
  Clock,
  Smile,
  Meh,
  Frown,
  ThumbsUp,
  BookOpen,
  Target,
  AlertTriangle,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function DailyLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<DailyLog[]>(
    user?.role === 'admin' || user?.role === 'mentor' 
      ? getDailyLogs() 
      : getDailyLogsByUserId(user?.id || '')
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [selectedShareUsers, setSelectedShareUsers] = useState<string[]>([]);
  
  const allUsers = getUsers();
  const users = allUsers.filter(u => u.role === 'intern');
  const mentorsAndAdmins = allUsers.filter(u => u.role === 'admin' || u.role === 'mentor');
  const isAdminOrMentor = user?.role === 'admin' || user?.role === 'mentor';
  const isIntern = user?.role === 'intern';
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    tasksCompleted: '',
    tasksPlanned: '',
    challenges: '',
    learnings: '',
    hoursWorked: 8,
    mood: 'good' as DailyLog['mood'],
  });

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      tasksCompleted: '',
      tasksPlanned: '',
      challenges: '',
      learnings: '',
      hoursWorked: 8,
      mood: 'good',
    });
  };

  const getFilteredLogs = () => {
    let filtered = logs;
    
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.tasksCompleted.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.tasksPlanned.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.learnings?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedUserId !== 'all' && isAdminOrMentor) {
      filtered = filtered.filter(log => log.userId === selectedUserId);
    }
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleCreateLog = () => {
    if (!formData.tasksCompleted || !formData.tasksPlanned) return;
    
    const newLog: DailyLog = {
      id: generateId(),
      userId: user?.id || '',
      date: formData.date,
      tasksCompleted: formData.tasksCompleted,
      tasksPlanned: formData.tasksPlanned,
      challenges: formData.challenges || undefined,
      learnings: formData.learnings || undefined,
      hoursWorked: formData.hoursWorked,
      mood: formData.mood,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDailyLog(newLog);
    
    addActivityLog({
      id: generateId(),
      userId: user?.id || '',
      action: 'daily_log_created',
      details: `Added daily log for ${format(new Date(formData.date), 'MMM dd, yyyy')}`,
      timestamp: new Date().toISOString(),
      resourceType: 'daily_log',
      resourceId: newLog.id,
    });

    setLogs(isAdminOrMentor ? getDailyLogs() : getDailyLogsByUserId(user?.id || ''));
    setCreateDialogOpen(false);
    resetForm();
  };

  const handleEditLog = () => {
    if (!selectedLog) return;

    updateDailyLog(selectedLog.id, {
      date: formData.date,
      tasksCompleted: formData.tasksCompleted,
      tasksPlanned: formData.tasksPlanned,
      challenges: formData.challenges || undefined,
      learnings: formData.learnings || undefined,
      hoursWorked: formData.hoursWorked,
      mood: formData.mood,
      updatedAt: new Date().toISOString(),
    });

    setLogs(isAdminOrMentor ? getDailyLogs() : getDailyLogsByUserId(user?.id || ''));
    setEditDialogOpen(false);
    setSelectedLog(null);
    resetForm();
  };

  const handleDeleteLog = (logId: string) => {
    if (confirm('Are you sure you want to delete this daily log?')) {
      deleteDailyLog(logId);
      setLogs(isAdminOrMentor ? getDailyLogs() : getDailyLogsByUserId(user?.id || ''));
    }
  };

  const openShareDialog = (log: DailyLog) => {
    setSelectedLog(log);
    setSelectedShareUsers(log.sharedWith || []);
    setShareDialogOpen(true);
  };

  const handleShareLog = () => {
    if (!selectedLog) return;

    updateDailyLog(selectedLog.id, {
      sharedWith: selectedShareUsers,
      updatedAt: new Date().toISOString(),
    });

    // Send notifications to newly shared users
    const newlyShared = selectedShareUsers.filter(
      id => !(selectedLog.sharedWith || []).includes(id)
    );
    
    newlyShared.forEach(userId => {
      addNotification({
        id: generateId(),
        userId,
        title: 'Daily Log Shared',
        message: `${user?.name} shared their daily log from ${format(new Date(selectedLog.date), 'MMM dd, yyyy')} with you.`,
        type: 'info',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/daily-logs',
      });
    });

    setLogs(isAdminOrMentor ? getDailyLogs() : getDailyLogsByUserId(user?.id || ''));
    setShareDialogOpen(false);
    setSelectedLog(null);
    setSelectedShareUsers([]);
  };

  const openEditDialog = (log: DailyLog) => {
    setSelectedLog(log);
    setFormData({
      date: log.date,
      tasksCompleted: log.tasksCompleted,
      tasksPlanned: log.tasksPlanned,
      challenges: log.challenges || '',
      learnings: log.learnings || '',
      hoursWorked: log.hoursWorked,
      mood: log.mood,
    });
    setEditDialogOpen(true);
  };

  const getMoodIcon = (mood: DailyLog['mood']) => {
    switch (mood) {
      case 'great': return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case 'good': return <Smile className="h-4 w-4 text-blue-500" />;
      case 'okay': return <Meh className="h-4 w-4 text-yellow-500" />;
      case 'struggling': return <Frown className="h-4 w-4 text-red-500" />;
    }
  };

  const getMoodColor = (mood: DailyLog['mood']) => {
    switch (mood) {
      case 'great': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'okay': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'struggling': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    }
  };

  const getUserName = (userId: string) => {
    const foundUser = getUsers().find(u => u.id === userId);
    return foundUser?.name || 'Unknown';
  };

  const filteredLogs = getFilteredLogs();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Daily Logs</h1>
            <p className="text-muted-foreground">
              {isAdminOrMentor ? 'View and track intern progress logs' : 'Track your daily progress and learnings'}
            </p>
          </div>
          {!isAdminOrMentor && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Daily Log
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Daily Log</DialogTitle>
                  <DialogDescription>
                    Record your progress for today
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hours">Hours Worked</Label>
                      <Input
                        id="hours"
                        type="number"
                        min="0"
                        max="24"
                        value={formData.hoursWorked}
                        onChange={(e) => setFormData({ ...formData, hoursWorked: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tasksCompleted">Tasks Completed Today *</Label>
                    <Textarea
                      id="tasksCompleted"
                      value={formData.tasksCompleted}
                      onChange={(e) => setFormData({ ...formData, tasksCompleted: e.target.value })}
                      placeholder="What did you accomplish today?"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tasksPlanned">Tasks Planned for Tomorrow *</Label>
                    <Textarea
                      id="tasksPlanned"
                      value={formData.tasksPlanned}
                      onChange={(e) => setFormData({ ...formData, tasksPlanned: e.target.value })}
                      placeholder="What will you work on tomorrow?"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="challenges">Challenges Faced</Label>
                    <Textarea
                      id="challenges"
                      value={formData.challenges}
                      onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                      placeholder="Any blockers or difficulties?"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="learnings">Key Learnings</Label>
                    <Textarea
                      id="learnings"
                      value={formData.learnings}
                      onChange={(e) => setFormData({ ...formData, learnings: e.target.value })}
                      placeholder="What did you learn today?"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>How are you feeling?</Label>
                    <Select
                      value={formData.mood}
                      onValueChange={(value: DailyLog['mood']) => setFormData({ ...formData, mood: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="great">😄 Great</SelectItem>
                        <SelectItem value="good">🙂 Good</SelectItem>
                        <SelectItem value="okay">😐 Okay</SelectItem>
                        <SelectItem value="struggling">😟 Struggling</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateLog} disabled={!formData.tasksCompleted || !formData.tasksPlanned}>
                    Save Log
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdminOrMentor && (
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by intern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Interns</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No daily logs found.</p>
              {!isAdminOrMentor && (
                <Button className="mt-4" onClick={() => { resetForm(); setCreateDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Log
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredLogs.map((log) => (
              <Card key={log.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-lg">
                          {format(new Date(log.date), 'EEEE, MMMM dd, yyyy')}
                        </CardTitle>
                      </div>
                      {isAdminOrMentor && (
                        <CardDescription>by {getUserName(log.userId)}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn('text-xs', getMoodColor(log.mood))}>
                        {getMoodIcon(log.mood)}
                        <span className="ml-1 capitalize">{log.mood}</span>
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {log.hoursWorked}h
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Target className="h-4 w-4 text-green-500" />
                        Completed
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {log.tasksCompleted}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Target className="h-4 w-4 text-blue-500" />
                        Planned for Next
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {log.tasksPlanned}
                      </p>
                    </div>
                  </div>
                  
                  {(log.challenges || log.learnings) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                      {log.challenges && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            Challenges
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {log.challenges}
                          </p>
                        </div>
                      )}
                      {log.learnings && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <BookOpen className="h-4 w-4 text-purple-500" />
                            Learnings
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {log.learnings}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {log.userId === user?.id && (
                    <div className="flex justify-end gap-2 pt-2 border-t">
                      {isIntern && (
                        <Button variant="ghost" size="sm" onClick={() => openShareDialog(log)}>
                          <Share2 className="h-4 w-4 mr-1" />
                          Share
                          {log.sharedWith && log.sharedWith.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {log.sharedWith.length}
                            </Badge>
                          )}
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(log)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteLog(log.id)}>
                        <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                        Delete
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
              <DialogTitle>Edit Daily Log</DialogTitle>
              <DialogDescription>
                Update your daily log entry
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hours Worked</Label>
                  <Input
                    type="number"
                    min="0"
                    max="24"
                    value={formData.hoursWorked}
                    onChange={(e) => setFormData({ ...formData, hoursWorked: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tasks Completed *</Label>
                <Textarea
                  value={formData.tasksCompleted}
                  onChange={(e) => setFormData({ ...formData, tasksCompleted: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Tasks Planned *</Label>
                <Textarea
                  value={formData.tasksPlanned}
                  onChange={(e) => setFormData({ ...formData, tasksPlanned: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Challenges</Label>
                <Textarea
                  value={formData.challenges}
                  onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Learnings</Label>
                <Textarea
                  value={formData.learnings}
                  onChange={(e) => setFormData({ ...formData, learnings: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Mood</Label>
                <Select
                  value={formData.mood}
                  onValueChange={(value: DailyLog['mood']) => setFormData({ ...formData, mood: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="great">😄 Great</SelectItem>
                    <SelectItem value="good">🙂 Good</SelectItem>
                    <SelectItem value="okay">😐 Okay</SelectItem>
                    <SelectItem value="struggling">😟 Struggling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditLog}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Share Daily Log</DialogTitle>
              <DialogDescription>
                Select mentors or admins to share this log with
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <ScrollArea className="h-64 border rounded-lg p-2">
                {mentorsAndAdmins.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No mentors or admins available
                  </p>
                ) : (
                  mentorsAndAdmins.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center space-x-2 p-2 hover:bg-muted rounded-lg"
                    >
                      <Checkbox
                        id={`share-${u.id}`}
                        checked={selectedShareUsers.includes(u.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedShareUsers([...selectedShareUsers, u.id]);
                          } else {
                            setSelectedShareUsers(selectedShareUsers.filter(id => id !== u.id));
                          }
                        }}
                      />
                      <label
                        htmlFor={`share-${u.id}`}
                        className="flex-1 cursor-pointer flex items-center gap-2"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {u.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                        </div>
                      </label>
                    </div>
                  ))
                )}
              </ScrollArea>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleShareLog}>
                Share Log
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}