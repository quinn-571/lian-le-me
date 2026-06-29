import { isToday } from '../../utils/calendar'

interface DayCellProps {
  date: Date
  isCurrentMonth: boolean
  isPeriodDay?: boolean
  isSelected?: boolean
  exercises?: { icon: string; name: string; type: 'cardio' | 'strength'; completed: boolean }[]
  onClick?: () => void
  tall?: boolean
}

export function DayCell({
  date,
  isCurrentMonth,
  isPeriodDay = false,
  isSelected = false,
  exercises = [],
  onClick,
  tall = false,
}: DayCellProps) {
  const today = isToday(date)
  const dayNum = date.getDate()
  const highlight = today || isSelected

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center p-1 rounded-lg transition-colors w-full ${
        tall ? 'min-h-[100px] py-2' : 'min-h-[60px]'
      }`}
      style={{
        opacity: isCurrentMonth ? 1 : 0.35,
        backgroundColor: highlight
          ? `color-mix(in srgb, var(--color-primary) ${isSelected && !today ? '8%' : '10%'}, transparent)`
          : 'transparent',
        border: highlight ? '2px solid var(--color-primary)' : '2px solid transparent',
        boxShadow: isSelected && !today ? '0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent)' : 'none',
      }}
    >
      {/* 经期圆底 */}
      {isPeriodDay && (
        <span
          className="absolute top-0.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full -z-0"
          style={{ backgroundColor: 'var(--color-period)' }}
        />
      )}

      {/* 日期数字 */}
      <span
        className={`relative z-10 rounded-full flex items-center justify-center
          ${today ? 'text-white font-bold' : 'font-medium'}
          ${tall ? 'w-9 h-9 text-lg' : 'w-7 h-7 text-sm'}`}
        style={{
          backgroundColor: today ? 'var(--color-primary)' : 'transparent',
          color: today ? 'white' : isCurrentMonth ? 'var(--color-text)' : 'var(--color-text-light)',
        }}
      >
        {dayNum}
      </span>

      {/* 运动项目标签 */}
      {exercises.length > 0 && (
        tall ? (
          /* 周视图：上emoji下文字，最多4项 */
          <div className="flex flex-wrap gap-1 mt-1 w-full justify-center">
            {exercises.slice(0, 4).map((ex, i) => (
              <span
                key={i}
                className="flex flex-col items-center text-center"
                style={{
                  color: ex.completed
                    ? 'var(--color-completed)'
                    : ex.type === 'cardio'
                      ? 'var(--color-cardio)'
                      : 'var(--color-strength)',
                  opacity: ex.completed ? 0.5 : 1,
                }}
              >
                <span className="text-base leading-none">{ex.icon}</span>
                <span
                  className="text-[12px] leading-tight mt-0.5 max-w-[50px] truncate"
                  style={{ textDecoration: ex.completed ? 'line-through' : 'none' }}
                >
                  {ex.name}
                </span>
              </span>
            ))}
            {exercises.length > 4 && (
              <span className="text-[10px] self-center" style={{ color: 'var(--color-text-light)' }}>
                +{exercises.length - 4}
              </span>
            )}
          </div>
        ) : (
          /* 月视图：仅图标，最多4个 */
          <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
            {exercises.slice(0, 4).map((ex, i) => (
              <span
                key={i}
                className="text-xs leading-none"
                style={{ opacity: ex.completed ? 0.4 : 1 }}
              >
                {ex.icon}
              </span>
            ))}
            {exercises.length > 4 && (
              <span className="text-[10px]" style={{ color: 'var(--color-text-light)' }}>
                +{exercises.length - 4}
              </span>
            )}
          </div>
        )
      )}
    </button>
  )
}
