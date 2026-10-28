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
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showGoogleModal, setShowGoogleModal] = useState(false)
  const [customGoogleEmail, setCustomGoogleEmail] = useState('')
  const [customGoogleName, setCustomGoogleName] = useState('')
  
  const { login, register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleGoogleSignIn = () => {
    setError('')
    setShowGoogleModal(true)
  }

  const handleGoogleAuthSubmit = async (selectedEmail, selectedName) => {
    const targetEmail = (selectedEmail || customGoogleEmail).trim().toLowerCase()
    const targetName = (selectedName || customGoogleName).trim() || targetEmail.split('@')[0]
    
    if (!targetEmail || !targetEmail.includes('@')) {
      setError('Please provide a valid Google email address.')
      return
    }

    setGoogleLoading(true)
    setError('')
    try {
      await loginWithGoogle({
        email: targetEmail,
        full_name: targetName,
        role: role || 'participant',
        college_name: collegeName.trim() || 'Partner University',
        department: department.trim() || 'General',
      })
      setShowGoogleModal(false)
      navigate('/events')
    } catch (err) {
      setError(err.response?.data?.detail || 'Google authentication failed. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  }

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

          {/* Google Sign-In Divider & Button */}
          {!isAdminSelected && !inviteToken && (
            <div className="mt-4">
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400 font-medium">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm transition-all hover:shadow cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{googleLoading ? 'Connecting to Google...' : 'Sign in with Google'}</span>
              </button>
            </div>
          )}

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

        {/* Google Authentication Dialog */}
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span className="font-bold text-sm text-slate-800">Sign in with Google</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                Select your student account or enter your Google email:
              </p>

              {/* Quick Preset Accounts */}
              <div className="space-y-2 mb-4">
                <button
                  type="button"
                  onClick={() => handleGoogleAuthSubmit('vankireddis2023@vitstudent.ac.in', 'Yojasree Vankireddi')}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    Y
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">Yojasree Vankireddi</p>
                    <p className="text-[11px] text-slate-500 truncate">vankireddis2023@vitstudent.ac.in</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleGoogleAuthSubmit('sri.varshini2023@vitstudent.ac.in', 'Varshini Somineni')}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    V
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">Varshini Somineni</p>
                    <p className="text-[11px] text-slate-500 truncate">sri.varshini2023@vitstudent.ac.in</p>
                  </div>
                </button>
              </div>

              {/* Or enter any other Google email */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[11px] text-slate-400 mb-2 font-medium">Or enter another Google account:</p>
                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder="name@gmail.com / college email"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Your Name (optional)"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleGoogleAuthSubmit()}
                    disabled={googleLoading || !customGoogleEmail}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {googleLoading ? 'Signing in...' : 'Continue with Google Account'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
