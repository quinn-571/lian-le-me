import { useSettingsStore } from '../../stores/useSettingsStore'

const INTERVAL_LABELS: Record<number, string> = {
  1: '每天',
  2: '隔天',
  3: '每3天',
  4: '每4天',
  5: '每5天',
}

export function HairWashConfig() {
  const { hairWashInterval, setHairWashInterval, lastHairWashDate, setLastHairWashDate } = useSettingsStore()

  return (
    <div className="space-y-3">
      {/* 上次洗头日期 */}
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: 'var(--color-text)' }}>上次洗头</span>
        <input
          type="date"
          value={lastHairWashDate}
          onChange={(e) => setLastHairWashDate(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--color-bg)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        />
      </div>

      {/* 间隔选择 */}
      <div>
        <p className="text-xs mb-2" style={{ color: 'var(--color-text-light)' }}>
          洗头频率（大出汗项目优先安排在洗头日）
        </p>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setHairWashInterval(n)}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: hairWashInterval === n ? 'var(--color-primary)' : 'var(--color-border)',
                color: hairWashInterval === n ? 'white' : 'var(--color-text)',
              }}
            >
              {INTERVAL_LABELS[n]}
            </button>
          ))}
        </div>
      </div>

      {lastHairWashDate && (
        <p className="text-xs" style={{ color: 'var(--color-primary)' }}>
          {hairWashInterval === 1
            ? '每天都是洗头日，优先安排大出汗项目'
            : `从 ${lastHairWashDate} 起每隔${hairWashInterval - 1}天洗一次头`}
        </p>
      )}
    </div>
  )
}
