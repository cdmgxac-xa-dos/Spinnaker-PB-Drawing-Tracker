export interface DoughnutSlice {
  label: string
  value: number
  color: string
}

/** Lightweight doughnut chart via CSS conic-gradient — no charting library needed. */
export function DoughnutChart({
  slices,
  centerValue,
  centerLabel,
  size = 152,
}: {
  slices: DoughnutSlice[]
  centerValue: string | number
  centerLabel: string
  size?: number
}) {
  const total = slices.reduce((sum, s) => sum + s.value, 0)
  let cumulative = 0
  const stops = slices
    .filter((s) => s.value > 0)
    .map((s) => {
      const start = total > 0 ? (cumulative / total) * 360 : 0
      cumulative += s.value
      const end = total > 0 ? (cumulative / total) * 360 : 0
      return `${s.color} ${start}deg ${end}deg`
    })
  const gradient = stops.length > 0 ? `conic-gradient(${stops.join(', ')})` : 'conic-gradient(#E2E8F0 0deg 360deg)'

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="h-full w-full rounded-full" style={{ background: gradient }} />
      <div className="absolute inset-[20%] flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
        <span className="text-xl font-extrabold leading-none text-brand-ink">{centerValue}</span>
        <span className="mt-1 text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-brand-slate">
          {centerLabel}
        </span>
      </div>
    </div>
  )
}

export function DoughnutLegend({ slices }: { slices: DoughnutSlice[] }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0)
  return (
    <ul className="space-y-1.5">
      {slices.map((s) => (
        <li key={s.label} className="flex items-center gap-2 text-sm">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
          <span className="flex-1 text-brand-ink">{s.label}</span>
          <span className="font-semibold text-brand-ink">{s.value}</span>
          <span className="w-10 text-right text-xs text-brand-slate">
            {total > 0 ? Math.round((s.value / total) * 100) : 0}%
          </span>
        </li>
      ))}
    </ul>
  )
}
