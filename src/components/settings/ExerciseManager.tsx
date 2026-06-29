import { useState } from 'react'
import { useScheduleStore } from '../../stores/useScheduleStore'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { SPORT_EMOJIS } from '../../utils/constants'
import { Plus, Trash2, Check } from 'lucide-react'

export function ExerciseManager() {
  const exercises = useScheduleStore((s) => s.exercises)
  const addExercise = useScheduleStore((s) => s.addExercise)
  const updateExercise = useScheduleStore((s) => s.updateExercise)
  const removeExercise = useScheduleStore((s) => s.removeExercise)
  const gender = useSettingsStore((s) => s.gender)

  const [showAdd, setShowAdd] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'cardio' | 'strength'>('cardio')
  const [newIcon, setNewIcon] = useState('🏃')

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) return
    setError(null)
    const id = 'custom_' + Date.now()
    try {
      await addExercise({
        id,
        name,
        type: newType,
        icon: newIcon,
        isPreset: false,
        isSweaty: false,
        isGentle: false,
        order: exercises.length,
      })
      setNewName('')
      setNewIcon('🏃')
      setNewType('cardio')
      setShowAdd(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('添加失败:', err)
      setError(msg)
    }
  }

  return (
    <div className="space-y-2">
      {/* 注释说明（仅女性） */}
      {gender === 'female' && (
        <div
          className="text-xs px-3 py-2 rounded-lg space-y-1"
          style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-light)' }}
        >
          <div>💦 <strong>大出汗</strong> — 开启后该项目优先安排在洗头日</div>
          <div>🌸 <strong>舒缓</strong> — 开启后该项目优先安排在经后期</div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
          ❌ {error}
        </div>
      )}

      {/* 项目列表 */}
      {exercises.map((ex) => (
        <div key={ex.id} className="flex items-center gap-2 py-2 px-2 rounded-lg">
          <button
            onClick={() => setShowEmojiPicker(showEmojiPicker === ex.id ? null : ex.id)}
            className="text-lg w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ backgroundColor: 'var(--color-bg)' }}
          >
            {ex.icon}
          </button>

          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
              {ex.name}
            </span>
          </div>

          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{
              backgroundColor: ex.type === 'cardio'
                ? 'color-mix(in srgb, var(--color-cardio) 15%, transparent)'
                : 'color-mix(in srgb, var(--color-strength) 15%, transparent)',
              color: ex.type === 'cardio' ? 'var(--color-cardio)' : 'var(--color-strength)',
            }}
          >
            {ex.type === 'cardio' ? '有氧' : '无氧'}
          </span>

          {gender === 'female' && (
            <>
              <button
                onClick={() => updateExercise({ ...ex, isSweaty: !ex.isSweaty })}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: ex.isSweaty ? 'var(--color-cardio)' : 'var(--color-border)',
                  color: ex.isSweaty ? 'white' : 'var(--color-text-light)',
                  fontSize: '14px',
                  border: ex.isSweaty ? '2px solid var(--color-cardio)' : '2px solid transparent',
                }}
                title="大出汗"
              >
                💦
              </button>
              <button
                onClick={() => updateExercise({ ...ex, isGentle: !ex.isGentle })}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: ex.isGentle ? 'var(--color-strength)' : 'var(--color-border)',
                  color: ex.isGentle ? 'white' : 'var(--color-text-light)',
                  fontSize: '14px',
                  border: ex.isGentle ? '2px solid var(--color-strength)' : '2px solid transparent',
                }}
                title="舒缓"
              >
                🌸
              </button>
            </>
          )}

          {!ex.isPreset && (
            <button
              onClick={() => {
                if (confirm(`确定删除"${ex.name}"？`)) removeExercise(ex.id)
              }}
              className="flex-shrink-0 p-1 rounded"
              style={{ color: '#EF4444' }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}

      {/* 添加新项目表单 */}
      {showAdd ? (
        <div
          className="space-y-3 p-3 rounded-xl border-2"
          style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-primary)' }}
        >
          <div className="flex gap-2 items-center">
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(showEmojiPicker === 'new' ? null : 'new')}
                className="text-lg w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0 border-2"
                style={{ borderColor: 'var(--color-primary)' }}
              >
                {newIcon}
              </button>
              {showEmojiPicker === 'new' && (
                <div
                  className="absolute z-30 left-0 top-full mt-1 p-2 rounded-xl shadow-xl grid grid-cols-6 gap-1 w-64"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  {SPORT_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => { setNewIcon(emoji); setShowEmojiPicker(null) }}
                      className="w-9 h-9 text-lg flex items-center justify-center rounded-lg hover:opacity-70"
                      style={{ backgroundColor: newIcon === emoji ? 'var(--color-primary-light)' : 'transparent' }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="输入项目名称"
              className="flex-1 px-3 py-2.5 rounded-lg text-sm border-2"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            />
          </div>

          <div className="flex gap-2">
            {(['cardio', 'strength'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setNewType(t)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1"
                style={{
                  backgroundColor: newType === t
                    ? t === 'cardio'
                      ? 'color-mix(in srgb, var(--color-cardio) 20%, transparent)'
                      : 'color-mix(in srgb, var(--color-strength) 20%, transparent)'
                    : 'var(--color-border)',
                  color: newType === t
                    ? t === 'cardio' ? 'var(--color-cardio)' : 'var(--color-strength)'
                    : 'var(--color-text-light)',
                  border: newType === t
                    ? t === 'cardio' ? '2px solid var(--color-cardio)' : '2px solid var(--color-strength)'
                    : '2px solid transparent',
                }}
              >
                {newType === t && <Check size={14} />}
                {t === 'cardio' ? '有氧' : '无氧'}
              </button>
            ))}
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 rounded-lg text-xs border"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-light)', backgroundColor: 'transparent' }}
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              className="px-4 py-1.5 rounded-lg text-xs font-bold"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white', opacity: newName.trim() ? 1 : 0.4 }}
              disabled={!newName.trim()}
            >
              添加
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setShowAdd(true); setError(null) }}
          className="flex items-center gap-1.5 text-sm py-2.5 px-3 rounded-lg w-full justify-center border-2 border-dashed"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-light)' }}
        >
          <Plus size={14} />
          添加自定义项目
        </button>
      )}
    </div>
  )
}
