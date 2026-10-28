import { useEffect, useState } from 'react'
import { Plus, Clock, MapPin, User, Calendar, Trash2, CheckCircle2, Ban } from 'lucide-react'
import { getEvents } from '../api/events'
import {
  getSchedules,
  createSchedule,
  deleteSchedule,
  completeSchedule,
  expireSchedule,
  cancelSchedule,
} from '../api/schedules'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { formatDateTime, getScheduleStatus } from '../utils/formatters'

export function ScheduleManagement() {
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => new Date())

  // Keep time updated every 10 seconds so status dynamically transitions without page refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    speaker: '',
  })

  useEffect(() => {
    getEvents().then((res) => {
      setEvents(res.data)
      if (res.data.length > 0) {
        setSelectedEventId(res.data[0].id)
      }
    })
  }, [])

  useEffect(() => {
    if (!selectedEventId) return
    setLoading(true)
    getSchedules(selectedEventId)
      .then((res) => setSchedules(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [selectedEventId])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const startIso = formData.start_time ? new Date(formData.start_time).toISOString() : formData.start_time
      const endIso = formData.end_time ? new Date(formData.end_time).toISOString() : formData.end_time
      await createSchedule({
        ...formData,
        start_time: startIso,
        end_time: endIso,
        event_id: parseInt(selectedEventId, 10),
      })
      setIsModalOpen(false)
      setFormData({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        location: '',
        speaker: '',
      })
      const res = await getSchedules(selectedEventId)
      setSchedules(res.data)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add schedule item')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this schedule session?')) return
    try {
      await deleteSchedule(id)
      setSchedules(schedules.filter((s) => s.id !== id))
    } catch (err) {
      alert('Failed to delete')
    }
  }

  const handleComplete = async (id) => {
    try {
      const res = await completeSchedule(id)
      setSchedules(schedules.map((s) => (s.id === id ? res.data : s)))
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to complete session')
    }
  }

  const handleExpire = async (id) => {
    try {
      const res = await expireSchedule(id)
      setSchedules(schedules.map((s) => (s.id === id ? res.data : s)))
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to expire session')
    }
  }

  const handleCancel = async (id) => {
    try {
      const res = await cancelSchedule(id)
      setSchedules(schedules.map((s) => (s.id === id ? res.data : s)))
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel session')
    }
  }

  return (
    <div className="space-y-6">
      {/* Selector & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
            Select Event:
          </label>
          <select
            className="rounded-lg border border-slate-300 text-sm px-3.5 py-2 bg-white text-slate-800 font-medium"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.college_name})
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
          disabled={!selectedEventId}
        >
          Add Session Slot
        </Button>
      </div>

      {/* Timeline List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading schedule timeline...</div>
        ) : schedules.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400 text-xs">
            No schedule slots added for this event yet. Click "Add Session Slot" to structure the day.
          </div>
        ) : (
          schedules.map((slot) => {
            const currentStatus = getScheduleStatus(slot, null, currentTime) || slot.status || 'upcoming'
            return (
              <div
                key={slot.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-200 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {formatDateTime(slot.start_time)} - {formatDateTime(slot.end_time)}
                    </span>
                    <Badge status={currentStatus} />
                    {slot.location && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {slot.location}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-semibold text-slate-800">{slot.title}</h4>
                  {slot.description && (
                    <p className="text-xs text-slate-500">{slot.description}</p>
                  )}
                  {slot.speaker && (
                    <p className="text-xs text-indigo-600 font-medium flex items-center gap-1 mt-1">
                      <User className="w-3.5 h-3.5" /> Keynote: {slot.speaker}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {!slot.is_cancelled && currentStatus !== 'completed' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 text-xs px-2 py-1"
                      icon={CheckCircle2}
                      onClick={() => handleComplete(slot.id)}
                      title="Mark as conducted/completed"
                    >
                      Complete
                    </Button>
                  )}
                  {!slot.is_cancelled && (currentStatus === 'ongoing' || currentStatus === 'completed') && slot.is_conducted !== false && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 text-xs px-2 py-1"
                      onClick={() => handleExpire(slot.id)}
                      title="Mark as not conducted / expired"
                    >
                      Not Conducted
                    </Button>
                  )}
                  {!slot.is_cancelled && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-500 hover:bg-slate-100 hover:text-slate-700 text-xs px-2 py-1"
                      icon={Ban}
                      onClick={() => handleCancel(slot.id)}
                      title="Cancel session"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs px-2 py-1"
                    icon={Trash2}
                    onClick={() => handleDelete(slot.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>


      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Event Schedule Slot"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Session Title"
            required
            placeholder="e.g. Opening Keynote & Lamp Lighting"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Brief Agenda Details
            </label>
            <textarea
              className="w-full text-sm rounded-lg border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Session breakdown..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date & Time"
              type="datetime-local"
              required
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            />
            <Input
              label="End Date & Time"
              type="datetime-local"
              required
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hall / Room"
              placeholder="Seminar Hall 1"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <Input
              label="Speaker / Host"
              placeholder="Dr. S. Raman"
              value={formData.speaker}
              onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Slot
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
