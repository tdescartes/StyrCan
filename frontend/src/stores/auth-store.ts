import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";
import { api } from "@/lib/api/client";

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (data: {
        company_name: string;
        email: string;
        password: string;
        first_name: string;
        last_name: string;
    }) => Promise<void>;
    checkAuth: () => Promise<void>;
    setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: true,

            login: async (email: string, password: string) => {
                set({ isLoading: true });
                try {
                    const tokens = await api.login({ email, password });
                    localStorage.setItem("access_token", tokens.access_token);
                    localStorage.setItem("refresh_token", tokens.refresh_token);

                    const user = await api.getCurrentUser();
                    set({ user, isAuthenticated: true, isLoading: false });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            logout: async () => {
                try {
                    await api.logout();
                } catch {
                    // Continue with logout even if API call fails
                }
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                set({ user: null, isAuthenticated: false });
            },

            register: async (data) => {
                set({ isLoading: true });
                try {
                    const result = await api.register(data);
                    localStorage.setItem("access_token", result.tokens.access_token);
                    localStorage.setItem("refresh_token", result.tokens.refresh_token);
                    set({ user: result.user, isAuthenticated: true, isLoading: false });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            checkAuth: async () => {
                const token = localStorage.getItem("access_token");
                if (!token) {
                    set({ isLoading: false, isAuthenticated: false, user: null });
                    return;
                }

                try {
                    const user = await api.getCurrentUser();
                    set({ user, isAuthenticated: true, isLoading: false });
                } catch {
                    // Token might be expired, try to refresh
                    const refreshToken = localStorage.getItem("refresh_token");
                    if (refreshToken) {
                        try {
                            const tokens = await api.refreshToken(refreshToken);
                            localStorage.setItem("access_token", tokens.access_token);
                            localStorage.setItem("refresh_token", tokens.refresh_token);

                            const user = await api.getCurrentUser();
                            set({ user, isAuthenticated: true, isLoading: false });
                        } catch {
                            get().logout();
                        }
                    } else {
                        get().logout();
                    }
                }
            },

            setUser: (user) => set({ user, isAuthenticated: !!user }),
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
