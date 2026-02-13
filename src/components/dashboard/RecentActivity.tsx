import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getActivityLogs, getActivityLogsByUserId, getUserById } from '@/lib/storage';
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
  Edit
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

  useEffect(() => {
    // Admin and mentor see all activities, others see only their own
    if (user?.role === 'admin' || user?.role === 'mentor') {
      const logs = getActivityLogs()
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
      setActivities(logs);
    } else if (user) {
      const logs = getActivityLogsByUserId(user.id).slice(0, 10);
      setActivities(logs);
    }
  }, [user]);

  const getActionIcon = (action: string) => {
    const Icon = actionIcons[action] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getUserInitials = (userId: string) => {
    const activityUser = getUserById(userId);
    if (!activityUser) return '?';
    return activityUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getUserName = (userId: string) => {
    const activityUser = getUserById(userId);
    return activityUser?.name || 'Unknown User';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {activities.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No recent activity
            </p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getUserInitials(activity.userId)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {getActionIcon(activity.action)}
                      <span className="text-sm font-medium">
                        {getUserName(activity.userId)}
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