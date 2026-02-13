import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getGroups,
  addGroup,
  updateGroup,
  deleteGroup,
  getUsers,
  generateId,
  addActivityLog,
  getMessagesByChatId,
  addMessage,
  addChat,
  getChatByGroupId
} from '@/lib/storage';
import { Group, Message, Chat } from '@/types';
import {
  Plus,
  Edit,
  Trash2,
  UsersRound,
  Search,
  Settings,
  MessageSquare,
  Send,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  // Chat state
  const [chatGroup, setChatGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const users = getUsers();
  const isAdmin = user?.role === 'admin';
  const isMentor = user?.role === 'mentor';
  const canViewGroups = isAdmin || isMentor;
  const canCreateGroups = isAdmin; // Only admin can create groups

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    memberIds: [] as string[],
    adminIds: [] as string[],
  });

  useEffect(() => {
    loadGroups();
  }, [user]);

  useEffect(() => {
    if (chatGroup) {
      loadMessages();
    }
  }, [chatGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadGroups = () => {
    const allGroups = getGroups();
    if (isAdmin) {
      setGroups(allGroups);
    } else {
      // Mentors and Regular users only see groups they're part of
      setGroups(allGroups.filter(g =>
        g.memberIds.includes(user?.id || '') ||
        g.adminIds.includes(user?.id || '')
      ));
    }
  };

  const loadMessages = () => {
    if (!chatGroup) return;

    let chat = getChatByGroupId(chatGroup.id);

    // Create chat if doesn't exist
    if (!chat) {
      const chatId = generateId();
      const newChat: Chat = {
        id: chatId,
        type: 'group',
        name: chatGroup.name,
        participantIds: chatGroup.memberIds,
        groupId: chatGroup.id,
        createdAt: new Date().toISOString(),
      };
      addChat(newChat);

      // Update group with chat ID
      updateGroup(chatGroup.id, { chatId });
      chat = newChat;
    }

    setMessages(getMessagesByChatId(chat.id));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      memberIds: [],
      adminIds: [],
    });
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const myGroups = groups.filter(g => g.memberIds.includes(user?.id || ''));

  const handleCreateGroup = () => {
    const newGroup: Group = {
      id: generateId(),
      name: formData.name,
      description: formData.description,
      memberIds: formData.memberIds,
      adminIds: formData.adminIds.length > 0 ? formData.adminIds : [user?.id || ''],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addGroup(newGroup);

    // Create group chat
    const chatId = generateId();
    addChat({
      id: chatId,
      type: 'group',
      name: formData.name,
      participantIds: formData.memberIds,
      groupId: newGroup.id,
      createdAt: new Date().toISOString(),
    });

    // Update group with chat ID
    updateGroup(newGroup.id, { chatId });

    addActivityLog({
      id: generateId(),
      userId: user?.id || '',
      action: 'group_created',
      details: `Created group: ${formData.name}`,
      timestamp: new Date().toISOString(),
      resourceType: 'group',
      resourceId: newGroup.id,
    });

    loadGroups();
    setCreateDialogOpen(false);
    resetForm();
  };

  const handleEditGroup = () => {
    if (!selectedGroup) return;

    updateGroup(selectedGroup.id, {
      name: formData.name,
      description: formData.description,
      memberIds: formData.memberIds,
      adminIds: formData.adminIds,
      updatedAt: new Date().toISOString(),
    });

    addActivityLog({
      id: generateId(),
      userId: user?.id || '',
      action: 'group_updated',
      details: `Updated group: ${formData.name}`,
      timestamp: new Date().toISOString(),
      resourceType: 'group',
      resourceId: selectedGroup.id,
    });

    loadGroups();
    setEditDialogOpen(false);
    setSelectedGroup(null);
    resetForm();
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm('Are you sure you want to delete this group?')) {
      deleteGroup(groupId);
      loadGroups();
    }
  };

  const openEditDialog = (group: Group) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description,
      memberIds: group.memberIds,
      adminIds: group.adminIds,
    });
    setEditDialogOpen(true);
  };

  const openGroupChat = (group: Group) => {
    setChatGroup(group);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !chatGroup || !user) return;

    let chat = getChatByGroupId(chatGroup.id);
    if (!chat) return;

    const message: Message = {
      id: generateId(),
      chatId: chat.id,
      senderId: user.id,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    addMessage(message);
    loadMessages();
    setNewMessage('');
  };

  const getMemberNames = (memberIds: string[]) => {
    return memberIds.map(id => {
      const u = users.find(user => user.id === id);
      return u?.name || 'Unknown';
    });
  };

  const getSenderName = (senderId: string) => {
    if (senderId === user?.id) return 'You';
    const sender = users.find(u => u.id === senderId);
    return sender?.name || 'Unknown';
  };

  // Group Chat View
  if (chatGroup) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-12rem)]">
          <Card className="h-full flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setChatGroup(null)}>
                  ← Back
                </Button>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UsersRound className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{chatGroup.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {chatGroup.memberIds.length} members
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.senderId === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          isOwn ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg p-3",
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          {!isOwn && (
                            <p className="text-xs font-medium mb-1 opacity-70">
                              {getSenderName(message.senderId)}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className={cn(
                            "text-xs mt-1",
                            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {new Date(message.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Groups</h1>
            <p className="text-muted-foreground">
              {canCreateGroups ? 'Manage user groups and team organization' : 'View groups and communicate with teams'}
            </p>
          </div>
          {canCreateGroups && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Group
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                  <DialogDescription>
                    Create a new group to organize users
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Group Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Engineering Team"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the group's purpose"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Members</Label>
                    <ScrollArea className="h-48 border rounded-lg p-2">
                      {users.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center space-x-2 p-2 hover:bg-muted rounded-lg"
                        >
                          <Checkbox
                            id={`member-${u.id}`}
                            checked={formData.memberIds.includes(u.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  memberIds: [...formData.memberIds, u.id]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  memberIds: formData.memberIds.filter(id => id !== u.id),
                                  adminIds: formData.adminIds.filter(id => id !== u.id)
                                });
                              }
                            }}
                          />
                          <label
                            htmlFor={`member-${u.id}`}
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
                          {formData.memberIds.includes(u.id) && (
                            <Checkbox
                              id={`admin-${u.id}`}
                              checked={formData.adminIds.includes(u.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({
                                    ...formData,
                                    adminIds: [...formData.adminIds, u.id]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    adminIds: formData.adminIds.filter(id => id !== u.id)
                                  });
                                }
                              }}
                            />
                          )}
                          {formData.memberIds.includes(u.id) && (
                            <label htmlFor={`admin-${u.id}`} className="text-xs text-muted-foreground">
                              Admin
                            </label>
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGroup} disabled={!formData.name}>
                    Create Group
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Tabs for My Groups vs All Groups */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              {canViewGroups ? 'All Groups' : 'My Groups'}
            </TabsTrigger>
            {canViewGroups && (
              <TabsTrigger value="my">My Groups</TabsTrigger>
            )}
          </TabsList>

          <div className="relative max-w-md mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <TabsContent value="all" className="mt-4">
            {filteredGroups.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <UsersRound className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No groups found.</p>
                  {canCreateGroups && (
                    <Button className="mt-4" onClick={() => { resetForm(); setCreateDialogOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Group
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGroups.map((group) => {
                  const isMember = group.memberIds.includes(user?.id || '');
                  return (
                    <Card key={group.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <UsersRound className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{group.name}</CardTitle>
                              <CardDescription>
                                {group.memberIds.length} members
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {group.description || 'No description'}
                        </p>

                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Members</p>
                          <div className="flex flex-wrap gap-1">
                            {getMemberNames(group.memberIds).slice(0, 3).map((name, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {name}
                              </Badge>
                            ))}
                            {group.memberIds.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{group.memberIds.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          {isMember && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => openGroupChat(group)}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Chat
                            </Button>
                          )}
                          {canViewGroups && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className={isMember ? '' : 'flex-1'}
                                onClick={() => openEditDialog(group)}
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                Manage
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteGroup(group.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {canViewGroups && (
            <TabsContent value="my" className="mt-4">
              {myGroups.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <UsersRound className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">You're not a member of any groups.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myGroups.map((group) => (
                    <Card key={group.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <UsersRound className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{group.name}</CardTitle>
                              <CardDescription>
                                {group.memberIds.length} members
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {group.description || 'No description'}
                        </p>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => openGroupChat(group)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Chat
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Group</DialogTitle>
              <DialogDescription>
                Update group details and members
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Group Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Members</Label>
                <ScrollArea className="h-48 border rounded-lg p-2">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center space-x-2 p-2 hover:bg-muted rounded-lg"
                    >
                      <Checkbox
                        id={`edit-member-${u.id}`}
                        checked={formData.memberIds.includes(u.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              memberIds: [...formData.memberIds, u.id]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              memberIds: formData.memberIds.filter(id => id !== u.id),
                              adminIds: formData.adminIds.filter(id => id !== u.id)
                            });
                          }
                        }}
                      />
                      <label
                        htmlFor={`edit-member-${u.id}`}
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
                      {formData.memberIds.includes(u.id) && (
                        <>
                          <Checkbox
                            id={`edit-admin-${u.id}`}
                            checked={formData.adminIds.includes(u.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  adminIds: [...formData.adminIds, u.id]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  adminIds: formData.adminIds.filter(id => id !== u.id)
                                });
                              }
                            }}
                          />
                          <label htmlFor={`edit-admin-${u.id}`} className="text-xs text-muted-foreground">
                            Admin
                          </label>
                        </>
                      )}
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditGroup}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
