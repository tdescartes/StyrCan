"use client";

import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    FolderOpen,
    Upload,
    Download,
    Trash2,
    File as FileIcon,
    Image,
    FileText,
    FileSpreadsheet,
    Search,
    Loader2,
    MoreHorizontal,
    HardDrive,
    Clock,
    FolderPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface FileItem {
    Key: string;
    Size: number;
    LastModified: string;
    ContentType?: string;
}

const FOLDERS = [
    { value: "_all", label: "All Files" },
    { value: "documents", label: "Documents" },
    { value: "invoices", label: "Invoices" },
    { value: "employee-docs", label: "Employee Docs" },
    { value: "reports", label: "Reports" },
];

function getFileIcon(key: string) {
    const ext = key.split(".").pop()?.toLowerCase() || "";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
        return <Image className="h-5 w-5 text-green-500" />;
    }
    if (["xls", "xlsx", "csv"].includes(ext)) {
        return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />;
    }
    if (["pdf", "doc", "docx", "txt"].includes(ext)) {
        return <FileText className="h-5 w-5 text-blue-500" />;
    }
    return <FileIcon className="h-5 w-5 text-muted-foreground" />;
}

function formatFileSize(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileName(key: string) {
    return key.split("/").pop() || key;
}

export default function FilesPage() {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentFolder, setCurrentFolder] = useState("_all");
    const [uploadFolder, setUploadFolder] = useState("documents");
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [deleteConfirmKey, setDeleteConfirmKey] = useState<string | null>(null);

    const folderParam = currentFolder === "_all" ? "" : currentFolder;

    // Fetch files
    const { data: filesData, isLoading } = useQuery<{ files: FileItem[]; count: number }>({
        queryKey: ["files", currentFolder],
        queryFn: () => apiClient.listFiles(folderParam) as any,
    });

    const files: FileItem[] = filesData?.files ?? [];

    // Upload mutation
    const uploadMutation = useMutation({
        mutationFn: async ({ files, folder }: { files: File[]; folder: string }) => {
            if (files.length === 1) {
                return apiClient.uploadFile(files[0], folder);
            }
            return apiClient.uploadMultipleFiles(files, folder);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["files"] });
            setIsUploadDialogOpen(false);
            setSelectedFiles([]);
            toast.success("Files uploaded successfully");
        },
        onError: (err: any) => {
            toast.error(err.message || "Upload failed");
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (fileKey: string) => apiClient.deleteFile(fileKey),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["files"] });
            setDeleteConfirmKey(null);
            toast.success("File deleted");
        },
        onError: (err: any) => {
            toast.error(err.message || "Delete failed");
        },
    });

    const handleDownload = async (fileKey: string) => {
        try {
            const result = await apiClient.getFileDownloadUrl(fileKey);
            window.open(result.download_url, "_blank");
        } catch (err: any) {
            toast.error(err.message || "Failed to get download URL");
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const handleUpload = () => {
        if (selectedFiles.length === 0) return;
        uploadMutation.mutate({ files: selectedFiles, folder: uploadFolder });
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) {
            setSelectedFiles(Array.from(e.dataTransfer.files));
            setIsUploadDialogOpen(true);
        }
    }, []);

    // Client-side search
    const filteredFiles = searchQuery
        ? files.filter((f) => getFileName(f.Key).toLowerCase().includes(searchQuery.toLowerCase()))
        : files;

    // Summary stats
    const totalSize = files.reduce((sum, f) => sum + f.Size, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Shared Files</h1>
                    <p className="text-muted-foreground">
                        Upload, manage, and share files with your team
                    </p>
                </div>
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Files
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Files</p>
                                <p className="text-2xl font-bold">{files.length}</p>
                            </div>
                            <FolderOpen className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Storage Used</p>
                                <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
                            </div>
                            <HardDrive className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Current Folder</p>
                                <p className="text-2xl font-bold capitalize">
                                    {currentFolder === "_all" ? "All" : currentFolder}
                                </p>
                            </div>
                            <FolderPlus className="h-8 w-8 text-amber-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search files..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={currentFolder} onValueChange={setCurrentFolder}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filter by folder" />
                            </SelectTrigger>
                            <SelectContent>
                                {FOLDERS.map((f) => (
                                    <SelectItem key={f.value} value={f.value}>
                                        {f.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* File List */}
            <Card
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
            >
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-2">No files found</p>
                            <p className="text-sm text-muted-foreground mb-4">
                                Upload files or drag and drop them here
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => setIsUploadDialogOpen(true)}
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Files
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="py-3 px-4 text-left text-sm font-medium">Name</th>
                                        <th className="py-3 px-4 text-left text-sm font-medium">Size</th>
                                        <th className="py-3 px-4 text-left text-sm font-medium">Modified</th>
                                        <th className="py-3 px-4 text-right text-sm font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFiles.map((file) => (
                                        <tr key={file.Key} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    {getFileIcon(file.Key)}
                                                    <div>
                                                        <p className="font-medium text-sm">{getFileName(file.Key)}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {file.Key.split("/").slice(0, -1).join("/")}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-muted-foreground">
                                                {formatFileSize(file.Size)}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(file.LastModified).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleDownload(file.Key)}>
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Download
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => setDeleteConfirmKey(file.Key)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Upload Dialog */}
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Files</DialogTitle>
                        <DialogDescription>
                            Select files to upload (max 10MB per file, up to 10 files)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Destination Folder</Label>
                            <Select value={uploadFolder} onValueChange={setUploadFolder}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="documents">Documents</SelectItem>
                                    <SelectItem value="invoices">Invoices</SelectItem>
                                    <SelectItem value="employee-docs">Employee Docs</SelectItem>
                                    <SelectItem value="reports">Reports</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div
                            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                                Click to browse or drag files here
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                PDF, DOC, XLS, CSV, JPG, PNG up to 10MB
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileSelect}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp,.csv"
                            />
                        </div>

                        {selectedFiles.length > 0 && (
                            <div className="space-y-2">
                                <Label>Selected Files ({selectedFiles.length})</Label>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                    {selectedFiles.map((file, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-1.5"
                                        >
                                            <span className="truncate">{file.name}</span>
                                            <span className="text-muted-foreground ml-2">
                                                {formatFileSize(file.size)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsUploadDialogOpen(false);
                                setSelectedFiles([]);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={selectedFiles.length === 0 || uploadMutation.isPending}
                        >
                            {uploadMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteConfirmKey} onOpenChange={() => setDeleteConfirmKey(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete File</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &ldquo;
                            {deleteConfirmKey ? getFileName(deleteConfirmKey) : ""}
                            &rdquo;? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmKey(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteConfirmKey && deleteMutation.mutate(deleteConfirmKey)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
