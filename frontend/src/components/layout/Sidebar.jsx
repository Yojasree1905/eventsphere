import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  CheckCircle2,
  Clock,
  Users,
  Activity,
  LogOut,
  LogIn,
  Sparkles,
  Trophy,
  Award,
  CheckSquare,
  QrCode,
  Shield,
  Compass,
  GraduationCap,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export function Sidebar() {
  const { user, logout } = useAuth()
  const role = (user?.role || '').toLowerCase()
  const isAdmin = role === 'admin' || user?.is_superadmin
  const isOrganizer = role === 'organizer' && !isAdmin
  const isJudge = role === 'judge' && !isAdmin
  const isStudent = (role === 'participant' || (!isAdmin && !isOrganizer && !isJudge)) && !!user
  const isGuest = !user

  // Home route based on role
  const homeRoute = isAdmin ? '/' : isJudge ? '/evaluations' : '/events'

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 text-slate-300 z-30 select-none">
      {/* Brand Header */}
      <Link
        to={homeRoute}
        className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80 bg-slate-950/40 hover:bg-slate-950/60 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-white text-lg tracking-tight">EventSphere</span>
          <span className="text-[10px] block uppercase tracking-wider text-blue-400 font-medium">Multi-University</span>
        </div>
      </Link>

      {/* Role Context Banner */}
      <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800/60 flex items-center justify-between text-xs">
        <span className="text-slate-400 text-[11px] font-medium">Active Workspace</span>
        {isAdmin && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Global Admin
          </span>
        )}
        {isOrganizer && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Organizer
          </span>
        )}
        {isJudge && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Judge / Jury
          </span>
        )}
        {isStudent && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Student
          </span>
        )}
        {isGuest && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-500/20 text-slate-300 border border-slate-500/30">
            Public Guest
          </span>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">

        {/* ============================================================== */}
        {/* 1. GLOBAL ADMINISTRATOR WORKSPACE                              */}
        {/* ============================================================== */}
        {isAdmin && (
          <>
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-rose-400 uppercase flex justify-between items-center">
                <span>Admin Console</span>
                <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono">ADMIN</span>
              </div>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Admin Dashboard</span>
              </NavLink>

              <NavLink
                to="/approvals"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Event Approvals Queue</span>
              </NavLink>

              <NavLink
                to="/monitoring"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Activity className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Monitoring & Telemetry</span>
              </NavLink>

              <NavLink
                to="/universities"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <GraduationCap className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>Partner Universities</span>
              </NavLink>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-800/60">
              <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Platform Oversight
              </div>

              <NavLink
                to="/events"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <CalendarDays className="w-4 h-4 shrink-0" />
                <span>All University Events</span>
              </NavLink>

              <NavLink
                to="/participants"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Participant Directory</span>
              </NavLink>

              <NavLink
                to="/leaderboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Trophy className="w-4 h-4 shrink-0 text-yellow-400" />
                <span>Platform Leaderboard</span>
              </NavLink>

              <NavLink
                to="/verify"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Shield className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Verify Certificates</span>
              </NavLink>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* 2. UNIVERSITY EVENT ORGANIZER WORKSPACE                        */}
        {/* ============================================================== */}
        {isOrganizer && (
          <>
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-blue-400 uppercase flex justify-between items-center">
                <span>Organizer Hub</span>
                <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">ORGANIZER</span>
              </div>

              <NavLink
                to="/events"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <CalendarDays className="w-4 h-4 shrink-0" />
                <span>Create & Manage Events</span>
              </NavLink>

              <NavLink
                to="/schedules"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span>Manage Schedules</span>
              </NavLink>

              <NavLink
                to="/participants"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Manage Registrations</span>
              </NavLink>

              <NavLink
                to="/attendance"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <QrCode className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Generate Attendance QR</span>
              </NavLink>

              <NavLink
                to="/certificates"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Award className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Mint Certificates</span>
              </NavLink>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-800/60">
              <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Community & Benchmarks
              </div>

              <NavLink
                to="/leaderboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Trophy className="w-4 h-4 shrink-0 text-yellow-400" />
                <span>Event Leaderboard</span>
              </NavLink>

              <NavLink
                to="/universities"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <GraduationCap className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>Partner Universities</span>
              </NavLink>

              <NavLink
                to="/verify"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Shield className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Verify Certificates</span>
              </NavLink>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* 3. JUDGE & JURY WORKSPACE                                      */}
        {/* ============================================================== */}
        {isJudge && (
          <>
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-amber-400 uppercase flex justify-between items-center">
                <span>Jury Portal</span>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">JUDGE</span>
              </div>

              <NavLink
                to="/evaluations"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-sm shadow-amber-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <CheckSquare className="w-4 h-4 shrink-0" />
                <span>Grade Candidates (Rubrics)</span>
              </NavLink>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-800/60">
              <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Explore & Results
              </div>

              <NavLink
                to="/events"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <CalendarDays className="w-4 h-4 shrink-0" />
                <span>Browse All Events</span>
              </NavLink>

              <NavLink
                to="/leaderboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Trophy className="w-4 h-4 shrink-0 text-yellow-400" />
                <span>Competition Leaderboard</span>
              </NavLink>

              <NavLink
                to="/verify"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Shield className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Verify Certificates</span>
              </NavLink>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* 4. STUDENT & PARTICIPANT WORKSPACE                             */}
        {/* ============================================================== */}
        {isStudent && (
          <>
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-purple-400 uppercase flex justify-between items-center">
                <span>Student Portal</span>
                <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono">STUDENT</span>
              </div>

              <NavLink
                to="/events"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <CalendarDays className="w-4 h-4 shrink-0" />
                <span>Browse All Events</span>
              </NavLink>

              <NavLink
                to="/teams"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Shield className="w-4 h-4 shrink-0" />
                <span>Squads & Teams</span>
              </NavLink>

              <NavLink
                to="/attendance"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <QrCode className="w-4 h-4 shrink-0" />
                <span>Mark Attendance (QR)</span>
              </NavLink>

              <NavLink
                to="/leaderboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Trophy className="w-4 h-4 shrink-0 text-yellow-400" />
                <span>Leaderboard & Podium</span>
              </NavLink>

              <NavLink
                to="/recommendations"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Compass className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>AI Recommendations</span>
              </NavLink>

              <NavLink
                to="/portfolio"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Award className="w-4 h-4 shrink-0 text-amber-400" />
                <span>My Portfolio & Badges</span>
              </NavLink>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-800/60">
              <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Explore
              </div>

              <NavLink
                to="/universities"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <GraduationCap className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Participating Universities</span>
              </NavLink>

              <NavLink
                to="/verify"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Shield className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Verify Any Certificate</span>
              </NavLink>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* 5. PUBLIC GUEST (NOT LOGGED IN)                                */}
        {/* ============================================================== */}
        {isGuest && (
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase flex justify-between items-center">
              <span>Explore EventSphere</span>
              <span className="text-[9px] bg-slate-500/20 text-slate-300 px-1.5 py-0.5 rounded font-mono">PUBLIC</span>
            </div>

            <NavLink
              to="/events"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <CalendarDays className="w-4 h-4 shrink-0" />
              <span>Browse All Events</span>
            </NavLink>

            <NavLink
              to="/universities"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <GraduationCap className="w-4 h-4 shrink-0 text-blue-400" />
              <span>Participating Universities</span>
            </NavLink>

            <NavLink
              to="/leaderboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Trophy className="w-4 h-4 shrink-0 text-yellow-400" />
              <span>Leaderboard & Standings</span>
            </NavLink>

            <NavLink
              to="/verify"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Shield className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Verify Any Certificate</span>
            </NavLink>
          </div>
        )}

      </div>

      {/* Footer Profile or Sign In Card */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        {user ? (
          <div>
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                isAdmin
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : isOrganizer
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : isJudge
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              }`}>
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-white truncate">{user?.full_name || 'User'}</p>
                </div>
                <p className="text-xs text-slate-400 truncate">{user?.college_name || 'University'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In / Sign Up</span>
          </Link>
        )}
      </div>
    </aside>
  )
}
