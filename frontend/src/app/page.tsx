import { redirect } from "next/navigation";

/**
 * Root page of the app.
 * Since the marketing/landing page is now hosted separately at styrcan.com,
 * this app (use.styrcan.com) redirects to the dashboard or login.
 */
export default function RootPage() {
    // Redirect to dashboard - auth middleware will redirect to login if not authenticated
    redirect("/dashboard");
}
