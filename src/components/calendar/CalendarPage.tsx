import { useState } from 'react'
import { useCalendarStore, type ViewMode } from '../../stores/useCalendarStore'
import { SegmentedControl } from '../ui/SegmentedControl'
import { MonthGrid } from './MonthGrid'
import { WeekStrip } from './WeekStrip'
import { DayCard } from './DayCard'
import { DayModal } from '../modals/DayModal'
import { TrendPage } from '../TrendPage'
import { formatMonthTitle, formatWeekTitle, formatDate } from '../../utils/calendar'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'month', label: '月' },
  { value: 'week', label: '周' },
  { value: 'day', label: '日' },
]

export function CalendarPage() {
  const {
    currentDate,
    viewMode,
    setViewMode,
    goToPrevMonth,
    goToNextMonth,
    goToPrevWeek,
    goToNextWeek,
    goToPrevDay,
    goToNextDay,
    goToToday,
  } = useCalendarStore()

  const [modalDate, setModalDate] = useState<Date | null>(null)
  const [quickAdd, setQuickAdd] = useState(false)
  const [showTrend, setShowTrend] = useState(false)

  const isToday = formatDate(currentDate) === formatDate(new Date())

  const handlePrev = () => {
    if (viewMode === 'month') goToPrevMonth()
    else if (viewMode === 'week') goToPrevWeek()
    else goToPrevDay()
  }

  const handleNext = () => {
    if (viewMode === 'month') goToNextMonth()
    else if (viewMode === 'week') goToNextWeek()
    else goToNextDay()
  }

  const title =
    viewMode === 'month'
      ? formatMonthTitle(currentDate)
      : viewMode === 'week'
        ? formatWeekTitle(currentDate)
        : formatDate(currentDate)

  const handleDateClick = (date: Date) => {
    setModalDate(date)
  }

  return (
    <div className="flex flex-col h-full pb-16">
      {/* 头部 */}
      <div
        className="sticky top-0 z-10 px-4 pt-4 pb-2"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-10" />
          <SegmentedControl options={VIEW_OPTIONS} value={viewMode} onChange={setViewMode} />
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full"
            style={{ color: 'var(--color-primary)' }}
            title="趋势图"
            onClick={() => setShowTrend(true)}
          >
            📈
          </button>
        </div>

        <div className="flex items-center justify-between px-2">
          <button
            onClick={handlePrev}
            className="p-1 rounded-full hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text)' }}
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={goToToday}
            className="flex flex-col items-center"
            style={{ color: 'var(--color-text)' }}
          >
            <span className="text-lg font-bold">{title}</span>
            {!isToday && (
              <span
                className="text-xs mt-0.5 px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              >
                回今天
              </span>
            )}
          </button>

          <button
            onClick={handleNext}
            className="p-1 rounded-full hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text)' }}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* 日历内容 */}
      <div className="flex-1 overflow-auto px-2">
        {viewMode === 'month' && <MonthGrid onDateClick={handleDateClick} />}
        {viewMode === 'week' && <WeekStrip />}
        {viewMode === 'day' && <DayCard onDateClick={() => setModalDate(currentDate)} />}
      </div>

      {/* 浮动添加按钮 — 快速给今天加项目 */}
      <button
        onClick={() => setQuickAdd(true)}
        className="fixed right-5 bottom-20 w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg z-40"
        style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
      >
        +
      </button>

      {/* DayModal */}
      {modalDate && (
        <DayModal date={modalDate} onClose={() => setModalDate(null)} />
      )}

      {/* 快速添加弹窗 */}
      {quickAdd && (
        <DayModal date={new Date()} onClose={() => setQuickAdd(false)} />
      )}

      {/* 趋势图 */}
      {showTrend && <TrendPage onClose={() => setShowTrend(false)} />}
    </div>
  )
}
