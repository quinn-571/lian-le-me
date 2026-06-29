import { useSettingsStore } from '../../stores/useSettingsStore'
import { useScheduleStore } from '../../stores/useScheduleStore'

export function PerExerciseConfig() {
  const { exerciseFreqs, setExerciseFreq } = useSettingsStore()
  const { exercises } = useScheduleStore()

  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>
        设置每个项目一周练几次（0表示不安排）
      </p>
      {exercises.map((ex) => {
        const freq = exerciseFreqs[ex.id] ?? 0
        return (
          <div key={ex.id} className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
              <span>{ex.icon}</span>
              <span>{ex.name}</span>
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
            </span>
            <div className="flex items-center gap-1.5">
              <StepperBtn
                label="-"
                onClick={() => setExerciseFreq(ex.id, Math.max(0, freq - 1))}
              />
              <span
                className="w-5 text-center text-sm font-bold"
                style={{ color: freq > 0 ? 'var(--color-primary)' : 'var(--color-text-light)' }}
              >
                {freq}
              </span>
              <StepperBtn
                label="+"
                onClick={() => setExerciseFreq(ex.id, Math.min(7, freq + 1))}
              />
              <span className="text-[10px] ml-0.5" style={{ color: 'var(--color-text-light)' }}>
                次/周
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StepperBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-6 h-6 rounded-full text-sm font-bold flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}
    >
      {label}
    </button>
  )
}
