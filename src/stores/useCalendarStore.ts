import { create } from 'zustand'

export type ViewMode = 'month' | 'week' | 'day'

interface CalendarState {
  currentDate: Date
  viewMode: ViewMode
  setCurrentDate: (date: Date) => void
  setViewMode: (mode: ViewMode) => void
  goToToday: () => void
  goToPrevMonth: () => void
  goToNextMonth: () => void
  goToPrevWeek: () => void
  goToNextWeek: () => void
  goToPrevDay: () => void
  goToNextDay: () => void
}

export const useCalendarStore = create<CalendarState>()((set) => ({
  currentDate: new Date(),
  viewMode: 'week',

  setCurrentDate: (date) => set({ currentDate: date }),
  setViewMode: (mode) => set({ viewMode: mode }),

  goToToday: () => set({ currentDate: new Date() }),

  goToPrevMonth: () =>
    set((state) => {
      const d = new Date(state.currentDate)
      d.setMonth(d.getMonth() - 1)
      return { currentDate: d }
    }),

  goToNextMonth: () =>
    set((state) => {
      const d = new Date(state.currentDate)
      d.setMonth(d.getMonth() + 1)
      return { currentDate: d }
    }),

  goToPrevWeek: () =>
    set((state) => {
      const d = new Date(state.currentDate)
      d.setDate(d.getDate() - 7)
      return { currentDate: d }
    }),

  goToNextWeek: () =>
    set((state) => {
      const d = new Date(state.currentDate)
      d.setDate(d.getDate() + 7)
      return { currentDate: d }
    }),

  goToPrevDay: () =>
    set((state) => {
      const d = new Date(state.currentDate)
      d.setDate(d.getDate() - 1)
      return { currentDate: d }
    }),

  goToNextDay: () =>
    set((state) => {
      const d = new Date(state.currentDate)
      d.setDate(d.getDate() + 1)
      return { currentDate: d }
    }),
}))
