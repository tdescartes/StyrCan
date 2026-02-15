import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, Company } from "@/types";
import { apiClient } from "@/lib/api/client";

interface AuthState {
    user: User | null;
    company: Company | null;
    isAuthenticated: boolean;
    hasHydrated: boolean; // Track if state has loaded from localStorage
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (data: {
        name: string;  // company name
        email: string; // company email
        admin_first_name: string;
        admin_last_name: string;
        admin_email: string;
        admin_password: string;
        phone?: string;
        address?: string;
        tax_id?: string;
    }) => Promise<void>;
    setUser: (user: User | null) => void;
    setCompany: (company: Company | null) => void;
    setHasHydrated: (val: boolean) => void;
    validateCompanyContext: () => boolean;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            company: null,
            isAuthenticated: false,
            hasHydrated: false,

            login: async (email: string, password: string) => {
                const response = await apiClient.login({ email, password });

                // Store tokens in localStorage
                if (typeof window !== 'undefined') {
                    localStorage.setItem('access_token', response.access_token);
                    localStorage.setItem('refresh_token', response.refresh_token);
                }

                set({
                    user: response.user,
                    company: response.company,
                    isAuthenticated: true
                });
            },

            logout: async () => {
                try {
                    await apiClient.logout();
                } catch {
                    // Continue with logout even if API call fails
                }

                // Clear tokens from localStorage
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                }

                set({ user: null, company: null, isAuthenticated: false });
            },

            register: async (data) => {
                const response = await apiClient.register(data);

                // Store tokens in localStorage
                if (typeof window !== 'undefined') {
                    localStorage.setItem('access_token', response.access_token);
                    localStorage.setItem('refresh_token', response.refresh_token);
                }

                set({
                    user: response.user,
                    company: response.company,
                    isAuthenticated: true
                });
            },

            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setCompany: (company) => set({ company }),

            setHasHydrated: (val: boolean) => set({ hasHydrated: val }),

            validateCompanyContext: () => {
                const state = useAuthStore.getState();

                // Must have both user and company
                if (!state.user || !state.company) {
                    return false;
                }

                // User must belong to the loaded company
                if (state.user.company_id !== state.company.id) {
                    console.error("❌ Company context mismatch detected!", {
                        userCompanyId: state.user.company_id,
                        loadedCompanyId: state.company.id
                    });

                    // Force logout on mismatch (security breach)
                    state.clearAuth();

                    if (typeof window !== 'undefined') {
                        window.location.href = '/login?error=company_mismatch';
                    }

                    return false;
                }

                return true;
            },

            clearAuth: () => {
                // Clear tokens from localStorage
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                }

                set({ user: null, company: null, isAuthenticated: false });
            },
        }),
        {
            name: "auth-storage",
            onRehydrateStorage: () => (state) => {
                // Mark as hydrated after loading from localStorage
                if (state) {
                    state.setHasHydrated(true);

                    // Validate company context on hydration
                    if (state.user && state.company) {
                        state.validateCompanyContext();
                    }
                }
            },
        }
    )
);
