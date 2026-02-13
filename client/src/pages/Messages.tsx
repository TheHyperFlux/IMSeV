import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import api from '@/lib/api';
import { Chat, Message, User } from '@/types';
import {
  Send,
  Plus,
  MessageSquare,
  Users,
  Search,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Messages() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [chatName, setChatName] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUser?.role === 'applicant') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/chats');
      setChats(res.data.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Failed to fetch chats');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      // Filter out current user from potential chat partners
      const allUsers: User[] = res.data.data;
      setUsers(allUsers.filter(u => u.id !== currentUser?.id));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchChats();
      fetchUsers();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

  const fetchMessages = async (chatId: string) => {
    try {
      const res = await api.get(`/messages/${chatId}`);
      setMessages(res.data.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch messages');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !currentUser) return;

    try {
      await api.post('/messages', {
        chatId: selectedChat.id,
        content: newMessage.trim()
      });

      fetchMessages(selectedChat.id);
      fetchChats(); // Refresh chat list to update last message
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0 || !currentUser) return;

    try {
      const isGroup = selectedUsers.length > 1;

      // Ensure current user is in participants
      const participantIds = [...selectedUsers, currentUser.id];

      const res = await api.post('/chats', {
        type: isGroup ? 'group' : 'direct',
        name: isGroup ? chatName || 'Group Chat' : undefined,
        participantIds
      });

      const newChat = res.data.data;

      fetchChats();
      setSelectedChat(newChat);
      setCreateDialogOpen(false);
      setSelectedUsers([]);
      setChatName('');
    } catch (error: any) {
      console.error('Error creating chat:', error);
      toast.error(error.response?.data?.error || 'Failed to create chat');
    }
  };

  const getChatName = (chat: Chat) => {
    if (chat.name) return chat.name;
    if (chat.type === 'direct') {
      const otherUser = chat.participantIds.find(p => {
        if (typeof p === 'string') return p !== currentUser?.id;
        return p.id !== currentUser?.id;
      });

      if (typeof otherUser === 'object') {
        return otherUser.name || 'Unknown User';
      }

      // Fallback if we only have ID (shouldn't happen with updated backend)
      const u = users.find(u => u.id === otherUser);
      return u?.name || 'Unknown User';
    }
    return 'Group Chat';
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === 'direct') {
      const otherUser = chat.participantIds.find(p => {
        if (typeof p === 'string') return p !== currentUser?.id;
        return p.id !== currentUser?.id;
      });

      if (typeof otherUser === 'object') {
        return otherUser.name?.charAt(0).toUpperCase() || '?';
      }

      const u = users.find(u => u.id === otherUser);
      return u?.name?.charAt(0).toUpperCase() || '?';
    }
    return 'G';
  };

  const getSenderName = (senderId: string | { id: string; name: string; avatar?: string }) => {
    if (senderId === currentUser?.id || (typeof senderId === 'object' && senderId.id === currentUser?.id)) return 'You';

    if (typeof senderId === 'object') {
      return senderId.name || 'Unknown';
    }

    const sender = users.find(u => u.id === senderId);
    return sender?.name || 'Unknown';
  };

  const filteredChats = chats.filter(chat =>
    getChatName(chat).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-12rem)]">
        <Card className="h-full">
          <div className="flex h-full">
            {/* Chat List */}
            <div className="w-80 border-r flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Messages</h2>
                  <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>New Conversation</DialogTitle>
                        <DialogDescription>
                          Select users to start a conversation
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {selectedUsers.length > 1 && (
                          <div className="space-y-2">
                            <Label htmlFor="chatName">Group Name</Label>
                            <Input
                              id="chatName"
                              value={chatName}
                              onChange={(e) => setChatName(e.target.value)}
                              placeholder="Enter group name"
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>Select Users</Label>
                          <ScrollArea className="h-48 border rounded-lg p-2">
                            {users.map((u) => (
                              <div
                                key={u.id}
                                className="flex items-center space-x-2 p-2 hover:bg-muted rounded-lg"
                              >
                                <Checkbox
                                  id={u.id}
                                  checked={selectedUsers.includes(u.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedUsers([...selectedUsers, u.id]);
                                    } else {
                                      setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={u.id}
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
                            ))}
                          </ScrollArea>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateChat} disabled={selectedUsers.length === 0}>
                          Start Chat
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                {loading && chats.length === 0 ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredChats.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredChats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => setSelectedChat(chat)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                          selectedChat?.id === chat.id
                            ? "bg-muted"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <Avatar>
                          <AvatarFallback className={chat.type === 'group' ? 'bg-primary text-primary-foreground' : ''}>
                            {chat.type === 'group' ? <Users className="h-4 w-4" /> : getChatAvatar(chat)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{getChatName(chat)}</p>
                          {chat.lastMessage && (
                            <p className="text-sm text-muted-foreground truncate">
                              {chat.lastMessage}
                            </p>
                          )}
                        </div>
                        {chat.lastMessageAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(chat.lastMessageAt).toLocaleDateString()}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 flex flex-col">
              {selectedChat ? (
                <>
                  <div className="p-4 border-b flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className={selectedChat.type === 'group' ? 'bg-primary text-primary-foreground' : ''}>
                        {selectedChat.type === 'group' ? <Users className="h-4 w-4" /> : getChatAvatar(selectedChat)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{getChatName(selectedChat)}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedChat.participantIds.length} participants
                      </p>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        messages.map((message) => {
                          const senderId = typeof message.senderId === 'object' ? message.senderId.id : message.senderId;
                          const isOwn = senderId === currentUser?.id;
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
                                {!isOwn && selectedChat.type === 'group' && (
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
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}