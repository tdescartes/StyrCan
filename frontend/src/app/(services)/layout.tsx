import { ServiceHeader } from "@/components/layout/service-header";

interface ServicesLayoutProps {
    children: React.ReactNode;
}

export default function ServicesLayout({ children }: ServicesLayoutProps) {
    return (
        <>
            <ServiceHeader />
            {children}
        </>
    );
}
