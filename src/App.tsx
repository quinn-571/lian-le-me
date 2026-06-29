import { useState, useEffect } from 'react'
import { BottomNav } from './components/ui/BottomNav'
import { CalendarPage } from './components/calendar/CalendarPage'
import { SettingsPage } from './components/settings/SettingsPage'
import { useThemeStore } from './stores/useThemeStore'
import { useScheduleStore } from './stores/useScheduleStore'

type Tab = 'calendar' | 'settings'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('calendar')
  const { theme } = useThemeStore()
  const initialize = useScheduleStore((s) => s.initialize)
  const regenerateSchedules = useScheduleStore((s) => s.regenerateSchedules)
  const loading = useScheduleStore((s) => s.loading)

  // 启动时初始化主题 + 数据库
  useEffect(() => {
    if (theme !== 'orange') {
      document.documentElement.setAttribute('data-theme', theme)
    }
    initialize()
  }, [])

  // 初始化完成后，自动生成课表（如果还没有）
  useEffect(() => {
    if (!loading) {
      regenerateSchedules()
    }
  }, [loading])

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* 页面内容 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'calendar' ? <CalendarPage /> : <SettingsPage />}
      </div>

      {/* 底部导航 */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default App
