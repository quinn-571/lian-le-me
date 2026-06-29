import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_SETTINGS } from '../utils/constants'

export interface UserSettings {
  gender: 'male' | 'female'
  cardioFreq: number
  strengthFreq: number
  exerciseFreqs: Record<string, number>
  hairWashInterval: number  // 每隔N天洗头
  lastHairWashDate: string  // 上次洗头日期
  lastPeriodDate: string
  periodDuration: number
  periodCycle: number
  onboardingComplete: boolean
}

interface SettingsState extends UserSettings {
  setGender: (gender: 'male' | 'female') => void
  setCardioFreq: (n: number) => void
  setStrengthFreq: (n: number) => void
  setExerciseFreq: (exerciseId: string, n: number) => void
  setHairWashInterval: (n: number) => void
  setLastHairWashDate: (d: string) => void
  setPeriodInfo: (lastDate: string, duration: number, cycle: number) => void
  setOnboardingComplete: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      onboardingComplete: false,

      setGender: (gender) => set({ gender }),
      setCardioFreq: (n) => set({ cardioFreq: n }),
      setStrengthFreq: (n) => set({ strengthFreq: n }),
      setExerciseFreq: (exerciseId, n) =>
        set((state) => ({
          exerciseFreqs: { ...state.exerciseFreqs, [exerciseId]: n },
        })),
      setHairWashInterval: (n) => set({ hairWashInterval: n }),
      setLastHairWashDate: (d) => set({ lastHairWashDate: d }),
      setPeriodInfo: (lastDate, duration, cycle) =>
        set({ lastPeriodDate: lastDate, periodDuration: duration, periodCycle: cycle }),
      setOnboardingComplete: () => set({ onboardingComplete: true }),
    }),
    { name: 'lian-le-me-settings' }
  )
)
