import { useMemo } from 'react'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { useScheduleStore } from '../../stores/useScheduleStore'
import { getMonthGridDates, WEEKDAY_LABELS, isSameMonth, formatDate } from '../../utils/calendar'
import { DayCell } from './DayCell'

export function MonthGrid({ onDateClick }: { onDateClick: (date: Date) => void }) {
  const { currentDate } = useCalendarStore()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const dates = getMonthGridDates(year, month)

  const futureSchedules = useScheduleStore((s) => s.futureSchedules)
  const exercises = useScheduleStore((s) => s.exercises)
  const periodDates = useScheduleStore((s) => s.periodDates)

  // 按日期分组课表
  const scheduleByDate = useMemo(() => {
    const map = new Map<string, { icon: string; name: string; type: 'cardio' | 'strength'; completed: boolean }[]>()
    for (const s of futureSchedules) {
      if (!map.has(s.date)) map.set(s.date, [])
      const ex = exercises.find((e) => e.id === s.exerciseId)
      if (ex) {
        map.get(s.date)!.push({
          icon: ex.icon,
          name: ex.name,
          type: ex.type,
          completed: s.completed,
        })
      }
    }
    return map
  }, [futureSchedules, exercises])

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={i}
            className="text-center text-sm font-medium py-1.5"
            style={{
              color: i === 0 || i === 6 ? 'var(--color-primary)' : 'var(--color-text-light)',
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {dates.map((date, i) => {
          const dateStr = formatDate(date)
          return (
            <DayCell
              key={i}
              date={date}
              isCurrentMonth={isSameMonth(date, currentDate)}
              exercises={scheduleByDate.get(dateStr) || []}
              isPeriodDay={periodDates.has(dateStr)}
              onClick={() => onDateClick(date)}
            />
          )
        })}
      </div>
    </div>
  )
}
