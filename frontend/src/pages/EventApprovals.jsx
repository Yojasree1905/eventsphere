import { useEffect, useState } from 'react'
import { Check, X, AlertCircle, RefreshCw } from 'lucide-react'
import { getEvents, approveEvent, rejectEvent } from '../api/events'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Table } from '../components/ui/Table'
import { formatDate } from '../utils/formatters'

export function EventApprovals() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // Rejection modal
  const [rejectingEvent, setRejectingEvent] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const loadPending = async () => {
    setLoading(true)
    try {
      const res = await getEvents({ status: 'pending' })
      setEvents(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPending()
  }, [])

  const handleApprove = async (id) => {
    try {
      await approveEvent(id)
      loadPending()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to approve event')
    }
  }

  const handleOpenReject = (ev) => {
    setRejectingEvent(ev)
    setRejectionReason('')
  }

  const handleConfirmReject = async (e) => {
    e.preventDefault()
    if (!rejectingEvent) return
    try {
      await rejectEvent(rejectingEvent.id, rejectionReason)
      setRejectingEvent(null)
      loadPending()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to reject event')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium">
            Pending Moderation Queue ({events.length} pending items)
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadPending}>
          Refresh Queue
        </Button>
      </div>

      <Table headers={['Event Title & Host', 'Category', 'Dates', 'Expected Seats', 'Decision Actions']}>
        {loading ? (
          <tr>
            <td colSpan="5" className="text-center py-8 text-xs text-slate-500">
              Loading pending submissions...
            </td>
          </tr>
        ) : events.length === 0 ? (
          <tr>
            <td colSpan="5" className="text-center py-12 text-slate-400 text-sm">
              <div className="flex flex-col items-center gap-2">
                <Check className="w-8 h-8 text-emerald-500 bg-emerald-50 p-1.5 rounded-full" />
                <p className="font-semibold text-slate-700">All submissions reviewed!</p>
                <p className="text-xs text-slate-400">There are no pending events waiting for moderation.</p>
              </div>
            </td>
          </tr>
        ) : (
          events.map((ev) => (
            <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <span className="font-semibold text-slate-800 block">{ev.title}</span>
                <span className="text-xs text-slate-500">{ev.college_name}</span>
              </td>
              <td className="px-6 py-4">
                <span className="inline-block px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase bg-slate-100 text-slate-600 rounded">
                  {ev.category}
                </span>
              </td>
              <td className="px-6 py-4 text-xs text-slate-600">
                {formatDate(ev.start_date)} - {formatDate(ev.end_date)}
              </td>
              <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                {ev.max_participants || 'Unlimited'}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    icon={Check}
                    onClick={() => handleApprove(ev.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    icon={X}
                    onClick={() => handleOpenReject(ev)}
                  >
                    Reject
                  </Button>
                </div>
              </td>
            </tr>
          ))
        )}
      </Table>

      {/* Reject Modal */}
      <Modal
        isOpen={Boolean(rejectingEvent)}
        onClose={() => setRejectingEvent(null)}
        title="Reject Event Proposal"
      >
        <form onSubmit={handleConfirmReject} className="space-y-4">
          <p className="text-xs text-slate-600">
            Please provide a specific reason for rejecting <strong>{rejectingEvent?.title}</strong> so the organizers can rectify it.
          </p>

          <textarea
            required
            rows={3}
            className="w-full text-sm rounded-lg border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
            placeholder="e.g. Schedule clashes with College Convocation; missing safety guidelines."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setRejectingEvent(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger">
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
