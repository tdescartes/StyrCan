"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Search,
    Send,
    Plus,
    Loader2,
    MessageSquare,
    Check,
    CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, getInitials, formatRelativeTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import type { Message } from "@/types";

export default function InboxPage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [reply, setReply] = useState("");
    const [isNewOpen, setIsNewOpen] = useState(false);
    const [newMsg, setNewMsg] = useState({ recipient_id: "", subject: "", content: "" });
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch inbox + sent
    const { data: inbox } = useQuery<Message[]>({
        queryKey: ["inbox"],
        queryFn: () => apiClient.getInbox({ limit: 100 }) as any,
        refetchInterval: 10000,
    });

    const { data: sent } = useQuery<Message[]>({
        queryKey: ["sent-messages"],
        queryFn: () => apiClient.getSentMessages({ limit: 100 }) as any,
        refetchInterval: 10000,
    });

    // Fetch employees for recipient picker
    const { data: empData } = useQuery({
        queryKey: ["employees-list"],
        queryFn: () => apiClient.getEmployees({ limit: 200 }),
    });
    const employees = empData?.employees ?? [];

    // Build conversations
    const conversations = useMemo(() => {
        const all = [...(inbox ?? []), ...(sent ?? [])];
        const grouped = new Map<string, Message[]>();
        for (const msg of all) {
            const otherId =
                msg.sender_id === user?.id ? msg.recipient_id : msg.sender_id;
            const key = otherId || msg.id;
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)!.push(msg);
        }
        return Array.from(grouped.entries())
            .map(([id, msgs]) => {
                msgs.sort(
                    (a, b) =>
                        new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
                );
                const last = msgs[msgs.length - 1];
                const unread = msgs.filter(
                    (m) => m.recipient_id === user?.id && !m.is_read
                ).length;
                const emp = employees.find((e) => e.id === id || e.user_id === id);
                const name = emp
                    ? `${emp.first_name} ${emp.last_name}`
                    : id?.slice(0, 8) ?? "Unknown";
                return { id, name, messages: msgs, last, unread };
            })
            .sort(
                (a, b) =>
                    new Date(b.last.sent_at).getTime() -
                    new Date(a.last.sent_at).getTime()
            );
    }, [inbox, sent, user?.id, employees]);

    const filtered = search
        ? conversations.filter(
            (c) =>
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.last.content?.toLowerCase().includes(search.toLowerCase())
        )
        : conversations;

    const active = conversations.find((c) => c.id === selectedConvId);

    // Mark as read
    useEffect(() => {
        if (!active) return;
        const unread = active.messages.filter(
            (m) => m.recipient_id === user?.id && !m.is_read
        );
        unread.forEach((m) => apiClient.markMessageAsRead(m.id));
    }, [active, user?.id]);

    // Scroll to bottom
    useEffect(() => {
        scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
    }, [active?.messages.length]);

    const sendReplyMut = useMutation({
        mutationFn: () =>
            apiClient.sendMessage({
                recipient_id: selectedConvId!,
                content: reply,
                thread_id: active?.messages[0]?.thread_id,
            }),
        onSuccess: () => {
            setReply("");
            queryClient.invalidateQueries({ queryKey: ["inbox"] });
            queryClient.invalidateQueries({ queryKey: ["sent-messages"] });
        },
        onError: (err: any) => toast.error(err.message || "Failed to send"),
    });

    const sendNewMut = useMutation({
        mutationFn: () =>
            apiClient.sendMessage({
                recipient_id: newMsg.recipient_id,
                subject: newMsg.subject || undefined,
                content: newMsg.content,
            }),
        onSuccess: () => {
            setIsNewOpen(false);
            setNewMsg({ recipient_id: "", subject: "", content: "" });
            queryClient.invalidateQueries({ queryKey: ["inbox"] });
            queryClient.invalidateQueries({ queryKey: ["sent-messages"] });
            toast.success("Message sent");
        },
        onError: (err: any) => toast.error(err.message || "Failed to send"),
    });

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-4">
            {/* Conversation List */}
            <div className="w-80 flex flex-col border rounded-lg">
                <div className="p-3 border-b space-y-2">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Inbox</h2>
                        <Button size="icon" variant="ghost" onClick={() => setIsNewOpen(true)}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            className="pl-8 h-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    {filtered.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground text-sm">
                            No conversations
                        </div>
                    ) : (
                        filtered.map((conv) => (
                            <button
                                key={conv.id}
                                className={cn(
                                    "w-full text-left px-3 py-3 border-b hover:bg-muted/50 transition-colors",
                                    selectedConvId === conv.id && "bg-muted"
                                )}
                                onClick={() => setSelectedConvId(conv.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback className="text-xs">{getInitials(conv.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-sm truncate">{conv.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatRelativeTime(conv.last.sent_at)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {conv.last.content}
                                        </p>
                                    </div>
                                    {conv.unread > 0 && (
                                        <Badge className="h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                                            {conv.unread}
                                        </Badge>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </ScrollArea>
            </div>

            {/* Message View */}
            <div className="flex-1 flex flex-col border rounded-lg">
                {!active ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                            <MessageSquare className="h-12 w-12 mx-auto mb-2" />
                            <p>Select a conversation</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-3 border-b font-semibold">{active.name}</div>
                        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                            <div className="space-y-3">
                                {active.messages.map((msg) => {
                                    const isMine = msg.sender_id === user?.id;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={cn("flex", isMine ? "justify-end" : "justify-start")}
                                        >
                                            <div
                                                className={cn(
                                                    "max-w-[70%] rounded-lg px-3 py-2 text-sm",
                                                    isMine
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted"
                                                )}
                                            >
                                                {msg.subject && (
                                                    <p className="font-semibold text-xs mb-1">{msg.subject}</p>
                                                )}
                                                <p>{msg.content}</p>
                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    <span className="text-[10px] opacity-70">
                                                        {formatRelativeTime(msg.sent_at)}
                                                    </span>
                                                    {isMine &&
                                                        (msg.is_read ? (
                                                            <CheckCheck className="h-3 w-3 opacity-70" />
                                                        ) : (
                                                            <Check className="h-3 w-3 opacity-70" />
                                                        ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                        <div className="p-3 border-t flex gap-2">
                            <Input
                                placeholder="Type a message..."
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey && reply.trim()) {
                                        e.preventDefault();
                                        sendReplyMut.mutate();
                                    }
                                }}
                            />
                            <Button
                                size="icon"
                                disabled={!reply.trim() || sendReplyMut.isPending}
                                onClick={() => sendReplyMut.mutate()}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </>
                )}
            </div>

            {/* New Message Dialog */}
            <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New Message</DialogTitle>
                        <DialogDescription>Send a direct message to an employee.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>To</Label>
                            <Select
                                value={newMsg.recipient_id}
                                onValueChange={(v) => setNewMsg({ ...newMsg, recipient_id: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select recipient..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees
                                        .filter((e) => e.user_id !== user?.id)
                                        .map((e) => (
                                            <SelectItem key={e.id} value={e.user_id || e.id}>
                                                {e.first_name} {e.last_name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Subject (optional)</Label>
                            <Input
                                value={newMsg.subject}
                                onChange={(e) => setNewMsg({ ...newMsg, subject: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Message</Label>
                            <Textarea
                                value={newMsg.content}
                                onChange={(e) => setNewMsg({ ...newMsg, content: e.target.value })}
                                rows={4}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsNewOpen(false)}>Cancel</Button>
                        <Button
                            disabled={!newMsg.recipient_id || !newMsg.content.trim() || sendNewMut.isPending}
                            onClick={() => sendNewMut.mutate()}
                        >
                            {sendNewMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
