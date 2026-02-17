"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    MessageSquare,
    Search,
    Loader2,
    Send,
    Clock,
    CheckCheck,
    ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, getInitials, formatRelativeTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import type { Message } from "@/types";

interface ThreadGroup {
    thread_id: string;
    subject: string;
    participants: string[];
    messages: Message[];
    lastMessage: Message;
    unreadCount: number;
}

export default function ThreadsPage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [reply, setReply] = useState("");

    // Fetch inbox + sent messages
    const { data: inbox, isLoading: loadingInbox } = useQuery<Message[]>({
        queryKey: ["inbox"],
        queryFn: () => apiClient.getInbox({ limit: 200 }) as any,
        refetchInterval: 15000,
    });

    const { data: sent, isLoading: loadingSent } = useQuery<Message[]>({
        queryKey: ["sent-messages"],
        queryFn: () => apiClient.getSentMessages({ limit: 200 }) as any,
        refetchInterval: 15000,
    });

    const { data: empData } = useQuery({
        queryKey: ["employees-list"],
        queryFn: () => apiClient.getEmployees({ limit: 200 }),
    });
    const employees = empData?.employees ?? [];
    const empMap = new Map(employees.map((e) => [e.id, `${e.first_name} ${e.last_name}`]));
    const empByUserId = new Map(employees.filter(e => e.user_id).map((e) => [e.user_id!, `${e.first_name} ${e.last_name}`]));

    const getName = (id: string) => empMap.get(id) || empByUserId.get(id) || id.slice(0, 8);

    const isLoading = loadingInbox || loadingSent;

    // Group messages by thread_id
    const threads: ThreadGroup[] = useMemo(() => {
        const all = [...(inbox ?? []), ...(sent ?? [])];
        const grouped = new Map<string, Message[]>();

        for (const msg of all) {
            const tid = msg.thread_id || msg.id;
            if (!grouped.has(tid)) grouped.set(tid, []);
            // Avoid duplicates
            const existing = grouped.get(tid)!;
            if (!existing.find((m) => m.id === msg.id)) {
                existing.push(msg);
            }
        }

        return Array.from(grouped.entries())
            .filter(([_, msgs]) => msgs.length > 0)
            .map(([id, msgs]) => {
                msgs.sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
                const last = msgs[msgs.length - 1];
                const participants = [...new Set(msgs.flatMap((m) => [m.sender_id, m.recipient_id].filter(Boolean))) as Set<string>];
                const unread = msgs.filter((m) => m.recipient_id === user?.id && !m.is_read).length;
                return {
                    thread_id: id,
                    subject: msgs.find((m) => m.subject)?.subject || "No Subject",
                    participants: participants as string[],
                    messages: msgs,
                    lastMessage: last,
                    unreadCount: unread,
                };
            })
            .sort((a, b) => new Date(b.lastMessage.sent_at).getTime() - new Date(a.lastMessage.sent_at).getTime());
    }, [inbox, sent, user?.id]);

    const filteredThreads = search
        ? threads.filter((t) =>
            t.subject.toLowerCase().includes(search.toLowerCase()) ||
            t.messages.some((m) => m.content?.toLowerCase().includes(search.toLowerCase())) ||
            t.participants.some((p) => getName(p).toLowerCase().includes(search.toLowerCase()))
        )
        : threads;

    const activeThread = threads.find((t) => t.thread_id === activeThreadId);

    // Send reply
    const sendReplyMut = useMutation({
        mutationFn: () => {
            const otherParticipant = activeThread?.participants.find((p) => p !== user?.id);
            return apiClient.sendMessage({
                recipient_id: otherParticipant,
                content: reply,
                thread_id: activeThreadId!,
            });
        },
        onSuccess: () => {
            setReply("");
            queryClient.invalidateQueries({ queryKey: ["inbox"] });
            queryClient.invalidateQueries({ queryKey: ["sent-messages"] });
        },
        onError: (err: any) => toast.error(err.message || "Failed to send"),
    });

    // Mark messages as read when viewing thread
    const markRead = (msgs: Message[]) => {
        msgs
            .filter((m) => m.recipient_id === user?.id && !m.is_read)
            .forEach((m) => apiClient.markMessageAsRead(m.id));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-4">
            {/* Thread List */}
            <div className={cn("w-96 flex flex-col border rounded-lg", activeThread && "hidden md:flex")}>
                <div className="p-3 border-b space-y-2">
                    <h2 className="font-semibold text-lg">Threads</h2>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search threads..."
                            className="pl-8 h-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    {filteredThreads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
                            <p className="text-sm text-muted-foreground">No threads found</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Start a conversation from the Inbox
                            </p>
                        </div>
                    ) : (
                        filteredThreads.map((thread) => (
                            <button
                                key={thread.thread_id}
                                className={cn(
                                    "w-full text-left p-3 border-b hover:bg-muted/50 transition-colors",
                                    activeThreadId === thread.thread_id && "bg-muted"
                                )}
                                onClick={() => {
                                    setActiveThreadId(thread.thread_id);
                                    markRead(thread.messages);
                                }}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={cn("text-sm font-medium truncate", thread.unreadCount > 0 && "font-bold")}>
                                                {thread.subject}
                                            </p>
                                            {thread.unreadCount > 0 && (
                                                <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                                                    {thread.unreadCount}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                            {thread.participants.filter(p => p !== user?.id).map(getName).join(", ") || "You"}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                            {thread.lastMessage.content?.slice(0, 60)}
                                            {(thread.lastMessage.content?.length ?? 0) > 60 ? "..." : ""}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {formatRelativeTime(thread.lastMessage.sent_at)}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {thread.messages.length} msg{thread.messages.length !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </ScrollArea>
            </div>

            {/* Thread Detail */}
            <div className={cn("flex-1 flex flex-col border rounded-lg", !activeThread && "hidden md:flex")}>
                {!activeThread ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">Select a Thread</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Choose a thread from the list to view the conversation
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Thread Header */}
                        <div className="p-4 border-b flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden"
                                onClick={() => setActiveThreadId(null)}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex-1">
                                <h3 className="font-semibold">{activeThread.subject}</h3>
                                <p className="text-xs text-muted-foreground">
                                    {activeThread.participants.map(getName).join(", ")} &middot;{" "}
                                    {activeThread.messages.length} messages
                                </p>
                            </div>
                        </div>

                        {/* Messages */}
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4">
                                {activeThread.messages.map((msg) => {
                                    const isMe = msg.sender_id === user?.id;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={cn("flex gap-3", isMe && "flex-row-reverse")}
                                        >
                                            <Avatar className="h-8 w-8 shrink-0">
                                                <AvatarFallback className="text-xs">
                                                    {getInitials(getName(msg.sender_id))}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className={cn("max-w-[70%]", isMe && "text-right")}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-medium">
                                                        {isMe ? "You" : getName(msg.sender_id)}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {formatRelativeTime(msg.sent_at)}
                                                    </span>
                                                </div>
                                                <div
                                                    className={cn(
                                                        "rounded-lg px-3 py-2 text-sm inline-block text-left",
                                                        isMe
                                                            ? "bg-primary text-primary-foreground"
                                                            : "bg-muted"
                                                    )}
                                                >
                                                    {msg.content}
                                                </div>
                                                {isMe && (
                                                    <div className="flex items-center justify-end gap-1 mt-0.5">
                                                        {msg.is_read ? (
                                                            <CheckCheck className="h-3 w-3 text-blue-500" />
                                                        ) : (
                                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>

                        {/* Reply */}
                        <div className="p-3 border-t">
                            <form
                                className="flex gap-2"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (reply.trim()) sendReplyMut.mutate();
                                }}
                            >
                                <Textarea
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    placeholder="Type a reply..."
                                    className="min-h-[40px] max-h-[120px] resize-none"
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            if (reply.trim()) sendReplyMut.mutate();
                                        }
                                    }}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={!reply.trim() || sendReplyMut.isPending}
                                >
                                    {sendReplyMut.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
