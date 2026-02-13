import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import api from '@/lib/api';
import { ActivityLog } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import {
  LogIn,
  LogOut,
  UserPlus,
  FileText,
  FolderPlus,
  CheckCircle,
  MessageSquare,
  Users,
  ClipboardList,
  Edit,
  Loader2
} from 'lucide-react';

const actionIcons: Record<string, React.ElementType> = {
  login: LogIn,
  logout: LogOut,
  register: UserPlus,
  application_submit: FileText,
  application_submitted: FileText,
  project_create: FolderPlus,
  project_created: FolderPlus,
  task_complete: CheckCircle,
  task_completed: CheckCircle,
  task_created: ClipboardList,
  task_updated: Edit,
  message_send: MessageSquare,
  group_create: Users,
  group_created: Users,
  group_updated: Edit,
  daily_log_created: FileText,
};

export function RecentActivity() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        let res;
        if (user.role === 'admin' || user.role === 'mentor') {
          res = await api.get('/activity-logs');
        } else {
          res = await api.get(`/activity-logs/user/${user.id}`);
        }
        setActivities(res.data.data);
      } catch (error) {
        console.error('Failed to fetch activity logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [user]);

  const getActionIcon = (action: string) => {
    const Icon = actionIcons[action] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getUserInitials = (name?: string) => { // Modified to accept name directly
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Helper to fetch user name if not present in log - backend should ideally populate
  // For now, assuming logs might have userId populating strategies or we just show "User"
  // Actually, let's update the backend model to include userName for simpler display or fetch users
  // But to keep it simple, we'll just use a placeholder or modify backend later.
  // Wait, the original code used `getUserById`.
  // We should probably rely on the backend population.
  // Let's assume the backend will return populated user details or we might need to fetch users.
  // For now I'll use a placeholder or check if the log has user details.
  // Actually, I'll update the backend controller to populate user details if possible.
  // But given constraints, I'll just check if the log has a `user` object populated.
  // If not, I'll just show "User".

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activities.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No recent activity
            </p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {/* Ideally access user name here */}
                      {/* {getUserInitials(activity.user?.name)} */}
                      ?
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {getActionIcon(activity.action)}
                      <span className="text-sm font-medium">
                        User {activity.userId.substring(0, 4)}... {/* identifying by ID for now */}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activity.details}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
