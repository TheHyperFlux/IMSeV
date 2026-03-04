import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import api from '@/lib/api';
import { Task } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeadlineItem {
  id: string;
  title: string;
  dueDate: string;
  type: 'task' | 'project';
  priority?: string;
  isOverdue: boolean;
}

export function UpcomingDeadlines() {
  const { user } = useAuth();
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);

      try {
        const items: DeadlineItem[] = [];
        const now = new Date();
        const twoWeeksFromNow = addDays(now, 14);

        const tasksRes = await api.get('/tasks');
        const allTasks: Task[] = tasksRes.data.data;

        // Filter tasks
        let relevantTasks = allTasks;
        if (user.role !== 'admin' && user.role !== 'mentor') {
          relevantTasks = allTasks.filter(t => t.assigneeId === user.id);
        }

        relevantTasks.forEach(task => {
          if (task.dueDate && task.status !== 'completed') {
            const dueDate = new Date(task.dueDate);
            if (isBefore(dueDate, twoWeeksFromNow)) {
              items.push({
                id: task.id,
                title: task.title,
                dueDate: task.dueDate,
                type: 'task',
                priority: task.priority,
                isOverdue: isBefore(dueDate, now)
              });
            }
          }
        });

        // Sort by date
        items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        setDeadlines(items.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch deadlines:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Upcoming Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : deadlines.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No upcoming deadlines
            </p>
          ) : (
            <div className="space-y-3">
              {deadlines.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg",
                    item.isOverdue && "bg-red-50 dark:bg-red-900/10"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {item.isOverdue && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(item.dueDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {item.type}
                    </Badge>
                    {item.priority && (
                      <Badge className={cn("text-xs", getPriorityColor(item.priority))}>
                        {item.priority}
                      </Badge>
                    )}
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
