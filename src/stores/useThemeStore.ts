import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeId = 'orange' | 'ocean' | 'forest' | 'berry' | 'sakura'

interface ThemeState {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'orange',
      setTheme: (theme: ThemeId) => {
        set({ theme })
        document.documentElement.setAttribute('data-theme', theme === 'orange' ? '' : theme)
        // 移除所有 data-theme，再设置新的
        document.documentElement.removeAttribute('data-theme')
        if (theme !== 'orange') {
          document.documentElement.setAttribute('data-theme', theme)
        }
      },
    }),
    { name: 'lian-le-me-theme' }
  )
)
