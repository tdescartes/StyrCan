"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Search,
    Send,
    MoreVertical,
    Phone,
    Video,
    Info,
    Paperclip,
    Smile,
    Check,
    CheckCheck,
    Plus,
    Loader2,
    MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, getInitials, formatRelativeTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import type { Message } from "@/types";

// Represents a conversation derived from inbox + sent messages
interface Conversation {
    participantId: string;
    participantName: string;
    lastMessage: Message;
    unreadCount: number;
}

export default function MessagesPage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState("");
    const [newMessageOpen, setNewMessageOpen] = useState(false);
    const [newMessageRecipient, setNewMessageRecipient] = useState("");
    const [newMessageContent, setNewMessageContent] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch inbox messages
    const { data: inboxMessages = [], isLoading: inboxLoading } = useQuery<Message[]>({
        queryKey: ["messages", "inbox"],
        queryFn: () => apiClient.getInbox({ limit: 100 }) as Promise<Message[]>,
        refetchInterval: 10000, // poll every 10s for new messages
    });

    // Fetch sent messages
    const { data: sentMessages = [] } = useQuery<Message[]>({
        queryKey: ["messages", "sent"],
        queryFn: () => apiClient.getSentMessages({ limit: 100 }) as Promise<Message[]>,
        refetchInterval: 10000,
    });

    // Fetch unread count
    const { data: unreadData } = useQuery({
        queryKey: ["messages", "unread-count"],
        queryFn: () => apiClient.getUnreadMessageCount(),
        refetchInterval: 10000,
    });

    // Build conversations from inbox + sent messages
    const conversations = useMemo<Conversation[]>(() => {
        if (!user) return [];
        const convMap = new Map<string, { messages: Message[]; unread: number }>();

        // Process inbox messages (other person is the sender)
        for (const msg of inboxMessages) {
            const pid = msg.sender_id;
            if (!convMap.has(pid)) convMap.set(pid, { messages: [], unread: 0 });
            const entry = convMap.get(pid)!;
            entry.messages.push(msg);
            if (!msg.is_read) entry.unread++;
        }

        // Process sent messages (other person is the recipient)
        for (const msg of sentMessages) {
            const pid = msg.recipient_id || "";
            if (!pid) continue;
            if (!convMap.has(pid)) convMap.set(pid, { messages: [], unread: 0 });
            convMap.get(pid)!.messages.push(msg);
        }

        // Build conversation list sorted by latest message
        const convList: Conversation[] = [];
        for (const [pid, data] of convMap.entries()) {
            // Sort messages by time to find the latest
            data.messages.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
            convList.push({
                participantId: pid,
                participantName: pid.slice(0, 8), // fallback, will be overridden if we have user data
                lastMessage: data.messages[0],
                unreadCount: data.unread,
            });
        }

        convList.sort((a, b) => new Date(b.lastMessage.sent_at).getTime() - new Date(a.lastMessage.sent_at).getTime());
        return convList;
    }, [inboxMessages, sentMessages, user]);

    // Get messages for selected conversation (all messages between current user and selected participant)
    const conversationMessages = useMemo(() => {
        if (!selectedParticipantId || !user) return [];
        const all = [...inboxMessages, ...sentMessages].filter(
            (msg) =>
                (msg.sender_id === selectedParticipantId && msg.recipient_id === user.id) ||
                (msg.sender_id === user.id && msg.recipient_id === selectedParticipantId)
        );
        all.sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
        return all;
    }, [selectedParticipantId, inboxMessages, sentMessages, user]);

    const selectedConversation = conversations.find((c) => c.participantId === selectedParticipantId);

    // Filter conversations by search
    const filteredConversations = conversations.filter((conv) =>
        conv.participantId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [conversationMessages]);

    // Mark unread messages as read when opening a conversation
    const markReadMutation = useMutation({
        mutationFn: (messageId: string) => apiClient.markMessageAsRead(messageId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["messages"] });
        },
    });

    useEffect(() => {
        if (!selectedParticipantId || !user) return;
        // Mark all unread inbox messages from this participant as read
        const unreadFromParticipant = inboxMessages.filter(
            (msg) => msg.sender_id === selectedParticipantId && !msg.is_read
        );
        for (const msg of unreadFromParticipant) {
            markReadMutation.mutate(msg.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedParticipantId]);

    // Send message mutation
    const sendMutation = useMutation({
        mutationFn: (data: { recipient_id: string; content: string }) =>
            apiClient.sendMessage(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["messages"] });
            setMessageInput("");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to send message");
        },
    });

    const handleSendMessage = () => {
        if (!messageInput.trim() || !selectedParticipantId) return;
        sendMutation.mutate({
            recipient_id: selectedParticipantId,
            content: messageInput.trim(),
        });
    };

    const handleNewMessage = () => {
        if (!newMessageRecipient.trim() || !newMessageContent.trim()) return;
        sendMutation.mutate(
            {
                recipient_id: newMessageRecipient.trim(),
                content: newMessageContent.trim(),
            },
            {
                onSuccess: () => {
                    setNewMessageOpen(false);
                    setNewMessageRecipient("");
                    setNewMessageContent("");
                    setSelectedParticipantId(newMessageRecipient.trim());
                    toast.success("Message sent");
                },
            }
        );
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (inboxLoading) {
        return (
            <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-8rem)]">
            <Card className="h-full">
                <div className="flex h-full">
                    {/* Conversations Sidebar */}
                    <div className="w-80 border-r flex flex-col">
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">Messages</h2>
                                <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>New Message</DialogTitle>
                                            <DialogDescription>
                                                Send a message to a team member
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 pt-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="recipient">Recipient User ID</Label>
                                                <Input
                                                    id="recipient"
                                                    placeholder="Enter recipient user ID..."
                                                    value={newMessageRecipient}
                                                    onChange={(e) => setNewMessageRecipient(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="message">Message</Label>
                                                <Input
                                                    id="message"
                                                    placeholder="Type your message..."
                                                    value={newMessageContent}
                                                    onChange={(e) => setNewMessageContent(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            handleNewMessage();
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="flex justify-end">
                                                <Button
                                                    onClick={handleNewMessage}
                                                    disabled={!newMessageRecipient.trim() || !newMessageContent.trim() || sendMutation.isPending}
                                                >
                                                    {sendMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Send Message
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search conversations..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-2">
                                {filteredConversations.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">No conversations yet</p>
                                        <p className="text-xs text-muted-foreground mt-1">Start a new message to begin</p>
                                    </div>
                                ) : (
                                    filteredConversations.map((conv) => (
                                        <button
                                            key={conv.participantId}
                                            onClick={() => setSelectedParticipantId(conv.participantId)}
                                            className={cn(
                                                "w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left",
                                                selectedParticipantId === conv.participantId
                                                    ? "bg-accent"
                                                    : "hover:bg-accent/50"
                                            )}
                                        >
                                            <Avatar>
                                                <AvatarFallback>
                                                    {getInitials(conv.participantId.slice(0, 8))}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium truncate text-sm">
                                                        {conv.participantId.slice(0, 8)}...
                                                    </p>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatRelativeTime(new Date(conv.lastMessage.sent_at))}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {conv.lastMessage.content}
                                                    </p>
                                                    {conv.unreadCount > 0 && (
                                                        <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1">
                                                            {conv.unreadCount}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Chat Area */}
                    {selectedConversation ? (
                        <div className="flex-1 flex flex-col">
                            {/* Chat Header */}
                            <div className="p-4 border-b flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback>
                                            {getInitials(selectedConversation.participantId.slice(0, 8))}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{selectedConversation.participantId.slice(0, 8)}...</p>
                                        <p className="text-xs text-muted-foreground">
                                            {unreadData?.unread_count ?? 0} total unread
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon">
                                        <Phone className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon">
                                        <Video className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon">
                                        <Info className="h-4 w-4" />
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                                            <DropdownMenuItem>Mute Conversation</DropdownMenuItem>
                                            <DropdownMenuItem>Search Messages</DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive">
                                                Delete Conversation
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* Messages */}
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-4">
                                    {conversationMessages.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                                        </div>
                                    ) : (
                                        conversationMessages.map((message) => {
                                            const isCurrentUser = message.sender_id === user?.id;
                                            return (
                                                <div
                                                    key={message.id}
                                                    className={cn("flex", isCurrentUser ? "justify-end" : "justify-start")}
                                                >
                                                    <div
                                                        className={cn(
                                                            "max-w-[70%] rounded-lg px-4 py-2",
                                                            isCurrentUser
                                                                ? "bg-primary text-primary-foreground"
                                                                : "bg-muted"
                                                        )}
                                                    >
                                                        <p className="text-sm">{message.content}</p>
                                                        <div
                                                            className={cn(
                                                                "flex items-center justify-end gap-1 mt-1",
                                                                isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                                                            )}
                                                        >
                                                            <span className="text-xs">
                                                                {new Date(message.sent_at).toLocaleTimeString([], {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </span>
                                                            {isCurrentUser && (
                                                                message.is_read ? (
                                                                    <CheckCheck className="h-3 w-3" />
                                                                ) : (
                                                                    <Check className="h-3 w-3" />
                                                                )
                                                            )}
                                                        </div>
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
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon">
                                        <Paperclip className="h-4 w-4" />
                                    </Button>
                                    <Input
                                        placeholder="Type a message..."
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        className="flex-1"
                                    />
                                    <Button variant="ghost" size="icon">
                                        <Smile className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        onClick={handleSendMessage}
                                        disabled={!messageInput.trim() || sendMutation.isPending}
                                    >
                                        {sendMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-lg font-medium">Select a conversation</p>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Choose a conversation from the sidebar or start a new one
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
