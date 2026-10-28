import { useState, useEffect } from 'react'
import { CheckSquare, Trophy, Award, Search, CheckCircle, RefreshCw, Star, UserPlus, Copy, Check, ShieldAlert } from 'lucide-react'
import { getEvents } from '../api/events'
import { getRegistrations } from '../api/participants'
import { submitEvaluationScore, recomputeLeaderboard } from '../api/person3'
import client from '../api/axios'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'

export function Evaluations() {
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(false)
  const [evaluatingReg, setEvaluatingReg] = useState(null)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Judge Invitation Modal State
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [invitedLink, setInvitedLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [assignedJudges, setAssignedJudges] = useState([])

  // Criteria form state
  const [innovation, setInnovation] = useState(30)
  const [technical, setTechnical] = useState(30)
  const [presentation, setPresentation] = useState(25)
  const [remarks, setRemarks] = useState('')

  useEffect(() => {
    getEvents().then((res) => {
      const evts = res.data || res || []
      setEvents(evts)
      if (evts.length > 0) setSelectedEventId(evts[0].id)
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (!selectedEventId) return
    setLoading(true)
    getRegistrations({ event_id: selectedEventId })
      .then((res) => {
        setRegistrations(res.data || res)
      })
      .catch(console.error)
      .finally(() => setLoading(false))

    // Fetch assigned judges
    client.get(`/api/judges/assigned/${selectedEventId}`)
      .then((res) => setAssignedJudges(res.data || []))
      .catch(() => setAssignedJudges([]))
  }, [selectedEventId])

  const openEvaluationModal = (reg) => {
    setEvaluatingReg(reg)
    setInnovation(30)
    setTechnical(30)
    setPresentation(25)
    setRemarks('')
  }

  const handleSaveScore = async (e) => {
    e.preventDefault()
    if (!evaluatingReg) return
    setSaving(true)
    try {
      await submitEvaluationScore({
        event_id: Number(selectedEventId),
        participant_id: evaluatingReg.participant_id,
        criteria_scores: {
          innovation: Number(innovation),
          technical: Number(technical),
          presentation: Number(presentation),
        },
        judge_remarks: remarks,
      })
      setSuccessMsg(`Score saved & rank updated for ${evaluatingReg.participant_name || 'Participant'}`)
      setEvaluatingReg(null)
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit score. You must be an authorized judge.')
    } finally {
      setSaving(false)
    }
  }

  const handleInviteJudge = async (e) => {
    e.preventDefault()
    if (!inviteEmail) return
    setInviteLoading(true)
    try {
      const res = await client.post('/judges/invite', {
        event_id: Number(selectedEventId),
        email: inviteEmail.trim(),
      })
      const fullUrl = window.location.origin + res.data.invitation_url
      setInvitedLink(fullUrl)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to generate judge invitation.')
    } finally {
      setInviteLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invitedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-amber-500" />
            <span>Jury Evaluation & Scoring</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Grade attended participants using weighted criteria (Innovation, Technical Execution, Presentation).
          </p>
        </div>

        {/* Event Selector & Actions */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Event:</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title} ({evt.college_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-sm shadow-sm">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Participants Evaluation Table */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">Attended Participants & Teams</h3>
            <p className="text-xs text-slate-500">
              {registrations.length} registered candidates • {assignedJudges.length} assigned judges
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setInvitedLink('')
                setInviteEmail('')
                setShowInviteModal(true)
              }}
              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              <span>Invite Expert Judge</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => recomputeLeaderboard(selectedEventId).then(() => alert('Ranks recomputed!'))}
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              <span>Recalculate Standings</span>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading registrations...</div>
        ) : registrations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No registrations found for this event.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Participant</th>
                  <th className="px-6 py-3">College / Dept</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.map((reg) => {
                  const isAttended = (reg.status || '').toLowerCase() === 'attended'
                  return (
                    <tr key={reg.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {reg.participant_name || `Candidate #${reg.participant_id}`}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {reg.participant_college || 'University'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            isAttended
                              ? 'success'
                              : reg.status === 'confirmed'
                              ? 'info'
                              : 'warning'
                          }
                        >
                          {reg.status || 'Applied'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-500 text-white"
                          onClick={() => openEvaluationModal(reg)}
                        >
                          <Star className="w-3.5 h-3.5 mr-1" />
                          <span>Evaluate</span>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Evaluation Rubric Modal */}
      {evaluatingReg && (
        <Modal
          isOpen={!!evaluatingReg}
          onClose={() => setEvaluatingReg(null)}
          title={`Evaluate: ${evaluatingReg.participant_name || 'Participant'}`}
        >
          <form onSubmit={handleSaveScore} className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 font-medium">
              Criteria rubrics are weighted up to 100 points total. Total score determines leaderboard podium standings automatically.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Innovation & Novelty (Max 40)
              </label>
              <input
                type="number"
                min="0"
                max="40"
                value={innovation}
                onChange={(e) => setInnovation(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Technical Execution & Architecture (Max 35)
              </label>
              <input
                type="number"
                min="0"
                max="35"
                value={technical}
                onChange={(e) => setTechnical(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Presentation & Q&A (Max 25)
              </label>
              <input
                type="number"
                min="0"
                max="25"
                value={presentation}
                onChange={(e) => setPresentation(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-600">Total Calculated Score:</span>
              <span className="text-amber-600 text-base font-extrabold">{Number(innovation) + Number(technical) + Number(presentation)} / 100</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Judge Remarks / Constructive Feedback
              </label>
              <textarea
                rows="3"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional notes or feedback for candidate..."
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="outline" onClick={() => setEvaluatingReg(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-amber-600 hover:bg-amber-500 text-white">
                {saving ? 'Saving...' : 'Submit Evaluation'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Invite Judge Modal */}
      {showInviteModal && (
        <Modal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          title="Invite Domain Expert / Judge"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Generate a cryptographically secure, single-use activation token for an external jury member or faculty evaluator.
            </p>

            {!invitedLink ? (
              <form onSubmit={handleInviteJudge} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Judge Email Address *</label>
                  <Input
                    type="email"
                    placeholder="e.g. professor.smith@mit.edu"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowInviteModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={inviteLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                    {inviteLoading ? 'Generating Token...' : 'Generate Single-Use Invite'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Invitation created! Share this one-time activation link with the judge:</span>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-2 border border-slate-200 rounded-lg">
                  <input
                    type="text"
                    readOnly
                    value={invitedLink}
                    className="w-full text-xs font-mono bg-transparent border-none outline-none text-slate-700 select-all"
                  />
                  <Button size="sm" onClick={copyToClipboard} className="shrink-0 bg-slate-900 hover:bg-slate-800 text-white">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="ml-1 text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
