import { useState, useEffect } from 'react'
import { Award, QrCode, Download, CheckCircle2, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react'
import { getEvents } from '../api/events'
import { listCertificates, generateCertificates, getCertificateDownloadUrl } from '../api/person3'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

export function Certificates() {
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [certificates, setCertificates] = useState([])
  const [certType, setCertType] = useState('participation')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    getEvents().then((res) => {
      const evts = res.data || res || []
      setEvents(evts)
      if (evts.length > 0) setSelectedEventId(evts[0].id)
    }).catch(console.error)
  }, [])

  const loadCertificates = (eventId) => {
    setLoading(true)
    listCertificates({ event_id: eventId || undefined })
      .then(setCertificates)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCertificates(selectedEventId)
  }, [selectedEventId])

  const handleGenerate = async () => {
    if (!selectedEventId) return
    setGenerating(true)
    setMsg('')
    try {
      const res = await generateCertificates({
        event_id: Number(selectedEventId),
        cert_type: certType,
      })
      setMsg(`Success! Generated ${res.length} certificates with tamper-proof QR verification.`)
      loadCertificates(selectedEventId)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to generate certificates')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Award className="w-6 h-6 text-emerald-400" />
            Certificates & Credential Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Programmatic PDF generation, dynamic QR verification hashes, and tamper-proof credential issuance.
          </p>
        </div>

        {/* Action Bar */}
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

          <select
            value={certType}
            onChange={(e) => setCertType(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="participation">Participation</option>
            <option value="merit">Merit</option>
            <option value="winner">Winner (1st Place)</option>
            <option value="runner_up">Runner Up</option>
          </select>

          <Button variant="primary" onClick={handleGenerate} disabled={generating}>
            <Sparkles className="w-4 h-4 mr-1.5" />
            {generating ? 'Minting...' : 'Batch Mint Certificates'}
          </Button>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Certificates Directory */}
      <Card>
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-white text-base">Issued Credentials</h3>
            <p className="text-xs text-slate-400">Total {certificates.length} certificates registered in Occasio</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => loadCertificates(selectedEventId)}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 text-xs uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-3">Certificate ID</th>
                <th className="px-6 py-3">Recipient Name</th>
                <th className="px-6 py-3">College</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Issue Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500">
                    Loading credentials...
                  </td>
                </tr>
              ) : certificates.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500">
                    No certificates issued for this event yet. Mark participants as "Attended" in Registrations, then click "Batch Mint Certificates".
                  </td>
                </tr>
              ) : (
                certificates.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-blue-400 text-xs">
                      {c.certificate_id}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{c.participant_name}</td>
                    <td className="px-6 py-4 text-slate-400">{c.college_name || 'University'}</td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {c.cert_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">{c.issue_date}</td>
                    <td className="px-6 py-4">
                      <Badge variant={c.is_revoked ? 'danger' : 'success'}>
                        {c.is_revoked ? 'Revoked' : 'Authentic'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <a
                        href={`/verify/${c.certificate_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-md transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5 mr-1" />
                        Verify
                      </a>
                      <a
                        href={getCertificateDownloadUrl(c.certificate_id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-md transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 mr-1" />
                        PDF
                      </a>
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
