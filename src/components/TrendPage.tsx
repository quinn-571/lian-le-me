import { useState, useEffect, useMemo } from 'react'
import { getAllMeasurements, type MeasurementRecord } from '../db/dexie'
import { TrendChart } from './ui/TrendChart'
import { X } from 'lucide-react'

interface TrendPageProps {
  onClose: () => void
}

const THEME_COLORS = ['#FF6B35', '#3B82F6', '#22C55E', '#8B5CF6', '#F472B6', '#F59E0B', '#06B6D4', '#EF4444']

const FIELDS: { key: keyof MeasurementRecord; label: string; unit: string }[] = [
  { key: 'weight', label: '体重', unit: 'kg' },
  { key: 'chest', label: '胸围', unit: 'cm' },
  { key: 'waist', label: '腰围', unit: 'cm' },
  { key: 'hips', label: '臀围', unit: 'cm' },
  { key: 'upperArm', label: '大臂', unit: 'cm' },
  { key: 'forearm', label: '小臂', unit: 'cm' },
  { key: 'thigh', label: '大腿', unit: 'cm' },
  { key: 'calf', label: '小腿', unit: 'cm' },
]

export function TrendPage({ onClose }: TrendPageProps) {
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([])
  const [period, setPeriod] = useState<'1m' | '3m' | 'all'>('3m')

  useEffect(() => {
    getAllMeasurements().then(setMeasurements)
  }, [])

  // 按时间筛选
  const filtered = useMemo(() => {
    if (period === 'all') return measurements
    const now = new Date()
    const cutoff = new Date()
    if (period === '1m') cutoff.setMonth(now.getMonth() - 1)
    else cutoff.setMonth(now.getMonth() - 3)
    return measurements.filter((m) => new Date(m.date) >= cutoff)
  }, [measurements, period])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* 头部 */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between" style={{ backgroundColor: 'var(--color-bg)' }}>
        <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>📈 趋势图</h1>
        <div className="flex items-center gap-2">
          {(['1m', '3m', 'all'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: period === p ? 'var(--color-primary)' : 'var(--color-border)',
                color: period === p ? 'white' : 'var(--color-text)',
              }}>
              {p === '1m' ? '1月' : p === '3m' ? '3月' : '全部'}
            </button>
          ))}
          <button onClick={onClose} className="p-1 ml-1" style={{ color: 'var(--color-text-light)' }}>
            <X size={22} />
          </button>
        </div>
      </div>

      {/* 图表 */}
      <div className="px-3 pb-8 space-y-4">
        {filtered.length < 2 ? (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--color-text-light)' }}>
            📊 数据不足，至少需要2天的记录才能生成趋势图。<br />
            去日视图或详情弹窗添加身体数据吧！
          </div>
        ) : (
          FIELDS.map((f, i) => {
            const data = filtered
              .filter((m) => m[f.key] != null)
              .map((m) => ({ date: m.date, value: m[f.key] as number }))
              .sort((a, b) => a.date.localeCompare(b.date))
            if (data.length < 2) return null
            return (
              <TrendChart
                key={f.key}
                data={data}
                label={f.label}
                unit={f.unit}
                color={THEME_COLORS[i]}
                height={180}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
