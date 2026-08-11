import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarClock, CalendarDays, Clock } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import type { DrawingStatus } from '@/types'

export interface AgendaItem {
  id: string
  item_no: string
  description: string
  target_submission_date: string | null
  status: DrawingStatus
}

/**
 * Deadline reminder shown as a grouped agenda (Overdue / This Week / Next
 * 30 Days / Later) rather than a calendar grid — a target-date list is
 * inherently sparse (one date per drawing) and scanning "what's due soon"
 * matters more than seeing an empty month grid. Groups read top-to-bottom
 * in urgency order so the most pressing items are always first.
 */
export function TargetDateAgenda({ items, clickable = true }: { items: AgendaItem[]; clickable?: boolean }) {
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)
  const in7 = addDays(today, 7)
  const in30 = addDays(today, 30)

  const pending = items.filter((i) => !['approved', 'completed'].includes(i.status))
  const withDate = pending.filter((i) => i.target_submission_date).sort((a, b) =>
    (a.target_submission_date ?? '').localeCompare(b.target_submission_date ?? '')
  )
  const noDate = pending.filter((i) => !i.target_submission_date)

  const groups: { label: string; icon: typeof AlertTriangle; tone: string; rows: AgendaItem[] }[] = [
    { label: 'Overdue', icon: AlertTriangle, tone: 'red', rows: withDate.filter((i) => i.target_submission_date! < today) },
    {
      label: 'Due This Week',
      icon: Clock,
      tone: 'amber',
      rows: withDate.filter((i) => i.target_submission_date! >= today && i.target_submission_date! <= in7),
    },
    {
      label: 'Due In 30 Days',
      icon: CalendarClock,
      tone: 'blue',
      rows: withDate.filter((i) => i.target_submission_date! > in7 && i.target_submission_date! <= in30),
    },
    { label: 'Later', icon: CalendarDays, tone: 'slate', rows: withDate.filter((i) => i.target_submission_date! > in30) },
  ].filter((g) => g.rows.length > 0)

  if (pending.length === 0) {
    return <p className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-brand-slate">No open drawings with pending deadlines.</p>
  }

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.label}>
          <p className={`mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${TONE_TEXT[g.tone]}`}>
            <g.icon size={13} /> {g.label} ({g.rows.length})
          </p>
          <div className={`overflow-hidden rounded-lg border ${TONE_BORDER[g.tone]}`}>
            {g.rows.map((item, idx) => (
              <Row
                key={item.id}
                item={item}
                clickable={clickable}
                onClick={() => navigate(`/drawings/${item.id}`)}
                last={idx === g.rows.length - 1}
              />
            ))}
          </div>
        </div>
      ))}

      {noDate.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-brand-slate">
            No Target Date Set ({noDate.length})
          </p>
          <div className="overflow-hidden rounded-lg border border-brand-line">
            {noDate.map((item, idx) => (
              <Row key={item.id} item={item} clickable={clickable} onClick={() => navigate(`/drawings/${item.id}`)} last={idx === noDate.length - 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Row({
  item,
  clickable,
  onClick,
  last,
}: {
  item: AgendaItem
  clickable: boolean
  onClick: () => void
  last: boolean
}) {
  const content = (
    <>
      <span className="w-14 shrink-0 font-mono text-xs font-semibold text-brand-slate">{item.item_no}</span>
      <span className="min-w-0 flex-1 truncate text-sm text-brand-ink">{item.description}</span>
      <StatusBadge status={item.status} className="shrink-0" />
      <span className="w-24 shrink-0 text-right text-xs font-medium text-brand-slate">
        {item.target_submission_date ?? '—'}
      </span>
    </>
  )
  const cls = `flex w-full items-center gap-3 px-3 py-2 bg-white ${last ? '' : 'border-b border-brand-line'}`
  if (!clickable) {
    return <div className={cls}>{content}</div>
  }
  return (
    <button onClick={onClick} className={`${cls} text-left hover:bg-slate-50`}>
      {content}
    </button>
  )
}

const TONE_TEXT: Record<string, string> = {
  red: 'text-red-600',
  amber: 'text-amber-600',
  blue: 'text-sky-600',
  slate: 'text-brand-slate',
}
const TONE_BORDER: Record<string, string> = {
  red: 'border-red-200',
  amber: 'border-amber-200',
  blue: 'border-sky-200',
  slate: 'border-brand-line',
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
