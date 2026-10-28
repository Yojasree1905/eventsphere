import React, { useEffect, useState } from 'react'
import {
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  Download,
  ExternalLink,
  ShieldCheck,
  Trophy,
  CreditCard,
  UserCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import client from '../api/axios'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'

export function Portfolio() {
  const { user } = useAuth()
  const [registrations, setRegistrations] = useState([])
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payingRegId, setPayingRegId] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      // 1. Fetch participant profile if exists
      const partsRes = await client.get('/participants')
      const allParts = partsRes.data || []
      const myPart = allParts.find((p) => p.email?.toLowerCase() === user?.email?.toLowerCase())

      if (myPart) {
        // 2. Fetch registrations for this participant
        const regRes = await client.get(`/registrations?participant_id=${myPart.id}`)
        setRegistrations(regRes.data || [])

        // 3. Fetch certificates
        const certRes = await client.get('/certificates/registry')
        const allCerts = certRes.data || []
        const myCerts = allCerts.filter(
          (c) => c.participant_id === myPart.id || c.participant_name?.toLowerCase() === user?.full_name?.toLowerCase()
        )
        setCertificates(myCerts)
      } else {
        // Fallback: general registrations list
        const regRes = await client.get('/registrations')
        setRegistrations(regRes.data || [])
      }
    } catch (err) {
      console.error('Failed to load portfolio:', err)
      setError('Could not load portfolio records. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  const handlePay = async (regId) => {
    try {
      setPayingRegId(regId)
      // Call mock payment gateway
      await client.post(`/registrations/${regId}/pay`)
      await fetchData()
    } catch (err) {
      alert('Payment processing failed: ' + (err.response?.data?.detail || err.message))
    } finally {
      setPayingRegId(null)
    }
  }

  const attendedCount = registrations.filter((r) => r.status?.toLowerCase() === 'attended').length
  const confirmedCount = registrations.filter((r) => r.status?.toLowerCase() === 'confirmed').length
  const certCount = certificates.length

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/30">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-white">{user?.full_name || 'Student Portfolio'}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
                  {user?.role || 'Student'}
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 flex items-center gap-2">
                <span>{user?.college_name || 'Partner University'}</span>
                {user?.department && (
                  <>
                    <span>•</span>
                    <span>{user.department}</span>
                  </>
                )}
                <span>•</span>
                <span className="text-slate-400">{user?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-3 px-5 backdrop-blur-md">
            <div className="text-center px-3 border-r border-white/10">
              <div className="text-xl font-extrabold text-blue-400">{registrations.length}</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Applied</div>
            </div>
            <div className="text-center px-3 border-r border-white/10">
              <div className="text-xl font-extrabold text-emerald-400">{attendedCount}</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Attended</div>
            </div>
            <div className="text-center px-3">
              <div className="text-xl font-extrabold text-amber-400">{certCount}</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Credentials</div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Official Certificates / Achievements */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">Verifiable Certificates & Badges</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Cryptographically signed with ReportLab QR</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading achievements...</div>
        ) : certificates.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
            <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No certificates issued yet</p>
            <p className="text-xs text-slate-400 mt-1">Attend your registered events and mark QR check-in at the venue to unlock your official credential.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/10 to-transparent rounded-bl-full pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                      {cert.cert_type || 'Participation'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{cert.certificate_id}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base line-clamp-1">{cert.event_title || 'Campus Event'}</h3>
                  <p className="text-xs text-slate-500 mt-1">Issued on: {cert.issue_date || 'Recent'}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={`/api/certificates/download/${cert.certificate_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                  <a
                    href={`/verify/${cert.certificate_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verify QR</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Registrations & Attendance Timeline */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Registered Events & Attendance Status</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Lifecycle tracking: Applied → Confirmed → Attended</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading registrations...</div>
        ) : registrations.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No event registrations found</p>
            <p className="text-xs text-slate-400 mt-1">Explore upcoming hackathons, symposiums and workshops on the Events page to register.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {registrations.map((reg) => {
                const isPaid = reg.payment_status === 'paid'
                const status = (reg.status || 'applied').toLowerCase()

                let badgeColor = 'bg-slate-100 text-slate-700'
                if (status === 'attended') badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200'
                else if (status === 'confirmed') badgeColor = 'bg-blue-100 text-blue-800 border-blue-200'
                else if (status === 'applied') badgeColor = 'bg-amber-100 text-amber-800 border-amber-200'
                else if (status === 'absent') badgeColor = 'bg-rose-100 text-rose-800 border-rose-200'

                return (
                  <div key={reg.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-slate-900">{reg.event_title || `Event #${reg.event_id}`}</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeColor}`}>
                          {status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3">
                        <span className="font-mono text-slate-400">{reg.registration_number || `REG-${reg.id}`}</span>
                        <span>•</span>
                        <span>
                          Payment:{' '}
                          <span className={isPaid ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                            {isPaid ? 'PAID' : 'UNPAID'}
                          </span>
                        </span>
                        {reg.payment_ref && <span className="font-mono text-[10px] text-slate-400">({reg.payment_ref})</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {!isPaid && status !== 'cancelled' && status !== 'absent' && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
                          disabled={payingRegId === reg.id}
                          onClick={() => handlePay(reg.id)}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{payingRegId === reg.id ? 'Processing...' : 'Pay Registration Fee'}</span>
                        </Button>
                      )}

                      {status === 'confirmed' && (
                        <a
                          href="/attendance"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Scan QR for Attendance</span>
                        </a>
                      )}

                      {status === 'attended' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Attendance Verified</span>
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
