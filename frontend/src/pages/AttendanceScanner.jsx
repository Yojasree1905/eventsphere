import { useState, useEffect } from 'react'
import { QrCode, CheckCircle2, UserCheck, ShieldCheck, RefreshCw, Smartphone, Camera, Lock } from 'lucide-react'
import { getEvents } from '../api/events'
import { useAuth } from '../hooks/useAuth'
import api from '../api/axios'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

export function AttendanceScanner() {
  const { user } = useAuth()
  const role = (user?.role || 'participant').toLowerCase()
  const isOrganizer = role === 'organizer' || role === 'admin' || user?.is_superadmin
  const isStudent = role === 'participant'

  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [tokenData, setTokenData] = useState(null)
  
  // Student scanning state
  const [scannedTokenInput, setScannedTokenInput] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getEvents().then((res) => {
      const evts = res.data || res || []
      setEvents(evts)
      if (evts.length > 0) setSelectedEventId(evts[0].id)
    }).catch(console.error)
  }, [])

  const loadQrToken = (eventId) => {
    if (!eventId) return
    api.get(`/attendance/qr-token/${eventId}`)
      .then((res) => setTokenData(res.data))
      .catch(console.error)
  }

  useEffect(() => {
    if (selectedEventId && isOrganizer) {
      loadQrToken(selectedEventId)
    }
  }, [selectedEventId, isOrganizer])

  const handleStudentScan = async (e) => {
    e.preventDefault()
    if (!selectedEventId || !scannedTokenInput) return
    setLoading(true)
    setScanResult(null)
    try {
      // Find participant id for logged-in user
      const pRes = await api.get('/participants', { params: { search: user?.email } })
      const participants = pRes.data || []
      let pId = participants.find((p) => p.email === user?.email)?.id

      if (!pId) {
        const createdP = await api.post('/participants', {
          full_name: user?.full_name || 'Student',
          email: user?.email,
          college_name: user?.college_name || 'University',
          department: user?.department || 'General',
        })
        pId = createdP.data.id
      }

      const res = await api.post('/attendance/check-in', {
        event_id: Number(selectedEventId),
        participant_id: pId,
        qr_token: scannedTokenInput.trim(),
      })
      setScanResult(res.data)
      setScannedTokenInput('')
    } catch (err) {
      alert(err.response?.data?.detail || 'Attendance check-in failed. Please verify token.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <QrCode className="w-6 h-6 text-emerald-400" />
            {isOrganizer ? 'Organizer QR Broadcast & Attendance Station' : 'Student Event Attendance Check-In'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isOrganizer
              ? 'Project this QR code at the entrance or venue screen. Rotates dynamically; students scan through their portal.'
              : 'Scan or enter the event QR code token displayed by your organizer at the venue to mark attendance.'}
          </p>
        </div>

        {/* Event Selector */}
        <div className="flex items-center gap-3">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title} ({evt.college_name})
              </option>
            ))}
          </select>
          {isOrganizer && (
            <Button variant="outline" size="sm" onClick={() => loadQrToken(selectedEventId)}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Organizer View: Live QR Screen Display */}
        {isOrganizer ? (
          <Card className="col-span-1">
            <div className="p-6 text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" /> Organizer Venue Projector Screen
              </div>
              
              <h3 className="text-xl font-bold text-white">{tokenData?.event_title || 'Active Event'}</h3>
              <p className="text-xs text-slate-400">Host Campus: <strong className="text-slate-300">{tokenData?.college_name}</strong></p>

              {/* Dynamic QR Server Image */}
              <div className="p-4 bg-white rounded-2xl inline-block shadow-2xl mx-auto my-2 border-4 border-emerald-500/40">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(tokenData?.qr_scan_url || 'EVENTSPHERE')}`}
                  alt="Venue Attendance QR"
                  className="w-48 h-48 mx-auto"
                />
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 inline-block font-mono text-sm">
                Passcode Token: <strong className="text-emerald-400">{tokenData?.token}</strong>
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Only students who have registered and confirmed payment will be recorded as ATTENDED upon scanning.
              </p>
            </div>
          </Card>
        ) : (
          <Card className="col-span-1">
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-slate-400">
                <Lock className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Organizer Protected Screen</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                The official venue QR code is projected by your event professor/organizer at the entrance hall.
                Please look at the hall display and scan or enter the code using the scanner on the right.
              </p>
            </div>
          </Card>
        )}

        {/* Student Scanner View */}
        <Card className="col-span-1">
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Student In-Portal Scanner & Passcode</span>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <div>Logged In Student: <strong className="text-white">{user?.full_name}</strong></div>
              <div>University: <span className="text-slate-400">{user?.college_name || 'College'}</span></div>
            </div>

            <form onSubmit={handleStudentScan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Enter QR Passcode Token (From Organizer Screen)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scannedTokenInput}
                    onChange={(e) => setScannedTokenInput(e.target.value)}
                    placeholder={tokenData ? `e.g. ${tokenData.token}` : 'e.g. 03499380A6C81360'}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono uppercase"
                    required
                  />
                  {tokenData && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setScannedTokenInput(tokenData.token)}
                    >
                      Autofill QR
                    </Button>
                  )}
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                <UserCheck className="w-4 h-4 mr-2" />
                {loading ? 'Validating Token...' : 'Confirm & Mark Attendance'}
              </Button>
            </form>

            {/* Scan Feedback Result */}
            {scanResult && (
              <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{scanResult.message}</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div>Attendee: <strong className="text-white">{scanResult.participant_name}</strong></div>
                  <div>Event: <span className="text-slate-300">{scanResult.event_title}</span></div>
                  <div>Timestamp: <span className="text-slate-400">{new Date(scanResult.check_in_time).toLocaleString()}</span></div>
                  <div>Attendance Status: <Badge variant="success">{scanResult.attendance_status}</Badge></div>
                </div>
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  )
}
