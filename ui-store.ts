import { create } from "zustand";

interface UIState {
  editPostId: string | null;
  openEditModal: (id: string | null) => void;
  calendarView: "week" | "month";
  setCalendarView: (view: "week" | "month") => void;
}

export const useUIStore = create<UIState>((set) => ({
  editPostId: null,
  openEditModal: (id) => set({ editPostId: id }),
  calendarView: "week",
  setCalendarView: (view) => set({ calendarView: view }),
}));
