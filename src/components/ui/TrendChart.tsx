import { useMemo } from 'react'

interface DataPoint {
  date: string
  value: number
}

interface TrendChartProps {
  data: DataPoint[]
  label: string
  unit: string
  color?: string
  height?: number
}

export function TrendChart({ data, label, unit, color = '#FF6B35', height = 200 }: TrendChartProps) {
  const pathData = useMemo(() => {
    if (data.length < 2) return null

    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date))
    const values = sorted.map((d) => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const padding = 10

    const w = 320
    const h = height - padding * 2
    const stepX = (w - padding * 2) / (sorted.length - 1)

    const points = sorted.map((d, i) => ({
      x: padding + i * stepX,
      y: h - ((d.value - min) / range) * (h - padding * 2) + padding,
      date: d.date,
      value: d.value,
    }))

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

    return { points, linePath, min, max, w, h: height }
  }, [data, height])

  if (!pathData || data.length < 2) {
    return (
      <div className="rounded-xl p-4 text-center text-sm" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-light)' }}>
        {label}：数据不足，至少需要2条记录
      </div>
    )
  }

  const { points, linePath, min, max, w, h } = pathData

  return (
    <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{label}</span>
        <span className="text-xs" style={{ color: 'var(--color-text-light)' }}>
          {min} – {max} {unit}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: h }}>
        {/* 网格线 */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const y = 10 + (h - 20) * (1 - frac)
          return (
            <g key={i}>
              <line x1={10} y1={y} x2={w - 10} y2={y}
                stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="3,3" />
              <text x={w - 10} y={y - 3} textAnchor="end" fontSize="9"
                fill="var(--color-text-light)">
                {(min + (max - min) * frac).toFixed(1)}
              </text>
            </g>
          )
        })}

        {/* 折线 */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* 数据点 */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="var(--color-surface)" stroke={color} strokeWidth="2" />
            {/* 日期标签（每隔一个显示） */}
            {i % Math.max(1, Math.floor(points.length / 6)) === 0 && (
              <text x={p.x} y={h - 2} textAnchor="middle" fontSize="8" fill="var(--color-text-light)">
                {p.date.slice(5)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}
