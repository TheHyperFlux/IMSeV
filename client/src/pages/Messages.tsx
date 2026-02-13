import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  getChats,
  getChatsByUserId,
  getMessagesByChatId,
  addMessage,
  addChat,
  getUsers,
  generateId
} from '@/lib/storage';
import { Chat, Message } from '@/types';
import {
  Send,
  Plus,
  MessageSquare,
  Users,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [chatName, setChatName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const users = getUsers().filter(u => u.id !== user?.id);

  useEffect(() => {
    if (user?.role === 'applicant') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      setChats(getChatsByUserId(user.id));
    }
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      setMessages(getMessagesByChatId(selectedChat.id));
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    const message: Message = {
      id: generateId(),
      chatId: selectedChat.id,
      senderId: user.id,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    addMessage(message);
    setMessages(getMessagesByChatId(selectedChat.id));
    setChats(getChatsByUserId(user.id));
    setNewMessage('');
  };

  const handleCreateChat = () => {
    if (selectedUsers.length === 0 || !user) return;

    const isGroup = selectedUsers.length > 1;
    const newChat: Chat = {
      id: generateId(),
      type: isGroup ? 'group' : 'direct',
      name: isGroup ? chatName || 'Group Chat' : undefined,
      participantIds: [...selectedUsers, user.id],
      createdAt: new Date().toISOString(),
    };

    addChat(newChat);
    setChats(getChatsByUserId(user.id));
    setSelectedChat(newChat);
    setCreateDialogOpen(false);
    setSelectedUsers([]);
    setChatName('');
  };

  const getChatName = (chat: Chat) => {
    if (chat.name) return chat.name;
    if (chat.type === 'direct') {
      const otherUserId = chat.participantIds.find(id => id !== user?.id);
      const otherUser = users.find(u => u.id === otherUserId);
      return otherUser?.name || 'Unknown User';
    }
    return 'Group Chat';
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === 'direct') {
      const otherUserId = chat.participantIds.find(id => id !== user?.id);
      const otherUser = users.find(u => u.id === otherUserId);
      return otherUser?.name?.charAt(0).toUpperCase() || '?';
    }
    return 'G';
  };

  const getSenderName = (senderId: string) => {
    if (senderId === user?.id) return 'You';
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
                {filteredChats.length === 0 ? (
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