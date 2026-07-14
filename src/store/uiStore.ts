import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UIState {
  systemName: string;
  systemLogo: string | null;
  isSidebarCollapsed: boolean;
  setSystemName: (name: string) => void;
  setSystemLogo: (logo: string | null) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      systemName: "WAREHOUSE MANAGEMENT",
      systemLogo: null,
      isSidebarCollapsed: false,
      setSystemName: (name) => set({ systemName: name }),
      setSystemLogo: (logo) => set({ systemLogo: logo }),
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
    }),
    {
      name: "uiStore",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
