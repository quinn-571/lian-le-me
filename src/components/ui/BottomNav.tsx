import { Calendar, Settings } from 'lucide-react'

interface BottomNavProps {
  activeTab: 'calendar' | 'settings'
  onTabChange: (tab: 'calendar' | 'settings') => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-16 px-4 safe-area-bottom"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <button
        onClick={() => onTabChange('calendar')}
        className="flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors"
        style={{
          color: activeTab === 'calendar' ? 'var(--color-primary)' : 'var(--color-text-light)',
        }}
      >
        <Calendar size={24} />
        <span className="text-sm font-medium">日历</span>
      </button>
      <button
        onClick={() => onTabChange('settings')}
        className="flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors"
        style={{
          color: activeTab === 'settings' ? 'var(--color-primary)' : 'var(--color-text-light)',
        }}
      >
        <Settings size={24} />
        <span className="text-sm font-medium">设置</span>
      </button>
    </nav>
  )
}
