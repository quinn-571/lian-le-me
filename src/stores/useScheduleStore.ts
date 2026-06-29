import { create } from 'zustand'
import {
  db,
  type ScheduleRecord,
  type ExerciseRecord,
  getSchedulesFromDate,
  saveSchedule,
  deleteSchedule,
  deleteSchedulesFromDate,
  toggleScheduleComplete,
  loadExercises,
  saveExercise,
  deleteExercise,
  getSchedulesBeforeDate,
  getPeriodRecords,
  getHairWashRecords,
} from '../db/dexie'
import { PRESET_EXERCISES } from '../utils/constants'
import { format } from 'date-fns'
import { getTodayStr } from '../utils/calendar'
import { generateSchedule } from '../engine/scheduleGenerator'
import { useSettingsStore } from './useSettingsStore'

interface ScheduleState {
  futureSchedules: ScheduleRecord[]
  exercises: ExerciseRecord[]
  periodDates: Set<string> // 经期日期集合
  loading: boolean

  initialize: () => Promise<void>

  getDaySchedules: (date: string) => ScheduleRecord[]
  toggleComplete: (date: string, exerciseId: string) => Promise<void>
  addScheduleItem: (date: string, exerciseId: string) => Promise<void>
  removeScheduleItem: (id: number) => Promise<void>
  replaceFutureSchedules: (schedules: ScheduleRecord[]) => Promise<void>
  regenerateSchedules: () => Promise<void>

  addExercise: (ex: ExerciseRecord) => Promise<void>
  updateExercise: (ex: ExerciseRecord) => Promise<void>
  removeExercise: (id: string) => Promise<void>
  refreshExercises: () => Promise<void>
}

