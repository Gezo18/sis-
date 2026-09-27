import React, { useState } from 'react';
import { userStore } from '../../data/userStore';
import { UserAccount } from '../../types';
import { SutLogo } from '../common/SutLogo';
import { 
  Lock, User, GraduationCap, Eye, EyeOff, 
  CheckCircle2, AlertCircle, ArrowRight, Globe, Database,
  ShieldCheck, Award, Building2, UserPlus, BookOpen, Key
} from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

interface Props {
  onLoginSuccess: (user: UserAccount) => void;
  onSwitchToStudentLogin: () => void;
  onBrowsePublicSite: () => void;
  onOpenDatabaseConfig?: () => void;
}

export const TeacherLoginPage: React.FC<Props> = ({
  onLoginSuccess,
  onSwitchToStudentLogin,
  onBrowsePublicSite,
  onOpenDatabaseConfig,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const isDbConnected = isSupabaseConfigured();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sign In fields
  const [loginIdentifier, setLoginIdentifier] = useState('hend.fouad@sut.edu.eg');
  const [loginPassword, setLoginPassword] = useState('teacher123');

  // Sign Up fields for new teacher
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [staffId, setStaffId] = useState('');
  const [department, setDepartment] = useState('Computer Engineering & Artificial Intelligence');
  const [academicTitle, setAcademicTitle] = useState('Staff Member & Academic Advisor');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedInput = loginIdentifier.trim();
    if (!trimmedInput) {
      setError('Please enter your Staff University Email or Staff ID.');
      return;
    }

    try {
      const result = await userStore.authenticate(trimmedInput, loginPassword.trim());
      if (!result.success || !result.user) {
        setError(result.error || 'Failed to authenticate staff credentials.');
        return;
      }

      // Ensure the user role is teacher
      const loggedInUser: UserAccount = {
        ...result.user,
        role: 'teacher',
      };

      setSuccessMsg(`Welcome back, ${loggedInUser.name}! Logging into Staff SIS...`);
      setTimeout(() => {
        onLoginSuccess(loggedInUser);
      }, 450);
    } catch (err: any) {
      setError(err?.message || 'Authentication error.');
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please enter your full faculty name.');
      return;
    }

    const trimmedEmail = signupEmail.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid university email.');
      return;
    }

    if (!signupPassword || signupPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    const result = userStore.registerTeacherAccount({
      name: fullName,
      email: trimmedEmail,
      password: signupPassword,
      staffId: staffId.trim() || undefined,
      department: department,
      academicTitle: academicTitle,
    });

    if (!result.success || !result.user) {
      setError(result.error || 'Failed to register staff account.');
      return;
    }

    setSuccessMsg(`Faculty account created for ${result.user.name}! Logging in...`);
    setTimeout(() => {
      onLoginSuccess(result.user!);
    }, 500);
  };

  const handleQuickLogin = async (email: string, pass: string) => {
    setLoginIdentifier(email);
    setLoginPassword(pass);
    setError(null);
    try {
      const result = await userStore.authenticate(email, pass);
      if (result.success && result.user) {
        setSuccessMsg(`Authenticating ${result.user.name}...`);
        setTimeout(() => {
          onLoginSuccess({ ...result.user!, role: 'teacher' });
        }, 350);
      } else {
        setError(result.error || 'Authentication failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error.');
    }
  };

  return (
    <div className="min-h-screen bg-[#eaedf1] flex flex-col justify-between font-sans text-gray-800">
      {/* ── Top University Brand Bar ── */}
      <header className="bg-white border-b border-[#cfd6df] shadow-xs">
        <div className="bg-[#1e2530] text-gray-300 text-[11px] px-4 py-1.5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="font-bold text-white uppercase tracking-wider">
              Elsewedy University of Technology
            </span>
            <span className="hidden sm:inline text-gray-500">•</span>
            <span className="hidden sm:inline text-emerald-400 font-semibold">
              staffsis.sut.edu.eg • Staff SIS Portal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onSwitchToStudentLogin}
              className="text-cyan-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-medium"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student SIS Login</span>
            </button>
            <span className="text-gray-600">|</span>
            <button
              type="button"
              onClick={onBrowsePublicSite}
              className="text-gray-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
            >
              <Globe className="w-3 h-3" />
              <span>Campus Website</span>
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SutLogo className="h-11 sm:h-13" />
            <div className="border-l border-gray-300 pl-3 hidden sm:block">
              <h1 className="text-sm font-black text-[#1e2a38] uppercase tracking-tight">
                Staff Member SIS Portal
              </h1>
              <p className="text-[11px] text-[#6aa123] font-bold">
                Faculty & Academic Advising Authentication
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenDatabaseConfig && (
              <button
                type="button"
                onClick={onOpenDatabaseConfig}
                className={`text-xs font-semibold flex items-center gap-1.5 py-1.5 px-3 rounded border transition-colors cursor-pointer ${
                  isDbConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Database className={`w-3.5 h-3.5 ${isDbConnected ? 'text-emerald-600' : 'text-gray-500'}`} />
                <span>{isDbConnected ? 'Supabase: Active' : 'DB Setup'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onSwitchToStudentLogin}
              className="text-xs font-bold text-[#0c4ca3] hover:text-[#093d84] bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center gap-1.5 py-1.5 px-3 rounded transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Student Portal →</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Teacher Login Card Area ── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md border border-[#c4cedb] overflow-hidden">
          
          {/* Card Header matching authentic Staff Portal theme */}
          <div className="bg-[#242c3b] text-white p-5 text-center border-b border-[#1c222e]">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#d99b26]/20 mb-2 border border-[#d99b26]/50">
              <ShieldCheck className="w-6 h-6 text-[#dfcaa0]" />
            </div>
            <h2 className="text-base font-bold text-white tracking-wide">
              {tab === 'signin' ? 'Staff Member SIS Authentication' : 'Register Faculty Account'}
            </h2>
            <p className="text-[11px] text-gray-300 mt-0.5">
              {tab === 'signin' 
                ? 'Authorized Academic Staff & Advisors Only'
                : 'Create an academic faculty / advisor profile'
              }
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-gray-200 bg-[#f8fafc] text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setTab('signin');
                setError(null);
              }}
              className={`flex-1 py-3 text-center cursor-pointer transition-colors border-b-2 ${
                tab === 'signin'
                  ? 'border-[#d99b26] text-[#b88017] bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Staff Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setError(null);
              }}
              className={`flex-1 py-3 text-center cursor-pointer transition-colors border-b-2 ${
                tab === 'signup'
                  ? 'border-[#6aa123] text-[#55821c] bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Register New Faculty
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 text-xs space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{error}</span>
                </div>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}

            {/* TAB 1: STAFF SIGN IN */}
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Staff University Email or Staff ID:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => {
                        setLoginIdentifier(e.target.value);
                        setError(null);
                      }}
                      placeholder="e.g. hend.fouad@sut.edu.eg or 100248"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:border-[#d99b26] focus:ring-1 focus:ring-[#d99b26] outline-none text-xs bg-white text-gray-900 font-medium"
                    />
                  </div>
                  <p className="text-[10.5px] text-gray-500 mt-1">
                    Enter your official faculty address or 6-digit staff number.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-gray-700">Staff Password:</label>
                    <button
                      type="button"
                      onClick={() => alert('Please contact SUT IT Services at it.support@sut.edu.eg to reset faculty credentials.')}
                      className="text-[10px] text-[#0c4ca3] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="Enter staff security password"
                      className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded focus:border-[#d99b26] focus:ring-1 focus:ring-[#d99b26] outline-none text-xs bg-white text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-600 text-[11px]">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-[#d99b26]" />
                    <span>Remember terminal session</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#d99b26] hover:bg-[#c2871b] text-white font-bold py-2.5 px-4 rounded text-xs transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Access Staff SIS Portal</span>
                </button>
              </form>
            )}

            {/* TAB 2: REGISTER FACULTY */}
            {tab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Full Faculty Name & Title:</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Hend Adel Ahmed Fouad"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">University Email:</label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="e.g. hend.fouad@sut.edu.eg"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Staff ID (Optional):</label>
                    <input
                      type="text"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      placeholder="e.g. 100248"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Academic Role:</label>
                    <select
                      value={academicTitle}
                      onChange={(e) => setAcademicTitle(e.target.value)}
                      className="w-full px-2.5 py-2 border border-gray-300 rounded text-xs bg-white"
                    >
                      <option value="Staff Member & Academic Advisor">Staff Member</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Lecturer & Lab Instructor">Lecturer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Department:</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-2.5 py-2 border border-gray-300 rounded text-xs bg-white"
                  >
                    <option value="Computer Engineering & Artificial Intelligence">Computer Engineering & AI</option>
                    <option value="Engineering Technology">Engineering Technology</option>
                    <option value="Electronics & Electrical Engineering">Electronics & Electrical</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Password:</label>
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Choose secure faculty password"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#6aa123] hover:bg-[#5b8c1c] text-white font-bold py-2.5 px-4 rounded text-xs transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2 mt-2"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register & Open Staff SIS</span>
                </button>
              </form>
            )}

            {/* Faculty Accounts */}
            <div className="pt-4 border-t border-gray-200">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">
                Faculty Sign-In Credentials
              </div>
              <div className="space-y-2">
                {userStore.getUsers().filter(u => u.role === 'teacher').map(teacher => (
                  <button
                    key={teacher.id}
                    type="button"
                    onClick={() => handleQuickLogin(teacher.email, teacher.password || 'teacher123')}
                    className="w-full p-2.5 bg-[#f8fafc] hover:bg-amber-50/70 border border-[#d99b26]/40 rounded text-left transition-colors cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-bold text-gray-900 group-hover:text-[#b88017]">
                        {teacher.name}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        Staff ID: {teacher.teacherProfile?.staffId || 'Staff'} • {teacher.email}
                      </div>
                    </div>
                    <span className="text-[10px] bg-[#dfcaa0] text-gray-900 px-2 py-0.5 rounded font-bold">
                      Sign In →
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Footer note */}
          <div className="bg-[#f8fafc] p-3 text-center border-t border-gray-200 text-[10.5px] text-gray-500">
            For academic credentials support, contact <strong className="text-gray-700">it.support@sut.edu.eg</strong>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-200 py-3 text-center text-xs text-gray-500">
        <div>© Copyright 2026. <strong className="text-gray-700">Elsewedy University of Technology (SUT)</strong>. All Rights Reserved.</div>
        <div className="text-[10px] text-gray-400 mt-0.5">Powered by Informatique Education Staff Information System</div>
      </footer>
    </div>
  );
};
