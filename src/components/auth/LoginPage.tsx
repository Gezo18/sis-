import React, { useState } from 'react';
import { userStore } from '../../data/userStore';
import { UserAccount } from '../../types';
import { SutLogo } from '../common/SutLogo';
import { 
  Mail, Lock, User, GraduationCap, Eye, EyeOff, 
  CheckCircle2, AlertCircle, ArrowRight, Globe, Database
} from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

interface Props {
  onLoginSuccess: (user: UserAccount) => void;
  onBrowsePublicSite: () => void;
  onOpenDatabaseConfig?: () => void;
}

export const LoginPage: React.FC<Props> = ({ 
  onLoginSuccess, 
  onBrowsePublicSite,
  onOpenDatabaseConfig,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const isDbConnected = isSupabaseConfigured();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sign In fields - blank by default
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up fields - blank by default
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [program, setProgram] = useState('Computer Science Technology Program');
  const [level, setLevel] = useState('Level 1');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedInput = loginEmail.trim();
    if (!trimmedInput) {
      setError('Please enter your University Email or Student ID.');
      return;
    }

    const result = userStore.authenticate(trimmedInput, loginPassword.trim());
    if (!result.success || !result.user) {
      setError(result.error || 'Failed to authenticate. Please check your credentials.');
      return;
    }

    setSuccessMsg(`Welcome back, ${result.user.name}!`);
    setTimeout(() => {
      onLoginSuccess(result.user!);
    }, 400);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const trimmedEmail = signupEmail.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!signupPassword || signupPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    const finalStudentId = studentId.trim() || ('25010' + Math.floor(1000 + Math.random() * 9000));

    const result = userStore.registerStudentAccount({
      name: fullName,
      email: trimmedEmail,
      password: signupPassword,
      studentId: finalStudentId,
      program: program,
      level: level,
    });

    if (!result.success || !result.user) {
      setError(result.error || 'Registration failed.');
      return;
    }

    setSuccessMsg(`Student account created successfully for ${result.user.name}!`);
    setTimeout(() => {
      onLoginSuccess(result.user!);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#f3f5f8] flex flex-col justify-between font-sans text-gray-800">
      {/* Top University Brand Bar */}
      <header className="bg-white border-b border-gray-200 shadow-2xs">
        <div className="bg-[#202738] text-gray-300 text-[11px] px-4 py-1.5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="font-medium text-white">Elsewedy University of Technology (SUT)</span>
            <span className="hidden sm:inline text-gray-500">•</span>
            <span className="hidden sm:inline">Polytechnic B.Tech Dual-Study Program</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBrowsePublicSite}
              className="text-cyan-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-medium"
            >
              <Globe className="w-3 h-3" />
              <span>Public Website</span>
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SutLogo className="h-12 sm:h-14" />
            <div className="border-l border-gray-300 pl-3 hidden sm:block">
              <h1 className="text-sm font-bold text-gray-900 leading-tight">
                Student Information System (SIS)
              </h1>
              <p className="text-xs text-gray-500">
                Unified Portal Authentication
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
                <span>{isDbConnected ? 'Supabase: Connected' : 'Connect Supabase'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onBrowsePublicSite}
              className="text-xs font-semibold text-[#0c4ca3] hover:text-[#093d84] flex items-center gap-1 py-1.5 px-3 rounded hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <span>Explore Campus & Courses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Card Header */}
          <div className="bg-linear-to-r from-[#202738] via-[#243048] to-[#125875] text-white p-5 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-2 border border-white/20">
              <GraduationCap className="w-6 h-6 text-cyan-300" />
            </div>
            <h2 className="text-base font-bold text-white tracking-wide">
              {tab === 'signin' ? 'Sign In to SUT SIS Portal' : 'Create Student Account'}
            </h2>
            <p className="text-xs text-cyan-200 mt-0.5">
              {tab === 'signin' 
                ? 'Enter your university or registered email address'
                : 'Register your official student profile'
              }
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setTab('signin');
                setError(null);
              }}
              className={`flex-1 py-3 text-center cursor-pointer transition-colors border-b-2 ${
                tab === 'signin'
                  ? 'border-[#0c4ca3] text-[#0c4ca3] bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setError(null);
              }}
              className={`flex-1 py-3 text-center cursor-pointer transition-colors border-b-2 ${
                tab === 'signup'
                  ? 'border-[#6fa324] text-[#6fa324] bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Register Account
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 text-xs space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{error}</span>
                </div>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}

            {/* TAB 1: SIGN IN */}
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    University Email or Student ID:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="e.g. 250103180 or ahmed@sut.edu.eg"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0c4ca3] focus:border-[#0c4ca3] text-xs bg-white"
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    Tip: You can enter your Student ID (e.g. 250103180) or university email.
                  </span>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-bold text-gray-700">Password:</label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="Enter password"
                      className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0c4ca3] focus:border-[#0c4ca3] text-xs bg-white"
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

                <button
                  type="submit"
                  className="w-full bg-[#0c4ca3] hover:bg-[#093d84] text-white py-2.5 rounded-md font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs mt-2"
                >
                  <span>Log In to Elsewedy SIS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>Don't have an account yet?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setTab('signup');
                        setError(null);
                      }}
                      className="text-[#6fa324] hover:underline font-bold cursor-pointer"
                    >
                      Create Student Account →
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: SIGN UP */}
            {tab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3.5">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Student Full Name:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Enter your full name"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#6fa324] focus:border-[#6fa324] text-xs bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Email Address:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="e.g. name@gmail.com or name@sut.edu.eg"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#6fa324] focus:border-[#6fa324] text-xs bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Student ID:
                  </label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. Enter your student ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#6fa324] focus:border-[#6fa324] font-mono text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Create Password:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="At least 4 characters"
                      className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#6fa324] focus:border-[#6fa324] text-xs bg-white"
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

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Program:</label>
                    <select
                      value={program}
                      onChange={(e) => setProgram(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-xs bg-white"
                    >
                      <option value="Computer Science Technology Program">Computer Science Tech</option>
                      <option value="Electrical Engineering Technology Program">Electrical Engineering</option>
                      <option value="Mechatronics Technology Program">Mechatronics Tech</option>
                      <option value="Logistics & Supply Chain Technology">Logistics & Supply Chain</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Level:</label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-xs bg-white"
                    >
                      <option value="Level 1">Level 1 (Freshman)</option>
                      <option value="Level 2">Level 2 (Sophomore)</option>
                      <option value="Level 3">Level 3 (Junior)</option>
                      <option value="Level 4">Level 4 (Senior)</option>
                    </select>
                  </div>
                </div>

                <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded text-[11px] text-blue-900">
                  <p>Initial metrics are set clean: <strong>0.00 CGPA</strong>, <strong>0 Registered CH</strong>, <strong>0 Passed CH</strong>. Academic advisor will be appointed by your department.</p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#6fa324] hover:bg-[#5f8e1e] text-white py-2.5 rounded-md font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                >
                  <span>Register & Access SIS Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2 text-[11px] text-gray-500">
                  <span>Already registered? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('signin');
                      setError(null);
                    }}
                    className="text-[#0c4ca3] hover:underline font-bold cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-4 text-center text-[11px] text-gray-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 Elsewedy University of Technology (SUT). All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>Tenth of Ramadan City, Egypt</span>
            <span>•</span>
            <span>Hotline: <strong>19788</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
};
