import { useState, useEffect } from 'react'
import { Users, UserPlus, Shield, Copy, Check, Building, Calendar } from 'lucide-react'
import { getEvents } from '../api/events'
import { getParticipants } from '../api/participants'
import api from '../api/axios'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'

export function Teams() {
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [teams, setTeams] = useState([])
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState(null)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)

  // Form states
  const [teamName, setTeamName] = useState('')
  const [leaderId, setLeaderId] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinParticipantId, setJoinParticipantId] = useState('')

  useEffect(() => {
    getEvents().then((evts) => {
      setEvents(evts)
      if (evts.length > 0) setSelectedEventId(evts[0].id)
    }).catch(console.error)

    getParticipants().then((res) => {
      setParticipants(res.data || res)
    }).catch(console.error)
  }, [])

  const loadTeams = (eventId) => {
    if (!eventId) return
    setLoading(true)
    api.get(`/teams/event/${eventId}`)
      .then((res) => setTeams(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadTeams(selectedEventId)
  }, [selectedEventId])

  const handleCreateTeam = async (e) => {
    e.preventDefault()
    try {
      await api.post('/teams', {
        name: teamName,
        event_id: Number(selectedEventId),
        leader_id: Number(leaderId),
      })
      setShowCreateModal(false)
      setTeamName('')
      loadTeams(selectedEventId)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create team')
    }
  }

  const handleJoinTeam = async (e) => {
    e.preventDefault()
    try {
      await api.post('/teams/join', {
        team_code: joinCode,
        participant_id: Number(joinParticipantId),
      })
      setShowJoinModal(false)
      setJoinCode('')
      loadTeams(selectedEventId)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to join team')
    }
  }

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" />
            Team Formation & Squad Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Module 4: Multi-university team codes, roster management, and cross-college squad registrations.
          </p>
        </div>

        {/* Action Controls */}
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

          <Button variant="outline" onClick={() => setShowJoinModal(true)}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Join with Code
          </Button>

          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Shield className="w-4 h-4 mr-1.5" />
            Create Team
          </Button>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            Loading squads...
          </div>
        ) : teams.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
            No teams formed yet for this event. Click "Create Team" or join using an invite code.
          </div>
        ) : (
          teams.map((t) => (
            <Card key={t.id}>
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white">{t.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Leader: <strong className="text-slate-200">{t.leader_name}</strong></p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(t.team_code)}
                    className="flex items-center gap-1 text-xs font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-lg hover:bg-indigo-500/20 transition-colors"
                  >
                    {copiedCode === t.team_code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {t.team_code}
                  </button>
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <div className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider mb-2 flex justify-between">
                    <span>Squad Members</span>
                    <span>{t.members_count} Joined</span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {t.members.map((m) => (
                      <div key={m.participant_id} className="text-xs bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 flex justify-between items-center">
                        <span className="font-medium text-slate-200">{m.full_name}</span>
                        <span className="text-[10px] text-slate-400">{m.college_name || 'University'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Create Team */}
      {showCreateModal && (
        <Modal isOpen={true} onClose={() => setShowCreateModal(false)} title="Create New Squad / Team">
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Squad / Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Quantum Coders"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Team Leader</label>
              <select
                value={leaderId}
                onChange={(e) => setLeaderId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                required
              >
                <option value="">-- Choose Candidate --</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.college_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Generate Code & Create</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Join Team */}
      {showJoinModal && (
        <Modal isOpen={true} onClose={() => setShowJoinModal(false)} title="Join Existing Team with Code">
          <form onSubmit={handleJoinTeam} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Enter 6-Digit Team Code</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="e.g. TM-9X28A1"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Joining Member Profile</label>
              <select
                value={joinParticipantId}
                onChange={(e) => setJoinParticipantId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                required
              >
                <option value="">-- Choose Candidate --</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.college_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="outline" onClick={() => setShowJoinModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Join Squad</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
