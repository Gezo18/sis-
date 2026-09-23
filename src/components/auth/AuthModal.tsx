import React, { useState } from 'react';
import { userStore } from '../../data/userStore';
import { UserAccount } from '../../types';
import { SutLogo } from '../common/SutLogo';
import { Mail, Lock, User, GraduationCap, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, BookOpen } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, onLoginSuccess, initialMode = 'signin' }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up state
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [program, setProgram] = useState('Computer Science Technology Program');
  const [level, setLevel] = useState('Level 1');

  if (!isOpen) return null;

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
      onClose();
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
    if (!trimmedEmail) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      setError('Please provide a valid email format (e.g. name@gmail.com).');
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

    setSuccessMsg(`Account created successfully for ${result.user.name}!`);
    setTimeout(() => {
      onLoginSuccess(result.user!);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-[#202738] via-[#243048] to-[#125875] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-md shadow-xs">
              <SutLogo className="h-9" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Elsewedy University of Technology
              </h2>
              <p className="text-[11px] text-cyan-200">
                Polytechnic SIS Unified Portal & Account Manager
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-300 hover:text-white text-lg font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`flex-1 py-3 text-center cursor-pointer transition-colors border-b-2 ${
              mode === 'signin'
                ? 'border-[#0c4ca3] text-[#0c4ca3] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Sign In with Gmail
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-3 text-center cursor-pointer transition-colors border-b-2 ${
              mode === 'signup'
                ? 'border-[#6fa324] text-[#6fa324] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Create New Student Account
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
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
          {mode === 'signin' && (
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
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0c4ca3] focus:border-[#0c4ca3] text-xs"
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
                    className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0c4ca3] focus:border-[#0c4ca3] text-xs"
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
                className="w-full bg-[#0c4ca3] hover:bg-[#093d84] text-white py-2.5 rounded-md font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
              >
                <span>Log In to Elsewedy SIS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: SIGN UP / CREATE NEW ACCOUNT */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg text-emerald-900 text-[11px] leading-relaxed">
                <p className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Academic Directory Enrollment
                </p>
                <p className="mt-0.5 text-emerald-800">
                  Registering creates a live student record. Teachers and your appointed academic advisor can review and edit your grades, CGPA, attendance, and request approvals.
                </p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Full Student Name:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Youssef Karim Mansour"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#6fa324] text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Gmail Address:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#6fa324] text-xs"
                  />
                </div>
                {signupEmail && !signupEmail.includes('@') && (
                  <button
                    type="button"
                    onClick={() => setSignupEmail(signupEmail + '@gmail.com')}
                    className="text-[11px] text-[#0c4ca3] hover:underline mt-1 font-semibold cursor-pointer"
                  >
                    + Append @gmail.com
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Password:</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Min. 4 characters"
                      className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#6fa324] text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Student University ID:</label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full py-2 px-3 border border-gray-300 rounded-md font-mono font-bold text-xs bg-gray-50 text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Enrolled Program:</label>
                <select
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-xs font-medium text-gray-800"
                >
                  <option value="Computer Science Technology Program">Computer Science Technology Program</option>
                  <option value="Network & Cybersecurity Technology">Network & Cybersecurity Technology</option>
                  <option value="Engineering Technology & Automation">Engineering Technology & Automation</option>
                  <option value="Electrical Engineering Technology">Electrical Engineering Technology</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Academic Standing / Level:</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Level 1', 'Level 2', 'Level 3', 'Level 4'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLevel(lvl)}
                      className={`py-1.5 rounded text-xs font-semibold cursor-pointer border text-center transition-colors ${
                        level === lvl
                          ? 'bg-[#6fa324] text-white border-[#6fa324]'
                          : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#6fa324] hover:bg-[#5f8e1e] text-white py-2.5 rounded-md font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs mt-2"
              >
                <span>Create Student Account & Enter SIS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
