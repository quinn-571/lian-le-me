import { addDays, parseISO, format, getISOWeek } from 'date-fns'
import type { ExerciseRecord } from '../db/dexie'
import type { GeneratedSchedule, GenerateParams } from './types'
import { predictFuturePeriods, getPeriodDayIndex } from './periodPredictor'

export function generateSchedule(params: GenerateParams): GeneratedSchedule[] {
  const {
    exercises,
    startDate,
    dayCount,
    historicalSchedules,
    periodRecords,
    hairWashRecords,
    lockedDates,
    lockedDaySchedules,
    cardioFreq,
    strengthFreq,
    exerciseFreqs,
    gender,
    periodDuration,
    periodCycle,
    hairWashInterval,
    lastHairWashDate,
  } = params

  const endDate = format(addDays(parseISO(startDate), dayCount), 'yyyy-MM-dd')

  // ===== 阶段1：构建约束地图 =====
  const actualPeriods = periodRecords.filter((r) => !r.isPredicted)
  const predictedPeriods = periodRecords.filter((r) => r.isPredicted)
  let futurePeriods: { startDate: string; duration: number }[] = []

  if (gender === 'female' && actualPeriods.length > 0) {
    // 1. 当前这次经期（最近一次实际记录，可能仍在进行中）
    const lastActual = actualPeriods[actualPeriods.length - 1]
    futurePeriods.push({
      startDate: lastActual.startDate,
      duration: lastActual.duration,
    })
    // 2. 预测未来经期
    const predicted = predictFuturePeriods(
      actualPeriods.map((r) => ({ startDate: r.startDate, duration: r.duration })),
      predictedPeriods.map((r) => ({ startDate: r.startDate, duration: r.duration })),
      periodCycle, periodDuration, startDate, dayCount,
    )
    for (const p of predicted) {
      // 避免重复（当前经期和预测第一周期可能重叠）
      if (!futurePeriods.some((f) => f.startDate === p.startDate)) {
        futurePeriods.push(p)
      }
    }
  }

  const hairWashDateSet = new Set(hairWashRecords.map((r) => r.date))
  if (gender === 'female' && hairWashInterval > 0 && lastHairWashDate) {
    let cursor = addDays(parseISO(lastHairWashDate), hairWashInterval)
    const end = parseISO(endDate)
    while (format(cursor, 'yyyy-MM-dd') <= format(end, 'yyyy-MM-dd')) {
      hairWashDateSet.add(format(cursor, 'yyyy-MM-dd'))
      cursor = addDays(cursor, hairWashInterval)
    }
  }

  const allPastEntries = [
    ...historicalSchedules,
    ...Array.from(lockedDaySchedules.entries()).flatMap(([date, items]) =>
      items.map((item) => ({ date, exerciseId: item.exerciseId })),
    ),
  ].sort((a, b) => a.date.localeCompare(b.date))

  const pastDateSet = new Set(allPastEntries.map((s) => s.date))

  // ===== 阶段2：初始化配额 =====
  const quota = {
    cardioRemaining: cardioFreq,
    strengthRemaining: strengthFreq,
    perExercise: new Map<string, number>(),
    lastTrainedDate: new Map<string, string>(),
    consecutiveTrainDays: 0,
    currentWeek: getISOWeek(parseISO(startDate)),
  }

  for (const ex of exercises) {
    quota.perExercise.set(ex.id, exerciseFreqs[ex.id] ?? 0)
  }

  for (const item of allPastEntries) {
    quota.lastTrainedDate.set(item.exerciseId, item.date)
  }

  // 推算连续训练天数
  {
    let cursor = addDays(parseISO(startDate), -1)
    let count = 0
    while (count < 7) {
      const d = format(cursor, 'yyyy-MM-dd')
      if (pastDateSet.has(d)) { count++ } else { break }
      cursor = addDays(cursor, -1)
    }
    quota.consecutiveTrainDays = count
  }

  // 扣减本周已安排配额
  const weekStart = getWeekStart(parseISO(startDate))
  const weekEnd = getWeekEnd(parseISO(startDate))
  for (const item of allPastEntries) {
    const itemDate = parseISO(item.date)
    if (itemDate >= weekStart && itemDate <= weekEnd) {
      const ex = exercises.find((e) => e.id === item.exerciseId)
      if (ex) {
        if (ex.type === 'cardio') quota.cardioRemaining--
        if (ex.type === 'strength') quota.strengthRemaining--
        const prev = quota.perExercise.get(item.exerciseId) ?? 0
        quota.perExercise.set(item.exerciseId, prev - 1)
      }
    }
  }

  // ===== 阶段3：逐日排课 =====
  const results: GeneratedSchedule[] = []
  // 记录本次已生成：exerciseId → 最近安排日期，用于检测同项目连续
  const generatedLastDate = new Map<string, string>()

  let cursor = parseISO(startDate)
  const end = parseISO(endDate)

  while (format(cursor, 'yyyy-MM-dd') <= format(end, 'yyyy-MM-dd')) {
    const dateStr = format(cursor, 'yyyy-MM-dd')
    const periodDay = getPeriodDayIndex(dateStr, futurePeriods)
    const isHairWash = hairWashDateSet.has(dateStr)
    const isLocked = lockedDates.has(dateStr)

    // 0. 锁定日
    if (isLocked) {
      const lockedItems = lockedDaySchedules.get(dateStr) || []
      for (const item of lockedItems) {
        quota.lastTrainedDate.set(item.exerciseId, dateStr)
        generatedLastDate.set(item.exerciseId, dateStr)
        const ex = exercises.find((e) => e.id === item.exerciseId)
        if (ex) {
          if (ex.type === 'cardio') quota.cardioRemaining--
          if (ex.type === 'strength') quota.strengthRemaining--
          const prev = quota.perExercise.get(item.exerciseId) ?? 0
          quota.perExercise.set(item.exerciseId, prev - 1)
        }
      }
      quota.consecutiveTrainDays = lockedItems.length > 0
        ? quota.consecutiveTrainDays + 1 : 0
      cursor = addDays(cursor, 1)
      continue
    }

    // 1. 跨周重置
    const thisWeek = getISOWeek(cursor)
    if (thisWeek !== quota.currentWeek) {
      quota.currentWeek = thisWeek
      quota.cardioRemaining = cardioFreq
      quota.strengthRemaining = strengthFreq
      for (const ex of exercises) {
        quota.perExercise.set(ex.id, exerciseFreqs[ex.id] ?? 0)
      }
    }

    // 2. 经期强制休息
    if (periodDay >= 1 && periodDay <= 3) {
      quota.consecutiveTrainDays = 0
      cursor = addDays(cursor, 1)
      continue
    }

    // 3. 连续训练限制
    if (quota.consecutiveTrainDays >= 3) {
      quota.consecutiveTrainDays = 0
      cursor = addDays(cursor, 1)
      continue
    }
    if (quota.consecutiveTrainDays >= 2 && !isHairWash) {
      quota.consecutiveTrainDays = 0
      cursor = addDays(cursor, 1)
      continue
    }

    // 4. 经期舒缓
    const gentleOnly = periodDay >= 4

    // 昨天练过的项目ID（历史 + 本次已生成）
    const yesterday = format(addDays(cursor, -1), 'yyyy-MM-dd')
    const yesterdayExIds = new Set<string>()
    for (const item of allPastEntries) {
      if (item.date === yesterday) yesterdayExIds.add(item.exerciseId)
    }
    for (const [exId, d] of generatedLastDate) {
      if (d === yesterday) yesterdayExIds.add(exId)
    }

    // 5. 通用过滤
    const isValid = (ex: ExerciseRecord): boolean => {
      if (gentleOnly && !ex.isGentle) return false
      if (yesterdayExIds.has(ex.id)) return false
      // 频次=0 明确不排
      if ((exerciseFreqs[ex.id] ?? 0) <= 0) return false
      return true
    }

    const selected: string[] = []
    const strengthMax = periodDay >= 1 && periodDay <= 3 ? 0 : 1
    const cardioMax = periodDay >= 1 && periodDay <= 3 ? 0 : 1

    // 选无氧：有配额就排
    if (strengthMax > 0 && quota.strengthRemaining > 0) {
      let pool = exercises
        .filter((e) => e.type === 'strength')
        .filter(isValid)
        .filter((e) => (quota.perExercise.get(e.id) ?? 0) > 0)
      if (isHairWash) {
        const sw = pool.filter((e) => e.isSweaty)
        if (sw.length > 0) pool = sw
      }
      pool.sort(byLongestGap(quota.lastTrainedDate, quota.perExercise))
      if (pool.length > 0) selected.push(pool[0].id)
    }

    // 选有氧：有配额就排
    if (cardioMax > 0 && quota.cardioRemaining > 0) {
      let pool = exercises
        .filter((e) => e.type === 'cardio')
        .filter(isValid)
        .filter((e) => (quota.perExercise.get(e.id) ?? 0) > 0)
      if (isHairWash) {
        const sw = pool.filter((e) => e.isSweaty)
        if (sw.length > 0) pool = sw
      }
      pool.sort(byLongestGap(quota.lastTrainedDate, quota.perExercise))
      const f = pool.find((c) => !selected.includes(c.id))
      if (f) selected.push(f.id)
    }

    // 洗头日保底：配额用完了也得排1个大出汗项目
    if (isHairWash && selected.length === 0) {
      let pool = exercises
        .filter(isValid)
        .filter((e) => {
          if (e.type === 'cardio' && cardioMax === 0) return false
          if (e.type === 'strength' && strengthMax === 0) return false
          return true
        })
      // 优先大出汗
      const sw = pool.filter((e) => e.isSweaty)
      if (sw.length > 0) pool = sw
      pool.sort(byLongestGap(quota.lastTrainedDate, quota.perExercise))
      if (pool.length > 0) selected.push(pool[0].id)
    }

    // 非洗头日：最多1项，把配额省给洗头日
    if (!isHairWash && selected.length > 1) {
      // 只保留配额外的那个类型（有配额优先），超额的类型留给洗头日
      selected.length = 1
    }

    // 6. 更新状态
    for (const id of selected) {
      results.push({ date: dateStr, exerciseId: id, completed: false, isManuallyAdded: false })
      quota.lastTrainedDate.set(id, dateStr)
      generatedLastDate.set(id, dateStr)
      const ex = exercises.find((e) => e.id === id)!
      if (ex.type === 'cardio') quota.cardioRemaining--
      if (ex.type === 'strength') quota.strengthRemaining--
      const prev = quota.perExercise.get(id) ?? 0
      quota.perExercise.set(id, prev - 1)
    }

    quota.consecutiveTrainDays = selected.length > 0
      ? quota.consecutiveTrainDays + 1 : 0
    cursor = addDays(cursor, 1)
  }

  return results
}

// 排序函数：有配额的优先，然后按最久没练
function byLongestGap(
  lastTrained: Map<string, string>,
  perExercise: Map<string, number>,
): (a: ExerciseRecord, b: ExerciseRecord) => number {
  return (a, b) => {
    const aQ = perExercise.get(a.id) ?? 0
    const bQ = perExercise.get(b.id) ?? 0
    if (aQ > 0 !== bQ > 0) return aQ > 0 ? -1 : 1
    const aL = lastTrained.get(a.id) ?? '2000-01-01'
    const bL = lastTrained.get(b.id) ?? '2000-01-01'
    return aL.localeCompare(bL)
  }
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekEnd(date: Date): Date {
  const d = getWeekStart(date)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}
