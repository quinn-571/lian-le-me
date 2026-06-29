import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  addDays,
  addMonths,
  subMonths,
  getDay,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'

// 一周从周日开始
export const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

// 获取月视图的日期格子（6周×7天）
export function getMonthGridDates(year: number, month: number): Date[] {
  const monthStart = new Date(year, month, 1)
  const monthEnd = endOfMonth(monthStart)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  return eachDayOfInterval({ start: gridStart, end: gridEnd })
}

// 获取周视图的日期
export function getWeekDates(date: Date): Date[] {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 })
  return eachDayOfInterval({ start: weekStart, end: weekEnd })
}

// 格式化日期为 yyyy-MM-dd
export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

// 格式化月份标题如 "2024年6月"
export function formatMonthTitle(date: Date): string {
  return format(date, 'yyyy年M月', { locale: zhCN })
}

// 格式化周标题
export function formatWeekTitle(date: Date): string {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 })
  const startStr = format(weekStart, 'M月d日')
  const endStr = format(weekEnd, 'M月d日')
  return `${startStr} - ${endStr}`
}

// 获取今天的日期字符串
export function getTodayStr(): string {
  return formatDate(new Date())
}

export {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  addDays,
  addMonths,
  subMonths,
  getDay,
}
