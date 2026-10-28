import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ShieldCheck,
  ShieldAlert,
  Award,
  Calendar,
  Building,
  Sparkles,
  Download,
  ArrowLeft,
  Search,
  ExternalLink,
  CheckCircle2,
  FileCheck2,
  RotateCcw,
} from 'lucide-react'
import { verifyCertificatePublic, getCertificateDownloadUrl, getCertificateRegistry } from '../api/person3'

export function PublicVerify() {
  const { certificateId: urlCertId } = useParams()
  const navigate = useNavigate()

  const [activeCertId, setActiveCertId] = useState(urlCertId || '')
  const [searchInput, setSearchInput] = useState(urlCertId || '')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [registry, setRegistry] = useState([])
  const [registryLoading, setRegistryLoading] = useState(true)

  // Load public certificate registry on mount
  useEffect(() => {
    setRegistryLoading(true)
    getCertificateRegistry({ limit: 12 })
      .then((records) => setRegistry(records || []))
      .catch((err) => console.error('Failed to load certificate registry:', err))
      .finally(() => setRegistryLoading(false))
  }, [])

  // Verify certificate whenever activeCertId changes
  useEffect(() => {
    if (!activeCertId) {
      setData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    verifyCertificatePublic(activeCertId.trim())
      .then((res) => {
        setData(res)
      })
      .catch((err) => {
        setData({
          is_valid: false,
          certificate_id: activeCertId,
          recipient_name: 'Unknown',
          recipient_college: 'Unknown',
          event_title: 'Unknown',
          host_college: 'Unknown',
          cert_type: 'Unknown',
          issue_date: 'N/A',
          status_message: 'Verification server could not locate record or verify cryptographic hash.',
        })
      })
      .finally(() => setLoading(false))
  }, [activeCertId])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!searchInput.trim()) return
    setActiveCertId(searchInput.trim())
  }

  const handleSelectSample = (certId) => {
    setSearchInput(certId)
    setActiveCertId(certId)
  }

  const handleReset = () => {
    setActiveCertId('')
    setSearchInput('')
    setData(null)
    if (urlCertId) {
      navigate('/verify')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-start items-center p-4 sm:p-6 md:p-8">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(59,130,246,0.18),transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-3xl relative z-10">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to EventSphere</span>
          </Link>
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
            Public Verification Authority
          </span>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5" /> EventSphere Credential Authority
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">University Certificate Registry</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Zero-trust cryptographic validation portal for student credentials and inter-university competition certificates.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl mb-8 backdrop-blur-sm">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Certificate Serial ID (e.g. OCC-2026-C233CF13)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchInput.trim()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Credential</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Sample Selector */}
          {registry.length > 0 && !activeCertId && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Quick Verify Samples:</span>
              {registry.slice(0, 4).map((c) => (
                <button
                  key={c.certificate_id}
                  type="button"
                  onClick={() => handleSelectSample(c.certificate_id)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 font-mono text-[11px] rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  {c.certificate_id} ({c.participant_name?.split(' ')[0]})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Verification Result Card (If activeCertId is set) */}
        {activeCertId && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden mb-8">
            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                <span className="text-sm">Checking cryptographic signature in EventSphere registry...</span>
              </div>
            ) : data?.is_valid ? (
              <div>
                {/* Green Verified Header */}
                <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white text-center">
                  <ShieldCheck className="w-14 h-14 mx-auto mb-2 text-white drop-shadow-md" />
                  <h2 className="text-xl font-extrabold uppercase tracking-wide">Officially Verified Credential</h2>
                  <p className="text-xs text-emerald-100 mt-0.5">Authentic document issued via EventSphere University Network</p>
                </div>

                {/* Certificate Details */}
                <div className="p-6 space-y-4">
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Certificate Serial ID:</span>
                    <span className="font-mono font-bold text-blue-400 select-all">{data.certificate_id}</span>
                  </div>

                  <div className="border-t border-slate-800 pt-3 space-y-4">
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Recipient Name</span>
                      <p className="text-xl font-bold text-white mt-0.5">{data.recipient_name}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Participant College</span>
                        <p className="font-medium text-slate-200 text-xs flex items-center gap-1.5 mt-1">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{data.recipient_college}</span>
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Host Institution</span>
                        <p className="font-medium text-slate-200 text-xs flex items-center gap-1.5 mt-1">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{data.host_college}</span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Event Title</span>
                      <p className="text-sm font-semibold text-blue-300 mt-1">"{data.event_title}"</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Award / Type</span>
                        <p className="text-xs font-bold text-amber-400 uppercase mt-1">
                          {data.cert_type?.replace('_', ' ')}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Issue Date</span>
                        <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{data.issue_date}</span>
                        </p>
                      </div>
                    </div>

                    {data.status_message && (
                      <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{data.status_message}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Verify Another Credential</span>
                    </button>
                    <a
                      href={getCertificateDownloadUrl(data.certificate_id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Official PDF</span>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <ShieldAlert className="w-14 h-14 mx-auto mb-3 text-rose-500 drop-shadow-md" />
                <h2 className="text-xl font-bold text-white">Invalid or Fraudulent Credential</h2>
                <p className="text-xs text-rose-400 mt-2 max-w-md mx-auto">
                  {data?.status_message || 'Certificate record does not exist in the EventSphere database.'}
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-xl transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" /> Try Another Serial ID
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Issued Certificates Registry Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-400" />
                <span>Public Certificate Registry</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Authentic certificates registered and verified across partner universities
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 px-2.5 py-1 bg-slate-800 rounded-lg">
              {registry.length} Credentials
            </span>
          </div>

          {registryLoading ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading certificate directory...
            </div>
          ) : registry.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No certificates currently issued in the public registry.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {registry.map((c) => (
                <div
                  key={c.certificate_id}
                  onClick={() => handleSelectSample(c.certificate_id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                    activeCertId === c.certificate_id
                      ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/20'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold text-blue-400">{c.certificate_id}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {c.cert_type?.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white truncate">{c.participant_name}</h3>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{c.college_name || 'Partner University'}</p>
                  <p className="text-xs text-blue-300/80 truncate mt-1">"{c.event_title}"</p>
                  
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Issued: {c.issue_date}</span>
                    <span className="text-blue-400 font-semibold flex items-center gap-1 hover:underline">
                      Verify Authenticity →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-slate-500">
          EventSphere Multi-University Event Platform • Zero-Trust Cryptographic Authority
        </div>

      </div>
    </div>
  )
}
