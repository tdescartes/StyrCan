import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileQuestion className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Page Not Found</h1>
            <p className="text-center text-muted-foreground max-w-md">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <Link href="/">
                <Button>Back to Dashboard</Button>
            </Link>
        </div>
    );
}
