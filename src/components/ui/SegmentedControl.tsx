interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div
      className="inline-flex rounded-lg p-1"
      style={{ backgroundColor: 'var(--color-border)' }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="px-4 py-2 text-sm font-medium rounded-md transition-all"
          style={{
            backgroundColor: value === opt.value ? 'var(--color-surface)' : 'transparent',
            color: value === opt.value ? 'var(--color-primary)' : 'var(--color-text-light)',
            boxShadow: value === opt.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
