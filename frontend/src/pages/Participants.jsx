import { useEffect, useState } from 'react'
import { Search, UserPlus, Users, FileSpreadsheet, CheckCircle, Clock } from 'lucide-react'
import { getParticipants, createParticipant, getRegistrations, updateRegistration } from '../api/participants'
import { getEvents } from '../api/events'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Table } from '../components/ui/Table'
import { formatDateTime } from '../utils/formatters'

export function Participants() {
  const [tab, setTab] = useState('registrations') // 'registrations' or 'directory'
  const [registrations, setRegistrations] = useState([])
  const [participants, setParticipants] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // New Participant Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    college_name: '',
    department: '',
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [regRes, partRes, evRes] = await Promise.all([
        getRegistrations(),
        getParticipants({ search: search || undefined }),
        getEvents(),
      ])
      setRegistrations(regRes.data)
      setParticipants(partRes.data)
      setEvents(evRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateParticipant = async (e) => {
    e.preventDefault()
    try {
      await createParticipant(formData)
      setIsModalOpen(false)
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        college_name: '',
        department: '',
      })
      loadData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create participant')
    }
  }

  const handleStatusChange = async (regId, newStatus) => {
    try {
      await updateRegistration(regId, { status: newStatus })
      loadData()
    } catch (err) {
      alert('Failed to update status')
    }
  }

  const getEventName = (id) => events.find((e) => e.id === id)?.title || `Event #${id}`
  const getParticipantName = (id) => participants.find((p) => p.id === id)?.full_name || `Participant #${id}`
  const getParticipantEmail = (id) => participants.find((p) => p.id === id)?.email || ''

  return (
    <div className="space-y-6">
      {/* Navigation Tabs & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-slate-200/80 p-1 rounded-xl w-fit">
          <button
            onClick={() => setTab('registrations')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              tab === 'registrations' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Registrations ({registrations.length})
          </button>
          <button
            onClick={() => setTab('directory')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              tab === 'directory' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Participant Directory ({participants.length})
          </button>
        </div>

        <Button variant="primary" icon={UserPlus} onClick={() => setIsModalOpen(true)}>
          Register Participant
        </Button>
      </div>

      {/* Registrations View */}
      {tab === 'registrations' && (
        <Table headers={['Reg Number', 'Participant', 'Event', 'Date Registered', 'Status', 'Actions']}>
          {loading ? (
            <tr>
              <td colSpan="6" className="text-center py-8 text-xs text-slate-500">
                Loading registration logs...
              </td>
            </tr>
          ) : registrations.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center py-10 text-slate-400 text-xs">
                No active registrations recorded.
              </td>
            </tr>
          ) : (
            registrations.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600">
                  {r.registration_number}
                </td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-slate-800 block text-sm">{getParticipantName(r.participant_id)}</span>
                  <span className="text-xs text-slate-400">{getParticipantEmail(r.participant_id)}</span>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-slate-700">
                  {getEventName(r.event_id)}
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {formatDateTime(r.registered_at)}
                </td>
                <td className="px-6 py-4">
                  <Badge status={r.status} />
                </td>
                <td className="px-6 py-4">
                  <select
                    className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700"
                    value={r.status}
                    onChange={(e) => handleStatusChange(r.id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="attended">Attended</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))
          )}
        </Table>
      )}

      {/* Directory View */}
      {tab === 'directory' && (
        <Table headers={['Full Name', 'Email', 'Phone', 'College', 'Department']}>
          {loading ? (
            <tr>
              <td colSpan="5" className="text-center py-8 text-xs text-slate-500">
                Loading students...
              </td>
            </tr>
          ) : participants.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center py-10 text-slate-400 text-xs">
                No participants registered in the system.
              </td>
            </tr>
          ) : (
            participants.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-800 text-sm">{p.full_name}</td>
                <td className="px-6 py-4 text-xs text-slate-600">{p.email}</td>
                <td className="px-6 py-4 text-xs text-slate-600">{p.phone || '—'}</td>
                <td className="px-6 py-4 text-xs text-slate-600">{p.college_name || '—'}</td>
                <td className="px-6 py-4 text-xs text-slate-600">{p.department || '—'}</td>
              </tr>
            ))
          )}
        </Table>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Participant"
      >
        <form onSubmit={handleCreateParticipant} className="space-y-4">
          <Input
            label="Full Name"
            required
            placeholder="Aarav Sharma"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />

          <Input
            label="Email Address"
            type="email"
            required
            placeholder="aarav@college.edu"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Input
            label="Contact Phone"
            placeholder="+91 98765 43210"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="College Name"
              placeholder="Delhi Technological Univ"
              value={formData.college_name}
              onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
            />
            <Input
              label="Department / Major"
              placeholder="Computer Science"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Participant
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
