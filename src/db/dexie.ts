import Dexie, { type EntityTable } from 'dexie'

// ===== 数据表接口 =====

export interface ExerciseRecord {
  id: string // 手动指定，非自增
  name: string
  type: 'cardio' | 'strength'
  icon: string
  isPreset: boolean
  isSweaty: boolean
  isGentle: boolean
  // 自定义排序
  order: number
}

export interface ScheduleRecord {
  id?: number // Dexie 自增主键
  date: string // 'yyyy-MM-dd'
  exerciseId: string
  completed: boolean
  isManuallyAdded: boolean
}

export interface PeriodRecord {
  id?: number
  startDate: string
  duration: number
  isPredicted: boolean
}

export interface HairWashRecord {
  id?: number
  date: string
}

export interface MeasurementRecord {
  id?: number
  date: string
  weight?: number    // kg
  chest?: number     // cm
  waist?: number
  hips?: number
  upperArm?: number
  forearm?: number
  thigh?: number
  calf?: number
}

// ===== 数据库定义 =====

class AppDB extends Dexie {
  exercises!: EntityTable<ExerciseRecord, 'id'>
  schedules!: EntityTable<ScheduleRecord, 'id'>
  periodRecords!: EntityTable<PeriodRecord, 'id'>
  hairWashRecords!: EntityTable<HairWashRecord, 'id'>
  measurements!: EntityTable<MeasurementRecord, 'id'>

  constructor() {
    super('LianLeMeDB')

    this.version(1).stores({
      exercises: 'id, type, isPreset, order',
      schedules: '++id, date, exerciseId, completed, [date+exerciseId]',
      periodRecords: '++id, startDate, isPredicted',
      hairWashRecords: '++id, date',
    })

    // v2: 为 exercises 表添加 order 索引
    this.version(2).stores({
      exercises: 'id, type, isPreset, order',
      schedules: '++id, date, exerciseId, completed, [date+exerciseId]',
      periodRecords: '++id, startDate, isPredicted',
      hairWashRecords: '++id, date',
      measurements: '++id, date',
    }).upgrade(async (tx) => {
      // 为现有数据设置默认 order 值
      const all = await tx.table('exercises').toArray()
      for (let i = 0; i < all.length; i++) {
        if (all[i].order === undefined) {
          await tx.table('exercises').update(all[i].id, { order: i })
        }
      }
    })
  }
}

export const db = new AppDB()

// ===== CRUD 辅助方法 =====

// --- 运动项目 ---

export async function loadExercises(): Promise<ExerciseRecord[]> {
  return db.exercises.orderBy('order').toArray()
}

export async function saveExercise(ex: ExerciseRecord): Promise<void> {
  await db.exercises.put(ex)
}

export async function deleteExercise(id: string): Promise<void> {
  await db.exercises.delete(id)
  // 同时删除相关课表
  await db.schedules.where('exerciseId').equals(id).delete()
}

// --- 课表 ---

export async function getSchedulesByDate(date: string): Promise<ScheduleRecord[]> {
  return db.schedules.where('date').equals(date).toArray()
}

export async function getSchedulesFromDate(startDate: string): Promise<ScheduleRecord[]> {
  return db.schedules.where('date').aboveOrEqual(startDate).toArray()
}

export async function getSchedulesBeforeDate(endDate: string): Promise<ScheduleRecord[]> {
  return db.schedules.where('date').below(endDate).toArray()
}

export async function saveSchedule(item: ScheduleRecord): Promise<number> {
  return db.schedules.put(item)
}

export async function deleteSchedule(id: number): Promise<void> {
  await db.schedules.delete(id)
}

export async function deleteSchedulesFromDate(startDate: string): Promise<void> {
  await db.schedules.where('date').aboveOrEqual(startDate).delete()
}

export async function toggleScheduleComplete(
  date: string,
  exerciseId: string,
): Promise<void> {
  const item = await db.schedules
    .where('[date+exerciseId]')
    .equals([date, exerciseId])
    .first()
  if (item) {
    await db.schedules.update(item.id!, { completed: !item.completed })
  }
}

export async function isDateFullyCompleted(date: string): Promise<boolean> {
  const items = await db.schedules.where('date').equals(date).toArray()
  return items.length > 0 && items.every((s) => s.completed)
}

// --- 经期记录 ---

export async function getPeriodRecords(): Promise<PeriodRecord[]> {
  return db.periodRecords.orderBy('startDate').toArray()
}

export async function savePeriodRecord(rec: PeriodRecord): Promise<number> {
  return db.periodRecords.put(rec)
}

export async function deletePredictedPeriods(): Promise<void> {
  await db.periodRecords.where('isPredicted').equals(true).delete()
}

// --- 洗头记录 ---

export async function getHairWashRecords(): Promise<HairWashRecord[]> {
  return db.hairWashRecords.orderBy('date').toArray()
}

export async function saveHairWashRecord(rec: HairWashRecord): Promise<number> {
  return db.hairWashRecords.put(rec)
}

// --- 身体数据 ---
export async function getMeasurementsByDate(date: string): Promise<MeasurementRecord | undefined> {
  return db.measurements.where('date').equals(date).first()
}

export async function getAllMeasurements(): Promise<MeasurementRecord[]> {
  return db.measurements.orderBy('date').toArray()
}

export async function saveMeasurement(rec: MeasurementRecord): Promise<number> {
  const existing = await db.measurements.where('date').equals(rec.date).first()
  if (existing) {
    await db.measurements.update(existing.id!, rec)
    return existing.id!
  }
  return db.measurements.put(rec)
}
