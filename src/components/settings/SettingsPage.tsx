import { useState } from 'react'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { useThemeStore } from '../../stores/useThemeStore'
import { useScheduleStore } from '../../stores/useScheduleStore'
import { THEMES } from '../../utils/constants'
import { PeriodConfig } from './PeriodConfig'
import { HairWashConfig } from './HairWashConfig'
import { ExerciseManager } from './ExerciseManager'
import { PerExerciseConfig } from './PerExerciseConfig'
import { Palette, Dumbbell, Heart, Droplets, GripHorizontal } from 'lucide-react'

export function SettingsPage() {
  const settings = useSettingsStore()
  const { theme, setTheme } = useThemeStore()
  const regenerateSchedules = useScheduleStore((s) => s.regenerateSchedules)
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    await regenerateSchedules()
    setGenerating(false)
  }

  return (
    <div className="flex flex-col h-full pb-20 overflow-auto">
      {/* 页头 */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
          设置
        </h1>
      </div>

      <div className="px-4 space-y-3">
        {/* 🎨 主题配色 */}
        <Section icon={<Palette size={16} />} title="🎨 主题配色">
          <div className="flex gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as typeof theme)}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="w-9 h-9 rounded-full transition-all"
                  style={{
                    backgroundColor: t.colors.primary,
                    boxShadow:
                      theme === t.id
                        ? `0 0 0 2px var(--color-surface), 0 0 0 4px var(--color-primary)`
                        : 'none',
                    transform: theme === t.id ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
                <span className="text-[10px]" style={{ color: 'var(--color-text-light)' }}>
                  {t.emoji} {t.name}
                </span>
              </button>
            ))}
          </div>
        </Section>

        {/* 👤 性别 */}
        <Section icon={<Heart size={16} />} title="👤 性别">
          <div className="flex gap-2">
            {([
              ['female', '🚺 女'],
              ['male', '🚹 男'],
            ] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => settings.setGender(val)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor:
                    settings.gender === val ? 'var(--color-primary)' : 'var(--color-border)',
                  color: settings.gender === val ? 'white' : 'var(--color-text)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </Section>

        {/* 📊 训练频次 */}
        <Section icon={<Dumbbell size={16} />} title="📊 训练频次">
          <div className="space-y-3">
            <FreqRow
              label="有氧 一周几练"
              value={settings.cardioFreq}
              onChange={settings.setCardioFreq}
            />
            <FreqRow
              label="无氧 一周几练"
              value={settings.strengthFreq}
              onChange={settings.setStrengthFreq}
            />
          </div>
        </Section>

        {/* 各项目频次 */}
        <Section icon={<GripHorizontal size={16} />} title="📋 各项目频次">
          <PerExerciseConfig />
        </Section>

        {/* 出汗/舒缓标记 + 自定义项目 */}
        <Section icon={<span>💦</span>} title="🏷️ 项目标记与自定义">
          <ExerciseManager />
        </Section>

        {/* 🔴 仅女性：经期信息 */}
        {settings.gender === 'female' && (
          <>
            <Section icon={<Heart size={16} />} title="🩸 经期信息">
              <PeriodConfig />
            </Section>

            <Section icon={<Droplets size={16} />} title="💇 洗头日">
              <HairWashConfig />
            </Section>
          </>
        )}

        {/* 生成课表按钮 — 底部固定，避免遮挡内容 */}
        <div className="py-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all"
            style={{
              backgroundColor: generating ? 'var(--color-border)' : 'var(--color-primary)',
              color: generating ? 'var(--color-text-light)' : 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            {generating ? '⏳ 生成中...' : '🔄 重新生成课表'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== 小组件 =====

function Section({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: 'var(--color-surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center gap-2 mb-3 text-sm font-bold" style={{ color: 'var(--color-text)' }}>
        {icon}
        {title}
      </div>
      {children}
    </div>
  )
}

function FreqRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: 'var(--color-text)' }}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 rounded-full text-lg font-bold flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}
        >
          −
        </button>
        <span className="w-5 text-center font-bold" style={{ color: 'var(--color-primary)' }}>
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(7, value + 1))}
          className="w-8 h-8 rounded-full text-lg font-bold flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}
        >
          +
        </button>
      </div>
    </div>
  )
}
