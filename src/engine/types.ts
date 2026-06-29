import type { ExerciseRecord } from '../db/dexie'

// 每日约束
export interface DayConstraint {
  isLocked: boolean           // 用户手动锁定，跳过排课
  isForcedRest: boolean       // 经期1-3天 → 休息
  isGentleOnly: boolean       // 经期4天+ → 仅舒缓
  isHairWashDay: boolean      // 洗头日 → 优先安排
  maxCardio: 0 | 1
  maxStrength: 0 | 1
  targetCount: 0 | 1 | 2     // 目标项目数（洗头日为2，普通为1，休息为0）
}

// 配额追踪
export interface Quota {
  cardioRemaining: number
  strengthRemaining: number
  perExercise: Map<string, number>      // exerciseId → 本周剩余次数
  lastTrainedDate: Map<string, string>  // exerciseId → 上次训练日 'yyyy-MM-dd'
  consecutiveTrainDays: number
  currentWeek: number
}

// 生成结果
export interface GeneratedSchedule {
  date: string
  exerciseId: string
  completed: boolean
  isManuallyAdded: boolean
}

// 算法参数
export interface GenerateParams {
  exercises: ExerciseRecord[]
  startDate: string           // 'yyyy-MM-dd'
  dayCount: number            // 生成多少天
  historicalSchedules: { date: string; exerciseId: string; completed: boolean }[]
  periodRecords: { startDate: string; duration: number; isPredicted: boolean }[]
  hairWashRecords: { date: string }[]
  lockedDates: Set<string>
  lockedDaySchedules: Map<string, { exerciseId: string; completed: boolean }[]>
  cardioFreq: number
  strengthFreq: number
  exerciseFreqs: Record<string, number>
  gender: 'male' | 'female'
  periodDuration: number
  periodCycle: number
  hairWashInterval: number   // 每隔N天洗头
  lastHairWashDate: string    // 上次洗头日期
}
