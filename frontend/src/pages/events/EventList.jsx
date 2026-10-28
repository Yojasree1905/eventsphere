import { useEffect, useState } from 'react'
import { Plus, Search, Filter, Calendar, MapPin, Eye, Edit2, Trash2, Send, CheckCircle2, DollarSign } from 'lucide-react'
import { getEvents, createEvent, updateEvent, deleteEvent, submitEvent } from '../../api/events'
import { useAuth } from '../../hooks/useAuth'
import api from '../../api/axios'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Table } from '../../components/ui/Table'
import { formatDate } from '../../utils/formatters'
import { CATEGORIES } from '../../utils/constants'

export function EventList() {
  const { user } = useAuth()
  const role = (user?.role || 'participant').toLowerCase()
  const isParticipant = role === 'participant'
  const isOrganizer = role === 'organizer'
  const isAdmin = role === 'admin' || user?.is_superadmin

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [myRegistrations, setMyRegistrations] = useState([])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'technical',
    college_name: '',
    venue: '',
    start_date: '',
    end_date: '',
    max_participants: '',
  })

  const loadEvents = async () => {
    setLoading(true)
    try {
      const res = await getEvents({
        search: search || undefined,
        category: category || undefined,
        status: status || undefined,
      })
      setEvents(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadMyRegistrations = async () => {
    try {
      const res = await api.get('/registrations')
      setMyRegistrations(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadEvents()
    loadMyRegistrations()
  }, [category, status])

  const handleApply = async (eventId) => {
    try {
      // Find or create participant id matching current user
      const pRes = await api.get('/participants', { params: { search: user?.email } })
      const participants = pRes.data || []
      let participantId = participants.find((p) => p.email === user?.email)?.id

      if (!participantId) {
        const createdP = await api.post('/participants', {
          full_name: user?.full_name || 'Student',
          email: user?.email,
          college_name: user?.college_name || 'University',
          department: user?.department || 'General',
        })
        participantId = createdP.data.id
      }

      await api.post('/registrations', {
        event_id: eventId,
        participant_id: participantId,
      })
      alert('Application submitted! Status: APPLIED. Please complete fee payment to confirm seat.')
      loadMyRegistrations()
    } catch (err) {
      alert(err.response?.data?.detail || 'Application failed')
    }
  }

  const handlePay = async (regId) => {
    try {
      await api.post(`/registrations/${regId}/pay`)
      alert('Payment successful! Registration is now CONFIRMED.')
      loadMyRegistrations()
    } catch (err) {
      alert(err.response?.data?.detail || 'Payment failed')
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    loadEvents()
  }

  const handleOpenCreate = () => {
    setSelectedEvent(null)
    setFormData({
      title: '',
      description: '',
      category: 'technical',
      college_name: '',
      venue: '',
      start_date: '',
      end_date: '',
      max_participants: '',
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (ev) => {
    setSelectedEvent(ev)
    setFormData({
      title: ev.title || '',
      description: ev.description || '',
      category: ev.category || 'technical',
      college_name: ev.college_name || '',
      venue: ev.venue || '',
      start_date: ev.start_date || '',
      end_date: ev.end_date || '',
      max_participants: ev.max_participants || '',
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        max_participants: formData.max_participants ? parseInt(formData.max_participants, 10) : null,
      }
      if (selectedEvent) {
        await updateEvent(selectedEvent.id, payload)
      } else {
        await createEvent(payload)
      }
      setIsModalOpen(false)
      loadEvents()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save event')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return
    try {
      await deleteEvent(id)
      loadEvents()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete')
    }
  }

  const handleSubmitForReview = async (id) => {
    try {
      await submitEvent(id)
      loadEvents()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit')
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-3 max-w-md">
          <Input
            placeholder="Search events by title..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <select
            className="rounded-lg border border-slate-300 text-sm px-3 py-2 bg-white text-slate-700"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="rounded-lg border border-slate-300 text-sm px-3 py-2 bg-white text-slate-700"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            New Event
          </Button>
        </div>
      </div>

      {/* Events Table */}
      <Table headers={['Event Title', 'College & Venue', 'Dates', 'Category', 'Status', 'Actions']}>
        {loading ? (
          <tr>
            <td colSpan="6" className="text-center py-8 text-xs text-slate-500">
              Loading events...
            </td>
          </tr>
        ) : events.length === 0 ? (
          <tr>
            <td colSpan="6" className="text-center py-8 text-xs text-slate-500">
              No events found matching your criteria.
            </td>
          </tr>
        ) : (
          events.map((ev) => (
            <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="px-6 py-4">
                <span className="font-semibold text-slate-800 block">{ev.title}</span>
                <span className="text-xs text-slate-400 line-clamp-1">{ev.description || 'No description provided.'}</span>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm font-medium text-slate-700 block">{ev.college_name}</span>
                <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {ev.venue || 'TBD'}
                </span>
              </td>
              <td className="px-6 py-4 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDate(ev.start_date)} - {formatDate(ev.end_date)}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-block px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase bg-slate-100 text-slate-600 rounded">
                  {ev.category}
                </span>
              </td>
              <td className="px-6 py-4">
                <Badge status={ev.status} />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  {/* Student Action Flow: Apply -> Pay -> Status */}
                  {isParticipant ? (
                    (() => {
                      const reg = myRegistrations.find((r) => r.event_id === ev.id)
                      if (!reg) {
                        return (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleApply(ev.id)}
                            className="text-xs py-1"
                          >
                            <Send className="w-3.5 h-3.5 mr-1" />
                            Apply
                          </Button>
                        )
                      }
                      if (reg.status === 'applied') {
                        return (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-300">
                              Applied (Unpaid)
                            </span>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handlePay(reg.id)}
                              className="text-xs py-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              <DollarSign className="w-3.5 h-3.5 mr-0.5" />
                              Pay Fees
                            </Button>
                          </div>
                        )
                      }
                      if (reg.status === 'confirmed') {
                        return (
                          <span className="text-[11px] font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded border border-blue-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                            Confirmed (Paid)
                          </span>
                        )
                      }
                      if (reg.status === 'attended') {
                        return (
                          <span className="text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Attended
                          </span>
                        )
                      }
                      if (reg.status === 'absent') {
                        return (
                          <span className="text-[11px] font-bold bg-rose-100 text-rose-700 px-2.5 py-1 rounded border border-rose-300">
                            Absent (No Refund)
                          </span>
                        )
                      }
                      return (
                        <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded capitalize">
                          {reg.status}
                        </span>
                      )
                    })()
                  ) : (
                    /* Organizer / Admin Actions */
                    <>
                      {ev.status === 'draft' && (
                        <button
                          onClick={() => handleSubmitForReview(ev.id)}
                          className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded"
                        >
                          Submit
                        </button>
                      )}
                      <button
                        onClick={() => { setSelectedEvent(ev); setIsViewOpen(true); }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(ev)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit event"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ev.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))
        )}
      </Table>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedEvent ? 'Edit Event Details' : 'Create New College Event'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Event Title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. InnovateTech Hackathon 2026"
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Description
            </label>
            <textarea
              className="block w-full rounded-lg border border-slate-300 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Outline activities, prizes, rules..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={CATEGORIES}
            />
            <Input
              label="Hosting College"
              required
              value={formData.college_name}
              onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
              placeholder="e.g. MIT School of Computing"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Venue Location"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              placeholder="Auditorium B"
            />
            <Input
              label="Max Participants"
              type="number"
              value={formData.max_participants}
              onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
              placeholder="500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {selectedEvent ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Event Detail Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Event Information Overview"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge status={selectedEvent.status} />
                <span className="text-xs font-mono text-slate-400">ID #{selectedEvent.id}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">{selectedEvent.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{selectedEvent.college_name} • {selectedEvent.venue || 'No venue assigned'}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700">
              {selectedEvent.description || 'No detailed briefing added for this event.'}
            </div>

            {selectedEvent.rejection_reason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                <strong>Rejection Reason:</strong> {selectedEvent.rejection_reason}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Timeline</span>
                <span className="text-slate-800 font-semibold">{formatDate(selectedEvent.start_date)} to {formatDate(selectedEvent.end_date)}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Capacity</span>
                <span className="text-slate-800 font-semibold">{selectedEvent.max_participants || 'Unlimited'} seats</span>
              </div>
            </div>

            <div className="pt-4 flex justify-end border-t border-slate-100">
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
