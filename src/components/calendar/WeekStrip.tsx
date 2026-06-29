import { useState, useMemo, useEffect, useCallback } from 'react'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { useScheduleStore } from '../../stores/useScheduleStore'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { getWeekDates, WEEKDAY_LABELS, formatDate, isToday } from '../../utils/calendar'
import { useCompletionHandler } from '../../hooks/useCompletionHandler'
import { Celebration } from '../ui/Celebration'
import { DayCell } from './DayCell'
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { db, getMeasurementsByDate, saveMeasurement, type MeasurementRecord } from '../../db/dexie'

const MEASURE_FIELDS: { key: keyof MeasurementRecord; label: string }[] = [
  { key: 'weight', label: '体重' }, { key: 'chest', label: '胸围' },
  { key: 'waist', label: '腰围' }, { key: 'hips', label: '臀围' },
  { key: 'upperArm', label: '大臂' }, { key: 'forearm', label: '小臂' },
  { key: 'thigh', label: '大腿' }, { key: 'calf', label: '小腿' },
]

export function WeekStrip() {
  const { currentDate, goToToday } = useCalendarStore()
  const dates = getWeekDates(currentDate)

  const futureSchedules = useScheduleStore((s) => s.futureSchedules)
  const exercises = useScheduleStore((s) => s.exercises)
  const periodDates = useScheduleStore((s) => s.periodDates)
  const toggleComplete = useScheduleStore((s) => s.toggleComplete)
  const addScheduleItem = useScheduleStore((s) => s.addScheduleItem)
  const removeScheduleItem = useScheduleStore((s) => s.removeScheduleItem)
  const regenerateSchedules = useScheduleStore((s) => s.regenerateSchedules)
  const gender = useSettingsStore((s) => s.gender)

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date()) // 默认选中今天
  const { showCelebration, triggerCelebration } = useCompletionHandler()
  const selStr = selectedDate ? formatDate(selectedDate) : ''
  const today = selectedDate ? isToday(selectedDate) : false
  const isFuture = selStr > formatDate(new Date())

  // 选中日的课表
  const daySchedules = useMemo(
    () => futureSchedules.filter((s) => s.date === selStr),
    [futureSchedules, selStr],
  )

  // 身体数据
  const [showMeasure, setShowMeasure] = useState(false)
  const [measureData, setMeasureData] = useState<MeasurementRecord>({ date: selStr })
  const [hasMeasure, setHasMeasure] = useState(false)
  useEffect(() => {
    if (!selStr) return
    getMeasurementsByDate(selStr).then((m) => {
      if (m) { setMeasureData(m); setHasMeasure(true) }
      else { setMeasureData({ date: selStr }); setHasMeasure(false) }
    })
    setShowMeasure(false)
  }, [selStr])

  // 经期/洗头
  const [isPeriod, setIsPeriod] = useState(false)
  const [isPredPeriod, setIsPredPeriod] = useState(false)
  const [isWash, setIsWash] = useState(false)
  const [isPredWash, setIsPredWash] = useState(false)
  useEffect(() => {
    if (!selStr || gender !== 'female') return
    const s = useSettingsStore.getState()
    db.periodRecords.toArray().then((ps) => {
      for (const p of ps) {
        const st = new Date(p.startDate)
        for (let i = 0; i < p.duration; i++) {
          const d = new Date(st); d.setDate(d.getDate() + i)
          if (formatDate(d) === selStr) { setIsPeriod(!p.isPredicted); setIsPredPeriod(p.isPredicted); return }
        }
      }
      if (ps.length > 0 && s.lastPeriodDate) {
        const last = new Date(s.lastPeriodDate)
        const pred = new Date(last); pred.setDate(pred.getDate() + s.periodCycle)
        for (let i = 0; i < s.periodDuration; i++) {
          const d = new Date(pred); d.setDate(d.getDate() + i)
          if (formatDate(d) === selStr) { setIsPeriod(false); setIsPredPeriod(true); return }
        }
      }
      setIsPeriod(false); setIsPredPeriod(false)
    })
    db.hairWashRecords.where('date').equals(selStr).first().then((w) => {
      if (w) { setIsWash(true); setIsPredWash(false) }
      else if (s.lastHairWashDate) {
        const diff = Math.round((selectedDate!.getTime() - new Date(s.lastHairWashDate).getTime()) / 86400000)
        setIsWash(false); setIsPredWash(diff > 0 && diff % s.hairWashInterval === 0)
      } else { setIsWash(false); setIsPredWash(false) }
    })
  }, [selStr, gender, selectedDate])

  const handleToggle = useCallback(async (exerciseId: string) => {
    await toggleComplete(selStr, exerciseId)
    const updated = useScheduleStore.getState().futureSchedules.filter((s) => s.date === selStr)
    if (updated.length > 0 && updated.every((s) => s.completed)) {
      triggerCelebration()
    }
  }, [selStr, toggleComplete, triggerCelebration])

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
          if (formatDate(d) === selStr && !p.isPredicted) { await db.periodRecords.delete(p.id!); break }
        }
      }
    } else {
      await db.periodRecords.put({ startDate: selStr, duration: s.periodDuration, isPredicted: false })
      const preds = await db.periodRecords.filter((p) => p.isPredicted).toArray()
      await db.periodRecords.bulkDelete(preds.map((p) => p.id!))
    }
    setTimeout(() => regenerateSchedules(), 200)
  }

  const handleMarkWash = async () => {
    setIsWash(!isWash); setIsPredWash(false)
    if (isWash) {
      const w = await db.hairWashRecords.where('date').equals(selStr).first()
      if (w) await db.hairWashRecords.delete(w.id!)
    } else {
      await db.hairWashRecords.put({ date: selStr })
    }
    setTimeout(() => regenerateSchedules(), 200)
  }

  const [showAddForm, setShowAddForm] = useState(false)
  const [addId, setAddLocal] = useState('')
  const handleAdd = async () => {
    if (!addId) return
    await addScheduleItem(selStr, addId)
    setAddLocal('')
    setShowAddForm(false)
    setTimeout(() => regenerateSchedules(), 200)
  }

  const scheduleByDate = useMemo(() => {
    const map = new Map<string, { icon: string; name: string; type: 'cardio' | 'strength'; completed: boolean }[]>()
    for (const s of futureSchedules) {
      if (!map.has(s.date)) map.set(s.date, [])
      const ex = exercises.find((e) => e.id === s.exerciseId)
      if (ex) map.get(s.date)!.push({ icon: ex.icon, name: ex.name, type: ex.type, completed: s.completed })
    }
    return map
  }, [futureSchedules, exercises])

  const existingIds = new Set(daySchedules.map((s) => s.exerciseId))
  const addableExercises = exercises.filter((ex) => !existingIds.has(ex.id))

  return (
    <div>
      {/* 周几标签 */}
      <div className="grid grid-cols-7 mb-1">
        {dates.map((date, i) => {
          const dow = date.getDay()
          return (
            <div key={i} className="text-center text-sm font-medium py-1.5"
              style={{ color: dow === 0 || dow === 6 ? 'var(--color-primary)' : 'var(--color-text-light)' }}>
              {WEEKDAY_LABELS[dow]}
            </div>
          )
        })}
      </div>

      {/* 日期列 */}
      <div className="grid grid-cols-7 gap-0.5 mb-3">
        {dates.map((date, i) => {
          const dateStr = formatDate(date)
          const isSel = selectedDate && formatDate(selectedDate) === dateStr
          return (
            <DayCell
              key={i}
              date={date}
              isCurrentMonth={true}
              tall
              exercises={scheduleByDate.get(dateStr) || []}
              isPeriodDay={periodDates.has(dateStr)}
              isSelected={!!isSel}
              onClick={() => setSelectedDate(isSel ? null : date)}
            />
          )
        })}
      </div>

      {/* 内联详情 */}
      {selectedDate && (
        <div className="px-1 space-y-2 pb-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
            </span>
            {today && <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>今天</span>}
            {!today && (
              <button onClick={() => { setSelectedDate(null); goToToday() }}
                className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                回今天
              </button>
            )}
          </div>

          {/* 经期/洗头 */}
          {gender === 'female' && (
            <div className="flex gap-2 justify-center">
              {(isPeriod || isPredPeriod || !isFuture) && (
                <button onClick={handleMarkPeriod} className="px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: isPeriod ? 'var(--color-period)' : isPredPeriod ? 'color-mix(in srgb, var(--color-period) 30%, transparent)' : 'transparent',
                    border: isPeriod ? '2px solid var(--color-period)' : isPredPeriod ? '2px dashed var(--color-period)' : '1px solid var(--color-border)',
                  }}>
                  🩸 {isPeriod ? '取消' : isPredPeriod ? '预测经期' : '来月经'}
                </button>
              )}
              <button onClick={handleMarkWash} className="px-3 py-1.5 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: (isWash || isPredWash) ? 'var(--color-primary)' : 'transparent',
                  border: (isWash || isPredWash) ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  color: (isWash || isPredWash) ? 'white' : 'var(--color-text)',
                }}>
                💇 {isWash ? '取消' : (isWash || isPredWash) ? '洗头日' : '洗头'}
              </button>
            </div>
          )}

          {/* 课表 */}
          <div className="space-y-1">
            {daySchedules.map((s) => {
              const ex = exercises.find((e) => e.id === s.exerciseId)
              if (!ex) return null
              return (
                <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg"
                  style={{ backgroundColor: s.completed ? 'transparent' : ex.type === 'cardio' ? 'color-mix(in srgb, var(--color-cardio) 8%, transparent)' : 'color-mix(in srgb, var(--color-strength) 8%, transparent)', border: '1px solid var(--color-border)', opacity: s.completed ? 0.5 : 1 }}>
                  <button onClick={() => !isFuture && handleToggle(s.exerciseId)} disabled={isFuture}
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-sm"
                    style={{ borderColor: s.completed ? 'var(--color-success)' : 'var(--color-border)', backgroundColor: s.completed ? 'var(--color-success)' : 'transparent', color: 'white', opacity: isFuture ? 0.3 : 1 }}>
                    {s.completed && '✓'}
                  </button>
                  <span className="text-lg">{ex.icon}</span>
                  <span className="text-base font-medium flex-1" style={{ color: s.completed ? 'var(--color-completed)' : 'var(--color-text)', textDecoration: s.completed ? 'line-through' : 'none' }}>{ex.name}</span>
                  <button onClick={() => s.id != null && handleDelete(s.id)} style={{ color: 'var(--color-text-light)' }}><Trash2 size={14} /></button>
                </div>
              )
            })}
          </div>

          {/* 添加项目 */}
          {isFuture ? null : showAddForm ? (
            <div className="flex gap-2">
              <select value={addId} onChange={(e) => setAddLocal(e.target.value)}
                className="flex-1 px-2 py-1.5 rounded-lg text-sm border"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                <option value="">选择...</option>
                {addableExercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.icon} {ex.name}</option>
                ))}
              </select>
              <button onClick={handleAdd} disabled={!addId}
                className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ backgroundColor: 'var(--color-primary)', color: 'white', opacity: addId ? 1 : 0.4 }}>添加</button>
              <button onClick={() => { setShowAddForm(false); setAddLocal('') }} className="px-2 py-1.5 rounded-lg text-xs" style={{ color: 'var(--color-text-light)' }}>取消</button>
            </div>
          ) : (
            <button onClick={() => setShowAddForm(true)}
              className="w-full py-2 rounded-lg text-sm border-2 border-dashed flex items-center justify-center gap-1"
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
              <Plus size={16} /> 添加项目
            </button>
          )}

          {/* 身体数据 */}
          {!isFuture && (
            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-surface)' }}>
              <button onClick={() => setShowMeasure(!showMeasure)} className="w-full flex items-center justify-between text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                📊 身体数据
                {showMeasure ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {hasMeasure && !showMeasure && (
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  {MEASURE_FIELDS.map((f) => {
                    const val = measureData[f.key]
                    if (val == null) return null
                    return (
                      <div key={f.key} className="text-center p-2 rounded-lg" style={{ backgroundColor: 'var(--color-bg)' }}>
                        <div className="text-xs" style={{ color: 'var(--color-text-light)' }}>{f.label}</div>
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
                        <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-text-light)' }}>{f.label}</span>
                        <input type="number" step="0.1" placeholder="-"
                          value={measureData[f.key] ?? ''}
                          onChange={(e) => setMeasureData({ ...measureData, [f.key]: e.target.value ? Number(e.target.value) : undefined })}
                          className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-sm border text-center"
                          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                        />
                      </div>
                    ))}
                  </div>
                  <button onClick={async () => { await saveMeasurement(measureData); setHasMeasure(true); setShowMeasure(false) }}
                    className="w-full py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>保存数据</button>
                </div>
              )}
            </div>
          )}

          <Celebration visible={showCelebration} />
        </div>
      )}
    </div>
  )
}
