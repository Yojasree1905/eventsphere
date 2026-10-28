import { useState, useEffect } from 'react'
import { Sparkles, Compass, Star, Building, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react'
import { getParticipants } from '../api/participants'
import api from '../api/axios'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

export function Recommendations() {
  const [participants, setParticipants] = useState([])
  const [selectedParticipantId, setSelectedParticipantId] = useState('')
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getParticipants().then((res) => {
      const data = res.data || res
      setParticipants(data)
      if (data.length > 0) setSelectedParticipantId(data[0].id)
    }).catch(console.error)
  }, [])

  const loadRecommendations = (pId) => {
    if (!pId) return
    setLoading(true)
    api.get(`/recommendations/${pId}`)
      .then((res) => setRecommendations(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadRecommendations(selectedParticipantId)
  }, [selectedParticipantId])

  const selectedParticipant = participants.find((p) => p.id === Number(selectedParticipantId))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-purple-400" />
            Smart Event Recommendations (AI Discovery)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Module 9: AI/ML heuristic event discovery tailored to major, department, past registrations, and university affiliations.
          </p>
        </div>

        {/* Candidate Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Viewing As:</label>
          <select
            value={selectedParticipantId}
            onChange={(e) => setSelectedParticipantId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.college_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Candidate Profile Card */}
      {selectedParticipant && (
        <div className="p-4 bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 rounded-2xl flex flex-wrap justify-between items-center gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Candidate Persona</span>
            <h3 className="text-lg font-bold text-white">{selectedParticipant.full_name}</h3>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{selectedParticipant.college_name}</span>
              <span>•</span>
              <span className="text-purple-300">{selectedParticipant.department}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/40 px-3 py-1 rounded-full font-semibold">
              Personalized Algorithm Active
            </span>
          </div>
        </div>
      )}

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            Analyzing student interests and ranking events...
          </div>
        ) : recommendations.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
            No recommendations generated. Add more events to the platform!
          </div>
        ) : (
          recommendations.map((rec) => (
            <Card key={rec.id}>
              <div className="p-5 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-purple-300 border border-slate-700 capitalize">
                      {rec.category}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Star className="w-3 h-3 fill-emerald-400" />
                      {rec.match_score}% Match
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors">
                    {rec.title}
                  </h3>

                  <div className="text-xs text-slate-400 space-y-1 mt-2.5">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      <span>{rec.college_name}</span>
                    </div>
                    {rec.venue && (
                      <div className="text-slate-500 text-[11px] ml-5">
                        Venue: {rec.venue}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-3 space-y-3">
                  <div className="text-[11px] text-purple-300/90 bg-purple-500/10 p-2 rounded-lg border border-purple-500/20">
                    💡 {rec.recommendation_reason}
                  </div>

                  <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => alert(`Registered for ${rec.title}!`)}>
                    Register Now <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
