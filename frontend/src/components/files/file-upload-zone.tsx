/**
 * File upload components for drag-and-drop file uploads
 */

"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface FileWithProgress {
    file: File
    progress: number
    status: "pending" | "uploading" | "success" | "error"
    error?: string
    url?: string
}

interface FileUploadZoneProps {
    onUpload: (files: File[]) => Promise<void>
    maxFiles?: number
    maxSize?: number // in MB
    acceptedTypes?: string[]
    className?: string
    folder?: string
}

export function FileUploadZone({
    onUpload,
    maxFiles = 10,
    maxSize = 10,
    acceptedTypes = [
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".txt",
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".csv",
    ],
    className,
    folder = "general",
}: FileUploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [files, setFiles] = useState<FileWithProgress[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const validateFile = (file: File): string | null => {
        // Check file size
        const fileSizeMB = file.size / (1024 * 1024)
        if (fileSizeMB > maxSize) {
            return `File size exceeds ${maxSize}MB`
        }

        // Check file type
        const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`
        if (!acceptedTypes.includes(fileExtension)) {
            return `File type ${fileExtension} not allowed`
        }

        return null
    }

    const handleFiles = useCallback(
        (newFiles: FileList | null) => {
            if (!newFiles || newFiles.length === 0) return

            const fileArray = Array.from(newFiles)

            // Check max files limit
            if (files.length + fileArray.length > maxFiles) {
                alert(`Maximum ${maxFiles} files allowed`)
                return
            }

            // Validate and prepare files
            const validatedFiles: FileWithProgress[] = fileArray.map((file) => {
                const error = validateFile(file)
                return {
                    file,
                    progress: 0,
                    status: error ? "error" : "pending",
                    error: error || undefined,
                } as FileWithProgress
            })

            setFiles((prev) => [...prev, ...validatedFiles])
        },
        [files.length, maxFiles, maxSize, acceptedTypes]
    )

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setIsDragging(false)
            handleFiles(e.dataTransfer.files)
        },
        [handleFiles]
    )

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            handleFiles(e.target.files)
            // Reset input so same file can be selected again
            e.target.value = ""
        },
        [handleFiles]
    )

    const removeFile = useCallback((index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index))
    }, [])

    const uploadFiles = async () => {
        const pendingFiles = files.filter((f) => f.status === "pending")
        if (pendingFiles.length === 0) return

        setIsUploading(true)

        try {
            // Upload files
            await onUpload(pendingFiles.map((f) => f.file))

            // Mark all as success
            setFiles((prev) =>
                prev.map((f) =>
                    f.status === "pending" ? { ...f, status: "success", progress: 100 } : f
                )
            )

            // Clear files after 2 seconds
            setTimeout(() => {
                setFiles((prev) => prev.filter((f) => f.status !== "success"))
            }, 2000)
        } catch (error) {
            // Mark files as error
            setFiles((prev) =>
                prev.map((f) =>
                    f.status === "pending"
                        ? {
                            ...f,
                            status: "error",
                            error: error instanceof Error ? error.message : "Upload failed",
                        }
                        : f
                )
            )
        } finally {
            setIsUploading(false)
        }
    }

    const pendingCount = files.filter((f) => f.status === "pending").length

    return (
        <div className={cn("w-full space-y-4", className)}>
            {/* Drop zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                    isDragging
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                )}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={acceptedTypes.join(",")}
                    onChange={handleFileInput}
                    className="hidden"
                />

                <Upload
                    className={cn(
                        "mx-auto h-12 w-12 mb-4",
                        isDragging ? "text-blue-500" : "text-gray-400"
                    )}
                />

                <p className="text-lg font-medium text-gray-900 mb-1">
                    {isDragging ? "Drop files here" : "Drag & drop files here"}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                    or click to browse from your computer
                </p>

                <p className="text-xs text-gray-400">
                    Max {maxFiles} files • {maxSize}MB per file •{" "}
                    {acceptedTypes.slice(0, 3).join(", ")}
                    {acceptedTypes.length > 3 && ` +${acceptedTypes.length - 3} more`}
                </p>
            </div>

            {/* File list */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">
                            Files ({files.length}/{maxFiles})
                        </h3>
                        {pendingCount > 0 && (
                            <Button
                                onClick={uploadFiles}
                                disabled={isUploading}
                                size="sm"
                                className="h-8"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    `Upload ${pendingCount} file${pendingCount > 1 ? "s" : ""}`
                                )}
                            </Button>
                        )}
                    </div>

                    <div className="space-y-2">
                        {files.map((fileWithProgress, index) => (
                            <FileItem
                                key={index}
                                fileWithProgress={fileWithProgress}
                                onRemove={() => removeFile(index)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

interface FileItemProps {
    fileWithProgress: FileWithProgress
    onRemove: () => void
}

function FileItem({ fileWithProgress, onRemove }: FileItemProps) {
    const { file, progress, status, error } = fileWithProgress

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
    }

    return (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
            <div className="flex-shrink-0">
                {status === "success" ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                ) : status === "error" ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                ) : status === "uploading" ? (
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                ) : (
                    <File className="h-5 w-5 text-gray-400" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>

                {status === "uploading" && (
                    <Progress value={progress} className="mt-2 h-1" />
                )}

                {status === "error" && error && (
                    <p className="text-xs text-red-500 mt-1">{error}</p>
                )}
            </div>

            {status !== "success" && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="flex-shrink-0 h-8 w-8 p-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}