export const useScheduleStore = create<ScheduleState>()((set, get) => ({
  futureSchedules: [],
  exercises: [],
  periodDates: new Set<string>(),
  loading: true,

  initialize: async () => {
    const today = getTodayStr()
    // 往前取30天，保证历史记录可见
    const past30 = new Date(); past30.setDate(past30.getDate() - 30)
    const fromDate = format(past30, 'yyyy-MM-dd')
    try {
      const [schedules, exercises] = await Promise.all([
        getSchedulesFromDate(fromDate),
        loadExercises(),
      ])

      // 去重：删除重复的预设项目（同id只保留一个）
      const seenIds = new Set<string>()
      const toDelete: string[] = []
      for (const ex of exercises) {
        if (seenIds.has(ex.id)) {
          toDelete.push(ex.id)
        } else {
          seenIds.add(ex.id)
        }
      }
      if (toDelete.length > 0) {
        await db.exercises.bulkDelete(toDelete)
      }

      // 重新加载去重后的数据
      let clean = toDelete.length > 0 ? await loadExercises() : exercises

      // 如果没有项目，写入预设
      const presetIds = PRESET_EXERCISES.map((e) => e.id)
      const hasPresets = clean.some((e) => presetIds.includes(e.id))
      if (!hasPresets) {
        await db.exercises.bulkAdd(
          PRESET_EXERCISES.map((ex, i) => ({ ...ex, order: i })),
        )
        clean = await loadExercises()
      }

      set({ exercises: clean, futureSchedules: schedules, periodDates: new Set(), loading: false })
    } catch (err) {
      console.error('数据库初始化失败，重置中...', err)
      await db.exercises.clear()
      await db.exercises.bulkAdd(
        PRESET_EXERCISES.map((ex, i) => ({ ...ex, order: i })),
      )
      const clean = await loadExercises()
      const schedules = await getSchedulesFromDate(today)
      set({ exercises: clean, futureSchedules: schedules, periodDates: new Set(), loading: false })
    }
  },

  getDaySchedules: (date: string) => {
    return get().futureSchedules.filter((s) => s.date === date)
  },

  toggleComplete: async (date, exerciseId) => {
    await toggleScheduleComplete(date, exerciseId)
    set((state) => ({
      futureSchedules: state.futureSchedules.map((s) =>
        s.date === date && s.exerciseId === exerciseId
          ? { ...s, completed: !s.completed }
          : s,
      ),
    }))
  },

  addScheduleItem: async (date, exerciseId) => {
    const record: ScheduleRecord = {
      date,
      exerciseId,
      completed: false,
      isManuallyAdded: true,
    }
    const id = await saveSchedule(record)
    set((state) => ({
      futureSchedules: [...state.futureSchedules, { ...record, id }],
    }))
  },

  removeScheduleItem: async (id) => {
    await deleteSchedule(id)
    set((state) => ({
      futureSchedules: state.futureSchedules.filter((s) => s.id !== id),
    }))
  },

  replaceFutureSchedules: async (schedules) => {
    const today = getTodayStr()
    await deleteSchedulesFromDate(today)
    await db.schedules.bulkAdd(schedules)
    const updated = await getSchedulesFromDate(today)
    set({ futureSchedules: updated })
  },

  regenerateSchedules: async () => {
    const settings = useSettingsStore.getState()
    const exercises = get().exercises
    const today = getTodayStr()

    try {
      // 获取历史课表
      const historicalSchedules = await getSchedulesBeforeDate(today)
      let periodRecords = await getPeriodRecords()
      const hairWashRecords = await getHairWashRecords()

      // 如果设置了经期但没有记录，自动创建初始经期记录
      if (settings.gender === 'female' && settings.lastPeriodDate && periodRecords.length === 0) {
        await db.periodRecords.put({
          startDate: settings.lastPeriodDate,
          duration: settings.periodDuration,
          isPredicted: false,
        })
        periodRecords = await getPeriodRecords()
      }

      // 如果设置了上次洗头日但没有记录，自动创建
      if (settings.gender === 'female' && settings.lastHairWashDate && hairWashRecords.length === 0) {
        await db.hairWashRecords.put({ date: settings.lastHairWashDate })
      }

      // 保存今日手动操作的项目
      const todayRecords = get().futureSchedules
        .filter((s) => s.date === today && (s.completed || s.isManuallyAdded))

      // 收集锁定日（排除今日，今日始终由算法排 + 手动合并）
      const lockedDates = new Set<string>()
      const lockedDaySchedules = new Map<string, { exerciseId: string; completed: boolean }[]>()
      for (const item of get().futureSchedules.filter((s) => s.isManuallyAdded && s.date !== today)) {
        lockedDates.add(item.date)
        if (!lockedDaySchedules.has(item.date)) lockedDaySchedules.set(item.date, [])
        lockedDaySchedules.get(item.date)!.push({
          exerciseId: item.exerciseId,
          completed: item.completed,
        })
      }

      // 生成新课表
      const generated = generateSchedule({
        exercises: exercises.map((ex) => ({ ...ex })),
        startDate: today,
        dayCount: 60,
        historicalSchedules: historicalSchedules.map((s) => ({
          date: s.date, exerciseId: s.exerciseId, completed: s.completed,
        })),
        periodRecords,
        hairWashRecords,
        lockedDates,
        lockedDaySchedules,
        cardioFreq: settings.cardioFreq,
        strengthFreq: settings.strengthFreq,
        exerciseFreqs: settings.exerciseFreqs,
        gender: settings.gender,
        periodDuration: settings.periodDuration,
        periodCycle: settings.periodCycle,
        hairWashInterval: settings.hairWashInterval,
        lastHairWashDate: settings.lastHairWashDate,
      })

      // 合并今日已完成状态
      const merged = generated.map((gen) => {
        const saved = todayRecords.find(
          (t) => t.exerciseId === gen.exerciseId && t.date === gen.date,
        )
        return {
          ...gen,
          completed: saved ? saved.completed : gen.completed,
          isManuallyAdded: saved ? saved.isManuallyAdded : gen.isManuallyAdded,
        }
      })

      // 补回手动添加的不在生成结果中的项目
      const genKeys = new Set(merged.map((g) => g.exerciseId + '_' + g.date))
      for (const rec of todayRecords) {
        if (!genKeys.has(rec.exerciseId + '_' + rec.date)) {
          merged.push({
            date: rec.date, exerciseId: rec.exerciseId,
            completed: rec.completed, isManuallyAdded: rec.isManuallyAdded,
          })
        }
      }

      // 计算经期日期集（包含实际 + 预测）
      const periodSet = new Set<string>()
      if (settings.gender === 'female') {
        // 实际经期记录
        for (const rec of periodRecords) {
          const s = new Date(rec.startDate)
          for (let i = 0; i < rec.duration; i++) {
            const d = new Date(s); d.setDate(d.getDate() + i)
            periodSet.add(format(d, 'yyyy-MM-dd'))
          }
        }
        // 预测下一期（用于日历显示）
        if (periodRecords.length > 0) {
          const actuals = periodRecords.filter((r) => !r.isPredicted)
          if (actuals.length > 0) {
            const last = actuals[actuals.length - 1]
            const predictedStart = new Date(last.startDate)
            predictedStart.setDate(predictedStart.getDate() + settings.periodCycle)
            for (let i = 0; i < settings.periodDuration; i++) {
              const d = new Date(predictedStart); d.setDate(d.getDate() + i)
              periodSet.add(format(d, 'yyyy-MM-dd'))
            }
          }
        }
      }

      await get().replaceFutureSchedules(
        merged.map((g) => ({
          date: g.date, exerciseId: g.exerciseId,
          completed: g.completed, isManuallyAdded: g.isManuallyAdded,
        })),
      )

      set({ periodDates: periodSet })
    } catch (err) {
      console.error('生成课表失败:', err)
    }
  },

  addExercise: async (ex) => {
    await saveExercise(ex)
    await get().refreshExercises()
  },

  updateExercise: async (ex) => {
    await saveExercise(ex)
    await get().refreshExercises()
  },

  removeExercise: async (id) => {
    await deleteExercise(id)
    await get().refreshExercises()
  },

  refreshExercises: async () => {
    const exercises = await loadExercises()
    set({ exercises })
  },
}))
