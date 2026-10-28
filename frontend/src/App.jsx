import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { DashboardLayout } from './layouts/DashboardLayout'

// Existing Core Pages (Modules 1, 2, 8)
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { EventList } from './pages/events/EventList'
import { EventApprovals } from './pages/EventApprovals'
import { ScheduleManagement } from './pages/ScheduleManagement'
import { Participants } from './pages/Participants'
import { EventMonitoring } from './pages/EventMonitoring'

// EventSphere Lifecycle Pages (Modules 4, 5, 9)
import { Teams } from './pages/Teams'
import { AttendanceScanner } from './pages/AttendanceScanner'
import { Recommendations } from './pages/Recommendations'
import { Portfolio } from './pages/Portfolio'
import { Universities } from './pages/Universities'

// Evaluation, Leaderboards & Certificates (Modules 6, 7)
import { Evaluations } from './pages/Evaluations'
import { Leaderboard } from './pages/Leaderboard'
import { Certificates } from './pages/Certificates'
import { PublicVerify } from './pages/PublicVerify'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<Login />} />

          {/* Public Zero-Login Certificate QR Verification Routes (Module 7) */}
          <Route path="/verify" element={<PublicVerify />} />
          <Route path="/verify/:certificateId" element={<PublicVerify />} />

          {/* Protected Management & Participant Console Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/events" element={<EventList />} />
              <Route path="/approvals" element={<EventApprovals />} />
              <Route path="/schedules" element={<ScheduleManagement />} />
              <Route path="/participants" element={<Participants />} />
              <Route path="/monitoring" element={<EventMonitoring />} />

              {/* EventSphere Participation & Teams */}
              <Route path="/teams" element={<Teams />} />
              <Route path="/attendance" element={<AttendanceScanner />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/universities" element={<Universities />} />

              {/* Judging, Leaderboards & Credentialing */}
              <Route path="/evaluations" element={<Evaluations />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/certificates" element={<Certificates />} />
            </Route>
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
