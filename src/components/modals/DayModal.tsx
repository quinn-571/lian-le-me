import { useState, useMemo, useCallback, useEffect } from 'react'
import { useScheduleStore } from '../../stores/useScheduleStore'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { formatDate, isToday } from '../../utils/calendar'
import { useCompletionHandler } from '../../hooks/useCompletionHandler'
import { Celebration } from '../ui/Celebration'
import { db } from '../../db/dexie'
import { X, Trash2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { getMeasurementsByDate, saveMeasurement, type MeasurementRecord } from '../../db/dexie'

const MEASURE_FIELDS: { key: keyof MeasurementRecord; label: string }[] = [
  { key: 'weight', label: '体重(kg)' },
  { key: 'chest', label: '胸围(cm)' },
  { key: 'waist', label: '腰围(cm)' },
  { key: 'hips', label: '臀围(cm)' },
  { key: 'upperArm', label: '大臂(cm)' },
  { key: 'forearm', label: '小臂(cm)' },
  { key: 'thigh', label: '大腿(cm)' },
  { key: 'calf', label: '小腿(cm)' },
]

interface DayModalProps {
  date: Date
  onClose: () => void
}

const WEEKDAY = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function DayModal({ date, onClose }: DayModalProps) {
  const dateStr = formatDate(date)
  const today = isToday(date)
  const isPast = dateStr < formatDate(new Date())
  const isFuture = !isPast && !today

  const exercises = useScheduleStore((s) => s.exercises)
  const futureSchedules = useScheduleStore((s) => s.futureSchedules)
  const toggleComplete = useScheduleStore((s) => s.toggleComplete)
  const addScheduleItem = useScheduleStore((s) => s.addScheduleItem)
  const removeScheduleItem = useScheduleStore((s) => s.removeScheduleItem)
  const regenerateSchedules = useScheduleStore((s) => s.regenerateSchedules)
  const gender = useSettingsStore((s) => s.gender)
  const { showCelebration, triggerCelebration } = useCompletionHandler()

  const daySchedules = useMemo(
    () => futureSchedules.filter((s) => s.date === dateStr),
    [futureSchedules, dateStr],
  )

  const [showAdd, setShowAdd] = useState(false)
  const [addId, setAddId] = useState('')
  const [showMeasure, setShowMeasure] = useState(false)
  const [measureData, setMeasureData] = useState<MeasurementRecord>({ date: dateStr })
  const [hasMeasure, setHasMeasure] = useState(false)

  useEffect(() => {
    getMeasurementsByDate(dateStr).then((m) => {
      if (m) { setMeasureData(m); setHasMeasure(true) }
      else { setMeasureData({ date: dateStr }); setHasMeasure(false) }
    })
  }, [dateStr])

  // 当天已有的项目id集合
  const existingIds = new Set(daySchedules.map((s) => s.exerciseId))

  // 可选添加的项目（还没安排的同类型最多加1个）
  const addableExercises = exercises.filter(
    (ex) => !existingIds.has(ex.id),
  )

  const handleToggle = useCallback(async (exerciseId: string) => {
    await toggleComplete(dateStr, exerciseId)
    // 检查是否全部完成
    const updated = useScheduleStore.getState().futureSchedules
      .filter((s) => s.date === dateStr)
    if (updated.length > 0 && updated.every((s) => s.completed)) {
      triggerCelebration()
    }
  }, [dateStr, toggleComplete, triggerCelebration])

  const handleAdd = async () => {
    if (!addId) return
    await addScheduleItem(dateStr, addId)
    setAddId('')
    setShowAdd(false)
    // 加完后自动重排后续课表，严格遵守排课原则
    setTimeout(() => regenerateSchedules(), 200)
  }

  const handleDelete = async (scheduleId: number) => {
    await removeScheduleItem(scheduleId)
    // 删完后自动重排后续课表
    setTimeout(() => regenerateSchedules(), 200)
  }

  const handleReset = async () => {
    for (const s of daySchedules) {
      if (s.isManuallyAdded) await removeScheduleItem(s.id!)
    }
    await regenerateSchedules()
  }

  const handleMarkPeriod = async () => {
    // 立即切换UI，提供即时反馈
    setIsPeriodMarked(!isPeriodMarked)
    const settings = useSettingsStore.getState()
    const allPeriods = await db.periodRecords.orderBy('startDate').toArray()
    const actualPeriods = allPeriods.filter((p) => !p.isPredicted)
    const predictedPeriods = allPeriods.filter((p) => p.isPredicted)

    // 检查今天是否已在某个经期内
    const inPeriod = allPeriods.find((p) => {
      const s = new Date(p.startDate)
      for (let i = 0; i < p.duration; i++) {
        const d = new Date(s); d.setDate(d.getDate() + i)
        if (formatDate(d) === dateStr) return true
      }
      return false
    })

    if (inPeriod) {
      // 已在经期内 → 删除这个经期记录
      await db.periodRecords.delete(inPeriod.id!)
    } else {
      // 查找最近的预测经期
      const nearPredicted = predictedPeriods.find((p) => {
        const s = new Date(p.startDate)
        const diff = Math.abs(s.getTime() - date.getTime()) / 86400000
        return diff <= 7 // 7天内
      })

      if (nearPredicted) {
        // 提前了 → 用今天作为新周期首日
        await db.periodRecords.delete(nearPredicted.id!)
        await db.periodRecords.put({
          startDate: dateStr,
          duration: settings.periodDuration,
          isPredicted: false,
        })
      } else {
        // 检查是否在某次经期结束后5天内
        const nearEnd = actualPeriods.find((p) => {
          const end = new Date(p.startDate)
          end.setDate(end.getDate() + p.duration - 1)
          const diff = (date.getTime() - end.getTime()) / 86400000
          return diff >= 0 && diff <= 5
        })
        if (nearEnd) {
          // 延长这次经期
          const start = new Date(nearEnd.startDate)
          const newDuration = Math.round((date.getTime() - start.getTime()) / 86400000) + 1
          await db.periodRecords.update(nearEnd.id!, { duration: newDuration })
        } else {
          // 新经期
          await db.periodRecords.put({
            startDate: dateStr,
            duration: settings.periodDuration,
            isPredicted: false,
          })
          // 删除旧预测
          // 删除预测经期
          const preds = await db.periodRecords.filter((p) => p.isPredicted).toArray()
          await db.periodRecords.bulkDelete(preds.map((p) => p.id!))
        }
      }
    }
    // 重新生成课表
    setTimeout(() => regenerateSchedules(), 200)
  }

  const handleMarkHairWash = async () => {
    setIsWashMarked(!isWashMarked)
    const existing = await db.hairWashRecords.where('date').equals(dateStr).first()
    if (existing) {
      await db.hairWashRecords.delete(existing.id!)
    } else {
      await db.hairWashRecords.put({ date: dateStr })
    }
    setTimeout(() => regenerateSchedules(), 200)
  }

  // 检查经期状态：实际标记 / 预测 / 无
  const [isPeriodMarked, setIsPeriodMarked] = useState(false)
  const [isPredictedPeriod, setIsPredictedPeriod] = useState(false)
  const [isWashMarked, setIsWashMarked] = useState(false)
  const [isPredictedWash, setIsPredictedWash] = useState(false)
  useEffect(() => {
    if (gender === 'female') {
      db.periodRecords.toArray().then((periods) => {
        for (const p of periods) {
          const s = new Date(p.startDate)
          for (let i = 0; i < p.duration; i++) {
            const d = new Date(s); d.setDate(d.getDate() + i)
            if (formatDate(d) === dateStr) {
              setIsPeriodMarked(!p.isPredicted)
              setIsPredictedPeriod(p.isPredicted)
              return
            }
          }
        }
        setIsPeriodMarked(false)
        setIsPredictedPeriod(false)
      })
    }
  }, [dateStr, gender])
  useEffect(() => {
    db.hairWashRecords.where('date').equals(dateStr).first().then((w) => {
      if (w) { setIsWashMarked(true); setIsPredictedWash(false); return }
      // 检查是否为预测洗头日
      const s = useSettingsStore.getState()
      if (s.gender === 'female' && s.lastHairWashDate && s.hairWashInterval > 0) {
        const last = new Date(s.lastHairWashDate)
        const current = date
        const diffDays = Math.round((current.getTime() - last.getTime()) / 86400000)
        if (diffDays > 0 && diffDays % s.hairWashInterval === 0) {
          setIsWashMarked(false); setIsPredictedWash(true); return
        }
      }
      setIsWashMarked(false); setIsPredictedWash(false)
    })
  }, [dateStr])

  const allCompleted = daySchedules.length > 0 && daySchedules.every((s) => s.completed)

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto px-4 py-12"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="mx-auto rounded-2xl px-5 pt-5 pb-6"
        style={{ backgroundColor: 'var(--color-surface)', maxWidth: '420px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              {date.getMonth() + 1}月{date.getDate()}日
            </span>
            <span className="text-base" style={{ color: 'var(--color-text-light)' }}>
              {WEEKDAY[date.getDay()]}
            </span>
            {today && (
              <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                今天
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* ➕ 添加项目按钮 */}
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
            >
              {showAdd ? '−' : '+'}
            </button>
            <button onClick={onClose} className="p-1" style={{ color: 'var(--color-text-light)' }}>
              <X size={22} />
            </button>
          </div>
        </div>
        {allCompleted && (
          <div className="text-sm mb-3" style={{ color: 'var(--color-success)' }}>
            ✅ 全部完成
          </div>
        )}

        {/* 经期/洗头标记（仅女性） */}
        {gender === 'female' && (
          <div className="flex gap-2 mb-3">
            {/* 经期按钮：实际→取消 / 预测→预测的经期 / 今/过→标记 / 未来非预测→隐藏 */}
            {(isPeriodMarked || isPredictedPeriod || !isFuture) && (
              <button
                onClick={handleMarkPeriod}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  backgroundColor: isPeriodMarked ? 'var(--color-period)' : isPredictedPeriod ? 'color-mix(in srgb, var(--color-period) 30%, transparent)' : 'transparent',
                  border: isPeriodMarked ? '2px solid var(--color-period)' : isPredictedPeriod ? '2px dashed var(--color-period)' : '2px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >
                🩸 {isPeriodMarked ? '取消经期' : isPredictedPeriod ? '预测的经期' : today ? '今日来月经' : '这天来月经'}
              </button>
            )}
            <button
              onClick={handleMarkHairWash}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: (isWashMarked || isPredictedWash) ? 'var(--color-primary)' : 'transparent',
                border: (isWashMarked || isPredictedWash) ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                color: (isWashMarked || isPredictedWash) ? 'white' : 'var(--color-text)',
              }}
            >
              💇 {isWashMarked ? '取消洗头' : (isWashMarked || isPredictedWash) ? '这天洗头' : today ? '今日洗头' : '这天洗头'}
            </button>
          </div>
        )}

        {/* 课表项目 */}
        <div className="space-y-2">
          {daySchedules.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-light)' }}>
              该日暂无课表
            </p>
          )}
          {daySchedules.map((s) => {
            const ex = exercises.find((e) => e.id === s.exerciseId)
            if (!ex) return null
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  backgroundColor: s.completed
                    ? 'transparent'
                    : ex.type === 'cardio'
                      ? 'color-mix(in srgb, var(--color-cardio) 8%, transparent)'
                      : 'color-mix(in srgb, var(--color-strength) 8%, transparent)',
                  border: '1px solid var(--color-border)',
                  opacity: s.completed ? 0.5 : 1,
                }}
              >
                {/* 勾选框（未来日期禁用） */}
                <button
                  onClick={() => !isFuture && handleToggle(s.exerciseId)}
                  disabled={isFuture}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    s.completed ? 'border-transparent' : ''
                  }`}
                  style={{
                    borderColor: s.completed ? 'var(--color-success)' : 'var(--color-border)',
                    backgroundColor: s.completed ? 'var(--color-success)' : 'transparent',
                    color: 'white',
                    opacity: isFuture ? 0.3 : 1,
                    cursor: isFuture ? 'not-allowed' : 'pointer',
                  }}
                >
                  {s.completed && '✓'}
                </button>

                <span className="text-lg">{ex.icon}</span>
                <span
                  className="text-base font-medium flex-1"
                  style={{
                    color: s.completed ? 'var(--color-completed)' : 'var(--color-text)',
                    textDecoration: s.completed ? 'line-through' : 'none',
                  }}
                >
                  {ex.name}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor:
                      ex.type === 'cardio'
                        ? 'color-mix(in srgb, var(--color-cardio) 15%, transparent)'
                        : 'color-mix(in srgb, var(--color-strength) 15%, transparent)',
                    color: ex.type === 'cardio' ? 'var(--color-cardio)' : 'var(--color-strength)',
                  }}
                >
                  {ex.type === 'cardio' ? '有氧' : '无氧'}
                </span>

                {/* 删除按钮（手动添加项目可删） */}
                <button
                  onClick={() => s.id != null && handleDelete(s.id)}
                  className="p-1"
                  style={{ color: 'var(--color-text-light)' }}
                  title="删除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>

        {/* 添加项目表单 */}
        {showAdd && (
          <div className="mt-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
            <div className="flex gap-2 items-center">
              <select
                value={addId}
                onChange={(e) => setAddId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-base border"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                <option value="">选择项目...</option>
                {addableExercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.icon} {ex.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAdd}
                disabled={!addId}
                className="px-5 py-2 rounded-lg text-sm font-bold"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white', opacity: addId ? 1 : 0.4 }}
              >
                添加
              </button>
            </div>
          </div>
        )}

        {/* 身体数据（仅今/过去可编辑） */}
        <div className="mt-3 rounded-xl p-4" style={{ backgroundColor: 'var(--color-surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
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
                    <div className="text-xs" style={{ color: 'var(--color-text-light)' }}>{f.label.replace(/\(.*\)/, '')}</div>
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
              <button onClick={async () => { await saveMeasurement(measureData); setHasMeasure(true); setShowMeasure(false) }}
                className="w-full py-2 rounded-lg text-sm font-bold"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                保存数据
              </button>
            </div>
          )}
        </div>

        {/* 重置按钮 */}
        {daySchedules.some((s) => s.isManuallyAdded) && (
          <button
            onClick={handleReset}
            className="mt-3 w-full py-2.5 rounded-lg text-sm flex items-center justify-center gap-1.5"
            style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-light)' }}
          >
            <RefreshCw size={14} />
            重置为系统安排
          </button>
        )}

        {/* 庆祝动画 */}
        <Celebration visible={showCelebration} />
      </div>
    </div>
  )
}
