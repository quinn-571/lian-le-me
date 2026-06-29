import { addDays, format, parseISO, differenceInDays } from 'date-fns'

/**
 * 从经期记录推算未来经期日期
 * 使用中位数周期长度（抗异常值干扰）
 */
export function predictFuturePeriods(
  actualRecords: { startDate: string; duration: number }[],
  predictedRecords: { startDate: string; duration: number }[],
  cycleLength: number,      // 默认周期（用户设置）
  defaultDuration: number,   // 默认持续天数
  fromDate: string,
  dayCount: number,
): { startDate: string; duration: number }[] {
  // 1. 计算中位数周期
  const medianCycle = getMedianCycle(actualRecords, cycleLength)

  // 2. 确定最近一次经期开始日
  const allStarts = [
    ...actualRecords.map((r) => r.startDate),
    ...predictedRecords.map((r) => r.startDate),
  ].sort()

  let lastStart: string
  if (allStarts.length > 0) {
    lastStart = allStarts[allStarts.length - 1]
  } else {
    // 没有任何记录，无法推算
    return []
  }

  // 3. 推算未来经期
  const results: { startDate: string; duration: number }[] = []
  const endDate = addDays(parseISO(fromDate), dayCount)
  let nextStart = addDays(parseISO(lastStart), medianCycle)

  while (format(nextStart, 'yyyy-MM-dd') <= format(endDate, 'yyyy-MM-dd')) {
    const startStr = format(nextStart, 'yyyy-MM-dd')
    if (startStr >= fromDate) {
      results.push({ startDate: startStr, duration: defaultDuration })
    }
    nextStart = addDays(nextStart, medianCycle)
  }

  return results
}

/**
 * 计算中位数周期
 */
export function getMedianCycle(
  records: { startDate: string }[],
  fallback: number,
): number {
  if (records.length < 2) return fallback

  const sorted = records.map((r) => r.startDate).sort()
  const gaps: number[] = []

  for (let i = 1; i < sorted.length; i++) {
    const gap = differenceInDays(parseISO(sorted[i]), parseISO(sorted[i - 1]))
    // 过滤异常值（<15天或>60天）
    if (gap >= 15 && gap <= 60) {
      gaps.push(gap)
    }
  }

  if (gaps.length === 0) return fallback

  gaps.sort((a, b) => a - b)
  const mid = Math.floor(gaps.length / 2)
  return gaps.length % 2 === 0
    ? Math.round((gaps[mid - 1] + gaps[mid]) / 2)
    : gaps[mid]
}

/**
 * 获取某日是否为经期日，以及是第几天
 * 返回 -1 表示非经期日
 */
export function getPeriodDayIndex(
  dateStr: string,
  periodStarts: { startDate: string; duration: number }[],
): number {
  for (const p of periodStarts) {
    const start = parseISO(p.startDate)
    for (let i = 0; i < p.duration; i++) {
      const day = format(addDays(start, i), 'yyyy-MM-dd')
      if (day === dateStr) return i + 1 // 第1天起
    }
  }
  return -1
}
