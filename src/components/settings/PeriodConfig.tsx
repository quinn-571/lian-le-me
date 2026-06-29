import { useSettingsStore } from '../../stores/useSettingsStore'
import { Calendar } from 'lucide-react'

export function PeriodConfig() {
  const { lastPeriodDate, periodDuration, periodCycle, setPeriodInfo } = useSettingsStore()

  return (
    <div className="space-y-3">
      {/* 上次经期日期 */}
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: 'var(--color-text)' }}>上次经期</span>
        <input
          type="date"
          value={lastPeriodDate}
          onChange={(e) => setPeriodInfo(e.target.value, periodDuration, periodCycle)}
          className="text-sm px-3 py-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--color-bg)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        />
      </div>

      {/* 持续天数 */}
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: 'var(--color-text)' }}>持续天数</span>
        <div className="flex items-center gap-2">
          <StepperButton
            label="-"
            onClick={() => setPeriodInfo(lastPeriodDate, Math.max(2, periodDuration - 1), periodCycle)}
          />
          <span className="w-5 text-center text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
            {periodDuration}
          </span>
          <StepperButton
            label="+"
            onClick={() => setPeriodInfo(lastPeriodDate, Math.min(10, periodDuration + 1), periodCycle)}
          />
          <span className="text-xs" style={{ color: 'var(--color-text-light)' }}>天</span>
        </div>
      </div>

      {/* 月经周期 */}
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: 'var(--color-text)' }}>月经周期</span>
        <div className="flex items-center gap-2">
          <StepperButton
            label="-"
            onClick={() => setPeriodInfo(lastPeriodDate, periodDuration, Math.max(20, periodCycle - 1))}
          />
          <span className="w-5 text-center text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
            {periodCycle}
          </span>
          <StepperButton
            label="+"
            onClick={() => setPeriodInfo(lastPeriodDate, periodDuration, Math.min(45, periodCycle + 1))}
          />
          <span className="text-xs" style={{ color: 'var(--color-text-light)' }}>天</span>
        </div>
      </div>
    </div>
  )
}

function StepperButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}
    >
      {label}
    </button>
  )
}
