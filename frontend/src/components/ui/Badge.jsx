import { STATUS_COLORS, REGISTRATION_STATUS_COLORS } from '../../utils/constants'
import { capitalize } from '../../utils/formatters'

export function Badge({ status, variant, children, className = '' }) {
  let style = 'bg-slate-100 text-slate-700'
  const key = (status || '').toLowerCase()

  if (STATUS_COLORS[key]) {
    style = STATUS_COLORS[key]
  } else if (REGISTRATION_STATUS_COLORS[key]) {
    style = REGISTRATION_STATUS_COLORS[key]
  } else if (variant === 'primary') {
    style = 'bg-blue-50 text-blue-700 border border-blue-200'
  } else if (variant === 'success') {
    style = 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  } else if (variant === 'danger') {
    style = 'bg-rose-50 text-rose-700 border border-rose-200'
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {children || capitalize(status)}
    </span>
  )
}
