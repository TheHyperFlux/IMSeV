import { useCallback } from 'react';
import { addNotification, generateId } from '@/lib/storage';
import { Notification } from '@/types';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}

export function useNotifications() {
  const createNotification = useCallback((params: CreateNotificationParams) => {
    const notification: Notification = {
      id: generateId(),
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type || 'info',
      isRead: false,
      createdAt: new Date().toISOString(),
      link: params.link,
    };
    addNotification(notification);
    return notification;
  }, []);

  const notifyApplicationStatusChange = useCallback((
    userId: string, 
    applicationStatus: string
  ) => {
    const statusMessages: Record<string, { title: string; message: string; type: NotificationType }> = {
      under_review: {
        title: 'Application Under Review',
        message: 'Your application is now being reviewed by our team.',
        type: 'info'
      },
      interviewed: {
        title: 'Interview Scheduled',
        message: 'Congratulations! You have been selected for an interview.',
        type: 'success'
      },
      accepted: {
        title: 'Application Accepted! 🎉',
        message: 'Welcome to the team! Your internship application has been accepted.',
        type: 'success'
      },
      rejected: {
        title: 'Application Status Update',
        message: 'Unfortunately, we could not proceed with your application at this time.',
        type: 'warning'
      }
    };

    const statusInfo = statusMessages[applicationStatus];
    if (statusInfo) {
      createNotification({
        userId,
        ...statusInfo,
        link: '/my-application'
      });
    }
  }, [createNotification]);

  const notifyTaskAssignment = useCallback((
    userId: string,
    taskTitle: string,
    projectName: string
  ) => {
    createNotification({
      userId,
      title: 'New Task Assigned',
      message: `You have been assigned "${taskTitle}" in project "${projectName}".`,
      type: 'info',
      link: '/tasks'
    });
  }, [createNotification]);

  const notifyProjectAssignment = useCallback((
    userId: string,
    projectName: string
  ) => {
    createNotification({
      userId,
      title: 'Added to Project',
      message: `You have been added to the project "${projectName}".`,
      type: 'success',
      link: '/projects'
    });
  }, [createNotification]);

  const notifyNewMessage = useCallback((
    userId: string,
    senderName: string
  ) => {
    createNotification({
      userId,
      title: 'New Message',
      message: `You received a new message from ${senderName}.`,
      type: 'info',
      link: '/messages'
    });
  }, [createNotification]);

  const notifyTaskCompletion = useCallback((
    mentorId: string,
    internName: string,
    taskTitle: string
  ) => {
    createNotification({
      userId: mentorId,
      title: 'Task Completed',
      message: `${internName} has completed the task "${taskTitle}".`,
      type: 'success',
      link: '/tasks'
    });
  }, [createNotification]);

  const notifyNewApplication = useCallback((
    adminIds: string[],
    applicantName: string
  ) => {
    adminIds.forEach(adminId => {
      createNotification({
        userId: adminId,
        title: 'New Application',
        message: `${applicantName} has submitted a new internship application.`,
        type: 'info',
        link: '/applications'
      });
    });
  }, [createNotification]);

  return {
    createNotification,
    notifyApplicationStatusChange,
    notifyTaskAssignment,
    notifyProjectAssignment,
    notifyNewMessage,
    notifyTaskCompletion,
    notifyNewApplication,
  };
}