import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  FolderPlus, 
  MessageSquare, 
  Users, 
  ClipboardList,
  UserPlus 
} from 'lucide-react';

export function QuickActions() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const adminActions = [
    { icon: ClipboardList, label: 'Review Applications', path: '/applications' },
    { icon: FolderPlus, label: 'Create Project', path: '/projects' },
    { icon: UserPlus, label: 'Manage Users', path: '/users' },
    { icon: Users, label: 'Manage Groups', path: '/groups' },
  ];

  const mentorActions = [
    { icon: ClipboardList, label: 'Review Applications', path: '/applications' },
    { icon: FolderPlus, label: 'Create Project', path: '/projects' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
    { icon: Users, label: 'Manage Groups', path: '/groups' },
  ];

  const internActions = [
    { icon: FolderPlus, label: 'View Projects', path: '/projects' },
    { icon: ClipboardList, label: 'My Tasks', path: '/tasks' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
  ];

  const applicantActions = [
    { icon: FileText, label: 'My Application', path: '/my-application' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
  ];

  const getActions = () => {
    switch (user?.role) {
      case 'admin':
        return adminActions;
      case 'mentor':
        return mentorActions;
      case 'intern':
        return internActions;
      default:
        return applicantActions;
    }
  };

  const actions = getActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              onClick={() => navigate(action.path)}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}