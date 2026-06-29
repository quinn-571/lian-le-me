import { useState, useMemo, useEffect, useCallback } from 'react'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { useScheduleStore } from '../../stores/useScheduleStore'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { isToday, formatDate } from '../../utils/calendar'
import { useCompletionHandler } from '../../hooks/useCompletionHandler'
import { Celebration } from '../ui/Celebration'
import { db, type MeasurementRecord } from '../../db/dexie'
import { getMeasurementsByDate, saveMeasurement } from '../../db/dexie'
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react'

const WEEKDAY = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const MEASURE_FIELDS: { key: keyof MeasurementRecord; label: string; icon: string }[] = [
  { key: 'weight', label: '体重(kg)', icon: '⚖️' },
  { key: 'chest', label: '胸围(cm)', icon: '📏' },
  { key: 'waist', label: '腰围(cm)', icon: '📏' },
  { key: 'hips', label: '臀围(cm)', icon: '📏' },
  { key: 'upperArm', label: '大臂(cm)', icon: '💪' },
  { key: 'forearm', label: '小臂(cm)', icon: '📏' },
  { key: 'thigh', label: '大腿(cm)', icon: '🦵' },
  { key: 'calf', label: '小腿(cm)', icon: '📏' },
]

export function DayCard({ onDateClick }: { onDateClick?: () => void }) {
  const { currentDate } = useCalendarStore()
  const today = isToday(currentDate)
  const dateStr = formatDate(currentDate)

  const futureSchedules = useScheduleStore((s) => s.futureSchedules)
  const exercises = useScheduleStore((s) => s.exercises)
  const toggleComplete = useScheduleStore((s) => s.toggleComplete)
  const addScheduleItem = useScheduleStore((s) => s.addScheduleItem)
  const removeScheduleItem = useScheduleStore((s) => s.removeScheduleItem)
  const regenerateSchedules = useScheduleStore((s) => s.regenerateSchedules)
  const gender = useSettingsStore((s) => s.gender)
  const { showCelebration, triggerCelebration } = useCompletionHandler()

  // 当天课表
  const daySchedules = useMemo(
    () => futureSchedules.filter((s) => s.date === dateStr),
    [futureSchedules, dateStr],
  )

  const [showAdd, setShowAdd] = useState(false)
  const [addId, setAddId] = useState('')
  const [showMeasure, setShowMeasure] = useState(false)
  const [measureData, setMeasureData] = useState<MeasurementRecord>({ date: dateStr })
  const [hasMeasure, setHasMeasure] = useState(false)

  // 加载身体数据
  useEffect(() => {
    getMeasurementsByDate(dateStr).then((m) => {
      if (m) { setMeasureData(m); setHasMeasure(true) }
      else { setMeasureData({ date: dateStr }); setHasMeasure(false) }
    })
  }, [dateStr])

  // 经期/洗头状态
  const [isPeriod, setIsPeriod] = useState(false)
  const [isPredPeriod, setIsPredPeriod] = useState(false)
  const [isWash, setIsWash] = useState(false)
  const [isPredWash, setIsPredWash] = useState(false)
  useEffect(() => {
    if (gender === 'female') {
      const s = useSettingsStore.getState()
      db.periodRecords.toArray().then((ps) => {
        for (const p of ps) {
          const st = new Date(p.startDate)
          for (let i = 0; i < p.duration; i++) {
            const d = new Date(st); d.setDate(d.getDate() + i)
            if (formatDate(d) === dateStr) {
              setIsPeriod(!p.isPredicted); setIsPredPeriod(p.isPredicted); return
            }
          }
        }
        // 检查预测
        if (ps.length > 0 && s.lastPeriodDate) {
          const last = new Date(s.lastPeriodDate)
          const pred = new Date(last); pred.setDate(pred.getDate() + s.periodCycle)
          for (let i = 0; i < s.periodDuration; i++) {
            const d = new Date(pred); d.setDate(d.getDate() + i)
            if (formatDate(d) === dateStr) { setIsPeriod(false); setIsPredPeriod(true); return }
          }
        }
        setIsPeriod(false); setIsPredPeriod(false)
      })
      // 洗头状态
      db.hairWashRecords.where('date').equals(dateStr).first().then((w) => {
        if (w) { setIsWash(true); setIsPredWash(false); return }
        if (s.lastHairWashDate && s.hairWashInterval > 0) {
          const last = new Date(s.lastHairWashDate)
          const diff = Math.round((currentDate.getTime() - last.getTime()) / 86400000)
          if (diff > 0 && diff % s.hairWashInterval === 0) {
            setIsWash(false); setIsPredWash(true); return
          }
        }
        setIsWash(false); setIsPredWash(false)
      })
    }
  }, [dateStr, gender, currentDate])

  const handleToggle = useCallback(async (exerciseId: string) => {
    await toggleComplete(dateStr, exerciseId)
    const updated = useScheduleStore.getState().futureSchedules.filter((s) => s.date === dateStr)
    if (updated.length > 0 && updated.every((s) => s.completed)) triggerCelebration()
  }, [dateStr, toggleComplete, triggerCelebration])

  const handleAdd = async () => {
    if (!addId) return
    await addScheduleItem(dateStr, addId)
    setAddId(''); setShowAdd(false)
    setTimeout(() => regenerateSchedules(), 200)
  }

  const handleDelete = async (id: number) => {
    await removeScheduleItem(id)
    setTimeout(() => regenerateSchedules(), 200)
  }

  const handleMarkPeriod = async () => {
    setIsPeriod(!isPeriod); setIsPredPeriod(false)
    const s = useSettingsStore.getState()
    if (isPeriod) {
      const ps = await db.periodRecords.toArray()
      for (const p of ps) {
        const st = new Date(p.startDate)
        for (let i = 0; i < p.duration; i++) {
          const d = new Date(st); d.setDate(d.getDate() + i)
          if (formatDate(d) === dateStr && !p.isPredicted) { await db.periodRecords.delete(p.id!); break }
        }
      }
    } else {
      await db.periodRecords.put({ startDate: dateStr, duration: s.periodDuration, isPredicted: false })
      await db.periodRecords.filter((p) => p.isPredicted).toArray().then((ps) => db.periodRecords.bulkDelete(ps.map((p) => p.id!)))
    }
    setTimeout(() => regenerateSchedules(), 200)
  }

  const handleMarkWash = async () => {
    setIsWash(!isWash); setIsPredWash(false)
    if (isWash) {
      const w = await db.hairWashRecords.where('date').equals(dateStr).first()
      if (w) await db.hairWashRecords.delete(w.id!)
    } else {
      await db.hairWashRecords.put({ date: dateStr })
    }
    setTimeout(() => regenerateSchedules(), 200)
  }

  const handleSaveMeasure = async () => {
    await saveMeasurement(measureData)
    setHasMeasure(true)
    setShowMeasure(false)
  }

  const existingIds = new Set(daySchedules.map((s) => s.exerciseId))
  const addableExercises = exercises.filter((ex) => !existingIds.has(ex.id))
  const isFuture = dateStr > formatDate(new Date())

  return (
    <div className="px-1 space-y-3">
      {/* 日期标题 */}
      <div className="text-center py-2">
        <div className="text-4xl font-bold" style={{ color: 'var(--color-primary)' }}>{currentDate.getDate()}</div>
        <div className="text-sm" style={{ color: 'var(--color-text-light)' }}>
          {WEEKDAY[currentDate.getDay()]} · {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
          {today && <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>今天</span>}
        </div>
      </div>

      {/* 经期/洗头按钮（仅女性） */}
      {gender === 'female' && (
        <div className="flex gap-2 justify-center">
          {(isPeriod || isPredPeriod || !isFuture) && (
            <button onClick={handleMarkPeriod} className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: isPeriod ? 'var(--color-period)' : isPredPeriod ? 'color-mix(in srgb, var(--color-period) 30%, transparent)' : 'transparent',
                border: isPeriod ? '2px solid var(--color-period)' : isPredPeriod ? '2px dashed var(--color-period)' : '2px solid var(--color-border)',
                color: 'var(--color-text)',
              }}>
              🩸 {isPeriod ? '取消经期' : isPredPeriod ? '预测的经期' : today ? '今日来月经' : '这天来月经'}
            </button>
          )}
          <button onClick={handleMarkWash} className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              backgroundColor: (isWash || isPredWash) ? 'var(--color-primary)' : 'transparent',
              border: (isWash || isPredWash) ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
              color: (isWash || isPredWash) ? 'white' : 'var(--color-text)',
            }}>
            💇 {isWash ? '取消洗头' : (isWash || isPredWash) ? '这天洗头' : today ? '今日洗头' : '这天洗头'}
          </button>
        </div>
      )}

      {/* 课表项目 */}
      <div className="space-y-1.5">
        {daySchedules.map((s) => {
          const ex = exercises.find((e) => e.id === s.exerciseId)
          if (!ex) return null
          return (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                backgroundColor: s.completed ? 'transparent' : ex.type === 'cardio' ? 'color-mix(in srgb, var(--color-cardio) 8%, transparent)' : 'color-mix(in srgb, var(--color-strength) 8%, transparent)',
                border: '1px solid var(--color-border)', opacity: s.completed ? 0.5 : 1,
              }}>
              <button onClick={() => !isFuture && handleToggle(s.exerciseId)} disabled={isFuture}
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{
                  borderColor: s.completed ? 'var(--color-success)' : 'var(--color-border)',
                  backgroundColor: s.completed ? 'var(--color-success)' : 'transparent',
                  color: 'white', opacity: isFuture ? 0.3 : 1,
                }}>
                {s.completed && '✓'}
              </button>
              <span className="text-xl">{ex.icon}</span>
              <span className="text-base font-medium flex-1" style={{
                color: s.completed ? 'var(--color-completed)' : 'var(--color-text)',
                textDecoration: s.completed ? 'line-through' : 'none',
              }}>{ex.name}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
                backgroundColor: ex.type === 'cardio' ? 'color-mix(in srgb, var(--color-cardio) 15%, transparent)' : 'color-mix(in srgb, var(--color-strength) 15%, transparent)',
                color: ex.type === 'cardio' ? 'var(--color-cardio)' : 'var(--color-strength)',
              }}>{ex.type === 'cardio' ? '有氧' : '无氧'}</span>
              <button onClick={() => s.id != null && handleDelete(s.id)} className="p-1" style={{ color: 'var(--color-text-light)' }}>
                <Trash2 size={16} />
              </button>
            </div>
          )
        })}
      </div>

      {/* 添加项目 */}
      {showAdd ? (
        <div className="flex gap-2 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-primary)' }}>
          <select value={addId} onChange={(e) => setAddId(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg text-base border"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
            <option value="">选择项目...</option>
            {addableExercises.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.icon} {ex.name}</option>
            ))}
          </select>
          <button onClick={handleAdd} disabled={!addId}
            className="px-4 py-2 rounded-lg text-sm font-bold"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white', opacity: addId ? 1 : 0.4 }}>
            添加
          </button>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="w-full py-2 rounded-lg text-sm border-2 border-dashed flex items-center justify-center gap-1"
          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
          <Plus size={16} /> 添加项目
        </button>
      )}

      {/* 身体数据（仅今/过去可编辑） */}
      <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <button onClick={() => !isFuture && setShowMeasure(!showMeasure)}
          className="w-full flex items-center justify-between text-sm font-bold"
          style={{ color: 'var(--color-text)', opacity: isFuture ? 0.4 : 1 }}>
          <span>📊 身体数据{isFuture ? '（未来不可设）' : ''}</span>
          {showMeasure ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {hasMeasure && !showMeasure && (
          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
            {MEASURE_FIELDS.map((f) => {
              const val = measureData[f.key]
              if (val == null) return null
              return (
                <div key={f.key} className="text-center p-2 rounded-lg" style={{ backgroundColor: 'var(--color-bg)' }}>
                  <div className="text-xs" style={{ color: 'var(--color-text-light)' }}>{f.icon} {f.label.replace(/\(.*\)/, '')}</div>
                  <div className="font-bold" style={{ color: 'var(--color-primary)' }}>{val}</div>
                </div>
              )
            })}
          </div>
        )}

        {showMeasure && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 max-w-xs mx-auto">
              {MEASURE_FIELDS.map((f) => (
                <div key={f.key} className="flex items-center gap-1.5">
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-text-light)' }}>{f.label.replace(/\(.*\)/, '')}</span>
                  <input type="number" step="0.1" placeholder="-"
                    value={measureData[f.key] ?? ''}
                    onChange={(e) => setMeasureData({ ...measureData, [f.key]: e.target.value ? Number(e.target.value) : undefined })}
                    className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-sm border text-center"
                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              ))}
            </div>
            <button onClick={handleSaveMeasure}
              className="w-full py-2 rounded-lg text-sm font-bold"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
              保存数据
            </button>
          </div>
        )}
      </div>

      <Celebration visible={showCelebration} />
    </div>
  )
}
