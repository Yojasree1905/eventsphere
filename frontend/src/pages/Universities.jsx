import React, { useEffect, useState } from 'react'
import { GraduationCap, Building2, Globe, MapPin, Plus, Search, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import client from '../api/axios'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'

export function Universities() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.is_superadmin

  const [universities, setUniversities] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    code: '',
    city: '',
    state: '',
    domain: '',
    description: '',
  })

  const fetchUniversities = async () => {
    try {
      setLoading(true)
      const res = await client.get(`/api/universities?search=${encodeURIComponent(search)}`)
      setUniversities(res.data || [])
    } catch (err) {
      console.error('Failed to fetch universities:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUniversities()
  }, [search])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name || !form.code) {
      setError('University Name and Short Code are required.')
      return
    }

    try {
      setSaving(true)
      setError('')
      await client.post('/universities', form)
      setShowAddModal(false)
      setForm({ name: '', code: '', city: '', state: '', domain: '', description: '' })
      await fetchUniversities()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create university')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-indigo-600" />
            <span>Participating Universities</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Official partner institutions collaborating across hackathons, symposiums, and competitions on EventSphere.
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Register University</span>
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search universities by name or code (e.g. VIT, IIT, BITS)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
        />
      </div>

      {/* Universities Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading universities directory...</div>
      ) : universities.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-500">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">No universities found matching your search</p>
          <p className="text-xs text-slate-400 mt-1">Try searching by full institution name or state.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {universities.map((uni) => (
            <div
              key={uni.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-extrabold text-sm tracking-wide">
                    {uni.code}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug">{uni.name}</h3>

                {(uni.city || uni.state) && (
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{[uni.city, uni.state].filter(Boolean).join(', ')}</span>
                  </p>
                )}

                {uni.description && (
                  <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                    {uni.description}
                  </p>
                )}
              </div>

              {uni.domain && (
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-medium">
                  <span className="flex items-center gap-1.5 truncate">
                    <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{uni.domain}</span>
                  </span>
                  <a
                    href={`/events?search=${encodeURIComponent(uni.name)}`}
                    className="hover:underline text-[11px] font-semibold text-slate-600"
                  >
                    View Events →
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Admin Add University Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Register Partner University"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Institution Full Name *</label>
              <Input
                placeholder="e.g. Indian Institute of Science"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Short Code *</label>
                <Input
                  placeholder="e.g. IISC"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Domain Name</label>
                <Input
                  placeholder="e.g. iisc.ac.in"
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <Input
                  placeholder="e.g. Bangalore"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                <Input
                  placeholder="e.g. Karnataka"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                placeholder="Notable colleges, signature hackathons or technical events..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                {saving ? 'Registering...' : 'Register University'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
