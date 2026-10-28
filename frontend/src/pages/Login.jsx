import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sparkles, Lock, Mail, User, Building, ArrowRight, ShieldCheck, X, GraduationCap, Award, UserPlus, LogIn, KeyRound } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import client from '../api/axios'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function Login() {
  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const inviteToken = query.get('invite_token')
  const inviteEmail = query.get('email')

  // Mode: isRegistering (true/false) and isAdminSelected (true/false)
  const [isRegistering, setIsRegistering] = useState(true)
  const [isAdminSelected, setIsAdminSelected] = useState(false)

  const [email, setEmail] = useState(inviteEmail || '')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('participant') // participant, organizer, judge, admin
  const [collegeName, setCollegeName] = useState('')
  const [department, setDepartment] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login, register } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (inviteEmail) {
      setEmail(inviteEmail)
    }
  }, [inviteEmail])

  // Select Administrator directly: loads the one central admin credentials
  const handleSelectAdmin = () => {
    setIsAdminSelected(true)
    setIsRegistering(false)
    setEmail('admin@occasio.com')
    setPassword('Admin@1234')
    setError('')
  }

  const handleSelectSignUp = () => {
    setIsAdminSelected(false)
    setIsRegistering(true)
    setEmail('')
    setPassword('')
    setError('')
  }

  const handleSelectSignIn = () => {
    setIsAdminSelected(false)
    setIsRegistering(false)
    setEmail('')
    setPassword('')
    setError('')
  }

  const handleRoleChange = (e) => {
    const chosen = e.target.value
    if (chosen === 'admin') {
      // Direct jump to Admin mode with credentials
      handleSelectAdmin()
    } else {
      setRole(chosen)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (inviteToken) {
        // Activate invited judge credentials
        await client.post('/judges/accept-invite', {
          token: inviteToken,
          full_name: fullName || 'Expert Judge',
          password,
        })
        await login(email, password)
        navigate('/evaluations')
        return
      }

      if (isRegistering) {
        if (!fullName.trim() || !collegeName.trim()) {
          setError('Full Name and University / College are required to create an account.')
          setLoading(false)
          return
        }
        await register({
          email: email.trim().toLowerCase(),
          password,
          full_name: fullName.trim(),
          role,
          college_name: collegeName.trim(),
          department: department.trim() || undefined,
        })
        navigate('/events')
      } else {
        await login(email.trim().toLowerCase(), password)
        if (isAdminSelected || email === 'admin@occasio.com') {
          navigate('/')
        } else {
          navigate('/events')
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials or sign up first.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        
        {/* Brand Icon & Heading */}
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">EventSphere</h2>
          <p className="text-xs text-slate-400 mt-1">
            Smart Multi-University Event Management & Participation Platform
          </p>
        </div>

        {/* Invitation Banner if arriving via single-use judge token */}
        {inviteToken && (
          <div className="mb-4 p-4 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-indigo-200 text-xs flex items-center gap-3">
            <Award className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-white">Official Judge / Jury Invitation</p>
              <p className="text-slate-300">Set your name and password below to activate your evaluator credentials.</p>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8">
          
          {/* 3-Tab Switcher: Sign Up (Default) vs Sign In vs Global Admin */}
          {!inviteToken ? (
            <div className="flex border-b border-slate-200 mb-6 pb-2 text-xs font-bold gap-1">
              <button
                type="button"
                onClick={handleSelectSignUp}
                className={`flex-1 pb-2 border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isRegistering && !isAdminSelected
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>1. Sign Up</span>
              </button>

              <button
                type="button"
                onClick={handleSelectSignIn}
                className={`flex-1 pb-2 border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  !isRegistering && !isAdminSelected
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>2. Sign In</span>
              </button>

              <button
                type="button"
                onClick={handleSelectAdmin}
                className={`flex-1 pb-2 border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isAdminSelected
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-slate-400 hover:text-rose-500'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                <span>🛡️ Admin</span>
              </button>
            </div>
          ) : (
            <div className="border-b border-slate-200 mb-6 pb-2 text-sm font-bold text-indigo-700">
              Activate Judge Account
            </div>
          )}

          {/* Admin Selected Banner with Direct Credentials */}
          {isAdminSelected && (
            <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-rose-800 text-sm">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  <span>Single Platform Administrator</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-rose-200/80 text-rose-900 font-bold rounded">
                  ONLY ONE ADMIN
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                There is only one central administrator governing all universities on EventSphere. The credentials have been directly loaded into the form:
              </p>
              <div className="bg-white p-3 rounded-lg border border-rose-200 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
                <div>
                  <span className="text-slate-400">Email: </span>
                  <span className="font-bold text-slate-900 select-all">admin@occasio.com</span>
                </div>
                <div>
                  <span className="text-slate-400">Password: </span>
                  <span className="font-bold text-slate-900 select-all">Admin@1234</span>
                </div>
              </div>
            </div>
          )}

          {/* Notice to sign up first when in regular sign-in tab */}
          {!isRegistering && !isAdminSelected && !inviteToken && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs flex items-center justify-between">
              <span>New to EventSphere? You must sign up first.</span>
              <button
                type="button"
                onClick={handleSelectSignUp}
                className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
              >
                Sign Up Here →
              </button>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between gap-2">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError('')}
                className="text-rose-400 hover:text-rose-700 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Additional Fields if Registering or Activating Invite */}
            {(isRegistering || inviteToken) && (
              <Input
                label="Full Name *"
                type="text"
                icon={User}
                placeholder="e.g. Dr. Ananya Sen / Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            )}

            {isRegistering && !inviteToken && (
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">I am registering as a *</label>
                  <select
                    value={role}
                    onChange={handleRoleChange}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="participant">Student / Attendee</option>
                    <option value="organizer">University Event Organizer (Professor / Faculty Coordinator)</option>
                    <option value="judge">Competition Judge / Jury Evaluator</option>
                    <option value="admin">🛡️ Platform Administrator (Show Admin Credentials)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="University / College *"
                    type="text"
                    icon={GraduationCap}
                    placeholder="e.g. VIT Vellore, IIT Madras"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    required
                  />
                  <Input
                    label="Department / Program"
                    type="text"
                    icon={Building}
                    placeholder="e.g. Computer Science & Engg"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
              </>
            )}

            <Input
              label="Email Address *"
              type="email"
              icon={Mail}
              placeholder="e.g. yourname@university.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              readOnly={!!inviteToken}
            />

            <Input
              label={inviteToken ? "Create Evaluator Password *" : "Password *"}
              type="password"
              icon={Lock}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-semibold py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 ${
                isAdminSelected
                  ? 'bg-rose-600 hover:bg-rose-500'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              }`}
            >
              <span>
                {loading
                  ? 'Processing...'
                  : inviteToken
                  ? 'Activate & Start Evaluating'
                  : isAdminSelected
                  ? 'Sign In as Platform Administrator'
                  : isRegistering
                  ? 'Sign Up & Create Account'
                  : 'Sign In to Portal'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Footer toggle & Admin quick jump */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center gap-2 text-xs text-slate-500">
            {isRegistering ? (
              <p>
                Already registered previously?{' '}
                <button
                  type="button"
                  onClick={handleSelectSignIn}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Sign In here
                </button>
              </p>
            ) : (
              <p>
                First time here?{' '}
                <button
                  type="button"
                  onClick={handleSelectSignUp}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Create your account first
                </button>
              </p>
            )}

            {!isAdminSelected && !inviteToken && (
              <button
                type="button"
                onClick={handleSelectAdmin}
                className="mt-1 text-[11px] text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer font-medium"
              >
                <KeyRound className="w-3.5 h-3.5 text-rose-500" />
                <span>Single Administrator? Click to show Admin credentials</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          EventSphere Multi-University Network • Single administrative governance
        </p>
      </div>
    </div>
  )
}
