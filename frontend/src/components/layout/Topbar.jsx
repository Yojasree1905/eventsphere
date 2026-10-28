import { Bell, Shield } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export function Topbar({ title, subtitle }) {
  const { user } = useAuth()

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-20 px-8 flex items-center justify-between shadow-2xs">
      <div>
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {user?.is_superadmin && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Shield className="w-3.5 h-3.5" />
            Superadmin
          </span>
        )}
        <div className="h-4 w-px bg-slate-200" />
        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
        </button>
      </div>
    </header>
  )
}
