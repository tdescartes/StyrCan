"use client";

import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, getInitials, formatRelativeTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

// Mock data
const mockConversations = [
    {
        id: "1",
        participant: {
            id: "u2",
            name: "Sarah Johnson",
            avatar: "",
            role: "Software Engineer",
            online: true,
        },
        lastMessage: {
            content: "Sure, I'll review the PR this afternoon.",
            timestamp: new Date(Date.now() - 300000),
            isRead: true,
        },
        unreadCount: 0,
    },
    {
        id: "2",
        participant: {
            id: "u3",
            name: "Michael Chen",
            avatar: "",
            role: "Product Manager",
            online: true,
        },
        lastMessage: {
            content: "Can we schedule a meeting for tomorrow?",
            timestamp: new Date(Date.now() - 3600000),
            isRead: false,
        },
        unreadCount: 2,
    },
    {
        id: "3",
        participant: {
            id: "u4",
            name: "Emily Davis",
            avatar: "",
            role: "UX Designer",
            online: false,
        },
        lastMessage: {
            content: "The new designs are ready for review!",
            timestamp: new Date(Date.now() - 86400000),
            isRead: true,
        },
        unreadCount: 0,
    },
    {
        id: "4",
        participant: {
            id: "u5",
            name: "James Wilson",
            avatar: "",
            role: "Sales Representative",
            online: false,
        },
        lastMessage: {
            content: "Great news! We closed the deal with ABC Corp.",
            timestamp: new Date(Date.now() - 172800000),
            isRead: true,
        },
        unreadCount: 0,
    },
];

const mockMessages = [
    {
        id: "m1",
        senderId: "u2",
        content: "Hey! Did you get a chance to look at the latest deployment?",
        timestamp: new Date(Date.now() - 7200000),
        isRead: true,
    },
    {
        id: "m2",
        senderId: "current",
        content: "Yes, I reviewed it this morning. Looks good overall, but I found a few minor issues.",
        timestamp: new Date(Date.now() - 7000000),
        isRead: true,
    },
    {
        id: "m3",
        senderId: "u2",
        content: "Oh really? What kind of issues?",
        timestamp: new Date(Date.now() - 6800000),
        isRead: true,
    },
    {
        id: "m4",
        senderId: "current",
        content: "Mostly code style inconsistencies and a potential memory leak in the data fetching logic. I've left comments on the PR.",
        timestamp: new Date(Date.now() - 6600000),
        isRead: true,
    },
    {
        id: "m5",
        senderId: "u2",
        content: "Thanks for catching those! I'll fix them right away.",
        timestamp: new Date(Date.now() - 6400000),
        isRead: true,
    },
    {
        id: "m6",
        senderId: "current",
        content: "No problem! Let me know when you push the fixes and I'll re-review.",
        timestamp: new Date(Date.now() - 6200000),
        isRead: true,
    },
    {
        id: "m7",
        senderId: "u2",
        content: "Sure, I'll review the PR this afternoon.",
        timestamp: new Date(Date.now() - 300000),
        isRead: true,
    },
];

export default function MessagesPage() {
    const { user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
    const [messageInput, setMessageInput] = useState("");
    const [messages, setMessages] = useState(mockMessages);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Filter conversations
    const filteredConversations = mockConversations.filter((conv) =>
        conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = () => {
        if (!messageInput.trim()) return;

        const newMessage = {
            id: `m${messages.length + 1}`,
            senderId: "current",
            content: messageInput,
            timestamp: new Date(),
            isRead: false,
        };

        setMessages([...messages, newMessage]);
        setMessageInput("");
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="h-[calc(100vh-8rem)]">
            <Card className="h-full">
                <div className="flex h-full">
                    {/* Conversations Sidebar */}
                    <div className="w-80 border-r flex flex-col">
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">Messages</h2>
                                <Button variant="ghost" size="icon">
                                    <Plus className="h-4 w-4" />
                                </Button>
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
                                {filteredConversations.map((conv) => (
                                    <button
                                        key={conv.id}
                                        onClick={() => setSelectedConversation(conv)}
                                        className={cn(
                                            "w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left",
                                            selectedConversation?.id === conv.id
                                                ? "bg-accent"
                                                : "hover:bg-accent/50"
                                        )}
                                    >
                                        <div className="relative">
                                            <Avatar>
                                                <AvatarImage src={conv.participant.avatar} />
                                                <AvatarFallback>
                                                    {getInitials(conv.participant.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            {conv.participant.online && (
                                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium truncate">{conv.participant.name}</p>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatRelativeTime(conv.lastMessage.timestamp)}
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
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Chat Area */}
                    {selectedConversation ? (
                        <div className="flex-1 flex flex-col">
                            {/* Chat Header */}
                            <div className="p-4 border-b flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Avatar>
                                            <AvatarImage src={selectedConversation.participant.avatar} />
                                            <AvatarFallback>
                                                {getInitials(selectedConversation.participant.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        {selectedConversation.participant.online && (
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium">{selectedConversation.participant.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {selectedConversation.participant.online ? "Online" : "Offline"}
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
                                    {messages.map((message) => {
                                        const isCurrentUser = message.senderId === "current";
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
                                                            {message.timestamp.toLocaleTimeString([], {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </span>
                                                        {isCurrentUser && (
                                                            message.isRead ? (
                                                                <CheckCheck className="h-3 w-3" />
                                                            ) : (
                                                                <Check className="h-3 w-3" />
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
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
                                    <Button size="icon" onClick={handleSendMessage} disabled={!messageInput.trim()}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-muted-foreground">Select a conversation to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
