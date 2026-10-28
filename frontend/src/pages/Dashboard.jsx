import { useEffect, useState } from 'react'
import { Calendar, CheckCircle2, Clock, Users, ArrowUpRight, Plus, Activity } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { getStats, getRecentActivity } from '../api/monitoring'
import { useAuth } from '../hooks/useAuth'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { formatDateTime } from '../utils/formatters'

export function Dashboard() {
  const { user } = useAuth()
  const role = (user?.role || '').toLowerCase()
  const isAdmin = role === 'admin' || user?.is_superadmin

  if (user && !isAdmin) {
    if (role === 'judge') return <Navigate to="/evaluations" replace />
    return <Navigate to="/events" replace />
  }

  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getStats(), getRecentActivity(6)])
      .then(([statsRes, actRes]) => {
        setStats(statsRes.data)
        setActivity(actRes.data)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-400/20 mb-2">
            Operations Center
          </span>
          <h2 className="text-xl font-bold tracking-tight">College Fest & Event Management Hub</h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Monitor approvals, schedules, and active registrations seamlessly across multi-campus institutions.
          </p>
        </div>
        <div className="mt-4 flex gap-3 relative z-10">
          <Link to="/events">
            <Button size="sm" variant="primary" icon={Plus}>
              Create Event
            </Button>
          </Link>
          <Link to="/approvals">
            <Button size="sm" variant="outline" className="text-slate-800 bg-white/90 hover:bg-white border-none">
              Review Approvals
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Events</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats?.total_events ?? '—'}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-emerald-600 font-semibold">{stats?.events_by_status?.approved ?? 0}</span> approved
          </div>
        </Card>

        <Card className="hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Approvals</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats?.events_by_status?.pending ?? 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <Link to="/approvals" className="text-blue-600 font-medium hover:underline flex items-center gap-0.5">
              Review backlog <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        <Card className="hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Participants</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats?.total_participants ?? '—'}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            Across participating universities
          </div>
        </Card>

        <Card className="hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Registrations</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats?.total_registrations ?? '—'}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-emerald-600 font-semibold">{stats?.confirmed_registrations ?? 0}</span> confirmed
          </div>
        </Card>
      </div>

      {/* Grid: Activity and Quick View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Events" subtitle="Latest additions to the directory">
          <div className="space-y-3">
            {activity?.recent_events?.length ? (
              activity.recent_events.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">{ev.title}</h4>
                    <span className="text-xs text-slate-400">{formatDateTime(ev.updated_at)}</span>
                  </div>
                  <Badge status={ev.status} />
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No recent event entries.</p>
            )}
          </div>
        </Card>

        <Card title="Live Registration Feed" subtitle="Real-time participant admissions">
          <div className="space-y-3">
            {activity?.recent_registrations?.length ? (
              activity.recent_registrations.map((rg) => (
                <div key={rg.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-blue-600">{rg.registration_number}</span>
                      <span className="text-xs text-slate-500">Event #{rg.event_id}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{formatDateTime(rg.registered_at)}</span>
                  </div>
                  <Badge status={rg.status} />
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No registration actions recorded.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
