import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'

const pageTitles = {
  '/': { title: 'Admin Dashboard', subtitle: 'Overview of events, attendance metrics, and quick actions' },
  '/events': { title: 'Event Management', subtitle: 'Create, edit, discover, and organize college events' },
  '/approvals': { title: 'Event Approvals', subtitle: 'Review and moderate pending event requests' },
  '/schedules': { title: 'Schedule Management', subtitle: 'Manage sessions, tracks, and agenda timeline' },
  '/participants': { title: 'Participants & Registrations', subtitle: 'Attendee registry, verification, and roll lists' },
  '/monitoring': { title: 'Event Monitoring', subtitle: 'Real-time telemetry, operations health, and activity logs' },
  '/portfolio': { title: 'Student Portfolio & Achievements', subtitle: 'Personal event participation timeline, verified badges, and credentials' },
  '/universities': { title: 'Participating Universities', subtitle: 'Collaborating institutions, campuses, and official directories' },
}

export function DashboardLayout() {
  const location = useLocation()
  const { title, subtitle } = pageTitles[location.pathname] || {
    title: 'Occasio Console',
    subtitle: 'Event operations administration',
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Topbar title={title} subtitle={subtitle} />
        <main className="p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
