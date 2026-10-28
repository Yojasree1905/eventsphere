import { useState, useEffect } from 'react'
import { Trophy, Medal, Award, Sparkles, Building, RefreshCw } from 'lucide-react'
import { getEvents } from '../api/events'
import { getEventLeaderboard } from '../api/person3'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

export function Leaderboard() {
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [leaderboard, setLeaderboard] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getEvents().then((res) => {
      const evts = res.data || res || []
      setEvents(evts)
      if (evts.length > 0) setSelectedEventId(evts[0].id)
    }).catch(console.error)
  }, [])

  const loadLeaderboard = (eventId) => {
    if (!eventId) return
    setLoading(true)
    getEventLeaderboard(eventId)
      .then((data) => {
        setLeaderboard(data)
      })
      .catch((err) => {
        console.error(err)
        setLeaderboard(null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (selectedEventId) {
      loadLeaderboard(selectedEventId)
    }
  }, [selectedEventId])

  const standings = leaderboard?.standings || []
  const top1 = standings.find((s) => s.rank === 1)
  const top2 = standings.find((s) => s.rank === 2)
  const top3 = standings.find((s) => s.rank === 3)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Event Leaderboard & Hall of Fame
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time inter-college competitive rankings, podium standings, and achievement badges.
          </p>
        </div>

        {/* Event Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Event:</label>
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
          <Button variant="outline" size="sm" onClick={() => loadLeaderboard(selectedEventId)}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Podium Cards (Top 3) */}
      {standings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
          
          {/* 2nd Place (Silver) */}
          <div className="order-2 md:order-1 bg-gradient-to-t from-slate-900 to-slate-800/80 border border-slate-700/60 rounded-2xl p-6 text-center relative shadow-lg transform md:-translate-y-2">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-700 border-2 border-slate-400 flex items-center justify-center text-slate-200 text-xl font-bold shadow-md">
              🥈 2
            </div>
            <h3 className="text-lg font-bold text-white mt-3">{top2?.participant_name || 'Runner Up'}</h3>
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-1">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              {top2?.college_name || 'University'}
            </p>
            <div className="mt-4 px-3 py-1.5 bg-slate-800 rounded-lg inline-block border border-slate-700">
              <span className="text-xl font-extrabold text-slate-200">{top2?.total_score || 0}</span>
              <span className="text-[10px] text-slate-400 block">POINTS</span>
            </div>
            <div className="mt-3">
              <span className="text-[11px] font-semibold text-slate-300 bg-slate-700/60 px-2.5 py-1 rounded-full">
                1st Runner Up
              </span>
            </div>
          </div>

          {/* 1st Place (Gold Winner) */}
          <div className="order-1 md:order-2 bg-gradient-to-t from-amber-950/40 via-slate-900 to-amber-900/30 border-2 border-amber-500/60 rounded-2xl p-7 text-center relative shadow-2xl transform md:-translate-y-6">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
              <Sparkles className="w-3 h-3" /> Champion
            </div>
            <div className="w-18 h-18 mx-auto rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 text-3xl font-extrabold shadow-lg shadow-amber-500/30">
              🥇 1
            </div>
            <h3 className="text-xl font-extrabold text-white mt-3.5">{top1?.participant_name || 'Winner'}</h3>
            <p className="text-xs text-amber-200/80 flex items-center justify-center gap-1 mt-1">
              <Building className="w-3.5 h-3.5 text-amber-400" />
              {top1?.college_name || 'Host University'}
            </p>
            <div className="mt-4 px-4 py-2 bg-amber-500/10 rounded-xl inline-block border border-amber-500/30">
              <span className="text-2xl font-black text-amber-300">{top1?.total_score || 0}</span>
              <span className="text-[10px] text-amber-400 block font-semibold tracking-wider">TOTAL SCORE</span>
            </div>
            <div className="mt-3">
              <span className="text-xs font-bold text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/40">
                🏆 Winner (1st Place)
              </span>
            </div>
          </div>

          {/* 3rd Place (Bronze) */}
          <div className="order-3 bg-gradient-to-t from-slate-900 to-slate-800/80 border border-amber-900/40 rounded-2xl p-6 text-center relative shadow-lg transform md:-translate-y-1">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-900/40 border-2 border-amber-700 flex items-center justify-center text-amber-500 text-xl font-bold shadow-md">
              🥉 3
            </div>
            <h3 className="text-lg font-bold text-white mt-3">{top3?.participant_name || '2nd Runner Up'}</h3>
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-1">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              {top3?.college_name || 'University'}
            </p>
            <div className="mt-4 px-3 py-1.5 bg-slate-800 rounded-lg inline-block border border-slate-700">
              <span className="text-xl font-extrabold text-amber-600">{top3?.total_score || 0}</span>
              <span className="text-[10px] text-slate-400 block">POINTS</span>
            </div>
            <div className="mt-3">
              <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-full">
                2nd Runner Up
              </span>
            </div>
          </div>

        </div>
      )}

      {/* Full Standings Table */}
      <Card>
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-white text-base">Complete Standings</h3>
            <p className="text-xs text-slate-400">
              {leaderboard ? `Event: ${leaderboard.event_title} (${leaderboard.total_participants_scored} scored)` : 'Standings Table'}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 text-xs uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-3 w-16">Rank</th>
                <th className="px-6 py-3">Participant</th>
                <th className="px-6 py-3">College</th>
                <th className="px-6 py-3">Criteria Breakdown</th>
                <th className="px-6 py-3">Badge</th>
                <th className="px-6 py-3 text-right">Total Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500">
                    Loading standings...
                  </td>
                </tr>
              ) : standings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500">
                    No evaluated participants yet for this event. Grade candidates in the Jury portal.
                  </td>
                </tr>
              ) : (
                standings.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-bold">
                      {s.rank === 1 ? '🥇 1' : s.rank === 2 ? '🥈 2' : s.rank === 3 ? '🥉 3' : `#${s.rank}`}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{s.participant_name}</td>
                    <td className="px-6 py-4 text-slate-400">{s.college_name || 'University'}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {s.criteria_scores ? (
                        <div className="flex gap-2">
                          {Object.entries(s.criteria_scores).map(([k, v]) => (
                            <span key={k} className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                              {k}: <strong>{v}</strong>
                            </span>
                          ))}
                        </div>
                      ) : (
                        'Standard'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={s.rank === 1 ? 'warning' : s.rank <= 3 ? 'success' : 'default'}>
                        {s.badge || 'Participant'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white text-base">
                      {s.total_score}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
