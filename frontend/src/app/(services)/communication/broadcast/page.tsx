"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Megaphone,
    Send,
    Users,
    Loader2,
    CheckCircle,
    AlertCircle,
    Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
import type { Employee } from "@/types";

export default function BroadcastPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [targetFilter, setTargetFilter] = useState("all");
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
    const [sentCount, setSentCount] = useState(0);

    // Fetch employees
    const { data: empData } = useQuery({
        queryKey: ["employees", "all"],
        queryFn: () => apiClient.getEmployees({ limit: 200 }),
    });
    const employees: Employee[] = empData?.employees ?? [];

    // Get unique departments
    const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));

    // Filter employees based on target
    const filteredEmployees =
        targetFilter === "all"
            ? employees
            : targetFilter === "selected"
                ? employees
                : employees.filter((e) => e.department === targetFilter);

    // Determine recipients
    const recipients =
        targetFilter === "selected"
            ? employees.filter((e) => selectedEmployees.includes(e.id))
            : filteredEmployees;

    // Fetch recent sent messages for broadcast history
    const { data: sentData } = useQuery({
        queryKey: ["sent-messages"],
        queryFn: async () => {
            const res = await apiClient.getSentMessages({ limit: 20 });
            return res as { messages: Array<{ subject?: string; created_at: string }> };
        },
    });
    const sentMessages = sentData?.messages ?? [];
    // Group sent messages by subject as "broadcasts"
    const broadcastHistory = sentMessages.reduce<
        Record<string, { subject: string; sentAt: string; count: number }>
    >((acc, msg) => {
        const subj = msg.subject || "(No subject)";
        if (!acc[subj]) {
            acc[subj] = { subject: subj, sentAt: msg.created_at, count: 0 };
        }
        acc[subj].count += 1;
        return acc;
    }, {});

    const toggleEmployee = (id: string) => {
        setSelectedEmployees((prev) =>
            prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        setSelectedEmployees(filteredEmployees.map((e) => e.id));
    };

    const deselectAll = () => {
        setSelectedEmployees([]);
    };

    // Send broadcast
    const handleSend = async () => {
        if (!subject.trim() || !body.trim()) {
            toast({ variant: "destructive", title: "Please fill in subject and message body" });
            return;
        }
        if (recipients.length === 0) {
            toast({ variant: "destructive", title: "No recipients selected" });
            return;
        }

        setSendStatus("sending");
        setSentCount(0);

        try {
            for (const emp of recipients) {
                await apiClient.sendMessage({
                    recipient_id: emp.user_id || emp.id,
                    subject: `[Broadcast] ${subject}`,
                    content: body,
                });
                setSentCount((c) => c + 1);
            }
            setSendStatus("done");
            toast({
                title: "Broadcast sent!",
                description: `Message sent to ${recipients.length} employee(s)`,
            });
            setSubject("");
            setBody("");
            setSelectedEmployees([]);
            queryClient.invalidateQueries({ queryKey: ["sent-messages"] });
        } catch (err) {
            setSendStatus("error");
            toast({
                variant: "destructive",
                title: "Broadcast failed",
                description: "Some messages may not have been sent",
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Broadcasts</h1>
                <p className="text-muted-foreground">
                    Send company-wide announcements and department updates
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Employees</p>
                                <p className="text-2xl font-bold">{employees.length}</p>
                            </div>
                            <Users className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Recipients</p>
                                <p className="text-2xl font-bold">{recipients.length}</p>
                            </div>
                            <Megaphone className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Broadcasts Sent</p>
                                <p className="text-2xl font-bold">
                                    {Object.keys(broadcastHistory).length}
                                </p>
                            </div>
                            <Send className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Compose Section */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Compose Broadcast</CardTitle>
                            <CardDescription>
                                Send a message to all employees, a department, or selected individuals
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Target Audience */}
                            <div className="space-y-2">
                                <Label>Audience</Label>
                                <Select value={targetFilter} onValueChange={setTargetFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select audience" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Employees</SelectItem>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept} value={dept!}>
                                                {dept}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="selected">Select Individuals</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Individual Selection */}
                            {targetFilter === "selected" && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>
                                            Select Employees ({selectedEmployees.length} selected)
                                        </Label>
                                        <div className="space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={selectAll}
                                            >
                                                All
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={deselectAll}
                                            >
                                                None
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                                        {employees.map((emp) => (
                                            <div
                                                key={emp.id}
                                                className="flex items-center gap-2 py-1 px-2 hover:bg-muted rounded"
                                            >
                                                <Checkbox
                                                    checked={selectedEmployees.includes(emp.id)}
                                                    onCheckedChange={() => toggleEmployee(emp.id)}
                                                />
                                                <span className="text-sm">
                                                    {emp.first_name} {emp.last_name}
                                                </span>
                                                <span className="text-xs text-muted-foreground ml-auto">
                                                    {emp.department}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Subject */}
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    placeholder="Announcement subject..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>

                            {/* Message body */}
                            <div className="space-y-2">
                                <Label htmlFor="body">Message</Label>
                                <Textarea
                                    id="body"
                                    placeholder="Write your announcement here..."
                                    rows={6}
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                />
                            </div>

                            {/* Send Progress */}
                            {sendStatus === "sending" && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Sending to {sentCount}/{recipients.length} recipients...
                                </div>
                            )}
                            {sendStatus === "done" && (
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    Broadcast sent successfully!
                                </div>
                            )}
                            {sendStatus === "error" && (
                                <div className="flex items-center gap-2 text-sm text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    Some messages failed to send
                                </div>
                            )}

                            <Button
                                className="w-full"
                                onClick={handleSend}
                                disabled={
                                    sendStatus === "sending" ||
                                    !subject.trim() ||
                                    !body.trim() ||
                                    recipients.length === 0
                                }
                            >
                                {sendStatus === "sending" ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Send to {recipients.length} Recipient
                                        {recipients.length !== 1 ? "s" : ""}
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Broadcasts */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Recent Broadcasts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {Object.keys(broadcastHistory).length === 0 ? (
                                <div className="text-center py-8">
                                    <Megaphone className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        No broadcasts sent yet
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {Object.values(broadcastHistory)
                                        .sort(
                                            (a, b) =>
                                                new Date(b.sentAt).getTime() -
                                                new Date(a.sentAt).getTime()
                                        )
                                        .slice(0, 10)
                                        .map((b, i) => (
                                            <div
                                                key={i}
                                                className="border rounded-md p-3 space-y-1"
                                            >
                                                <p className="text-sm font-medium truncate">
                                                    {b.subject}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDate(b.sentAt)}
                                                    <Badge variant="secondary" className="ml-auto">
                                                        {b.count} sent
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
